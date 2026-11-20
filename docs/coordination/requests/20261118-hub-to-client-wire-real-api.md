# Wire the client app to the real backend (Hostinger PHP + MySQL)
From: HUB · To: CLIENT · Priority: **P0** · Status: OPEN · 2026-11-18

**Why:** owner asked for a fully functional live app on Hostinger with a real database (D-44). The API is live in `api/` and deploys with every push to `main` at `/api/`. All functions are tested end-to-end (`api/tests/e2e.mjs`).

## Swap `src/lib/store.ts` actions for API calls (1:1 with your notes)
| Screen / store action | API |
|---|---|
| Sign-in (CL-xx) phone/email | `auth.requestOtp {email}` → `auth.verifyOtp {email, code}` (email OTP for now — D-04 phone OTP later) · `auth.me` on start · `auth.logout` |
| Profile, onboarding, consents | `crm.getMyProfile` · `crm.updateClientProfile {name, phone, dob, city, gender, allergies, onboarded:true}` · `crm.recordConsent {type, granted}` |
| Addresses | `crm.listAddresses` · `crm.upsertAddress` · `crm.deleteAddress` |
| Intake IN-01…IN-12 | `intake.getIntakeForm {kind}` (pre-filled) · `intake.saveIntakeDraft {intakeId, answers, step}` · `intake.submitIntake {intakeId, answers, consent:{shareWithConsultant:true, aiSummary}}` — **answers = your `IntakeAnswers` shape unchanged**; statements must stay the exact `NUANCE` strings (mapping keys) |
| Booking CL-11…CL-18 | `scheduling.listConsultationTypes` · `getAvailableSlots {consultationTypeId:'first'\|'followup', mode, from, to}` → `holdAppointment {…, startsAt, clientNote, intakeId, payLater}` → `BeWise.pay('appointment', id)` (returns `{manual:true}` until Razorpay keys exist → show “Pay at the studio / pay later”) |
| Appointments, reschedule, feedback CL-23 | `listAppointments` · `getAppointment` · `rescheduleAppointment` · `cancelAppointment` (paid → refused, D-16) · `submitSessionFeedback {appointmentId, rating, tags, benefits, notesForConsultant}` · `getCalendarFeedUrl` |
| My remedy, drops | `remedies.getCurrentRemedyForClient` · `remedies.logDrops {date, taken}` · `listDrops` |
| Summaries & progress | `consultation.listClientSummaries` · `consultation.getProgressSummary {audience:'client'}` |
| Journal & goals | `journal.listEntries/addEntry/deleteEntry` · `listGoals/upsertGoal/checkGoal/deleteGoal` · share toggle `crm.updateClientProfile {shareJournal}` |
| Store, bag, checkout, orders | `catalog.listProducts` (GET) · `commerce.createOrder {lines:[{key, qty}], addressId \| pickup}` (keys = your CartLine keys incl. `remedy-reorder`) → `BeWise.pay('sales_order', id)` · `listOrders` · `getOrder` · `submitReview` · `requestReplacement` |
| Notifications | `notifications.listInbox` · `markRead` |
| Ask BeWise | `companion.sendCompanionMessage` is a **@stub** (safety route works) — yours to implement with Claude (load the `claude-api` skill) |

Plans/coupons/launch offer aren’t in the API yet — keep them client-side behind the demo flag, or add them to `api/modules/commerce.php` + a migration.

## Common to all four apps
- **Live vs demo:** at start call `BeWise.available()` (or `GET ../api/v1/system.health`). **true** → real data only; **false** → keep today’\s demo data so GitHub Pages previews keep working.
- **SDK:** `/api/sdk/bewise-api.js` (load with `<script src="../api/sdk/bewise-api.js">` — apps live at `/<app>/` next to `/api/`) + types `api/sdk/bewise-api.d.ts`. Or copy its 10-line `call()` into your own `lib/api.ts`. Every POST needs header `X-BeWise: 1`; session is an HttpOnly cookie (`credentials: "include"`).
- **Errors:** show `error.message` as-is (plain words). `401` → show sign-in.
- **Ids:** server ids are UUIDs; display codes (`BW-A-00001`, `BW-00001`, `INV/2026-27/0001`) come back as `code` / `number`.
- **Money** in paise. **Times** ISO 8601 UTC (`…Z`) — display in Asia/Kolkata.
- **Your module file** in `api/modules/` is yours to extend (new functions, new migration `api/migrations/NNNN_<module>_<what>.sql`). Don’\t edit others’\ — file a request.
- **Test:** local MariaDB + `php -S` (see `api/README.md` → “Changing the backend”); CI `api-tests.yml` must stay green.
- Reference: `api/README.md` (all functions), `hosting/HOSTINGER-DATABASE.md` (how the owner turns on the DB), D-44.
