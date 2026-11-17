# 07 — Roles, permissions & the accountant (draft)

> **Owner:** OWNER chat (identity admin side, O1). Permission format `module.resource.action` (contracts §6).
> Enforced twice: `requirePermission()` in every server function **and** RLS `has_permission(auth.uid(), '<perm>')`.

## 1. Finance / admin permission catalogue (seeded per role)

| Permission | Owner | Accountant (D-39) | Manager (Haresh) | Consultant (Jitu) | Client |
|---|---|---|---|---|---|
| `finance.checkout.create` | ✅ | — | ✅ (walk-in link) | — | ✅ own refs |
| `finance.invoice.view` | ✅ | ✅ | ✅ | — | own |
| `finance.invoice.create` | ✅ | — | ✅ | — | — |
| `finance.invoice.void` | ✅ | — | — | — | — |
| `finance.invoice.export` | ✅ | ✅ | — | — | own PDF |
| `finance.payment.record` | ✅ | — | ✅ | — | — |
| `finance.reminder.send` | ✅ | — | ✅ | — | — |
| `finance.credit_note.create` | ✅ | — | — | — | — |
| `finance.expense.create` / `.submit` | ✅ | — | ✅ | — | — |
| `finance.expense.approve` | ✅ | — | — | — | — |
| `finance.expense.view` / `.export` | ✅ | ✅ (incl. receipt images) | own + all (view) | — | — |
| `finance.bill.create` | ✅ | — | ✅ | — | — |
| `finance.bill.approve` | ✅ | — | — | — | — |
| `finance.bill.view` / `.export` | ✅ | ✅ | ✅ view | — | — |
| `finance.bank.view` | ✅ | ✅ | — | — | — |
| `finance.bank.reconcile` / statement import | ✅ | — | — | — | — |
| `finance.ledger.view` / `.export` | ✅ | ✅ | — | — | — |
| `finance.journal.view` | ✅ | ✅ | — | — | — |
| `finance.journal.post` (manual) | ✅ | — | — | — | — |
| `finance.period.close` | ✅ | — | — | — | — |
| `finance.report.view` / `.export` (P&L, BS, CF, TB) | ✅ | ✅ | — | — | — |
| `finance.gst.view` / `.export` | ✅ | ✅ | — | — | — |
| `analytics.sales.view` | ✅ | ✅ | ✅ | ✅ (D-33) | — |
| `analytics.profit.view` | ✅ | ✅ | ✅ | ✅ (D-33) | — |
| `analytics.clinical_aggregate.view` (anonymous emotion stats) | ✅ | — | — | ✅ own | — |
| `settings.*.edit` | ✅ | — | — | — | — |
| `identity.users.manage` (invite, roles, deactivate) | ✅ | — | — | — | — |
| `audit.log.view` | ✅ | own exports only | — | — | — |
| `ai_assistant.business.use` | ✅ | — | — | — | — |

**The owner never gets:** `consultation.notes.view`, `intake.answers.view`, `remedies.rationale.view` (D-03, D-38). Owner analytics read only aggregate, anonymous views (minimum group size 5, else "Not enough data").

## 2. Accountant role (`accountant`, D-39)
- **Can:** view & export reports, invoices, receipts, credit notes, supplier bills, expenses (with receipts), ledgers, journals, trial balance, GST summary, bank statements and reconciliation status. Exports are PDF/Excel with "Generated {datetime} IST by {name}".
- **Cannot:** create, edit, approve, void, post or reconcile anything; see settings, team or integrations; see any consultation, intake, journal, remedy-content, Ask BeWise or appointment data. Invoices show client name, address and GSTIN only — line text never contains health content (see `03-NUMBERING-AND-DOCUMENTS.md` §2, privacy).
- **Workspace:** computer view **OW-30** (`/owner/accountant`, read-only shell). It works on phone as a simple list, but is not designed for it.
- **Invite (OW-28):** owner enters name + email (+ optional firm name, optional **access end date** for audit season) → invite email with a magic link valid **7 days** → first sign-in sets a password and **TOTP 2-factor (required)** → lands on OW-30. Owner can revoke at any time (sessions ended immediately).
- **Audit:** every report or document export writes `audit_logs(action='export', resource, filters)`. OW-25 shows "CA exported GST summary Oct 2026".
- **Feedback channel:** the accountant can leave **comments** on accounts, entries and reports (`finance.comment.create`, the only write). The owner sees them on OW-13 as items, not approvals. *Optional — owner to confirm.*

## 3. Team management (OW-16 / OW-17)
- Roles are presets. OW-17 shows toggles grouped as **Money · Clients · Operations · Reports · Setup**. A toggle overrides the preset per member (`user_permission_overrides`), always audited.
- Some toggles are hard-locked and greyed out with a reason: consultation notes and intake (D-03), safety alerts (D-38, Jitu Bhaiya only).
- Deactivate = revoke sessions, keep history. Users are never deleted.
- Multi-role users (e.g. owner who is also a consultant, D-17) get a role switcher (HUB shell).
- Security defaults: owner & accountant require TOTP 2FA. Owner phone app re-locks with biometrics/passkey after 5 min in the background (OW-01).

## 4. Tests (RLS, must pass before O1/O6 merge)
Accountant: can select invoices/journal lines; **cannot** insert or update any finance table; **cannot** select `practitioner_notes`, `intake_responses`, `case_summaries`, `journal_entries` (client journal), `companion_messages`, `appointments.client_note`. Owner cannot select the same clinical tables. Consultant can call the read-only analytics functions but cannot select `journal_lines` directly.
