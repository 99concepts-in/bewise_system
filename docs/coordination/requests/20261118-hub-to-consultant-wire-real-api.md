# Wire Jitendra Khimlani's app to the real backend (Hostinger PHP + MySQL)
From: HUB · To: CONSULTANT · Priority: **P0** · Status: OPEN · 2026-11-18

**Why:** owner asked for a fully functional live app with a real database (D-44). API at `/api/`, tested end-to-end.

| Screen | API |
|---|---|
| Sign-in | `auth.login {email, password}` (owner sets his temporary password at install / `staff.invite`) · `auth.changePassword` · `auth.me` |
| Today, check-in, month calendar | `analytics.today` · `scheduling.listAppointments {date \| from,to}` · `checkInAppointment` · `startSession` · `completeAppointment` · `markNoShow` |
| Availability & calendar sync CN-28 | `getAvailability` · `setAvailability {rules:[{weekday 1-7, start, end, modes}]}` · `addException` · `removeException` · `getCalendarFeedUrl` (ICS for Google/Apple; two-way Google sync = your next step) |
| Book for a client / share booking link | `crm.searchClients` · `crm.createClient` (walk-in) · `scheduling.bookForClient {clientId, consultationTypeId, mode, startsAt, payLater?}` |
| Prep: case summary, flags, flowers CN-33…36 | `intake.getCaseSummary {appointmentId}` (rules-based now — swap in Claude in `intake_rules_summary()`, D-36) · `getFlowersToConsider` · `listClientFlags` · `getIntakeAnswers {appointmentId}` · mapping editor `listMapping/upsertMapping` |
| Session: feelings, notes, summary | `consultation.listConcernCatalog` · `setSessionConcerns` · `saveNotes` / `listNotes` (encrypted, author only) · `saveClientSummary {share}` |
| Remedy builder (38 + Rescue) | `remedies.listBachRemedies` · `giveRemedy {clientId, appointmentId, flowers:[{id\|name, rationale}], drops, timesPerDay, days, bottleMl, form, alcoholFree?}` (₹0 included order + office task, D-02/D-25) · `listFormulaHistory` · `listDrops {clientId}` |
| Progress, feedback, journal | `getProgressSummary {audience:'consultant', clientId}` · `scheduling.listSessionFeedback` · `journal.listEntries {clientId}` (if shared) |
| Sales & profit CN-30…32 | `finance.getSalesSummary {from, to}` (read-only, D-33) |
| Alerts | `notifications.listInbox` — safety alerts arrive here **priority high, to him only** (D-38) + email |

## Common to all four apps
- **Live vs demo:** at start call `BeWise.available()` (or `GET ../api/v1/system.health`). **true** → real data only; **false** → keep today’\s demo data so GitHub Pages previews keep working.
- **SDK:** `/api/sdk/bewise-api.js` (load with `<script src="../api/sdk/bewise-api.js">` — apps live at `/<app>/` next to `/api/`) + types `api/sdk/bewise-api.d.ts`. Or copy its 10-line `call()` into your own `lib/api.ts`. Every POST needs header `X-BeWise: 1`; session is an HttpOnly cookie (`credentials: "include"`).
- **Errors:** show `error.message` as-is (plain words). `401` → show sign-in.
- **Ids:** server ids are UUIDs; display codes (`BW-A-00001`, `BW-00001`, `INV/2026-27/0001`) come back as `code` / `number`.
- **Money** in paise. **Times** ISO 8601 UTC (`…Z`) — display in Asia/Kolkata.
- **Your module file** in `api/modules/` is yours to extend (new functions, new migration `api/migrations/NNNN_<module>_<what>.sql`). Don’\t edit others’\ — file a request.
- **Test:** local MariaDB + `php -S` (see `api/README.md` → “Changing the backend”); CI `api-tests.yml` must stay green.
- Reference: `api/README.md` (all functions), `hosting/HOSTINGER-DATABASE.md` (how the owner turns on the DB), D-44.
