# Booking wizard — CL-11…CL-17 (+ CL-53 payment issues)

> **Owner:** CLIENT chat · Milestone **C3** (with intake) · Status: **DRAFT v0.1 (2026-11-17)**
> Boards: `CL4-board-05-choose-consultant-mode.jpg`, `CL4-board-10-time-pay-booked.jpg`, `CL4-board-21` (payment issue). Intake screens: `C3-intake-IN-01-IN-12.md`.
> Decisions: D-02/D-09 fees incl. remedy · D-08 reschedule-only · D-16 no refunds · D-35 intake before first booking · D-31/CL-58 add to calendar.
> Contracts: `scheduling.*`, `intake.*`, `finance.createCheckout/verifyCheckout` (`docs/03-CONTRACTS.md` §5).

## 1. Flow

```
FIRST       CL-11 Choose ─(first time only)→ CL-12 Meet Jitendra Khimlani → IN-01…IN-11 Intake → CL-13 Online/In person
            → CL-14 Date & time ─[holdAppointment + attachIntake]→ CL-16 Review & pay ─[Razorpay]→ CL-17 You're booked
FOLLOW-UP   CL-11 Choose (Follow-up) → IN-12 Check-in (3 steps) → CL-13 → CL-14 ─[hold]→ CL-16 → CL-17
```
- Entry points: nav **Book** (centre), Home contextual cards, CL-07 "Book your first consultation", CL-24 "Book follow-up", Ask BeWise "Book a follow-up" chip, public `/consultations` (→ sign-in → `/app/book`).
- **Stepper** (3 dots, boards): ① Your answers (intake/check-in) ② Time (mode + date/time) ③ Pay. Intake has its own "Step n of 8" bar inside ①.
- Back always works and never loses answers. Leaving the wizard keeps the intake draft (server) and releases nothing (hold expires on its own).
- CL-15 "Anything you'd like to share?" is **folded into IN-02b** (spec §N) — not a separate screen.

## 2. Screens

### CL-11 Choose consultation — `/app/book`
| Element | Spec |
|---|---|
| Headline | "Book a *session*" |
| Card A | **First consultation** · "60 min · ₹1,000" · "A gentle, unhurried conversation about how you've been feeling. **Your personal remedy blend is included.**" |
| Card B | **Follow-up** · "30 min · ₹800" · "See how you're doing and refresh your blend. **Blend included.**" — shown only if the client has ≥ 1 `completed` appointment; otherwise hidden (not disabled) |
| Row | "Meet Jitendra Khimlani" → CL-12 · "Online or in person — you choose next" caption |
| Data | `scheduling.listConsultationTypes({activeOnly:true})` → name, durationMin, feePaise, modesAllowed. **Display only**; price charged = `holdAppointment().amountPaise` |
| Guards | If an unpaid hold exists → banner "You have a time held until 11:12 — Finish booking" (→ CL-16). If a confirmed upcoming appointment of the same kind exists → soft note "You're already booked for Thu 21 Nov" + still allowed |
| Flag | `booking` off → page shows "Online booking opens soon — WhatsApp us to book" with WhatsApp deep link (no dead CTA) |

### CL-12 Meet your consultant — `/app/book/consultant` (also linked from Help, CL-19)
Real photo `design/assets/people/jitu-bhaiya-portrait.jpg` (alt "Jitendra Khimlani, smiling"). Name **Jitendra Khimlani — "Jitendra Khimlani"**, **Bach Remedy Therapist**, 2-line approach (owner to approve, draft: "Jitendra Khimlani listens first. Then he prepares a blend of Bach flower essences chosen for how *you* feel."), "12+ years guiding workshops · 2,00,000+ people", languages (**⏳ owner**), "How Bach remedies work" mini card (plays `design/motion/how-bach-remedies-work-9x16.mp4`, muted, poster frame, captions), testimonials carousel **only when consented testimonials exist** (CONTENT-CHECKLIST #1 — otherwise section absent), quiet link "Visit his website ↗" (www.jitendrakhimlani.com, `rel="noopener"`). CTA **Continue**. Shown automatically once to first-time bookers (`seen_consultant_intro` on profile prefs), otherwise via link.

### CL-13 Online or in person — `/app/book/mode`
Two choice cards (radio): **Online** "Video call · link shared after booking" · **In person** "At the BeWise studio, Vadodara" + address (**⏳ CONTENT-CHECKLIST #7**; until supplied, In person card shows "Address shared after booking"). Only modes in `modesAllowed`. CTA Continue.

### CL-14 Date & time — `/app/book/time`
| Element | Spec |
|---|---|
| Month header | "November 2026" with ‹ › (max 8 weeks ahead) |
| Week strip | Mon–Sun circles; selected = navy filled; days without slots = muted + `aria-disabled` |
| Slots | Grouped **Morning** (< 12:00) / **Afternoon** (12–17) / **Evening** (≥ 17) as pills, 2 per row; empty group hidden; none at all → "No times this day — try Thu 21" (next available) |
| Caption | "Times in IST" |
| Data | `scheduling.getAvailableSlots({ consultationTypeId, mode, from, to })` for the visible week; prefetch next week |
| CTA | **Continue** → `holdAppointment({ clientId, consultationTypeId, mode, startsAt, clientNote })` where `clientNote` = IN-02b text **only if** client chose "Share with my consultant" (it is already in intake; pass `undefined` to avoid duplicating — see request to CONSULTANT) → then `attachIntakeToAppointment({ intakeId, appointmentId })` → CL-16 |
| Errors | `SLOT_TAKEN` → CL-53 variant B inline: "That time was just taken — here are the nearest times" (refresh slots, keep day) · network → "Couldn't hold this time — Try again" |

### CL-16 Review & pay — `/app/book/review?appointmentId=`
| Element | Spec |
|---|---|
| Consultant row | Photo · "Jitendra Khimlani" · "Bach Remedy Therapist" |
| Rows | type · "Thu 21 Nov · 11:00 AM" · "Online · 60 min" (icons as board) · "Your answers · shared ✓" (link back to IN-11) |
| Included | Sage chip "Remedy blend included" |
| Policy | Info card: "Sessions are non-refundable — you can reschedule free up to 24 h before." (D-08; window from `getSetting('policy.cancellation')`) + link "Booking policy" |
| Hold timer | "We're holding this time for **14:32**" (from `holdExpiresAt`, server time-synced) |
| Total | "Total **₹1,000**" from `amountPaise` (GST note "incl. GST" if finance config says so) |
| CTA | Gradient pill with lock "**Pay ₹1,000**" + "Secured by Razorpay · UPI, cards, netbanking" |

**Payment sequence**
1. `finance.createCheckout({ purpose:'appointment', refId: appointmentId })` → `{ razorpayOrderId, keyId, amountPaise, prefill }`. If `amountPaise` ≠ displayed amount → re-render with server amount and ask to confirm (never silently charge a different amount).
2. Open Razorpay Checkout.js (`order_id`, `key`, `prefill.contact/name`, `theme.color #182957`, `method` default UPI first, `modal.ondismiss` → stay on CL-16, timer continues).
3. `handler(response)` → `finance.verifyCheckout(...)` → show "Confirming your payment…" (owl, no "paid" text yet).
4. Poll `scheduling.getAppointment(id)` every 2 s (max 60 s) or subscribe to realtime until `status = 'confirmed'` (set by scheduling on `payment.captured` webhook — **webhook is source of truth**). Then → CL-17.
5. Still pending after 60 s → "Payment received, confirming with the bank. We'll notify you — you don't need to pay again." + View appointment. Never offer "Pay again" while a payment is `authorized/created`.

Flag `checkout` off (dev/preview): stub `createCheckout` returns `{ stub:true }` → "Simulate payment" button visible **only** in non-production builds.

### CL-17 You're booked — `/app/book/confirmed/[appointmentId]`
Headline "You're *booked*", mascot (celebrating), card "Thursday, 21 November · 11:00 AM · Online with Jitendra Khimlani". Buttons: **View appointment** (CL-19) · **Add to calendar** (CL-58: action sheet → Google Calendar link / Apple & others `.ics` download from `/api/app/appointments/[id]/ics`, title "BeWise session with Jitendra Khimlani", location = Meet link placeholder "Link shared in the app" / studio address, alarm −30 min). Line "A receipt is in Payments" and "Jitendra Khimlani will read your answers before you meet." If CL-49 auto-add is on → "Added to your calendar ✓" instead of the button. No refund wording.

### CL-53 Payment issue (variants)
| Variant | Trigger | Copy | Actions |
|---|---|---|---|
| A Failed | Razorpay `payment.failed` / handler error | "Your payment didn't go through. **You haven't been charged** — if money left your account, your bank returns it automatically." | Try again (same hold if valid) · Choose another method |
| B Slot taken | `SLOT_TAKEN` on hold or capture-after-expiry | "That time was just taken." | Nearest 3 times (pills) · Pick another day |
| C Hold expired | timer reaches 0 / `HOLD_EXPIRED` | "Your held time has been released." | Hold it again (re-`holdAppointment` same slot if free) · Pick another time |
| D Paid but slot lost (race) | `payment.captured` on expired hold (scheduling resolves) | "Your payment is safe. We'll move you to the nearest free time or you can pick one — no extra cost." | Pick a time (reschedule flow, fee already paid) |

Variant D needs a scheduling rule — raised in request `20261117-client-to-consultant-booking-intake-contract.md`.

## 3. State machine (client view)
```
choose → [intake|checkin] → mode → time → HOLD(pending_payment, ≤15 min) → checkout_open → verifying → confirmed
                                                     ↘ expired (C)       ↘ failed (A) → checkout_open
```

## 4. Acceptance
- [ ] First booking cannot reach CL-13 without a **submitted** intake (IN-11); follow-up cannot reach CL-13 without a submitted check-in (IN-12) — skippable only if the last intake/check-in is < 7 days old ("Nothing new since 18 Nov? Continue").
- [ ] Amount shown on the Pay button equals server `amountPaise`; e2e asserts ₹1,000 first / ₹800 follow-up with seed data.
- [ ] "Booked" screen only after appointment `confirmed` from server.
- [ ] Hold countdown survives reload; expiry handled without errors.
- [ ] No "refund" string in any booking screen (lint rule / test greps rendered copy).
- [ ] Keyboard + screen reader: stepper announces "Step 2 of 3, Time".

## 5. Events
CLIENT emits none here (scheduling emits `appointment.held/confirmed`, finance emits `payment.*`). Analytics: `booking_step`, `checkout_open{purpose:'appointment'}`, `checkout_result`.
