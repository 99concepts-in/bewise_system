# CHAT 4 — OWNER COMMAND CENTRE, FINANCE & ADMIN

> **How to start this chat:** open a new Claude Code session on `exceptionalappstudios-ship-it/bewise_system`
> and send: **"Read `chats/CHAT-4-OWNER.md` and follow it."**
> Your chat tag is **`owner`** (logs, requests, PR titles `[OWNER] …`).

> ⚠️ **UPDATE 2026-11-16 (owner):** **No refunds** (D-16) — remove refund flows/approvals; credit notes only for owner accounting corrections. Consultant gets read-only business sales views (CN-30…32) — expose `analytics` read functions for them. Shiprocket costs/wallet top-ups appear as supplier/recurring payables.

> ⚠️ **UPDATE 2026-11-17 (owner):** Your screens are now **`docs/specs/owner/00-OWNER-FLOW-AND-SCREENS.md` (OW-xx)**, designs **`design/owner-v2/`** in **v2 Quiet Luxury** (v3 rejected). **Personal finance and payroll are LATER** (skip O6/O7 personal parts). Add role **`accountant`** (read-only reports/invoices/ledgers/GST + export, desktop OW-30). Consultant & manager may see **sales and profit** — expose read-only analytics for them.

---

## 1. Who you are and who you build for

You are the product designer + full-stack engineer for the **Owner space** (`/owner`) and for the system-wide engines everyone else relies on: **settings, users & permissions, the finance engine (invoices, payments, Razorpay, refunds, double-entry accounting), notifications & reminders, approvals, reports & analytics, people & payroll, personal finance, audit and the AI assistant.**

Primary user: the **business owner** (super admin). Checks the business on the **phone** several times a day, does deeper review on **desktop**. Needs: trustworthy numbers, instant view of cash/receivables/payables, alerts that need a decision, approvals in one place, reports an accountant accepts, and personal money kept strictly separate from the business.

Design feel: executive and precise. Deep navy sidebar with a gold hairline, Cormorant Garamond page titles, Inter everywhere else, tabular numerals, restrained charts (palette in `design/tokens.json` → `color.chart`). Personal finance always shows the beige "Personal — separate from business" band.

**Finance is a first-class accounting system, not a list of incomes and expenses** (PRD §10). Correctness beats speed.

## 2. Read before doing anything (in this order)

1. `docs/04-COORDINATION-PROTOCOL.md` (**mandatory**).
2. `docs/coordination/STATUS.md`, `DECISIONS.md`, other chats' logs, requests to you (`*-to-owner-*`).
3. `docs/00-MASTER-PLAN.md`, `docs/01-DESIGN-SYSTEM.md`, `design/tokens.json`.
4. `docs/02-FLOWS-AND-SCREENS.md` — journeys **J1 (steps 5–6, 18), J5, J7, J8, J9, J10** and screens **O-01 … O-12**.
5. `docs/03-CONTRACTS.md` — *finance, notifications, settings* (yours), events table §4 (you consume almost all of them), permissions §6, visibility §7.
6. Boards: `design/boards/10-owner-command-centre.jpg`, `11-owner-finance-reports.jpg` (note: products on board 10 are illustrative — use the real catalogue).

## 3. Step 0 — check the foundation

`git fetch origin main && git merge --no-edit origin/main`, open `docs/coordination/STATUS.md`.
- **`FOUNDATION: ✅`** → start O1.
- Otherwise → **don't scaffold an app.** Write specs in `docs/specs/owner/`: the **draft Chart of Accounts** for an Indian wellness business (consultation income, remedy income, product sales, GST output CGST/SGST/IGST, GST input, Razorpay clearing, bank, cash, receivables, payables, inventory, COGS, expense heads from PRD §10, owner capital/drawings/loan), **posting rules** per event (contracts §4), invoice/receipt/credit-note numbering & PDF layout, the Razorpay flow (order → checkout → webhook → capture → allocation, idempotency), reminder schedule engine, settings key list, and O-01/O-04 layouts. Commit, push, log, tell the user you're waiting for the foundation.

## 4. What you own

| Kind | Items |
|---|---|
| Routes | `src/app/(owner)/owner/**`; `src/app/api/webhooks/razorpay/**`, `src/app/api/webhooks/whatsapp/**`, `src/app/api/cron/reminders/**` |
| Modules | `src/modules/finance`, `notifications`, `settings`, `identity` (admin side, after HUB base), `people`, `personal-finance`, `analytics`, `ai-assistant`, `audit` (viewer) |
| Tables | all *finance* tables in contracts §2, `notification_*`, `settings` (HUB base), `employees`, `salary_structures`, `salary_advances`, `reimbursements`, `payslips`, schema `personal.*`, views `analytics.*` |
| Functions others call | *finance*, *notifications*, *settings* in contracts §5 — **these are on everyone's critical path**; replace HUB stubs early, keep signatures |
| Events you emit | `invoice.issued`, `payment.captured`, `payment.failed`, `payment.refunded`, `expense.submitted/approved/rejected`, `journal.posted`, `reminder.sent` |
| Events you handle | nearly all: posting rules (accounting), notification triggers, analytics refresh, refund requests from `appointment.cancelled`, alerts from `stock.low`/`shipment.failed` |
| Specs / tests | `docs/specs/owner/**`, `tests/e2e/owner/**`, finance unit tests (balance, partial payments, refunds, GST math, ageing) |
| Log | `docs/coordination/log/owner.md` |

## 5. Do not touch

Other chats' routes & modules. Manager builds the billing/follow-up/expense **screens** in `/ops` using your functions — don't build duplicates in `/ops`; you build owner-side views (approvals, reports, accounting). Don't edit HUB docs, STATUS, DECISIONS.

## 6. What you depend on

| Need | From | Fallback |
|---|---|---|
| Orders with lines, tax categories | CLIENT C4 | Seeded demo orders |
| Appointments (for consultation income) | CONSULTANT K1 | Seed |
| Stock valuation, batch costs | MANAGER M3/M4 | Report shows "inventory data pending" |
| Real credentials: Razorpay, WhatsApp BSP, email domain, SMS | User / business — `D-05`, `D-07`, `D-12`, `D-04` | Test keys / console transports in dev; **never claim an integration works until tested with real credentials** (PRD §21) |
| Accountant validation | Business — `D-13` | Mark CoA & GST as "draft — pending accountant" in UI |

## 7. Who depends on you — ship these first

1. **Settings (O1)**: consultation types via `scheduling.upsertConsultationType()`, `policy.cancellation`, `remedy.pricing`, shipping rates, tax config → CONSULTANT K1, CLIENT C2/C4.
2. **Payments (O2)**: `createCheckout`, `verifyCheckout`, Razorpay webhook → `payment.captured` → CLIENT booking & checkout. **Highest-priority dependency in the whole project.**
3. **Invoices/payments/reminders/expenses functions (O2–O4)** → MANAGER M6.
4. **Notifications (O3)** → confirmations/reminders for every journey.

## 8. Milestones (in order; one PR each)

### O1 — Settings, users & roles (O-09, O-10)
- Typed settings with validation & history: business profile, legal entity, GSTIN, state (for CGST/SGST vs IGST), invoice numbering, consultation types/fees/durations (via scheduling API), remedy pricing (`D-02`), cancellation/refund policy (`D-08`), shipping rates, reminder schedules, notification channel toggles, integration status (connected/not configured — honest).
- Users: invite staff by email, assign roles, permission matrix editor (view/create/edit/approve/export/delete), deactivate, session list. Seeded role defaults from contracts §6.

### O2 — Finance engine core (O-03 basics)
- Chart of accounts (draft from Step 0, editable), fiscal years (Apr–Mar) & periods, **double-entry journal** with DB-level balance check (sum Dr = sum Cr per entry), immutable posted entries, reversal/correction entries.
- Invoices (GST lines, HSN/SAC, place of supply, CGST/SGST/IGST), receipts, credit notes, PDFs (design system §12), FY-based numbering without gaps.
- Razorpay: server-side order creation, Checkout config, signature verification, **webhook as source of truth**, idempotency on event id, payment allocation (full/partial/advance/split), refunds (full/partial) with approval threshold (`D-16`), payment links for reminders. Test mode first.
- Posting rules driven by events (contracts §4). Tests: every posting balances; partial payments; refund after partial; credit note; GST split intra/inter-state.

### O3 — Notifications & reminder engine (O-09 templates)
- Template registry (key, channel, locale, variables, approved-for-WhatsApp flag), event → template mapping, preferences & consent/opt-out, delivery log with status, retries, in-app inbox writes. Transports: in-app (HUB inbox), email, WhatsApp (BSP, `D-07`), SMS (OTP provider), web push later.
- Reminder engine: schedules per party type (e.g. −2d, 0, +3d, +7d), stop on payment/dispute, log every reminder and response (PRD §11).
- Message copy: warm and polite, never fear-based.

### O4 — Expenses, approvals, recurring, cash & bank (O-05, O-06)
- Expenses & supplier bills with receipt files, categories (PRD §10 list), approval workflow with audit, payment recording from accounts; recurring items (rent, salaries, subscriptions) with due-date reminders.
- Approvals inbox: expenses, bills, refunds above threshold, stock write-offs (from MANAGER via request), with approve/reject + comment.
- Cash & bank accounts, transfers, CSV statement import, reconciliation matching.

### O5 — Reports & Command Centre (O-01, O-02, O-04)
- Reports: P&L, Balance Sheet, Cash Flow, Trial Balance, AR/AP ageing, GST summary, income/expense by category/period, product sales & margins, stock valuation, manufacturing cost, consultation & remedy reports, staff & supplier ledgers; filters; **export PDF & Excel with generated timestamp** (PRD §13).
- Command Centre per board 10: period + compare, KPI tiles, revenue by stream (consultations / remedies / products), ops funnel, top products by margin, alerts → deep links into `/ops` and approvals. **Phone layout**: stacked KPIs, alerts, quick approvals.
- Analytics as SQL views in schema `analytics` (read-only; no PII beyond what's needed).

### O6 — People & payroll (O-07)
Employees, salary structures, advances, incentives, reimbursements, deductions, monthly payslip run → journal, payslip PDF.

### O7 — Personal finance (O-08) · O8 — AI assistant & audit (O-12, O-11)
- Personal: separate schema & RLS (owner only), accounts, cards, loans/EMIs, budgets, goals, investments, assets/liabilities, owner transfers recorded as capital contribution / loan / drawing on the business side (never sales/expenses) (PRD §12). **Tests for data isolation.**
- Ask BeWise: read-only Q&A over permitted analytics views (use the latest Claude model via server-side API key), summaries and suggested actions that require explicit approval; logs every question; never posts entries, pays, alters records, diagnoses or prescribes (PRD §15).
- Audit log viewer with filters and before/after diff.

## 9. Rules specific to you

- Money in paise, integer math only; rounding rules for GST documented and tested.
- Never silently overwrite posted records — reverse and re-post.
- Never expose secrets to the browser; webhooks verify signatures.
- Every integration screen shows its true state ("Not configured", "Test mode", "Live").
- Owner cannot read practitioner private notes by default (`D-03`).

## 10. Every session

**Start:** fetch + merge `origin/main`; read STATUS, DECISIONS, others' logs, requests to `owner`.
**During:** ownership headers + tags (protocol §7) in every file; spec before screen; mark finance code `// @sensitive`.
**End:** lint/typecheck/tests → update `docs/coordination/log/owner.md` (newest on top) → commit → push → PR `[OWNER] Ox …` to `main` when a milestone completes → tell the user in 3–5 lines what's done, next, blocked (especially credentials/decisions needed).

## 11. Your first reply in this chat

Summarise in ≤10 lines: scope, first milestones (O1 then O2 — critical path), dependencies & credentials needed, foundation status. Then start.
