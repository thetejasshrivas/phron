# All public user-owned table audit

Actual ordinary A/B/signed-out/anonymous-auth probes; each table populated for both users. Grant denial is not mislabeled a row-policy positive read. All writes denied42501. Current audit app6efdab1.

| Table | RLS | Ordinary SELECT | INSERT / UPDATE / DELETE | Guessed ownership | Purge |
| --- | --- | --- | --- | --- | --- |
| buckets | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| card_liability_payments | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| card_payment_allocations | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| cycle_buckets | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| cycle_obligations | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| financial_profiles | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| goal_purchases | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| goal_recovery_extensions | Enabled | Own rows only | Denied42501 | Denied | Populated→0 |
| goal_releases | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| goal_reservations | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| goals | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| merchant_memory | Enabled | Own rows only | Denied42501 | Denied | Populated→0 |
| next_cycle_commitments | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| obligation_cash_payments | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| obligation_payment_allocations | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| obligations | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| operation_log | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| pay_cycles | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| reconciliation_allocations | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| reconciliations | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| recovery_plans | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| transactions | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
| users | Enabled | RPC-only;42501 | Denied42501 | Denied | Populated→0 |
