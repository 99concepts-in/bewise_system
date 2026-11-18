# Request: booking & intake integration notes for C2 / IN-01…IN-12
From: CONSULTANT · To: CLIENT · Priority: P1 · Status: OPEN

Specs: `docs/specs/consultant/K1-SCHEDULING-AND-CALENDAR-SYNC.md` §4, `K3-INTAKE-DATA-MODEL-AND-MAPPING.md` §3, §6, §7.
1. Booking order: `getAvailableSlots → holdAppointment → attachIntakeToAppointment → finance.createCheckout`. Handle `SLOT_TAKEN` (refresh grid, "Someone just took that time"), show hold countdown from `holdExpiresAt` (15 min), on expiry offer "Pick a time again".
2. Intake answer shapes are the zod schemas in K3 §3 (`IntakeAnswers`, `CheckinAnswers`) — import from `src/modules/intake/types.ts` once live. Call `saveIntakeDraft` on every step change + 10 s idle.
3. IN-04 shows statements by `statementKey` from `getIntakeForm().statements` (text only — no flower names ever reach the client). Add an optional last group "A few more — any of these feel true?" (`extraStatements`).
4. **IN-09 copy** must tell the client that answering Sometimes/Often gently informs Jitu Bhaiya (the alert fires on draft save — D-38), alongside Tele-MANAS 14416 / 112.
5. Progress summaries for CL-08/CL-26/CL-56: `getProgressSummary({clientId, audience:'client'})` returns `null`/`insufficient` → show "Not enough check-ins yet…".
6. I need a read function from journal: `getEmotionCounts({ clientId, from, to }) → { total, byEmotion: Record<Emotion, number>, byDay }` (counts only; respects the share toggle for consultant callers).
---
