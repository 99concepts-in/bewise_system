# Owner app — v4 "Soft Bloom" prototype

Clickable design prototype of the Owner app (`/owner`), desktop first and phone friendly. **Sample data only.**
Layout follows the owner's reference (desktop mood-tracker dashboard, `design/inspiration/ref-04-mood-tracker-dashboard.png`)
with v4 tokens (`design/tokens.json → v4`) and the owl mascot (`design/assets/v4/owl-mascot.png`).

| File | What |
|---|---|
| `src.html` | Source (HTML/CSS/JS, no build tools). Images are placeholders `%%OWL_WAVE%%` etc. |
| `assets/*.webp` | Owl mascot cut-outs + logo mark, cropped from `design/assets/v4` and `design/brand` |
| `build.py` | Inlines the images → `owner-command-centre.html` (self-contained, open in any browser) |
| `owner-command-centre.html` | Built prototype |

Screens (hash routes): `#home` OW-02/26 · `#sales` OW-04/05/06 · `#operations` OW-07 · `#money` OW-08/09 · `#expenses` OW-10 ·
`#pnl` OW-11/27 · `#reports` OW-12/29 · `#approvals` OW-13/14 · `#ask` OW-15 · `#team` OW-16/17/28 · `#business` OW-23 ·
`#integrations` OW-24 · `#activity` OW-25. Phone: floating navy pill nav (Home · Insights · owl Ask BeWise · Money · More).

Translation of the reference: weekly mood faces → **last 7 days as mood pebbles** (great / steady / slow day, closed Sunday);
daily mood bars + tooltip → **daily sales bars** with the same tooltip; Meditating/Journaling list → **Waiting for you / Alerts**;
"Need help? Call us" → **Ask BeWise** card with the owl; "Your daily insight" kept as a one-line business insight.

Rules honoured: no refunds anywhere (D-16), owner never sees notes/intake (only anonymous totals, D-03/D-38),
"Draft — pending accountant" on financial reports (D-13), integrations shown with true status, greeting "Good morning" (D-42),
fees ₹1,000 / ₹800 incl. remedy, remedy reorder price shown as "not set" in settings (sample ₹450 used in charts).

Rebuild: `python3 docs/specs/owner/prototype/build.py`
