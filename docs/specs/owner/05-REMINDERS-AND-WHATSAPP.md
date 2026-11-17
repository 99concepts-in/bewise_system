# 05 — Notifications, reminder schedules & WhatsApp templates (draft)

> **Owner:** OWNER chat · modules `notifications` + `finance` (payment reminders) · routes `api/webhooks/whatsapp/**`,
> `api/cron/reminders/**`. Provider: Meta WhatsApp Cloud API or a BSP (D-07 open). Email: Resend/SES (D-12 open).
> Until credentials exist, the **console transport** logs messages and OW-24 shows "Not set up". Nothing claims "sent" unless
> a provider accepted it.

## 1. Engine in one picture
```
domain event ─▶ notifications handler ─▶ rule (who, which template, when)
                                         ├─ now  → notification_deliveries (queued)
                                         └─ later → reminder_schedules row (due_at)
cron /api/cron/reminders (every 5 min) ─▶ due rows ─▶ checks (still relevant? consent? quiet hours? dedupe?)
                                         ─▶ channel transport (in_app | email | whatsapp | push)
provider webhook (/api/webhooks/whatsapp) ─▶ delivery status sent/delivered/read/failed ─▶ reminder_log / deliveries
```
- **Relevance check at send time.** Every scheduled reminder re-reads its source (appointment still confirmed? invoice still unpaid?). If no longer relevant → `skipped` with reason. This is how "reminders stop when paid" works.
- **Dedupe:** `dedupe_key` (e.g. `appt:{id}:24h`) is unique → one message, however many times an event replays.
- **Consent:** WhatsApp only if `crm.consent_records` has `whatsapp = granted`. Email for transactional messages always. Marketing needs explicit consent. Opt-out keywords (STOP) via webhook → consent revoked.
- **Quiet hours** 21:00–08:00 IST: messages wait until 08:00, except appointment reminders due within 2 h and OTPs.
- **Language:** English v1. Gujarati/Hindi templates can be added per template (`language` column). *Owner question.*

## 2. Reminder schedules (defaults — `reminders.schedule` setting, owner-editable on OW-23)

| Flow | Audience | When | Channels | Stops when |
|---|---|---|---|---|
| Booking confirmed | client | on `appointment.confirmed` | WhatsApp + email + in-app | — |
| Appointment reminder | client | **24 h** and **1 h** before (`startsAt`) | WhatsApp + in-app (email at 24 h) | cancelled / rescheduled (re-scheduled for the new time) |
| Online link | client | in the 1 h reminder | WhatsApp | — |
| Consultant day plan | Jitu Bhaiya | 07:30 IST daily | in-app + push | — |
| Payment failed | client | 15 min after `payment.failed`, if the hold is still valid | WhatsApp + in-app | paid / hold expired |
| Invoice issued (manual) | client | on `invoice.issued` (not for auto-paid ones) | WhatsApp + email (PDF link + pay link) | — |
| **Payment reminders** (J5) | client | **−2 d, 0 d (due day), +3 d, +7 d**, then every 7 d up to **+30 d** | WhatsApp + email | paid / disputed / owner pauses |
| Overdue > 30 d | Haresh (+ owner in daily summary) | +30 d | in-app | paid |
| Remedy dispatched | client | `shipment.dispatched` | WhatsApp + in-app | — |
| Delivered | client | `shipment.delivered` | in-app | — |
| Feedback request | client | 2 h after `appointment.completed` | in-app + WhatsApp | feedback submitted |
| Follow-up due | client + Jitu Bhaiya | `followup.due` | WhatsApp + in-app | booked |
| Remedy reorder nudge | client | when the blend has ≈ 5 days left (from CL-26 ritual) | in-app (+ WhatsApp if marketing consent) | reordered |
| Supplier bill due | Haresh | −3 d, 0 d | in-app | paid |
| Expense submitted | owner | `expense.submitted` | push + in-app (OW-03, OW-13) | decided |
| Expense decided | submitter | `expense.approved/rejected` | in-app | — |
| Low stock / failed delivery | Haresh (+ owner alert tile) | `stock.low`, `shipment.failed` | in-app | — |
| Daily summary | owner | 20:00 IST | push + in-app | — |
| Safety flag | **Jitu Bhaiya only** (D-38) | `intake.safety_flagged` | push + in-app, priority | — never to owner |

## 3. WhatsApp templates (submitted to Meta for approval)
Category **utility** unless noted. `{{n}}` = variables. Buttons: URL buttons point to `https://{domain}/app/...` deep links (D-12).
Tone: warm, short, no medical claims (brand guide §7).

| Template | Body | Vars | Button |
|---|---|---|---|
| `booking_confirmed` | Hi {{1}}, your {{2}} with Jitu Bhaiya is confirmed for {{3}}. We look forward to seeing you. 🌿 | name, type, date-time | View booking |
| `appointment_reminder_24h` | Hi {{1}}, a gentle reminder: your {{2}} is tomorrow at {{3}}. Need to change it? You can reschedule in the app. | name, type, time | Manage booking |
| `appointment_reminder_1h_online` | Hi {{1}}, your session starts at {{2}}. Join here: {{3}} | name, time, link | — |
| `appointment_reminder_1h_in_person` | Hi {{1}}, see you at {{2}} today at {{3}}. | name, place, time | Directions |
| `appointment_rescheduled` | Hi {{1}}, your session has moved to {{2}}. | name, date-time | View booking |
| `payment_failed_retry` | Hi {{1}}, your payment didn't go through — nothing was charged. Your slot is held until {{2}}. | name, time | Try again |
| `payment_received` | Thank you {{1}}. We received ₹{{2}} for {{3}}. Receipt {{4}}. | name, amount, purpose, receipt no. | View receipt |
| `invoice_issued` | Hi {{1}}, invoice {{2}} for ₹{{3}} is ready. Due {{4}}. | name, inv no., amount, date | Pay now |
| `payment_reminder_due` | Hi {{1}}, a gentle reminder that invoice {{2}} for ₹{{3}} is due {{4}}. | name, inv no., amount, due | Pay now |
| `payment_reminder_overdue` | Hi {{1}}, invoice {{2}} for ₹{{3}} is now {{4}} days past due. If you've already paid, please ignore this. | name, inv no., amount, days | Pay now |
| `remedy_dispatched` | Hi {{1}}, your {{2}} is on its way with {{3}}. Track: {{4}} | name, item, courier, link | Track |
| `feedback_request` | Hi {{1}}, how did today's session feel? Two taps help Jitu Bhaiya care for you better. | name | Share feedback |
| `followup_due` | Hi {{1}}, it's time for your follow-up with Jitu Bhaiya. Book a time that suits you. | name | Book follow-up |
| `remedy_reorder_nudge` — **marketing** (Meta may reclassify) | Hi {{1}}, your blend has about {{2}} days left. Reorder in one tap. | name, days | Reorder |
| `otp_login` — **authentication** (HUB / SMS provider D-04) | {{1}} is your BeWise code. | code | Copy code |

Staff messages (owner, Haresh, Jitu Bhaiya) use **in-app + web push**, not WhatsApp, in v1. No template approval is needed and there are no per-message costs.

**Meta rules to respect:** templates are needed outside the 24-hour customer-service window; free-form text only inside it. Pricing is per message by category *(verify current Meta pricing at setup)*. Utility templates must not contain promotional content, or Meta reclassifies them as marketing.

## 4. Tables
`notification_templates (key, channel, language, provider_template_name, category, body, variables, status draft/submitted/approved/rejected)` ·
`notification_events (event_id, rule_key, created_at)` · `notification_deliveries (id, to, channel, template, data, status queued/sent/delivered/read/failed/skipped, provider_message_id, error, dedupe_key unique)` ·
`notification_preferences (profile_id, channel, category, enabled)` · `reminder_schedules (id, kind, source_type, source_id, due_at, dedupe_key unique, status pending/sent/skipped/cancelled)` ·
`reminder_log (id, invoice_id?, schedule_id, channel, delivery_id, sent_at)` → emits `reminder.sent`.

## 5. Manager's "Send reminder" (MG-24, `finance.sendReminder`)
Manual send = same template as the next due step, preview shown first. It is rate-limited to **one per invoice per 24 h** (owner can override) and logged in `reminder_log` with `by = Haresh`. A disputed invoice blocks reminders.
