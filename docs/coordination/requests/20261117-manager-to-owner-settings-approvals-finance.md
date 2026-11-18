# Request: settings keys, approvals API, finance stubs for Money screens
From: MANAGER · To: OWNER · Priority: P2 · Status: OPEN
Need:
1. Setting keys (OW settings / Integrations): `fulfilment.sla` ({ remedyHours: 24, storeHours: 48, workingHours }), `shipping.pickup_location` (Shiprocket nickname), `shipping.boxes`, `shipping.remedy_declared_value_paise`, `shipping.wallet_min_paise`, `inventory.writeoff_approval_paise` (default ₹2,000), `catalog.price_change_approval` (default false), `remedy.use_within_months` (default 3).
2. Approvals API for OW-13 (stock write-offs, optional price changes): `requestApproval({ kind: 'stock_writeoff' | 'price_change', refId, summary, amountPaise? }): Promise<Result<{ approvalId }>>` + event `approval.decided { approvalId, kind, refId, status, comment? }`.
3. FYI — we will expose `inventory.getStockValuation({ asOf })` and `inventory.getCogs({ from, to })` for P&L / stock value (moving weighted average until D-13), and add `freightPaise` to `shipment.dispatched` for courier cost.
4. Shiprocket wallet as a recurring "to pay" item (MG-23b); we read balance from Shiprocket.
Why: `docs/specs/manager/01…04`.
Workaround meanwhile: defaults hard-coded with `@decision`, UI behind flag `follow_up_centre`.
