# 05 — AI assistant requirements and controls

## Initial assistant capabilities
1. Extract structured, source-grounded CV attributes after secure upload.
2. Draft Dutch/English job descriptions or outreach copy, with user confirmation.
3. Translate recruiter-authored texts and candidate summaries; preserve originals.
4. Summarize permitted internal candidate history; cite record sources within the product.
5. Suggest follow-up task phrasing; never silently send messages or advance candidates.

## Explicit MVP boundaries
No autonomous hiring decisions, no suitability scoring, no ranking/filtering candidates based on AI inference, no protected-attribute inference, no online scraping, no unrestricted model-to-database queries, and no automatic sending of candidate PII to clients.

## Architecture
`assistant UI → authenticated API → policy engine + data-minimizing retrieval → approved provider adapter → structured output validation → safety/content checks → user preview → authorized save`. Provider calls from server workers only, secrets outside frontend, no PII in general telemetry. Treat CV/document text as hostile instructions; tool instructions cannot be overridden by retrieved content. Tool calls have explicit allowlists and narrow scopes.

## Data contract
Persist task type, model/provider version, organization, user, source document IDs, output revision, human approval, consent/lawful-basis metadata when relevant, and cost tokens. Avoid retaining raw prompts/responses longer than necessary. Organization can disable AI; AI provider must have acceptable DPA, residency and no-training controls.

## Quality and security
- Test hallucination, prompt injection, cross-tenant leakage, bilingual terms, adverse output, model downtime, quota exhaustion and cost spikes.
- Schema-validate JSON, provide confidence/uncertainty, prefer missing value to invented value.
- Human approvals for any outward-facing or legally significant result.
- Pin or qualify model versions; maintain eval datasets and canary rollout.
- Model-based recruitment selection/ranking can be high-risk under the EU AI Act and requires separate legal, governance, bias and conformity assessment before building.

## Model economics
Select models through measured task-level evals (quality, privacy, latency and per-completed-task cost), not assumed global rankings. Use smaller validated models for field extraction/translation; escalate complex reasoning to a stronger model only after a fallback threshold. Cache only non-sensitive prompts or properly partitioned encrypted outputs with bounded TTL.
