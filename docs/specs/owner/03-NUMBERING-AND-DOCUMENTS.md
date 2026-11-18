# 03 — Document numbering (FY Apr–Mar) & PDF layouts (draft)

> **Owner:** OWNER chat. Formats follow contracts §1. GST rules: CGST Rules 46 (tax invoice), 49 (bill of supply),
> 50/51 (receipt/refund vouchers — not used, see below), 53 (credit note). **Validate with the accountant (D-13).**

## 1. Series

| Document | Format | Example | Issued when |
|---|---|---|---|
| Tax invoice | `INV/{fy}/{seq:4}` | `INV/2026-27/0001` | Payment captured (consultations); `order.paid` (shop); manually (MANAGER `createInvoice`) |
| Bill of supply (only if unregistered) | `BOS/{fy}/{seq:4}` | `BOS/2026-27/0001` | Same moments, no GST |
| Receipt | `RC/{fy}/{seq:4}` | `RC/2026-27/0001` | Every captured or recorded payment |
| Credit note | `CN/{fy}/{seq:4}` | `CN/2026-27/0001` | Owner correction only (no refunds, D-16) |
| Expense | `EXP/{fy}/{seq:4}` | `EXP/2026-27/0001` | Expense submitted |
| Supplier payment voucher | `PV/{fy}/{seq:4}` | `PV/2026-27/0001` | Supplier bill paid |
| Journal | `JV/{fy}/{seq:5}` | `JV/2026-27/00001` | Entry posted |

- `{fy}` = `2026-27` for 1 Apr 2026 … 31 Mar 2027 (IST date of the document). Sequences **restart every 1 April**.
- **GST limit: an invoice number has at most 16 characters.** `INV/2026-27/0001` is exactly 16. If more than 9,999 invoices a year are ever expected, switch the format (setting `numbering.series`) to `INV/26-27/00001` (15 chars). The switch only works at an FY boundary. The app warns at 9,000.
- **Gapless and consecutive:** numbers come from a per-series, per-FY counter row (`document_sequences`) incremented with `UPDATE … RETURNING` inside the same transaction that issues the document. A rolled-back transaction leaves no gap. Draft invoices have **no number** until issued.
- Issued invoices are never deleted. A mistaken one is **voided** (`void`: no payments, same GST period, kept in the GSTR-1 data as cancelled) or corrected with a credit note after the period.

## 2. Invoice PDF (A4 portrait, `@react-pdf/renderer`, v4 tokens, printable in black & white)

```
┌──────────────────────────────────────────────────────────────┐
│ [BeWise logo · Holistic Wellness]            TAX INVOICE      │
│ Legal name · trade name                      INV/2026-27/0001 │
│ Address, Vadodara, Gujarat 3900xx            Date 17 Nov 2026 │
│ GSTIN 24XXXXXXXXXXXZX · State: Gujarat (24)  Due  — / Paid    │
│ phone · email · website                                       │
├──────────────────────────────────────────────────────────────┤
│ Billed to                       Ship to (if goods & different)│
│ Name · phone · address · state  Address · state               │
│ GSTIN (if B2B)                                                │
│ Place of supply: Gujarat (24)   Reverse charge: No            │
├────┬───────────────────────────┬──────┬────┬──────┬──────────┤
│ #  │ Description               │HSN/SAC│Qty│ Rate  │ Taxable  │
│ 1  │ First consultation —      │ 9993 │ 1  │847.46 │ 847.46   │
│    │ includes personalised      │      │    │       │          │
│    │ Bach flower remedy blend   │      │    │       │          │
├────┴───────────────────────────┴──────┴────┴──────┴──────────┤
│ GST summary   HSN/SAC  Taxable  CGST 9%  SGST 9%  (IGST)      │
│               9993     847.46   76.27    76.27               │
│                                        Total  ₹1,000.00       │
│ Amount in words: Rupees One Thousand Only                     │
├──────────────────────────────────────────────────────────────┤
│ Payment: Paid ₹1,000.00 on 17 Nov 2026 · Razorpay UPI ·       │
│ RC/2026-27/0001 · pay_XXXX            Balance due ₹0.00       │
│ (unpaid manual invoice: "Pay online" link + QR)               │
├──────────────────────────────────────────────────────────────┤
│ Notes: Prices include GST. No refunds — sessions can be       │
│ rescheduled as per policy (D-08/D-16).                         │
│ Computer-generated invoice; no signature required.*          │
│ Generated 17 Nov 2026 10:42 IST                                │
└──────────────────────────────────────────────────────────────┘
```
\* Rule 46 asks for the signature or **digital signature** of the supplier. Option: an uploaded signature image plus "Authorised signatory" (setting `business.signature_file_id`). Accountant to confirm.

**Privacy (D-03, D-38):** invoice lines **never** list flower names, concerns, intake or session content. A remedy line reads "Personalised Bach flower remedy blend — 30 ml". The accountant sees exactly this and nothing more.

Mandatory-field checklist (Rule 46), tested by a snapshot test per invoice type: supplier name/address/GSTIN · consecutive number ≤ 16 chars · date · recipient name/address (+ GSTIN if registered; address and state mandatory for B2C ≥ ₹50,000) · HSN/SAC (4 digits) · description · qty & unit · taxable value · rate & amount per tax · place of supply with state name/code · ship-to if different · reverse charge yes/no · signature.

## 3. Other layouts
| Document | Differences from the invoice |
|---|---|
| Receipt | "PAYMENT RECEIPT", RC no., payer, amount in figures and words, method + reference (Razorpay payment id / UTR / cheque no.), against invoice(s) list, balance remaining |
| Credit note | "CREDIT NOTE", CN no., **original invoice number and date** (mandatory), reason (correction), lines with negative-effect values, GST summary, effect: "Adjusted against INV… / held as credit" |
| Bill of supply | Title "BILL OF SUPPLY", no tax columns, text "Supplier not registered under GST" or "Composition taxable person, not eligible to collect tax" |
| Statement of account (client) | Opening balance, invoices, receipts, credits, closing balance for a date range |
| Reports (OW-12/27) | Header: business name · report · period · **"Generated {date time} IST by {user}"** · "Draft — pending accountant" badge while D-13 is open |

## 4. Storage & delivery
- PDFs are rendered on issue and stored in Supabase Storage `finance-docs/{fy}/{type}/{number}.pdf` (private bucket). They are re-rendered only on void (watermark "VOID") — the original is kept.
- `getDocumentPdf()` returns a **signed URL valid 10 minutes**. RLS: client → own documents; manager → all invoices/receipts; accountant → all finance documents; consultant → none.
- WhatsApp/email delivery attaches the document via signed URL (template `invoice_issued`, see `05-REMINDERS-AND-WHATSAPP.md`).
