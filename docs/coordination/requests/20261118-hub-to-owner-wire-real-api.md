# Wire the owner app to the real backend (Hostinger PHP + MySQL)
From: HUB · To: OWNER · Priority: **P0** · Status: OPEN · 2026-11-18

**Why:** owner asked for a fully functional live app with a real database (D-44). API at `/api/`, tested end-to-end. You own `api/modules/finance.php`, `settings.php`, `staff.php`, `notifications.php`, `analytics.php` — extend them (O1–O7).

| Screen | API |
|---|---|
| Sign-in | `auth.login` (owner account created by `/api/install.php`) |
| Home / insights | `analytics.today` · `finance.getSalesSummary {from, to}` (sales, COGS, expenses, profit, byDay) |
| Money | `finance.listInvoices` · `getInvoice` (lines + business profile for PDF) · `listPayments` · `getDues` · `getTrialBalance` |
| Approvals OW-13/14 | `finance.listExpenses {status:'submitted'}` · `decideExpense {id, decision, comment}` |
| Settings O1 | `settings.getAll` (incl. `_integrations` true status: Razorpay test/live/not set up, email, WhatsApp, Shiprocket, AI) · `settings.set {key, value}` · fees/durations `scheduling.upsertConsultationType` |
| Team & accountant OW-16/17/23/28 | `staff.listStaff` · `invite {email, name, role:'consultant'\|'manager'\|'owner'\|'accountant', tempPassword}` · `setRoles` · `setStatus` · `resetPassword` |
| Activity log OW-25 | `staff.listAudit` |
| Accountant OW-30 | role `accountant` can call `listInvoices/getInvoice/listPayments/getDues/listExpenses/getSalesSummary/getTrialBalance` only |

**Next for OWNER (O2):** GST lines (CGST/SGST/IGST by place of supply) once GSTIN is set (`tax.rates` setting), invoice PDF, P&L / balance sheet from `journal_lines`, Razorpay live check. Secrets stay in the private config file (never in settings).

## Common to all four apps
- **Live vs demo:** at start call `BeWise.available()` (or `GET ../api/v1/system.health`). **true** → real data only; **false** → keep today’\s demo data so GitHub Pages previews keep working.
- **SDK:** `/api/sdk/bewise-api.js` (load with `<script src="../api/sdk/bewise-api.js">` — apps live at `/<app>/` next to `/api/`) + types `api/sdk/bewise-api.d.ts`. Or copy its 10-line `call()` into your own `lib/api.ts`. Every POST needs header `X-BeWise: 1`; session is an HttpOnly cookie (`credentials: "include"`).
- **Errors:** show `error.message` as-is (plain words). `401` → show sign-in.
- **Ids:** server ids are UUIDs; display codes (`BW-A-00001`, `BW-00001`, `INV/2026-27/0001`) come back as `code` / `number`.
- **Money** in paise. **Times** ISO 8601 UTC (`…Z`) — display in Asia/Kolkata.
- **Your module file** in `api/modules/` is yours to extend (new functions, new migration `api/migrations/NNNN_<module>_<what>.sql`). Don’\t edit others’\ — file a request.
- **Test:** local MariaDB + `php -S` (see `api/README.md` → “Changing the backend”); CI `api-tests.yml` must stay green.
- Reference: `api/README.md` (all functions), `hosting/HOSTINGER-DATABASE.md` (how the owner turns on the DB), D-44.
