# PH30B-PAL-04 — grounded comic wordmark palette

2026-10-11 IST; main; parent dcad039c12358b9abadfc7cbbc7231c1901c76b1 plus this palette-only frontend diff. Founder approves comic structure and requests removing the neon mark color. No new complete visual acceptance inferred; no push/deployment. Production remains e50cf43.

Default lettering: deep pine #0F382A; crisp outline: warm parchment #F2EDE2; static offset impression: burnished amber #B76812. No fluorescent fill/stroke remains in the logo. Existing lettering geometry, shadow offset, typography and role=img/aria-label=PHRON remain intact. Optional tone=dark uses parchment lettering, deep-pine outline and #D97706 amber shadow on dark elements. Current light headers keep the default. No financial/state code, copy, metadata, formula, dependency or contract changed. No new animation or asset download.

| Executed command/check | Result | Evidence in this folder |
| --- | --- | --- |
| npm test | PASS exit0:462 unit +152 mocked integration | palette-test.log |
| npm run lint | PASS exit0, final harness included | palette-lint.log; palette-lint-final.log |
| npm run typecheck | PASS exit0 | palette-typecheck.log |
| npm run build | PASS exit0 | palette-build.log |
| npx --no-install playwright test | PASS exit0:2/2 default tests | palette-e2e.log |
| node docs/evidence/PH30B/polish/preview.mjs | PASS exit0:18 surface/state/width combinations plus light/dark logo at375/1280 | palette-browser.log; browser-results.json |
| Explicit palette checks |13/13 PASS, normal text4.5+/graphic edges3+ | palette-contrast.json |
| Computed logo fill/background contrast | light11.107:1; dark15.195:1, both widths | wordmark-contrast.json |
| Source integrity | PASS exit0:all5 source hashes unchanged | current shell |
| git diff --check | PASS before commit | current shell |

Regenerated all Home/Visualize/Manage A/B/C previews at375/1280 in this folder, six reduced-motion previews, six open-editor previews and two wordmark palette swatches. index.html links current previews. Older neon screenshots remain available in commit dcad039 rather than representing this revision. Desktop/mobile preview script uses actual component SSR and isolated synthetic read-only hooks; it does not prove hydrated save/auth/database operations.18views have no horizontal page overflow or axe text-contrast violations; SVG/incomplete cases are supplemented by explicit actual computed logo color ratios. This is scoped contrast evidence, not a new blanket WCAG certification. Existing reduced-motion assertions PASS; the logo remains static.

375px wordmark palette preview visually inspected; glyph cohesion/nukta/outline/shadow preserved and no glare or clipping observed. Physical-phone/authenticated database journeys NOT RUN for this palette-only revision. Financial logic is unchanged. Scratch New Text Document.txt untouched; PH31 NOT_STARTED. Next one action: Tejas reviews PH30B-PAL-04 before requesting publication.
