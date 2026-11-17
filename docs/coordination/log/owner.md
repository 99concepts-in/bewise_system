# OWNER chat — work log

> Only the OWNER chat writes this file. **Newest entry at the top.** Format: see `docs/04-COORDINATION-PROTOCOL.md` §4.

## 2026-11-17 — Owner app v4 design prototype (branch claude/new-session-k130h4)
**Status:** Design prototype ready for owner review — still waiting for `FOUNDATION: ✅` before O1
**Done:** `docs/specs/owner/prototype/` — clickable v4 "Soft Bloom" prototype of the Owner app, desktop first + phone
(floating navy pill nav). Layout from the owner's reference (mood-tracker dashboard): last 7 days as mood pebbles, daily sales
bars with tooltip, Waiting for you / Alerts list, Ask BeWise owl card, daily insight. 13 screens: home, sales, operations,
cash & dues, expenses, P&L, reports & GST, approvals (approve/reject works), Ask BeWise, team & permissions + invite
accountant, business settings, integrations, activity. Light + dark. Sample data only.
**Contracts changed:** none · **Events:** none · **Migrations:** none
**Needs from others:** HUB: v4 restyle of owner boards can use this prototype as the reference
**Breaking changes:** none
**Next:** owner feedback on the prototype → O1 once the foundation lands

## 2026-11-17 — Pre-foundation specs: finance engine & admin (branch claude/new-session-k130h4)
**Status:** Specs drafted — waiting for `FOUNDATION: ✅` before O1
**Done:** `docs/specs/owner/01…07` — chart of accounts (system keys, tax codes, accountant questions), posting rules per
event (+ journal invariants, deferral of consultation fees until session held, perpetual WAC inventory, GST place of supply,
inclusive-price rounding with ₹1,000/₹800 worked examples, period locks, test list), FY numbering & invoice/receipt/credit
note PDF layout (Rule 46 checklist, privacy: no flower names on invoices), Razorpay flow (webhook = truth, runCapture in
one tx, reconcile cron, payment links, settlements, no refund API), reminder schedules & 15 WhatsApp templates,
settings keys, roles & permissions incl. accountant (TOTP, access end date, export audit)
**Contracts changed:** none yet — proposals in `requests/20261117-owner-to-hub-finance-contract-alignment.md`
**Events:** planned emits/handles listed in `02-POSTING-RULES.md` §3; proposes `payment.allocated`, `payment.disputed`, `settlement.processed`
**Migrations:** none
**Needs from others:** MANAGER: stock movement values + `stock.movement_recorded` / `goods.received` events
(`requests/20261117-owner-to-manager-stock-valuation-events.md`) · HUB: contract clean-up of refund leftovers, sequences table
· Business: GSTIN & registration scheme, accountant contact (D-13), Razorpay test keys (D-05), WhatsApp BSP (D-07), email domain (D-12), remedy reorder price
**Breaking changes:** none
**Next:** O1 Settings, users & roles as soon as the foundation lands; then O2 finance engine (replace HUB stubs for createCheckout/verifyCheckout first)

