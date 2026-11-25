# Request: "took my drops", feedback "what you felt", booking link, consultant-made bookings
From: CONSULTANT · To: CLIENT · Priority: P1 · Status: DONE (client preview) — real calls wire up when FOUNDATION ✅
Owner asked for these in the consultant app (2026-11-18); see the live preview `preview/consultant/` and `prototypes/consultant-app/README.md`.

1. **Daily "Took my drops" tick** on My Remedies (CL-26) and Home: one tap per day (Yes / Not today), editable for 2 days back.
   Calls `logDrops({ date: 'YYYY-MM-DD', taken: boolean })` (remedies module, mine — new, additive). Jitendra Khimlani sees % of days, streak,
   14-day strip and can nudge on WhatsApp. Client copy must not shame ("Not today is fine — tomorrow is a new day").
2. **Session feedback (CL-23) adds "How do you feel after the session?"** — multi-select chips, client's own words:
   Calmer · Felt heard · Sleeping better · Lighter · Clearer mind · More confident · Less anxious · More hopeful · More patient · More energy · At peace · More connected.
   `submitSessionFeedback` gains `benefits?: string[]` (additive). Shown to him as "What people said they felt" — never as a BeWise claim.
3. **Public booking link** `…/book/jitendra-khimlani` (+ `?type=first|followup`) — he shares it from the app (WhatsApp, QR at workshops).
   MANAGER needs the same deep link. Domain pending D-12.
4. **Bookings made by the consultant/manager** arrive as `awaiting_payment` with `source: 'consultant'`. The client first gets his WhatsApp
   greeting, then BeWise sends the payment link automatically (OWNER). The payment page must accept these appointments (no slot picking).
5. **Check-in form (IN-12)** — his Today shows "Check-in form filled 4 days ago" / "No check-in yet · Ask". His "Ask" WhatsApp needs a
   deep link: `…/app/checkin?appointment=<id>`.
Workaround meanwhile: prototype uses demo data.
---
Reply (CLIENT, 2026-11-18): **All 5 built in `apps/client` (preview, on-device store) — tests in `apps/client/tests/flows.spec.ts`.**
1. **Drops tick** — `DropsTick` on Home ("Your blend" card) and My Remedies: "Took your drops today?" **Yes, took them / Not today**; yesterday and the day before stay editable; My Remedies adds a 14-day strip ("You took them on 9 of the last 12 days you logged. Every day counts."). Copy never shames ("Not today — that’s okay. Tomorrow is a new day."). Store action mirrors `logDrops({ date: 'YYYY-MM-DD', taken })` 1:1 — swap to your function when live.
2. **Feedback** — CL-23 adds "How do you feel after the session?" with your 12 chips (same list, `BENEFITS` in `lib/data.ts`); sent as `benefits[]` alongside rating/tags/notes.
3. **Booking link** — `/book/jitendra-khimlani?type=first|followup`: signed-in → straight into booking with that type; new visitor → short welcome (photo, fee incl. blend, online / Alkapuri) → sign-in → onboarding → back into booking (type kept). Works under any domain/base path, so QR codes can point at it once D-12 is set.
4. **Bookings made by you / Haresh** — `/app/pay?appointment=<id>` (the target of OWNER's automatic payment link): "Jitendra Khimlani booked this for you", date/time/mode fixed, Pay — **no slot picking**. Home leads with "Complete your booking". Point 8 handled: paid after the hold expired → "Payment received — pick a new time" + time picker, no cost → confirmed. Appointment fields used: `status 'awaiting_payment' | 'expired'`, `source`, `needsNewTime`, `paidAt`.
5. **Check-in deep link** — `/app/checkin?appointment=<id>`: IN-12 (now / better·same·harder / anything new + drops), all optional, saved per appointment (`submitCheckin({ appointmentId, answers })`); the session screen then shows "Check-in shared ✓" (or a "2-minute check-in" card if not yet filled) — your Today can read "filled N days ago".
Also adopted from your prototype: AA muted `#5F667A`, instant skeleton, idle prefetch of other screens, 11-size overflow + axe suite (40 tests green).
---
