# PH-23 executed scenario matrix

Tested main e305ea4f94556298c61c3d53cf5d13f13ce475c9; all rows use real local persistent Supabase/Auth and independent exact paise assertions.

| Scenario | 375px | 1280px | Executed journey / limitation |
| --- | --- | --- | --- |
| 1 | PASS (6509ms) | PASS (4379ms) | Healthy day3 capture; evidence journeys.json, journeys.json; screenshots S01-{375,1280}.png |
| 2 | BLOCKED_SOURCE_CONFLICT (3504ms) | BLOCKED_SOURCE_CONFLICT (3406ms) | Budget exhaustion distinct from negative cash; evidence journeys.json, journeys.json; screenshots S02-{375,1280}.png |
| 3 | PASS (2692ms) | PASS (2582ms) | Liquidity distress; evidence journeys.json, journeys.json; screenshots S03-{375,1280}.png |
| 4 | PASS (3216ms) | PASS (3336ms) | Structural distress permits onboarding; evidence journeys.json, journeys.json; screenshots S04-{375,1280}.png |
| 5 | PASS (2901ms) | PASS (2995ms) | Mid-cycle declared cash with14days; evidence journeys.json, journeys.json; screenshots S05-{375,1280}.png |
| 6 | PASS (2862ms) | PASS (3556ms) | One day before payday D05 correction; evidence journeys.json, journeys.json; screenshots S06-{375,1280}.png |
| 7 | PASS (4542ms) | PASS (3980ms) | Expected and overdue salary never auto-credit; evidence journeys.json, journeys.json; screenshots S07-{375,1280}.png |
| 8 | PASS (3553ms) | PASS (3283ms) | Actual65000 salary preserves60000 baseline; evidence journeys.json, journeys.json; screenshots S08-{375,1280}.png |
| 9 | PASS (3973ms) | PASS (3734ms) | D12 donor600/200 to floors State A — Lower-content interactions exercised after explicitly collapsing manual capture; original expanded-panel failures remain open.; evidence journeys.json, journeys.json; screenshots S09-{375,1280}.png |
| 10 | PASS (3430ms) | PASS (3242ms) | Fixed goal2500 proposal under6000 cap; evidence journeys.json, journeys.json; screenshots S10-{375,1280}.png |
| 11 | FAIL (5598ms) | FAIL (5884ms) | Accepted2500 commitment must be visible; evidence journeys.json, journeys.json; screenshots S11-{375,1280}.png |
| 12 | PASS (3744ms) | PASS (3603ms) | Carried4500 lock blocks new3000; evidence journeys.json, journeys.json; screenshots S12-{375,1280}.png |
| 13 | PASS (3397ms) | PASS (3374ms) | Positive18000 to20500 signed drift; evidence journeys.json, journeys.json; screenshots S13-{375,1280}.png |
| 14 | PASS (3800ms) | PASS (4089ms) | Negative20000 to17500 partial recall; evidence journeys.json, journeys.json; screenshots S14-{375,1280}.png |
| 15 | PASS (8786ms) | PASS (8585ms) | Card golden purchase/partial/replay/mixed/rollover — Lower-content interactions exercised after explicitly collapsing manual capture; original expanded-panel failures remain open.; evidence rerun-15.json, rerun-15.json; screenshots S15-{375,1280}.png |
| 16 | PASS (11292ms) | PASS (11774ms) | Edit reversibility/delete/Undo/expiration — Lower-content interactions exercised after explicitly collapsing manual capture; original expanded-panel failures remain open.; evidence journeys.json, journeys.json; screenshots S16-{375,1280}.png |
| 17 | PASS (4520ms) | PASS (4485ms) | 29000 plus1000 salary reservation fills completed tank; evidence journeys.json, journeys.json; screenshots S17-{375,1280}.png |
| 18 | PASS (3745ms) | PASS (3906ms) | Actual absent-provider fallback saves manually; evidence journeys.json, journeys.json; screenshots S18-{375,1280}.png |

PASS describes the asserted path, not every phrase in the frozen prose. Scenario1 uses known merchant plus explicit method confirmation under D09;5–8 use date-relative synthetic cycle preconditions;9 uses approved D12/D16 figures and State A;12 explicitly starts with a carried-lock fixture;17 uses approved explicit salary reservation instead of calendar-only credit. Scenario18 also has separate controlled HTTP500 browser proof. Scenario2 remains unresolved and is never replaced by supplemental State B.
