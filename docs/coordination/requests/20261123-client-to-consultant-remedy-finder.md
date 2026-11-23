# CLIENT → CONSULTANT: remedy finder (concern → remedies to consider)

**Date:** 2026-11-23 · **From:** CLIENT · **Status:** open

The owner supplied three Bach flower books and asked that the Consultant account suggests remedies from a concern.
Data is ready: `docs/knowledge/remedy-finder.json` (41 concerns, generated from `apps/client/src/lib/remedy-finder.ts`).
Each entry: `concern`, `keywords`, `remedies[{ name, why }]`, optional `note`, `source` (`guide` = Non Shaw, *Bach Flower Remedies:
A Step-by-Step Guide*, 1998, pp. 53–58; `bach` = Edward Bach, *The Twelve Healers and Other Remedies*, 1936).

Suggested use in the Consultant app (blend builder / session notes):
- When the member's intake concerns, feelings or check-in mention a keyword, show "Remedies to consider" with the reason.
- Jitendra Khimlani always decides; nothing is auto-added to a blend.
- Wheeler's A to Z repertory in *The Bach Flower Remedies* (Bach & Wheeler) is much larger, but its scanned columns are scrambled
  in text form; it can be added later by reading the page images carefully.

Owner rule (2026-11-23): members must not self-select remedies. The member app shows remedy names only to explain Bach's ideas,
always with "Take Bach remedies only after a session with Jitendra Khimlani".
