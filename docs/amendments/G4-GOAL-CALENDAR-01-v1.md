# G4-GOAL-CALENDAR-01-v1 — APPROVED — explicit Tejas approval, 2026-10-10 IST

Conflict: PRD AC-GOAL-01 specifies a ₹30,000 phone due in six months with ₹5,000 monthly reserve. Approved PH21-GOAL-v1 instead counts the current cycle plus expected paydays strictly before the deadline; D07-v2 floors contributions and assigns remainder to the last cycle.

Minimal counterexample: create on 2026-10-10, expected payday 2026-10-11, deadline 2027-04-10. The approved count includes current cycle plus October11, November11, December11, January11, February11 and March11: seven contributions. floor(3,000,000 / 7) = 428,571 paise, not 500,000.

Exact approved wording:
“AC-GOAL-01 uses the approved PH21-GOAL-v1 contribution count, not a fixed conversion from calendar months. A ₹30,000 target with exactly six eligible contributions reserves ₹5,000 immediately and in each eligible cycle. In the dated six-calendar-month example created 2026-10-10 with expected payday 2026-10-11 and target 2027-04-10, seven contributions are eligible: reserve 428,571 paise in each of the first six cycles and 428,574 paise in the final cycle. Goal creation and subsequent rollovers retain the approved immediate reservation, cash preservation, reserve quarantine and final-remainder rules.”

Affected proof: AC-GOAL-01 exact dated creation/reservation fixture; pure floor/remainder and SQL parity. No new algorithm or existing financial formula change. Approval is explicitly recorded; the dated ordinary-user SQL fixture and independent final-remainder fixture pass in G4 evidence.
