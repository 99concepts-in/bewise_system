# 04 — Razorpay payments: order → checkout → webhook → capture (draft)

> **Owner:** OWNER chat · module `finance`, routes `src/app/api/webhooks/razorpay/**`. All code here is `// @sensitive`.
> Test mode first. The UI shows **"Test mode"** on OW-24 until live keys are configured *and* a live ₹1 test payment succeeds.
> Exact Razorpay parameter names are verified against current Razorpay docs during O2 build. Anything marked *(verify)*
> is from memory.

## 1. Principles
1. **The webhook is the source of truth.** `verifyCheckout()` (browser callback) only speeds up the UI. It never marks anything paid unless the signature verifies, and the webhook path does the same work idempotently.
2. **The server decides the amount.** The amount comes from the appointment hold / sales order / invoice in our DB, never from the browser.
3. **Secrets never reach the browser.** Only `key_id` is sent to checkout. `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` live in server env vars (Vercel), never in `settings`.
4. **Idempotent everywhere.** Unique `razorpay_order_id`, unique `razorpay_payment_id`, unique webhook `x-razorpay-event-id`, unique journal `(source, rule)`.
5. **No refunds (D-16).** The app never calls the refund API. If a refund or chargeback happens outside the app, we still record it (P15) and alert the owner.

## 2. Sequence — booking (purpose `appointment`)
```
Client (CL-16)            Next.js server (finance)                    Razorpay
   │ Pay ₹1,000 ──────────▶ createCheckout({purpose:'appointment', refId})
   │                        • requirePermission('finance.checkout.create') + client owns ref
   │                        • load hold: status pending_payment, not expired → amountPaise
   │                        • reuse open payment_intent for refId if same amount (double-tap safe)
   │                        • POST /v1/orders {amount, currency:'INR', receipt:<intent id>,
   │                            notes:{purpose, refId, intentId}} ─────────────▶ order_xxx
   │                        • insert payments(status 'created', razorpay_order_id)
   │◀── {razorpayOrderId, keyId, amountPaise, prefill} ──
   │ Razorpay Checkout (UPI / card / netbanking), timeout = hold remaining
   │──────────────────────────────────────────────────────────────────▶ pays
   │◀──────────── handler: {razorpay_payment_id, razorpay_order_id, razorpay_signature}
   │ verifyCheckout(...) ──▶ HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET) == signature?
   │                        • yes → fetch payment from API; if captured → runCapture() (same as webhook)
   │                        • otherwise → status 'authorized' / pending, UI shows "Confirming…"
   │                                                                     │
   │                        POST /api/webhooks/razorpay ◀────── payment.captured / order.paid
   │                        • verify X-Razorpay-Signature = HMAC_SHA256(raw body, WEBHOOK_SECRET)
   │                        • insert webhook_events(event_id) ON CONFLICT DO NOTHING → if dup: 200
   │                        • runCapture(payment) in ONE transaction (§4) → 200 within 5 s
   │◀── realtime / poll: appointment confirmed (scheduling handles payment.captured)
```
Shop orders (`sales_order`) and invoices (`invoice`) follow the same path. For invoices, **Payment Links** are also offered (§6).

## 3. Tables (finance)
| Table | Key columns |
|---|---|
| `payment_intents` | `id, purpose, ref_id, amount_paise, razorpay_order_id unique, status (open/paid/expired/superseded), expires_at` |
| `payments` | `id, intent_id?, party_type, party_id, amount_paise, method, status (PaymentStatus), razorpay_payment_id unique?, razorpay_order_id?, captured_at, fee_paise?, tax_on_fee_paise?, settlement_id?, account_id (ledger), reference, raw jsonb` |
| `payment_allocations` | `payment_id, invoice_id, amount_paise` (Σ ≤ payment, Σ ≤ invoice balance) |
| `razorpay_webhook_events` | `event_id unique, event, signature_ok, payload jsonb, received_at, processed_at, error` — kept 2 years |
| `razorpay_settlements` | `settlement_id unique, amount_paise, fees_paise, tax_paise, utr, settled_at, posted_entry_id` |

## 4. `runCapture(rzpPayment)` — the one place money becomes "paid"
Inside **one DB transaction**, with `SELECT … FOR UPDATE` on the intent:
1. Check that `payment.order_id` matches a known intent, `currency = 'INR'` and `amount = intent.amount_paise`. On a mismatch, store the payment as `captured` + `needs_review`, post P2b (credit) and alert the owner. Never auto-confirm.
2. Upsert `payments` by `razorpay_payment_id` (method mapped: `upi|card|netbanking|wallet` → PaymentMethod).
3. Purpose:
   - `appointment` → issue the consultation invoice and allocate (invoice = paid) → receipt.
   - `sales_order` → leave the payment unallocated (P2b). Finance allocates when `order.paid` arrives (see `02-POSTING-RULES.md` §2B).
   - `invoice` → allocate to that invoice (partial allowed) → receipt.
4. `emitEvent('payment.captured', { paymentId, amountPaise, invoiceId?, salesOrderId?, appointmentId?, method }, { tx })` and `invoice.issued` if one was issued.
5. Mark the intent `paid`.

Replays are harmless: step 2 finds the existing row, so steps 3–5 are skipped.

## 5. Edge cases
| Case | Handling |
|---|---|
| Client pays twice (two tabs) | Second capture on a `paid` intent → payment kept as `client_credits` (P2b), owner + Haresh alerted. No refund (D-16) — offered as credit against the next session, or the owner decides. **Owner question below** |
| Hold expired before payment completes | Checkout `timeout` = hold time left, so the modal closes. If a payment still arrives: scheduling re-holds the same slot if free; if not, the appointment becomes "needs reschedule" with the money held as an advance. *(verify)* Razorpay order-level late-authorisation auto-release (`payment.capture_options`) can release authorisations that arrive too late; prefer that if available |
| Webhook before callback / callback only | Both paths call `runCapture`, so whichever is first wins and the other no-ops |
| Webhook never arrives | Cron `/api/cron/razorpay-reconcile` every 10 min: intents `open` > 15 min → `GET /v1/orders/{id}/payments`. A captured payment found → `runCapture`. Intents past expiry with none → `expired` |
| `payment.failed` | Payment row `failed` + reason, emit `payment.failed`. Client sees CL-53 "Nothing was charged" |
| Authorized but not captured | Account default = auto-capture. A cron also captures any `authorized` payment for a still-valid intent (`POST /payments/{id}/capture`) |
| Refund or chargeback done in the Razorpay dashboard | Subscribe `refund.processed`, `payment.dispute.created/lost/won` → record, P15, alert owner. Never initiated by the app |
| Settlement | `settlement.processed` webhook *(verify availability)*, else a daily cron pulls settlements + the recon report → per-payment `fee_paise` + `tax_on_fee_paise` → P4 |
| Amount in paise | Razorpay already uses the smallest unit (paise) → no conversion; still validated as integer > 100 |

## 6. Payment Links (manual invoices, reminders)
`createPaymentLink(invoiceId)` → `POST /v1/payment_links` with `amount = invoice balance`, `reference_id = invoice id`, `expire_by = due date + 30 days`, `notify` off (we send our own WhatsApp/email). Webhook `payment_link.paid` → `runCapture` with purpose `invoice`. A link is cancelled when the invoice is paid by other means.

## 7. Webhook endpoint contract
- `POST /api/webhooks/razorpay`, Node runtime, reads the **raw body** before JSON parse, constant-time signature compare.
- Bad signature → 400 + log (no payload stored beyond the hash). Unknown event → 200 (ignored).
- Responds within 5 s. Heavy work (PDF, notifications) happens in event handlers after commit.
- Subscribed events: `payment.authorized, payment.captured, payment.failed, order.paid, payment_link.paid, refund.processed, payment.dispute.created, payment.dispute.lost, payment.dispute.won, settlement.processed`.

## 8. Environment & integration status (OW-24)
| Var | Where |
|---|---|
| `RAZORPAY_KEY_ID` | server; sent to the browser per checkout (public by design) |
| `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | server only |
| `settings.payments.razorpay.mode` | `test` / `live` — must match the key prefix `rzp_test_` / `rzp_live_`; a mismatch blocks checkout |

Status shown: **Not set up** (no keys) · **Test mode** (test keys, or live keys but no successful live webhook yet) · **Connected** (live keys + a verified live webhook received in the last 30 days) · **Error** (last 3 webhooks failed signature or processing).

## 9. Tests
Unit: signature helpers (known vectors) · runCapture idempotency (×3 replays) · amount mismatch → review · double payment → credit.
Integration (Razorpay test mode, CI optional): order create → simulated webhook payload signed with the test secret → appointment confirmed, invoice paid, journal balanced.

## Owner question
Double payments or late payments for a lost slot: D-16 says no refunds. Should these become **credit for a future session** (our default), or should the owner be allowed a one-off manual refund in Razorpay, which the books would then record?
