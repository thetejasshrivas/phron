# PH21-CHART-v1 — Current safe pool reference

Status: APPROVED — explicit Tejas reply, 2026-10-10 IST.

Approve a read-only linear reference based on the current canonical S_pool, spread across the displayed active-cycle days: pace(day) = floor(S_pool × day / displayed_day_count). Label it “Current safe pool reference,” with an explicit note that it is neither historical permission nor a new spending limit. This stays within the canonical pool, uses integer paise and leaves all STS formulas unchanged.

Scope: PH-21 / PRD §28 surface behavior and the named setup/edit/reference ambiguity only. Frozen sources remain unchanged. Card-funded goal execution and insufficient-funding semantics remain OPEN; this amendment does not authorize remote SQL or deployment.
