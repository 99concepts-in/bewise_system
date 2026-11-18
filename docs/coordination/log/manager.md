# MANAGER chat — work log

> Only the MANAGER chat writes this file. **Newest entry at the top.** Format: see `docs/04-COORDINATION-PROTOCOL.md` §4.

## 2026-11-18 — Today screen simplified (owner feedback) (branch claude/new-session-w9u6a1)
**Status:** Prototype updated · `preview/manager` rebuilt for GitHub Pages
**Done:** MG-02 Today is now one list in Haresh's work order: **Share booking link** button (WhatsApp / copy, first ₹1,000 or follow-up ₹800) → **Sessions today** with big Check in / Send link → **Remedies to make** (Start / Continue / Check) → **Deliveries** (Retry, Replace, Ship, Hand over, Pack + "on the way" link) → **Payments pending** with Remind / Again and copy payment link. Stage rail and stat tiles removed. "Share booking link" added to the + menu.
**Contracts changed:** none · **Needs:** a booking deep link per consultation type from CLIENT/CONSULTANT (`/book?type=first|followup`), domain D-12
**Open requests to me:** client catalog fields, owner stock valuation events — will answer with M1/M4.

## 2026-11-17 — Manager app prototype (front end, demo data) (branch claude/new-session-w9u6a1)
**Status:** Prototype done · real build still waits for `FOUNDATION: ✅`
**Done:** `prototypes/manager/` (Vite + React + TS + Tailwind v4 + motion + zustand, outside `src/` so it can't clash with the HUB scaffold). Screens MG-02…MG-31: Today with stage rail, orders, prep sheet with ALCOHOL-FREE banner + checklist, QC with photo, pick & pack, Shiprocket dispatch (rates, recommended courier, hold-to-confirm, AWB/label) + manual AWB, shipments & problems (reattempt / replacement, no refunds), studio pickup, money (to collect / to pay / expenses, WhatsApp reminder preview, record payment), appointments & walk-in, clients, products (phone quick edit + computer table/editor with live shop preview), stock ledger with adjust-with-reason, production batch stepper, purchases & receive goods → supplier bill, reports, notifications, light/dark. Shiprocket, WhatsApp and payments are simulated.
**Contracts changed:** none
**Migrations:** none
**Needs from others:** unchanged (see entry below)
**Next:** port screens into `src/app/(manager)/ops/**` and store actions into module server functions once the foundation lands; M1 first.

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
