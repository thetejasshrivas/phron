# D25-FALLBACK-v1 — PROPOSED / OPEN

Affects only Groq fallback model selection in PRD provider stack/§§24–25/31/39 and PH19/28. Frozen source unchanged.

Evidence2026-10-11: llama-3.3-70b-versatile generation404 explicitly says model does not exist or key lacks access; the key lists neither prescribed3.3nor suggested3.1model. Later direct model-list check lists openai/gpt-oss-20b and120b; official Groq production catalog and Free Plan Limits include20b. Public pricing/listing do not alone establish actual successful generation/free account quota.

Exact proposed amendment:
“Replace the Groq fallback model llama-3.3-70b-versatile with openai/gpt-oss-20b, contingent on successful synthetic generation under the existing Free account. Retain Groq as provider, temperature0.1, maximum300output tokens,4.0-second provider timeout, supported JSON response mode, extraction-only outbound privacy allowlist, deterministic schema/paise validation and routing, stable operation identity, and typed manual fallback. No paid tier, billing enablement, paid overflow, model tools, new financial permissions or additional outbound context is authorized. If supported requests cannot satisfy these constraints, stop and report rather than silently relaxing them.”

Minimal counterexample: valid Groq key can list models but cannot generate using an inaccessible Llama ID. Replacing it with another absent Llama ID cannot prove recovery. Tests after approval: exact15000paise direct adapter extraction, mocked failover and hostile corpus/privacy, bounded timeout, local checks/build, real fallback synthetic smoke separate from primary, then Production live ordinary-user smoke. Strict local JSON validators retained even when provider mode differs.

Sources: https://console.groq.com/docs/models ; https://console.groq.com/docs/rate-limits ; https://console.groq.com/docs/openai . Evidence: docs/evidence/PH28/ai-repair/direct-provider-detail-results.json and groq-model-list-shape.json. Status OPEN; no generation calls to proposed fallback or implementation change before approval. Alternative retains Llama/manual fallback and leaves G6 OPEN. Primary approval is separate D25-PRIMARY-v1.
