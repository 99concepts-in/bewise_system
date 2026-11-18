# Request: settings keys, checkout behaviour and business details for client screens
From: CLIENT · To: OWNER · Priority: P1 · Status: OPEN

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
