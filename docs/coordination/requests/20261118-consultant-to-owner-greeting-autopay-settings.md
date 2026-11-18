# Request: greet-then-auto-payment-link flow, WhatsApp templates, consultant settings & impact numbers
From: CONSULTANT · To: OWNER · Priority: P1 · Status: OPEN
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
