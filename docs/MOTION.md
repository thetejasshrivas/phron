# Motion
Component and trigger: NOT_STARTED
Meaning conveyed: NOT_STARTED
Start/end states and authoritative value handling: NOT_STARTED
Duration/easing and interruption behavior: NOT_STARTED
Pending/error/rollback behavior: NOT_STARTED
Reduced-motion behavior: NOT_STARTED
Keyboard/focus/announcement behavior: NOT_STARTED
Mobile performance evidence: NOT_STARTED
Acceptance clip and current status: NOT_STARTED

Initialized from Part 13. No implementation, deployment, founder visual approval or live validation yet.

## PH-08 initial motion matrix / HOME-V1-01

Implemented with native CSS transitions, no animation dependency. Exact supplied text updates immediately; only the visual level interpolates. No displayed money count-up, inferred budget, fake progress or financial write. Interrupted transitions retarget from the browser's current rendered value. Fixture selection resets demo changes. Loading is a static placeholder, not a perpetually shimmering claim of server activity.

| Component / trigger | Meaning | Start -> end | Timing / interruption | Reduced motion / access |
| --- | --- | --- | --- | --- |
| Dining vessel / sample 420 lunch | Spending uses allowance | Supplied36% ->27.6% | height650ms cubic-bezier(.22,1,.36,1); retargetable | instant level; exact1380.00 remains visible; status Nothing saved |
| Goal track / explicit sample fill | Held savings increases independently | Supplied60% ->61.6667% | width650ms same easing; repeated input does not stack | instant fill; exact18500.00 + target text; no reservation/purchase |
| STS cycle track / fixture switch | Permission context changed | Supplied62% ->0 | transform420ms same easing | instant; labeled B/C and exact suppliedzero |
| STS tone / health selection | Distinguish steady/exhausted/distress | green -> ochre/clay | background/border240ms ease | instant; text labels carry meaning |
| Action arrow / hover | Directional affordance | 0 ->2px outward | transform160ms ease | no transform transition; keyboard focus outline |
| Capture / press | Acknowledge action | scale1 ->.98 | 150ms ease | instant; button label and status remain |
| Coach disclosure / click | Show limitation/context | collapsed -> inline explanation | no motion / no auto-scroll | aria-expanded; focus remains on button |
| Empty/loading / selection | Missing values stay unknown | numbers -> Not set/static placeholder | no fake server timer | loading aria-busy + readable label |

Browser proof: PH08/verification.json records before/intermediate/after vessel heights under normal motion and transitionDuration0s under reduced motion. Mobile375/768/desktop1280 are emulated viewports, not physical device performance evidence. No FPS/Core Web Vitals claim. Goal timeline behind/complete/error/reversal and true server-authoritative commit/rollback will be reviewed during real slice work. No success animation for failed saves exists because PH-08 never saves.

### Separate PH-09 Impeccable pass prepared, not executed

Inspect this named revision with impeccable:impeccable after P-RESUME. Audit readable numbers/labels at375px, visible focus/tab order, control contrast, state-change announcements, interrupted drain/fill, reduced-motion equivalence and keyboard/touch responsiveness. Refine purposeful motion without adding loops or changing canonical money. Add motion clip and real interaction evidence, independently inspect all A/B/C/empty/loading states, then present a named revision to Tejas for V1. Do not self-approve V1, claim phone evidence or implement any open source rule. Existing HOME-V1-01 is a starting point, not an accepted visual gate.

References checked2026-10-06: https://nextjs.org/docs/app/api-reference/components/link ; https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion .
