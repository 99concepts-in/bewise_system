# M3 · Shiprocket integration plan

> **Owner:** MANAGER · Module `fulfilment` · Screens MG-09, MG-09b, MG-10 · Decision **D-06** (Shiprocket, manual AWB fallback) · Flag `courier_api`.
> Status: **SPEC v1 (2026-11-17)**. Endpoint names and payload fields below are from Shiprocket's public API v1 (`apiv2.shiprocket.in/v1/external`).
> **Re-check each one against the live docs and a test account at the start of M3**, because Shiprocket changes fields without versioning.

## 1. What Haresh sees
- **MG-09 Dispatch:** parcel weight and box (from Packed) → courier options with **price, days, rating** → *Recommended* chip → pickup date → "Send tracking on WhatsApp" toggle (on) → **Create shipment**.
- **MG-09b Shipment created:** AWB, courier, **Print label** / **Share label** (PDF), pickup scheduled for <date>, tracking sent ✓.
- **MG-10 Shipments:** tabs *In transit · Delivered · Problems*. Problems: failed delivery → **Reattempt**; RTO → **Send replacement**. Footer "Synced with Shiprocket · 2 min ago".
- **Fallback (flag off / no credentials / API down):** *Manual dispatch*: courier select, AWB typed or **scanned**, freight ₹, tracking link, **Mark dispatched**. Same screen, chosen automatically when Shiprocket is unavailable, with a banner saying why.

## 2. Credentials & config
| Item | Where | Notes |
|---|---|---|
| API user email + password | env `SHIPROCKET_API_EMAIL`, `SHIPROCKET_API_PASSWORD` (server only) | Owner creates a dedicated **API user** in Shiprocket → Settings → API (different email from the main login). Checklist **8b** |
| Webhook token | env `SHIPROCKET_WEBHOOK_TOKEN` | Set in Shiprocket → Settings → API → Webhooks as the `x-api-key` value |
| Pickup location nickname | setting `shipping.pickup_location` (OWNER settings, requested) | Must match a pickup address registered in Shiprocket (checklist 8b) |
| Box presets | setting `shipping.boxes` (requested) | e.g. Small 15×10×8 cm, Medium 20×15×10 cm |
| Declared value for ₹0 remedy orders | setting `shipping.remedy_declared_value_paise` (default = `remedy.reorder_price`) | Couriers reject ₹0 declared value |

Auth token: `POST /auth/login {email, password}` → `token`, valid ~10 days. Cached encrypted in table `courier_credentials_cache (provider, token_enc, expires_at)` and refreshed at 9 days or on any `401` (retry once).

## 3. Endpoints used
| Step | Call | Stored |
|---|---|---|
| Rates | `GET /courier/serviceability/?pickup_postcode&delivery_postcode&weight(kg)&cod=0&declared_value&length&breadth&height` | not stored; cached 10 min per (pincode, weight, box) |
| Create order | `POST /orders/create/adhoc` | `shipments.shiprocket_order_id`, `shiprocket_shipment_id` |
| Assign AWB | `POST /courier/assign/awb {shipment_id, courier_id}` | `awb`, `courier_name`, `courier_company_id`, `freight_paise` |
| Pickup | `POST /courier/generate/pickup {shipment_id:[…], pickup_date?}` | `pickup_scheduled_for`, `pickup_token` |
| Label | `POST /courier/generate/label {shipment_id:[…]}` → `label_url` | PDF copied to our storage → `label_file_id` |
| Manifest (end of day) | `POST /manifests/generate {shipment_id:[…]}` | `manifest_file_id` (optional, M3b) |
| Tracking (poll fallback) | `GET /courier/track/awb/{awb}` | `shipment_events` |
| Cancel (before pickup) | `POST /orders/cancel {ids:[order_id]}` | stage stays `ready_to_dispatch` |
| NDR reattempt | `POST /ndr/{awb}/action {action:'re-attempt', comments, phone?, address?}` | event row |
| Wallet balance | `GET /account/details/wallet-balance` | shown on MG-23b "To pay → Shiprocket wallet" (low balance alert) |

**Create-order payload mapping**
| Shiprocket field | Source |
|---|---|
| `order_id` (channel order id) | `<salesOrderCode>-P<n>` e.g. `BW-00042-P1` (n = parcel number; replacements `-R1`) — **idempotency key** |
| `order_date` | paid_at (IST, `YYYY-MM-DD HH:mm`) |
| `pickup_location` | setting `shipping.pickup_location` |
| billing/shipping name, phone, address, city, state, pincode, email | `crm.listAddresses` (address chosen on the order); `shipping_is_billing = true` |
| `order_items[] {name, sku, units, selling_price, hsn}` | pick list; remedy line = "Bach flower blend 30 ml", sku `REMEDY-30`, price = declared value |
| `payment_method` | always `Prepaid` (no COD — every order is paid or ₹0 before dispatch) |
| `sub_total` | sum of item values (declared value for ₹0 remedies) |
| `length/breadth/height` (cm), `weight` (kg) | `pack_records` |

## 4. Create-shipment flow & idempotency
`shipments.sr_step`: `draft → order_created → awb_assigned → pickup_scheduled → label_stored → done`. **Create shipment** runs the steps in order and persists after each one. A retry (double tap, timeout, crash) **resumes from the last finished step**:
1. Insert `shipments` row with unique `(task_id, parcel_no)` → second tap gets the same row (DB unique constraint + `SELECT … FOR UPDATE`).
2. `order_created` is skipped if `shiprocket_order_id` is already set. If the create call timed out with no response, first look up by channel `order_id` (`GET /orders?search=<order_id>`) before creating again → no duplicate Shiprocket orders.
3. AWB assignment failure (courier unserviceable / wallet low) → stop at `order_created`, show the reason, let him pick another courier or recharge the wallet.
4. On `done`: T8 in the stage machine (`dispatched`), emit `shipment.dispatched {shipmentId, salesOrderId, courier, awb, trackingUrl}` (+ additive `freightPaise`), send WhatsApp tracking through `notifications` (by event; toggle stored on the shipment).

Rate recommendation rule (shown as *Recommended*): Shiprocket's `recommended_courier_company_id` if present, else the **cheapest courier whose ETD ≤ fastest ETD + 1 day** with rating ≥ 3.5. Haresh can pick any option.

## 5. Tracking webhook — `POST /api/webhooks/courier`
> Route owned by MANAGER. The URL must not contain the words "shiprocket", "kartrr", "sr" or "kr" (Shiprocket rejects them), so it stays `/api/webhooks/courier`.

1. **Auth:** compare header `x-api-key` with `SHIPROCKET_WEBHOOK_TOKEN` using a constant-time compare → else `401`.
2. **Store first:** insert raw body into `shipment_events (provider, awb, sr_status_id, sr_status, event_at, payload jsonb, dedupe_key)` with `dedupe_key = sha256(awb|current_status_id|current_timestamp)` unique → duplicate deliveries are no-ops.
3. **Respond `200` fast** (< 1 s), then process via the outbox (`emitEvent('shipment.tracking_received')` internal, or direct processing in the same request if cheap).
4. **Map status → stage** (map by normalised status *name*, ids kept for reference; verify list at M3):

| Shiprocket status (name) | Our action |
|---|---|
| PICKUP SCHEDULED / GENERATED, OUT FOR PICKUP | update shipment only |
| PICKED UP, SHIPPED, IN TRANSIT, REACHED AT DESTINATION HUB, OUT FOR DELIVERY | ensure stage `dispatched`; store ETD |
| DELIVERED | T9 → `delivered`, emit `shipment.delivered` |
| UNDELIVERED / NDR (any reason) | T10 → `failed_delivery`, emit `shipment.failed {reason}` |
| RTO INITIATED, RTO IN TRANSIT, RTO DELIVERED | T12 → `rto`; RTO DELIVERED → "Receive return" task in Needs attention |
| CANCELED | if before pickup: back to `ready_to_dispatch`; else flag |
| LOST, DAMAGED, DESTROYED | `failed_delivery` + needs_attention `lost/damaged` → suggest **Send replacement** |

5. Unknown status → stored, no stage change, logged as warning.
6. Out-of-order events: a later stage never regresses because of an older `event_at` (except the explicit flows above).

**Poll fallback (cron every 2 h):** for shipments `dispatched|failed_delivery` with no event in 12 h → `GET /courier/track/awb/{awb}` → same mapping via the same dedupe key. This covers missed webhooks. The "Synced 2 min ago" text = latest successful webhook or poll.

## 6. Label storage
- `label_url` from Shiprocket is a temporary S3 link → download immediately and store in a private Supabase Storage bucket **`shipping-docs`**, path `labels/YYYY/MM/<awb>.pdf` (manifests `manifests/YYYY/MM/<id>.pdf`); `files` row (HUB spine) → `shipments.label_file_id`.
- Served only via signed URL (10 min) to users with `fulfilment.shipment.view`. **Share label** uses the Web Share API with the PDF file (phone) or download (computer).
- The label shows the client's name, address and phone → never cached by the service worker, retained 18 months, then purged by cron (owner may change; `@decision`).

## 7. Errors & limits
| Case | Behaviour |
|---|---|
| Credentials missing / flag off | Manual dispatch only; banner "Shiprocket not connected — owner: Settings → Integrations" |
| 401 | refresh token once, retry; then error "Shiprocket login failed" + owner alert |
| 422 validation (bad pincode/phone) | show the field message; link to edit the address (crm) |
| Courier unserviceable | rates list excludes it; empty list → "No courier serves <pincode>" + manual option |
| Wallet balance low | AWB assignment fails → message + MG-23b link; daily check alerts below `shipping.wallet_min` (default ₹1,000) |
| 5xx / timeout | exponential backoff 3× (1s/3s/9s) within the request, then leave at the current `sr_step` with **Retry** button |
| Rate limits | serialize calls per account (advisory lock); never batch more than 50 shipment ids |

## 8. Tables
```sql
shipments (id, task_id, parcel_no int, provider 'shiprocket'|'manual', sr_step, shiprocket_order_id, shiprocket_shipment_id,
  courier_company_id, courier_name, awb, tracking_url, freight_paise bigint, declared_value_paise bigint,
  weight_g int, length_cm, breadth_cm, height_cm, pickup_scheduled_for date, label_file_id, manifest_file_id,
  etd date, whatsapp_tracking bool, last_synced_at, status_text, error_code, error_message, + audit)
  unique (task_id, parcel_no); unique (awb) where awb is not null
shipment_events (id, shipment_id null, provider, awb, sr_status_id int, sr_status text, event_at, location, payload jsonb,
  dedupe_key text unique, processed_at, created_at)          -- append-only
courier_credentials_cache (provider pk, token_enc bytea, expires_at)   -- service role only, no RLS select for users
```
Manual fallback: courier from a list (Shiprocket couriers + DTDC, India Post Speed Post, Blue Dart, Delhivery, Other) with a per-courier tracking URL template; AWB scan uses the browser `BarcodeDetector` (Code128/QR) with a `@zxing/browser` fallback; freight entered by hand.

## 9. Tests
- Unit: status mapping table; dedupe; out-of-order events; recommendation rule; resume from every `sr_step`.
- Contract tests against recorded Shiprocket fixtures (`tests/fixtures/shiprocket/*.json`), no live calls in CI.
- Manual test checklist on Shiprocket test/sandbox mode before live: one ₹0 remedy, one store order, one cancel-before-pickup, one NDR reattempt.
