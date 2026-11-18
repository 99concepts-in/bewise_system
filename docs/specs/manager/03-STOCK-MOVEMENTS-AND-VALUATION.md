# M4 · Stock movement rules & valuation

> **Owner:** MANAGER · Module `inventory` (+ `manufacturing`, `procurement` posting into it) · Screens MG-17, MG-18 (+ MG-20, MG-22)
> Contract enums: `StockItemKind`, `StockMovementType` · Events `stock.low`, `stock.expiring`, `batch.received` · Decision **D-13** (valuation method — OPEN).
> Status: **SPEC v1 (2026-11-17)**.

## 1. Principles
1. **The ledger is the truth.** `stock_movements` is append-only (never updated or deleted). On-hand qty and value are *derived* (with a cached balance row updated in the same transaction).
2. **Every movement has a source** (`source_type`, `source_id`, `line_key`) with a unique constraint → event handlers and double taps can't post twice.
3. **Quantities** `numeric(14,3)` in the item's **base unit** (`ml`, `g`, `pcs`); **value** `bigint` paise. Purchase units (L, kg, box of 50) convert on receipt.
4. Corrections = **reversing movement** + new movement, never edits.
5. Irreversible actions (adjustment, write-off, stock-take post) → confirm dialog + reason + audit; write-offs above a threshold need owner approval.

## 2. Stock items
| Kind | Examples | Unit | Lots/expiry |
|---|---|---|---|
| `raw_material` | Bach stock concentrates (38 + Rescue), brandy/alcohol base, glycerine (alcohol-free base), essential oils, carrier oils, Epsom/Himalayan salt, hydrosols | ml / g | yes (supplier lot + expiry) |
| `packaging` | 30 ml dropper bottles, spray bottles, jars, caps, labels, boxes, bubble wrap | pcs | no (optional) |
| `finished_good` | Sleep Oil 30 ml, Aura Spray 100 ml … (1 stock item per product variant) | pcs | yes (production batch + expiry) |

`stock_items (id, code 'RM-EO-001'|'PK-…'|'FG-…', name, kind, unit, product_variant_id null (FG only, 1:1), bach_remedy_key null (Bach stock concentrates), track_lots bool, shelf_life_days null, archived_at, + audit)`.

Remedy consumption config (`settings`-like rows in our own table `prep_consumption_rules`): drops per ml (default **20 drops = 1 ml**, `@decision`), base stock item for *standard* vs *alcohol-free*, bottle stock item per bottle size (30 ml → `PK-DROP-30`), label stock item.

## 3. Movement types → effect
| `StockMovementType` | Sign | Triggered by | Qty source | Value |
|---|---|---|---|---|
| `purchase_receipt` | + | MG-22 Receive goods (goods receipt) | received qty × conversion | PO line price (excl. GST) × qty; landed costs (freight on bill) allocated by value if entered |
| `production_consume` | − | MG-20 Materials step (batch) | formula version × batch size, edited actuals | current avg cost (§5) |
| `production_output` | + | MG-20 Received step (`batch.received`) | good units | **sum of batch consumption value + packaging + optional labour/overhead** ÷ good units |
| `sale` | − | T8 dispatched (fulfilment) — FG lines | order qty | current avg cost → this is **COGS** |
| `remedy_prep_consume` | − | T3 Send to QC (fulfilment) | drops → ml per flower; base fill = bottle size − total flower ml; 1 bottle, 1 label | current avg cost → remedy COGS |
| `adjustment` | ± | MG-18 Adjust (reason: count correction, found, damaged in store, sample/gift, other) | entered | avg cost (for +: current avg, or entered cost if item has no stock) |
| `return` | + | RTO received & resaleable / client return | qty | value at which it left (from the original `sale` movement) |
| `wastage` | − | QC redo bottle, expired lot write-off, spill, batch rejection, order cancelled after prep | qty | avg cost |
| `transfer` | ± pair | location → location | qty | same value, net zero |

**Reservations are not movements.** `order.paid` writes `stock_reservations (sales_order_id, stock_item_id, qty, status reserved|released|consumed)`; `available = on_hand − reserved`. Reservations are released on `order.cancelled` and consumed at dispatch (the `sale` movement posts in the same transaction). Remedy prep materials are **not** reserved (consumed at T3).

## 4. Rules & guards
- **No negative stock** for raw/packaging: a consume that would go below zero is blocked with "Only 12 ml Mimulus left — adjust stock or receive goods". FG `sale` at dispatch is blocked too; reservations *may* exceed availability (race at checkout) → task flagged `stock_short` in Needs attention.
- **Lots (FEFO):** for `track_lots` items, consumption and sale pick lots by **earliest expiry first** (Haresh can override the lot on the batch/dispatch screen). Expired lots are excluded automatically and show in "Expired — write off?".
- **Adjustment approvals:** `adjustment(−)` or `wastage` with value > **₹2,000** (setting `inventory.writeoff_approval_paise`, `@decision`) → posted as *pending*: no effect on stock until approved via OWNER approvals (OW-13). Under the threshold → posts immediately + appears in the owner's audit feed.
- **Stock take (`stock_takes`):** choose kind/location → system freezes expected qty snapshot → count on phone (scan or search) → variance list with value → **Post** (confirm) → one `adjustment` per variance with reason `stock_take` (approval rule above applies to the total write-off value).
- Locations: default one location **"Office store"** (+ optional "Prep table"). Multi-location is supported in the schema but hidden until a second location exists.

## 5. Valuation — moving weighted average (default until D-13)
Default method: **moving weighted average cost per stock item** (allowed under Ind AS 2 / AS 2, simple for a small business). Final method to be confirmed by the accountant (D-13); the ledger stores qty and value per movement, so FIFO can be recomputed later without data loss.

Per item we keep `stock_balances (stock_item_id, location_id, qty_on_hand, value_paise)` updated in the same transaction as each movement:
- **Inbound** (`purchase_receipt`, `production_output`, `return`, `adjustment+`): `qty += q`, `value += v`.
- **Outbound** (all minus types): `v = round(value × q / qty_on_hand)` (banker's rounding); **if the issue empties the item** (`q = qty_on_hand`) then `v = value` exactly → no paise drift left behind. `qty -= q`, `value -= v`.
- Average unit cost shown in UI = `value / qty` (display only, 2 decimals of ₹ per unit).
- Zero-qty item with leftover value is impossible by the rule above; zero-value receipt (free sample) allowed with reason.

**Outputs for OWNER (finance & reports):**
```ts
getStockValuation({ asOf: string; kind?: StockItemKind }): Promise<{ items: { stockItemId; name; kind; qty; unit; valuePaise }[]; totalPaise: Paise }>
getCogs({ from: string; to: string; groupBy?: 'product' | 'day' }): Promise<{ rows: …; totalPaise: Paise }>  // sale + remedy_prep_consume values
listMovements(q: MovementQuery): Promise<Paged<StockMovement>>
```
These will be requested as additive contract entries. Posting the accounting entries (inventory ↔ COGS ↔ purchases) stays with OWNER's posting rules (contracts §4).

## 6. Alerts
- **`stock.low {stockItemId, onHand, reorderLevel}`**: edge-triggered when `available` crosses **below** `reorder_rules.reorder_level` (on every movement/reservation + daily cron safety net). Not re-emitted until the item recovers above the level (state in `reorder_rules.alert_state`). MG-17 shows a *Low* chip; MG-18 has **Order more** → prefilled PO (preferred supplier, `reorder_qty`).
- **`stock.expiring {stockItemId, batchId, expiresOn}`**: daily cron 07:00 IST for lots expiring within **60 days** (setting), once per lot per threshold (60 / 30 / 7 days).
- For finished goods, a low alert suggests **New batch** (MG-19) instead of a PO.

## 7. Tables (MANAGER)
```sql
stock_locations (id, name, is_default, archived_at, + audit)
stock_items (… see §2)
stock_lots (id, stock_item_id, lot_no, batch_id null, supplier_lot null, expires_on date null, received_on, + audit)  -- additive table (logged)
stock_movements (id, stock_item_id, location_id, lot_id null, type, qty numeric(14,3) /* signed */, value_paise bigint /* signed */,
  reason text null, source_type text, source_id uuid, line_key text, reverses_id null, approval_status null 'pending'|'approved'|'rejected',
  note, created_at, created_by)                 -- unique (source_type, source_id, line_key); append-only (no UPDATE/DELETE grants)
stock_balances (stock_item_id, location_id, qty_on_hand, value_paise, updated_at)  -- cache, rebuilt by `rebuild_stock_balances()`
stock_reservations (id, sales_order_id, stock_item_id, qty, status, created_at, updated_at)          -- additive table (logged)
reorder_rules (stock_item_id pk, reorder_level, reorder_qty, preferred_supplier_id null, lead_time_days, alert_state)
stock_takes (id, code, location_id, kind null, status 'counting'|'posted'|'cancelled', snapshot jsonb, counts jsonb, posted_at, + audit)
prep_consumption_rules (id, key, value jsonb)   -- drops_per_ml, base items, bottle items, label item
```
DB function `post_stock_movement(...)` is the only writer (SECURITY DEFINER, checks permission `inventory.movement.create`, locks the balance row, applies §4/§5, emits `stock.low` via outbox). Nightly job verifies `stock_balances` = sum of the ledger and alerts on drift.

## 8. Tests
Vitest property tests: random sequences of in/out keep `value ≥ 0`, empty item ⇒ value 0, sum(movements) = balance; FEFO picks; approval threshold; idempotent replays; stock-take posting.
