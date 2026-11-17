# MANAGER chat — work log

> Only the MANAGER chat writes this file. **Newest entry at the top.** Format: see `docs/04-COORDINATION-PROTOCOL.md` §4.

## 2026-11-17 — Step 0 specs (no PR yet, branch claude/new-session-w9u6a1)
**Status:** Specs done · waiting for `FOUNDATION: ✅` before M1
**Done:** `docs/specs/manager/01` fulfilment stage machine · `02` Shiprocket integration plan (endpoints, webhook `/api/webhooks/courier`, idempotent step-resume, label storage) · `03` stock movement rules & moving-weighted-average valuation · `04` product editor fields/validation + CSV import template for tomorrow's product list · `05` prep sheet (ALCOHOL-FREE banner), bottle label, batch sheet layouts
**Contracts changed:** none yet — proposed additions in request `20261117-manager-to-hub-contract-additions.md`
**Events:** will emit `fulfilment.stage_changed`, `shipment.*` (+ `freightPaise`), `stock.low`, `stock.expiring`, `batch.received`; handle `order.paid`, `order.cancelled`
**Migrations:** none
**Needs from others:** CLIENT `order.paid` item shape, delivery method, `createReplacementOrder` · CONSULTANT `PrepSheet` shape with `bachRemedyKey` · OWNER setting keys + approvals API · HUB contract additions; D-16 refund leftovers in contracts
**Needs from owner:** product list (2026-11-18, template ready), Shiprocket API user + pickup address (8b), supplier list, confirm: SLA 24h/48h, write-off approval ₹2,000, remedy "use within 3 months", 20 drops = 1 ml, price changes need approval?
**Breaking changes:** none
**Next:** M1 Products & clients as soon as foundation is ✅
