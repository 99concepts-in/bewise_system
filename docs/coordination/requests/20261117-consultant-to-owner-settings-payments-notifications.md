# Request: settings keys, payment payloads and notification templates for scheduling, intake & remedies
From: CONSULTANT · To: OWNER · Priority: P1 · Status: ACCEPTED

1. **Settings keys** (typed in `getSetting`): `remedy.reorder_price` (paise; Give remedy for reorders is disabled until set), `policy.reschedule` (`{ freeHours: 24, maxFree: 3 }` — D-08), `privacy.intake_retention_months`.
2. **O-09 consultation types** call `scheduling.upsertConsultationType(input)`; input = `{ id?, code, name, durationMin, feePaise, modesAllowed, intakeRequired: 'first'|'followup'|'none', eligibility, active, sort }`. Seed: first ₹1,000 / 60 min, follow-up ₹800 / 30 min (D-09).
3. **Payments**: `payment.captured` / `payment.failed` must carry `appointmentId` for appointment checkouts. Checkout should be created only for `pending_payment` appointments and use `amountPaise` from `holdAppointment`. CN-15 "WhatsApp payment link" needs a payment link for an appointment (24 h hold) — `createCheckout({purpose:'appointment'})` + a link variant, or `createPaymentLink` for appointments.
4. **Notifications** templates consuming my events: `appointment.held/confirmed/rescheduled/cancelled/no_show/expired/needs_new_time`, `session_feedback.submitted` (to consultant), `remedy.given` (to client), `client_summary.shared`, `followup.due`, and **`intake.safety_flagged` → consultant ONLY, priority push + in-app, lock-screen text without client name** (D-38).
5. Open business questions: can Jitu Bhaiya confirm a booking paid in cash / complimentary? (default: no). Calendar event titles show client first name + initial? (default: yes, switchable).
---
Reply (OWNER, 2026-11-18): **ACCEPTED.**
1. Keys in `06-SETTINGS-KEYS.md`: `remedy.reorder_price` (paise | null ⇒ disabled), `policy.reschedule` (now `{ freeHoursBefore: 24, maxFreeReschedules: 3, lateReschedulesAllowed: 1, noShow: 'forfeit', refunds: 'none' }`), `privacy.intake_retention_months` (null until owner + lawyer decide).
2. OW-23 will call `scheduling.upsertConsultationType` with exactly that input; seed First ₹1,000 / 60 min, Follow-up ₹800 / 30 min, `includesRemedy` via D-02.
3. Yes: `payment.captured` / `payment.failed` always carry `appointmentId` for appointment purposes; checkout only for `pending_payment` holds, amount from the hold. Payment links for staff bookings are sent **automatically** by BeWise (08) — no manual CN-15 link.
4. Templates accepted (05 + 08). `intake.safety_flagged` → consultant only, priority push + in-app, no name on the lock screen (D-38).
5. Cash/complimentary confirm: default **no** (owner question in 08 §6). Calendar titles first name + initial: fine from the finance/notifications side.
