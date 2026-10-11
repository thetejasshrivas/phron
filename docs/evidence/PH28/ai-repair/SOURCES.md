# Provider source verification — 2026-10-11 IST

Google REST Schema field inventory: https://ai.google.dev/api/generate-content#Schema. OpenAPI type enums OBJECT/ARRAY/STRING/BOOLEAN/INTEGER are valid; minimum/maximum and minItems/maxItems are documented. additionalProperties is not in the Schema message inventory. Remove that outbound keyword only; strict local parseExtraction continues to reject extra fields and invalid exact monetary strings.

Model eligibility: https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash currently limits 2.5 access to prior active users; it does not describe the stable model as deprecated. Actual project eligibility must be verified independently. No substitution to 1.5 or newer models is inferred.

Groq model catalog: https://console.groq.com/docs/models lists llama-3.3-70b-versatile and llama-3.1-8b-instant as Enterprise. Current public catalog visibility is not free-account availability. Endpoint documented at https://console.groq.com/docs/openai uses https://api.groq.com/openai/v1; existing /chat/completions request and Bearer header are unchanged. A model switch cannot be assumed to fix account access or satisfy zero cost.

The user authorizes either named Groq model if verified active/eligible; the existing prescribed model is retained while investigating actual failure. No paid tier, billing/account changes, extra provider context or secrets retrieval is authorized or performed.
