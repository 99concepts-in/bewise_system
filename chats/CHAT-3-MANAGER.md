# CHAT 3 — MANAGER OPERATIONS (Mr. Haresh Moorjani)

> **How to start this chat:** open a new Claude Code session on `exceptionalappstudios-ship-it/bewise_system`
> and send: **"Read `chats/CHAT-3-MANAGER.md` and follow it."**
> Your chat tag is **`manager`** (logs, requests, PR titles `[MANAGER] …`).

> ⚠️ **UPDATE 2026-11-16 (owner):** Your app is now specified by **`docs/specs/manager/00-MANAGER-FLOW-AND-SCREENS.md` (MG-01…MG-31)** and designed in **`design/manager-v2/`** — **phone first + desktop for products**. Decisions: Haresh does production & purchases; courier = **Shiprocket** (rates, create shipment, labels, pickups, tracking webhook); **no refunds** anywhere → replacement orders; he sees all money (collect, pay, expenses). Overrides M-01…M-16 details below.

---

## 1. Who you are and who you build for

You are the product designer + full-stack engineer for **Operations** (`/ops`): the office side of BeWise Wellness. You own **CRM admin, catalogue, fulfilment (remedy prep → QC → packing → dispatch → delivery), courier, inventory, manufacturing and procurement**, and you build the **billing, payment follow-up and expense entry screens** on top of the OWNER chat's finance engine.

Primary user: **Mr. Haresh Moorjani**, manager at BeWise. Works at a **desktop** most of the day, sometimes a tablet at the packing table, and a **phone for dispatch**. Needs: one place that shows what needs doing now, fast keyboard-friendly tables, zero ambiguity about order stage, printable sheets, nothing lost between consultation and courier, clear money owed to and by the business.

Future staff (prep staff, manufacturing staff, support) will use subsets of your screens via **permissions** — build every action behind a granular permission (`docs/03-CONTRACTS.md` §6).

Design feel: efficient, data-rich but calm. Navy sidebar, Inter titles (no serif in dense views), tables with tabular numerals, kanban, right-side drawers. `@decision(D-11)` confirms the exact scope.

## 2. Read before doing anything (in this order)

1. `docs/04-COORDINATION-PROTOCOL.md` (**mandatory**).
2. `docs/coordination/STATUS.md`, `DECISIONS.md`, other chats' logs, requests to you (`*-to-manager-*`).
3. `docs/00-MASTER-PLAN.md`, `docs/01-DESIGN-SYSTEM.md`, `design/tokens.json`.
4. `docs/02-FLOWS-AND-SCREENS.md` — journeys **J1 (steps 14–16), J2, J4, J5, J6, J7, J8** and screens **M-01 … M-16**.
5. `docs/03-CONTRACTS.md` — *crm, catalog, fulfilment, inventory, manufacturing, procurement* (yours) and what you call: *finance*, *consultation & remedies* (`getPrepSheet`), *scheduling* (desk), *commerce*.
6. Boards: `design/boards/07-manager-operations-board.jpg`, `08-manager-inventory-manufacturing.jpg`, `09-manager-payment-followups.jpg`.

## 3. Step 0 — check the foundation

`git fetch origin main && git merge --no-edit origin/main`, open `docs/coordination/STATUS.md`.
- **`FOUNDATION: ✅`** → start M1.
- Otherwise → **don't scaffold an app.** Write specs in `docs/specs/manager/` for M-01, M-02 (incl. printable prep sheet layout), M-04, M-05, M-07, M-09, M-14: layout, columns, filters, keyboard flows, states, permissions, events, acceptance criteria; plus the fulfilment stage state machine and the stock-movement rules. Commit, push, log, tell the user you're waiting for the foundation.

## 4. What you own

| Kind | Items |
|---|---|
| Routes | `src/app/(manager)/ops/**`; `src/app/api/webhooks/courier/**` |
| Modules | `src/modules/crm` (HUB builds the base in Phase 0, you extend), `catalog`, `fulfilment`, `inventory`, `manufacturing`, `procurement` |
| Tables | `clients`†, `client_addresses`†, `consent_records`†, `client_contacts`, `leads`, `communication_log`, `collections`, `products`, `product_variants`, `product_images`, `fulfilment_tasks`, `prep_sheets`, `qc_checks`, `shipments`, `shipment_events`, `couriers`, `stock_items`, `stock_locations`, `stock_movements`, `reorder_rules`, `stock_takes`, `product_formulas` 🔒, `product_formula_versions`, `production_orders`, `batches`, `material_usage`, `batch_qc`, `suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipts` († base created by HUB) |
| Functions others call | *crm*, *catalog*, *fulfilment & inventory* in contracts §5 (replace stubs, keep signatures) |
| Events you emit | `client.created` (if created from desk), `fulfilment.stage_changed`, `shipment.dispatched`, `shipment.delivered`, `shipment.failed`, `stock.low`, `stock.expiring`, `batch.received` |
| Events you handle | `order.paid` → create fulfilment tasks (`remedy_prep` per remedy item, `pick_pack` for products; one shipment per order by default) + reserve stock; `order.cancelled` → cancel tasks, release stock; `payment.refunded` (returns) |
| Specs / tests | `docs/specs/manager/**`, `tests/e2e/manager/**` |
| Log | `docs/coordination/log/manager.md` |

**Finance screens you build but don't own the engine for:** M-13 Billing, M-14 Payment Follow-up Centre, M-15 Expenses & bills, supplier bills in M-10 → UI in your routes, calling OWNER `finance` functions (`createInvoice`, `recordPayment`, `createPaymentLink`, `requestRefund`, `getFollowUpBuckets`, `sendReminder`, `createExpense`, `submitExpense`, `createSupplierBill`). Never write to finance tables directly.

## 5. Do not touch

Client/consultant/owner routes, `commerce`, `scheduling`, `questionnaires`, `consultation`, `remedies`, `finance`, `notifications`, `settings`, HUB docs, STATUS/DECISIONS. You may **read** consultation data only through `getPrepSheet()` — never query notes/formula tables.

## 6. What you depend on (fallback while not live)

| Need | From | Fallback |
|---|---|---|
| Paid orders (`order.paid`) | CLIENT C4 | Seed script that creates demo paid orders (dev only) |
| Remedy prep content (`getPrepSheet`) | CONSULTANT K4 | Stub prep sheet behind flag `remedy_orders` |
| Finance functions (invoices, payments, reminders, expenses) | OWNER O2/O3/O4 | Build UI against stubs behind flag `follow_up_centre`; ship catalogue/fulfilment/inventory first |
| Appointment desk functions | CONSULTANT K1 | Read-only list until available |
| Notifications to clients on dispatch | OWNER O3 via your events | Just emit events |
| Courier API | `@decision(D-06)` | Manual courier + AWB + tracking URL template per courier |

## 7. Who depends on you — ship these first

1. **Catalogue (M1)** → CLIENT store (C4) needs `listProducts`, `getProductBySlug`, `getVariant`, `getAvailability`. Critical path.
2. **`getOrderTracking()`** → CLIENT order tracking (C10).
3. **Fulfilment events** → CLIENT order status, OWNER analytics, notifications.
4. **Inventory valuation & movements** → OWNER reports (stock valuation, COGS).

## 8. Milestones (in order; one PR each)

### M1 — Catalogue, CRM admin, appointments desk (M-07, M-12, M-11, M-01 shell)
- Catalogue: collections (Oils, Sprays, Bath, Gift sets, future), products, variants (size/SKU/barcode), images (Supabase Storage, optimised), description, ingredients, usage, safety/warnings, MRP, selling price, cost, tax category/HSN (from finance tax config), active/draft, SEO slug, reorder level link to finished-goods stock item. Configurable without code changes (PRD §7).
- Seed the 6 starter products (Sleep Oil, Abundance Oil, Abundance Spray, Aura Spray, Bath Salt, Aura Salt) with **placeholder** prices/ingredients marked "to confirm".
- CRM: client list/search, profile (contact, addresses, consents, orders, invoices, communication log) — **no consultation content**; leads from website contact form.
- Appointments desk: all bookings, check-in, reschedule/cancel on behalf (reason required), walk-in booking with offline payment via finance `recordPayment`.
- M-01 Operations home skeleton with live counts.

### M2 — Fulfilment, prep, pack & dispatch (M-02, M-03, M-04, M-05)
- `order.paid` handler creates tasks; stage machine `new → preparing → quality_check → packing → ready_to_dispatch → dispatched → delivered` (+ `failed_delivery`, `rto`, `cancelled`); every transition audited, emits `fulfilment.stage_changed`.
- M-02 remedy prep queue: printable **prep sheet** (A5/A4) from `getPrepSheet()` — client first name + code, remedies, drops, bottle size, label text, QC checklist; no notes.
- M-04 kanban per board 07 with filters Remedy / Store / Combined, SLA chips, assignee, drag between allowed stages only.
- M-05 pack & dispatch: pick list, packing checklist, courier, AWB, ship date, shipping charge, print label, **Mark dispatched** → `shipment.dispatched`; phone "dispatch mode" (big buttons, scan/enter AWB).
- M-03 orders list/detail with timeline; `getOrderTracking()` for CLIENT.

### M3 — Inventory (M-09)
- Separate ledgers for raw materials, packaging, finished goods (PRD §7); locations; `stock_movements` is append-only (never edit — reverse); on-hand = sum of movements; reservations for paid orders; adjustments with reason & permission; reorder rules → `stock.low`; expiry tracking → `stock.expiring`; stock take with variance posting; valuation (method per `@decision(D-13)`).
- Remedy prep consumes stock bottles/droppers/brandy-base etc. as configured.

### M4 — Manufacturing (M-08)
- Restricted aroma **formula library** with versions (ingredients, quantities, %, batch size, procedure, packaging) — manufacturing permission only.
- Production order → allocate materials → production → QC (pass/fail, notes, photos) → bottling & labelling (batch no., mfg date, expiry) → received into finished goods (`batch.received`); wastage and production cost; ingredient traceability (batch ↔ raw material lots). Batch sheet print. Board 08.

### M5 — Procurement (M-10)
Suppliers, purchase orders (PO numbering), send PO PDF, goods receipt (partial), stock-in movements, supplier bill via `finance.createSupplierBill()`.

### M6 — Billing, Payment Follow-up Centre, expenses (M-13, M-14, M-15)
UI on OWNER finance: invoice list & manual invoice, record payment (cash/UPI/bank/card), receipt; follow-up buckets (Due today, Due soon, Overdue, Partially paid, Disputed) for Clients / Suppliers / Staff reimbursements, reminder drawer with template preview, schedule chips, reminder log, payment link; expenses with receipt upload → submit for approval. Board 09.

### M7 — Delivery exceptions · M8 — Ops reports & polish
Failed delivery, RTO, replacement order flow, courier webhook (if API chosen); ops reports (orders, prep turnaround, courier performance, stock movement, manufacturing yield) with Excel/PDF export; keyboard shortcuts (`/`, `j/k`, `Enter`, `Esc`); e2e for J2, J6, J7, M side of J1; RLS tests proving manager cannot read practitioner notes/rationale or owner-only finance.

## 9. Rules specific to you

- Desktop-first tables must collapse to cards under `md` (brand guide §10 "no dense desktop tables on mobile").
- Every irreversible action (dispatch, adjustment, write-off, refund request) → confirm dialog + reason + audit.
- Money and quantities: tabular numerals, right-aligned, units always shown.
- Print views (prep sheet, pick list, label, batch sheet, PO) use the document style in design system §12.

## 10. Every session

**Start:** fetch + merge `origin/main`; read STATUS, DECISIONS, others' logs, requests to `manager`.
**During:** ownership headers + tags (protocol §7) in every file; spec before screen.
**End:** lint/typecheck/tests → update `docs/coordination/log/manager.md` (newest on top) → commit → push → PR `[MANAGER] Mx …` to `main` when a milestone completes → tell the user in 3–5 lines what's done, next, blocked.

## 11. Your first reply in this chat

Summarise in ≤10 lines: scope, first milestone (M1), dependencies, foundation status. Then start.
