# D05-extension-v1

Status: APPROVED
Founder: explicit Tejas approval2026-10-08 IST.

## Exact approved wording

1. Overdue Pacing Clamp: While salary confirmation is pending past the expected date, N_days_remaining is clamped to 1; Daily STS evaluates as max(0, S_pool) treating remaining funds as a single-day buffer.
2. Active Cycle Extension: The active cycle remains open; spends and mutations continue within the current cycle until explicit salary confirmation.
3. Atomic Rollover on Confirmation: Explicit salary confirmation formally closes the cycle boundary, credits new cash, auto-deducts outstanding next-cycle commitments (C_next_cycle), and initializes Day 1 of the new cycle.

Only named clauses amended. Unpaid carry and signed-drift budget treatment require their own approvals. Frozen PRD unchanged.
