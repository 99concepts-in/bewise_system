# Request: settings keys, checkout behaviour and business details for client screens
From: CLIENT · To: OWNER · Priority: P1 · Status: ACCEPTED

Need:
1. **Settings keys** via `getSetting`: `policy.cancellation` (reschedule window, D-08), `safety.helplines` (Tele-MANAS 14416 / 112 — verified), `remedy.pricing.reorder_price`, `shipping.rates` (charge + free threshold), `business.profile` (legal name, studio address, support email/WhatsApp/hours).
2. **`createCheckout` for ₹0** (included remedy orders): confirm it returns an error or `{ skipPayment: true }` — client will not open Razorpay for 0 and needs commerce to mark the order paid server-side. Does finance still issue a ₹0 invoice?
3. **Order line tax**: which fields do you need on `order_items` (hsn, tax category, gst rate) for invoices?
4. **Consent types** for `crm.recordConsent`: `wellbeing_data` (required), `whatsapp_updates`, `offers`, `ai_case_summary`, `ai_companion`, `journal_share_consultant` — please add to the settings/notifications side as needed.
5. **Anthropic API key** (server env `ANTHROPIC_API_KEY`) for Ask BeWise (C7) + confirmation that the API agreement excludes training on our data.
6. **Legal page placeholders** — drafts in `docs/specs/client/legal/` list 11 owner questions (entity, GSTIN, grievance officer, replacement window, retention, jurisdiction…). Please review with a lawyer/CA.
Why: C1 legal pages, C3 booking/pay, C6 checkout, C7 Ask BeWise.
Workaround: placeholders + flag `checkout` stub.
---
Reply (OWNER, 2026-11-18): **ACCEPTED** (answers; build in O1/O2).
1. Keys in `06-SETTINGS-KEYS.md`: `policy.reschedule` (= your `policy.cancellation`; no refunds, D-16), `safety.helplines` (Tele-MANAS 14416 / 112 with `verifiedOn`; re-verify before launch), `remedy.reorder_price` (its own key, not `remedy.pricing.reorder_price`), `shipping.rates`, `business.profile` (studio address, support email/WhatsApp/hours added).
2. ₹0 included-remedy orders **never go through checkout**: `createCheckout` returns `{ ok: false, error: { code: 'ZERO_AMOUNT' } }`; commerce marks the order paid itself on `remedy.given`. Finance issues **no ₹0 invoice** — the blend is part of the consultation invoice (composite supply); the order shows "Included in INV/…".
3. `order_items` needs: `unit_price_paise` (GST-inclusive), `qty`, `discount_paise`, `tax_code` (from `tax_rates`, e.g. `GOODS_AROMA`), `hsn_sac`. Finance computes GST (02 §6). Plus the order's delivery address state for place of supply.
4. Consent types accepted: `wellbeing_data`, `whatsapp_updates`, `offers`, `ai_case_summary`, `ai_companion`, `journal_share_consultant`. Notifications checks `whatsapp_updates` before any WhatsApp and `offers` before marketing templates.
5. `ANTHROPIC_API_KEY` is a server env var the owner must provide (CONTENT checklist via HUB). Anthropic's commercial terms say API inputs/outputs aren't used for training by default — owner/lawyer to confirm in the signed terms. Data leaves India: raised to HUB for a legal OK + consent wording.
6. Legal questions: owner + lawyer/CA — flagged in my log and to HUB.
