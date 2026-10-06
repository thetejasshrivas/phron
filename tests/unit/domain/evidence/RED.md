# Actual RED observations — PH-10

2026-10-06, main starting f1b8c2d5325cecbe648e8de3cbe2842c6f7b2dd6. This is a concise record of observed tool output, not a fabricated raw log.

1. Wrote independent core/date fixtures before production files existed. Command: node node_modules/jest/bin/jest.js --config jest.domain.config.mjs --runInBand. FAIL:2 suites could not resolve src/domain/money and dates;0 tests executed. Implementation absent, not an assertion failure. No stubs or skipped tests introduced.
2. Boundary review added year0001/9999 date fixture before correction. Focused dates command FAIL:1 failed,28 passed; financialDateAt("0001-01-01T00:00:00.000Z") raised TypeError Expected financial date YYYY-MM-DD. Correction formats Intl date parts with four-digit year, independent of locale punctuation.
3. Added reserve-sum boundary fixture before correction. Focused core command FAIL:1 failed,47 passed; signed64 cash/unpaid each at maximum plus1 paise tracked reserve raised RangeError rather than classifying C. Correction retains unrestricted bigint intermediate comparison; each input remains checked. No stored or returned money boundary was relaxed.

Final GREEN command/result is captured in coverage.log. Property seed101001,500 runs each across8 properties; no randomized failure/shrink occurred. Existing assertions/config/thresholds remained unchanged.
