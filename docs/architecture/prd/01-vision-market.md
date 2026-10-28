# 01 — Vision, objectives and Dutch-market strategy

## Mission
Give Dutch boutique recruitment agencies (2–10 recruiters) a fast, simple CRM that gets CVs into a structured workflow and qualified candidate shortlists in front of clients with minimal administration.

## Product constraints
- Netherlands is the initial market; Dutch (`nl-NL`) is the default language, Europe/Amsterdam default timezone, EUR, Dutch number and date formatting, Dutch privacy copy, accessible responsive UI.
- English (`en-GB`) is supported for agency staff and cross-border communication. System stores original multilingual data rather than translating it destructively.
- Focus first on third-party recruitment and headhunting agencies, not enterprise HR departments.
- Workspace is an **organization** and a user may join multiple organizations; active organization must be explicitly selected after login where applicable.
- Treat applicant privacy and secure client sharing as defining product features, not add-ons.

## Target segments
1. Specialist IT recruiters handling developers and cloud engineers.
2. Technical/engineering agencies with skill-specific workflows.
3. Finance and professional-services recruitment boutiques.
4. Executive search teams with confidential shortlists.

## Value proposition
**Werven zonder gedoe.** Candidate → vacancy → pipeline → client shortlist → feedback → placement, without the overhead of enterprise ATS tools.

## North star and metrics
North star: number of **unique candidate-vacancy submissions shared with clients each week**, segmented by active agency.

| Metric | Initial hypothesis | Instrumentation |
|---|---:|---|
| Workspace activation within 7 days | ≥70% | Client + vacancy + 5 candidates + 1 pipeline move |
| CV-assisted entry user interaction | <30 sec median | Upload → verified candidate saved; exclude queue wait |
| API candidate search | p95 <500 ms | Server instrumentation |
| Pipeline mutation | p95 <300 ms | API metric |
| Feedback on viewed shortlists | ≥50% | Share analytics |
| Service availability | 99.9% / month | Synthetic checks |
| Successful supported text-based CV parsing | ≥95% | Parsed jobs / valid supported jobs |

Targets are hypotheses until tested with customer pilots. Avoid attaching guarantees to subscription tiers until validated.

## Exclusions for MVP
No scraping, automated candidate ranking, general code execution inside custom modules, advanced custom reporting, offline-first desktop app, email inbox sync, or job-board publishing.
