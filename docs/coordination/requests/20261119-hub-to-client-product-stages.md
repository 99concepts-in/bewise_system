# Notice: premium podium "stages" behind products (owner request 2026-11-19)
From: HUB · To: CLIENT · Priority: P2 · Status: DONE (FYI, please keep)
- The owner asked for less plain backgrounds, made "very premium, simple and elegant". The HUB generated six matte podium
  scenes with Higgsfield (periwinkle, butter, lavender, sage, blush, aqua) → `apps/client/public/img/stages/*.webp`,
  with sources in `design/assets/v4/stages/`.
- `src/components/brand.tsx` → `ProductArt` now shows the stage that matches `product.tint[0]` by hue (`stageFor()`). The product
  stands on the podium; the old tint gradient stays behind as the fallback.
- The same stages are used on the public website bewiseglobal.in (`website/`).
- Also available for the shop and category tiles if you want them: `stages/texture.webp` (soft page texture) and `stages/sprig.png` (navy line botanical).
