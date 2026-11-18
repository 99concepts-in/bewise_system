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
| `policy.reschedule` | `{ refunds: 'none' (fixed, D-16), freeHoursBefore: 24, maxFreeReschedules: 3, lateReschedulesAllowed: 1, noShow: 'forfeit', policyText }` (D-08 window to confirm). Also answers the CLIENT request for `policy.cancellation` (same key; there are no cancellations with refunds) | OW-23 | scheduling, client CL-16 |
| `remedy.reorder_price` | `Paise \| null`. **null ⇒ reorders are hidden and "Give remedy" for reorders is disabled** until the owner sets it | OW-23 | remedies, commerce, client |
| `remedy.pricing` | `{ includedInConsultation: true (D-02), bottleSizeMl: 30, useWithinMonths: 3 }` (the reorder price lives in its own key above) | OW-23 | remedies, commerce, manager prep |
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

## Keys requested by other chats (2026-11-17/18) — accepted
| Key | Shape (defaults) | Edited on | Read by |
|---|---|---|---|
| `consultant.weekly_goal` | `number` sessions per week, default **25** | CN settings (consultant edits own) / OW-23 | consultant Today & "Your impact" |
| `consultant.lifetime_reach` | `{ count: 200000, label: '2,00,000+' }` (from his website; owner confirms) | OW-23 | consultant "Your impact" |
| `booking.link_slug` | `'jitu-bhaiya'` → `https://{domain}/book/jitu-bhaiya` (domain pending D-12) | OW-23 | consultant share-link + QR, manager share-link |
| `booking.staff_hold_hours` | `24` (holds created by Jitu Bhaiya or Haresh; self-booking stays 15 min) | OW-23 | scheduling, notifications (08) |
| `safety.helplines` | `[{ name: 'Tele-MANAS', number: '14416' }, { name: 'Emergency', number: '112' }]`, `verifiedOn` date — must be re-verified before launch | OW-23 (read-only for staff) | client intake IN-09 |
| `privacy.intake_retention_months` | `null` ⇒ keep while the client is active (owner + lawyer to decide) | OW-23 | intake |
| `fulfilment.sla` | `{ remedyHours: 24, storeHours: 48, workingHours: { days: 'Mon–Sat', from: '10:00', to: '19:00' } }` | OW-23 | manager |
| `shipping.pickup_location` | Shiprocket pickup nickname (string) | OW-24 | manager |
| `shipping.boxes` | `[{ code, l, b, h, maxWeightG }]` | OW-23 | manager |
| `shipping.remedy_declared_value_paise` | default ₹300 | OW-23 | manager (Shiprocket) |
| `shipping.wallet_min_paise` | default ₹1,000 → "To pay" nudge when below | OW-23 | manager |
| `inventory.writeoff_approval_paise` | default ₹2,000 (write-offs above this need owner approval) | OW-23 | manager, approvals |
| `catalog.price_change_approval` | default `false` | OW-23 | manager, approvals |
| `notifications.whatsapp_templates` | system-written status per template: `draft / submitted / approved / rejected` | OW-24 | notifications |

All of these use the same rules as above: zod schema, owner-only writes (except `consultant.weekly_goal`, which Jitu Bhaiya can also edit), audited, never secrets.
