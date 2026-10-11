# D25-PRIMARY-v1 — APPROVED (conditional verification)

2026-10-11 IST. Affects only the primary extraction model in PRD provider stack/§§24–25/31/39 and PH19/28. Frozen PRD unchanged.

Evidence: same privately supplied key lists gemini-2.5-flash but real generateContent returns404 NOT_FOUND with: model no longer available to new users. Gemini1.5Flash is absent from that key's model list. Gemini3.8Flash is listed; official model and pricing docs identify a supported stable model and free standard input/output tier. Listing and published pricing do not prove actual account generation/quota success. No generation calls to the proposed model have occurred.

Exact proposed amendment:
“Replace the primary extraction model gemini-2.5-flash with gemini-3.8-flash, contingent on successful synthetic generation under the existing Free account. Retain Google Gemini as provider, temperature0.1, maximum300output tokens,4.0-second provider timeout, extraction-only outbound privacy allowlist, deterministic schema/paise validation and routing, stable operation identity, and typed manual fallback. No paid tier, billing enablement, paid overflow, new financial permissions or additional outbound context is authorized. If the supported request cannot satisfy these constraints, stop and report rather than silently relaxing them. Groq replacement remains a separate OPEN decision.”

Minimal counterexample: key's ListModels includes2.5Flash while POST generation404 explicitly denies new-user eligibility. A visible model/quota row cannot establish executable API access.

Implementation after approval: update primary constant and model wire expectation; keep supported REST schema; verify exact15000paise extraction, missing-method confirmation/no write,50-case mocked corpus, timeout/failover/privacy regressions, lint/types/build, isolated direct free-account smoke, then authorized Production deployment and ordinary-user live smoke. Unsupported request changes or thinking/output budget expansions require separate resolution if they alter named constraints.

Sources accessed2026-10-11: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash ; https://ai.google.dev/gemini-api/docs/pricing ; https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash . Exact direct evidence: docs/evidence/PH28/ai-repair/direct-provider-detail-results.json and replacement-model-availability.json.

Status: APPROVED — Tejas explicitly approved D25-PRIMARY-v1 exactly on2026-10-11 IST. Activation remains conditional on successful Free-account synthetic verification. Alternative: retain prescribed primary and safe manual fallback, PH28/G6 stays OPEN. Do not mark proposal APPROVED or change code before decision.
