# Request: foundation pieces the consultant module needs + contract clarifications
From: CONSULTANT · To: HUB · Priority: P1 · Status: OPEN

## Need in Phase 0 (so K1/K3 can start the day FOUNDATION is ✅)
1. Postgres extension **`btree_gist`** — exclusion constraint against double booking (`K1 §2.5`).
2. **`lib/crypto`**: `encryptSensitive(json) / decryptSensitive(bytes)` (AES-256-GCM envelope, key id per row, key from server env/KMS) for intake answers, practitioner notes, `ai_runs`.
3. **Supabase Vault** access from server code for calendar secrets (Google refresh token, Apple app-specific password).
4. Cron routes allowed under `src/app/api/cron/*` for module owners: `scheduling-expire` (1 min), `calendar-sync` (10 min), `progress-refresh` (daily 05:30 IST).
5. Env vars documented: `ANTHROPIC_API_KEY`, `GOOGLE_OAUTH_CLIENT_ID/SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` (server only).
6. Permissions seeded: `scheduling.appointment.create|edit`, `scheduling.availability.edit`, `intake.response.view`, `intake.mapping.edit`, `consultation.session.edit`, `remedies.formula.edit`, `fulfilment.prep.view` (for `getIntakeFlagsForPrep`).
7. `Slot` type in contract stubs: `{ startsAt: string; endsAt: string; mode: AppointmentMode; consultantId: string; isPreferred?: boolean }`.

## Contract clarifications (additive, logged in consultant log)
- `cancelAppointment` keeps its signature but always returns `refundEligiblePaise: 0` (D-16); same for the `appointment.cancelled` payload.
- New events: `appointment.expired { appointmentId, clientId }`, `appointment.needs_new_time { appointmentId, clientId }` (payment captured after the hold was lost — no refunds, so the client picks a new time).
- `remedy.given` payload gains optional `pricePaise`, `includedInAppointmentId` (D-02: ₹0 when included in a paid session) — COMMERCE needs it for `createRemedySalesOrder`.
- New tables owned by my modules: `scheduling_preferences`, `intake_response_revisions`, `intake_appointment_links`, `ai_runs`.
- `questionnaires` module (contracts §2/§5) is superseded by `intake` (D-35) — I will not build it unless told.

## Decisions for HUB/owner (defaults in specs meanwhile)
- Live-session **encrypted offline outbox** for notes (CN-06/CN-27) vs Master Plan "never cache notes". Default: encrypted IndexedDB outbox, purged after sync/sign-out; service worker caches nothing.
- Safety alert fires on **draft save** of IN-09 (not only on submit) — DPDP basis to confirm (`K3 §6`).
- AI requests leave India (Anthropic API) — legal OK + consent copy (`K6 §2`).
- STATUS lists consultant milestones K1–K6 (old); brief v2 has K1–K8 (K3 = intake, K5 = remedies, K6 = AI, K7 = Me & business, K8 = polish). Please update STATUS.

Workaround meanwhile: specs written; no code until FOUNDATION ✅.
---
