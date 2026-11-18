# 01 — Chart of Accounts (draft)

> **Owner:** OWNER chat · **Status: DRAFT — pending accountant (D-13).** The app shows the badge
> "Draft — pending accountant" on every report until `accounting.coa_status = 'validated'` (see `06-SETTINGS-KEYS.md`).
> Business: BeWise Wellness, Vadodara, Gujarat (GST state code **24**). Proprietorship assumed (D-17 open).
> Prices, GST rates and treatments below are **defaults to validate**, not tax advice.

## 1. Design rules

| Rule | Detail |
|---|---|
| Code scheme | 4 digits. `1xxx` assets · `2xxx` liabilities · `3xxx` equity · `4xxx` income · `5xxx` cost of sales · `6xxx` expenses |
| Groups vs ledgers | Group accounts (`is_group = true`) only roll up. Postings go to ledger accounts only (DB check) |
| System keys | Posting rules refer to accounts by **`system_key`** (e.g. `ar_clients`), never by code, so the accountant can renumber or rename safely |
| Control accounts | `is_control = true` accounts (receivables, payables, staff claims) require a `party_type + party_id` on every line → party sub-ledgers and ageing come straight from the journal |
| Normal balance | Stored (`debit` / `credit`) so reports show positive numbers |
| Bank & cash | One ledger per real account (`bank_accounts.account_id`). The chart ships with one bank, one cash and one Razorpay clearing ledger |
| Archiving | Accounts are never deleted. An account with postings can only be archived (hidden from pickers, still in reports) |
| Contra accounts | Drawings, accumulated depreciation and discounts allowed carry the opposite normal balance of their group |

Table shape (`accounts`): `id, code, name, type (asset|liability|equity|income|expense), subtype, parent_id, is_group, is_control, party_type?, normal_balance, system_key?, gst_component? (cgst|sgst|igst), gst_direction? (input|output), archived_at, + audit columns`.

## 2. The chart

### 1xxx Assets
| Code | Name | system_key | Notes |
|---|---|---|---|
| 1000 | **Current assets** (group) | | |
| 1100 | Cash in hand — office | `cash_office` | Haresh's walk-in collections |
| 1110 | Petty cash | `cash_petty` | Optional |
| 1200 | Bank — current account | `bank_primary` | Name and bank set in O4. Add more banks as children of group 1190 |
| 1300 | Razorpay clearing | `razorpay_clearing` | Captured but not yet settled. Should net to roughly 0–3 days of sales |
| 1310 | Shiprocket wallet | `shiprocket_wallet` | Prepaid wallet. Recharges in, shipping charges out |
| 1400 | Receivables — clients | `ar_clients` | **Control** (party = client) |
| 1410 | Receivables — business customers | `ar_business` | **Control** (party = customer). B2B or wholesale, if ever |
| 1500 | Inventory — raw materials | `inv_raw` | Bach stock concentrates, brandy/base, carrier and essential oils, salts |
| 1510 | Inventory — packaging & labels | `inv_packaging` | Bottles, droppers, boxes, labels |
| 1520 | Inventory — work in progress | `inv_wip` | Batches between `materials_allocated` and `received` |
| 1530 | Inventory — finished goods | `inv_finished` | Shop products ready to sell |
| 1600 | Input GST — CGST | `gst_in_cgst` | |
| 1610 | Input GST — SGST | `gst_in_sgst` | |
| 1620 | Input GST — IGST | `gst_in_igst` | e.g. GST on Razorpay fees (Razorpay is outside Gujarat) |
| 1630 | Input GST — on hold | `gst_in_hold` | Credit not yet in GSTR-2B. Moved to 1600–1620 when matched (accountant option) |
| 1700 | Advances to suppliers | `supplier_advances` | **Control** (party = supplier) |
| 1710 | Staff advances | `staff_advances` | **Control** (party = staff). Payroll is later (D-41), but advances happen |
| 1720 | Security deposits | `deposits` | Rent deposit etc. |
| 1730 | Prepaid expenses | `prepaid` | Annual software and insurance |
| 1800 | **Fixed assets** (group) | | |
| 1810 | Furniture & fixtures | `fa_furniture` | |
| 1820 | Equipment & tools | `fa_equipment` | Manufacturing equipment |
| 1830 | Computers & phones | `fa_computers` | |
| 1890 | Accumulated depreciation | `fa_acc_dep` | Contra (credit balance) |

### 2xxx Liabilities
| Code | Name | system_key | Notes |
|---|---|---|---|
| 2100 | Payables — suppliers | `ap_suppliers` | **Control** (party = supplier) |
| 2110 | Staff expense claims payable | `ap_staff_claims` | **Control** (party = staff). Expenses paid from someone's own pocket |
| 2150 | Goods received, not yet billed | `grni` | Clearing between goods receipt (GRN) and the supplier bill |
| 2200 | Output GST — CGST | `gst_out_cgst` | |
| 2210 | Output GST — SGST | `gst_out_sgst` | |
| 2220 | Output GST — IGST | `gst_out_igst` | Inter-state shop orders and online clients outside Gujarat |
| 2230 | GST payable — reverse charge | `gst_rcm` | e.g. legal services, GTA. Needs accountant confirmation |
| 2300 | TDS payable | `tds_payable` | Only if the business must deduct TDS (rent or professional fees above thresholds) |
| 2400 | Consultation fees received in advance | `deferred_consultations` | Paid bookings not yet held. Released on completion or no-show (see `02-POSTING-RULES.md` §3) |
| 2410 | Client credits & unallocated receipts | `client_credits` | **Control** (party = client). Overpayments, payments that could not be matched |
| 2500 | Accrued expenses | `accruals` | Month-end accruals (accountant) |
| 2600 | Loan from owner | `loan_owner` | Owner transfer type "loan" (OW-21, later phase) |
| 2610 | Bank loans | `loan_bank` | |

### 3xxx Equity
| Code | Name | system_key | Notes |
|---|---|---|---|
| 3000 | Owner's capital | `capital` | |
| 3100 | Owner's drawings | `drawings` | Contra (debit balance). Business → personal transfers. **Never** an expense (OW-21) |
| 3200 | Retained earnings | `retained_earnings` | Prior years' profit. Computed by reports; optional closing entry at FY lock |
| 3900 | Opening balance equity | `opening_balance` | Only used when importing opening balances. Should end at 0 after the accountant's opening entry |

### 4xxx Income
| Code | Name | system_key | Default tax code | Notes |
|---|---|---|---|---|
| 4100 | Consultation income — first consultation (incl. remedy) | `inc_consult_first` | `SVC_CONSULT` | ₹1,000, remedy blend included (D-02, D-09) |
| 4110 | Consultation income — follow-up (incl. remedy) | `inc_consult_followup` | `SVC_CONSULT` | ₹800 |
| 4120 | Forfeited consultation fees (no-show) | `inc_consult_forfeit` | — | No-show forfeits under the reschedule policy (D-08). GST was already charged when the invoice was issued |
| 4200 | Remedy reorders | `inc_remedy_reorder` | `GOODS_REMEDY` | `remedy.reorder_price` |
| 4300 | Product sales — aromatherapy | `inc_products` | per product HSN | Oils, sprays, salts |
| 4400 | Shipping charges collected | `inc_shipping` | follows the main supply | Shipping on a goods invoice follows that invoice's main supply (composite supply) |
| 4800 | Discounts allowed | `inc_discounts` | | Contra (debit balance). Only if coupons are introduced |
| 4900 | Other income | `inc_other` | | Interest, round-off gains |

### 5xxx Cost of sales
| Code | Name | system_key | Notes |
|---|---|---|---|
| 5100 | Cost of remedies given with consultations | `cogs_remedy_included` | Bottle, base and flower drops consumed for ₹0 remedy orders |
| 5110 | Cost of remedy reorders | `cogs_remedy_reorder` | |
| 5200 | Cost of products sold | `cogs_products` | Finished goods at weighted-average cost |
| 5400 | Stock write-offs & wastage | `cogs_wastage` | Expired, damaged, QC-rejected, stock-take shortages |
| 5410 | Replacement cost (damaged / wrong / lost) | `cogs_replacements` | Replacement orders: no refunds, replacements only (D-16) |
| 5500 | Stock adjustments (gains) | `cogs_adjustments` | Stock-take surpluses (credit) |
| 5600 | Freight inward | `cogs_freight_in` | Option: add to inventory cost instead (accountant) |

### 6xxx Expenses
| Code | Name | system_key | GST input default |
|---|---|---|---|
| 6100 | Shipping & courier (Shiprocket) | `exp_shipping` | Eligible |
| 6110 | Payment gateway charges | `exp_gateway` | Eligible |
| 6120 | Bank charges | `exp_bank` | Eligible if on a GST invoice |
| 6200 | Rent | `exp_rent` | Eligible if the landlord is registered |
| 6210 | Electricity & water | `exp_utilities` | n/a |
| 6220 | Internet & phone | `exp_telecom` | Eligible |
| 6300 | Salaries & wages | `exp_salaries` | n/a (payroll later, D-41: record as expenses meanwhile) |
| 6310 | Staff welfare | `exp_staff_welfare` | **Blocked** in most cases (s.17(5)) — accountant |
| 6400 | Professional fees (CA, legal) | `exp_professional` | Eligible; legal may be reverse charge |
| 6500 | Marketing & advertising | `exp_marketing` | Eligible (Meta ads are IGST import → RCM/OIDAR — accountant) |
| 6510 | Printing & stationery | `exp_printing` | Eligible |
| 6600 | Software & subscriptions | `exp_software` | Supabase, Vercel, Claude API, Google Workspace — mostly foreign, RCM/OIDAR (accountant) |
| 6610 | Messaging (WhatsApp, SMS, email) | `exp_messaging` | Eligible |
| 6700 | Travel & conveyance | `exp_travel` | Mostly blocked or n/a |
| 6800 | Repairs & maintenance | `exp_repairs` | Eligible |
| 6900 | Depreciation | `exp_depreciation` | — |
| 6910 | Miscellaneous expenses | `exp_misc` | Discouraged. Approvals screen nudges for a better category |
| 6920 | Round-off | `exp_roundoff` | Paise round-off on manual invoices or bills (debit or credit) |
| 6930 | Interest, late fees & penalties | `exp_penalties` | Not tax-deductible — flagged in P&L notes |

**Expense categories** (OW-10, MG-26) map 1:1 to the 6xxx ledgers above, plus "Inventory purchase", which routes to a supplier bill instead.

## 3. Tax codes (`tax_rates`) — defaults to validate

Rates are stored in **basis points** (1800 = 18%). Each code has an `effective_from` date, so a rate change never rewrites old invoices.

| Code | Applies to | HSN/SAC (draft) | Rate (draft) | Why it needs the accountant |
|---|---|---|---|---|
| `SVC_CONSULT` | Consultations (composite supply: consultation is the main supply, the remedy is included) | SAC **9993** (human health services; exact 6-digit code TBD) | **18%** | The healthcare exemption (Notif. 12/2017, entry 74) covers *recognised systems of medicine* only. Bach flower therapy is not one, so it is assumed **taxable** |
| `GOODS_REMEDY` | Remedy reorders | HSN TBD (3004 vs 3307 vs 2208?) | **18%** | Classification of Bach flower remedies is unclear. GST 2.0 (Sept 2025) changed many slabs |
| `GOODS_AROMA` | Oils, sprays, salts | 3307 / 3301 | **18%** | Confirm per product |
| `EXEMPT` | Exempt supplies | — | 0% | |
| `NON_GST` | Non-GST items | — | — | |

**Unregistered fallback:** if `tax.registration.registered = false` (turnover under the ₹20 lakh threshold, or not registered yet), the app issues **bills of supply** with no GST lines. Prices stay the same and income = gross. Do not choose this without the accountant.

**Pricing:** client prices (₹1,000 / ₹800, shop prices) are **GST-inclusive** by default (`tax.pricing.prices_include_gst = true`). See the rounding rules in `02-POSTING-RULES.md` §6.

## 4. Questions for the accountant (D-13)
1. Is the business GST-registered, and under which legal entity and GSTIN? Regular or composition scheme? (Composition cannot charge GST on invoices and cannot fully cover services — it changes everything.)
2. SAC and rate for Bach flower consultations including the remedy. Is it confirmed as taxable at 18%?
3. HSN and rate for remedy reorders and each aromatherapy product after the GST 2.0 changes.
4. Recognise consultation revenue on **completion** (our default, account 2400) or when paid?
5. Inventory: **perpetual, weighted-average cost** (our default) or periodic with a closing-stock entry?
6. Treatment of foreign SaaS (Supabase, Vercel, Anthropic, Meta ads): RCM/OIDAR, input credit.
7. Depreciation method and rates (Companies Act vs IT Act) — we only need the journal template.
8. Any TDS obligations (rent, professional fees)?
9. Opening balances as at go-live date (bank, cash, stock, payables, capital).
