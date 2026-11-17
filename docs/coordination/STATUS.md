# BeWise Wellness — Live Status Board

> **Owner:** HUB only. Updated after every merge / review. Last updated: **2026-11-16**
> Legend: ⬜ Not started · 🟨 In progress · 🟦 In review (PR open) · ✅ Merged to main · 🚀 Live in production · ⛔ Blocked

## Foundation

**FOUNDATION: ⬜ NOT STARTED** — chats must not scaffold an app until this shows ✅ (see each brief, "Step 0").

| Item | Status | Notes |
|---|---|---|
| Plan, design system, flows, contracts, protocol, chat briefs | ✅ | **`main` created 2026-11-16** (same as `claude/bewise-wellness-design-6xcg8x`) |
| Client v2 (54+ screens) · Consultant v2 (phone + iPad) designs | ✅ | `design/client-v2`, `design/consultant-v2` |
| Manager v2 designs | ✅ | 31 phone + 2 desktop screens, Shiprocket, no-refund policy — `design/manager-v2` |
| Owner designs (v2) | ✅ | 24 phone + 3 computer screens — `design/owner-v2` (personal finance & payroll later) |
| Design v3 Luxe | ❌ | Rejected by owner — v2 stays |
| Intake & case-taking + AI case summary | ✅ designed (v2) | `design/intake-v2`, spec `docs/specs/client/01-INTAKE-CASE-TAKING.md` |
| **ALL 4 MODULES DESIGNED** (v2) | ✅ | |
| Client v4 "Soft Bloom" redesign (owner refs) | ✅ designed, awaiting approval | 66 screens — `design/client-v4`; consultant v4 next |
| Design boards (12) + motion (splash, hero) | ✅ | `design/boards`, `design/motion` |
| Next.js/Supabase scaffold, UI kit, shells, auth, spine tables, events, contract stubs, seed, PWA, CI | ⬜ | HUB — next step |

## Modules

| Milestone | Chat | Status | PR | Live | Notes |
|---|---|---|---|---|---|
| K1 Scheduling engine & availability | CONSULTANT | ⬜ | | | critical path for C2 |
| K2 Today, clients, client profile | CONSULTANT | ⬜ | | | |
| K3 Questionnaire builder & review | CONSULTANT | ⬜ | | | |
| K4 Bach library + remedy builder + send to office | CONSULTANT | ⬜ | | | critical path for M2 |
| K5 Session, notes, follow-ups | CONSULTANT | ⬜ | | | |
| K6 Polish & tests | CONSULTANT | ⬜ | | | |
| C1 Public site, sign-in UX, onboarding & consent | CLIENT | ⬜ | | | |
| C2 Booking flow + payment | CLIENT | ⬜ | | | needs K1, O1, O2 |
| C3 Portal home, appointments, questionnaires | CLIENT | ⬜ | | | |
| C4 Store, cart, combined checkout, orders | CLIENT | ⬜ | | | needs M1, O2 |
| C5 My Remedies, journal, notifications, profile | CLIENT | ⬜ | | | |
| C6 PWA polish, a11y, perf | CLIENT | ⬜ | | | |
| M1 Catalogue, CRM admin, appointments desk | MANAGER | ⬜ | | | critical path for C4 |
| M2 Fulfilment, prep sheet, pack & dispatch | MANAGER | ⬜ | | | needs C4/K4 events |
| M3 Inventory | MANAGER | ⬜ | | | |
| M4 Manufacturing & batches | MANAGER | ⬜ | | | |
| M5 Procurement | MANAGER | ⬜ | | | |
| M6 Billing & Follow-up Centre & expenses | MANAGER | ⬜ | | | needs O2, O3 |
| M7 Delivery exceptions · M8 ops reports | MANAGER | ⬜ | | | |
| O1 Settings + users & roles | OWNER | ⬜ | | | critical path |
| O2 Finance engine + Razorpay + accounting | OWNER | ⬜ | | | critical path |
| O3 Notifications + reminder engine | OWNER | ⬜ | | | |
| O4 Expenses, approvals, cash & bank | OWNER | ⬜ | | | |
| O5 Reports + Command Centre · O6 People & payroll | OWNER | ⬜ | | | |
| O7 Personal finance · O8 AI assistant, audit | OWNER | ⬜ | | | |

## Open cross-chat requests
_None yet._

## Owner reminders
⏳ **10–15 testimonials** and more photos of Jitu Bhaiya — see `CONTENT-CHECKLIST.md` (HUB reminds at the end of each module).

## Blockers / needs from the business
See `DECISIONS.md` — credentials and content approvals are the main external blockers.
