# Design v3 "Luxe" — richer typography, custom icons, midnight moments

> ❌ **REJECTED by the owner 2026-11-17 — do NOT use v3 typography, midnight cards or texture.** Kept for record. The individual icon SVGs may be used only if the owner later approves them.
>
> **Owner:** HUB. Former status: PROPOSED 2026-11-16 (owner asked: "make design better, fonts look bland, create our own icon library")** — first applied to the Owner module (`design/owner-v2/`). Once approved it applies to **all four modules via tokens**; earlier client/consultant/manager boards keep their layouts and pick up v3 type, icons and hero cards at build time.

## What changes vs v2
| | v2 (Quiet Luxury) | v3 (Luxe) |
|---|---|---|
| Display font | Cormorant Garamond (thin, delicate) | **Fraunces** (variable; SOFT 50–100, opsz 72; warm italic) — headlines + all big numbers |
| UI font | Plus Jakarta Sans | **Satoshi** (Fontshare, free commercial) — body, labels, buttons |
| Overlines | rare | **UPPERCASE tracked labels** (Satoshi 600, 11px, +0.16em) above every hero: "TODAY", "CASH & BANK" |
| Hero moments | pale tinted cards only | **Midnight cards**: Deep Navy #182957, ivory text, 1px gold hairline, faint gold lotus line art in a corner |
| Accent words | navy italic | italic word may be **muted gold #B89B64** at ≥28px (contrast-safe size only) |
| Icons | generic line set | **BeWise "Wise Line" icons** (36, custom) — 1.6px rounded stroke + one gold **seed dot** |
| Texture | flat ivory | ivory + very subtle paper grain (2–3% noise) + faint botanical line drawings in empty corners |
| Nav centre | Book / + | Same per role; **Owner = owl "Ask BeWise"** |

## Icon library
- Vector source: `icons/sheet-a-navigation.svg`, `icons/sheet-b-operations-money.svg`, `icons/sheet-c-system.svg`
- **Individual 24px icons (code-ready): `icons/svg/*.svg`** (36). Stroke = `currentColor`; seed dot = `var(--bw-icon-accent, #B89B64)`.
- Specimen: `icon-library-specimen.jpg`. Names: home, today, clients, calendar, book, remedy, library, follow-up, shop, profile, journal, goals, orders, prepare, quality, dispatch, stock, production, purchases, money, invoice, expense, bank, insights, bell, search, settings, lock, chat, ask-bewise, sync, location, video, approve, personal, team.
- Rules: 24px default (20px dense lists, 28px tiles); never fill except the seed dot; seed dot may be hidden (`--bw-icon-accent: transparent`) at ≤16px; add new icons in the same style (designer to extend, owner approval).
- Build: HUB wraps them as `<Icon name="remedy" />` in `src/components/ui/icon.tsx` (SVGR/inline sprite).

## Files
- `design-v3-specimen.jpg` — type, colour, cards, buttons, icons, nav. (Specimen copy mentions "Ayurveda" — illustrative only; BeWise = Bach Flower + aromatherapy.)
- Tokens updated in `design/tokens.json` (`font`, `v3`).
