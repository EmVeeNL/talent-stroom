# 02 — Personas and Dutch recruitment workflows

## Roles
- **Bureau-eigenaar / Organisatiebeheerder:** invites staff, configures modules, oversees privacy, billing and data access.
- **Recruiter / Consultant:** manages candidates, vacancies, opdrachtgever relations, reminders and placements.
- **Opdrachtgever / Hiring manager:** reviews only explicitly shared candidate shortlists through a scoped link; no account needed in MVP.
- **Platform operator:** operates infrastructure, has no routine plaintext candidate browsing; privileged access is exceptional, logged and approved.

## Daily workflow
09:00 review `Mijn taken`; 09:30 source candidates; 11:00 upload CVs and verify extraction; 12:00 add candidates to vacancies; 14:00 share shortlist; 15:00 receive and act on client feedback; 16:00 move applications and follow up; end of day review open vacancies and placements.

## Dutch-market terminology
`Kandidaten`, `Vacatures`, `Opdrachtgevers`, `Contactpersonen`, `Sollicitaties` / `Koppelingen`, `Pipeline`, `Voordrachten`, `Plaatsingen`, `Taken`, `Notities`. Distinguish **kandidaat** (individual) from **sollicitatie** (candidate-vacancy relationship). Client-facing terms may use `Voorgestelde kandidaten` rather than `Sollicitaties`.

## Key jobs to be done
- When I receive a CV, I can make a clean candidate profile without retyping everything.
- When a candidate fits several roles, I can independently manage each role's stage.
- When a client wants a shortlist, I can disclose just approved fields and get feedback without login friction.
- When a client doesn't respond, I receive a follow-up task.
- When my agency specializes in a niche, my admin can define a category-specific structured page without developer help.
- When I work for several agencies, I consciously choose my active agency and never confuse their data.

## Main journeys
1. Authenticate → select organization (or enter single org automatically only if policy allows) → organization-specific dashboard.
2. Upload DOCX/PDF → malware screening → parse asynchronously → review fields and provenance → duplicate check → save candidate.
3. Open vacancy → add existing candidate → application created → drag stage or use accessible select → audit event and follow-up task.
4. Select applications → preview exact client-visible data → publish immutable shortlist snapshot → expiring share link → feedback → notification.
5. Admin → Modules → choose category, fields, forms, list filters, access policy → preview → publish version → recruiters use custom page.
6. Change organization → confirmation / context switch → clear organization-scoped caches and state → reload scoped data.
