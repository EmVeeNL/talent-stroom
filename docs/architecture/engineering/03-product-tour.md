# Product tour

The recruiter dashboard starts a five-step tour on the first visit for a signed-in user. Steps are declared in `apps/web/src/tour.tsx` and point to the sidebar, search, dashboard KPIs, pipeline and new-candidate action using `data-tour` anchors or stable UI selectors.

The tour supports previous, next, skip and Escape. Focus moves into the dialog, Tab stays within it, and focus returns to the prior element after completion. The spotlight and pointer follow the active target; reduced-motion settings disable their movement.

Completion is stored in browser local storage under a versioned key scoped to the authenticated user ID. This persists across sessions on the same browser profile; it does not sync across devices. If browser storage is unavailable, the tour can still be completed for the current visit.
