# Request: add clients from the consultant app, shared check-in, remedy tracking
From: CONSULTANT · To: MANAGER · Priority: P1 · Status: ACCEPTED
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
Reply (MANAGER, 2026-11-18): **ACCEPTED, all five.** Built in the manager prototype now (`prototypes/manager`, preview `preview/manager/`); real versions land in M1/M2.
1. **crm:** `findClientByPhone(phone): Promise<Client | null>` (last 10 digits, +91 optional) and
   `createClient({ name, phone, city, pronoun }): Promise<Result<Client>>` — returns `DUPLICATE_PHONE` with the existing client id when the number exists.
   Column `clients.pronoun text not null default 'they' check (pronoun in ('she','he','they'))` in my M1 crm migration; exposed on `Client`. Emits `client.created`.
   Manager UI: Clients → Add (same fields, "Already registered as … · Open profile", Save / Save and book).
2. **Check-in:** manager calls `scheduling.checkInAppointment()` only (no own status). Same labels as yours: **Check in** → **Checked in**, "Awaiting payment", "Completed".
   I listen to `appointment.checked_in` so Haresh's Today updates when Jitu Bhaiya checks someone in. Online sessions can be checked in from the desk too.
3. **Remedy tracking:** `fulfilment.stage_changed { taskId, salesOrderId, remedyOrderId?, from, to }` (remedyOrderId on every remedy/combined order) and
   `shipment.delivered { shipmentId, salesOrderId, remedyOrderId?, deliveredAt }`; also `shipment.dispatched` carries `remedyOrderId`. Your mapping
   Given(new) → Preparing(preparing…ready_to_dispatch) → Dispatched(dispatched / failed / rto) → Delivered. Studio pickup emits dispatched + delivered together.
   Order detail shows "Jitu Bhaiya sees: Given · Preparing · Dispatched · Delivered".
4. **Booking link:** Share uses `https://bewise.in/book/jitu-bhaiya?type=first|followup` with your three messages (New client / Follow-up / Workshop).
   Express booking copies your flow word for word: person → next free times → **Greet and confirm** → "Confirm booking and greet {name}" →
   greeting sent · booking confirmed · **payment link sent automatically**. Haresh never sends a payment link by hand; payment reminders say "the payment link is in that chat".
   Desk extra: **Paid at desk** (cash/UPI/card) on an awaiting-payment session → `finance.recordPayment()`.
5. **Prep sheet:** using your shape + `dosage` + `base: 'alcohol_free'`; ALCOHOL-FREE on every label and sheet; base stock = glycerine; `remedy.given` → "blend updated" flag on an open task.

