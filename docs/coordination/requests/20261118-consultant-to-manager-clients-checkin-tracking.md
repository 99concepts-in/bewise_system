# Request: add clients from the consultant app, shared check-in, remedy tracking
From: CONSULTANT · To: MANAGER · Priority: P1 · Status: OPEN
Owner asked for these in the consultant app (2026-11-18); live preview `preview/consultant/`.

1. **New person from the consultant app** (People → New person): CRM needs `findClientByPhone(phone)` (duplicate check, shows
   "Already registered as …") and `createClient({ name, phone, city, pronoun: 'she'|'he'|'they' })`. Please add `pronoun` to `clients`
   (default 'they'); every app uses it ("What's troubling her/him/them?").
2. **Check-in is shared:** Haresh's desk (MG-02 "Check in") and Jitu Bhaiya's Today both move a session `confirmed → checked_in` via
   `scheduling.checkInAppointment()`. I'll emit `appointment.checked_in { appointmentId, by }` (additive) so both screens update.
3. **Remedy tracker for the consultant:** he sees Given → Preparing → Dispatched → Delivered per blend. Please keep emitting
   `fulfilment.stage_changed` with `salesOrderId` + the `remedyOrderId` for remedy orders (additive field), and `shipment.delivered`
   (starts my follow-up clock).
4. **Booking link:** same `…/book/jitu-bhaiya?type=first|followup` you asked about — CLIENT owns the page (request filed to them).
5. Prep sheet: answered in `20261117-manager-to-consultant-prep-sheet-shape.md` (accepted; all blends alcohol-free).
---
