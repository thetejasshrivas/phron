# G4-CUSTOM-RECOVERY-01-v1 — Approved implementation decision

Tejas explicitly approved 2026-10-10:

Custom buckets are excluded from automatic donor trims. Standard donor order remains Entertainment & Subscriptions → Shopping & Personal → Dining Out & Social → Transit & Commute.

1. Custom buckets, Groceries & Essentials, and Fixed Obligations are protected from automatic recovery trims.
2. If standard trimmable capacity is exhausted down to floors, evaluate flexible goal extension or the next-cycle commitment cap per PRD §18.4 and §18.5.
3. Record this rule in DECISIONS as an implementation decision and update recovery RPCs/tests accordingly.

Custom buckets remain available for user spending; no custom donor priority is inferred. No remote migration is authorized.
