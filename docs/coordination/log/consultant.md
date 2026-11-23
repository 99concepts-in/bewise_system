# CONSULTANT chat — work log

> Only the CONSULTANT chat writes this file. **Newest entry at the top.** Format: see `docs/04-COORDINATION-PROTOCOL.md` §4.

## 2026-11-20 — Structure v3 from Jitu Bhaiya (owner) (branch claude/new-session-1j1y0u)
**Status:** Prototype rebuilt on demo data · all tests green (44 unit, 109 browser + 3 skipped by design)
**Done:** nav Today · People (mood board) · Messages · Dashboard · Finance. Today = today's appointments → requests "Asking for a time" (Call / Assign) → missed-remedy mood strip → remedy about to end (week / 1–2 weeks, archive). Two appointment types **Bach flower / Scanning** everywhere (scanning = notes only + summary of notes). New appointment for him and the team with Express, any time 7–22 (clashes blocked), video link shared on WhatsApp + app. In-app chat. Remedy dashboard with personal messages. Read-only finance board. Archive / restore people.
**Spec:** `docs/specs/consultant/01-STRUCTURE-V3.md` · **Requests filed:** 20261120 to CLIENT, MANAGER, OWNER, HUB
**Contracts (proposed, additive):** `scheduling.requestAppointment / listRequests / assignTime / setMeetingUrl`, new module `messaging`, `crm.setArchived` (MANAGER), richer `finance.getSalesSummary` (OWNER), consultation type `scanning`
**Next:** HUB P0 — wire this app to the real API (`api/`), adding the scheduling/messaging functions above in my modules
**Breaking changes:** client self-booking of slots replaced by requests (needs CLIENT change)

## 2026-11-18 — Requests answered, new requests filed, preview rebuilt (branch claude/new-session-1j1y0u)
**Status:** Done
**Answered:** OWNER 320 px scroll → DONE · MANAGER PrepSheet shape → ACCEPTED (always alcohol-free) · CLIENT intake/booking contract (13 points) → ACCEPTED with notes (check-in functions, shopping flags, draft-abandoned event, paid-after-expiry = needs_new_time)
**Filed:** `20261118-consultant-to-client-drops-feedback-booking` · `…-to-manager-clients-checkin-tracking` · `…-to-owner-greeting-autopay-settings`
**Contracts proposed (additive):** `getCheckinForm`, `submitCheckin`, `getClientShoppingFlags`, `logDrops`, `submitSessionFeedback.benefits`, events `intake.draft_abandoned`, `appointment.checked_in`, `appointment.greeting_sent`
**Preview:** `preview/consultant` rebuilt from the hardened prototype

## 2026-11-18 — Prototype hardening: tests, speed, every screen size (branch claude/new-session-1j1y0u)
**Status:** Prototype (demo data) · all tests green
**Done:** 30 Vitest unit tests + 89 Playwright tests (phone, 320 px, tablet, desktop; 11 viewports; axe; perf budgets; offline). Lighthouse mobile 90/93/96 → 96/100/100, FCP 2.4 → 1.4 s, LCP 2.9 → 2.4 s, first-load JS 122 → 80 KB gz. Fixed: double-booked demo sessions, form chips submitting the form, nested interactive rows, contrast (muted #5F667A, rose #A2453D, peri-ink #4A6AA3), tiny tap targets, iOS input zoom, 320 px header overflow, 2-column Today on wide screens.
**Notes for the real build:** reuse the patterns — preloadable lazy routes, async LazyMotion, self-hosted variable font, inline boot shell, content-visibility lists, AA colour tokens above (HUB: consider adopting `--muted #5F667A` in tokens).
**Breaking changes:** none

## 2026-11-18 — Prototype: share link, today's appointments with check-in, calendar (branch claude/new-session-1j1y0u)
**Status:** Prototype (demo data)
**Done:** "Share my link" at top of Today (copy, WhatsApp templates, native share, QR) · Today's appointments at the top with Check in → Start → Open / Give remedy, check-in form status + "Ask" · month calendar sheet (Today + Sessions) · new appointment status `checked_in` used in the prototype (contract enum already has it)
**Needs from others:** HUB/OWNER — real booking domain (D-12) for the share link
**Breaking changes:** none

## 2026-11-18 — Consultant prototype v2: impact, live session, suggested flowers, adherence, add person, express booking (branch claude/new-session-1j1y0u)
**Status:** Prototype (demo data)
**Done:** "Your impact" on top of Today + Growth (milestones, people helped, % felt better, what people said they felt) · live session route `#/session/:id` (summary → troubling → private notes → flowers to consider → End session → Give remedy) · suggested flowers with reasons in the remedy sheet (D-37, reference only) · "Taking the remedy" adherence card + "Missing drops" group + insight · New person form + Express booking · **owner rule 2026-11-18: booking = greet + confirm first, payment link sent automatically after; he never sends a link himself** · Sessions redesigned (summary, actionable chips, inline Remind / Give remedy / Book, next 7 days only, past rows show what people felt)
**Contracts changed:** none (prototype). For real build: CLIENT needs a daily "took my drops" log (CL-26) and feedback benefit tags (CL-23); OWNER notifications must send the payment link automatically after the consultant's greeting/confirmation
**Breaking changes:** none
**Next:** request files for the drops log + booking greeting flow when FOUNDATION ✅

## 2026-11-17 — Interactive consultant app prototype (owner request) (branch claude/new-session-1j1y0u)
**Status:** Prototype done (demo data) · not wired to the foundation
**Done:** `prototypes/consultant-app/` — standalone Vite + React + motion app (own package.json, NOT under `src/`, so no clash with the HUB scaffold). Today (bloom of today's sessions, next session, swipeable data-driven "Needs you" insights, timeline, weekly goal, client kind words), Sessions (upcoming + past, search, filters, session sheet, reschedule with K1 slot rules, give remedy, book), People (128 demo, buckets, search, sort, profile with progress, mood week, troubling grid, blend tracker), Growth (month vs last, weekly bars, booking heatmap, top troubling, milestone), Updates feed. Screenshots + README in the folder.
**Contracts changed:** none · **Events:** none · **Migrations:** none
**Needs from others:** HUB — decide whether `prototypes/` may stay in the repo (proposal: keep until K2 ports the screens into `src/app/(consultant)/consult/**`)
**Breaking changes:** none
**Next:** port Today/Sessions/People/Growth into the real app during K2 once FOUNDATION ✅

## 2026-11-17 — Step 0 specs (foundation not ready) (branch claude/new-session-1j1y0u)
**Status:** Specs done · waiting for `FOUNDATION: ✅`
**Done:** `docs/specs/consultant/K1-SCHEDULING-AND-CALENDAR-SYNC.md` (tables, pure slot engine, 15-min holds + advisory lock + exclusion constraint, payment.captured handler incl. late payment, reschedule/no-refund policy, Google free/busy + "BeWise sessions" calendar, iCloud CalDAV, private ICS feed) · `K3-INTAKE-DATA-MODEL-AND-MAPPING.md` (encrypted answers, zod answer shapes, mapping seed covering all 38 flowers, flags, deterministic flowers-to-consider, safety protocol) · `K6-AI-PROMPTS-AND-SCHEMAS.md` (claude-opus-5-5 via `messages.parse` + zod, prompts, validator, caching, `ai_runs` audit) · screen specs `CN-03`, `CN-05`, `CN-06`, `CN-09`
**Contracts changed (proposed, additive):** events `appointment.expired`, `appointment.needs_new_time`; `remedy.given` + optional `pricePaise`, `includedInAppointmentId`; `cancelAppointment` always `refundEligiblePaise: 0` (D-16); `Slot` shape
**Events:** none emitted yet (no code)
**Migrations:** none yet; planned new tables `scheduling_preferences`, `intake_response_revisions`, `intake_appointment_links`, `ai_runs`
**Needs from others:** HUB — btree_gist, lib/crypto, Vault, cron routes, permissions, STATUS milestone list (request `20261117-consultant-to-hub-foundation-needs`) · OWNER — settings keys, appointmentId on payment events, safety-alert template consultant-only (request `…-to-owner-…`) · CLIENT — booking/intake integration + journal counts API (request `…-to-client-…`) · Business — 36 vs 38 flowers (D-30), approval of 38 intake statements + 4 gap proposals (K3 §4.2), durations 60/30, Google OAuth client + Apple app password
**Breaking changes:** none
**Next:** K1 code as soon as FOUNDATION ✅


## 2026-11-20 — Owner feedback round (nav, scanning icon, notes)
**Status:** Done
- Nav: focus ring now sits inside the pill (no double ring); on desktop the unread count sits in line at the end of the row.
- Scanning badge uses a mind icon (it is an intuitive session); Bach flower keeps the flower.
- Scanning profile: notes card uses a notes icon and has **Add a note** (saved on the person, `people[].notes`); the summary counts sessions and added notes together.
- Today: Calendar / New buttons aligned to the end of the header.
- Tests: 45 unit, 109 browser passed (3 skipped).
- Backend note: profile notes need `scheduling`/CRM storage when wiring (HUB P0) — e.g. `client_notes (id, client_id, body, created_at)` consultant-only.

## 2026-11-23 — Lo Shu grid + profile in tabs (owner request)
**Status:** Done in the prototype · client view requested
- `src/lib/loshu.ts`: grid from DOB (non-zero digits, driver/Mulank, conductor/Bhagyank, added numbers per common Indian practice — owner to confirm), missing/repeated numbers, 8 planes; 5 unit tests.
- Profile is now: header + actions, then a sticky, scrollable tab strip (Overview · Remedy|Notes · Lo Shu · Sessions · About), remembered in the URL, arrow-key navigation. Remedy-list entry points open Remedy; ending a scanning session opens Notes.
- Lo Shu tab: driver, conductor, grid, missing, repeated, planes; no DOB → ask on WhatsApp or add it. DOB optional in Add a person.
- Request filed: `requests/20261123-consultant-to-client-lo-shu-grid.md`. Spec: `specs/consultant/02-LO-SHU-GRID.md`.
- Tests: 50 unit, 113 browser passed (3 skipped).
