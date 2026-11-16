# BeWise Wellness — User Flows & Screen Inventory

> **Owner:** HUB. Every screen has a stable ID used in code comments, PRs, logs and specs
> (`P-` public, `A-` auth, `C-` client, `K-` consultant, `M-` manager, `O-` owner).
> Each chat expands its screens into detailed specs at `docs/specs/<chat>/<ID>.md` before building.

---

## Part A — End-to-end journeys (who does what, in order)

Legend: 🟢 Client · 🔵 Consultant · 🟠 Manager · 🟣 Owner · ⚙️ System (event / automation)

### J1. First consultation (the golden path)

| # | Who | Screen | What happens | Event / data |
|---|---|---|---|---|
| 1 | 🟢 | P-01 → P-02 | Reads about consultations, taps **Book a consultation** | |
| 2 | 🟢 | C-03 step 1–3 | Chooses type (First 60 min / Follow-up 30 min), Online / In-person, date & slot | `scheduling.getAvailableSlots()` |
| 3 | 🟢 | A-01/A-02 | Signs in with phone OTP (only now — browsing never needs login) | `profiles`, `clients` row created |
| 4 | 🟢 | C-03 step 4 | Short intake: name, DOB, city, reason (optional), **consent** checkbox | `crm.consent_records` |
| 5 | 🟢 | C-03 step 5 | Confirm & pay (UPI/card/netbanking via Razorpay). Slot is held 15 min. | `appointment(status=pending_payment)`, `finance.createCheckout()` |
| 6 | ⚙️ | — | Payment verified server-side (webhook). Appointment confirmed. Invoice + receipt issued. Journal posted. | `payment.captured` → `appointment.confirmed`, `invoice.issued`, `journal.posted` |
| 7 | ⚙️ | — | Confirmation via in-app + email + WhatsApp; questionnaire assigned; reminders scheduled (24h, 1h) | `notifications` |
| 8 | 🟢 | C-05 | Fills pre-consultation questionnaire (save & resume) | `questionnaire.submitted` |
| 9 | 🔵 | K-01 → K-04 | Sees booking on Today; opens client profile; reviews questionnaire | |
| 10 | 🔵 | K-05 | Runs session (online link / in person). Writes **private notes** and a **client-shareable summary** | `consultation_records` |
| 11 | 🔵 | K-06 | Builds formula from the 38-remedy library, adds rationale (private), dosage & duration → **Approve & send to office** | `formula.approved`, `remedy.given` |
| 12 | ⚙️ | — | Remedy order created for the client (price per settings; ₹0 if included in fee — D-02) | `remedy_order.created` → sales order (kind=remedy) |
| 13 | 🟢 | C-06 / C-09 | Sees "Your remedy blend is ready" → pays (can add store products to the **same order**) | `order.paid` |
| 14 | 🟠 | M-02 | Remedy prep task appears with **prep sheet only** (remedy names, drops, bottle size — no notes) → Preparing → QC | `fulfilment_task` |
| 15 | 🟠 | M-04 / M-05 | Packing → courier + AWB → **Mark dispatched** | `shipment.dispatched` |
| 16 | 🟢 | C-10 | Tracks order; gets dispatch + delivery messages | `shipment.delivered` |
| 17 | ⚙️ / 🔵 | K-09 | Follow-up reminder to client & consultant at the configured interval | `followup.due` |
| 18 | 🟣 | O-01 | Revenue, consultations, operations funnel update live | analytics views |

### J2. Store purchase (no consultation)
🟢 P-04 Shop → P-05 Product → add to cart (guest cart allowed) → C-09 Checkout (sign in at checkout, address, pay) → ⚙️ `payment.captured` → `order.paid`, invoice → 🟠 M-03/M-04 pick → pack → dispatch → 🟢 C-10 tracking → delivered → optional review/reorder.

### J3. Follow-up consultation
⚙️ follow-up due → 🟢 C-02 card "Time for your follow-up" → C-03 (Follow-up type pre-selected, same consultant) → pay → 🔵 K-05 session → K-06 **duplicate previous formula as v(n+1)** → edit → approve → J1 steps 12–16.

### J4. Reschedule / cancel
🟢 C-04 appointment detail → Reschedule (slots shown) or Cancel → policy check (default: ≥24h full refund/free reschedule; <24h per policy — D-08) → ⚙️ `appointment.rescheduled` / `appointment.cancelled` → refund request to finance if applicable → 🔵 calendar updates → notifications.
🟠 can do the same on the client's behalf from M-11 (logged with reason).

### J5. Unpaid invoice → Payment follow-up
🟠 or ⚙️ invoice issued with due date (e.g. in-person consultation paid later, B2B order) → reminder schedule (−2d, 0, +3d, +7d; configurable) → in-app/email/WhatsApp with **payment link** → 🟢 pays from link or C-11 → ⚙️ `payment.captured` → allocation → invoice paid → reminders stop. Disputes: 🟠 marks disputed → reminders pause → 🟣 sees in O-05.

### J6. Manufacturing & stock
⚙️ `stock.low` (finished good below reorder level) → 🟠 M-08 production request → allocate materials (raw + packaging, from M-09) → production → QC (pass/fail with notes) → bottling & labelling (batch no., mfg/expiry) → received into finished goods → stock available in store. Raw material low → 🟠 M-10 purchase order → GRN → stock in → supplier bill (finance) → 🟣 approval → payment.

### J7. Expense & approval
🟠 M-15 records expense / supplier bill with receipt upload → submitted → 🟣 O-05 approve/reject (with comment) → 🟠 or 🟣 records payment from a bank/cash account → ⚙️ journal posted → appears in reports.

### J8. Refund / return
🟢 C-10 requests return (within policy) or 🟠 initiates (failed delivery/RTO) → 🟣 approval if above threshold → finance refund via Razorpay / credit note → stock returned (if resaleable) → ⚙️ `payment.refunded` → client notified.

### J9. Owner daily check (phone)
🟣 opens O-01 on phone → today's KPIs, cash, overdue, alerts → taps "6 overdue invoices" → list → asks **Ask BeWise** "Who owes us the most?" → read-only answer with link to M-14 view.

### J10. Personal finance (owner only)
🟣 switches **Business | Personal** → beige "Personal" band → records household expense / EMI / investment → owner transfer to business recorded as **capital contribution / loan / drawing** (never as sale or business expense) → separate reports.

---

## Part B — Screen inventory

Priority: **P1** = needed for first live release, **P2** = shortly after, **P3** = later.

### Public website — owner chat: CLIENT

| ID | Screen | Key content & actions | Pri |
|---|---|---|---|
| P-01 | Home | Hero ("Gentle guidance for emotional wellbeing"), Book CTA, 3 service cards, How it works (Book → Share → Consult → Receive), shop strip, trust (about consultant), newsletter | P1 |
| P-02 | Consultations | Types, durations, fees (from settings), online vs in-person, what to expect, FAQ, Book CTA | P1 |
| P-03 | Bach Flower Remedies (education) | What they are, 7 emotional groups, careful non-medical wording | P2 |
| P-04 | Shop (collections) | Collections Oils / Sprays / Bath / Gift sets, filters, search, product grid | P1 |
| P-05 | Product detail | Gallery, variants, price + MRP, tabs (Description, Ingredients, How to use, Safety), add to cart, wishlist | P1 |
| P-06 | Cart (guest) | Line items, qty, subtotal; checkout requires sign-in | P1 |
| P-07 | About / Contact | Story, consultant intro, address/map, enquiry form → CRM lead | P1 |
| P-08 | Journal (blog) | Articles (CMS-light, markdown) | P3 |
| P-09 | Legal | Privacy, Terms, Refund & cancellation, Shipping, Disclaimer (non-medical) | P1 |

### Auth — HUB scaffolds, CLIENT polishes

| ID | Screen | Notes | Pri |
|---|---|---|---|
| A-01 | Sign in | Phone (+91) OTP primary; email option; staff use email + password (+ optional 2FA) | P1 |
| A-02 | Verify OTP | 6-digit, resend timer, autofill | P1 |
| A-03 | Forgot password (staff) | | P1 |
| A-04 | Space chooser | Only for multi-role users | P1 |

### Client portal `/app` — owner chat: CLIENT

| ID | Screen | Key content & actions | Pri |
|---|---|---|---|
| C-01 | Onboarding | Name, DOB, gender (optional), city, how did you hear, **privacy consent** (separate checkboxes: data processing, WhatsApp messages, marketing) | P1 |
| C-02 | Home | Greeting; next appointment card (Join / Reschedule); remedy/order tracker; payment due card; follow-up prompt; journal check-in; questionnaire pending banner | P1 |
| C-03 | Book a consultation (wizard) | 1 Type → 2 Mode → 3 Date & slot → 4 Details & consent → 5 Confirm & pay → 6 Confirmation (add to calendar, questionnaire CTA) | P1 |
| C-04 | Appointments | Upcoming / Past; detail: join link (opens 10 min before), location, reschedule, cancel (policy shown), receipt | P1 |
| C-05 | Questionnaire | One question per step, progress "Step 3 of 8", multiple-choice / rating / free text, save & finish later | P1 |
| C-06 | My Remedies | Current approved blend (remedy names, plain-language description, instructions, duration), previous versions, "Reorder this blend" | P1 |
| C-07 | Wellness journal | Daily mood/sleep/stress sliders, notes, goals, weekly trend chart; sharing toggle "Share with my consultant" (default on, D-15) | P2 |
| C-08 | Shop (in-app) | Same as P-04/P-05 inside the app shell | P1 |
| C-09 | Cart & checkout | Combined remedy + products, address book, delivery estimate, GST breakdown, pay | P1 |
| C-10 | Orders & tracking | Order list; detail with stepper (Ordered → Preparing → Shipped → Delivered), courier + AWB link, invoice, return request | P1 |
| C-11 | Payments & invoices | Due / paid, pay now, download invoice/receipt | P1 |
| C-12 | Notifications | Inbox + preferences per channel | P2 |
| C-13 | Profile & privacy | Personal details, addresses, consent management, download my data, delete request, sign out | P1 |
| C-14 | Help | FAQs, contact via WhatsApp/email, policies | P2 |

### Consultant workspace `/consult` — owner chat: CONSULTANT

| ID | Screen | Key content & actions | Pri |
|---|---|---|---|
| K-01 | Today | Session strip (time chips), next session card with **Start**, questionnaires to review, formulas awaiting approval, follow-ups due, recent client journal flags | P1 |
| K-02 | Calendar & availability | Week/day view; working hours per weekday, breaks, leave/blocked dates, buffer time, online/in-person per slot; drag to reschedule (with client notify) | P1 |
| K-03 | Clients | Search by name/phone/ID, filters (active, follow-up due, new), last visit, next visit | P1 |
| K-04 | Client profile | Header (name, ID, age, consent), tabs: **Overview · Timeline · Questionnaires · Journal · Remedies · Notes**; private notes block; mood/sleep trend; Start consultation | P1 |
| K-05 | Session | Split view: left questionnaire + history; right note editor with two clearly separated areas: **Private notes** (lock) and **Summary for client**; timer; end session → create follow-up + open remedy builder | P1 |
| K-06 | Remedy builder | Library (search, 7 groups) + formula panel (remedies, private rationale, dosage, duration, bottle size), templates, duplicate previous, version history, status stepper Draft → Review → Approved → Sent to office, **Preview client summary** | P1 |
| K-07 | Bach Flower library | 38 remedies: name, group, verified description, indications (educational), consultant's own notes | P1 |
| K-08 | Templates | Formula templates; **questionnaire builder** (sections, question types, conditional skip, versioning) | P2 |
| K-09 | Follow-ups | Due / overdue / upcoming; contact client; book on their behalf | P1 |
| K-10 | Client summary preview | Exactly what the client will see in C-06 + PDF | P1 |
| K-11 | My settings | Profile, signature, meeting link default, notification prefs | P2 |

### Manager operations `/ops` — owner chat: MANAGER

| ID | Screen | Key content & actions | Pri |
|---|---|---|---|
| M-01 | Operations home | Counts by stage, SLA at risk, today's appointments, low stock, overdue payments, tasks assigned to me | P1 |
| M-02 | Remedy preparation queue | Prep tasks with **prep sheet** (client first name + ID, remedy list, drops per remedy, bottle size, label text) — no notes/rationale; assign; Preparing → QC (checklist) | P1 |
| M-03 | Orders | All sales orders (remedy / store / combined), filters, detail: items, payment, invoice, shipment, timeline | P1 |
| M-04 | Fulfilment board | Kanban: New · Preparing · Quality check · Packing · Dispatched · Delivered; card = order no., first name, city, type badges, due/SLA, assignee | P1 |
| M-05 | Pack & dispatch | Pick list, packing checklist, courier, AWB, ship date, charge, print label & prep sheet, **Mark dispatched**; phone "dispatch mode" | P1 |
| M-06 | Shipments & exceptions | In transit, failed delivery, RTO, replacement; courier sync status | P2 |
| M-07 | Catalogue | Products, variants (size), SKU, images, description, ingredients, usage, safety, MRP, price, cost, tax category, collection, active flag, SEO | P1 |
| M-08 | Manufacturing | Restricted aroma **formula library** (versions), production orders, batch detail (stepper Request → Allocation → Production → QC → Bottling & labelling → Received), batch sheet print | P2 |
| M-09 | Inventory | Tabs Raw materials / Packaging / Finished goods; stock by location; movements ledger; adjustments (reason required); reorder rules; expiry tracking; stock take | P1 |
| M-10 | Suppliers & purchases | Suppliers, purchase orders, GRN, supplier bills (via finance) | P2 |
| M-11 | Appointments desk | All bookings, check-in for in-person, reschedule/cancel on behalf, walk-in booking + record offline payment | P1 |
| M-12 | Clients (CRM) | Contact details, addresses, orders, invoices, communication log — **no consultation notes or formulas** | P1 |
| M-13 | Billing | Invoices list, create manual invoice, record payment (cash/UPI/bank/card), receipts, request refund/credit note | P1 |
| M-14 | Payment Follow-up Centre | Due today / Due soon / Overdue / Partially paid / Disputed; Clients · Suppliers · Staff reimbursements; send reminder (template preview), reminder log, record payment | P1 |
| M-15 | Expenses & bills | Record expense with receipt, category, payment account; submit for approval; recurring bills view | P1 |
| M-16 | Ops reports | Orders, prep turnaround, courier performance, stock movement, manufacturing yield | P2 |

### Owner command centre `/owner` — owner chat: OWNER

| ID | Screen | Key content & actions | Pri |
|---|---|---|---|
| O-01 | Command centre | Period selector + compare; KPIs (Revenue, Net profit, Cash & bank, Receivables, Payables, Consultations); revenue by stream; ops funnel; top products by margin; alerts; Ask BeWise panel; phone layout | P1 |
| O-02 | Finance dashboard | Income vs expense, cash position by account, receivables/payables ageing, upcoming dues (7/30 days) | P1 |
| O-03 | Accounting | Chart of accounts, journals (manual journal with balance check), general ledger, trial balance, period close / lock, FY setup | P1 |
| O-04 | Reports | P&L, Balance sheet, Cash flow, Trial balance, AR/AP ageing, GST summary (GSTR-1/3B helper), sales by product/category, margins, stock valuation, manufacturing cost, consultation & remedy reports, staff & supplier ledgers; export PDF/Excel with generated timestamp | P1 |
| O-05 | Approvals | Expenses, supplier bills, refunds above threshold, payment approvals, stock write-offs; approve/reject with comment; audit trail | P1 |
| O-06 | Cash & bank | Accounts (cash, bank, UPI, Razorpay clearing), transfers, statement import (CSV), reconciliation matching | P2 |
| O-07 | People & payroll | Employees, salary structures, advances, incentives, reimbursements, deductions, payslips | P2 |
| O-08 | Personal finance | Separate space: accounts, cards, loans/EMIs, budgets, goals, investments, assets/liabilities, owner transfers, personal reports | P3 |
| O-09 | Settings | Business profile & legal entity, GSTIN, tax rates/HSN-SAC, invoice numbering, **consultation types/fees/durations**, remedy pricing (D-02), cancellation & refund policy, reminder schedules, shipping charges, notification templates, integrations (Razorpay, WhatsApp, email, courier) | P1 |
| O-10 | Users, roles & permissions | Invite staff, assign roles, granular permission matrix (view/create/edit/approve/export/delete), deactivate | P1 |
| O-11 | Audit log | Who did what, when, before/after, filter by user/module/record | P2 |
| O-12 | Ask BeWise (AI assistant) | Read-only Q&A on permitted data, summaries, suggested actions requiring approval | P3 |

---

## Part C — Navigation map (where each screen lives)

```
/                       P-01      /shop            P-04    /shop/[slug]  P-05
/consultations          P-02      /bach-flower     P-03    /about        P-07
/legal/[page]           P-09      /sign-in         A-01    /verify       A-02

/app                    C-02      /app/book        C-03    /app/appointments[/id]  C-04
/app/questionnaires/[id] C-05     /app/remedies    C-06    /app/journal  C-07
/app/shop[...]          C-08      /app/cart        C-09    /app/orders[/id] C-10
/app/payments           C-11      /app/notifications C-12  /app/profile  C-13   /app/help C-14

/consult                K-01      /consult/calendar K-02   /consult/clients K-03
/consult/clients/[id]   K-04      /consult/sessions/[id] K-05
/consult/formulas/[id]  K-06      /consult/library K-07    /consult/templates K-08
/consult/follow-ups     K-09      /consult/settings K-11

/ops                    M-01      /ops/prep        M-02    /ops/orders[/id] M-03
/ops/board              M-04      /ops/dispatch    M-05    /ops/shipments M-06
/ops/catalog            M-07      /ops/manufacturing M-08  /ops/inventory M-09
/ops/purchases          M-10      /ops/appointments M-11   /ops/clients  M-12
/ops/billing            M-13      /ops/follow-ups  M-14    /ops/expenses M-15   /ops/reports M-16

/owner                  O-01      /owner/finance   O-02    /owner/accounting O-03
/owner/reports          O-04      /owner/approvals O-05    /owner/bank   O-06
/owner/people           O-07      /owner/personal  O-08    /owner/settings O-09
/owner/users            O-10      /owner/audit     O-11    /owner/assistant O-12
```
