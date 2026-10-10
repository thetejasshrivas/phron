export type CoachFacts = {
  readonly overspendDeficitPaise: string;
  readonly weeklyCategoryTrims: readonly { readonly category: string; readonly amountPaise: string }[];
  readonly goalPaceStatus: 'ON_TRACK' | 'BEHIND' | 'COMPLETE' | 'NONE';
};

const FALLBACK = 'Your confirmed numbers are still here. Review the next available step when you are ready.';
const SAFE_CATEGORY = /^[\p{L}\p{N}][\p{L}\p{N} &'-]{0,39}$/u;
const prohibited = /\b(?:reckless|failed|irresponsible|danger|punishment|ruined|stock|stocks|mutual\s+fund|investment|investing|crypto|credit\s+advice)\b|<|>/iu;

function paise(value: string): bigint | null {
  if (!/^(?:0|[1-9][0-9]*)$/.test(value)) return null;
  try { return BigInt(value); } catch { return null; }
}

function grouped(value: bigint): string {
  const digits = value.toString();
  if (digits.length <= 3) return digits;
  const tail = digits.slice(-3);
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${tail}`;
}

function formatPaise(value: bigint): string {
  return `₹${grouped(value / 100n)}.${(value % 100n).toString().padStart(2, '0')}`;
}

/** Local deterministic coach template. Inputs must be server-computed canonical deltas. */
export function generateCoachResponse(facts: CoachFacts): string {
  const deficit = paise(facts.overspendDeficitPaise);
  if (deficit === null) return FALLBACK;
  const trims = facts.weeklyCategoryTrims.map((item) => {
    const amount = paise(item.amountPaise);
    if (!amount || amount === 0n || !SAFE_CATEGORY.test(item.category)) return null;
    return `This week, trim ${item.category} by ${formatPaise(amount)} and check your plan.`;
  });
  if (trims.some((item) => item === null)) return FALLBACK;
  const parts: string[] = [];
  if (deficit > 0n) parts.push(`Setbacks happen. Your discretionary plan is ${formatPaise(deficit)} over.`);
  parts.push(...trims as string[]);
  if (facts.goalPaceStatus === 'BEHIND') parts.push('Your goal is behind its planned pace; review the next contribution when you are ready.');
  if (facts.goalPaceStatus === 'ON_TRACK') parts.push('Your goal is on its planned pace.');
  if (facts.goalPaceStatus === 'COMPLETE') parts.push('Your goal is complete.');
  if (!['ON_TRACK', 'BEHIND', 'COMPLETE', 'NONE'].includes(facts.goalPaceStatus)) return FALLBACK;
  return sanitizeCoachOutput(parts.join(' ') || 'Your confirmed plan is on track. Take the next step when you are ready.');
}

/** Returns plain text only; UI must still render it as a text node, never HTML. */
export function sanitizeCoachOutput(value: string): string {
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean || clean.length > 500 || prohibited.test(clean)) return FALLBACK;
  return clean;
}
