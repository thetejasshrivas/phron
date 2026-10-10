import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { parseCardRecords } from '@/contracts/card';
import { errorHttpStatus, errorResult, type ErrorCode } from '@/contracts/snapshot';
import { requestClient } from '@/lib/supabase/request';
import { sameOriginMutation, trustedOrigin } from '@/server/auth/policy';
import { classifyExtraction, explicitPaymentMethod, parseRupeesToPaise, type ExtractionCategory, type ExtractedTransaction } from '@/server/finance/extraction';
import { sanitizeCaptureText } from '@/server/finance/ingestion-input';
import { extractWithFallback } from '@/server/finance/providers';
import { parseFinanceResult } from '@/server/finance/parse';

export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 16_384;
const DISCLOSURE = 'If no saved merchant rule matches, PHRON may send this sanitized transaction text to Gemini and, if needed, Groq. Gemini free-tier prompts and responses may be used to improve Google products, reviewed by humans, and retained for abuse monitoring for up to 55 days. Groq does not retain inference data by default, but may retain reliability or abuse-monitoring logs for up to 30 days unless an eligible account-level Zero Data Retention control is enabled. Do not enter confidential information.';
type Input = { text: string; operationId: string; disclosureAccepted: boolean };
const uuidV4 = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const privateHeaders = { 'cache-control': 'private, no-store, max-age=0', pragma: 'no-cache', expires: '0', vary: 'Cookie' };
function reply(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: privateHeaders }); }
function failure(code: ErrorCode) { return reply(errorResult(code), errorHttpStatus[code]); }
async function parseBody(request: NextRequest): Promise<Input> {
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json' || !request.body) throw new TypeError('VALIDATION');
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new TypeError('VALIDATION'); } chunks.push(part.value); } }
  finally { reader.releaseLock(); }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('VALIDATION');
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !['text', 'operationId', 'disclosureAccepted'].includes(key))
    || typeof body.text !== 'string' || typeof body.operationId !== 'string' || !uuidV4.test(body.operationId)
    || typeof body.disclosureAccepted !== 'boolean') throw new TypeError('VALIDATION');
  return { text: sanitizeCaptureText(body.text), operationId: body.operationId, disclosureAccepted: body.disclosureAccepted };
}
function normalized(value: string) { return value.normalize('NFKC').toLocaleLowerCase('en-IN').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function localAmount(text: string): string | null {
  const matches = [...text.matchAll(/(?:₹\s*|\brs\.?\s*|^\s*)([0-9]+(?:\.[0-9]{1,2})?)(?=\s|$|,)/giu)];
  if (matches.length !== 1 || !matches[0]?.[1]) return null;
  try { return parseRupeesToPaise(matches[0][1]); } catch { return null; }
}
function localMemoryMatch(text: string, rows: readonly { merchant_key: string; bucket_id: string }[]) {
  const candidates = rows.filter((row) => {
    const key = normalized(row.merchant_key);
    return key && new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegex(key).replace(/\s+/g, '\\s+')}(?:$|[^\\p{L}\\p{N}])`, 'iu').test(normalized(text));
  });
  if (candidates.length !== 1) return null;
  return { ...candidates[0]!, amount: localAmount(text) };
}
function dayOffset(date: string, days: number) {
  const day = new Date(`${date}T00:00:00.000Z`); day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}
function operationId(root: string, index: number) {
  const bytes = createHash('sha256').update(`${root}:${index}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
function bucketFor(category: ExtractionCategory, buckets: readonly { id: string; name: string }[]) {
  const prefix: Record<ExtractionCategory, string | null> = {
    'Groceries & Essentials': 'grocer', 'Dining Out & Social': 'dining', 'Shopping & Personal': 'shopping',
    'Transit & Commute': 'transit', 'Entertainment & Subscriptions': 'entertainment', 'Unallocated / Lent': null, Unknown: null,
  };
  const key = prefix[category];
  return key ? buckets.find((item) => normalized(item.name).startsWith(key))?.id ?? null : null;
}
function categoryForBucket(name: string): ExtractionCategory {
  const value = normalized(name);
  if (value.startsWith('grocer')) return 'Groceries & Essentials';
  if (value.startsWith('din')) return 'Dining Out & Social';
  if (value.startsWith('shop')) return 'Shopping & Personal';
  if (value.startsWith('transit')) return 'Transit & Commute';
  if (value.startsWith('entertain')) return 'Entertainment & Subscriptions';
  return 'Unknown';
}
async function readCurrent(client: ReturnType<typeof requestClient>['client']) {
  const [state, records] = await Promise.all([client.rpc('phron_current_state'), client.rpc('phron_card_records')]);
  if (state.error || records.error) throw new Error('STATE_UNAVAILABLE');
  const parsed = parseFinanceResult(state.data);
  if (!parsed.ok || !parsed.data) throw new Error('STATE_UNAVAILABLE');
  const cardRecords = parseCardRecords(records.data?.data);
  return { snapshot: parsed.data.snapshot, buckets: parsed.data.buckets, cycleStart: cardRecords.openedOn };
}

export async function POST(request: NextRequest) {
  let context: ReturnType<typeof requestClient> | undefined;
  try {
    const origin = trustedOrigin(process.env.PHRON_APP_ORIGIN);
    if (!sameOriginMutation(request.headers, origin)) return failure('FORBIDDEN');
    context = requestClient(request);
    const { data: auth, error: authError } = await context.client.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return context.finish(failure('UNAUTHENTICATED'));
    let input: Input;
    try { input = await parseBody(request); } catch { return context.finish(failure('VALIDATION')); }
    if (!input.text) return context.finish(failure('VALIDATION'));

    const current = await readCurrent(context.client);
    const memory = await context.client.from('merchant_memory').select('merchant_key,bucket_id');
    if (memory.error || !Array.isArray(memory.data)) return context.finish(reply({ kind: 'manual_fallback', reason: 'merchant_memory_unavailable', openManualEntry: true }));
    const match = localMemoryMatch(input.text, memory.data as { merchant_key: string; bucket_id: string }[]);
    let transactions: readonly ExtractedTransaction[]; let provider = 'local_memory';
    if (match) {
      if (!match.amount) return context.finish(reply({ kind: 'manual_fallback', reason: 'amount_unavailable', openManualEntry: true }));
      const bucket = current.buckets.find((item) => item.id === match.bucket_id);
      if (!bucket) return context.finish(reply({ kind: 'manual_fallback', reason: 'merchant_memory_unavailable', openManualEntry: true }));
      transactions = [{ amountPaise: match.amount, merchantOrPayee: match.merchant_key, candidateCategory: categoryForBucket(bucket.name), isEstimated: false, relativeDateOffsetDays: 0 }];
    } else {
      if (!input.disclosureAccepted) return context.finish(reply({ kind: 'disclosure_required', version: 'D08-v1', disclosure: DISCLOSURE }));
      const parsed = await extractWithFallback(input.text, {
        ...(process.env.GEMINI_API_KEY ? { geminiApiKey: process.env.GEMINI_API_KEY } : {}),
        ...(process.env.GROQ_API_KEY ? { groqApiKey: process.env.GROQ_API_KEY } : {}),
      });
      if (parsed.kind === 'manual_fallback') return context.finish(reply({ ...parsed, openManualEntry: true }));
      transactions = parsed.transactions; provider = parsed.provider;
    }

    const method = explicitPaymentMethod(input.text);
    const outcomes: Array<Record<string, unknown>> = [];
    let latestState = current;
    for (let index = 0; index < transactions.length; index += 1) {
      const item = transactions[index]!;
      const route = classifyExtraction({ merchantOrPayee: item.merchantOrPayee, candidateCategory: item.candidateCategory, isEstimated: item.isEstimated, localMemoryHit: !!match, sourceText: input.text });
      const bucketId = match?.bucket_id ?? bucketFor(item.candidateCategory, latestState.buckets);
      const date = dayOffset(latestState.snapshot.asOfDate, item.relativeDateOffsetDays);
      if (route.action === 'CLARIFY') { outcomes.push({ kind: 'clarification', confidence: route.confidence, transaction: item }); continue; }
      if (!bucketId) { outcomes.push({ kind: 'manual_fallback', reason: 'category_unavailable', openManualEntry: true, transaction: item }); continue; }
      if (!method) { outcomes.push({ kind: 'method_confirmation', transaction: item, confidence: route.confidence }); continue; }
      if (date < latestState.cycleStart || date > latestState.snapshot.asOfDate) { outcomes.push({ kind: 'manual_fallback', reason: 'date_outside_active_cycle', openManualEntry: true, transaction: item }); continue; }
      const opId = operationId(input.operationId, index);
      const payload = { action: method === 'card' ? 'create' : 'spend', amount: item.amountPaise, bucketId, transactionDate: date,
        merchantOrPayee: item.merchantOrPayee, paymentMethod: method, legacyObligationId: null, rawText: input.text,
        confidenceTier: route.confidence, isEstimated: item.isEstimated };
      const result = await context.client.rpc('phron_ingest_spend', { p_operation_id: opId, p_expected_revision: latestState.snapshot.revision, p_input: payload });
      if (result.error) { outcomes.push({ kind: 'manual_fallback', reason: 'save_unavailable', openManualEntry: true, transaction: item }); break; }
      const parsed = parseFinanceResult(result.data);
      if (!parsed.ok || !parsed.data) { outcomes.push({ kind: 'manual_fallback', reason: parsed.ok ? 'empty_result' : parsed.error.code.toLowerCase(), openManualEntry: true, transaction: item }); break; }
      latestState = await readCurrent(context.client);
      const savedMetadata = result.data as { categorySwapExpiresAt?: unknown };
      outcomes.push({ kind: 'committed', confidence: route.confidence, transactionId: parsed.data.transactionId, bucketId,
        categorySwapExpiresAt: route.action === 'COMMIT_WITH_SWAP' && typeof savedMetadata.categorySwapExpiresAt === 'string' ? savedMetadata.categorySwapExpiresAt : null,
        categorySwapAvailable: route.action === 'COMMIT_WITH_SWAP', snapshot: parsed.data.snapshot });
    }
    return context.finish(reply({ kind: 'routed', provider, outcomes, openManualEntry: outcomes.some((item) => item.kind === 'manual_fallback') }));
  } catch {
    return context ? context.finish(failure('UNAVAILABLE')) : failure('UNAVAILABLE');
  }
}
