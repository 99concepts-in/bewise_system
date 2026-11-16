# Manager Operations (Mr. Haresh Moorjani) — Flow & Screen List (v1 draft)

> **Owner:** HUB (designed with the business owner). Status: **APPROVED FLOW (owner answers 2026-11-16) — designs in `design/manager-v2/`.**
> Supersedes M-01…M-16 in `docs/02-FLOWS-AND-SCREENS.md` once approved. Screen IDs `MG-xx` are stable.
> Visual direction: Quiet Luxury v2, same family as client & consultant. **Phone first** (owner, 2026-11-16), desktop adaptation later.
> Boards: `design/manager-v2/`.

## Design intent
Haresh's job = **nothing falls through the cracks** between a paid order and a happy client, and money owed is
followed up politely. The app is his calm control room: what needs doing now, one tap to move work forward,
printable/shareable sheets, and gentle money follow-ups. Slightly denser than client/consultant screens, never cluttered.

- Sees **no consultation notes, reasons or questionnaire data** — only the prep sheet (flowers, drops, bottle, label).
- Every action that moves work forward is **one big button** at the bottom (Send to QC → Pack → Dispatch).
- Phone-native helpers: **scan AWB barcode**, take photo of QC/receipt, share label/invoice on WhatsApp.

## Navigation (phone)
**Today · Orders · (+) · Money · Me**
- **+** = New walk-in order · Record payment · Add expense · Stock adjustment · Book appointment for client
- **Me** hub = Appointments desk · Clients · Products · Stock · Production · Purchases · Reports · Settings

## Flow
```
DAY START   Today: to prepare · to pack · to dispatch · overdue money · needs attention (low stock, pickups, check-ins)
REMEDY      Orders (Remedy) → Prepare remedy (prep sheet + checklist) → Quality check (checklist + photo)
            → Pack → Dispatch (courier, scan AWB, charge, WhatsApp tracking) → Delivered / exception
STORE       Orders (Store) → Pick & pack (pick list) → Dispatch → Delivered
COMBINED    Remedy prep + store items packed together in one parcel
FRONT DESK  Appointments today → Check in → Walk-in booking + record offline payment
MONEY       To collect (due / overdue / part-paid) → Invoice → Send reminder (WhatsApp/email) · Record payment
            To pay (supplier bills) · Expenses (photo of receipt → submit for owner approval)
STOCK       Stock (finished · raw · packaging) → Item → Adjust (reason) · Low-stock → Purchase order → Receive goods
PRODUCTION  Production batches → Batch (request → materials → produce → QC → bottle & label → received)
```

## Screens
### A. Start & Today
| ID | Screen | Content |
|---|---|---|
| MG-01 | Sign in | Same pattern as consultant (team only, OTP) |
| MG-02 | Today | Greeting, 4 tiles (to prepare · to pack · to dispatch · overdue ₹), Needs attention list |
| MG-03 | Notifications | New paid orders, remedies given by consultant, failed deliveries, low stock, approvals returned |

### B. Orders & fulfilment
| ID | Screen | Content |
|---|---|---|
| MG-04 | Orders | Search, type filter (Remedy · Store · Combined), stage pills with counts, rows with due time |
| MG-05 | Order detail | Client (first name, city, phone/WhatsApp), items, payment status, stage timeline, next action |
| MG-06 | Prepare remedy | Prep sheet: flowers + drops, bottle, label text; checklist; print/share sheet; Send to QC |
| MG-07 | Quality check | Checklist, optional photo, pass / redo with note |
| MG-08 | Pick & pack | Pick list (products + remedy bottle), packing checklist, parcel weight |
| MG-09 | Dispatch | Courier pills, AWB (type or **scan**), charge, WhatsApp tracking toggle, print label, Mark dispatched |
| MG-10 | Shipments & exceptions | In transit · Delivered · Failed · Returned (RTO) · Replacement |

### C. Front desk
| ID | Screen | Content |
|---|---|---|
| MG-11 | Appointments today | All sessions, check-in for in-person, reschedule/cancel on behalf (reason) |
| MG-12 | Walk-in booking & payment | Book a slot for a client, record cash/UPI/card payment, receipt on WhatsApp |

### D. Clients
| ID | Screen | Content |
|---|---|---|
| MG-13 | Clients | Search, rows with phone & last order |
| MG-14 | Client detail | Contact, addresses, orders, invoices & dues, communication log — **no notes** |

### E. Products & stock
| ID | Screen | Content |
|---|---|---|
| MG-15 | Products | Collections, product rows with price, stock, active toggle |
| MG-16 | Product edit | Photos, name, description, ingredients, how to use, safety, sizes & prices (MRP/selling/cost), tax category |
| MG-17 | Stock | Finished · Raw · Packaging tabs, low-stock alert, rows with quantity & status |
| MG-18 | Stock item | Movements history, adjust (reason required), reorder level, expiry/batches |

### F. Production & purchases
| ID | Screen | Content |
|---|---|---|
| MG-19 | Production | Batches list by stage |
| MG-20 | Batch detail | Stepper Request → Materials → Produce → QC → Bottle & label → Received; batch no., mfg/expiry, cost, wastage |
| MG-21 | Purchases | Suppliers & purchase orders, status |
| MG-22 | Receive goods | Tick received quantities (partial ok), photo of supplier bill → creates supplier bill |

### G. Money
| ID | Screen | Content |
|---|---|---|
| MG-23 | Money | Tabs **To collect · To pay · Expenses**; tiles due today / overdue / part-paid; rows with amount & status |
| MG-24 | Invoice & reminder | Invoice detail, reminder preview (approved WhatsApp template), reminder history, Send reminder · Record payment · Payment link |
| MG-25 | Record payment | Amount, method (cash/UPI/card/bank), date, reference, receipt to client |
| MG-26 | Add expense | Photo of receipt, amount, category, paid from, note → submit for owner approval |

### H. Me
| ID | Screen | Content |
|---|---|---|
| MG-27 | Me hub | Tiles: Appointments, Clients, Products, Stock, Production, Purchases, Reports; Settings, Sign out |
| MG-28 | Reports | Simple: orders this week, average prep time, courier performance, stock value |
| MG-29 | Empty & states | All caught up, offline, failed sync |

## Owner answers (2026-11-16)
1. ✅ Haresh **does production and purchases** (MG-19…22 are his). Jitu Bhaiya also sees **sales and business overview** (read-only) — consultant CN-30/31/32.
2. ✅ Courier = **Shiprocket** (multiple couriers). Dispatch compares Shiprocket courier rates → Create shipment → auto AWB, label PDF, pickup scheduling, tracking via webhook. Manual AWB entry kept as fallback.
3. ✅ **No refunds** — anywhere in the system. Failed delivery → reattempt; RTO/damaged/wrong item → **replacement order**. Client cancellations → reschedule only.
4. ✅ He sees **everything** in Money: to collect (clients), to pay (suppliers, recurring like Shiprocket wallet), expenses (owner approves).
5. ✅ **Computer as well** for adding/editing products (MG-30, MG-31 desktop). Phone has quick edit (price, stock, live toggle).

## Added screens
| ID | Screen | Content |
|---|---|---|
| MG-09 | Dispatch (Shiprocket) | Courier options with price & days (Recommended), pickup slot, WhatsApp tracking, Create shipment |
| MG-09b | Shipment created | AWB, label print/share, pickup scheduled, tracking sent |
| MG-10 | Shipments | In transit · Delivered · Problems (failed → Reattempt, RTO → Send replacement); "Synced with Shiprocket" |
| MG-16 | Quick edit (phone) | Price/MRP/cost per size, show in shop; full edit on computer |
| MG-23b | Money → To pay | Supplier bills, recurring (Shiprocket wallet) |
| MG-27b | Quick actions (+) | Walk-in order, record payment, add expense, adjust stock, book appointment, new batch |
| MG-30 | Products (desktop) | Collection table, search, filters, + Add product |
| MG-31 | Add / edit product (desktop) | Photos drop zone, details, ingredients/how to use/safety, sizes & prices table, status, tax, stock link, live shop preview |

## (Answered) Open questions
1. Does Mr. Haresh also do **production (making oils/sprays/salts)** and **purchases**, or is that someone else? (Affects whether MG-19…22 are his.)
2. Which **courier(s)** do you use today? (Delhivery / Blue Dart / India Post / Shiprocket…)
3. Can he **give refunds** himself up to a limit (default ₹2,000), above that owner approves?
4. Should he see **all money owed to the business** (clients + suppliers), or only client dues?
5. Does he need **desktop** for some work (product editing, reports)? Default: phone first, desktop later.
