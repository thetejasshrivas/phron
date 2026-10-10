const MAX_PAISE = 9_223_372_036_854_775_807n;
const categories = [
  'Groceries & Essentials', 'Dining Out & Social', 'Shopping & Personal',
  'Transit & Commute', 'Entertainment & Subscriptions', 'Unallocated / Lent', 'Unknown',
] as const;
export type ExtractionCategory = typeof categories[number];
export interface ExtractedTransaction {
  readonly amountPaise: string;
  readonly merchantOrPayee: string;
  readonly candidateCategory: ExtractionCategory;
  readonly isEstimated: boolean;
  readonly relativeDateOffsetDays: number;
}
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type RouteAction = 'DIRECT_COMMIT' | 'COMMIT_WITH_SWAP' | 'CLARIFY';
const singleCategoryMerchants: Record<string, ExtractionCategory> = {
  netflix: 'Entertainment & Subscriptions', uber: 'Transit & Commute',
  zomato: 'Dining Out & Social', starbucks: 'Dining Out & Social',
  // Literal single-category context is deterministic, rather than an LLM's
  // confidence claim. Ambiguous platforms and personal transfers stay separate.
  clothes:'Shopping & Personal',kapde:'Shopping & Personal',shopping:'Shopping & Personal',
  lunch:'Dining Out & Social',dinner:'Dining Out & Social',chai:'Dining Out & Social',
  groceries:'Groceries & Essentials',kirana:'Groceries & Essentials',sabzi:'Groceries & Essentials',
  metro:'Transit & Commute',auto:'Transit & Commute',cab:'Transit & Commute',taxi:'Transit & Commute',petrol:'Transit & Commute',parking:'Transit & Commute',
  movie:'Entertainment & Subscriptions',bookmyshow:'Entertainment & Subscriptions',
};
const multiCategoryMerchants = new Set(['blinkit', 'amazon', 'zepto', 'instamart']);

function normalizedPhrase(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('en-IN').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** Match only a whole literal phrase from the caller's active custom buckets. */
export function matchNamedCustomBucket<T extends { readonly id: string; readonly name: string; readonly isCustom: boolean; readonly aliases?: readonly string[] }>(
  text: string,
  buckets: readonly T[],
): T | null {
  const normalizedText = ` ${normalizedPhrase(text)} `;
  const matches = buckets.filter((bucket) => {
    if (!bucket.isCustom) return false;
    return [bucket.name, ...(bucket.aliases ?? [])].some((candidate) => {
      const phrase = normalizedPhrase(candidate);
      if (!phrase) return false;
      return normalizedText.includes(` ${phrase} `);
    });
  });
  const unique = new Map(matches.map((bucket) => [bucket.id, bucket]));
  return unique.size === 1 ? [...unique.values()][0]! : null;
}

export function parseRupeesToPaise(value: unknown): string {
  if (typeof value !== 'string' || value.length > 24) throw new TypeError('VALIDATION');
  const match = /^(0|[1-9][0-9]*)(?:\.([0-9]{1,2}))?$/.exec(value);
  if (!match) throw new TypeError('VALIDATION');
  const whole = BigInt(match[1]!);
  const fractional = BigInt((match[2] ?? '').padEnd(2, '0') || '0');
  const paise = whole * 100n + fractional;
  if (paise < 1n || paise > MAX_PAISE) throw new TypeError('VALIDATION');
  return paise.toString();
}

function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('VALIDATION');
  const result = value as Record<string, unknown>;
  if (Object.keys(result).length !== keys.length || keys.some((key) => !Object.hasOwn(result, key))) throw new TypeError('VALIDATION');
  return result;
}

export function parseExtraction(json: string): readonly ExtractedTransaction[] {
  let parsed: unknown;
  try { parsed = JSON.parse(json); } catch { throw new TypeError('VALIDATION'); }
  const root = record(parsed, ['transactions']);
  if (!Array.isArray(root.transactions) || root.transactions.length < 1 || root.transactions.length > 10) throw new TypeError('VALIDATION');
  return Object.freeze(root.transactions.map((item): ExtractedTransaction => {
    const row = record(item, ['amount', 'merchant_or_payee', 'candidate_category', 'is_estimated', 'relative_date_offset_days']);
    if (typeof row.merchant_or_payee !== 'string' || !row.merchant_or_payee.trim() || Array.from(row.merchant_or_payee).length > 50
      || typeof row.candidate_category !== 'string' || !categories.includes(row.candidate_category as ExtractionCategory)
      || typeof row.is_estimated !== 'boolean' || !Number.isInteger(row.relative_date_offset_days)
      || (row.relative_date_offset_days as number) < -30 || (row.relative_date_offset_days as number) > 0) throw new TypeError('VALIDATION');
    return Object.freeze({
      amountPaise: parseRupeesToPaise(row.amount), merchantOrPayee: row.merchant_or_payee.trim(),
      candidateCategory: row.candidate_category as ExtractionCategory, isEstimated: row.is_estimated,
      relativeDateOffsetDays: row.relative_date_offset_days as number,
    });
  }));
}

export function classifyExtraction(input: {
  readonly merchantOrPayee: string;
  readonly candidateCategory: ExtractionCategory;
  readonly isEstimated: boolean;
  readonly localMemoryHit: boolean;
  readonly sourceText: string;
}): { readonly confidence: Confidence; readonly action: RouteAction } {
  const merchant = input.merchantOrPayee.toLocaleLowerCase('en-IN').replace(/[^\p{L}\p{N}]/gu, '');
  if (input.localMemoryHit) return { confidence: 'HIGH', action: 'DIRECT_COMMIT' };
  const knownMerchant = Object.hasOwn(singleCategoryMerchants, merchant) || multiCategoryMerchants.has(merchant);
  const namedTransfer = /^\s*(?:(?:sent|transfer(?:red)?|paid)\s+)?[A-Z][\p{L}]+(?:\s+[A-Z][\p{L}]+)?\s+(?:₹|rs\.?\s*)?\d/iu.test(input.sourceText);
  if (input.candidateCategory === 'Unknown' || input.candidateCategory === 'Unallocated / Lent'
    || /\b(sent|transfer(?:red)?|paid\s+(?:to|bhai|dost))\b/i.test(input.sourceText)
    || (!knownMerchant && namedTransfer) || !merchant) return { confidence: 'LOW', action: 'CLARIFY' };
  if (multiCategoryMerchants.has(merchant)) return { confidence: 'MEDIUM', action: 'COMMIT_WITH_SWAP' };
  if (singleCategoryMerchants[merchant] === input.candidateCategory) return { confidence: 'HIGH', action: 'DIRECT_COMMIT' };
  return { confidence: 'LOW', action: 'CLARIFY' };
}

export function explicitPaymentMethod(text: string): 'cash' | 'upi' | 'debit' | 'card' | null {
  if (/\bdebit\s+card\b/i.test(text)) return 'debit';
  if (/\b(?:credit\s+card|on\s+card|card\s+swipe|card)\b/i.test(text)) return 'card';
  if (/\bupi\b/i.test(text)) return 'upi';
  if (/\bcash\b/i.test(text)) return 'cash';
  return null;
}
