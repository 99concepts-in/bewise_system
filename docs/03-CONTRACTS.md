# BeWise Wellness — Shared Contracts

> **Owner:** HUB. This is the agreement that lets four chats build at the same time without breaking each other.
> **Rule:** you may *use* anything here. You may only *change* what your chat owns, and any change to a
> contract (signature, enum value, event payload, table column used by others) needs a request file
> + a log entry, per `docs/04-COORDINATION-PROTOCOL.md`. Additive changes (new optional field, new enum
> value at the end, new event) are allowed by the owner with a log entry; breaking changes need HUB approval.
>
> Contract version: **v1** (2026-11-16)

---

## 1. Conventions (all modules)

| Topic | Rule |
|---|---|
| Primary keys | `id uuid default gen_random_uuid()` |
| Human codes | Separate `code text unique` from a sequence: Client `BW-C-00001`, Appointment `BW-A-00001`, Sales order `BW-00001`, Invoice `INV/2026-27/0001` (FY-based), Receipt `RC/2026-27/0001`, Credit note `CN/2026-27/0001`, Batch `BW-B-YYMM-NN`, PO `PO/2026-27/0001`, Expense `EXP/2026-27/0001` |
| Money | `bigint` paise, column suffix `_paise`. TS type `Paise = number` (branded). Format with `formatINR()` |
| Quantities | `numeric(14,3)` + `unit text` (`ml`, `g`, `pcs`) |
| Time | `timestamptz`; dates-only as `date`. Display `Asia/Kolkata`. FY Apr–Mar |
| Audit columns | every table: `created_at, created_by, updated_at, updated_by` |
| Deletes | Soft delete (`archived_at`) for master data. **Never delete** financial, consultation or stock movement rows |
| Status changes | Only via the owning module's functions (they validate transitions, write audit, emit events) |
| Migrations | `supabase/migrations/<YYYYMMDDHHMMSS>_<module>_<desc>.sql`, header comment with `-- @owner <CHAT>` |
| Module public API | Import only from `src/modules/<m>/index.ts` and `src/modules/<m>/types.ts`. Never deep-import another module's internals |
| Errors | Functions return `Result<T> = { ok: true, data: T } \| { ok: false, error: { code: string, message: string } }` for expected failures; throw only for bugs |
| Authorisation | Every exported server function starts with `await requirePermission('<perm>')` (from `lib/auth`) |

## 2. Module ownership & tables

| Module | Owner | Tables (owner writes schema & rows; others read via API/views) |
|---|---|---|
| identity | HUB → OWNER | `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `staff_members` |
| crm | MANAGER (base by HUB) | `clients`, `client_addresses`, `consent_records`, `client_contacts`, `leads`, `communication_log` |
| scheduling | CONSULTANT | `consultation_types`¹, `availability_rules`, `availability_exceptions`, `appointments` (+ `client_note`), `appointment_history`, `session_feedback`, `calendar_connections` (provider google/apple, encrypted tokens), `external_busy_blocks` (start/end only), `calendar_feed_tokens` |
| questionnaires | CONSULTANT | `questionnaire_templates`, `questionnaire_versions`, `questionnaire_assignments`, `questionnaire_responses` |
| consultation | CONSULTANT | `consultation_records`, `practitioner_notes` 🔒, `client_summaries`, `follow_ups` |
| remedies | CONSULTANT | `bach_remedies` (configurable, hideable), `formula_templates`, `formulas`, `formula_versions`, `formula_items`, `remedy_orders` |
| intake | CONSULTANT (data, AI, mapping) · CLIENT (IN-xx UI) | `intake_templates` (versioned), `intake_responses` 🔒 (encrypted), `intake_checkins`, `intake_flags` (safety, alcohol_free, pregnancy, allergy, medication, minor), `intake_mapping` (statement→flower, editable by consultant), `case_summaries` (AI, consultant-only) |
| progress | CONSULTANT | `concern_catalog` (editable troubling emotions), `session_concerns`, `progress_summaries` (audience client/consultant) |
| companion | CLIENT | `companion_conversations`, `companion_messages`, `companion_actions` (Ask BeWise chatbot, CL-55) |
| journal | CLIENT | `journal_entries` (emotion + logged_at only), `client_goals` (separate from journal) |
| commerce | CLIENT | `carts`, `cart_items`, `wishlists`, `sales_orders`, `order_items`, `return_requests` |
| catalog | MANAGER | `collections`, `products`, `product_variants`, `product_images` |
| fulfilment | MANAGER | `fulfilment_tasks`, `prep_sheets`, `qc_checks`, `shipments` (+ shiprocket_order_id, awb, courier, label_url), `shipment_events`, `replacement_orders` — **Shiprocket** integration (rates, create shipment, label, pickup, tracking webhook `/api/webhooks/courier`) |
| inventory | MANAGER | `stock_items` (raw/packaging/finished), `stock_locations`, `stock_movements`, `reorder_rules`, `stock_takes` |
| manufacturing | MANAGER | `product_formulas` 🔒, `product_formula_versions`, `production_orders`, `batches`, `material_usage`, `batch_qc` |
| procurement | MANAGER | `suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipts` |
| finance | OWNER | `invoices`, `invoice_lines`, `payments`, `payment_allocations`, `receipts`, `refunds`, `credit_notes`, `expenses`, `supplier_bills`, `recurring_items`, `accounts` (chart), `journal_entries_fin`, `journal_lines`, `bank_accounts`, `bank_statement_lines`, `reconciliations`, `tax_rates`, `fiscal_periods`, `reminder_schedules`, `reminder_log` |
| notifications | OWNER | `notification_templates`, `notification_events`, `notification_deliveries`, `notification_preferences` (+ `notifications_inbox` by HUB) |
| settings | OWNER | `settings` (key/value JSON, typed accessors) — base table by HUB |
| people | OWNER | `employees`, `salary_structures`, `salary_advances`, `reimbursements`, `payslips` |
| personal_finance | OWNER | schema `personal.*` — owner-only RLS |
| analytics | OWNER | SQL views `analytics.*` (read-only) |
| audit | HUB → OWNER | `audit_logs` |
| events | HUB | `domain_events` (outbox), `event_handler_runs` |

¹ `consultation_types` (name, duration, fee, mode allowed) is **edited in Owner settings (O-09)** but the table and slot logic belong to scheduling. OWNER calls `scheduling.upsertConsultationType()`.

## 3. Shared enums (Postgres enums + `src/lib/enums.ts`)

```ts
export type AppRole = 'client' | 'consultant' | 'manager' | 'owner'
  // future: 'prep_staff' | 'manufacturing_staff' | 'accounts' | 'support' | 'inventory'

export type AppointmentStatus =
  'pending_payment' | 'confirmed' | 'checked_in' | 'in_session' | 'completed'
  | 'cancelled' | 'no_show' | 'expired'          // expired = hold timed out unpaid
export type AppointmentMode = 'online' | 'in_person'

export type QuestionnaireAssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'reviewed'

export type FormulaStatus = 'draft' | 'given' | 'superseded'   // owner 2026-11-16: no approval step; 'given' = sent to client + office

export type SalesOrderKind = 'store' | 'remedy' | 'combined'
export type SalesOrderStatus =
  'draft' | 'pending_payment' | 'paid' | 'processing' | 'partially_dispatched'
  | 'dispatched' | 'delivered' | 'cancelled' | 'return_requested' | 'returned' | 'refunded'
export type OrderItemKind = 'product' | 'remedy' | 'service'

export type FulfilmentTaskType = 'remedy_prep' | 'pick_pack'
export type FulfilmentStage =
  'new' | 'preparing' | 'quality_check' | 'packing' | 'ready_to_dispatch'
  | 'dispatched' | 'delivered' | 'failed_delivery' | 'rto' | 'cancelled'

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'disputed' | 'void' | 'credited'
  // 'overdue' is DERIVED (issued/partially_paid && due_date < today), never stored
export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded'
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash' | 'bank_transfer' | 'cheque' | 'razorpay_link'

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type BatchStage =
  'requested' | 'materials_allocated' | 'in_production' | 'quality_check'
  | 'bottling_labelling' | 'received' | 'rejected'
export type StockItemKind = 'raw_material' | 'packaging' | 'finished_good'
export type StockMovementType =
  'purchase_receipt' | 'production_consume' | 'production_output' | 'sale'
  | 'remedy_prep_consume' | 'adjustment' | 'return' | 'wastage' | 'transfer'

export type NotificationChannel = 'in_app' | 'email' | 'whatsapp' | 'sms' | 'push'

export type Emotion = 'calm' | 'joyful' | 'grateful' | 'hopeful' | 'tired' | 'anxious' | 'sad' | 'irritated'  // journal; owl faces in design/assets
```

`StatusBadge` maps every enum value to label + icon + tone in `src/components/ui/status-map.ts` (HUB). Adding an enum value = add its badge mapping in the same PR.

## 4. Domain events (outbox)

Emit with `emitEvent(type, payload, { tx })` inside the same DB transaction as the change. Handlers are idempotent (keyed by `event.id`). Processor: cron route `/api/cron/events` every minute + immediate kick after commit.

| Event | Emitted by | Payload (ids are uuid) | Consumed by |
|---|---|---|---|
| `client.created` | crm | `clientId, profileId?` | notifications (welcome) |
| `appointment.held` | scheduling | `appointmentId, clientId, holdExpiresAt` | — |
| `appointment.confirmed` | scheduling | `appointmentId, clientId, consultantId, startsAt, mode` | notifications, analytics |
| `session_feedback.submitted` | scheduling | `feedbackId, appointmentId, clientId, consultantId, rating` | consultant Today (K-01), notifications (consultant), analytics (rating only) |
| `appointment.rescheduled` | scheduling | `appointmentId, fromStartsAt, toStartsAt, by` | notifications |
| `appointment.cancelled` | scheduling | `appointmentId, by, reason, refundEligiblePaise` | finance (refund request), notifications |
| `appointment.completed` | scheduling/consultation | `appointmentId, consultationRecordId` | consultation (follow-up), analytics |
| `appointment.no_show` | scheduling | `appointmentId` | notifications |
| `questionnaire.assigned` | questionnaires | `assignmentId, clientId, appointmentId?` | notifications |
| `questionnaire.submitted` | questionnaires | `assignmentId, clientId` | consultant Today (K-01), notifications |
| `remedy.given` | remedies | `formulaVersionId, remedyOrderId, clientId, bottleSizeMl` (no approval step) | commerce (create remedy sales order), notifications |
| `client_summary.shared` | consultation | `summaryId, clientId` | notifications |
| `followup.due` | consultation (cron) | `followUpId, clientId, consultantId, dueOn` | notifications |
| `order.placed` | commerce | `salesOrderId, clientId, kind, totalPaise` | — |
| `order.paid` | commerce | `salesOrderId, clientId, kind, items[]` | fulfilment (create tasks), inventory (reserve), notifications, analytics |
| `order.cancelled` | commerce | `salesOrderId, reason` | fulfilment, inventory (release), finance |
| `fulfilment.stage_changed` | fulfilment | `taskId, salesOrderId, from, to` | commerce (order status), notifications |
| `shipment.dispatched` | fulfilment | `shipmentId, salesOrderId, courier, awb, trackingUrl` | commerce, notifications |
| `shipment.delivered` | fulfilment | `shipmentId, salesOrderId, deliveredAt` | commerce, notifications, consultation (start follow-up clock for remedy orders) |
| `shipment.failed` | fulfilment | `shipmentId, reason` | notifications, manager alerts |
| `invoice.issued` | finance | `invoiceId, partyType, partyId, totalPaise, dueDate` | notifications, reminder engine |
| `payment.captured` | finance | `paymentId, amountPaise, invoiceId?, salesOrderId?, appointmentId?, method` | **scheduling** (confirm), **commerce** (mark paid), notifications |
| `payment.failed` | finance | `paymentId, reason, salesOrderId?, appointmentId?` | commerce, scheduling, notifications |
| `payment.refunded` | finance | `refundId, paymentId, amountPaise` | commerce, notifications |
| `expense.submitted` | finance | `expenseId, amountPaise` | notifications (owner approval) |
| `expense.approved` / `expense.rejected` | finance | `expenseId, by, comment?` | notifications |
| `journal.posted` | finance | `journalEntryId, sourceType, sourceId` | analytics |
| `stock.low` | inventory (cron + on movement) | `stockItemId, onHand, reorderLevel` | notifications, owner alerts |
| `stock.expiring` | inventory (cron) | `stockItemId, batchId, expiresOn` | notifications |
| `batch.received` | manufacturing | `batchId, productVariantId, qty` | inventory, analytics |
| `reminder.sent` | finance/notifications | `reminderLogId, channel, invoiceId` | — |

**Accounting postings are driven by events**, not by other modules calling the ledger directly. Posting rules (OWNER) map: `invoice.issued` → Dr Receivable / Cr Income + GST; `payment.captured` → Dr Bank/Razorpay clearing / Cr Receivable; `payment.refunded`; `expense.approved`; supplier bill; stock valuation entries (method per accountant, D-13).

## 5. Cross-module server functions (the APIs others call)

HUB creates typed stubs for all of these in Phase 0. The **owner chat replaces the stub** with the real implementation. Consumers code against the signature immediately.

### scheduling (CONSULTANT)
```ts
listConsultationTypes(opts?: { activeOnly?: boolean }): Promise<ConsultationType[]>
upsertConsultationType(input: ConsultationTypeInput): Promise<Result<ConsultationType>>        // called by OWNER settings
getAvailableSlots(q: { consultationTypeId: string; mode: AppointmentMode; from: string; to: string; consultantId?: string }): Promise<Slot[]>
holdAppointment(input: { clientId: string; consultationTypeId: string; mode: AppointmentMode; startsAt: string; consultantId?: string; clientNote?: string })  // clientNote = optional CL-15 text, consultant-only: Promise<Result<{ appointmentId: string; holdExpiresAt: string; amountPaise: Paise }>>
rescheduleAppointment(input: { appointmentId: string; startsAt: string; reason?: string }): Promise<Result<Appointment>>
cancelAppointment(input: { appointmentId: string; reason: string }): Promise<Result<{ refundEligiblePaise: Paise }>>
listAppointments(q: AppointmentQuery): Promise<Paged<AppointmentSummary>>                       // RLS scopes by role
getAppointment(id: string): Promise<Appointment | null>
checkInAppointment(id: string): Promise<Result<Appointment>>                                     // MANAGER desk
connectCalendar(input: { provider: 'google' | 'apple'; authCode?: string; appleId?: string; appPassword?: string }): Promise<Result<CalendarConnection>>  // CN-28
syncCalendar(connectionId: string): Promise<Result<{ pushed: number; busyBlocks: number }>>  // cron every 10 min + on change; getAvailableSlots() subtracts external_busy_blocks
getCalendarFeedUrl(): Promise<string>   // private ICS subscribe link (revocable)
submitSessionFeedback(input: { appointmentId: string; rating: 1|2|3|4|5; tags: string[]; notesForConsultant?: string }): Promise<Result<SessionFeedback>>  // CLIENT CL-23, editable later by the client
listSessionFeedback(q: { clientId?: string; consultantId?: string }): Promise<SessionFeedback[]>  // CONSULTANT K-04/K-05; owner sees rating only
```
### questionnaires (CONSULTANT) — OPTIONAL / P3 (owner decision 2026-11-16: no questionnaire in the client flow)
```ts
getAssignmentForClient(assignmentId: string): Promise<ClientQuestionnaire | null>   // CLIENT renders
saveResponseDraft(input: { assignmentId: string; answers: Answer[] }): Promise<Result<void>>
submitResponses(input: { assignmentId: string; answers: Answer[] }): Promise<Result<void>>
listAssignmentsForClient(clientId: string): Promise<AssignmentSummary[]>
```
### consultation & remedies (CONSULTANT)
```ts
listClientSummaries(clientId: string): Promise<ClientSummary[]>        // approved, client-safe only
getCurrentRemedyForClient(clientId: string): Promise<ClientRemedyView | null>  // names, instructions, duration — NO rationale
getPrepSheet(remedyOrderId: string): Promise<PrepSheet>                // MANAGER: remedies + drops + bottle + label text only
listFollowUps(q: FollowUpQuery): Promise<Paged<FollowUp>>
```
### intake (CONSULTANT owns data/AI; CLIENT builds IN-01…IN-12) — spec `docs/specs/client/01-INTAKE-CASE-TAKING.md`
```ts
getIntakeForm(input: { clientId: string; kind: 'first' | 'followup'; forDependentId?: string }): Promise<IntakeForm>   // pre-filled from last answers
saveIntakeDraft(input: { intakeId: string; answers: IntakeAnswers }): Promise<Result<void>>
submitIntake(input: { intakeId: string; answers: IntakeAnswers; consent: { shareWithConsultant: true; aiSummary: boolean } }): Promise<Result<{ intakeId: string; flags: IntakeFlag[] }>>
attachIntakeToAppointment(input: { intakeId: string; appointmentId: string }): Promise<Result<void>>   // called by booking after hold
getCaseSummary(appointmentId: string): Promise<CaseSummary | null>      // CONSULTANT only: { summary[4], flags[], questionsToExplore[3], progressNote?[3] }
getFlowersToConsider(appointmentId: string): Promise<{ flowerId: string; reasons: string[]; intensity: 'mild'|'moderate'|'strong' }[]>  // deterministic from intake_mapping
getIntakeFlagsForPrep(remedyOrderId: string): Promise<{ alcoholFree: boolean }>   // MANAGER prep sheet
```
Events: `intake.submitted` (intakeId, clientId, appointmentId?), `intake.safety_flagged` (clientId, level 'sometimes'|'often') → notifications (consultant priority + owner safety contact if 'often'), `intake.checkin_submitted`.

### progress (CONSULTANT)
```ts
listConcernCatalog(): Promise<Concern[]>                                    // editable list: anger, insecurity, loneliness, ...
setSessionConcerns(input: { appointmentId: string; concernKeys: string[] }): Promise<Result<void>>
getProgressSummary(input: { clientId: string; audience: 'client' | 'consultant' }): Promise<ProgressSummary | null>
  // { lines: [string, string, string], since: string, generatedAt: string } — AI-generated, cached; client audience never uses private notes
```
Event: `progress_summary.refreshed` (clientId, audience).

### companion (CLIENT) — Ask BeWise
```ts
sendCompanionMessage(input: { conversationId?: string; text: string }): Promise<Result<{ conversationId: string; reply: CompanionReply }>>
  // CompanionReply = { text; quickReplies?: string[]; productSuggestions?: ProductCard[]; actions?: ProposedAction[] }
confirmCompanionAction(actionId: string): Promise<Result<void>>  // e.g. add_to_bag, set_ritual_reminder — only after the client taps
```
Tools the model may call (read-only unless confirmed): my appointments, my current blend & ritual, my journal (emotions), my orders & payments, catalog search, progress summary. Uses the Claude API server-side; load the `claude-api` skill before implementing.

### commerce (CLIENT)
```ts
getCart(): Promise<Cart>
addToCart(input: { variantId?: string; remedyOrderId?: string; qty: number }): Promise<Result<Cart>>
createOrderFromCart(input: { addressId: string; notes?: string }): Promise<Result<{ salesOrderId: string; totalPaise: Paise }>>
createRemedySalesOrder(input: { remedyOrderId: string; clientId: string; pricePaise: Paise }): Promise<Result<{ salesOrderId: string }>>  // handler of remedy.given
getOrder(id: string): Promise<SalesOrder | null>
listOrders(q: OrderQuery): Promise<Paged<SalesOrderSummary>>
setOrderStatusFromFulfilment(input: { salesOrderId: string; status: SalesOrderStatus }): Promise<Result<void>>  // internal: called by commerce's own event handler
requestReplacement(input: { salesOrderId: string; itemIds: string[]; reason: string; photoIds: string[] }): Promise<Result<void>>  // no refunds (D-16)
```
### catalog (MANAGER)
```ts
listCollections(): Promise<Collection[]>
listProducts(q: ProductQuery): Promise<Paged<ProductCard>>       // public-safe fields only
getProductBySlug(slug: string): Promise<ProductDetail | null>
getVariant(id: string): Promise<VariantWithPrice | null>
getAvailability(variantIds: string[]): Promise<Record<string, { inStock: boolean; qty?: number }>>  // from inventory
```
### crm (MANAGER, base by HUB)
```ts
ensureClientForProfile(profileId: string): Promise<Client>        // HUB implements in Phase 0
getClient(id: string): Promise<Client | null>                       // field set filtered by role
updateClientProfile(input: ClientProfileInput): Promise<Result<Client>>
listAddresses(clientId: string): Promise<Address[]>
upsertAddress(input: AddressInput): Promise<Result<Address>>
recordConsent(input: { clientId: string; type: ConsentType; granted: boolean; source: string }): Promise<Result<void>>
searchClients(q: ClientSearch): Promise<Paged<ClientSummary>>
```
### fulfilment & inventory (MANAGER)
```ts
listTasks(q: TaskQuery): Promise<Paged<FulfilmentTaskCard>>
getOrderTracking(salesOrderId: string): Promise<TrackingView>       // CLIENT C-10
getStockOnHand(stockItemIds: string[]): Promise<Record<string, number>>
```
### finance (OWNER)
```ts
createCheckout(input: { purpose: 'appointment' | 'sales_order' | 'invoice'; refId: string }): Promise<Result<{ razorpayOrderId: string; keyId: string; amountPaise: Paise; prefill: { name: string; email?: string; contact: string } }>>
verifyCheckout(input: { razorpayOrderId: string; razorpayPaymentId: string; signature: string }): Promise<Result<{ paymentId: string }>>  // client-side callback; webhook is the source of truth
createInvoice(input: InvoiceInput): Promise<Result<Invoice>>                       // MANAGER manual invoices
recordPayment(input: { invoiceId?: string; partyType: PartyType; partyId: string; amountPaise: Paise; method: PaymentMethod; accountId: string; reference?: string; receivedOn: string }): Promise<Result<Payment>>
createPaymentLink(invoiceId: string): Promise<Result<{ url: string }>>
// requestRefund — REMOVED: owner policy 2026-11-16 = no refunds (D-16). Credit notes remain owner-only for accounting corrections.
listInvoices(q: InvoiceQuery): Promise<Paged<InvoiceSummary>>
getFollowUpBuckets(q: { partyType: PartyType }): Promise<FollowUpBuckets>          // MANAGER M-14
sendReminder(input: { invoiceId: string; channels: NotificationChannel[] }): Promise<Result<void>>
createExpense(input: ExpenseInput): Promise<Result<Expense>>                        // MANAGER M-15
submitExpense(id: string): Promise<Result<void>>
createSupplierBill(input: SupplierBillInput): Promise<Result<SupplierBill>>         // MANAGER M-10
getDocumentPdf(input: { type: 'invoice' | 'receipt' | 'credit_note'; id: string }): Promise<string>  // signed URL
```
### notifications (OWNER)
```ts
notify(input: { to: { profileId?: string; clientId?: string; phone?: string; email?: string }; template: TemplateKey; data: Record<string, unknown>; channels?: NotificationChannel[]; dedupeKey?: string }): Promise<Result<void>>
// Modules should prefer emitting events; notifications subscribes. Call notify() directly only for user-triggered messages.
```
### settings (OWNER)
```ts
getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>>     // typed keys: business.profile, tax.gstin, policy.cancellation, remedy.pricing, reminders.schedule, shipping.rates ...
```

## 6. Permissions

Format `module.resource.action`, actions: `view · create · edit · approve · export · delete`.
Checked by `requirePermission()` server-side and mirrored in RLS via `has_permission(auth.uid(), '<perm>')`.

| Capability | Client | Consultant | Manager | Owner |
|---|---|---|---|---|
| Own profile, appointments, orders, invoices, remedies (client view), journal | ✅ own | — | — | — |
| Book / reschedule / cancel appointment | ✅ own | ✅ assigned | ✅ any | ✅ |
| Availability & calendar | — | ✅ own | view | ✅ |
| Client profile (contact) | own | ✅ assigned | ✅ | ✅ |
| Questionnaire responses | own | ✅ assigned | ❌ | ✅ (D-03) |
| **Practitioner private notes / formula rationale** | ❌ | ✅ author | ❌ | ❌ by default (D-03) |
| Client summaries (shareable) | own approved | ✅ | ❌ | view |
| Give remedy (sends to client + office) | — | ✅ | — | — |
| Troubling emotions per session | — | ✅ | ❌ | aggregate only |
| Progress summary | own (client version) | ✅ (consultant version) | ❌ | ❌ |
| Ask BeWise conversations | own | ❌ | ❌ | aggregate/safety review only |
| Prep sheet (remedy names, drops, bottle) | — | ✅ | ✅ | ✅ |
| Client journal (emotions) | own | ✅ if client shares (default on, toggle in CL-50) | ❌ | ❌ |
| Session feedback & notes for consultant | own (write/edit) | ✅ for own appointments | ❌ | rating only |
| Booking note (CL-15) | own | ✅ | ❌ | ❌ |
| Intake answers & AI case summary | own answers (no AI text) | ✅ | ❌ (only `alcoholFree` via prep sheet) | ❌ (aggregate stats only) |
| Safety flag | — | ✅ priority | ❌ | safety contact only (if 'often') |
| Catalogue edit | — | — | ✅ | ✅ |
| Aroma product formulas 🔒 | — | — | ✅ (manufacturing perm) | ✅ |
| Fulfilment, shipments, inventory, manufacturing, procurement | — | — | ✅ | ✅ |
| Invoices create / record payment / reminders | pay own | — | ✅ | ✅ |
| Refunds | ❌ none (policy) | ❌ | ❌ | ❌ (credit note for corrections only) |
| Replacement order (damaged/wrong/RTO) | request | — | ✅ | ✅ |
| Expense/bill approval | — | — | submit | ✅ approve |
| Business sales overview (read-only) | — | ✅ (CN-30…32) | ✅ | ✅ |
| Accounting, journals, period close, reports (financial) | — | — | ❌ (ops reports only) | ✅ |
| People & payroll | — | own payslip (future) | ❌ | ✅ |
| Personal finance | — | — | ❌ | ✅ only |
| Settings, users & roles, audit log, AI assistant | — | — | ❌ | ✅ |

## 7. Data visibility rules (must be tested — PRD §20)

1. `practitioner_notes`, `formula_items.rationale` → only the authoring consultant (and explicit break-glass permission, audited).
2. Manager/prep staff reach remedy content **only** through `getPrepSheet()` (view `v_prep_sheet`) — no notes, no questionnaire.
3. Clients read only rows where `client_id = current_client_id()` and only `approved/shared` summaries.
4. `personal.*` schema → owner profile only; no FK from business tables into personal.
5. Product formulas (`product_formulas*`) → manufacturing permission only.
6. Service worker never caches `/app`, `/consult`, `/ops`, `/owner` API responses.
7. Every read of sensitive tables by staff writes an `audit_logs` row (`action='view_sensitive'`).

## 8. Feature flags (`src/lib/flags.ts`, HUB)

Use when your UI depends on a contract that isn't live yet. Flags default **off in production**, on in preview/dev.

`booking`, `store`, `checkout`, `remedy_orders`, `questionnaires`, `journal`, `manufacturing`, `procurement`, `follow_up_centre`, `whatsapp`, `courier_api`, `payroll`, `personal_finance`, `ai_assistant`.

## 9. Seed data (Phase 0, extended by each owner)

Roles & permissions · users: `owner@demo`, `consultant@demo` (Jitu), `manager@demo` (Haresh), 5 demo clients · consultation types: First consultation 60 min, Follow-up 30 min (fees placeholders until D-09) · products: Sleep Oil, Abundance Oil, Abundance Spray, Aura Spray, Bath Salt, Aura Salt (sizes/prices placeholders) · 38 Bach remedy **names and groups only** (descriptions pending D-10) · chart of accounts draft (pending accountant, D-13).
