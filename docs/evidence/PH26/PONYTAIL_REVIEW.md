# Ponytail diff review — 2026-10-11 IST

Scope: recent PH25 audit harness (297e337) and PH26 surfaces.css/audit.mjs diff. Used engineering-suite-ponytail:entry-ponytail → engineering-suite-ponytail:ponytail-review. Complexity review only; security/correctness verified separately.

`tests/e2e/ph25/audit.mjs:L45: shrink: identical Home/non-Home ready assertions. One unconditional confirmed-records assertion after navigation.`

Applied to the test helper; no assertion removed, no mock substituted. Both pages still require confirmed records. Net:0physical lines (one duplicate conditional branch removed). No unnecessary runtime abstraction, dependency, money helper or dead UI introduced. Native scroll-margin/focus-within accomplishes the fix without listeners or geometry code in the product. The extra output and V3 flags share existing real fixtures/runtime instead of duplicating the harness. All tests, formulas, security boundaries, card rules and required motion preserved.

net: -0 lines possible.

Final orchestration helper review: existing suite code is reused, not forked into a new testing framework; temporary siblings relocate output only and are removed in finally. The only selector supports the executed payment report-path rerun. No test or assertion removed.
