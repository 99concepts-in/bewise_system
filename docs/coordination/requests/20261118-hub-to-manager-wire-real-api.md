# Wire Haresh's app to the real backend (Hostinger PHP + MySQL)
From: HUB · To: MANAGER · Priority: **P0** · Status: OPEN · 2026-11-18

**Why:** owner asked for a fully functional live app with a real database (D-44). API at `/api/`, tested end-to-end.

| Screen | API |
|---|---|
| Sign-in | `auth.login {email, password}` · `auth.changePassword` |
| Today | `analytics.today` · `scheduling.listAppointments {date}` · `checkInAppointment` |
| Clients / desk bookings | `crm.searchClients {q}` · `getClient` · `createClient` · `scheduling.getAvailableSlots` · `bookForClient` · `rescheduleAppointment` |
| Prep & pack board | `fulfilment.listTasks {stage?, type?}` · `setStage {id, stage, courier?, awb?, trackingUrl?}` (manual AWB until Shiprocket API, D-06) · `remedies.getPrepSheet {remedyOrderId}` (flowers, bottle, **alcohol-free**, label) |
| Catalogue (phone + computer) | `catalog.listProducts {includeArchived}` (staff view has cost, SKU, stock) · `upsertProduct` · `archiveProduct` · `setSoldOut` · `adjustStock` · `listStockMovements` |
| Money follow-ups | `finance.getDues` · `recordPayment {purpose, refId, method:'cash'\|'upi'\|'card'\|'bank_transfer'\|'cheque', reference?}` · `listInvoices` · `getInvoice` · `listPayments` |
| Expenses | `finance.createExpense` (→ owner approves) · `listExpenses` |
| Replacements (no refunds, D-16) | `commerce.listReplacementRequests` · `decideReplacement` · `commerce.listOrders` |
| Reports | `finance.getSalesSummary` (sales and profit, read-only) |
| Notifications | `notifications.listInbox` · `markRead` |

Manager never receives intake answers, notes, case summary or safety alerts — the server enforces it.

## Common to all four apps
- **Live vs demo:** at start call `BeWise.available()` (or `GET ../api/v1/system.health`). **true** → real data only; **false** → keep today’\s demo data so GitHub Pages previews keep working.
- **SDK:** `/api/sdk/bewise-api.js` (load with `<script src="../api/sdk/bewise-api.js">` — apps live at `/<app>/` next to `/api/`) + types `api/sdk/bewise-api.d.ts`. Or copy its 10-line `call()` into your own `lib/api.ts`. Every POST needs header `X-BeWise: 1`; session is an HttpOnly cookie (`credentials: "include"`).
- **Errors:** show `error.message` as-is (plain words). `401` → show sign-in.
- **Ids:** server ids are UUIDs; display codes (`BW-A-00001`, `BW-00001`, `INV/2026-27/0001`) come back as `code` / `number`.
- **Money** in paise. **Times** ISO 8601 UTC (`…Z`) — display in Asia/Kolkata.
- **Your module file** in `api/modules/` is yours to extend (new functions, new migration `api/migrations/NNNN_<module>_<what>.sql`). Don’\t edit others’\ — file a request.
- **Test:** local MariaDB + `php -S` (see `api/README.md` → “Changing the backend”); CI `api-tests.yml` must stay green.
- Reference: `api/README.md` (all functions), `hosting/HOSTINGER-DATABASE.md` (how the owner turns on the DB), D-44.
