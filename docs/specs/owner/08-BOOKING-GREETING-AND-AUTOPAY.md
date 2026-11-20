# 08 — Staff bookings: greet first, payment link sent automatically (owner rule 2026-11-18)

> **Owner:** OWNER chat · modules `notifications` + `finance` · answers `requests/20261118-consultant-to-owner-greeting-autopay-settings.md`.
> Related: `04-RAZORPAY-FLOW.md` (payment links), `05-REMINDERS-AND-WHATSAPP.md` (templates), `06-SETTINGS-KEYS.md`.

## 1. The rule
When **Jitendra Khimlani or Haresh** books someone (CN-15, MG-12):
1. They **greet and confirm** first, in their own words.
2. **BeWise** then creates the appointment payment link and **sends it automatically**.
3. **Staff never send payment links themselves.** No "copy payment link" or "send link" button exists for appointments in `/consult` or `/ops`.
4. Later nudges from Jitendra Khimlani are his own warm WhatsApp messages and never contain a link. Payment reminders with the link come only from BeWise.

Client self-bookings (C2) are unchanged: they pay in the app via checkout (`04` §2).

## 2. Sequence
```
CONSULTANT/MANAGER                      notifications (OWNER)                         finance (OWNER)
holdAppointment(... source:'consultant'|'manager', holdHours: 24)
 → emit appointment.held {appointmentId, clientId, source, holdExpiresAt}
greeting composer (editable text)
 → emit appointment.greeting_sent {appointmentId, text, by}   ← additive event (CONSULTANT)
                                  @handles appointment.greeting_sent
                                  1. send greeting (channel rules §3)
                                  2. on provider "sent" (or after 2 min if no status yet)
                                     → finance.createAppointmentPaymentLink(appointmentId) ──▶ Razorpay Payment Link
                                                                                              amount = hold amountPaise
                                                                                              expire_by = holdExpiresAt
                                                                                              reference_id = intent id
                                  3. send template payment_link_appointment {link}
                                  4. schedule reminders: −6 h before hold expiry (link again, max 1)
Client pays ── webhook payment_link.paid ──▶ runCapture(purpose 'appointment') → invoice + receipt
                                            → payment.captured {appointmentId} → scheduling confirms
                                            → booking_confirmed template (05 §3)
Hold expires unpaid → scheduling emits appointment.expired → link cancelled → staff see "Not paid — hold released"
```
- **Idempotent:** dedupe keys `greet:{appointmentId}`, `paylink:{appointmentId}`. Replays send nothing twice. A reschedule before payment updates the same link's expiry. It never sends a second link unless the amount changed.
- **Greeting failed** (no WhatsApp consent, bad number, provider error): the link is **not** sent. Staff see "Greeting not delivered — check the number". Email fallback for both only if the client has an email.
- **Cash or complimentary bookings by staff:** not allowed by default (no `confirmWithoutPayment`). This is an owner question below.

`finance.createAppointmentPaymentLink(appointmentId): Promise<Result<{ url: string; expiresAt: string }>>` is **internal** and is called by notifications only. Permission `finance.paylink.appointment.create` is held only by the `system` role. Staff can't call it.

## 3. WhatsApp channel rules (Meta, D-07)
| Situation | What we send |
|---|---|
| Client messaged us in the **last 24 h** (open session) | Greeting as **free text**: the staff member's edited words exactly, then the link as a session message |
| Otherwise | Template `booking_greeting` with variables + one optional personal line (≤ 160 chars, no URLs, no prices). The editor shows a preview of what the client will get and tells staff when their free text can't be used |
| No WhatsApp consent | Email if available, else staff see "Can't message this person on WhatsApp yet" |

The session window is tracked from inbound webhook messages (`whatsapp_sessions.last_inbound_at`).

## 4. Templates (submitted for approval by OWNER — D-07)
Additions to `05-REMINDERS-AND-WHATSAPP.md` §3. Category utility unless noted. Variables in `{{n}}`.

| Template | Body (draft) | Variables | Button |
|---|---|---|---|
| `booking_greeting` | Hi {{1}}, this is {{2}} from BeWise. 🌿 Your {{3}} is booked for {{4}} at {{5}} ({{6}}). {{7}} | first_name, sender (Jitendra Khimlani / Haresh), type, date, time, mode (online / at the studio), optional personal line ("" allowed) | — |
| `payment_link_appointment` | Hi {{1}}, to confirm your {{2}} on {{3}}, please complete the payment of ₹{{4}}. The slot is held for you until {{5}}. | first_name, type, date-time, amount, hold expiry | Pay now (URL) |
| `checkin_form_ask` | Hi {{1}}, before your follow-up on {{2}}, a 2-minute check-in helps Jitendra Khimlani prepare. | first_name, date | Start check-in |
| `drops_nudge` | Hi {{1}}, a gentle reminder for your blend today: {{2}} drops, {{3}} times. Small steps count. 🌿 | first_name, drops, times | Open my ritual |
| `intake_unfinished_24h` | Hi {{1}}, your answers are saved. Whenever you're ready, you can finish them in a few minutes. | first_name | Continue |

Tone check (brand §7): no shaming, no urgency words ("last chance", "failed"), no medical claims. `drops_nudge` respects quiet hours and is opt-in (`notification_preferences.ritual_reminders`).

**Safety alert (`intake.safety_flagged`, D-38):** push + in-app to **Jitendra Khimlani only**, priority. The lock-screen text is **"BeWise: a client needs your attention — open the app"**, with **no client name and no answer text**. Details show only after unlock and sign-in. It's never sent on WhatsApp, email or SMS, and never to the owner or Haresh.

## 5. "Your impact" numbers (CN-30 area, D-33)
`analytics.getConsultantImpact({ consultantId, period: 'month' | 'year' | 'all' })` → **counts only**:
`peopleHelped, sessions, hours, fiveStarSessions, cameBackPct, cities, feltTags: { tag: string; count: number }[], lifetimeReach` (from `consultant.lifetime_reach`).
- Built on analytics views over appointments, `session_feedback` (rating + tags only) and client city. **No** notes, intake answers, feedback free text or names.
- `feltTags` counts are hidden when fewer than 5 responses ("Not enough answers yet").
- The owner sees the same totals on OW-05 (`analytics.clinical_aggregate.view`). Individual answers are never shown to anyone but Jitendra Khimlani.

## 6. Owner questions
1. Can staff confirm a booking as **cash paid** or **complimentary** (no link)? Default: no.
2. Hold time for staff bookings: **24 h** (proposed by the consultant chat) vs 15 min for self-booking — confirm.
3. Should the greeting go out from the **business WhatsApp number** (default) or does Jitendra Khimlani want his own number shown as sender? (Only the business number can use templates.)
