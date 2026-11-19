# BeWise API (`/api`): the real backend on Hostinger

> **Owner:** HUB (foundation). Each module file is owned by its chat, as in the module ownership table in `docs/03-CONTRACTS.md` §2.
> **Decision D-44 (2026-11-18):** the backend is PHP 8.1+ with MySQL on Hostinger. It replaces Supabase/Postgres from D-01.
> Function names, roles and privacy rules from `docs/03-CONTRACTS.md` are unchanged.

## How it works
```
app (browser) ──POST /api/v1/<module>.<function>  JSON──▶ api/index.php ──▶ api/modules/<module>.php
                 header X-BeWise: 1 · cookie bw_session            ▲ one DB transaction per call
                 ◀── { ok:true, data } | { ok:false, error:{ code, message } }
```

**Sign-in**
- Clients use `auth.requestOtp` → `auth.verifyOtp`, a 6-digit email code.
- Staff use `auth.login` with email and password. The owner adds staff with `staff.invite`.
- The session lives in an HttpOnly cookie, so apps store nothing.

**Roles**
- The roles are `client` · `consultant` · `manager` · `owner` · `accountant`.
- Every function checks the role on the server with `Auth::require(...)`.
- The UI hides things, but the server is what enforces access.

**Privacy (tested in `tests/e2e.mjs`)**
- Encrypted at rest (sodium), so the database never holds them in plain text: intake answers, case summary, practitioner notes.
- Consultant only: notes, flower rationale, case summary, flowers to consider, the safety alert (D-38), the booking note.
- Manager: gets only the prep sheet, which is flowers, bottle and alcohol-free. No notes, no intake.
- Owner: sees session ratings only. No notes, no intake, no feedback text.
- Accountant: finance only.

**Events**
- `Events::emit()` writes to `domain_events` and runs the handlers in the same transaction.
- Example: `payment.captured` confirms the appointment or order, creates fulfilment tasks, issues the invoice and posts the journal.

**Money**
- All amounts are in paise.
- Invoices are numbered `INV/2026-27/0001` (FY April–March).
- Posting is double-entry, balanced, idempotent and per source (draft chart of accounts, D-13). There are no refunds (D-16).

**Payments**
- Without Razorpay keys, `finance.createCheckout` returns `{provider:'manual'}`. The app then shows "Pay at the studio / pay later", and staff use `finance.recordPayment`.
- With keys it returns Razorpay order data. `BeWise.pay()` opens Checkout. The webhook is the source of truth.

## Use it from an app
```html
<script src="/api/sdk/bewise-api.js"></script>   <!-- or relative: ../api/sdk/bewise-api.js -->
<script>
  if (await BeWise.available()) {                 // real backend installed?  else keep demo data
    const me = await BeWise.api.auth.me()          // null when signed out
    const { items } = await BeWise.api.scheduling.listAppointments({ status: ['confirmed'] })
    await BeWise.pay('appointment', appointmentId)  // Razorpay or { manual:true }
  }
  BeWise.on('signedout', () => showSignIn())
</script>
```
- `BeWise.call(fn, input)` never throws: it returns `{ok, data | error}`.
- `BeWise.api.<module>.<fn>(input)` resolves to `data`, or throws a `BeWiseError` with `.code` and `.message`. Show `.message` to the user; it is written in plain words.
- For local development against another server, set `window.BEWISE_API_BASE = 'https://<domain>/api'` before loading the SDK. Cookies need the same site, so test on the domain itself.
- **Live vs demo rule (all apps):** when `BeWise.available()` is false, keep today's demo data so GitHub Pages previews still work. When it is true, use only real data.

## Functions (v1)
Input and output shapes are in the module files; each function is documented where it is defined.

| Module (owner) | Functions |
|---|---|
| system (HUB) | `health` (GET) · `publicConfig` (GET): fees, studio, policies, Razorpay key id, `me` |
| auth (HUB) | `requestOtp {email}` · `verifyOtp {email, code}` · `login {email, password}` · `me` · `logout` · `changePassword` |
| crm (MANAGER) | `getMyProfile` · `updateClientProfile` · `recordConsent` · `listAddresses` · `upsertAddress` · `deleteAddress` · staff: `searchClients {q}` · `getClient {id}` · `createClient` (walk-in) |
| scheduling (CONSULTANT) | `listConsultationTypes` (GET) · `upsertConsultationType` (owner) · `getAvailability` · `setAvailability {rules}` · `addException` · `removeException` · `getAvailableSlots {consultationTypeId, mode, from?, to?}` · `holdAppointment {consultationTypeId, mode, startsAt, clientNote?, intakeId?, payLater?}` · `bookForClient` (staff) · `rescheduleAppointment` · `cancelAppointment` · `listAppointments {status?, date?, clientId?}` · `getAppointment` · `checkInAppointment` · `startSession` · `completeAppointment` · `markNoShow` · `getAppointmentHistory` · `submitSessionFeedback` · `listSessionFeedback` · `getCalendarFeedUrl` (ICS) |
| intake (CONSULTANT data · CLIENT UI) | `getIntakeForm {kind}` · `saveIntakeDraft` · `submitIntake {intakeId, answers, consent}` · `attachIntakeToAppointment` · `getIntakeAnswers` · consultant: `getCaseSummary {appointmentId}` · `getFlowersToConsider` · `listClientFlags` · `listMapping` · `upsertMapping` · prep: `getIntakeFlagsForPrep` |
| remedies (CONSULTANT) | `listBachRemedies` · `updateBachRemedy` · `giveRemedy {clientId, appointmentId?, flowers[], drops?, timesPerDay?, …}` · `getCurrentRemedyForClient` · `listFormulaHistory` · `reorderRemedy` · `getPrepSheet {remedyOrderId}` · `logDrops` · `listDrops` |
| consultation (CONSULTANT) | `saveNotes` · `listNotes` (author only) · `saveClientSummary {share}` · `listClientSummaries` · `listConcernCatalog` · `upsertConcern` · `setSessionConcerns` · `getSessionConcerns` · `getProgressSummary {audience}` |
| journal (CLIENT) | `listEntries` · `addEntry {emotion, note?, at?}` · `deleteEntry` · `listGoals` · `upsertGoal` · `checkGoal` · `deleteGoal` |
| catalog (MANAGER) | `listProducts` (GET) · `getProductBySlug` · `upsertProduct` · `archiveProduct` · `setSoldOut` · `adjustStock` · `listStockMovements` |
| commerce (CLIENT) | `createOrder {lines:[{key, qty}], addressId? \| pickup}` · `listOrders` · `getOrder` · `submitReview` · `requestReplacement` · staff: `listReplacementRequests` · `decideReplacement` |
| fulfilment (MANAGER) | `listTasks {stage?, type?}` · `setStage {id, stage, courier?, awb?, trackingUrl?}` · `getOrderTracking` |
| finance (OWNER) | `createCheckout {purpose, refId}` · `verifyCheckout` · `recordPayment` (staff) · `listInvoices` · `getInvoice` · `listPayments` · `getDues` · `createExpense` · `listExpenses` · `decideExpense` (owner) · `getSalesSummary` (sales **and profit**, D-33) · `getTrialBalance` |
| notifications (OWNER) | `listInbox` · `markRead {id \| all}` |
| settings (OWNER) | `getAll` · `get {key}` · `set {key, value}` |
| staff (OWNER) | `listStaff` · `invite {email, name, role, tempPassword}` · `setRoles` · `setStatus` · `resetPassword` · `listAudit` |
| analytics (OWNER) | `today` (counts for the Today screens) |
| companion (CLIENT) | `sendCompanionMessage`: **@stub**. The safety route works; the CLIENT chat implements the Claude answer (D-29) |

WhatsApp: `api/lib/whatsapp.php` → `wa_send($phone, '<template key>', $vars, $dedupeKey)` (Mart2Meta). Keys & texts: `hosting/WHATSAPP-MART2META.md`. Cron: `api/cron.php` (every 30 min).
Owner tools page: `/api/tools.php` (owner password) — add team, Razorpay review test login (username login), Razorpay keys → private config.
CORS: `https://bewiseglobal.in` (+ `www`) may call the API with credentials; more origins via config `cors_origins`.

Webhook: `POST /api/webhooks/razorpay`. Calendar feed: `GET /api/calendar/<token>.ics`.

## Changing the backend (all chats)
1. **New table or column:** add `api/migrations/NNNN_<module>_<what>.sql` with the next number and a header comment `-- @owner <CHAT>`. Never edit a migration that has shipped. Use MySQL/MariaDB-compatible SQL only, with no stored procedures, and end each statement with `;` followed by a newline.
2. **New function:** add it to *your* module file, call `Auth::require()` first, use the `req_*` validators, and return arrays. Don't change another chat's function signature; file a request instead, as the coordination protocol requires.
3. **Seed data:** add to `api/lib/seed.php` with `INSERT IGNORE`, so it is idempotent and never overwrites what people have edited in the apps.
4. **Test locally:**
   ```bash
   sudo apt-get install -y mariadb-server php8.3-mysql && sudo mysqld_safe &
   mysql -e "CREATE DATABASE bw_test; CREATE USER 'bw'@'localhost' IDENTIFIED BY '<local-only>'; GRANT ALL ON bw_test.* TO 'bw'@'localhost'"
   php -S 127.0.0.1:8099 -t . api/tests/router.php &      # repo root
   # open http://127.0.0.1:8099/api/install.php, then in the written config set 'debug' => true, 'debug_show_otp' => true, mail 'transport' => 'log'
   node api/tests/e2e.mjs http://127.0.0.1:8099 <owner-email> <pw> <consultant-email> <pw> <manager-email> <pw>
   ```
   `debug_show_otp` returns sign-in codes in the API response. Use it only on a local test install, never live.
5. CI runs `.github/workflows/api-tests.yml` with a MySQL service on every push that touches `api/`.
