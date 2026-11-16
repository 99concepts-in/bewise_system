# Design Direction v2 — "Quiet Luxury" (from owner's references)

> **Owner:** HUB. Status: **PROPOSED — awaiting owner approval.** Replaces the "v1" look of `design/boards/`
> (owner feedback 2026-11-16: v1 looked mid-level and cluttered; should be beautiful, elegant, luxurious).
> Once approved, `docs/01-DESIGN-SYSTEM.md` and `design/tokens.json` will be updated and all chats notified.

## References

| File | What we take from it |
|---|---|
| `ref-01-mental-wellness-sleep.png` | Airy pastel atmosphere; one big friendly question as the hero ("How do you feel today?"); colour-coded soft tiles; pill segmented tabs; list rows = date tile left · title · meta · mood face right; floating glass bottom nav |
| `ref-02-asclepios-ai-health.png` | **Closest to our brand**: warm cream + soft sage gradient; huge whitespace; one hero number/object per screen; soft 3D objects as the emotional anchor; dark pill CTA; selected date as a solid filled circle; tiny status pills; light-weight text with few bold words |
| `ref-03-bloomly-mental-health.png` | Day timeline with dot connectors ("Start your day"); weekly emotional state shown as sized bubbles; floating centre action in the nav; minimal splash with logo + soft illustrated characters |

## What makes them feel premium (and v1 didn't)

| They do | v1 did |
|---|---|
| One hero per screen, everything else small and quiet | Many equal-weight cards per screen |
| Separation by **tone** (tinted surfaces), almost no borders or shadows | Borders + shadows + dividers everywhere |
| Big radii (24–32px), pills everywhere | 12px cards, square-ish inputs |
| Soft gradient atmosphere behind content | Flat ivory |
| 2 text sizes doing most of the work (huge + small), lots of muted grey | 5–6 competing sizes, dark text everywhere |
| Emotional anchor: illustration / 3D object / mood face | Icons only |
| Floating, glassy bottom nav | Full-width tab bar |

## BeWise translation (brand colours kept, luxury added)

**Atmosphere:** Soft Ivory `#FAF9F5` base with a very soft radial wash of Soft Green `#DCE7D9` (top) fading to Warm Beige `#EDE5D9` (bottom). Never saturated.

**Surface tints** (for tone-on-tone cards, derived from brand colours — no new hues):
| Tint | Hex | Used for |
|---|---|---|
| Sage mist | `#EEF3EC` | Remedies, wellbeing, journal |
| Navy mist | `#EEF1F8` | Appointments, consultations |
| Beige cream | `#F6F1EA` | Shop, products |
| Gold cream | `#F7F2E6` | Payments, premium moments (very sparing) |
| Pure white | `#FFFFFF` | Inputs, sheets |

**Primary action:** Deep Navy `#182957` **pill** button, white text (like ref-02's black pill). Secondary: white pill with navy text. Selected chips/dates: solid navy circle/pill.

**Type:** Cormorant Garamond for the one hero line per screen (36–44px, with one *italic* word for elegance — e.g. "How are you *feeling* today?"). UI text in a rounded geometric sans — **proposal: Plus Jakarta Sans** (closest to the references) instead of Inter; Inter stays for numbers/tables if preferred. *Brand guide requires owner approval for a core font change.*

**Shape:** cards radius 28px, inputs/buttons full pill, sheets 32px top radius, nav = floating glass pill (white 70% + blur) with a raised navy centre button for **Book**.

**Emotional anchors (instead of emoji — brand guide forbids emoji as primary icons):**
- **Owl-eyes mood scale:** 5 soft faces drawn in the owl's line style (closed smiling eyes → neutral → heavy eyes). Signature + delightful, used only for mood.
- **Soft 3D botanicals:** matte porcelain/clay renders of Bach flowers, amber bottle, bath-salt bowl — hero objects on Remedies, Shop, empty states.
- Real product photography in the store (cutouts on beige cream tiles).

**Density rules:** max 3 content blocks above the fold on mobile · 1 primary action · meta text in `ink-subtle` · no dividers inside cards · 24px gutters on cards, 20px screen padding · icons 1.5px line, never filled except selected nav.

**Motion:** sheets rise with soft spring; numbers count up; mood faces blink; page transitions fade 200ms; reduced-motion respected.
