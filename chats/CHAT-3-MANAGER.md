# CHAT 3 — MANAGER OPERATIONS (Mr. Haresh Moorjani)

> **Start a new Claude Code chat on `exceptionalappstudios-ship-it/bewise_system` and send:**
> **"Read `chats/CHAT-3-MANAGER.md` and follow it."**
> Chat tag: **`manager`** · PR titles `[MANAGER] …` · Brief version **v2 (2026-11-17)** — replaces all earlier versions.

> 🔔 **UPDATE 2026-11-18 — the real backend is ready (D-44, replaces Supabase/Next server).** Backend = `api/` (PHP 8 + Hostinger MySQL), deployed at `/api/` with every push to `main`. **Step 0 is now ✅.** Your first task: `docs/coordination/requests/20261118-hub-to-manager-wire-real-api.md` (P0) — swap demo data for API calls, keep demo data only when `BeWise.available()` is false. Your module files in `api/modules/` are yours to extend (new migrations in `api/migrations/`). Reference `api/README.md`. Where this brief says Supabase / RLS / `src/modules/*` / Postgres, read: `api/modules/<module>.php`, server-side role checks, MySQL.

---

## 1. Mission
You are the product designer + full-stack engineer for **Operations** (`/ops`) — the BeWise office: **orders & remedy
preparation, quality check, packing, dispatch via Shiprocket, appointments desk, clients (contact only), products
(phone quick edit + computer editor), stock, production batches, purchases, and all money follow-ups (to collect,
to pay, expenses)** — built on the Owner chat's finance engine.

**User:** Mr. Haresh Moorjani, BeWise manager. Phone first (dispatch, scanning, follow-ups on the go), **computer for adding
and editing products**. Goal: nothing falls through the cracks between a paid order and a happy client, and money owed is
followed up politely. One big button moves work forward. He never sees consultation notes or intake answers.

## 2. Source of truth — read in this order
1. `docs/04-COORDINATION-PROTOCOL.md` (mandatory).
2. `docs/coordination/STATUS.md`, `DECISIONS.md` (D-01…D-43), `CONTENT-CHECKLIST.md`, other logs, requests `*-to-manager-*`.
3. **`docs/specs/manager/00-MANAGER-FLOW-AND-SCREENS.md`** — screens **MG-01…MG-31** (owner answers included).
4. `docs/03-CONTRACTS.md` — your modules *crm, catalog, fulfilment, inventory, manufacturing, procurement*; finance functions you call; `consultation.getPrepSheet` + `intake.getIntakeFlagsForPrep`.
5. **Design:** visual language = **v4 "Soft Bloom"** (`design/v4-soft-bloom/README.md`, tokens `design/tokens.json → v4`, assets `design/assets/v4/`); **layouts/content** from `design/manager-v2/` (phone `MG-phone-*`, computer `MG-desktop-11/12`). Your boards will be restyled in v4 by the HUB — build with v4 tokens now.
6. `docs/00-MASTER-PLAN.md`, `docs/01-DESIGN-SYSTEM.md`.

## 3. Decisions that shape your work
| Topic | Decision |
|---|---|
| Scope | Haresh does **production & purchases** too (D-11) |
| Courier | **Shiprocket** (multiple couriers): compare rates → create shipment → AWB, label, pickup, tracking webhook; manual AWB fallback (D-06) |
| Refunds | **None** (D-16). Failed delivery → reattempt; RTO / damaged / wrong item → **replacement order** |
| Money | He sees **everything**: to collect (clients), to pay (suppliers, Shiprocket wallet, recurring), expenses (submit for owner approval) |
| Numbers | He sees **sales and profit** in his reports (D-33) |
| Products | Phone quick edit (price, MRP, cost, show in shop) + **computer** add/edit product (photos, variants, ingredients, safety, tax, stock link, shop preview) |
| Remedy prep | Prep sheet = flowers, drops, bottle, label + **ALCOHOL-FREE BASE** banner when the client asked (from intake). No notes, no reasons |
| Fees context | Consultations ₹1,000 / ₹800 include the remedy → most remedy orders are ₹0 but still need prep & dispatch (D-02, D-09) |
| Products data | Owner sends the real product list **2026-11-18**; seed placeholders until then |

## 4. Step 0 — is the foundation ready?
`git fetch origin main && git merge --no-edit origin/main`, check `docs/coordination/STATUS.md` for **`FOUNDATION: ✅`**.
- **✅** → start M1.
- **Not yet** → don't scaffold an app. Write specs in `docs/specs/manager/`: fulfilment stage machine, Shiprocket integration plan (endpoints, webhook, idempotency, label storage), stock-movement rules & valuation, product editor fields/validation (ready for tomorrow's product list), printable prep sheet & batch sheet layouts. Commit, push, log, tell the user you're waiting for the foundation.

## 5. What you own
| Kind | Items |
|---|---|
| Routes | `src/app/(manager)/ops/**`, `src/app/api/webhooks/courier/**` (Shiprocket) |
| Modules | `src/modules/crm` (extend HUB base), `catalog`, `fulfilment`, `inventory`, `manufacturing`, `procurement` |
| Tables | `clients`†, `client_addresses`†, `consent_records`†, `client_contacts`, `leads`, `communication_log`, `collections`, `products`, `product_variants`, `product_images`, `fulfilment_tasks`, `prep_sheets`, `qc_checks`, `shipments` (shiprocket ids, awb, courier, label_url), `shipment_events`, `replacement_orders`, `stock_items`, `stock_locations`, `stock_movements`, `reorder_rules`, `stock_takes`, `product_formulas` 🔒, `product_formula_versions`, `production_orders`, `batches`, `material_usage`, `batch_qc`, `suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipts` († base by HUB) |
| Events you emit | `fulfilment.stage_changed`, `shipment.dispatched/delivered/failed`, `stock.low`, `stock.expiring`, `batch.received` |
| Events you handle | `order.paid` → tasks (remedy_prep / pick_pack) + reserve stock; `order.cancelled` |
| Finance screens (UI only) | Money (to collect / to pay / expenses), invoice & reminder, record payment, add expense, supplier bills — calling OWNER `finance.*` functions; never write finance tables |

## 6. Do not touch
Client/consultant/owner routes and modules, `finance` internals, `notifications`, HUB docs, STATUS/DECISIONS. Consultation data only via `getPrepSheet()` / `getIntakeFlagsForPrep()`.

## 7. Dependencies (fallback while not live)
| Need | From | Fallback |
|---|---|---|
| Paid orders | CLIENT `order.paid` | dev seed of paid orders |
| Prep sheet + alcohol-free flag | CONSULTANT | stub behind flag `remedy_orders` |
| Finance functions | OWNER | UI against stubs behind flag `follow_up_centre` |
| Shiprocket credentials | Owner (checklist 8b) | manual courier + AWB |

## 8. Who depends on you — ship first
**Catalogue (M1)** → client shop; **`getOrderTracking()`** → client tracking; fulfilment events → client status & owner analytics; stock valuation → owner reports.

## 9. Milestones (one PR each, in order)
- **M1 Products & clients** — catalogue model (configurable collections/variants), **computer product list + add/edit product** (MG-30/31), phone quick edit (MG-16), CRM clients (MG-13/14), appointments desk & walk-in booking with offline payment (MG-11/12), Today (MG-02).
- **M2 Fulfilment** — tasks from `order.paid`, prepare remedy with printable prep sheet & ALCOHOL-FREE banner (MG-06), quality check with photo (MG-07), pick & pack (MG-08), orders list/detail (MG-04/05).
- **M3 Shiprocket** — rates, create shipment, AWB/label/pickup, tracking webhook, shipments & problems (reattempt, send replacement) (MG-09/09b/10).
- **M4 Stock** — raw / packaging / finished ledgers, adjustments with reason, reorder alerts, expiry, valuation (MG-17/18).
- **M5 Production** — formula library 🔒, batches with stepper, QC, batch sheet (MG-19/20).
- **M6 Purchases** — suppliers, POs, receive goods with bill photo → supplier bill (MG-21/22).
- **M7 Money** — to collect / to pay / expenses, WhatsApp reminder with template preview, record payment, expense with receipt → owner approval (MG-23…26).
- **M8 Me, reports & polish** — Me hub, reports incl. sales & profit, quick actions (+), keyboard flows on computer, e2e (paid order → delivered), RLS tests.

## 10. Rules specific to you
- Every irreversible action (dispatch, adjustment, write-off) → confirm + reason + audit.
- Tables collapse to cards on phone; tabular numerals; units always shown.
- No refund buttons anywhere.

## 11. Every session
**Start:** fetch + merge `origin/main`; read STATUS, DECISIONS, others' logs, requests to `manager`.
**End:** lint/typecheck/tests → newest-first entry in `docs/coordination/log/manager.md` → commit → push → PR `[MANAGER] Mx …` → tell the user in 3–5 lines what's done, next, blocked.

## 12. First reply
In ≤10 lines: scope, foundation status, first milestone (M1 or Step 0 specs), dependencies, and what you need from the owner (product list tomorrow, Shiprocket login, pickup address, supplier list).
