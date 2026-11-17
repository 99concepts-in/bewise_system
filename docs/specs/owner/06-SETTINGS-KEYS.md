# 06 — Settings keys (draft)

> **Owner:** OWNER chat · module `settings` · `getSetting<K>(key)` (contracts §5). Base `settings` table by HUB:
> `key text primary key, value jsonb, version int, updated_at, updated_by`. Every key has a **zod schema** in
> `src/modules/settings/schema.ts`. Reads are cached per request. Writes are owner-only, validated, audited (old → new) and bump
> `version`. **Secrets are never stored here** (env vars only).

| Key | Shape (defaults) | Edited on | Read by |
|---|---|---|---|
| `business.profile` | `{ legalName, tradeName: 'BeWise Wellness', address{line1,line2,city:'Vadodara',state:'Gujarat',stateCode:'24',pincode}, phone, email, website, logoFileId?, signatureFileId? }` | OW-23 | invoices, emails, public footer |
| `tax.registration` | `{ registered: boolean (null until set), gstin?, legalNameOnGst?, scheme: 'regular' \| 'composition', effectiveFrom? }` — GSTIN validated (15 chars, state code 24, checksum) | OW-23 | finance |
| `tax.pricing` | `{ pricesIncludeGst: true }` | OW-23 | finance, commerce display |
| `tax.defaults` | `{ consultationTaxCode: 'SVC_CONSULT', remedyTaxCode: 'GOODS_REMEDY', shippingFollowsMainSupply: true }` — rates live in `tax_rates` | OW-23 (owner + accountant review) | finance |
| `numbering.series` | `{ invoice:{prefix:'INV',pad:4}, billOfSupply:{prefix:'BOS',pad:4}, receipt:{prefix:'RC',pad:4}, creditNote:{prefix:'CN',pad:4}, expense:{prefix:'EXP',pad:4}, paymentVoucher:{prefix:'PV',pad:4}, journal:{prefix:'JV',pad:5}, roundOffToRupee:false }` — changes take effect next FY only | OW-23 | finance |
| *(consultation fees & durations)* | **Not a settings key.** Source of truth = `scheduling.consultation_types`. OW-23 edits through `scheduling.upsertConsultationType()`: First consultation **₹1,000 / 60 min**, Follow-up **₹800 / 30 min**, `includesRemedy: true` (D-02, D-09; durations to confirm) | OW-23 | scheduling, client booking |
| `policy.reschedule` | `{ refunds: 'none' (fixed, D-16), freeRescheduleHoursBefore: 24, lateReschedulesAllowed: 1, noShow: 'forfeit', policyText }` (D-08 window to confirm) | OW-23 | scheduling, client CL-16 |
| `remedy.pricing` | `{ includedInConsultation: true (D-02), reorderPricePaise: null ⇒ reorder hidden until set, bottleSizeMl: 30 }` | OW-23 | remedies, commerce |
| `shipping.rates` | `{ flatPaise: null, freeAbovePaise: null, cod: false, pickupAddressRef? }` (owner to set; Shiprocket rates shown by manager) | OW-23 | commerce, fulfilment |
| `payments.razorpay` | `{ mode: 'test' \| 'live' }` — keys in env; must match the key prefix | OW-24 | finance |
| `reminders.schedule` | `{ appointment:{hoursBefore:[24,1]}, invoice:{daysOffsets:[-2,0,3,7], repeatEveryDays:7, stopAfterDays:30}, feedbackAfterHours:2, reorderNudgeDaysLeft:5, supplierBill:{daysOffsets:[-3,0]} }` | OW-23 | notifications |
| `notifications.quiet_hours` | `{ start:'21:00', end:'08:00', tz:'Asia/Kolkata', exceptions:['appointment_1h','otp'] }` | OW-23 | notifications |
| `notifications.channels` | `{ whatsapp:false, email:false, push:true, inApp:true }` — flipped on only after a successful provider test (OW-24) | OW-24 | notifications |
| `notifications.daily_summary` | `{ enabled:true, time:'20:00' }` | OW-03 | notifications |
| `accounting.policy` | `{ fyStartMonth:4, inventorySystem:'perpetual', valuation:'weighted_average', deferConsultationRevenue:true, ownerPaidExpenseAccount:'capital', coaStatus:'draft_pending_accountant' \| 'validated' }` | OW-23 (accountant section) | finance, reports badge |
| `approvals.policy` | `{ expensesNeedApproval:'all', supplierBillsNeedApproval:'all', stockWriteOffAbovePaise:0, priceChangesNeedApproval:true }` | OW-23 | finance, inventory, catalog |
| `analytics.sharing` | `{ consultantSeesSales:true, consultantSeesProfit:true, managerSeesSales:true, managerSeesProfit:true }` (D-33) | OW-17 | analytics API |
| `owner.profile` | `{ greetingName: null }` ⇒ "Good morning" (D-42) | OW-23 | owner home |
| `integrations.status` | system-written: `{ razorpay, shiprocket, whatsapp, googleCalendar, email: { state:'not_set_up' \| 'test' \| 'connected' \| 'error', lastCheckedAt, lastError? } }` | read-only on OW-24 | owner |

**Typed accessor:** `getSetting('remedy.pricing')` returns the parsed value or the schema default, never `undefined`. A missing required business value (e.g. GSTIN while `registered = true`) blocks invoice issue with a clear error rather than printing an incomplete invoice.

**Change safety:** fee and tax changes apply to **new** bookings and invoices only. Existing holds, orders and invoices keep the price and tax code they were created with (copied onto the row).
