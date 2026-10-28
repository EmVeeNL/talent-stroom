# 04 — Dutch-first localization and translation

## Product language architecture
- UI messages use stable i18n keys; Dutch (`nl-NL`) is source of truth for product copy; English (`en-GB`) maintained alongside.
- User-level language preference overrides organization default. Public shortlist language is selected explicitly by author and optionally toggled by viewer.
- Store dates UTC and render in workspace timezone, initially `Europe/Amsterdam`; respect daylight-saving changes.
- Format EUR with `Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'})`; format names/phone numbers and addresses appropriately.
- UI, validation, email, accessibility text and product guides require translation coverage. CI fails on missing required keys.
- Do not automatically translate candidate names, official degrees, legal declarations, source URLs or employer names.

## AI translation assistant
Supported actions: translate a job description, candidate summary, email draft, and permitted client-facing shortlist text between Dutch and English. Never translate confidential records without organization authorization and a provider approved under privacy terms.

| ID | Requirement | Test |
|---|---|---|
| TR-01 | Explicit source and target locale | Each translated output includes locale metadata |
| TR-02 | Preserve original, version translated draft | Translation never overwrites original |
| TR-03 | Recruiter preview and approve before sharing | No auto publication |
| TR-04 | Terminology glossary per organization/module | Approved terms carried consistently |
| TR-05 | Redact/omit fields not needed for purpose | Model request inspected for minimization |
| TR-06 | Audit translation action, not unnecessary sensitive prompt data | Audit shows actor and metadata |
| TR-07 | Human editor can correct and save version | Revision history visible |

## Quality
Use test fixtures for Dutch vacancy jargon, education levels (`mbo`, `hbo`, `wo`), `zzp`, `detachering`, `vast`, `interim`, Dutch decimal separators, and Dutch/English mixed CVs. Test gender-neutral, non-discriminatory wording. Provide disclaimer that machine translation needs user review.
