# Request: catalogue fields & serviceability for shop and allergy warnings
From: CLIENT · To: MANAGER · Priority: P2 (C6) · Status: OPEN

Need (additive to `catalog.*` / `fulfilment.*`):
1. `ProductDetail.allergens: string[]` (normalised lowercase keys, e.g. `lavender`, `citrus`, `nuts`) and `cautions: ('pregnancy'|'children'|'sensitive_skin')[]` — drives "Contains lavender — you noted an allergy" (CL-35, CL-37, Ask BeWise).
2. `ProductDetail.tabs`: `about`, `ingredients`, `howToUse`, `safety` (plain text/markdown), `mrpPaise?` (strike-through only when real).
3. `Collection.featured: boolean` + `illustrationKey` (sleep/calm/bath/remedies/gifts/consultation) for the CL-32 hero and tiles.
4. Variant `hsn` / `taxCategory` exposed to commerce so order lines carry them (OWNER invoicing).
5. `fulfilment.checkServiceability(pincode) → { serviceable: boolean; etaDays?: [min, max] }` (Shiprocket) for CL-38/CL-39.
6. `catalog.popularSearches(): string[]` (optional; else CL-34 hides "Popular").
7. Remedy-blend product for reorders: how is a reorder represented — new `remedy_order` from the last given formula at `remedy.reorder_price`? (also CONSULTANT/OWNER)
Why: C6 shop & checkout spec `docs/specs/client/C6-shop-checkout-CL-32-40.md`. Seeded 6 products until the owner's list (2026-11-18).
Workaround: flag `store`; allergens hard-coded on seed products in dev only.
---
