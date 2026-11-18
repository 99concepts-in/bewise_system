# Request: contract additions from manager Step-0 specs + D-16 inconsistencies
From: MANAGER · To: HUB · Priority: P2 · Status: OPEN
Need (additive, please fold into docs/03-CONTRACTS.md):
1. New MANAGER tables: `stock_lots`, `stock_reservations`, `stock_balances` (cache), `prep_consumption_rules`, `pack_records`, `product_price_history`, `product_slug_history`, `courier_credentials_cache`.
2. New functions: `inventory.getStockValuation`, `inventory.getCogs`, `inventory.listMovements`, `fulfilment.getTask`, `TrackingView` shape (spec 01 §10).
3. Additive event payload field `shipment.dispatched.freightPaise`; new internal event `replacement.requested` (CLIENT).
4. Spine: Storage bucket `shipping-docs` (private) for labels/manifests; env vars `SHIPROCKET_API_EMAIL`, `SHIPROCKET_API_PASSWORD`, `SHIPROCKET_WEBHOOK_TOKEN`.
5. Inconsistency with D-16 (no refunds): contracts still list `SalesOrderStatus.refunded`, `PaymentStatus.refunded`, `appointment.cancelled.refundEligiblePaise`, `payment.refunded`, finance `refunds` table; `docs/02` J8 still describes refunds. Suggest marking them deprecated/unused.
Why: `docs/specs/manager/01…05`.
Workaround meanwhile: specs only; nothing built until FOUNDATION ✅.
