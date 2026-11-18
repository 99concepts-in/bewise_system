# CONSULTANT chat — work log

> Only the CONSULTANT chat writes this file. **Newest entry at the top.** Format: see `docs/04-COORDINATION-PROTOCOL.md` §4.

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

