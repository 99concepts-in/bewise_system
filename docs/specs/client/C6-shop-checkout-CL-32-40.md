# Shop, bag & checkout — CL-32…CL-40

> **Owner:** CLIENT chat (`commerce` module) · Milestone **C6** · Status: **DRAFT v0.1 (2026-11-17)**
> Boards: `CL4-board-15-shop-collection-search.jpg`, `CL4-board-16-product-saved-bag.jpg`, `CL4-board-17-address-pay-order-placed.jpg`.
> Contracts: `catalog.*` (MANAGER), `crm.listAddresses/upsertAddress`, `finance.createCheckout/verifyCheckout` (OWNER), own `commerce.*`.
> Decisions: D-02 (remedy included / reorder price) · D-16 (no refunds → replacement) · intake allergies/pregnancy → warnings. Products: **seeded 6 placeholders** (Sleep Oil, Abundance Oil, Abundance Spray, Aura Spray, Bath Salt, Aura Salt) until the owner's list arrives **2026-11-18**.

## 1. Principles
- Calm, curated, never pushy: no countdown timers, no "only 2 left!", no pop-ups. MRP strike-through allowed only when the catalogue has a real MRP.
- Browsing is public (`/shop`, `/product/[slug]`); bag & checkout need sign-in (guest bag merges on sign-in).
- **Server recomputes every price**; the client only sends ids + quantities. "Paid" only after server confirmation.
- Allergy / pregnancy warnings are **informational, never blocking** — the client decides.

## 2. Screens

### CL-32 Shop home — `/app/shop` (and public `/shop`)
| Block | Spec |
|---|---|
| Headline | "Little *rituals*" (two-tone) |
| Hero banner | One curated collection (from `listCollections()` where `featured`), soft gradient + product cutout, "Explore" |
| Category tiles | 2×3 illustrated tiles (`design/assets/v4/category-illustrations.png`): **Sleep · Calm · Bath · Remedies · Gifts · Consultation**. Remedies → My Remedies (CL-26) if signed in with a blend, else explainer + Book. Consultation → CL-11 |
| Rows | 2 curated rows ("For restful evenings", "New & loved") — horizontal scroll cards: cutout on beige tile, name, size, price, round bag button |
| Data | `catalog.listCollections()`, `catalog.listProducts({ collection, limit: 8 })` |
| Flag | `store` off → Shop tab shows "Our shop opens soon" + Consultation tile only |

### CL-33 Collection — `/app/shop/[collection]`
2-col grid (cutout on `#EDE5D9` tile, name, size count "2 sizes", from-price). **Filter/sort** bottom sheet: Sort (Featured · Price low–high · high–low) · Type (Oil · Spray · Salt · Remedy) · "Hide items with my allergens" toggle (on by default when client has allergens). Infinite scroll 12/page (`Paged`). Out-of-stock cards: muted + "Back soon".

### CL-34 Search — `/app/shop/search`
Search pill autofocus · Recent (local, max 6, clearable) · Popular (catalog-provided) · Results grid as CL-33 · empty: "Nothing found for 'lavendr' — try 'lavender' or browse Sleep" (simple fuzzy suggestion from product names). Debounce 250 ms; min 2 chars.

### CL-35 Product — `/app/product/[slug]`
| Element | Spec |
|---|---|
| Hero card | Name two-tone ("Sleep *Oil*"), one-line purpose ("Aromatherapy blend for restful evenings."), size pills, price + MRP, cutout image (gallery swipe, `product_images`) |
| Header | Back · ♡ Save (CL-36) |
| Tabs | **About · Ingredients · How to use · Safety** (pill tabs, ARIA tablist) |
| **Allergy warning** | Rose card with ⚠ icon: "Contains **lavender** — you noted an allergy." Shown when `product.allergens ∩ client.allergens ≠ ∅` (matching rules §4). Also shown on Bag line |
| Pregnancy caution | If client flag `pregnancy` and product `cautions` includes `pregnancy`: "Not recommended during pregnancy — please check with your doctor." |
| Not for me | If a warning shows, Add to bag opens a confirm sheet "Add anyway?" (Add anyway · Cancel) |
| Stock | `catalog.getAvailability([variantId])`; out of stock → CTA "Back soon" disabled + "Save for later" |
| CTA bar | Qty stepper (1–10) + **Add to bag** → `commerce.addToCart({ variantId, qty })` → toast "Added to your bag" with "View bag" |
| Copy rules | No cure/therapeutic claims (design system §10). Catalog copy is MANAGER's; CLIENT renders as-is but runs the banned-words check in dev and reports violations to MANAGER |

### CL-36 Saved for later — `/app/saved`
2-col cards with filled ♡ (tap = remove with undo) + round bag button (adds default variant qty 1). Empty: mascot "Tap ♡ on anything you love — it'll wait here." Table `wishlists` (own).

### CL-37 Your bag — `/app/bag`
| Element | Spec |
|---|---|
| Lines | Image · name · size · price · qty stepper · ✕ remove (undo toast). **Remedy line** ("Personal blend v1 · 30 ml", sage "Remedy" chip, no stepper — qty fixed 1) for reorders at `remedy.reorder_price` |
| Warnings | Allergy chip on affected lines |
| Totals card | Subtotal · "GST included" · Delivery (from server: "Free" / ₹x / "Calculated at address") · **Total** — all from `getCart()` server totals |
| CTA | **Checkout** → CL-38 (sign-in first if guest) |
| Empty | Mascot + "Your bag is empty" + **Explore the shop** |
| Unavailable lines | Server marks `unavailable` → line muted "No longer available — remove" and Checkout disabled until removed |

### CL-38 Address — `/app/checkout/address`
Saved address cards (radio, default first) from `crm.listAddresses(clientId)` · **Add new**: Name, Phone (+91), Pincode (6 digits → auto city/state), House/flat, Area/street, Landmark (optional), City, State (select), "Save as default". Validation: pincode `^[1-9][0-9]{5}$`; serviceability check (Shiprocket via MANAGER `fulfilment.checkServiceability(pincode)` — **not in contract; request**) → "We don't deliver to this pincode yet" blocks continue. Save → `crm.upsertAddress`. CTA **Continue**.

### CL-39 Review & pay — `/app/checkout/review`
Items (compact), address (Change), delivery estimate ("Arrives in 4–6 days" from serviceability), totals, policy line "No returns for change of mind — damaged or wrong items are replaced." (D-16) with link to Replacement policy. CTA gradient **Pay ₹1,300**.

**Sequence**
1. `commerce.createOrderFromCart({ addressId })` → `{ salesOrderId, totalPaise }` (status `pending_payment`; emits **`order.placed`**). Price changed vs bag → show updated total and require a second tap.
2. `finance.createCheckout({ purpose:'sales_order', refId: salesOrderId })` → Razorpay Checkout (same options as booking, UPI first).
3. handler → `finance.verifyCheckout` → "Confirming your payment…" → wait for `commerce.getOrder(id).status === 'paid'` (set by commerce's own `payment.captured` handler, which emits **`order.paid`**) → CL-40.
4. Failure → CL-53 variant A (order stays `pending_payment`; "Try again" reuses the same order; unpaid orders auto-cancel after 24 h → `order.cancelled{reason:'unpaid'}`).
5. **₹0 orders** (included remedy, CL-25): skip Razorpay — `createOrderFromCart`/remedy confirm marks paid server-side; never call `createCheckout` with 0.

### CL-40 Order placed — `/app/orders/[id]/placed`
Calm success: soft 3D flower/mascot, "Thank *you*", order code `BW-00042`, "Arriving by Tue 26 Nov" (estimate), **Track order** (CL-42) · "Continue browsing". Remedy lines: "Your blend is prepared fresh — it ships within 2 days" (⚠ owner to confirm timing).

## 3. Order model notes (commerce — CLIENT owns)
- `sales_orders.kind`: `store` (products only), `remedy` (from `remedy.given` or reorder alone), `combined` (reorder remedy + products in one bag).
- `order_items`: `kind` (`product`/`remedy`), `variant_id` or `remedy_order_id`, `qty`, `unit_price_paise`, `tax_category`/`hsn` copied from catalog variant at order time (OWNER needs them for invoicing), `line_total_paise`.
- `order.paid` payload `items[]` = `{ orderItemId, kind, variantId?, remedyOrderId?, qty }` (MANAGER fulfilment needs kinds).
- Handler `remedy.given` → `createRemedySalesOrder({ remedyOrderId, clientId, pricePaise: 0 })` when the remedy is included in a paid session (D-02) — idempotent on `remedyOrderId`.
- Status sync: `fulfilment.stage_changed` / `shipment.dispatched` / `shipment.delivered` → `setOrderStatusFromFulfilment`.
- Contract mismatches (enum `return_requested/returned/refunded`, table `return_requests` vs `replacement_requests`) raised to HUB — see request.

## 4. Allergy matching (`commerce/lib/allergens.ts`)
- Client allergens: CONSULTANT exposes a client-safe `intake.getClientShoppingFlags(clientId) → { allergens: string[]; pregnancy: boolean }` (**request**) — normalised lowercase keys (e.g. `lavender`, `citrus`, `nuts`), parsed from IN-08 free text + client-edited list in Me → Personal details.
- Product allergens: `ProductDetail.allergens: string[]` + `cautions: ('pregnancy'|'children'|'sensitive_skin')[]` (**request to MANAGER**).
- Match = exact key or synonym table (lavender ↔ lavandula; citrus ↔ orange/lemon/bergamot). Unknown free text that can't be keyed → no automatic match; Safety tab always lists full ingredients.
- Never shown to anyone except the client; never sent to analytics.

## 5. Acceptance
- [ ] Tampering with price in the request has no effect (server test).
- [ ] Bag with remedy reorder + 2 products → one `combined` order, correct `order.paid` items with kinds.
- [ ] Allergy warning on product + bag for a seeded client with "lavender".
- [ ] Out-of-stock variant cannot be checked out.
- [ ] ₹0 remedy order never opens Razorpay.
- [ ] No "refund"/"return for refund" strings; replacement wording only.
