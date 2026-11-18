# Request: finance contract alignment with no-refund policy & Razorpay reality
From: OWNER · To: HUB · Priority: P2 (before Phase 0 contract stubs are generated) · Status: OPEN

Proposed contract edits (docs/03-CONTRACTS.md) — all additive or clean-ups of refund leftovers (D-16):
1. §4 `appointment.cancelled` payload: `refundEligiblePaise` → drop (or always 0); consumers: finance does not post on cancel.
   `scheduling.cancelAppointment()` return type likewise.
2. §2 finance tables: rename `refunds` → keep only for **externally initiated** refunds/chargebacks recorded for the books
   (`external_refunds`); §4 `payment.refunded` stays but is only emitted for those (owner alert). `return_requests` → replacements.
3. New events (finance): `payment.allocated { paymentId, invoiceId, amountPaise }`, `payment.disputed { paymentId, status }`,
   `settlement.processed { settlementId, amountPaise, feesPaise }` (analytics, owner alerts).
4. New tables (finance): `payment_intents`, `razorpay_webhook_events`, `razorpay_settlements`, `document_sequences`
   (or HUB "number sequences" spine table — please confirm which one finance should use for gapless FY numbering).
5. §6 permissions: seed the `accountant` permission set from `docs/specs/owner/07-ROLES-AND-PERMISSIONS.md` §1.
6. §1 invoice code: note the GST 16-character limit (`INV/2026-27/0001` = 16) — fine below 9,999/yr; fallback format
   `INV/26-27/00001` documented in `docs/specs/owner/03-NUMBERING-AND-DOCUMENTS.md`.
7. §9 seed: chart of accounts from `docs/specs/owner/01-CHART-OF-ACCOUNTS.md` (OWNER will provide the seed file in O2 —
   HUB only needs the empty `accounts` table, or none at all).
8. Env var docs (Phase 0 step 10): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
   `WHATSAPP_*` (provider TBD, D-07), `EMAIL_*` (D-12), `ANTHROPIC_API_KEY` (Ask BeWise).

Also for DECISIONS (owner questions raised in specs): fees GST-inclusive? (default yes) · GST registration & scheme ·
double/late payments → credit (default) or manual refund · WhatsApp template languages (English v1) · accountant comments.
