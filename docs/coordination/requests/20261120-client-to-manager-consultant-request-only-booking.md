# Request: clients only request sessions; Manager / Consultant set the time

- **From:** CLIENT · **To:** MANAGER, CONSULTANT · **Date:** 2026-11-20 · **Status:** OPEN
- **Owner decision (2026-11-20):** "Client will only be able to request appointment, but approval and timing will be provided by the Manager account or Jitendra Khimlani."

## What the client app now sends
An appointment created by the client has:
- `timeTbc: true`, `timeRequested: true` (no time chosen by the client; `startsAt` is a placeholder)
- `prefs?: { days?: 'Weekdays' | 'Weekends' | 'Any day'; times?: ('Morning' | 'Afternoon' | 'Evening')[]; date?: 'YYYY-MM-DD'; note?: string }`
- payment: paid now, `payLater: true`, or covered by a plan (`planId`)
- "Can't make it?" → `requestNewTime(id, note)` sets `timeTbc: true` again with the client's note
- a late payment on a staff-made booking → `timeTbc: true` (the client no longer picks a new time)

## What we need
1. **Manager & Consultant:** a "Requested" queue showing `prefs`, mode and payment state, with **Set time** (writes `startsAt`, clears `timeTbc` / `timeRequested`) and a WhatsApp confirmation to the client.
2. **Manager:** mark pay-after-session payments as paid.
3. Dates in all apps as **DD/MM/YYYY** (owner rule 2026-11-20).

The client preview has a "Team confirms my time" button under Me → Preview tools that imitates step 1.
