# PH21-BUCKET-v1 — Baseline-preserving bucket configuration

Status: APPROVED — explicit Tejas reply, 2026-10-10 IST.

Baseline-only allocation edits are effective at confirmed rollover; name edits apply immediately, and floor edits apply immediately only when they fit the existing baseline and current remaining allowance. Custom buckets start with zero active allowance until rollover. This preserves current STS and accepted recovery trims.

Scope: PH-21 / PRD §28 surface behavior and the named setup/edit/reference ambiguity only. Frozen sources remain unchanged. Card-funded goal execution and insufficient-funding semantics remain OPEN; this amendment does not authorize remote SQL or deployment.
