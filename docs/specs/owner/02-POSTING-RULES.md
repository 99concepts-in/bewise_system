# 02 — Posting rules, journal invariants & GST rounding (draft)

> **Owner:** OWNER chat · **Status: DRAFT — pending accountant (D-13).** Accounts are referenced by `system_key`
> (see `01-CHART-OF-ACCOUNTS.md`). Postings are driven by **domain events** (contracts §4), never by other modules writing
> to the ledger. All code in `src/modules/finance/posting/**` is `// @sensitive`.

## 1. Journal invariants (enforced in DB *and* code)

| # | Invariant | How |
|---|---|---|
| J1 | Σ debit = Σ credit per entry, both > 0 | Deferred constraint trigger on `journal_lines`, checked at commit |
| J2 | Each line has exactly one of `debit_paise` / `credit_paise` > 0, integers | `check` constraint |
| J3 | Only ledger (non-group, non-archived) accounts | FK + trigger |
| J4 | Control accounts need `party_type + party_id` | Trigger |
| J5 | `entry_date` must fall in an **open** fiscal period | Trigger against `fiscal_periods.status` |
| J6 | **Posted entries are immutable** — no UPDATE/DELETE on posted entries or their lines | RLS + trigger. Corrections = reversal entry (`reverses_entry_id`) + new entry |
| J7 | Idempotent: unique `(source_type, source_id, rule_key)` | Unique index. Event replays post nothing new |
| J8 | Every entry carries `source_type, source_id, rule_key, narration, posted_by` (`system` for event rules) | Not null |
| J9 | Entries are numbered `JV/2026-27/00001` per FY on posting | Sequence per FY |

Entry statuses: `draft` (manual journal being edited) → `posted` → (optionally) `reversed` (a flag only, set when a reversal is posted). Manual journals are owner-only and need the balance check before **Post**.

**Reversal rule:** the reversal mirrors every line (debit ↔ credit). It is dated **today**, or the original date if that period is still open and the owner chooses so. A reversal of a reversal is not allowed; post a fresh entry instead.

## 2. Lifecycle of the two money journeys

**A. Booking a consultation (C2)**
```
createCheckout(appointment) → Razorpay order (no invoice yet)
   ↓ webhook payment.captured (source of truth)
finance, ONE transaction:  payment row = captured
                           invoice issued (INV no.) for the consultation, dated capture date
                           allocation payment → invoice  ⇒ invoice = paid
                           receipt RC no.
                           emit payment.captured, invoice.issued
posting handlers:          P1 (invoice.issued) + P2 (payment.captured)
later appointment.completed or appointment.no_show → P3 (release the advance to income)
```
Why issue the invoice at payment: for services, GST is due at the earlier of payment or invoice, so issuing both together avoids a separate receipt voucher and avoids gaps in the invoice series from abandoned checkouts.

**B. Shop order or remedy reorder (C4)**
```
createCheckout(sales_order) → Razorpay order
   ↓ webhook payment.captured → finance: payment captured (unallocated, linked to salesOrderId), emit payment.captured
commerce marks order paid → order.paid
finance @handles order.paid: issue invoice from order items + shipping, allocate the payment ⇒ paid, emit invoice.issued
```
Until `order.paid` arrives, the captured payment sits against the client in `client_credits` (2410). P2 then moves it to `ar_clients` on allocation, so nothing is ever lost between the two events.

## 3. Rules per event

Notation: **Dr** / **Cr**, `gross` = invoice total incl. GST, `taxable` = value before GST. GST lines split by place of supply (§5).

| # | Trigger (`@handles`) | Condition | Debit | Credit | rule_key |
|---|---|---|---|---|---|
| P1a | `invoice.issued` | consultation invoice | `ar_clients` gross | `deferred_consultations` taxable · `gst_out_*` tax | `inv.consult` |
| P1b | `invoice.issued` | goods or other invoice | `ar_clients` (or `ar_business`) gross | income per line (`inc_products`, `inc_remedy_reorder`, `inc_shipping`, …) taxable · `gst_out_*` tax | `inv.sale` |
| P1c | `invoice.issued` | rounding needed (manual exclusive-price invoice) | | ± `exp_roundoff` | part of P1b |
| P2a | `payment.captured` | Razorpay, allocated to invoice(s) | `razorpay_clearing` amount | `ar_clients` (per allocation) | `pay.razorpay` |
| P2b | `payment.captured` | Razorpay, not allocated yet (shop before `order.paid`, late capture, overpayment) | `razorpay_clearing` | `client_credits` | `pay.razorpay.unallocated` |
| P2c | `payment.captured` | offline: cash / UPI-to-bank / bank transfer / cheque (via `recordPayment`) | `cash_office` or the chosen bank ledger | `ar_clients` (or `client_credits`) | `pay.offline` |
| P2d | allocation of a credit (internal `payment.allocated`) | credit later matched to an invoice | `client_credits` | `ar_clients` | `alloc.credit` |
| P3a | `appointment.completed` | invoice exists for the appointment | `deferred_consultations` taxable | `inc_consult_first` / `inc_consult_followup` | `consult.recognise` |
| P3b | `appointment.no_show` | policy = forfeit (D-08) | `deferred_consultations` taxable | `inc_consult_forfeit` | `consult.forfeit` |
| — | `appointment.rescheduled` / `.cancelled` | no refunds (D-16): the advance stays deferred | — | — | none. Report "Advances older than 180 days" for owner review |
| P4 | `settlement.processed` (Razorpay webhook or daily recon) | settlement batch | `bank_primary` net · `exp_gateway` fee · `gst_in_igst` GST on fee | `razorpay_clearing` gross | `rzp.settlement` |
| P5a | `expense.approved` | paid from a business account | expense ledger (net) · `gst_in_*` (eligible, supplier GSTIN present) | cash/bank ledger | `exp.paid` |
| P5b | `expense.approved` | paid personally by staff | expense ledger · `gst_in_*` | `ap_staff_claims` (party = staff) | `exp.claim` |
| P5c | `expense.approved` | owner paid from personal money | expense ledger · `gst_in_*` | `capital` (or `loan_owner` — setting) | `exp.owner_paid` |
| P5d | expense claim reimbursed (`expense` → `paid`) | | `ap_staff_claims` | cash/bank | `exp.reimburse` |
| P6a | goods received (**needs MANAGER event**, see request) | perpetual inventory | `inv_raw` / `inv_packaging` / `inv_finished` at PO cost | `grni` | `grn.receive` |
| P6b | supplier bill approved | linked to GRN | `grni` (GRN value) · `gst_in_*` · ± `cogs_adjustments` (price difference) | `ap_suppliers` | `bill.goods` |
| P6c | supplier bill approved | services or expenses (no GRN) | expense ledger · `gst_in_*` | `ap_suppliers` | `bill.expense` |
| P6d | supplier payment recorded | | `ap_suppliers` (or `supplier_advances` if no bill yet) | bank/cash | `bill.pay` |
| P7a | stock movement `remedy_prep_consume` (**needs MANAGER event**) | remedy order price = 0 (included) | `cogs_remedy_included` | `inv_raw` / `inv_packaging` at WAC | `stock.remedy_included` |
| P7b | same | remedy reorder | `cogs_remedy_reorder` | `inv_raw` / `inv_packaging` | `stock.remedy_reorder` |
| P7c | stock movement `sale` | on dispatch | `cogs_products` | `inv_finished` at WAC | `stock.sale` |
| P7d | stock movement `wastage` / negative `adjustment` | | `cogs_wastage` | inventory | `stock.writeoff` |
| P7e | positive `adjustment` | stock-take surplus | inventory | `cogs_adjustments` | `stock.gain` |
| P7f | `return` (RTO, resaleable) | | `inv_finished` | `cogs_products` | `stock.return` |
| P7g | replacement order dispatched (₹0 order) | D-16 | `cogs_replacements` | `inv_finished` | `stock.replacement` |
| P8a | production consume (materials → batch) | | `inv_wip` | `inv_raw` / `inv_packaging` at WAC | `mfg.consume` |
| P8b | `batch.received` | QC passed | `inv_finished` (batch cost = Σ consumed) | `inv_wip` | `mfg.receive` |
| P8c | batch `rejected` | | `cogs_wastage` | `inv_wip` | `mfg.reject` |
| P9 | Shiprocket wallet recharge (recurring item / bill payment) | | `shiprocket_wallet` | bank | `ship.recharge` |
| P10 | Shiprocket monthly invoice (bill) | | `exp_shipping` · `gst_in_*` | `shiprocket_wallet` | `ship.charges` |
| P11 | credit note issued (owner correction only, no refund) | reduces an invoice | income (or `deferred_consultations` if not yet held) taxable · `gst_out_*` tax | `ar_clients`, or `client_credits` if the invoice was paid | `cn.issue` |
| P12 | bank transfer between own accounts | | destination bank/cash | source bank/cash | `bank.transfer` |
| P13a | owner transfer **capital** (later phase OW-21) | | bank | `capital` | `owner.capital` |
| P13b | owner transfer **drawing** | | `drawings` | bank | `owner.drawing` |
| P13c | owner transfer **loan** | | bank | `loan_owner` | `owner.loan` |
| P14 | GST settlement (monthly, owner confirms on OW-29) | after GSTR-3B | `gst_out_*` (utilised) | `gst_in_*` (utilised per s.49 order) · bank (cash paid) | `gst.settle` |
| P15 | refund done **outside the app** (Razorpay dashboard / chargeback, `refund.processed` or `payment.dispute.lost`) | should not happen (D-16) but the books must stay true | `client_credits` or credit note (owner chooses) | `razorpay_clearing` | `rzp.refund_external` + owner alert |
| P16 | depreciation (monthly, accountant template) | | `exp_depreciation` | `fa_acc_dep` | `fa.depreciation` |
| — | `payment.failed`, `appointment.held`, `order.placed` | | no posting | | |

**Why the deferral (P1a → P3):** a paid booking is a promise of a future session. Income is recognised when the session is held (or forfeited by a no-show), so the P&L doesn't swing with booking timing. GST is still charged at invoicing. Setting `accounting.defer_consultation_revenue = false` (accountant option) posts P1a straight to income and disables P3.

## 4. Inventory valuation (default: perpetual, weighted average)

- Each `stock_item` keeps a running weighted-average cost: `wac = (qty_on_hand·wac + qty_in·unit_cost) / (qty_on_hand + qty_in)`, computed in paise per **unit** with 4 extra decimal places (`numeric(18,4)`). Posted amounts are rounded to whole paise, and the rounding residue stays in the inventory account.
- Every outgoing movement is valued at the WAC *at the time of the movement*. The value is carried on the movement itself (`value_paise`), so finance does not recompute history.
- **Dependency:** MANAGER's inventory movements must carry `unit_cost_paise` / `value_paise` and emit an event → `requests/20261117-owner-to-manager-stock-valuation-events.md`.
- Fallback while that is pending: post nothing per movement; at month end, post one closing-stock adjustment from `inventory` valuation (periodic method). The UI marks P&L margins "estimated".

## 5. GST — which tax applies

| Supply | Place of supply | Gujarat (24) | Other state |
|---|---|---|---|
| Consultation (B2C, in person) | Supplier location | CGST + SGST | — |
| Consultation (B2C, online) | Recipient's address on record, else supplier location (s.12(2)) | CGST + SGST | **IGST** |
| Goods shipped (shop, reorder) | Delivery address state | CGST + SGST | **IGST** |
| B2B with GSTIN | Recipient's GSTIN state | CGST + SGST | IGST |

`place_of_supply_state_code` is stored on each invoice; tax lines are derived from it. Address state comes from `crm.client_addresses`. Online consultation uses the client's default address; if there is none, Gujarat.

## 6. Rounding (documented & unit-tested)

All amounts are **integer paise**. Rates are in **basis points** (`r`, 1800 = 18%). `round()` = round half **up** (away from zero) at paise.

**Inclusive prices (default for clients)** — per line, `gross` is known:
```
intra-state: half = round(gross × (r/2) / (10000 + r))     // CGST = SGST = half
             taxable = gross − 2·half
inter-state: igst = round(gross × r / (10000 + r)); taxable = gross − igst
```
CGST always equals SGST, and taxable + tax always equals the listed price. **Worked example — ₹1,000 first consultation, Gujarat client, 18%:**
`half = round(100000 × 900 / 11800) = round(7627.12) = 7627` → CGST ₹76.27 · SGST ₹76.27 · taxable ₹847.46 · total **₹1,000.00**.
Follow-up ₹800 → half = round(6101.69) = 6102 → CGST ₹61.02 · SGST ₹61.02 · taxable ₹677.96 · total ₹800.00.

**Exclusive prices (manual B2B invoices, supplier bills)** — per line, `taxable` is known:
```
intra: cgst = sgst = round(taxable × (r/2) / 10000);   inter: igst = round(taxable × r / 10000)
```
Invoice total = Σ lines. If `numbering.round_off_to_rupee = true`, the difference to the nearest rupee goes to a "Round off" line (`exp_roundoff`, either side). Off by default.

**Multi-line:** tax is computed **per line**, then summed. The invoice PDF shows a GST summary grouped by HSN/SAC and rate (Σ of line values, never recomputed on the group total).

**Supplier bills:** take the GST amounts *as printed on the bill*. If they differ from our computation by more than ₹1, show a warning, never auto-correct.

## 7. Period control

- `fiscal_periods`: one row per month, FY Apr–Mar (`2026-27` = 2026-04-01 … 2027-03-31). Status `open → soft_closed → locked`.
- `soft_closed`: only the owner can post into it (warning shown). `locked` (after GST filing or FY close): nobody can post. Late items go to the current period with a narration that references the original date.
- FY close: lock all 12 periods. The optional closing entry (income/expense → `retained_earnings`) can be generated. Reports compute retained earnings regardless.

## 8. Tests (Vitest, must exist before O2 merges)
1. Every rule produces a balanced entry (property test over random amounts 1 paise … ₹10 lakh, rates {0, 500, 1800, 4000}, intra and inter-state).
2. Inclusive rounding: taxable + tax = gross for all gross 1…10,00,000 paise at each rate; CGST = SGST.
3. Fixtures ₹1,000 and ₹800 match the worked examples above.
4. Idempotency: replaying the same event twice → one entry.
5. Immutability: UPDATE/DELETE on a posted line fails (DB test); reversal nets to zero.
6. Locked period rejects posting.
7. Booking journey end-to-end: checkout → capture webhook → invoice paid → completed ⇒ balances: AR 0, deferred 0, income = taxable, GST output = tax, clearing = gross; after settlement, clearing 0.
8. Shop journey with capture before `order.paid` ⇒ credit then allocation ⇒ AR 0, client credits 0.
9. Trial balance always nets to 0 over the seeded demo year.
