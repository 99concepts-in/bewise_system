# M2 · Fulfilment stage machine (paid order → delivered)

> **Owner:** MANAGER · Module `fulfilment` · Screens MG-02, MG-04…MG-10 · Contract `docs/03-CONTRACTS.md` §3 (`FulfilmentStage`, `FulfilmentTaskType`), §4 events.
> Status: **SPEC v1 (2026-11-17)**, written while the foundation is not ready. Decisions: D-02, D-06, D-09, D-16.

## 1. Principles
1. **One job per paid order.** Haresh sees one row per order on MG-04 with one stage pill. Internally a job = one `fulfilment_tasks` row (+ optional split parcels, §6).
2. **One big button moves work forward.** Each stage has exactly one primary action; every other action is secondary (menu).
3. **No refunds anywhere (D-16).** Problems end in *reattempt* or *replacement order*, never money back.
4. **Most remedy orders are ₹0** (fee includes the remedy, D-02/D-09) — they still go through prep → QC → pack → dispatch exactly like paid orders.
5. **All blends are alcohol-free** (owner 2026-11-18): base is always glycerine; `getIntakeFlagsForPrep()` returns `{ alcoholFree: true }`.
6. Prep staff see **only** the prep sheet (`consultation.getPrepSheet`) + `intake.getIntakeFlagsForPrep` → `alcoholFree`. No notes, no reasons, no intake answers.
7. Every transition: validated server-side, written in the same DB transaction as an `audit_logs` row and the `fulfilment.stage_changed` outbox event.

## 2. Task type
| Order (`SalesOrderKind`) | `fulfilment_tasks.type` | Path |
|---|---|---|
| `remedy` | `remedy_prep` | new → preparing → quality_check → packing → ready_to_dispatch → dispatched → delivered |
| `combined` (remedy + store items, one parcel) | `remedy_prep` | same as remedy; pick list includes store items |
| `store` | `pick_pack` | new → packing → ready_to_dispatch → dispatched → delivered (skips preparing & QC) |

An order with several remedy items has several `prep_sheets` (one per `remedyOrderId`) under the same task. The task moves to `quality_check` only when **all** prep sheets are prepared, and to `packing` only when **all** have passed QC.

## 3. Stage machine

```
                       ┌──────── redo (note) ────────┐
                       ▼                             │
 new ──Start──▶ preparing ──Send to QC──▶ quality_check ──Pass──▶ packing ──Packed──▶ ready_to_dispatch
  │  (pick_pack: new ──Start packing──────────────────────────────▶ packing)               │
  │                                                                                         │ Create shipment / Mark dispatched
  │                                                                                         ▼
  │                                                       ┌──── Reattempt ──── failed_delivery
  │                                                       ▼                         ▲
  │                                                  dispatched ──── NDR ───────────┘
  │                                                       │  │
  │                                                       │  └── RTO initiated/delivered ──▶ rto ──(Send replacement)──▶ new replacement task
  │                                                       ▼
  │                                                  delivered  (terminal; damaged/wrong item → replacement)
  └── order.cancelled (any stage before dispatched) ──▶ cancelled (terminal)
```

### Transition table
| # | From | To | Trigger (button / event) | Guard | Side effects |
|---|---|---|---|---|---|
| T1 | — | `new` | `order.paid` handler | idempotent on `salesOrderId` | create task, prep sheets (remedy), reserve stock (inventory §M4), `due_at` |
| T2 | `new` | `preparing` | **Start preparing** (MG-06) | type = remedy_prep; prep sheet loaded | `started_by/at` |
| T3 | `preparing` | `quality_check` | **Send to quality check** | all prep checklists ticked | post `remedy_prep_consume` movements (flowers, base, bottle, label) |
| T4 | `quality_check` | `packing` | **Pass** (MG-07) | all prep sheets have a `qc_checks` row `result=pass`; checker ≠ preparer **if** a second staff member exists (setting, default off — one-person office) | — |
| T5 | `quality_check` | `preparing` | **Redo** (note required) | — | `qc_checks.result=redo`; failed bottle posted as `wastage` movement |
| T6 | `new` | `packing` | **Start packing** (MG-08) | type = pick_pack | — |
| T7 | `packing` | `ready_to_dispatch` | **Packed** | pick list fully ticked; parcel weight (g) entered; box preset chosen | — |
| T8 | `ready_to_dispatch` | `dispatched` | **Create shipment** (Shiprocket, MG-09) or **Mark dispatched** (manual AWB) or **Handed over** (studio pickup) | shipment has AWB (courier) or collector name (pickup) | `sale` movements (finished goods out), release reservations, `shipment.dispatched` |
| T9 | `dispatched` | `delivered` | Shiprocket webhook `DELIVERED` / **Mark delivered** (manual) | — | `shipment.delivered`; for studio pickup T8+T9 happen together |
| T10 | `dispatched` | `failed_delivery` | webhook NDR / **Report failed** | reason | `shipment.failed`, appears in MG-10 Problems + Today "Needs attention" |
| T11 | `failed_delivery` | `dispatched` | **Reattempt** (+ optional corrected phone/address) | Shiprocket NDR action accepted, or manual | event row |
| T12 | `dispatched` / `failed_delivery` | `rto` | webhook RTO_INITIATED / RTO_DELIVERED, or **Mark returned** | — | `shipment.failed` (reason `rto`); when parcel physically back: **Receive return** → `return` movement (resaleable) or `wastage` |
| T13 | `rto` or `delivered` | — (new task) | **Send replacement** (confirm + reason: rto / damaged / wrong_item / lost) | replacement via commerce (see §7) | `replacement_orders` row; new ₹0 sales order → new `order.paid` → T1 |
| T14 | any before `dispatched` | `cancelled` | `order.cancelled` handler | if a Shiprocket shipment exists and is not picked up → cancel it first; if picked up → cannot cancel (handler logs `needs_attention`) | release reservations; consumed prep stock stays consumed (posted as `wastage` with reason `order_cancelled`) |

Any other transition → `Result.error { code: 'INVALID_TRANSITION' }`. Transitions are **optimistic-locked** on `fulfilment_tasks.version` so two phones can't double-advance.

## 4. Delivery method
`deliveryMethod: 'courier' | 'studio_pickup' | 'hand_delivery'` — default `courier`; the client's address choice comes from commerce (request filed). Haresh can switch on MG-05 (reason, audited). In-person consultation clients often collect at the studio:
- `studio_pickup`: T8 = **Handed over** (collector name, optional photo) → immediately `delivered`.
- `hand_delivery`: T8 = **Out for delivery** (who), T9 = **Delivered** (manual).

## 5. Due times & "needs attention"
- `due_at = paid_at + fulfilment.sla_hours` (default **remedy 24 working hours, store 48**; working hours Mon–Sat 10:00–19:00 IST) — `@decision` until owner sets it (requested as setting `fulfilment.sla`).
- MG-02 Today tiles: *to prepare* = `new|preparing` remedy tasks · *to pack* = `quality_check(passed)|packing` + store `new` · *to dispatch* = `ready_to_dispatch` · *overdue ₹* from finance.
- Needs attention (sorted by urgency): overdue tasks (`now > due_at`), failed deliveries, RTOs awaiting decision, pickups scheduled today, stock short for a reservation, cancelled-after-pickup conflicts, Shiprocket sync errors.

## 6. Split parcels (partial dispatch)
If a store item is out of stock and the remedy is ready, Haresh may **Split parcel** (MG-05 ⋯ menu, reason). The current task keeps the available items; a child task (`parent_task_id`, type `pick_pack`) is created for the rest at stage `new` and waits for stock. Commerce shows `partially_dispatched` until all tasks are dispatched.

## 7. Replacement orders (no refunds)
- Reasons: `rto`, `damaged`, `wrong_item`, `lost_in_transit`, `failed_delivery_final`.
- Haresh taps **Send replacement** (MG-10) or accepts a client replacement request (CL-43 → `commerce.requestReplacement`).
- Fulfilment writes `replacement_orders (original_sales_order_id, reason, items, photo_ids, status)` and calls **`commerce.createReplacementOrder()`** (requested from CLIENT) which creates a ₹0 sales order flagged `isReplacement` and emits `order.paid` → normal flow. Remedy replacements re-use the same prep sheet (same `remedyOrderId`, new prep sheet copy).
- For damaged/wrong items a photo is required. The original order is not changed financially.

## 8. Tables (owned by MANAGER)
```sql
fulfilment_tasks (id, code 'FT-00001', sales_order_id, parent_task_id null, type, stage, delivery_method,
  due_at, assigned_to null, started_at, started_by, version int, needs_attention text null,
  + audit cols)                                        -- unique(sales_order_id) where parent_task_id is null
prep_sheets (id, task_id, remedy_order_id, snapshot jsonb,   -- copy of PrepSheet at T1 (+ alcoholFree)
  checklist jsonb, prepared_by, prepared_at, print_count, + audit)
qc_checks (id, task_id, prep_sheet_id null, result 'pass'|'redo', checklist jsonb, photo_file_id null,
  note, checked_by, checked_at)                       -- append-only
pick_lists → derived view v_pick_list(task_id) from commerce order items (via commerce.getOrder) + prep sheets
pack_records (task_id, weight_g, box_preset, length_cm, breadth_cm, height_cm, packed_by, packed_at)   -- additive table (logged)
replacement_orders (id, original_sales_order_id, replacement_sales_order_id, reason, item_ids uuid[], photo_file_ids uuid[], status, + audit)
```
The prep sheet is **snapshotted** at T1 so a later edit by the consultant can't silently change a bottle being prepared; if `remedy.given` supersedes the formula before T3, the task shows "Blend updated — reload sheet" (re-snapshot, audited).

## 9. Event handlers (idempotent, keyed by `event.id`; business key in brackets)
| Handles | Does |
|---|---|
| `order.paid` [salesOrderId] | T1; for each remedy item `getPrepSheet(remedyOrderId)` + `getIntakeFlagsForPrep(remedyOrderId)` → snapshot; inventory reserve |
| `order.cancelled` [salesOrderId] | T14 |
| `remedy.given` (optional, read-only) | if an open task holds that client's older blend → set `needs_attention='blend_updated'` |

Emits: `fulfilment.stage_changed {taskId, salesOrderId, remedyOrderId?, from, to}` on every transition (`remedyOrderId` on remedy/combined orders — consultant remedy tracker, 2026-11-18); `shipment.dispatched/delivered/failed` also carry `remedyOrderId?` (see §Shiprocket spec).

**Suggested commerce mapping** (commerce owns it): `new`→`paid`, `preparing…ready_to_dispatch`→`processing`, `dispatched`→`dispatched` (or `partially_dispatched`), `delivered`→`delivered`, `rto`→`returned`, `cancelled`→`cancelled`; `failed_delivery` keeps `dispatched`.

## 10. Server functions (module `fulfilment`)
```ts
listTasks(q: TaskQuery): Promise<Paged<FulfilmentTaskCard>>                 // @contract v1
getTask(id): Promise<FulfilmentTaskDetail | null>
startTask(id, version) · sendToQc(id, version, checklist) · recordQc({ taskId, prepSheetId, result, checklist, photoFileId?, note? })
markPacked({ taskId, version, weightG, boxPreset, dims? }) · splitParcel({ taskId, itemIds, reason })
setDeliveryMethod({ taskId, method, reason }) · handOver({ taskId, collectorName, photoFileId? })
markDelivered({ taskId }) · reportFailed({ taskId, reason }) · reattempt({ taskId, phone?, addressId? })
sendReplacement({ salesOrderId, reason, itemIds, photoFileIds }) · receiveReturn({ taskId, resaleable: boolean })
getOrderTracking(salesOrderId): Promise<TrackingView>                         // @contract v1 → CLIENT C-10
```
`TrackingView = { stage, deliveryMethod, steps: { key, label, at? }[], courier?, awb?, trackingUrl?, etd? }` — client-safe, no staff names.

Permissions: `fulfilment.task.view|edit`, `fulfilment.shipment.create`, `fulfilment.replacement.create`.

## 11. Tests
- Unit: every row of the transition table + every illegal transition; optimistic lock conflict; idempotent `order.paid` replay; combined order with 2 remedies waits for both QCs; cancellation after pickup rejected.
- e2e (M8): seed paid remedy order → prep → QC (photo) → pack → manual dispatch → delivered; client tracking view shows each step.
- RLS: manager can't select `practitioner_notes`, `intake_responses`; prep snapshot contains no rationale keys.
