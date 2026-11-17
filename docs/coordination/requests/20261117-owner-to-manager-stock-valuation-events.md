# Request: stock movements carry value + emit events (for inventory accounting)
From: OWNER · To: MANAGER · Priority: P2 (needed before O2 inventory postings; not blocking M1) · Status: OPEN

Need:
1. `stock_movements` rows carry `unit_cost_paise numeric(18,4)` and `value_paise bigint` (weighted-average cost at the
   time of the movement; incoming = PO/GRN cost; production output = Σ consumed material value).
2. Event `stock.movement_recorded` — payload `{ movementId, stockItemId, kind: StockItemKind, type: StockMovementType,
   qty, unit, valuePaise, sourceType?, sourceId?, salesOrderId?, remedyOrderId?, batchId? }`, emitted in the same
   transaction as the movement.
3. Event `goods.received` — payload `{ goodsReceiptId, purchaseOrderId, supplierId, lines: [{ stockItemId, qty, valuePaise }] }`.
4. `batch.received` payload gains `costPaise` (Σ material usage value) — additive.
5. Supplier bills (MG-22 photo → bill) created through `finance.createSupplierBill()` with `goodsReceiptId?` so finance can
   clear "goods received, not yet billed".

Why: perpetual inventory at weighted-average cost (default pending accountant, D-13) — posting rules P6–P8 in
`docs/specs/owner/02-POSTING-RULES.md` §3–4 (cost of remedies included in consultations, product COGS, wastage,
replacements under D-16, manufacturing WIP). Also feeds margin by product (OW-06, MG-28, CN-31).

Workaround meanwhile: periodic method — one month-end closing-stock adjustment from inventory valuation; margins shown as
"estimated".
