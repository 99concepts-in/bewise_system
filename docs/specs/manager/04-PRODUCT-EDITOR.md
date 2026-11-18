# M1 · Product model, editor fields & validation

> **Owner:** MANAGER · Module `catalog` · Screens **MG-30 Products (computer)**, **MG-31 Add/edit product (computer)**, MG-15 Products (phone), **MG-16 Quick edit (phone)**
> Consumers: CLIENT shop (`listProducts`, `getProductBySlug`, `getVariant`, `getAvailability`) · Boards `design/manager-v2/MG-desktop-11/12`, `MG-phone-06`.
> Status: **SPEC v1 (2026-11-17)** — ready for the owner's real product list arriving **2026-11-18** (import template: `product-import-template.csv`).

## 1. Model
```
collections (id, name, slug, description, sort, image_file_id, is_visible, archived_at)
  └─ products (id, collection_id, name, slug, kind, status, short_description, description, ingredients, how_to_use,
  │            safety, badges text[], hsn_code, gst_rate_id, prices_include_gst bool, seo_title, seo_description,
  │            published_at, archived_at, + audit)
  ├─ product_images (id, product_id, file_id, alt, sort)            -- sort 0 = cover
  └─ product_variants (id, product_id, label '50 ml', size_value numeric, size_unit 'ml'|'g'|'pcs', sku, barcode,
                       mrp_paise, price_paise, cost_paise 🔒, weight_g, is_active, sort, archived_at, + audit)
                       → stock_items.product_variant_id (finished good, 1:1, created automatically)
```
- `kind`: `oil · spray · salt · roll_on · gift_set · accessory · other` (filters + default shipping box). Collections stay **configurable** (owner list: Oils, Sprays, Salts…); `kind` is fixed.
- `status`: `draft → active → archived`. **"Show in shop"** = `status='active'`. Archived products disappear from the shop but stay on old orders.
- Remedy blends are **not** catalogue products (priced by `remedy.reorder_price`, D-02).

## 2. Field rules (MG-31)
| Section | Field | Required for draft | Required to publish | Validation |
|---|---|---|---|---|
| Details | Name | ✅ | ✅ | 2–60 chars, unique among non-archived products |
| | Slug | auto | ✅ | from name, `a-z0-9-`, unique; changing it after publish keeps a redirect (`product_slug_history`) |
| | Collection | ✅ | ✅ | existing visible collection |
| | Kind | ✅ | ✅ | enum |
| | Short description | | ✅ | 20–140 chars (shop card) |
| | Description | | ✅ | 50–2,000 chars, plain text + line breaks |
| Ingredients · How to use · Safety (tabs) | Ingredients | | ✅ | 1–1,000 chars; INCI-style list encouraged |
| | How to use | | ✅ | 1–600 chars |
| | Safety | | ✅ | prefilled default: "For external use only. Patch test before use. Keep away from eyes and children. Consult a doctor if pregnant or under medical care." Editable |
| Photos | Images | | ≥1 | JPG/PNG/WebP, ≤10 MB, ≥1000 px short side, max 8; alt text required (prefilled from name); first = cover; stored resized (1600/800/400 WebP) |
| Sizes & prices (≥1 row) | Size label | ✅ | ✅ | e.g. "50 ml"; unique per product |
| | Size value + unit | | ✅ | > 0 |
| | SKU | auto | ✅ | auto `<KIND2>-<NAME2>-<SIZE>` e.g. `SP-CM-050`; `[A-Z0-9-]{3,24}`, unique |
| | MRP ₹ | | ✅ | > 0 (Legal Metrology: MRP incl. all taxes) |
| | Price ₹ | | ✅ | > 0 and **≤ MRP** |
| | Cost ₹ | | — | ≥ 0; manager/owner only, **never** sent to the shop; warning (not block) if price < cost |
| | Weight (g) | | ✅ | 1–30,000 (shipping, packed weight) |
| | Barcode | | — | EAN-13 check digit if given |
| | Active | | ≥1 active | |
| Status | Show in shop | | | toggling on runs the publish checks |
| Tax | HSN code | | ✅ | 4, 6 or 8 digits; suggestions: 3307 (aroma sprays/bath salts preparations), 3301 (essential oils), 3304/3305 by product — **accountant to confirm** (D-13) |
| | GST rate | | ✅ | from OWNER `tax_rates` (default 18 %); **prices are GST-inclusive** (B2C) `@decision(D-13)` |
| Stock | Linked stock item | auto | ✅ | one FG stock item per variant (created on first save); reorder level & qty (default 10 / 30) |
| Badges | New / Bestseller | | — | optional (for the shop grid) |
| SEO | Title / description | | — | ≤60 / ≤160 chars, defaults from name / short description |

**Save draft** saves anything that passes the "draft" column. **Publish** runs every rule and lists failures in a side panel ("3 things before this can go live: add a photo · price ≤ MRP on 100 ml · HSN code") with links that jump to the field.

## 3. Shop preview (MG-31 right column)
Live phone-frame preview using the **same `ProductCard`/`ProductDetail` components as the client shop** (imported from the shared UI kit; if CLIENT owns them, render via their public component, else a local mirror flagged `@cross(CLIENT)`). It shows the cover photo, name, kind · first size, short description, price (+ struck MRP if price < MRP), Add to cart (disabled).

## 4. Phone quick edit (MG-16)
Only: per variant **Price, MRP, Cost**, variant **Active**, product **Show in shop**. Same validation. Full edit opens "Edit on computer" hint (link copies URL).

## 5. Price changes & audit
- Every change to `price_paise`, `mrp_paise`, `cost_paise`, `status` writes `product_price_history (variant_id, field, old, new, changed_by, at, reason?)` + `audit_logs`.
- **Default:** price changes apply immediately and show in the owner's audit feed. Owner spec OW-13 lists "price changes" under approvals → if the owner wants approval, setting `catalog.price_change_approval = true` puts changes **pending** until approved (open question to owner, `@decision`).
- Orders keep the price at order time (commerce snapshots it), so edits never change placed orders.

## 6. Public API (catalog → CLIENT)
`listProducts` / `getProductBySlug` return **public-safe fields only** — never `cost_paise`, never draft/archived, never stock numbers beyond `inStock` + `qty` when ≤ 5 ("Only 3 left"). RLS: anon/client can select only `status='active'` via view `v_public_products`.

## 7. MG-30 Products table (computer)
Columns: cover · name · collection · sizes (count) · from-price · stock (sum of FG available, Low chip) · status · updated. Search (name/SKU), filters (collection, kind, status, low stock), sort, bulk actions **Show in shop / Hide / Archive** (confirm), **+ Add product**, **Import CSV**, **Export CSV**. Keyboard: `/` search, `n` new, `↑↓` rows, `Enter` open, `⌘S` save draft, `⌘↵` publish.

## 8. CSV import (for the 2026-11-18 product list)
Template: `docs/specs/manager/product-import-template.csv` — **one row per size**; rows with the same `product_name` become one product.
1. Upload → parse → **dry-run report** (rows OK / warnings / errors per cell) → **Import as drafts** (never auto-publish).
2. Photos are attached afterwards in MG-31 (or by filename match if a zip is uploaded: `<sku>-1.jpg`).
3. Re-import with existing SKU → updates that variant (shows a diff first).

## 9. Seed placeholders (until the real list)
Sleep Oil, Abundance Oil (Oils) · Abundance Spray, Aura Spray (Sprays) · Bath Salt, Aura Salt (Salts) — each 1–2 sizes with placeholder prices flagged `seed=true`, status **draft**, so nothing fake reaches the live shop. Replaced by import tomorrow.

## 10. Tests
zod schemas shared client/server; unit tests for publish checks, SKU generation, price ≤ MRP, CSV parser (Indian number formats "1,200", "₹450"); RLS: client can't read `cost_paise` or drafts.
