# G4-FLEX-DATE-01-v1 — Approved flexible-goal recovery extension

Founder approval: Tejas, 2026-10-10. Applies to FR-REC-03 / AC-REC-02.

Convert only the residual deficit left after floor-protected trims into whole weeks:

`extension_days = 7 × ceil(residual_paise × 30 / (monthly_contribution_paise × 7))`.

Require a positive monthly contribution; zero contribution yields an unresolved shortfall. Apply the extension only on explicit atomic plan acceptance, preserving existing goal reserves/contribution history and leaving next-cycle commitments unchanged. This uses a fixed 30-day conversion basis: ₹1,200 residual at ₹3,000/month extends by 14 days, matching AC-REC-02.
