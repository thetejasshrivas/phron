import { encodePaise, type Paise } from "@/contracts/money";

export type HomeState = "healthy" | "exhausted" | "distressed" | "empty" | "loading";
export type Vessel = { name: string; remaining: Paise; allowance: Paise; level: number; tone: string };
// Synthetic presentation fixtures. Levels and canonical money outputs are supplied,
// never calculated as financial permission in the UI.
const money = (value: bigint) => encodePaise(value);
export const buckets: Vessel[] = [
  { name: "Groceries", remaining: money(420000n), allowance: money(600000n), level: 70, tone: "sage" },
  { name: "Dining out", remaining: money(180000n), allowance: money(500000n), level: 36, tone: "ochre" },
  { name: "Shopping", remaining: money(320000n), allowance: money(400000n), level: 80, tone: "sage" },
  { name: "Transit", remaining: money(160000n), allowance: money(200000n), level: 80, tone: "sage" },
  { name: "Entertainment", remaining: money(90000n), allowance: money(200000n), level: 45, tone: "ochre" },
];
export const goals = [
  { name: "A little escape", description: "Goa · Flexible goal", held: money(1800000n), target: money(3000000n), level: 60, deadline: "15 Dec 2026", pace: "On track", mark: "GOA" },
  { name: "A new laptop", description: "Work essentials · Fixed goal", held: money(4200000n), target: money(7000000n), level: 60, deadline: "31 Jan 2027", pace: "On track", mark: "WORK" },
];
export const homeFixtures = {
  healthy: { health: "A", label: "Looking steady", title: "Make room for today.", daily: money(124000n), pool: money(1736000n), days: 14, coach: "Your essentials are covered. Keep a little room for the things you enjoy.", action: "See your perspective" },
  exhausted: { health: "B", label: "Budget exhausted", title: "A pause, not a setback.", daily: money(0n), pool: money(0n), days: 14, coach: "Your discretionary budget is used up. Your essentials are still covered. Review your options before the next spend.", action: "Review your budget" },
  distressed: { health: "C", label: "Essentials need attention", title: "First, the essentials.", daily: money(0n), pool: money(0n), days: 14, coach: "There is a gap in essential coverage. Let’s look at what is due before making another discretionary commitment.", action: "Review essentials" },
} as const;
export const capturedHealthy = { ...homeFixtures.healthy, daily: money(121000n), pool: money(1694000n) };
export const capturedBuckets = buckets.map((bucket) => bucket.name === "Dining out" ? { ...bucket, remaining: money(138000n), level: 27.6 } : bucket);
export const capturedGoals = goals.map((goal) => goal.name === "A little escape" ? { ...goal, held: money(1850000n), level: 61.6667 } : goal);

export { formatMoney } from '@/client/home-presentation';
