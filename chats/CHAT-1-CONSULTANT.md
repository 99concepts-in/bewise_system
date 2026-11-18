# CHAT 1 — CONSULTANT APP (Jitu Bhaiya · Jitendra Khimlani)

> **Start a new Claude Code chat on `exceptionalappstudios-ship-it/bewise_system` and send:**
> **"Read `chats/CHAT-1-CONSULTANT.md` and follow it."**
> Chat tag: **`consultant`** · PR titles `[CONSULTANT] …` · Brief version **v2 (2026-11-17)** — replaces all earlier versions.

> 🔔 **UPDATE 2026-11-18 — the real backend is ready (D-44, replaces Supabase/Next server).** Backend = `api/` (PHP 8 + Hostinger MySQL), deployed at `/api/` with every push to `main`. **Step 0 is now ✅.** Your first task: `docs/coordination/requests/20261118-hub-to-consultant-wire-real-api.md` (P0) — swap demo data for API calls, keep demo data only when `BeWise.available()` is false. Your module files in `api/modules/` are yours to extend (new migrations in `api/migrations/`). Reference `api/README.md`. Where this brief says Supabase / RLS / `src/modules/*` / Postgres, read: `api/modules/<module>.php`, server-side role checks, MySQL.

---

## 1. Mission
You are the product designer + full-stack engineer for **Jitu Bhaiya's consultant app** (`/consult`) and the logic behind it:
**scheduling & calendar sync, intake/case-taking data + AI case summary, consultation sessions, troubling emotions,
progress summaries, the Bach Flower library, the remedy builder ("Give remedy"), follow-ups and client feedback.**

**User:** Jitendra Khimlani ("Jitu Bhaiya") — Bach Remedy Therapist, Life Transformation Coach, 12+ years, 2,00,000+ people reached,
based in Vadodara, website www.jitendrakhimlani.com. Uses his **phone first** (iPad/laptop adaptation second).
His day = people, not paperwork: one calm screen at a time, everything about a client one tap away, notes never lost,
a remedy in under a minute. **The system never prescribes — it organises, remembers, summarises; he decides.**

## 2. Source of truth — read in this order
1. `docs/04-COORDINATION-PROTOCOL.md` — how the chats + HUB work (mandatory).
2. `docs/coordination/STATUS.md`, `DECISIONS.md` (D-01…D-43), `CONTENT-CHECKLIST.md`, other chats' logs in `docs/coordination/log/`, requests to you `docs/coordination/requests/*-to-consultant-*`.
3. **`docs/specs/consultant/00-CONSULTANT-FLOW-AND-SCREENS.md`** — your screens **CN-01…CN-36**.
4. **`docs/specs/client/01-INTAKE-CASE-TAKING.md`** — intake you own (data, mapping, AI, safety) + CN-33…36.
5. `docs/03-CONTRACTS.md` — your modules: *scheduling, intake, progress, consultation & remedies*; events; permissions; visibility rules.
6. Design: **visual language = v4 "Soft Bloom"** (`design/v4-soft-bloom/README.md`, tokens `design/tokens.json → v4`, assets `design/assets/v4/`). Your v4 preview: `design/consultant-v4/CN4-board-00-today-prep-feelings.jpg`. **Layouts/content:** `design/consultant-v2/CN-phone-*.jpg` (phone, primary) and `CN-board-*` (iPad), `design/intake-v2/IN-board-06/07` (case summary, flowers to consider). Real photo: `design/assets/people/jitu-bhaiya-*.jpg`.
7. `docs/00-MASTER-PLAN.md` (architecture), `docs/01-DESIGN-SYSTEM.md` (components, states, accessibility).

## 3. Decisions that shape your work
| Topic | Decision |
|---|---|
| Fees | **First consultation ₹1,000 · Follow-up ₹800, both include the remedy** (D-09, D-02). Remedy given after a paid session → ₹0 remedy order; reorders priced by setting `remedy.reorder_price` |
| Remedies | **No approval workflow** — he taps **Give remedy** → client + office (D-25). `FormulaStatus = draft · given · superseded` |
| Summary for client | **Optional** toggle (D-26) |
| Troubling emotions | He selects per session from an **editable** list; pre-filled from intake (D-27) |
| Intake | Clients fill a case intake before the first booking; 2-min check-in before follow-ups (D-35). **You own the data, mapping, AI** |
| AI | **AI case summary** + **3-line progress summary** (Claude, server-side; load the `claude-api` skill before coding) (D-28, D-36) |
| Flowers to consider | Deterministic list from the intake mapping with reasons — **Jitu Bhaiya only**, never the client (D-37) |
| Safety | Self-harm answer "Sometimes/Often" → priority alert **to Jitu Bhaiya only**; client sees Tele-MANAS 14416 / 112 (D-38) |
| Bach library | Seed **38 + Rescue Remedy**, configurable/hideable (owner said "36" — D-30 open). Descriptions + the 38 intake statements need **his approval** |
| Calendar | **Google two-way + Apple (iCloud CalDAV) + private ICS feed**; busy times block client slots (D-31) |
| Business view | He sees **sales and profit** read-only (CN-30…32) (D-33) |
| Refunds | **None** anywhere (D-16). Clients can only reschedule (free ≥24 h before; <24 h one reschedule; no-show forfeits — D-08) |
| Device | **Phone first** (D-24) |
| Privacy | His private notes & flower reasons: only him. Owner cannot read them (D-03). Manager sees only the prep sheet |

## 4. Step 0 — is the foundation ready?
`git fetch origin main && git merge --no-edit origin/main`, then check `docs/coordination/STATUS.md` for **`FOUNDATION: ✅`** (app skeleton, v4 UI kit, auth & roles, core tables, contract stubs — built by the HUB chat).
- **✅** → start K1.
- **Not yet** → do **not** create an app or package.json. Write detailed specs in `docs/specs/consultant/` for K1 (slot engine + calendar sync algorithm), the intake data model & mapping table, the AI prompts/JSON schemas for case & progress summaries, and CN-03/05/06/09 screen specs (states, validation, events). Commit, push, log, and tell the user you're waiting for the foundation.

## 5. What you own
| Kind | Items |
|---|---|
| Routes | `src/app/(consultant)/consult/**` |
| Modules | `src/modules/scheduling`, `intake`, `progress`, `consultation`, `remedies` |
| Tables | `consultation_types`¹, `availability_rules`, `availability_exceptions`, `appointments` (+`client_note`), `appointment_history`, `session_feedback`, `calendar_connections`, `external_busy_blocks`, `calendar_feed_tokens`, `intake_templates`, `intake_responses` 🔒, `intake_checkins`, `intake_flags`, `intake_mapping`, `case_summaries` 🔒, `concern_catalog`, `session_concerns`, `progress_summaries`, `consultation_records`, `practitioner_notes` 🔒, `client_summaries`, `follow_ups`, `bach_remedies`, `formula_templates`, `formulas`, `formula_versions`, `formula_items` (reason 🔒), `remedy_orders` |
| Functions others call | everything under *scheduling, intake, progress, consultation & remedies* in `docs/03-CONTRACTS.md` §5 (replace HUB stubs, keep signatures) |
| Events you emit | `appointment.*`, `session_feedback.submitted`, `intake.submitted`, `intake.safety_flagged`, `intake.checkin_submitted`, `progress_summary.refreshed`, `remedy.given`, `client_summary.shared`, `followup.due` |
| Events you handle | `payment.captured` / `payment.failed` (appointments), `shipment.delivered` (follow-up clock) |

¹ Fees/durations are edited in the Owner's settings, which call your `upsertConsultationType()`.

## 6. Do not touch
Client/manager/owner routes and modules (`commerce`, `companion`, `catalog`, `fulfilment`, `inventory`, `finance`, `notifications`, `settings`…), HUB docs, STATUS/DECISIONS. Shared kit (`src/components/ui`, `shell`, `src/lib`) — small additive changes only, logged. Need something else → request file.

## 7. Dependencies (fallback while not live)
| Need | From | Fallback |
|---|---|---|
| Payments for bookings | OWNER finance (Razorpay) | Dev-only `@stub` "mark paid", flag `booking` |
| Notifications / WhatsApp nudges | OWNER notifications | Emit events only |
| Intake UI (IN-01…IN-12) | CLIENT chat | Seed demo intakes |
| Remedy order → office prep | MANAGER fulfilment | Your side done once `remedy.given` + `getPrepSheet()` / `getIntakeFlagsForPrep()` work |
| Business numbers (CN-30…32) | OWNER analytics (read-only) | Hidden behind flag until live |

## 8. Who depends on you — ship first
1. **K1 slot engine + holds + payment handler + calendar busy blocks** → client booking.
2. **Intake data + `submitIntake` / `getIntakeForm`** → client intake screens.
3. **`remedy.given` + prep sheet (with ALCOHOL-FREE flag)** → client remedy & manager prep.
4. **Progress summary (client audience)** → client Home & My Remedies.

## 9. Milestones (one PR each, in order)
- **K1 Scheduling & calendar sync** — consultation types (₹1,000 / ₹800), availability, time off, slot engine (IST, buffers, no double-booking), 15-min holds, reschedule policy (no refunds), Google two-way + Apple CalDAV + ICS feed (CN-16…19, CN-28).
- **K2 Today, Clients, Client profile** — CN-03, CN-04, CN-12…16; feelings view inspired by the mood dashboard (week of mood characters, daily bars, insight).
- **K3 Intake engine** — templates/versions, answers (encrypted), flags, mapping table (editable by him), safety priority alert, follow-up check-in, `getCaseSummary`, `getFlowersToConsider` (CN-33…36).
- **K4 Session** — session prep (case/progress summary), live session (Notes 🔒 · Troubling · Summary optional), dictation, end session, follow-up scheduling (CN-05…08).
- **K5 Remedies** — Bach library (38 + Rescue, hideable, his notes 🔒), remedy builder with templates & duplicate-last, **Give remedy** → ₹0 remedy order (included in fee), reorder price (CN-09…11, CN-22…23).
- **K6 Progress & AI** — Claude-powered case summary & 3-line progress summaries (client + consultant audiences, guardrails, caching, audit), session feedback inbox (CN-21), follow-ups (CN-20).
- **K7 Me & business view** — My profile (real photo, website), settings, app lock, My month, Business (sales & profit read-only) (CN-24…32).
- **K8 Polish & tests** — phone first, iPad layout, empty/offline states, RLS tests (manager/owner cannot read notes, intake answers, reasons), e2e for the consultant side of the golden path.

## 10. Rules specific to you
- Mark sensitive code `// @sensitive`; never put notes, reasons or intake answers in events, logs, analytics or notifications.
- AI output is always labelled "AI · verify with client"; no diagnosis, no medical claims, no prescriptions in AI text.
- Every file starts with the ownership header and uses the tags in `docs/04-COORDINATION-PROTOCOL.md` §7.

## 11. Every session
**Start:** fetch + merge `origin/main`; read STATUS, DECISIONS, others' logs, requests to `consultant`.
**End:** lint/typecheck/tests → newest-first entry in `docs/coordination/log/consultant.md` → commit → push your branch → PR `[CONSULTANT] Kx …` to `main` when a milestone is done → tell the user in 3–5 lines what's done, next, blocked.

## 12. First reply
In ≤10 lines: your scope, foundation status, first milestone (K1 or Step 0 specs), dependencies and what you need from the owner (36/38 flowers, his approval of intake statements, durations, Google OAuth credentials).
