# CHAT 4 — OWNER COMMAND CENTRE, FINANCE & ADMIN

> **Start a new Claude Code chat on `exceptionalappstudios-ship-it/bewise_system` and send:**
> **"Read `chats/CHAT-4-OWNER.md` and follow it."**
> Chat tag: **`owner`** · PR titles `[OWNER] …` · Brief version **v2 (2026-11-17)** — replaces all earlier versions.

---

## 1. Mission
You are the product designer + full-stack engineer for the **Owner app** (`/owner`) and the engines everyone relies on:
**settings, users & roles (incl. accountant), the finance engine (invoices, Razorpay payments, GST, double-entry
accounting), notifications & WhatsApp reminders, approvals, reports & analytics, Ask BeWise for business, activity log.**

**User:** the business owner — checks the business on the **phone** several times a day, deeper review on a **computer**.
In 10 seconds they must know: how much came in, cash in bank, who owes us / whom we owe, and what's waiting for them.
Finance is a real accounting system (PRD §10) — correctness beats speed.

## 2. Source of truth — read in this order
1. `docs/04-COORDINATION-PROTOCOL.md` (mandatory).
2. `docs/coordination/STATUS.md`, `DECISIONS.md` (D-01…D-43), `CONTENT-CHECKLIST.md`, other logs, requests `*-to-owner-*`.
3. **`docs/specs/owner/00-OWNER-FLOW-AND-SCREENS.md`** — screens **OW-01…OW-30** (owner answers included).
4. `docs/03-CONTRACTS.md` — your modules *finance, notifications, settings, identity (admin), analytics, audit*; events you consume (almost all); permissions (incl. `accountant`).
5. **Design:** visual language = **v4 "Soft Bloom"** (`design/v4-soft-bloom/README.md`, tokens `design/tokens.json → v4`, assets `design/assets/v4/` — the owl mascot fronts Ask BeWise); **layouts/content** from `design/owner-v2/` (phone `OW-phone-*`, computer `OW-desktop-09/10/11`). Boards will be restyled in v4 by the HUB — build with v4 tokens now.
6. `docs/00-MASTER-PLAN.md`, `docs/01-DESIGN-SYSTEM.md`.

## 3. Decisions that shape your work
| Topic | Decision |
|---|---|
| Fees | **First consultation ₹1,000 · Follow-up ₹800 — remedy included** (D-09, D-02). Settings hold these + `remedy.reorder_price` |
| Refunds | **None** (D-16) — no refund flows or approvals; credit notes only for owner accounting corrections |
| Accountant | Role **`accountant`**: view & export reports, invoices, bills, ledgers, GST; no edits; no consultation/intake data; own computer view OW-30 (D-39) |
| Later | **Personal finance** and **payroll** are later phases — don't build now (D-40, D-41) |
| Numbers for team | Jitu Bhaiya and Haresh see **sales and profit** read-only — expose read-only analytics functions for them (D-33) |
| Privacy | Owner cannot read practitioner notes, flower reasons or intake answers (only aggregate, anonymous stats) (D-03, D-38) |
| Safety alerts | Go to Jitu Bhaiya only — not the owner (D-38) |
| Integrations | Razorpay (payments), Shiprocket (via manager), WhatsApp Business (reminders, templates), Google Calendar (via consultant), email — show true status: Connected / Test mode / Not set up |
| Greeting | "Good morning" until the owner gives a name (D-42) |
| AI | Ask BeWise (business): read-only answers over analytics views, never acts; load the `claude-api` skill before coding |

## 4. Step 0 — is the foundation ready?
`git fetch origin main && git merge --no-edit origin/main`, check `docs/coordination/STATUS.md` for **`FOUNDATION: ✅`**.
- **✅** → start O1.
- **Not yet** → don't scaffold an app. Write specs in `docs/specs/owner/`: draft **chart of accounts** (Indian wellness business; consultation income incl. remedy, product sales, GST output CGST/SGST/IGST, input GST, Razorpay clearing, bank, cash, receivables, payables, inventory, COGS, expenses, owner capital/drawings), **posting rules per event**, invoice/receipt numbering (FY Apr–Mar) & PDF layout, Razorpay flow (order → checkout → webhook → capture, idempotency), reminder schedules & WhatsApp templates, settings keys, accountant permissions. Commit, push, log, tell the user you're waiting for the foundation.

## 5. What you own
| Kind | Items |
|---|---|
| Routes | `src/app/(owner)/owner/**`, accountant view, `src/app/api/webhooks/razorpay/**`, `…/whatsapp/**`, `…/cron/reminders/**` |
| Modules | `src/modules/finance`, `notifications`, `settings`, `identity` (admin side), `analytics`, `audit` (viewer), `ai-assistant` (business) |
| Tables | invoices, invoice_lines, payments, payment_allocations, receipts, credit_notes, expenses, supplier_bills, recurring_items, accounts (chart), journal entries & lines, bank_accounts, bank_statement_lines, reconciliations, tax_rates, fiscal_periods, reminder_schedules, reminder_log, notification_* , settings, analytics views |
| Functions others call | `finance.*`, `notifications.notify`, `settings.getSetting`, read-only analytics for consultant & manager — **on everyone's critical path; replace HUB stubs early** |
| Events you emit | `invoice.issued`, `payment.captured`, `payment.failed`, `expense.submitted/approved/rejected`, `journal.posted`, `reminder.sent` |
| Events you handle | nearly all — posting rules, notifications, analytics |

## 6. Do not touch
Other chats' routes and modules. Haresh builds the money **screens** in `/ops` on your functions — don't duplicate them. HUB docs, STATUS/DECISIONS.

## 7. Dependencies (fallback while not live)
| Need | From | Fallback |
|---|---|---|
| Orders, appointments, stock data | CLIENT / CONSULTANT / MANAGER | seeded demo data |
| Razorpay, WhatsApp, email credentials | Owner (checklist) | test keys / console transport; never claim "live" until tested |
| Accountant validation of CoA & GST | Business (D-13) | mark "draft — pending accountant" in UI |

## 8. Who depends on you — ship first
1. **O1 Settings** (fees ₹1,000 / ₹800, reschedule policy, remedy reorder price, tax, shipping) + users & roles.
2. **O2 Payments** — `createCheckout`, `verifyCheckout`, Razorpay webhook → `payment.captured` (client booking & shop are blocked without it).
3. Invoices / record payment / reminders / expenses functions → manager money screens.
4. Notifications → every journey.

## 9. Milestones (one PR each, in order)
- **O1 Settings, users & roles** — business profile, GSTIN, invoice numbering, consultation fees & durations (via `scheduling.upsertConsultationType`), reschedule policy (no refunds), remedy reorder price, shipping; team, permissions, **invite accountant** (OW-16/17/23/28).
- **O2 Finance engine** — chart of accounts, FY periods, double-entry journal with balance check, invoices with GST (CGST/SGST/IGST), receipts, credit notes (corrections only), PDFs, Razorpay (test mode first, webhook as source of truth, idempotent), event posting rules + tests.
- **O3 Notifications & reminders** — templates, preferences & consent, in-app + email + WhatsApp, reminder schedules, delivery log.
- **O4 Approvals & expenses** — approvals inbox & detail (OW-13/14), recurring items, cash & bank accounts, statement import & reconciliation.
- **O5 Home, insights & money** — OW-02…OW-11 phone; read-only sales & profit APIs for consultant and manager.
- **O6 Reports & accountant** — P&L, balance sheet, cash flow, trial balance, GST summary, ledgers, PDF/Excel export with timestamp (OW-12, OW-29), computer views OW-26/27, **accountant view OW-30**.
- **O7 Ask BeWise (business), integrations & activity log** — OW-15, OW-24, OW-25.
- *(Later phases: personal finance, payroll.)*

## 10. Rules specific to you
- Money in paise (integer); GST rounding documented & tested; posted entries never overwritten (reverse & re-post).
- Secrets never reach the browser; webhooks verify signatures.
- Mark finance code `// @sensitive`.

## 11. Every session
**Start:** fetch + merge `origin/main`; read STATUS, DECISIONS, others' logs, requests to `owner`.
**End:** lint/typecheck/tests → newest-first entry in `docs/coordination/log/owner.md` → commit → push → PR `[OWNER] Ox …` → tell the user in 3–5 lines what's done, next, blocked (especially credentials).

## 12. First reply
In ≤10 lines: scope, foundation status, first milestones (O1, O2), dependencies and credentials needed (Razorpay, WhatsApp BSP, email domain, GSTIN, accountant contact).
