# Consultant console (owner request, 2026-11-23)

> **Owner:** CONSULTANT · Built in `prototypes/consultant-app/` (`src/lib/journey.ts`, `src/ui/console.tsx`; unit tests `src/__tests__/journey.test.ts`).

## Member card (People board, list and profile header)
- **Last session** date with "x days ago" and a colour dot: **green** within about a month (≤ 35 days), **amber** 2–3 months (36–90 days), **soft red** beyond 90 days. Grey "No session yet" before the first.
- **Journey tag:**
  - **Regular:** 3 or more completed sessions in the last 6 months, and the last one within 2 months (or one already booked).
  - **Drifting:** nothing booked and either no session for over 3 months or the follow-up overdue by a month.
  - **Occasional:** everyone else with at least one session. No tag before the first session.

## Overview tab = the console, top to bottom
1. **AI wellness summary**
   - **Blend routine flag** (Bach flower, while a blend is running): drops missed on 3+ of the last 7 days, or no "took my drops" ticks in the last 3 days, or under 60% of days since the blend started.
   - **Feelings noted:** what the member brought to the last 2 sessions, in everyday words (worry, tiredness, self-doubt…), plus the journal's last 2 weeks (settled days, most common other feeling). Scanning: the themes of his notes.
   - **Last blend** and its date (days ago).
   - **Journey** tag with the reason.
   - **Suggested focus for the session:** 1–2 lines. Priority: check-in says something feels harder → a feeling repeating in 2+ of the last 3 sessions → blend routine → drifting → what feels better → the scanning follow-up → review the last blend.
2. **Lo Shu grid** (small grid, driver, conductor, missing numbers) → Full reading tab.
3. **Wellness journey** timeline: each completed session with the gap since the one before, what they brought, how they felt after, the blend size (last 6; "All" opens Sessions).
4. **Concerns across sessions** (last 5 sessions, everyday words).
5. **Blend journey:** each blend with the flowers added (outlined) and left out.
6. The member's week of feelings.

The Remedy tab keeps the drops calendar, the current blend and delivery, the progress note and the blend journey.

## Wording rule (applies to the live AI summary too, K6)
Descriptive, never diagnostic: describe what was noted and when; no labels, conditions or medical words. The prototype enforces this with a word list (`NOT_SAID` in `journey.ts`, includes diagnose, disorder, depression, symptom, patient, treatment, cure, clinical, illness, disease, prescribe, medication, condition, anxiety, therapy) and a test that runs every demo member's summary through it. The live Claude prompt must carry the same rule and the server should run the same check before showing a summary.
