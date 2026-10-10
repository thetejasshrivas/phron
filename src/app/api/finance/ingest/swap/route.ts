import { NextRequest, NextResponse } from 'next/server';
import { errorHttpStatus, errorResult, type ErrorCode } from '@/contracts/snapshot';
import { requestClient } from '@/lib/supabase/request';
import { sameOriginMutation, trustedOrigin } from '@/server/auth/policy';
import { parseFinanceResult } from '@/server/finance/parse';

export const dynamic = 'force-dynamic';
const uuid = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
function response(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { 'cache-control': 'private, no-store, max-age=0', pragma: 'no-cache', expires: '0', vary: 'Cookie' } }); }
function failure(code: ErrorCode) { return response(errorResult(code), errorHttpStatus[code]); }

export async function POST(request: NextRequest) {
  let context: ReturnType<typeof requestClient> | undefined;
  try {
    const origin = trustedOrigin(process.env.PHRON_APP_ORIGIN);
    if (!sameOriginMutation(request.headers, origin)) return failure('FORBIDDEN');
    context = requestClient(request);
    const { data: auth, error: authError } = await context.client.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return context.finish(failure('UNAUTHENTICATED'));
    if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') return context.finish(failure('VALIDATION'));
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return context.finish(failure('VALIDATION'));
    const value = body as Record<string, unknown>;
    if (Object.keys(value).length !== 4 || !Object.hasOwn(value, 'operationId') || !Object.hasOwn(value, 'expectedVersion')
      || !Object.hasOwn(value, 'transactionId') || !Object.hasOwn(value, 'bucketId')
      || typeof value.operationId !== 'string' || !uuid.test(value.operationId) || typeof value.transactionId !== 'string' || !uuid.test(value.transactionId)
      || typeof value.bucketId !== 'string' || !uuid.test(value.bucketId) || typeof value.expectedVersion !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value.expectedVersion)) return context.finish(failure('VALIDATION'));
    const result = await context.client.rpc('phron_ingest_category_swap', {
      p_operation_id: value.operationId, p_expected_revision: value.expectedVersion,
      p_input: { transactionId: value.transactionId, bucketId: value.bucketId },
    });
    if (result.error) return context.finish(failure('UNAVAILABLE'));
    const parsed = parseFinanceResult(result.data);
    if (!parsed.ok || !parsed.data) return context.finish(response(parsed.ok ? errorResult('UNAVAILABLE') : parsed, parsed.ok ? 503 : errorHttpStatus[parsed.error.code]));
    return context.finish(response(parsed));
  } catch {
    return context ? context.finish(failure('UNAVAILABLE')) : failure('UNAVAILABLE');
  }
}
