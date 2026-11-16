# BeWise Wellness — Master Plan

> **Owner of this file:** HUB chat (the planning/integration chat). Other chats read it and never edit it.
> Want something changed? Add a request (see `docs/04-COORDINATION-PROTOCOL.md`).
>
> Sources: `BeWise_Wellness_Brand_Identity_Guide.pdf` and `BeWise_Wellness_Software_PRD.pdf` (both read in full), plus the approved owl logo.

---

## 1. What we are building

One **wellness business operating system** packaged as a single installable **PWA**. It covers the full journey:

```
Enquiry → Booking → Payment → Questionnaire → Consultation → Remedy formula
      → Office preparation → Packing → Dispatch → Delivery → Follow-up
                 + Aromatherapy store, manufacturing, inventory
                 + Finance (double-entry), reminders, owner analytics
```

It is **one app with four role spaces** (plus the public website). Everyone signs in at the same place and lands in their own space:

| # | Role (who) | Space & URL | Device priority | Feel |
|---|---|---|---|---|
| 1 | **Consultant** (Jitu Bhaiya) | Consultant Workspace `/consult` | Tablet → desktop → phone | Calm, focused, private |
| 2 | **Client** (person booking / buying) | Public site `/` + Client Portal `/app` | **Phone first** | Warm, simple, reassuring |
| 3 | **Manager** (Mr. Haresh Moorjani, BeWise office) | Operations `/ops` | Desktop → tablet (phone for dispatch) | Efficient, data-rich |
| 4 | **Owner** (super admin) | Command Centre `/owner` | Desktop + phone summary | Executive, precise |

PRD role mapping for v1 (keep permissions granular so these can be split later):

| PRD role | v1 home |
|---|---|
| Super Admin / Owner | Owner |
| Consultant | Consultant |
| Office Manager, Inventory Manager, Customer Support, Accounts *data entry* | Manager |
| Preparation Staff, Manufacturing Staff | Manager space with a **restricted permission set** (future accounts) |
| Accounts Manager (approvals, books, reports) | Owner (can be delegated later) |
| Client | Client |

## 2. The four build chats + this HUB chat

| Chat | Brief file | Builds |
|---|---|---|
| HUB (this chat) | — | Plan, design system, contracts, **Phase 0 foundation**, integration/merging, status tracking, answering "what's live?" |
| Chat 1 — Consultant | `chats/CHAT-1-CONSULTANT.md` | Scheduling engine, client profiles, questionnaires (templates + review), Bach Flower library, remedy builder & approval, sessions, follow-ups |
| Chat 2 — Client | `chats/CHAT-2-CLIENT.md` | Public website, auth UX & onboarding, booking flow, client portal, store, cart & checkout, orders, My Remedies, journal |
| Chat 3 — Manager | `chats/CHAT-3-MANAGER.md` | CRM admin, appointments desk, catalogue admin, fulfilment (prep → QC → pack → dispatch), courier, inventory, manufacturing, procurement, billing & follow-up screens |
| Chat 4 — Owner | `chats/CHAT-4-OWNER.md` | Settings, users/roles, **finance engine** (invoices, payments, Razorpay, accounting), notifications engine, approvals, reports, command centre, people/payroll, personal finance, AI assistant |

How they stay in sync is defined in `docs/04-COORDINATION-PROTOCOL.md` (one integration branch `main`, module ownership, typed contracts, domain events, per-chat logs).

## 3. Architecture (recommended — decision D-01)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript + React 19** | PRD preference; server components keep sensitive data server-side |
| Styling | **Tailwind CSS v4** + CSS variables from `design/tokens.json` | One token source for every role space |
| Components | **shadcn/ui (Radix primitives)**, customised in `src/components/ui` | Accessible, owned in-repo |
| Icons | **Lucide** (single line family, 1.5px stroke) | Brand guide: one consistent line set |
| Forms / validation | react-hook-form + **zod** (schemas shared client/server) | |
| Charts | Recharts (wrapped in `src/components/charts`) | |
| Backend | **Supabase**: Postgres, Auth, Row-Level Security, Storage, Edge Functions, `pg_cron` | DB-level access policies (PRD §16) |
| Server logic | Next.js **server actions** + route handlers in `src/modules/<module>/` | |
| Payments | **Razorpay** (orders, checkout, webhooks, payment links, refunds) | India / INR |
| Messaging | Email (Resend or SES), **WhatsApp Business** via BSP (D-07), in-app, web push | |
| Courier | Manual entry v1 + **Shiprocket** API (D-06) | |
| PDF / Excel | `@react-pdf/renderer`, `exceljs` | Invoices, prep sheets, reports |
| Hosting | **Vercel** (preview deploy per PR) + Supabase (Mumbai region `ap-south-1`) | |
| Tests | Vitest (logic, accounting balance), Playwright (role journeys, RLS checks) | PRD §20 |
| Package manager | pnpm | |

Rules that apply everywhere:
- **Money = integer paise (`bigint`)**, never floats. Format only at the edge with `formatINR()`.
- **Time = `timestamptz`**, displayed in `Asia/Kolkata`. Financial year = **April → March**.
- **Every table has RLS on.** Authorisation is checked server-side *and* in the database.
- **No secrets in the browser.** Razorpay secret, WhatsApp tokens, service-role key stay server-side.
- **Posted financial records are immutable** — correct with reversal entries (PRD §10).
- **Offline cache only for public/non-sensitive content** (PRD §18). Never cache notes, formulas or finance.
- **No fake buttons**: anything visible must work, or be hidden behind a feature flag (PRD §20).

## 4. Repository layout (single app, strict folder ownership)

```
bewise_system/
├─ chats/                     # the 4 chat briefs (HUB)
├─ docs/                      # plan, design system, flows, contracts, protocol (HUB)
│  ├─ coordination/           # STATUS (HUB), DECISIONS (HUB), log/<chat>.md, requests/
│  └─ specs/<chat>/           # detailed screen specs written by each chat
├─ design/                    # tokens.json, boards/, motion/, brand/ (HUB)
├─ src/
│  ├─ app/
│  │  ├─ (public)/            # CLIENT    /, /consultations, /bach-flower, /shop, /shop/[slug], /about, /contact, /legal/*
│  │  ├─ (auth)/              # HUB→CLIENT /sign-in, /verify, /forgot  (HUB scaffolds, CLIENT polishes UX)
│  │  ├─ (client)/app/        # CLIENT    /app/*
│  │  ├─ (consultant)/consult/# CONSULTANT /consult/*
│  │  ├─ (manager)/ops/       # MANAGER   /ops/*
│  │  ├─ (owner)/owner/       # OWNER     /owner/*
│  │  └─ api/                 # webhooks & cron — owned per module (see contracts)
│  ├─ modules/                # business logic, one folder per module, each with a public index.ts
│  ├─ components/ui/          # shared design-system components (HUB; additive edits allowed, logged)
│  ├─ components/shell/       # role shells: sidebars, bottom nav, headers (HUB)
│  ├─ components/charts/      # chart wrappers (HUB → OWNER)
│  └─ lib/                    # supabase clients, auth guards, money, dates, events, audit, flags (HUB)
├─ supabase/
│  ├─ migrations/             # <timestamp>_<module>_<desc>.sql — only the module owner writes its tables
│  └─ seed/                   # seed data per module
└─ tests/                     # e2e per role: tests/e2e/<chat>/
```

Module → owner chat (full detail in `docs/03-CONTRACTS.md`):

| Module | Owner | Module | Owner |
|---|---|---|---|
| `identity` (users, roles, permissions) | HUB → OWNER | `catalog` | MANAGER |
| `crm` (clients, addresses, consent) | MANAGER (+HUB base) | `fulfilment` (prep, pack, ship, courier) | MANAGER |
| `scheduling` (availability, appointments) | CONSULTANT | `inventory` | MANAGER |
| `questionnaires` | CONSULTANT | `manufacturing` | MANAGER |
| `consultation` (sessions, notes, follow-ups) | CONSULTANT | `procurement` | MANAGER |
| `remedies` (Bach library, formulas) | CONSULTANT | `finance` (invoices, payments, accounting, expenses, reminders) | OWNER |
| `journal` | CLIENT | `notifications` | OWNER |
| `commerce` (cart, checkout, sales orders) | CLIENT | `settings`, `people`, `personal-finance`, `analytics`, `ai-assistant`, `audit` | OWNER |

## 5. Delivery phases

The PRD roadmap (7 phases) is re-cut so four chats can work **in parallel** after one shared foundation.

### Phase 0 — Foundation (HUB, before or while chats start)
Must exist on `main` before any chat writes app code. `docs/coordination/STATUS.md` shows `FOUNDATION: ✅` when done.
1. Next.js + TS + Tailwind + shadcn scaffold, pnpm, lint/format, Vitest, Playwright, CI.
2. Design tokens → CSS variables, fonts (Cormorant Garamond, Inter), base UI kit (Button, Input, Select, Card, Chip/StatusBadge, Table, Tabs, Dialog, Drawer, Toast, EmptyState, Skeleton, Stepper, MoneyText, DateText, PageHeader).
3. Role shells: Client bottom-tab shell, Consultant rail, Manager sidebar, Owner sidebar; role switcher for multi-role users.
4. Supabase project wiring, auth (phone OTP + email), `profiles`, `roles`, `permissions`, `user_roles`, `requirePermission()` guard, RLS helpers.
5. **Spine tables** every module references: `clients`, `staff_members`, `domain_events` (outbox), `notifications_inbox`, `audit_logs`, `settings`, `files`, number sequences.
6. `lib/events.ts` (emit + handler registry + processor cron), `lib/audit.ts`, `lib/money.ts`, `lib/flags.ts`.
7. **Typed contract stubs** for every cross-module function in `docs/03-CONTRACTS.md` (signatures + `NotImplemented`), so every chat compiles against the same API from day one.
8. Seed: roles, demo staff (consultant, manager, owner), demo clients, 6 starter products, 2 consultation types.
9. PWA manifest, icons from the owl mark, splash (uses `design/motion/splash`), service worker scoped to public assets.
10. Vercel preview deployments + env var documentation.

### Phases 1–5 — Parallel build (each chat's own milestones are in its brief)

| Wave | Consultant | Client | Manager | Owner |
|---|---|---|---|---|
| **W1 Core** | K1 Scheduling engine & availability | C1 Public site, sign-in UX, onboarding & consent | M1 Catalogue admin, CRM admin, appointments desk | O1 Settings (business, GST, consultation types/fees, policies) + Users & roles |
| **W2 Money path** | K2 Today, clients list, client profile | C2 Booking flow + pay | M2 Fulfilment queue, prep sheet, pack & dispatch | O2 **Finance engine**: invoices, Razorpay, receipts, refunds, chart of accounts, journal posting |
| **W3 Care loop** | K3 Questionnaire builder & review | C3 Portal home, appointments, questionnaire filling | M3 Inventory ledgers & alerts | O3 Notifications engine (in-app, email, WhatsApp templates) + reminder engine |
| **W4 Remedies & store** | K4 Bach library + remedy builder + approval + send to office | C4 Store, cart, combined checkout, orders & tracking, invoices | M4 Manufacturing & batches; M5 Procurement | O4 Expenses, approvals, recurring, cash & bank, reconciliation |
| **W5 Depth** | K5 Session screen, notes, follow-ups | C5 My Remedies, journal, notifications, profile & privacy | M6 Billing & Payment Follow-up Centre, expenses entry; M7 delivery exceptions | O5 Reports + Command Centre; O6 People & payroll |
| **W6 Polish** | K6 Tablet polish, tests | C6 PWA polish, accessibility, performance | M8 Ops reports, keyboard flows, tests | O7 Personal finance; O8 AI assistant, audit viewer |

**Critical path** (others depend on these — do them first):
1. HUB Phase 0 → everything.
2. OWNER O1 consultation types + O2 payments → CLIENT C2 booking and C4 checkout.
3. CONSULTANT K1 slot engine → CLIENT C2 booking.
4. MANAGER M1 catalogue → CLIENT C4 store.
5. CLIENT C4 orders + CONSULTANT K4 send-to-office → MANAGER M2 fulfilment.
6. OWNER O3 notifications → reminders in MANAGER M6.

While a dependency isn't live, build against the contract stub with seed data **behind a feature flag** (see protocol).

### Phase 7 — Go-live (HUB coordinates)
Real credentials (Razorpay live, WhatsApp templates approved, courier, email domain), accountant sign-off on chart of accounts & GST, content sign-off (Bach library, product labels/claims), data import, UAT per role with Jitu Bhaiya, Haresh and the owner, backups & monitoring, launch.

## 6. Decisions waiting for the owner

Tracked in `docs/coordination/DECISIONS.md`. Chats use the stated default until decided.

## 7. Assumptions & risks (summary)

- **AI design boards are direction, not pixel specs.** Numbers, names and some products on boards are illustrative. Build from `docs/01-DESIGN-SYSTEM.md` + screen specs.
- **Content needs real approval**: Bach Flower descriptions (verified source), product ingredients, labels, safety text, claims. No medical/cure claims (brand guide §6–7, PRD §6).
- **External credentials needed**: Supabase, Razorpay (test then live), SMS/OTP provider, email domain, WhatsApp BSP + approved templates, courier API, domain.
- **GST & accounting treatment must be validated by a qualified accountant** (PRD §10).
- **Highest-risk areas**: finance correctness, RLS on notes/formulas, payment webhook idempotency, parallel-chat merge conflicts (mitigated by folder ownership + contracts).
