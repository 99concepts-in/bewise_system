# M2 / M5 · Printable prep sheet, bottle label & batch sheet

> **Owner:** MANAGER · Screens MG-06 (prep sheet), MG-20 (batch sheet) · Rendering `@react-pdf/renderer` server-side (PDF) + the same data on screen.
> Status: **SPEC v1 (2026-11-17)**. Print on any home/office printer (A5 portrait, fits 2-up on A4) or share the PDF on WhatsApp.

## 1. Remedy prep sheet (A5 portrait, 148 × 210 mm)
Data: **only** `consultation.getPrepSheet(remedyOrderId)` (snapshot) + `intake.getIntakeFlagsForPrep()` → `alcoholFree`. Never notes, reasons, emotions or intake answers.

```
┌─────────────────────────────────────────────────────────┐
│ [owl] BeWise · Holistic Wellness          PREP SHEET     │
│ Order BW-00042 · Prep FT-00042-1        Paid 21 Nov 10:12│
│ Client: Priya S.  ·  Blend v2  ·  30 ml dropper bottle   │
│ Due: today 1:00 PM                         [QR → /ops/…] │
├─────────────────────────────────────────────────────────┤
│ ███ ALCOHOL-FREE BASE ███  use glycerine/water base,     │   ← only when alcoholFree = true
│ ███ NOT brandy          ███  (thick border, full width)  │     also printed as "AF" on the label
├─────────────────────────────────────────────────────────┤
│  ☐  Mimulus ............................ 2 drops         │
│  ☐  Larch .............................. 2 drops         │
│  ☐  Elm ................................ 2 drops         │
│  ☐  Walnut ............................. 2 drops         │
│     Total flowers: 8 drops (≈0.4 ml)                     │
│  ☐  Base: Standard (brandy) / Alcohol-free — fill to 30 ml│
├─────────────────────────────────────────────────────────┤
│ LABEL TEXT (print exactly):                              │
│ ┌─────────────────────────────────────────────┐          │
│ │ Priya — 4 drops, 4 times a day               │          │
│ └─────────────────────────────────────────────┘          │
├─────────────────────────────────────────────────────────┤
│ Checklist  ☐ Bottle cleaned  ☐ Flowers added  ☐ Base filled│
│            ☐ Label printed & applied  ☐ Cap sealed        │
│ Prepared by ________ time ____   QC by ________ time ____ │
├─────────────────────────────────────────────────────────┤
│ 🔒 Consultation notes are private and not shown here.    │
└─────────────────────────────────────────────────────────┘
```
Rules
- Client shown as **first name + last initial** only. No phone/address (those are on the shipping label).
- Flowers in the consultant's order; drop counts with units always ("2 drops"); tabular numerals.
- Alcohol-free banner: black/white high-contrast (prints on mono printers), repeated on screen as a sticky banner on MG-06 and as a required checklist item "Alcohol-free base used ✓".
- Multiple remedies in one order → one sheet per bottle (page break), same header.
- QR code = deep link to the task (`/ops/orders/<id>/prepare`) for scanning on the phone.
- Footer: printed at <time> by <user> · page x/y. `prep_sheets.print_count` incremented (audited).
- Reprint after a blend update shows "SUPERSEDED — do not use" watermark on the old version.

## 2. Bottle label (default 50 × 30 mm, configurable; thermal or A4 sticker sheet 3 × 8)
```
BeWise · Holistic Wellness
Priya — 4 drops, 4 times a day       ← label text from prep sheet (max 2 lines, auto-shrink to 7 pt)
Bach flower blend · 30 ml   [AF]     ← AF only when alcohol-free
Prepared 21 Nov 2026 · Use within 3 months · FT-00042-1
```
"Use within" = setting `remedy.use_within_months` (default 3, `@decision`; Jitu Bhaiya to confirm). Remedy names are **not** printed on the label unless the consultant's label text includes them.

## 3. Production batch sheet (A4 portrait) — MG-20
Visible/printable only with permission `manufacturing.formula.view` 🔒. Watermark "CONFIDENTIAL — BeWise formula".

```
BeWise · Holistic Wellness                 BATCH SHEET  BW-B-2611-07
Product: Sleep Oil 30 ml (FG-OL-SL-030)    Formula: v3 (approved 02 Nov 2026)
Planned: 200 units · Batch size 6,000 ml   Requested by Haresh · 14 Nov
─────────────────────────────────────────────────────────────────────────
MATERIALS                 Lot        Required   Issued   Unit cost   Value
Lavender oil (RM-EO-001)  L-2410-3   60.000 ml  ____     ₹x.xx/ml   ₹…
Sweet almond oil          …          …
30 ml amber bottle (PK-…) —          200 pcs    ____
Label Sleep Oil 30 ml     —          200 pcs    ____
─────────────────────────────────────────────────────────────────────────
STEPS     ☐ 1 Weigh/measure  ☐ 2 Blend (mins __)  ☐ 3 Rest (hrs __)  ☐ 4 Fill  ☐ 5 Cap & label
QC        Appearance ☐  Colour ☐  Scent ☐  Fill volume (sample 5): __ __ __ __ __ ml  Leak test ☐
          Result: PASS / FAIL   Checked by ______   Date ______
OUTPUT    Good units ____   Rejected ____   Wastage ____ %   Mfg date ____   Expiry ____ (mfg + shelf life)
COST      Materials ₹____ + Packaging ₹____ + Labour/overhead ₹____ = ₹____  → ₹____ per unit
Sign-off  Produced by ______   Received into stock by ______
```
- Required quantities = formula version × batch size; "Issued" and QC fields are filled on screen (MG-20 stepper) and the printed sheet is the paper twin for the work table.
- Batch number `BW-B-YYMM-NN` (contracts §1), lot for each consumed material picked FEFO (stock spec §4).
- Expiry = mfg date + `stock_items.shelf_life_days` of the finished good (editable, audited).
- After **Received**, the reprint shows actuals and cost per unit; `batch.received` posts output (stock spec §3).

## 4. Other printables (later milestones)
Pick list (A5, part of MG-08) · goods receipt note (MG-22) · day-end manifest (Shiprocket) · stock-take count sheet. Same header and footer system.

## 5. Implementation notes
- `src/modules/fulfilment/pdf/prep-sheet.tsx`, `label.tsx`; `src/modules/manufacturing/pdf/batch-sheet.tsx`; fonts Plus Jakarta Sans (embedded), tabular numerals.
- Route handlers `/ops/print/prep/[taskId]`, `/ops/print/batch/[batchId]` return PDF with `Cache-Control: no-store`; permission checked; audit `print`.
- Screen versions use v4 tokens (white cards on the gradient, navy text); PDFs are monochrome-safe.
