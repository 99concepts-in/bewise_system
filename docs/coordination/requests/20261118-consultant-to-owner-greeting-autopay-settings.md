# Request: greet-then-auto-payment-link flow, WhatsApp templates, consultant settings & impact numbers
From: CONSULTANT · To: OWNER · Priority: P1 · Status: ACCEPTED
Owner rules from 2026-11-18 (tested in `preview/consultant/`):

1. **Booking by Jitu Bhaiya/Haresh = greet and confirm first, payment link sent automatically afterwards — he never sends a link himself.**
   On my `appointment.held { source: 'consultant' }` + `appointment.greeting_sent { appointmentId, text }` (additive), notifications sends the
   greeting, then finance creates the appointment payment link and notifications sends it automatically. Reminders after that are his own
   warm WhatsApp (no link).
2. **WhatsApp Business limits:** a free-text, editable greeting can only go as a *session* message (client wrote in the last 24 h). Otherwise it
   must be an approved template — propose `booking_greeting` with variables {first_name, type, date, time, mode} + one optional
   personal line, and `payment_link_appointment`. Please own the template approvals (D-07).
3. **Other templates the consultant app triggers:** `checkin_form_ask`, `drops_nudge` (gentle, no shaming), `intake.draft_abandoned` reminder,
   `intake.safety_flagged` (Jitu Bhaiya only, priority, no client name on the lock screen — D-38).
4. **Settings (typed keys):** `remedy.reorder_price`, `policy.reschedule`, `consultant.weekly_goal` (default 25), `consultant.lifetime_reach`
   (2,00,000+ shown in "Your impact"), `booking.link_slug` (`jitu-bhaiya`, domain D-12).
5. **Analytics:** "Your impact" uses counts only — people helped, sessions, hours, five-star sessions, came-back %, cities, and counts of the
   feedback "felt" tags. Fine for the owner to see the same aggregates (D-33); never individual answers or notes.
6. **Decisions to record (HUB/owner):** D-36 AI summary no longer optional (client chat); all blends alcohol-free; AI requests leave India
   (Anthropic API) — legal OK + consent text.
---
Reply (OWNER, 2026-11-18): **ACCEPTED** — spec in `docs/specs/owner/08-BOOKING-GREETING-AND-AUTOPAY.md`; builds in O3 (notifications) + O2 (finance) once the foundation lands.
1. Flow accepted as written. Notifications `@handles appointment.greeting_sent` → sends the greeting → finance creates the link (internal `createAppointmentPaymentLink`, `system` role only — staff can't call it) → `payment_link_appointment` sent automatically. If the greeting isn't delivered, the link is **not** sent and you get "Greeting not delivered". Please add `source` + `holdHours` to `holdAppointment` and emit `appointment.greeting_sent { appointmentId, text, by }` (additive); remove any "send link" button for appointments.
2. Session text inside the 24 h window, otherwise `booking_greeting` {first_name, sender, type, date, time, mode, optional line ≤160 chars, no URLs} + `payment_link_appointment`. OWNER owns Meta approvals (D-07). Your composer should show the template preview when free text can't be used (we'll expose `notifications.getWhatsAppWindow(clientId): { open: boolean; closesAt? }`).
3. `checkin_form_ask`, `drops_nudge` (opt-in, quiet hours, no shaming), `intake_unfinished_24h` (once, 24 h after last draft edit), safety alert = push + in-app to Jitu Bhaiya only, lock screen "BeWise: a client needs your attention — open the app" (no name, no answer text) — 08 §4.
4. Typed keys added in `06-SETTINGS-KEYS.md`: `remedy.reorder_price` (null ⇒ reorder disabled), `policy.reschedule` `{ freeHoursBefore: 24, maxFreeReschedules: 3, lateReschedulesAllowed: 1, noShow, refunds:'none' }`, `consultant.weekly_goal` (25), `consultant.lifetime_reach` (2,00,000+), `booking.link_slug` (`jitu-bhaiya`, domain D-12), plus `booking.staff_hold_hours` (24).
5. `analytics.getConsultantImpact({ consultantId, period })` → counts only (people helped, sessions, hours, five-star, came-back %, cities, felt-tag counts hidden under 5 answers, lifetime reach). Owner sees the same totals on OW-05; never answers or notes.
6. Passed to HUB: `20261118-owner-to-hub-decisions-ai-blends-contrast.md`.
Owner questions raised (08 §6): cash/complimentary staff bookings (default no) · 24 h staff hold · sender number.
