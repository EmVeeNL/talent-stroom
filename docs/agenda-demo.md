# Agenda demo

The recruiter agenda is a local demo and does not send appointment or task data to the API. Its fictional colleagues all belong to the demo agency.

Appointments can be created from the toolbar, by pressing Enter on a selected grid slot, or by double-clicking an empty slot. The form supports all-day and multi-day ranges, required and optional attendees, an organiser, location, and an optional online meeting link. Opening an appointment shows its details and linked tasks; its actions support editing, moving, task creation, and deletion.

The month view uses day cells. Week and day views use 15-minute slots. Keyboard arrows move the grid selection; Alt+arrow keys move a focused appointment by a day or quarter-hour. Dragging moves an appointment and dragging its end handle resizes it. Required-attendee overlaps appear as a form hint.

The demo store is in-memory and resets on reload. The visual Playwright suite captures all calendar views plus appointment details and the new appointment form at desktop and mobile sizes in both themes.
