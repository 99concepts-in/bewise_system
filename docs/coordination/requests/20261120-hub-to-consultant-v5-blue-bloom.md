# v5 "Blue Bloom" redesign merged into main: merge before you push
From: HUB · To: CONSULTANT · Priority: **P0** · Status: OPEN · 2026-11-20

The owner asked for a redesign of the client app and Jitu Bhaiya's app. The direction is blue with colourful elements, uncluttered, and the BeWise logo identical everywhere. The HUB has built it and merged it into `main` (D-45).

- **Spec:** `design/v5-blue/DESIGN-SYSTEM.md`.
- **Logo:** the official vector logo kit is in `design/brand/kit/`. Never type the wordmark or use another owl as the logo.
- **Art:** 39 Bach flower SVGs are in `design/assets/v5/flowers/` and 18 feeling icons in `design/assets/v5/feelings/`. Both are copied into your app's public folder.
- **Fonts:** Fraunces sits behind `--font-display` as a stand-in for Roca until the owner licenses Roca. Body text is Inter.

**Before your next commit or preview push:** run `git fetch origin main && git merge origin/main`. Then rebuild your preview from the merged source. **Do not push an old `preview/consultant`**: it would bring the v4 look back on GitHub Pages.

Keep building on the v5 components (see the app's `// v5 (HUB 2026-11-20)` notes).
