# MANAGER — detailed screen specs

Written by the MANAGER chat before building each screen (layout, fields, validation, states, permissions, events, acceptance criteria). Step-0 specs written 2026-11-17 while the foundation is pending:

| File | What |
|---|---|
| `00-MANAGER-FLOW-AND-SCREENS.md` | Flow & screens MG-01…MG-31 (HUB, approved) |
| `01-FULFILMENT-STAGE-MACHINE.md` | Paid order → prep → QC → pack → dispatch → delivered; failures, replacements, events (M2) |
| `02-SHIPROCKET-INTEGRATION.md` | Rates, create shipment, AWB/label/pickup, webhook, idempotency, label storage, manual fallback (M3) |
| `03-STOCK-MOVEMENTS-AND-VALUATION.md` | Ledger rules, reservations, lots/FEFO, approvals, moving weighted average, alerts (M4) |
| `04-PRODUCT-EDITOR.md` | Catalogue model, editor fields & validation, quick edit, CSV import (M1) |
| `05-PRINT-SHEETS.md` | Prep sheet + ALCOHOL-FREE banner, bottle label, batch sheet (M2/M5) |
| `product-import-template.csv` | One row per size — for the owner's product list (2026-11-18) |
