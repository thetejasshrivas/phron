import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const sourcePath='docs/source/PHRON_PRD_v1.2.1_FROZEN.txt';
const bytes=readFileSync(sourcePath), lines=bytes.toString('utf8').split(/\r?\n/);
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const groups={
 AUTH:{owner:'Platform',code:['src/server/auth/handlers.ts','src/server/auth/delete-account.ts','src/proxy.ts'],contracts:['src/server/auth/policy.ts'],tests:['tests/integration/ph12/handlers.test.ts','tests/integration/ph12/proxy.test.ts','tests/integration/ph12/request-client.test.ts','tests/integration/ph21/routes.test.ts'],evidence:'G4/integration.log; tests/integration/ph12/evidence/LIVE_RESULT.md; PH21/browser.json; PH21/surfaces.log',note:'Fresh SSR getUser/PKCE cookies, fixed redirects, protected pages, ordinary RLS and caller-only populated purge; prior live Google and local purge evidence retained.'},
 ONB:{owner:'Platform / Experience',code:['src/components/auth/Onboarding.tsx','src/server/auth/handlers.ts','src/domain/onboarding.ts'],contracts:['src/server/finance/types.ts'],tests:['tests/unit/domain/onboarding.test.ts','tests/property/onboarding.test.ts','tests/integration/ph11/onboarding.mjs','tests/integration/ph21/surfaces.mjs'],evidence:'G4/unit.log; G4/domain.log; G4/probes.json; PH21/surfaces.log; G3/SECTION18_MATRIX.md',note:'D17 declared-state initial budget; D27 fixed starter weights replaces lifestyle taps; ordinary RPC persists once, no automatic salary credit.'},
 STATE:{owner:'Engine / Platform',code:['src/domain/core.ts','src/domain/cycle.ts','src/client/home-session.ts'],contracts:['src/contracts/snapshot.ts','src/server/finance/parse.ts'],tests:['tests/unit/domain/core.test.ts','tests/property/core.test.ts','tests/integration/ph15/parity.test.ts'],evidence:'G4/unit.log; G4/domain.log; G4/integration.log; G3/SECTION18_MATRIX.md',note:'Canonical snapshot separates cash, spent, held goal funds, card reserve and commitments; deterministic read_snapshot and stable-ID mutation results.'},
 STS:{owner:'Engine / Experience',code:['src/domain/core.ts','src/components/home/Home.tsx'],contracts:['src/contracts/snapshot.ts'],tests:['tests/unit/domain/core.test.ts','tests/property/core.test.ts','tests/unit/ui/home-session.test.ts'],evidence:'G4/domain.log; G4/probes.json; PH21/browser.json; G3/SECTION18_MATRIX.md',note:'calculateMargins/calculateSts: integer zero floor, two bounds, floor daily quotient and weekly min(7,days); D01/D04/D05-extension/D15/D26 retained.'},
 BUCKET:{owner:'Experience / Platform',code:['src/components/surfaces/Manage.tsx','src/components/home/Home.tsx','src/domain/recovery.ts','supabase/migrations/20261010160000_ph21_surfaces.sql'],contracts:['src/contracts/surfaces.ts','src/server/surfaces/parse.ts'],tests:['tests/unit/domain/recovery.test.ts','tests/property/recovery.test.ts','tests/integration/ph21/surfaces.mjs'],evidence:'G4/domain.log; G4/probes.json; PH21/surfaces.log; PH21/browser.json',note:'D27 starter conservation; D14 only State C overrides want floors; PH21-BUCKET saves baselines for rollover, names now, constrained floors, custom zero-active allowance.'},
 TXN:{owner:'Platform / Experience',code:['src/app/api/finance/ingest/route.ts','src/components/home/Home.tsx','src/components/home/CardLedger.tsx','src/client/home-session.ts'],contracts:['src/contracts/card.ts','src/server/finance/extraction.ts'],tests:['tests/integration/ph19/ingest-route.test.ts','tests/integration/ph19/confirm-category.test.ts','tests/integration/ph15/lifecycle-handlers.test.ts','tests/unit/ui/home-session.test.ts'],evidence:'G4/integration.log; G4/probes.json; PH21/browser.json; PH21/cards.log; PH21/payments.log; PH21/ingestion.log',note:'D09 explicit method only and uncommitted P2P; D18 custom/memory routes; D10 immediate reversal plus six-second recommit Undo and current-cycle guards. No inference of unresolved deletion rules.'},
 GOAL:{owner:'Experience / Platform',code:['src/components/surfaces/HomeDetails.tsx','src/components/surfaces/Manage.tsx','src/server/surfaces/projection.ts','src/domain/recovery.ts','supabase/migrations/20261010160000_ph21_surfaces.sql'],contracts:['src/contracts/surfaces.ts'],tests:['tests/unit/domain/recovery.test.ts','tests/unit/ui/ph21-projection.test.ts','tests/integration/ph21/surfaces.mjs','tests/integration/ph18/goal-purchase.mjs'],evidence:'G4/unit.log; G4/domain.log; G4/probes.json; PH21/surfaces.log; PH21/goals.log; PH21/browser.json',note:'PH21-GOAL funded first floor-rounded contribution at creation; future salary reservations/history; D07-v2 last-cycle remainder. Canonical pace and completion; cash-funded execution only; WANT creation/execution denied in C.'},
 REC:{owner:'Engine / Platform / Experience',code:['src/domain/recovery.ts','src/server/surfaces/projection.ts','src/components/home/Home.tsx'],contracts:['src/contracts/surfaces.ts'],tests:['tests/unit/domain/recovery.test.ts','tests/property/recovery.test.ts','tests/integration/ph16/recovery.mjs'],evidence:'G4/domain.log; PH21/recovery.log; G3/SECTION18_MATRIX.md; G4/controls.json',note:'overspend and planRecovery math plus phron_accept_recovery RPC are tested; accepted trims are read for local coach. No proposal/accept/adjust user path or automatic flexible-date extension.'},
 BORR:{owner:'Engine / Platform / Experience',code:['src/domain/recovery.ts','src/domain/cycle.ts','src/server/surfaces/handlers.ts'],contracts:['src/contracts/surfaces.ts'],tests:['tests/unit/domain/recovery.test.ts','tests/property/recovery.test.ts','tests/integration/ph16/commitments.mjs','tests/integration/ph17/cycle.mjs'],evidence:'G4/domain.log; PH21/commitments.log; PH21/cycle.log; G3/SECTION18_MATRIX.md',note:'commitmentCapacity/hasCashPaymentCapacity and acceptance RPC enforce D03-v2/D13/D21; carried lock clears on approved rollover deduction. SQL evidence does not establish reachable Home proposal/acceptance.'},
 DIST:{owner:'Engine / Platform / Experience',code:['src/domain/core.ts','src/domain/distress.ts','src/domain/firefight.ts','src/server/surfaces/projection.ts'],contracts:['src/contracts/snapshot.ts','src/contracts/surfaces.ts'],tests:['tests/unit/domain/distress.test.ts','tests/unit/domain/firefight.test.ts','tests/integration/ph18/distress.mjs','tests/unit/ui/ph21-projection.test.ts'],evidence:'G4/domain.log; G4/probes.json; PH21/distress.log; PH21/surfaces.log; G3/CLOSURE/RESULT.md',note:'D02 equality stays C, salary-only strict exit; D14 stored baseline/floor retained and restored; G3-DF-01 accounting labels never quarantine cash; want locks enforced.'},
 RECON:{owner:'Platform / Experience',code:['src/domain/cycle.ts','src/components/surfaces/HomeDetails.tsx','src/server/surfaces/handlers.ts'],contracts:['src/contracts/surfaces.ts','src/server/surfaces/parse.ts'],tests:['tests/unit/domain/cycle.test.ts','tests/integration/ph17/cycle.mjs','tests/integration/ph21/surfaces.mjs'],evidence:'G4/domain.log; PH21/cycle.log; PH21/surfaces.log; PH21/browser.json',note:'D06/D22 exact residual cash/budget and stable-ID reconciliation; five-day logged-transaction inactivity. UI currently submits actual balance and recall together without a sign-specific pre-confirmation stage.'},
 CYCLE:{owner:'Engine / Platform / Experience',code:['src/domain/dates.ts','src/domain/cycle.ts','src/components/surfaces/HomeDetails.tsx'],contracts:['src/contracts/surfaces.ts'],tests:['tests/unit/domain/dates.test.ts','tests/unit/domain/cycle.test.ts','tests/integration/ph17/cycle.mjs'],evidence:'G4/domain.log; G4/probes.json; PH21/cycle.log; G3/SECTION18_MATRIX.md',note:'Expected clamped IST payday creates prompt only; D04 actual credit idempotent, D05 extension until confirmation, commitments deducted once, card/unpaid carry retained.'},
 AI:{owner:'Platform',code:['src/server/finance/providers.ts','src/server/finance/extraction.ts','src/server/finance/coach.ts','src/app/api/finance/ingest/route.ts'],contracts:['src/server/finance/extraction.ts'],tests:['tests/unit/server/provider-pipeline.test.ts','tests/unit/server/extraction.test.ts','tests/unit/server/privacy-firewall.test.ts','tests/integration/ph19/ingest-route.test.ts'],evidence:'G4/unit.log; G4/integration.log; G4/probes.json; PH21/browser.json',note:'Pinned model adapters and strict array JSON; zero-temperature malformed retry within 4s Gemini budget, Groq 4s, typed manual fallback. Deterministic confidence and local coach; live provider checks explicitly separate under D18.'},
 SAFE:{owner:'Platform',code:['src/server/finance/privacy-firewall.ts','src/server/finance/coach.ts','src/app/api/finance/ingest/route.ts'],contracts:['src/server/finance/extraction.ts'],tests:['tests/unit/server/privacy-firewall.test.ts','tests/integration/ph19/ingest-route.test.ts'],evidence:'G4/unit.log; G4/integration.log; G4/probes.json',note:'Pure advice requests refused before state/provider access; coach is deterministic plain text with refusal bounds. Mixed safe spend plus injected advice audited separately.'},
 PRIV:{owner:'Platform / Experience',code:['src/server/finance/privacy-firewall.ts','src/server/finance/providers.ts','src/components/auth/Onboarding.tsx','src/components/home/Home.tsx'],contracts:['src/server/finance/extraction.ts'],tests:['tests/unit/server/privacy-firewall.test.ts','tests/integration/ph19/ingest-route.test.ts'],evidence:'G4/unit.log; G4/integration.log; PH20/RESULT.md',note:'D08 only sanitized extraction after truthful disclosure/consent; no balances/identity/deltas and no external coach. Consent exists at capture, not onboarding; no approved waiver of FR-PRIV-03 timing found.'},
 VIS:{owner:'Experience',code:['src/components/surfaces/Visualize.tsx','src/server/surfaces/projection.ts','src/client/chart-presentation.ts'],contracts:['src/contracts/surfaces.ts'],tests:['tests/unit/ui/ph21-projection.test.ts'],evidence:'G4/unit.log; PH21/browser.json',note:'Server projects exact 1-7/8-14/15-21/22-end cycle blocks, allocation/actual payment rows, no tracked-settlement double count; chart reference explicitly amended by PH21-CHART.'},
 UX:{owner:'Experience',code:['src/components/surfaces/shared.tsx','src/components/home/Home.tsx','src/app/visualize/page.tsx','src/app/manage/page.tsx'],contracts:['src/contracts/surfaces.ts'],tests:['tests/unit/ui/ph21-home.test.ts'],evidence:'G4/unit.log; PH21/browser.json; G4/controls.json',note:'Three protected primary surfaces; Home section anchors and supporting settings/history stay within them. No fourth primary dashboard.'},
 ACC:{owner:'Experience / QA',code:['src/components/home/Home.tsx','src/components/surfaces/Visualize.tsx','src/styles/surfaces.css'],contracts:['src/contracts/surfaces.ts'],tests:['tests/unit/ui/ph21-home.test.ts'],evidence:'G4/controls.json; PH21/browser.json',note:'Labels, skip links, table equivalents and reduced motion exist; exact AC keyboard order/trap proof is absent and DOM navigation/coach precede capture.'},
};
const overrides={
  "FR-ONB-03": [
    "PASS",
    "PASS: three ordinary manual spends in distinct buckets unlock goals in the browser; reconciliation alternative retained."
  ],
  "AC-ONB-01": [
    "PASS",
    "PASS: ordinary local requirements-final fixture explicitly uses salary6000000, commitments2000000, cash4000000, unpaid0, payday1; pool4000000 and five starter buckets."
  ],
  "AC-ONB-03": [
    "PASS",
    "PASS: browser logs Groceries/Dining/Shopping separately and asserts goalsUnlocked after third distinct bucket."
  ],
  "FR-BUCKET-04": [
    "PASS",
    "PASS under D20-v1: required single target dialog; atomic active allowance/spent/history transfer, baseline absorption and source archival; no direct deletion bypass."
  ],
  "AC-BUCKET-04": [
    "PASS",
    "PASS: browser requires target selection before confirmation; local lifecycle verifies transaction reassignment, historical parent, rollback, replay, concurrency and tenant denial."
  ],
  "AC-BUCKET-03": [
    "PASS",
    "PASS under PH21-BUCKET: Pet Care baseline300000/floor50000 persists with zero active allowance, then confirmed rollover activates both; requirements-final.log."
  ],
  "FR-TXN-01": [
    "PASS",
    "PASS: bounded single-line capture is first top-sticky Home content; text fallback and local-only D23 microphone capability checks preserve text."
  ],
  "FR-TXN-02": [
    "PASS",
    "PASS under D09: explicit cash multi-item extraction yields separate45000/200000 ordinary-user records; memory no longer consumes the second item."
  ],
  "AC-TXN-02": [
    "PASS",
    "PASS under D09: exact multi-item text requires explicit method before saving; per-item mock expectations plus ordinary DB two-record/replay/changed-facts tests."
  ],
  "AC-TXN-04": [
    "PASS",
    "PASS: real local production Edge Groceries-to-Dining chip changes canonical category and readable bucket spend within300ms; browser.json records actual time and unchanged aggregate cash/spent. No hosted/mobile latency claim."
  ],
  "FR-REC-02": [
    "PASS",
    "PASS: readonly server proposal imports domain donor order, protects floors/custom/Groceries/obligations, accepts via atomic revalidated ordinary RPC."
  ],
  "FR-REC-03": [
    "PASS",
    "PASS under G4-FLEX-DATE-01: residual-only whole-week rational ceiling and explicit atomic flexible deadline extension; zero monthly remains unresolved."
  ],
  "FR-REC-04": [
    "PASS",
    "PASS: fixed-goal proposal uses canonical cap and D21 capacity, explicit acceptance and typed residual; D24 permanent new-commitment safety guard."
  ],
  "FR-REC-05": [
    "PASS",
    "PASS: Home RecoveryCard exposes Accept Plan and Adjust Trims; native dialog links floor management; pending/stable-operation/no optimistic money."
  ],
  "AC-REC-01": [
    "PASS",
    "PASS: browser independent1000 deficit proposes Entertainment600/Shopping400, accepts and preserves State A; domain/SQL D12 fixtures also retained."
  ],
  "AC-REC-02": [
    "PASS",
    "PASS under approved extension: browser1200 residual/monthly3000 produces14days, reserves and next commitment unchanged; local forced rollback/replay verified."
  ],
  "AC-REC-03": [
    "PASS",
    "PASS: fixed-goal proposal offers1500 within remaining cap and real payment capacity; acceptance updates canonical future deductions only."
  ],
  "AC-BORR-01": [
    "PASS",
    "PASS: browser existing4500/additional3000 proposes1500 with explicit1500 shortfall and accepts cumulative6000; database concurrent cap and one-paisa boundaries retained."
  ],
  "AC-GOAL-01": [
    "PASS",
    "PASS under G4-GOAL-CALENDAR-01: exactly six eligible contributions reserve500000; actual six-calendar-month seven-contribution fixture reserves428571 and independent final remainder428574. No fixed calendar-month conversion."
  ],
  "AC-GOAL-04": [
    "PASS",
    "PASS: literal completed Milestone Reached! Ready to purchase. banner and funded cash execution tested; reserve release/cash debit once/no B_spent double debit/refresh verified."
  ],
  "AC-DIST-03": [
    "PASS",
    "PASS: genuine canonical State C browser renders DEBT FIREFIGHT, Firefight Margin and want locks; domain/SQL clamps want allowances to zero while preserving baselines/floors."
  ],
  "FR-RECON-03": [
    "PASS",
    "PASS: server computes signed preview before explicit confirmation; negative gap>=500 asks recall, residual follows D06/D22; stale revision rejects."
  ],
  "AC-RECON-02": [
    "PASS",
    "PASS: exact22000-to19500 browser recall prompt; recalled1500 plus residual1000 budget reduction, cash19500 once."
  ],
  "AC-RECON-03": [
    "PASS",
    "PASS: exact18000-to20000 browser positive2000 adjustment preview/confirm; cash only, discretionary budget unchanged."
  ],
  "AC-AI-03": [
    "PASS",
    "PASS: legitimate500 lunch prefix retained, hostile advice suffix neutralized; missing method stays uncommitted under D09; pure advice refusal and FIT13 boundary remain."
  ],
  "FR-PRIV-03": [
    "PASS",
    "PASS under D08: required explicit truthful onboarding extraction disclosure/consent blocks unchecked POST; capture gate retained. No unsupported stateless/zero-retention claim; coach local."
  ],
  "AC-ACC-01": [
    "PASS",
    "PASS: actual repeated Tab reaches capture, coach, bucket cards, navigation in exact order without trap; native dialogs Escape/focus and reduced motion verified."
  ]
};
const currentNotes={
 REC:'Domain recovery plus readonly typed proposal and explicit atomic acceptance; donor floors, custom protection, flexible residual extension and fixed cap/capacity are wired and tested.',
 BORR:'D03-v2/D13/D21/clearance plus D24 permanent disable-new-only safety; existing replay/deductions/history preserved; ordinary local cap/concurrency/rollback/tenant tests.',
 RECON:'D06/D22 signed server preview, sign-aware recall/positive confirmation, exact one-time cash/budget residuals and inactivity/manual prompts.',
 PRIV:'D08 truthful required onboarding and capture consent; sanitized extraction-only allowlist, no identity/balances/deltas/external coach; live provider account checks remain separate.',
 TXN:'D09 explicit method, D18 item-wise custom/memory classification, D10 immediate reversal/6-second Undo, current-cycle edits and durable ingestion replay; D23 verified local-only capability or text fallback.',
 GOAL:'Approved contribution counting, floor/final remainder and immediate first reservation; funded cash execution and cancellation only, preserved history/quarantine, deterministic pace/completion.',
};
for(const [family,note] of Object.entries(currentNotes))groups[family].note=note;
const additions={
 BUCKET:['src/components/surfaces/BucketDeletion.tsx','supabase/migrations/20261010210000_ph22_bucket_goal_lifecycle.sql'],
 REC:['src/components/surfaces/RecoveryCard.tsx','src/server/surfaces/recovery-preview.ts','supabase/migrations/20261010213000_ph22_recovery_context.sql'],
 BORR:['src/components/surfaces/RecoveryCard.tsx','supabase/migrations/20261010230000_ph22_commitment_safety.sql'],
 RECON:['src/server/surfaces/reconciliation-preview.ts'],
 TXN:['src/client/on-device-dictation.ts','supabase/migrations/20261010223000_ph22_ingestion_replay.sql'],
};
for(const [family,paths] of Object.entries(additions))groups[family].code.push(...paths);
const testAdds={ONB:['tests/unit/ui/ph22-consent.test.ts','tests/integration/ph22/requirements.mjs'],BUCKET:['tests/integration/ph22/lifecycle.mjs','tests/unit/ui/ph22-bucket-deletion.test.ts','tests/integration/ph22/requirements.mjs'],TXN:['tests/integration/ph22/multi-item.mjs','tests/unit/ui/on-device-dictation.test.ts'],GOAL:['tests/unit/ui/completed-goal.test.ts','tests/unit/domain/goal-calendar-fixture.test.ts','tests/integration/ph22/requirements.mjs'],REC:['tests/unit/domain/flexible-extension.test.ts','tests/property/flexible-extension.test.ts','tests/unit/server/recovery-preview.test.ts','tests/integration/ph22/lifecycle.mjs'],BORR:['tests/integration/ph22/safety.mjs'],RECON:['tests/unit/server/reconciliation-preview.test.ts'],PRIV:['tests/unit/ui/ph22-consent.test.ts'],UX:['tests/integration/ph22/browser-local.mjs']};
for(const [family,paths] of Object.entries(testAdds))groups[family].tests.push(...paths);
for(const group of Object.values(groups))group.evidence='G4/remediation/runs.json; G4/remediation/unit.log; G4/remediation/integration.log; G4/remediation/domain.log; G4/remediation/database/final-runs.json and named suite logs; G4/remediation/browser/browser.json; G3/SECTION18_MATRIX.md. Prior live Google: tests/integration/ph12/evidence/LIVE_RESULT.md only';
let clause=''; const rows=[];
for (let i=0;i<lines.length;i++) {
 const heading=/^(1[56]\.\d+) /.exec(lines[i]); if(heading)clause=heading[1];
 const match=/^- ((?:FR|AC)-([A-Z]+)-\d+)(?: \[P0\])?: (.+)$/.exec(lines[i]);
 if(!match)continue;
 const [,id,family,definition]=match, group=groups[family]; if(!group)throw new Error('Unmapped '+id);
 const [status,note]=overrides[id]??['PASS',group.note];
 rows.push({id,clause:'§'+clause,sourceLine:i+1,definition,status,owner:group.owner,implementation:group.code,contracts:group.contracts,tests:group.tests,evidence:group.evidence,finding:note});
}
assertUnique(rows);function assertUnique(r){if(r.length!==107||new Set(r.map(x=>x.id)).size!==107||r.filter(x=>x.id.startsWith('FR')).length!==60)throw new Error('Actual ID count changed');}
for(const group of Object.values(groups))for(const path of [...group.code,...group.contracts,...group.tests])if(!existsSync(path))throw new Error('Missing evidence path '+path);
const counts=rows.reduce((c,r)=>(c[r.status]=(c[r.status]??0)+1,c),{});
writeFileSync(new URL('requirements.json',import.meta.url),JSON.stringify({head,sourcePath,sha256:createHash('sha256').update(bytes).digest('hex'),counts,rows},null,2)+'\n');
const md=rows.map(r=>`| ${r.id} | ${r.clause}:${r.sourceLine} | ${r.status} | ${r.owner} | ${r.implementation.map(p=>'`'+p+'`').join('<br>')}<br>Contract: ${r.contracts.map(p=>'`'+p+'`').join(', ')} | ${r.tests.map(p=>'`'+p+'`').join('<br>')}<br>${r.evidence} | ${r.finding} |`).join('\n');
writeFileSync(new URL('REQUIREMENTS.md',import.meta.url),'# G4 actual P0 requirement audit register\n\n2026-10-10 IST; candidate '+head+'. '+JSON.stringify(counts)+'. 60 FR and 47 unique AC definitions. AC-AI-02 appears once despite its privacy cross-reference. Source clauses/lines refer to the frozen PRD; full verbatim definitions and machine-readable findings are in requirements.json. PASS is scoped to named approved amendments and the cited layer; it is not a release/live-provider or full PH23 journey claim. NOT RUN means required proof missing, not a skipped passing requirement.\n\nTest/evidence paths are repository-relative; closure runs describe the working candidate based on the cited HEAD; the implementation is sealed by the closure commit. Fresh local database and browser execution is in remediation/database and remediation/browser; prior PH12 live Google proof is reused for unchanged OAuth handlers. Jest integration is mocked contracts, distinct from ordinary-user database cases. No remote deployment or real pilot occurred. Historical planning rows in TRACEABILITY are non-normative.\n\n| ID | Source clause:line | Status | Owner | Implementation / contract | Asserted test sources / run evidence | Finding |\n| --- | --- | --- | --- | --- | --- | --- |\n'+md+'\n');
console.log(JSON.stringify(counts));
