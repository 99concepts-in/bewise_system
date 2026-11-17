# Consultant Workspace (Jitu Bhaiya) — Flow & Screen List (v2)

> **Owner:** HUB (designed with the business owner). Status: **APPROVED FLOW — designs in `design/consultant-v2/`.**
> Supersedes K-01…K-11 in `docs/02-FLOWS-AND-SCREENS.md`. Screen IDs `CN-xx` are stable.
> Visual direction: Quiet Luxury v2 (`design/inspiration/README.md`), same family as `design/client-v2/`.

## Owner changes (2026-11-16, round 2)
1. ❌ **No approval workflow.** Jitu Bhaiya builds the blend and taps **Give remedy** → goes to the client and the office at once. No draft/review/approve states visible to him (drafts autosave silently).
2. ✏️ **Summary for client is optional** — a toggle in End session and a tab in Live session; never required.
3. ✏️ Remedy builder uses the **Bach Flower library** (owner said "36" — standard system is 38 + Rescue Remedy; library is configurable: he can hide flowers he doesn't use. **D-30 open**).
4. ➕ **Troubling emotions**: in each session he selects what is troubling the client (Anger, Insecurity, Loneliness, …) from an editable list. Stored per session; drives progress tracking.
5. ➕ **3-line progress summary since the last remedy**, shown to **both** consultant (CN-05, CN-13) and client (CL-08 Home, CL-26 My Remedies). AI-generated from data; client version never uses private notes.
6. ➕ (Client side) **Ask BeWise** chatbot — see `docs/specs/client/00-CLIENT-FLOW-AND-SCREENS.md` CL-55.

## Owner changes (2026-11-16, round 3)
7. 📱 **Phone first** (D-24 decided). iPad/laptop layouts (boards 00–15) remain as the larger-screen adaptation. Phone boards: `CN-phone-*`.
8. ➕ **Calendar sync with Google & Apple** (CN-28): two-way with Google (sessions added to his calendar; his busy times block client slots), Apple/iCloud via CalDAV connect, plus a private subscribe (ICS) link for any calendar app. Event details from his personal calendar are never stored — only busy/free.
9. ➕ **Me hub** (CN-29) — now also has a **Business** tile.
10. ➕ **Jitu Bhaiya sees sales & business overview** (owner, 2026-11-16) — read-only CN-30…32. No accounting/expenses/personal finance. on phone: Library · Follow-ups · Blend templates · My month · Calendar sync · My profile · Settings.

## Design intent
His day = **people, not paperwork**. A calm, private study: one thing at a time, everything about a client one tap away,
notes never lost, a remedy in under a minute. The system **never suggests or prescribes remedies** — it remembers,
organises, protects and summarises progress.

- **Device:** **phone first** (D-24 decided), iPad/laptop adaptation with left rail.
- **Privacy:** lock icon + "Only you can see this" on private notes; optional app lock (PIN / Face ID).
- **Speed:** dictation everywhere, autosave, Duplicate last blend, templates.

## Navigation
iPad/laptop rail: **Today · Clients · Calendar · Remedies · Library · Follow-ups** (avatar → Me).
Phone (primary): **Today · Clients · (+) · Calendar · Me** — + = Book for a client · Quick note · Give remedy. Live session on phone uses three tabs: **Notes 🔒 · Troubling · Summary (optional)**.

## Flow
```
START     Sign in → App lock → Today
BEFORE    Today → Session prep (3-line progress, her note, feelings, last troubling emotions, current blend)
DURING    Live session: timer · video · What's troubling her? (chips) · Private notes 🔒 · Summary (optional) · dictation
AFTER     End session (completed / no-show · follow-up · share summary? optional)
          → Remedy builder → Give remedy (client + office) → Remedy given
CLIENTS   Clients → Client profile (Overview · Sessions · Feelings · Remedies · Feedback · Notes 🔒) → Past session · Book for client
CALENDAR  Calendar → Availability → Time off → Reschedule
LISTEN    Follow-ups (WhatsApp nudge / Book) · Client notes & feedback
LIBRARY   Bach Flower library → Flower detail (client text + his private notes) · Blend templates
ME        My profile (what clients see) · Settings · My month
```

## Screens
| ID | Screen | Content | Board |
|---|---|---|---|
| CN-01 | Sign in | Logo panel, "Welcome back, *Jitu*", mobile + OTP, team only | 02 |
| CN-02 | App lock | PIN / Face ID | 02 |
| CN-03 | Today | Greeting, Next session hero (her note, Prepare / Start), day timeline, tiles: follow-ups due · new client notes · remedies being prepared | 00 |
| CN-04 | Notifications | Bookings, reschedules, client notes, remedy delivered | 03 |
| CN-05 | Session prep | **Progress since last remedy (3 lines)**, booking note, recent feelings, troubling emotions last time, current blend, Start | 03 |
| CN-06 | Live session | Timer, video link, **What's troubling her?** chips, Private notes 🔒 / Summary (optional) tabs, dictation, autosave, End session / Build remedy | 04 |
| CN-07 | Troubling emotions | Full sheet grouped (Fear & worry · Heart · Self · Energy · Temper), editable list | 05 |
| CN-08 | End session | Completed / No-show · follow-up 2/3/4/6 weeks / none · "Share a summary" toggle (optional) · Give remedy / Done | 05 |
| CN-09 | Remedy builder | Library (search, groups, recently used) + her blend (flowers, private reason 🔒, drops, times/day, weeks, bottle) · Duplicate last · Template · **Give remedy** | 06 |
| CN-10 | Remedy given | Success: sent to client · office preparing · delivered tracker | 07 |
| CN-11 | Blend templates | Saved starting blends, used-count, create/edit | 07 |
| CN-12 | Clients | Search, filters, rows with last/next session + latest feeling | 08 |
| CN-13 | Client profile | Tabs; Overview = 3-line progress, troubling emotions over time chart, current blend, next session | 08 |
| CN-14 | Past session | Troubling emotions, private notes, summary (shared or not), remedy given, her feedback | 09 |
| CN-15 | Book for client | Type, mode, slot, WhatsApp payment link toggle | 09 |
| CN-16 | Calendar | Day / week, online vs in-person blocks | 10 |
| CN-17 | Availability | Weekly hours per mode, buffer, booking window | 10 |
| CN-18 | Time off | Block dates, affected sessions, reschedule & notify | 11 |
| CN-19 | Reschedule | New slot + optional message | 11 |
| CN-20 | Follow-ups | Due / Overdue / Upcoming, WhatsApp nudge, Book | 12 |
| CN-21 | Client notes & feedback | Ratings, tags, notes clients wrote after sessions (CL-23) | 12 |
| CN-22 | Bach Flower library | Groups, search, soft 3D flower cards | 13 |
| CN-23 | Flower detail | Client-facing text + his private notes + active-blend count | 13 |
| CN-24 | My profile | What clients see on CL-12, preview. Real photo: `design/assets/people/jitu-bhaiya-square.jpg`. Fields: display name, title(s), experience, languages, quote, **website (www.jitendrakhimlani.com)**, Instagram — draft values in `docs/coordination/CONTENT-CHECKLIST.md` | 14 |
| CN-25 | Settings | Video link, app lock, reminders, daily summary | 14 |
| CN-26 | My month | Sessions, returning clients, rating, remedies given, top troubling emotions | 15 |
| CN-27 | Empty & states | Quiet day, offline (notes saved encrypted, sync later) | 15 |
| CN-28 | Calendar sync | Google (connected account, add sessions, block busy times), Apple/iCloud connect, subscribe link, privacy note | phone-07 |
| CN-30 | Business (read-only) | Sales this month vs last, consultations / remedies / shop split, to collect, daily sales chart | phone-11 |
| CN-31 | Best sellers | Shop vs remedies, product sales & units | phone-11 |
| CN-32 | Orders & stock (read-only) | Preparing / dispatched / delivered counts, running-low items — managed by Haresh | phone-11 |
| CN-33 | Session prep + AI case summary | Midnight card (4 lines), safety banner, flags (alcohol-free, allergy, meds), questions to explore | intake-06 |
| CN-34 | Her answers | Tabs Summary · Answers · Changes; body map; intensities | intake-06 |
| CN-35 | Flowers to consider | Deterministic reference list with reasons, + Add to blend; never shown to client (D-37) | intake-06 |
| CN-36 | Safety alert · intake-prefilled Troubling · Since last time | Priority notification, chips tagged 'from intake', AI progress note from check-in | intake-07 |
| CN-29 | Me (phone hub) | Avatar (real photo), tiles: Library, Follow-ups, Templates, My month, Calendar sync, My profile; Settings, Help, Sign out | phone-10 |

## Progress summary (both sides) — rules
- **Window:** from the last remedy given (or first session) → today. Refreshed daily and before each session.
- **Inputs (client version):** client's own journal emotions, ritual check-ins, troubling-emotion tags from sessions (worded gently), client feedback. **Never** private notes, reasons or rationale.
- **Inputs (consultant version):** the above + session troubling-emotion counts across sessions. Private notes are *not* sent to the AI by default (D-28).
- **Format:** exactly 3 short lines, factual, warm, no medical claims, no remedy suggestions. Labelled "Auto summary".
- If not enough data (< 3 journal entries): show "Not enough check-ins yet — log how you feel to see your progress."

## Open questions
- D-24 main device · D-30 36 vs 38 flowers · remedy payment status visible to him (default: status only) · in-app messaging (default: WhatsApp only).
