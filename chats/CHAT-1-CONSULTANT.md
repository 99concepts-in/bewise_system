# CHAT 1 — CONSULTANT WORKSPACE (Jitu Bhaiya)

> **How to start this chat:** open a new Claude Code session on `exceptionalappstudios-ship-it/bewise_system`
> and send: **"Read `chats/CHAT-1-CONSULTANT.md` and follow it."**
> Your chat tag is **`consultant`** (logs, requests, PR titles `[CONSULTANT] …`).


> ⚠️ **UPDATE 2026-11-16 (owner):** No questionnaires in the client flow — **K3 is now optional/P3**. Instead: (1) store the optional booking note `appointments.client_note` (CL-15) and show it in K-01/K-04/K-05; (2) add **`session_feedback`** (rating, tags, notes for consultant) with `submitSessionFeedback()` / `listSessionFeedback()` and event `session_feedback.submitted` — show it on the client timeline (K-04) and Today (K-01). Client journal = emotion + time only (8 emotions). See `docs/03-CONTRACTS.md` and `docs/specs/client/00-CLIENT-FLOW-AND-SCREENS.md`.

> ⚠️ **UPDATE 2026-11-16 round 2 (owner):** Your workspace is now specified by **`docs/specs/consultant/00-CONSULTANT-FLOW-AND-SCREENS.md` (CN-01…CN-27)** and designed in **`design/consultant-v2/`**. Key changes: **no approval workflow** — "Give remedy" sends straight to client + office (`remedy.given`, FormulaStatus draft·given·superseded); client summary optional; **troubling emotions** per session (`progress` module); **3-line AI progress summary** for client + consultant (`getProgressSummary`); configurable Bach library (D-30). These override K4/K5 details below. **Round 3:** phone-first (boards `design/consultant-v2/CN-phone-*`), **calendar sync** Google two-way + Apple CalDAV + ICS feed (`connectCalendar`, `syncCalendar`, `external_busy_blocks` subtracted in slot engine), Me hub CN-29.

---

## 1. Who you are and who you build for

You are the product designer + full-stack engineer for the **Consultant Workspace** (`/consult`) of the BeWise Wellness PWA, and you own the **scheduling, questionnaire, consultation and Bach Flower remedy** logic that the rest of the system relies on.

Primary user: **Jitu Bhaiya**, the Bach Flower Remedy consultant. Works mostly on a **tablet** (landscape) between and during sessions, sometimes desktop, occasionally phone. Needs: see today at a glance, know each client deeply over time, document quickly and privately, build and approve remedy formulas confidently, never lose track of follow-ups.

Design feel: calm, focused, private. Serif (Cormorant Garamond) for client names and page titles, Inter for everything else, sage accents, navy rail.

**Hard rule (PRD §6):** the system *supports* the consultant's judgement and documentation. It must **never** diagnose, suggest or auto-prescribe remedies. No "recommended remedy" features.

## 2. Read before doing anything (in this order)

1. `docs/04-COORDINATION-PROTOCOL.md` — how the 4 chats + HUB work together (**mandatory**).
2. `docs/coordination/STATUS.md`, `docs/coordination/DECISIONS.md`, other chats' logs in `docs/coordination/log/`, requests to you in `docs/coordination/requests/*-to-consultant-*`.
3. `docs/00-MASTER-PLAN.md` — architecture, repo layout, phases.
4. `docs/01-DESIGN-SYSTEM.md` + `design/tokens.json`.
5. `docs/02-FLOWS-AND-SCREENS.md` — journeys J1, J3, J4 and screens **K-01 … K-11**.
6. `docs/03-CONTRACTS.md` — especially *scheduling*, *questionnaires*, *consultation & remedies*, events, permissions, visibility rules.
7. Design boards: `design/boards/05-consultant-client-profile.jpg`, `06-consultant-remedy-builder.jpg` (direction, not pixel spec).
8. Source PDFs are summarised in the docs; PRD §5–6 and §20 are the key sections for you.

## 3. Step 0 — check the foundation

Run `git fetch origin main && git merge --no-edit origin/main`, then open `docs/coordination/STATUS.md`.

- If **`FOUNDATION: ✅`** → go to milestone K1.
- If **not** ✅ → **do not scaffold an app or create package.json.** Instead write detailed specs for K-01, K-02, K-04, K-05, K-06 in `docs/specs/consultant/` (layout, fields, validation, states, permissions, events, acceptance criteria), plus the slot-generation algorithm spec and the formula versioning state machine. Commit, push, log, and tell the user you're waiting for the HUB foundation.

## 4. What you own

| Kind | Items |
|---|---|
| Routes | `src/app/(consultant)/consult/**` |
| Modules | `src/modules/scheduling`, `src/modules/questionnaires`, `src/modules/consultation`, `src/modules/remedies` |
| Tables | `consultation_types`, `availability_rules`, `availability_exceptions`, `appointments`, `appointment_history`, `questionnaire_*`, `consultation_records`, `practitioner_notes` 🔒, `client_summaries`, `follow_ups`, `bach_remedies`, `formula_templates`, `formulas`, `formula_versions`, `formula_items`, `remedy_orders`; view `v_prep_sheet` |
| Functions others call | everything under *scheduling*, *questionnaires*, *consultation & remedies* in `docs/03-CONTRACTS.md` §5 — replace HUB's stubs with real implementations, keep signatures |
| Events you emit | `appointment.held/confirmed/rescheduled/cancelled/completed/no_show`, `questionnaire.assigned/submitted`, `formula.approved`, `remedy.given`, `client_summary.shared`, `followup.due` |
| Events you handle | `payment.captured` & `payment.failed` (appointment purpose → confirm / release hold), `shipment.delivered` (remedy order → start follow-up clock), `appointment.confirmed` (auto-assign questionnaire) |
| Specs / tests | `docs/specs/consultant/**`, `tests/e2e/consultant/**`, unit tests next to your modules |
| Log | `docs/coordination/log/consultant.md` |

## 5. Do not touch

Other chats' routes and modules (`(client)`, `(public)`, `(manager)`, `(owner)`, `commerce`, `catalog`, `fulfilment`, `inventory`, `finance`, `notifications`, `settings`, …), HUB docs, `STATUS.md`, `DECISIONS.md`. Shared kit (`src/components/ui`, `shell`, `src/lib`) — small additive changes only, logged. Need something else → request file.

## 6. What you depend on (and the fallback while it isn't live)

| Need | From | Fallback |
|---|---|---|
| Consultation type fees/durations edited in settings UI | OWNER (O1) calls your `upsertConsultationType()` | Seeded types; you can ship a minimal admin form in `/consult/settings` behind a flag |
| Payment for bookings (`payment.captured`) | OWNER (O2) | In dev, a `@stub` "mark paid" action behind flag `booking` (never in production) |
| Notifications (confirmations, reminders) | OWNER (O3) via events | Just emit events; don't send messages yourself |
| Client identity & contact | `crm.getClient()` (HUB/MANAGER) | Use the HUB implementation |
| Remedy sales order creation | CLIENT (C4) handles `remedy.given` | Your side is complete once the event is emitted with the right payload |

## 7. Who depends on you — ship these first

1. **`getAvailableSlots()` + `holdAppointment()` + payment handler** → CLIENT booking (C2). This is on the critical path. Deliver in K1.
2. **`remedy.given` + `getPrepSheet()`** → CLIENT remedy order (C4) and MANAGER prep queue (M2). Deliver in K4.
3. **`getCurrentRemedyForClient()` + `listClientSummaries()`** → CLIENT My Remedies (C5).
4. **Questionnaire APIs** → CLIENT questionnaire filling (C3).

## 8. Milestones (do in order; one PR each)

### K1 — Scheduling engine & availability (screen K-02)
- Data: `consultation_types` (name, slug, duration_min, fee_paise, modes allowed, buffer_min, active), `availability_rules` (weekday, start, end, mode, location), `availability_exceptions` (date ranges blocked/extra), `appointments` (+ code `BW-A-#####`, status enum, mode, meeting_url, location, hold_expires_at, price_paise, cancellation info), `appointment_history`.
- Slot engine: rules − exceptions − (confirmed + unexpired held) appointments − buffers; respects min notice (e.g. 3 h) and max horizon (e.g. 60 days); IST; no double booking under concurrency (exclusion constraint or row lock).
- Hold: `pending_payment` with 15-min expiry; cron expires holds → `expired`.
- Handle `payment.captured` (purpose appointment) → `confirmed`, emit `appointment.confirmed`; `payment.failed` → release.
- Reschedule & cancel with policy from `getSetting('policy.cancellation')` — `@decision(D-08)`.
- K-02 UI: week view, working hours editor, block dates/leave, see bookings, reschedule by drag with confirmation.
- Tests: slot math (DST-free IST, edges, buffers), concurrency (two holds same slot → one wins), policy outcomes.

### K2 — Today, Clients, Client profile (K-01, K-03, K-04)
- K-01: session strip, next session card (Start / Join link), questionnaires to review, formulas in draft/review, follow-ups due.
- K-03: search by name/phone/client code, filters, columns: name, last visit, next visit, status.
- K-04: header (serif name, client code, age, consent chip), tabs Overview · Timeline · Questionnaires · Journal · Remedies · Notes. Timeline merges appointments, questionnaires, formulas, summaries, orders (status only). Journal trend chart only if the client shares (`@decision(D-15)`).
- RLS: consultant sees only clients assigned/with appointments with them.

### K3 — Questionnaires (K-08 builder, review inside K-04/K-05)
- Template → versions (immutable once used) → assignment → responses (draft + submitted).
- Question types: single/multi choice, rating 1–5 with labels, short/long text, date; required; help text; sections; simple conditional skip.
- Auto-assign the "Pre-consultation" template on `appointment.confirmed` (first consultation) and emit `questionnaire.assigned`.
- Provide `getAssignmentForClient`, `saveResponseDraft`, `submitResponses` for the CLIENT chat's C-05.
- Review view highlights changed answers vs previous submission.

### K4 — Bach Flower library + Remedy builder + approval (K-06, K-07, K-10)
- `bach_remedies`: the **38 remedies** + Rescue Remedy as a composite reference, each with the 7 emotional groups (Fear · Uncertainty · Insufficient interest in present circumstances · Loneliness · Oversensitivity to influences & ideas · Despondency or despair · Over-care for the welfare of others). Seed names/groups only; descriptions marked "pending verification" until Jitu approves (`@decision(D-10)`). Library editable by consultant with version note.
- Formula: per client; versions v1, v2…; items (remedy, drops, private rationale 🔒), dosage (drops × times/day), duration, bottle size, client instructions, label text.
- State machine: `draft → in_review → approved → sent_to_office`; new version supersedes previous; approved versions are immutable (edit = new version). Duplicate from previous / from template.
- **Preview client summary** (K-10) shows exactly what C-06 will show: remedy names, plain-language description, instructions, duration, consultant name, date. Never rationale/notes.
- **Approve & send to office** creates `remedy_orders` row and emits `remedy.given` (payload per contracts). Expose `getPrepSheet()` / `v_prep_sheet` for MANAGER.
- Board reference: `06-consultant-remedy-builder.jpg` — keep the banner "Supports your professional judgement — the system never prescribes."

### K5 — Session screen, notes, summaries, follow-ups (K-05, K-09)
- Session view: left = questionnaire answers + history + previous formula; right = **Private notes** (`PrivateBlock`, autosave every few seconds, version history) and **Summary for client** (separate editor, explicit "Share with client" → `client_summary.shared`).
- Mark completed / no-show → events.
- End-session wizard: set follow-up (in N days/weeks) → `follow_ups` → cron emits `followup.due`; open remedy builder.
- K-09 follow-ups: due/overdue/upcoming, book on client's behalf (uses your own holdAppointment with a "paid offline/pending" path per finance contract).

### K6 — Polish & quality
Tablet landscape layouts, phone fallback (rail → bottom bar), keyboard shortcuts in builder, empty/error states, e2e: J1 consultant part, J3; RLS tests proving manager/client cannot read `practitioner_notes` or rationale; audit rows for sensitive reads.

## 9. Sensitive-data rules (test them)

- `practitioner_notes` and `formula_items.rationale` → readable only by the author consultant (+ audited break-glass permission, `@decision(D-03)`).
- Manager/prep staff only ever see `v_prep_sheet`.
- Clients only see approved formula view + shared summaries.
- Never put notes/rationale in notifications, events payloads, logs or analytics views.
- Mark such code `// @sensitive`.

## 10. Every session

**Start:** fetch + merge `origin/main`; read STATUS, DECISIONS, other logs, your requests.
**During:** ownership headers + tags from protocol §7 in every file; specs in `docs/specs/consultant/` before building a screen.
**End:** run lint/typecheck/tests → update `docs/coordination/log/consultant.md` (newest on top) → commit → push your branch → open/update PR `[CONSULTANT] Kx …` to `main` when a milestone is complete → tell the user in 3–5 lines what's done, what's next, and anything blocked.

## 11. Your first reply in this chat

Summarise in ≤10 lines: your scope, what you'll deliver first (K1), dependencies, and whether the foundation is ready. Then start.
