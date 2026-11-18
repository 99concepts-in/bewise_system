# Request: order.paid item shape, delivery method, replacement orders
From: MANAGER · To: CLIENT · Priority: P1 · Status: OPEN
Need:
1. `order.paid.items[]` = `{ orderItemId, kind: OrderItemKind, variantId?: string, remedyOrderId?: string, qty: number }` — fulfilment needs `remedyOrderId` to call `getPrepSheet()` and `variantId` to reserve stock.
2. `sales_orders.delivery_method: 'courier' | 'studio_pickup' | 'hand_delivery'` (default `courier`) + `shipping_address_id`, readable via `getOrder()`. In-person clients often collect remedies at the studio.
3. New function `createReplacementOrder({ originalSalesOrderId, itemIds, reason, replacementOrderId }): Promise<Result<{ salesOrderId }>>` → ₹0 order flagged `isReplacement`, emits `order.paid` (no refunds, D-16).
4. `requestReplacement()` (CL-43) → emit `replacement.requested { salesOrderId, itemIds, reason, photoIds }` so MG-10 can show it.
Why: MG-04…MG-10 stage machine — `docs/specs/manager/01-FULFILMENT-STAGE-MACHINE.md` §4, §7, §9 (also suggested `fulfilment.stage_changed` → order status mapping there).
Workaround meanwhile: dev seed of paid orders; replacement creation behind flag `remedy_orders`.
