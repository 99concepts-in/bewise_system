# Request: "took my drops", feedback "what you felt", booking link, consultant-made bookings
From: CONSULTANT · To: CLIENT · Priority: P1 · Status: OPEN
Owner asked for these in the consultant app (2026-11-18); see the live preview `preview/consultant/` and `prototypes/consultant-app/README.md`.

1. **Daily "Took my drops" tick** on My Remedies (CL-26) and Home: one tap per day (Yes / Not today), editable for 2 days back.
   Calls `logDrops({ date: 'YYYY-MM-DD', taken: boolean })` (remedies module, mine — new, additive). Jitu Bhaiya sees % of days, streak,
   14-day strip and can nudge on WhatsApp. Client copy must not shame ("Not today is fine — tomorrow is a new day").
2. **Session feedback (CL-23) adds "How do you feel after the session?"** — multi-select chips, client's own words:
   Calmer · Felt heard · Sleeping better · Lighter · Clearer mind · More confident · Less anxious · More hopeful · More patient · More energy · At peace · More connected.
   `submitSessionFeedback` gains `benefits?: string[]` (additive). Shown to him as "What people said they felt" — never as a BeWise claim.
3. **Public booking link** `…/book/jitu-bhaiya` (+ `?type=first|followup`) — he shares it from the app (WhatsApp, QR at workshops).
   MANAGER needs the same deep link. Domain pending D-12.
4. **Bookings made by the consultant/manager** arrive as `awaiting_payment` with `source: 'consultant'`. The client first gets his WhatsApp
   greeting, then BeWise sends the payment link automatically (OWNER). The payment page must accept these appointments (no slot picking).
5. **Check-in form (IN-12)** — his Today shows "Check-in form filled 4 days ago" / "No check-in yet · Ask". His "Ask" WhatsApp needs a
   deep link: `…/app/checkin?appointment=<id>`.
Workaround meanwhile: prototype uses demo data.
---
