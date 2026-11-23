# Request: CONSULTANT → CLIENT — show the member their Lo Shu grid

**Date:** 2026-11-23 · **Priority:** P1 (owner request) · **Spec:** `docs/specs/consultant/02-LO-SHU-GRID.md`

The owner asked: *the member enters a birthdate and the app shows their grid.*

1. Date of birth is already collected on CL-05 (About you). Make it editable later under Me → About you.
2. Add a **Lo Shu grid** card (Me, or Home under the feelings) showing the grid, driver and conductor numbers, and missing numbers. If there's no date of birth yet, show a small prompt to add it.
3. Please **copy the calculation as-is** from `prototypes/consultant-app/src/lib/loshu.ts` (pure TypeScript, no dependencies, with unit tests in `src/__tests__/loshu.test.ts`), so the member and Jitu Bhaiya always see the same grid.
4. Keep the reading gentle and short. The client app shows no remedy advice; the meanings are general.

Jitu Bhaiya already sees the grid on each member's Lo Shu tab and can add a missing date of birth there.
