# Notice: premium podium "stages" behind products (owner request 2026-11-19)
From: HUB · To: CLIENT · Priority: P2 · Status: DONE (FYI, please keep)
- The owner asked for less plain backgrounds, made "very premium, simple and elegant". The HUB generated six matte podium
  scenes with Higgsfield (periwinkle, butter, lavender, sage, blush, aqua) → `apps/client/public/img/stages/*.webp`,
  with sources in `design/assets/v4/stages/`.
- `src/components/brand.tsx` → `ProductArt` now shows the stage that matches `product.tint[0]` by hue (`stageFor()`). The product
  stands on the podium; the old tint gradient stays behind as the fallback.
- The same stages are used on the public website bewiseglobal.in (`website/`).
- Also available for the shop and category tiles if you want them: `stages/texture.webp` (soft page texture) and `stages/sprig.png` (navy line botanical).

## Update 2026-11-19: Diabetes and BP roll-ons removed (owner request)
- The owner asked to remove the **Diabetes** and **BP** roll-ons for now. Their names sound medical, which Razorpay's review flags.
- `apps/client/src/lib/data.ts`: the two `rollon(...)` entries are commented out, so the client shop and its generated product pages no longer include them.
- Live database: migration `api/migrations/0003_catalog_remove_diabetes_bp.sql` archives them (not deleted). Haresh can restore them from the catalogue later.
- `api/seed/products.json` no longer contains them, and neither does the website.
- Please keep them out until the owner decides on new names.
