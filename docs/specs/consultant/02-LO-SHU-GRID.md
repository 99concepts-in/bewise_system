# Lo Shu grid (owner request, 2026-11-23)

> **Owner:** CONSULTANT (calculation + consultant view) · Client view: CLIENT (request filed) · Calculation: `prototypes/consultant-app/src/lib/loshu.ts` (unit-tested; copy it as-is so both apps show the same grid).

## What was asked
- The **member enters their date of birth** in the app and **sees their Lo Shu grid**.
- When **Jitu Bhaiya taps any member**, he sees their grid together with everything else about them, in **tabs that scroll if needed**, all easy to reach.

## Data
- `clients.dob DATE NULL` already exists (api/migrations/0001_core.sql) and the client app already asks for it (CL-05 "About you").
- Consultant can add it on the member's Lo Shu tab if the member tells him (`crm.updateClient {dob}`, same field).

## Calculation (common Indian practice — **Jitu Bhaiya to confirm**)
1. Write the date as DD MM YYYY. Put every **non-zero** digit into its cell. Zeros are not placed.
2. **Driver (Mulank)** = the day reduced to one digit (15 → 6).
3. **Conductor (Bhagyank)** = all digits of the date added and reduced to one digit (15-08-1987 → 39 → 12 → 3).
4. The conductor is **always added** to the grid. The driver is **added only** for two-digit days that are not 10, 20 or 30.
5. Added numbers are shown in italics so the birth digits stay visible.

Layout (rows): `4 9 2` · `3 5 7` · `8 1 6`.

Shown: driver, conductor, the grid, **missing numbers**, **repeated numbers**, and the 8 **planes** (Mental 4-9-2, Emotional 3-5-7, Practical 8-1-6, Thought 4-3-8, Will 9-5-1, Action 2-7-6, Golden 4-5-6, Silver 2-5-8) marked complete or missing. Short meanings per number are reminders only; his own reading comes first.

**Open questions for Jitu Bhaiya:** add the driver/conductor to the grid or show them separately only? Use the Kua number too (needs gender)? His own words for each number and plane?

## Consultant profile, now in tabs
Header (name, city, age, type) and actions (Message, Call, WhatsApp, Book) stay on top; then a sticky, scrollable tab strip, remembered in the URL (`#/people/<id>?loshu`):

| Tab | Bach flower member | Scanning member |
|---|---|---|
| Overview | stats, progress since last remedy, Lo Shu preview, feelings this week | stats, last note + follow-up, Lo Shu preview, feelings |
| Remedy / Notes | drops taken, current blend + delivery, what troubled them | summary of all notes, notes + Add a note |
| Lo Shu | grid and reading | same |
| Sessions | every session | same |
| About | mobile, city, date of birth + age, how to refer to them, joined, Archive | same |

Opening from a remedy list (missed remedy, ending, dashboard) lands on **Remedy**; ending a scanning session lands on **Notes**.
