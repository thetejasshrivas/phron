import { NextRequest, NextResponse } from 'next/server';
import { financialDate } from '@/contracts/boundaries';
import { decodePaise } from '@/contracts/money';
import { errorHttpStatus, errorResult, type ErrorCode } from '@/contracts/snapshot';
import { requestClient } from '@/lib/supabase/request';
import { sameOriginMutation, trustedOrigin } from '@/server/auth/policy';
import { sanitizeCaptureText } from '@/server/finance/ingestion-input';
import { parseFinanceResult } from '@/server/finance/parse';

export const dynamic = 'force-dynamic';
const uuidV4 = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const methods = new Set(['cash', 'upi', 'debit', 'card']);
const privateHeaders = { 'cache-control': 'private, no-store, max-age=0', pragma: 'no-cache', expires: '0', vary: 'Cookie' };
function response(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: privateHeaders }); }
function failure(code: ErrorCode) { return response(errorResult(code), errorHttpStatus[code]); }
function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('VALIDATION');
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== keys.length || keys.some((key) => !Object.hasOwn(row, key))) throw new TypeError('VALIDATION');
  return row;
}
function parseBody(value: unknown) {
  const body = record(value, ['operationId', 'expectedVersion', 'input']);
  if (typeof body.operationId !== 'string' || !uuidV4.test(body.operationId)
    || typeof body.expectedVersion !== 'string' || !/^(0|[1-9][0-9]*)$/.test(body.expectedVersion) || body.expectedVersion.length > 19) throw new TypeError('VALIDATION');
  const input = record(body.input, ['amount', 'merchantOrPayee', 'bucketId', 'paymentMethod', 'transactionDate', 'rawText', 'isEstimated']);
  if (typeof input.amount !== 'string' || !/^[1-9][0-9]*$/.test(input.amount) || decodePaise(input.amount) < 1n
    || typeof input.merchantOrPayee !== 'string' || !input.merchantOrPayee.trim() || [...input.merchantOrPayee].length > 100
    || typeof input.bucketId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(input.bucketId)
    || typeof input.paymentMethod !== 'string' || !methods.has(input.paymentMethod)
    || typeof input.transactionDate !== 'string' || typeof input.rawText !== 'string' || typeof input.isEstimated !== 'boolean') throw new TypeError('VALIDATION');
  const rawText = sanitizeCaptureText(input.rawText);
  if (!rawText || [...rawText].length > 280) throw new TypeError('VALIDATION');
  return {
    operationId: body.operationId,
    expectedVersion: body.expectedVersion,
    input: {
      amount: input.amount, merchantOrPayee: input.merchantOrPayee.trim(), bucketId: input.bucketId,
      paymentMethod: input.paymentMethod, transactionDate: financialDate(input.transactionDate), rawText,
      isEstimated: input.isEstimated,
    },
  };
}

export async function POST(request: NextRequest) {
  let context: ReturnType<typeof requestClient> | undefined;
  try {
    const origin = trustedOrigin(process.env.PHRON_APP_ORIGIN);
    if (!sameOriginMutation(request.headers, origin)) return failure('FORBIDDEN');
    context = requestClient(request);
    const { data: auth, error: authError } = await context.client.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return context.finish(failure('UNAUTHENTICATED'));
    if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') return context.finish(failure('VALIDATION'));
    let input: ReturnType<typeof parseBody>;
    try { input = parseBody(await request.json()); } catch { return context.finish(failure('VALIDATION')); }
    const result = await context.client.rpc('phron_ingest_confirm_category', {
      p_operation_id: input.operationId, p_expected_revision: input.expectedVersion, p_input: input.input,
    });
    if (result.error) return context.finish(failure('UNAVAILABLE'));
    const parsed = parseFinanceResult(result.data);
    if (!parsed.ok || !parsed.data) return context.finish(response(parsed.ok ? errorResult('UNAVAILABLE') : parsed, parsed.ok ? 503 : errorHttpStatus[parsed.error.code]));
    return context.finish(response(parsed));
  } catch {
    return context ? context.finish(failure('UNAVAILABLE')) : failure('UNAVAILABLE');
  }
}
