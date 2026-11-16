# Consultant Workspace (Jitu Bhaiya) — Flow & Screen List (v1 draft)

> **Owner:** HUB (designed with the business owner). Status: **DRAFT — waiting for owner feedback.**
> Supersedes K-01…K-11 in `docs/02-FLOWS-AND-SCREENS.md` once approved. Screen IDs `CN-xx` are stable.
> Visual direction: Quiet Luxury v2 (`design/inspiration/README.md`), same family as `design/client-v2/`.
> Boards: `design/consultant-v2/`.

## Design intent (how it should feel)
Jitu Bhaiya's day = **people, not paperwork**. The workspace should feel like a calm, private study:
one thing at a time, everything about a client one tap away, writing that never gets lost, and remedies
he can build in under a minute. The system **never suggests or prescribes** — it remembers, organises and protects.

- **Device:** iPad / laptop first (landscape, left rail), fully usable on phone (bottom nav, + button for quick actions).
- **Privacy:** private notes always marked with a lock and "Only you can see this". Optional app lock (PIN / Face ID).
- **Speed:** dictation in every note field, autosave every few seconds, "duplicate last blend", templates.

## Navigation
- iPad/laptop: slim frosted left rail — **Today · Clients · Calendar · Remedies · Library · Follow-ups**, avatar → Me.
- Phone: floating nav — **Today · Clients · (+) · Calendar · Me**. The + opens: Book for a client · Quick note · New blend.

## Flow at a glance
```
START      Sign in → (App lock) → Today
BEFORE     Today → Session prep (her note, recent feelings, last summary, current blend, last feedback)
DURING     Live session (timer, video link, Private notes / Summary for client, dictation)
AFTER      End session (completed / no-show, follow-up in N weeks) → Remedy builder → Preview as client
           → Approve & send to office → Share summary with client
CLIENTS    Clients → Client profile (Overview · Sessions · Feelings · Remedies · Feedback · Notes) → Past session
CALENDAR   Calendar (day/week) → Availability (weekly hours, online / in person) → Time off → Reschedule for client
FOLLOW-UP  Follow-ups (due / overdue / upcoming) → WhatsApp nudge or Book for client
LIBRARY    Bach Flower library (38, 7 groups) → Flower detail (approved text + his own notes) · Blend templates
LISTEN     Client notes & feedback (ratings + notes clients wrote after sessions)
ME         Profile (what clients see on CL-12) · Settings · My month (gentle stats)
```

## Screens

### A. Start
| ID | Screen | Content |
|---|---|---|
| CN-01 | Sign in | Owl mark, "Welcome back, *Jitu*", phone / email + OTP, staff only |
| CN-02 | App lock | PIN / Face ID to protect client notes on shared devices (optional, recommended) |

### B. Today
| ID | Screen | Content |
|---|---|---|
| CN-03 | Today | Greeting · hero **Next session** card (client, type, time, mode, her booking note, Prepare / Start) · day timeline with dots (sessions + free slots) · three quiet tiles: blends to approve · follow-ups due · new notes from clients |
| CN-04 | Notifications | New booking, reschedule, cancellation, client note/feedback, payment for remedy received |

### C. Session
| ID | Screen | Content |
|---|---|---|
| CN-05 | Session prep | One calm page before the session: her booking note · recent feelings (owl faces, last 14 days) · last session summary · current blend · last feedback & notes · "Start session" |
| CN-06 | Live session | Timer, Open video call, left mini-panel (her note, feelings, current blend), main writing area with **Private notes 🔒** / **Summary for client** tabs, dictation, autosave |
| CN-07 | End session | Mark Completed / No-show · follow-up in 2 / 3 / 4 / 6 weeks (or none) · next: Build remedy / Share summary / Done |
| CN-08 | Share summary | Final edit of the client summary, preview exactly as client sees it (CL-24), Share |

### D. Remedies
| ID | Screen | Content |
|---|---|---|
| CN-09 | Remedy builder | Left: 38 flowers by 7 groups, search, recently used · Right: the blend — flowers, private reason per flower 🔒, drops × times a day, duration, bottle size · Duplicate last blend · Use template |
| CN-10 | Preview as client | Exactly what CL-25/CL-26 will show (names, gentle descriptions, ritual). No reasons/notes |
| CN-11 | Approve & send | Confirmation sheet: client, blend, version, price/included → "Approve & send to office" → success with "Share summary" |
| CN-12 | Blend templates | Saved starting blends (e.g. "Exam season", "Big change"), create / edit |
| CN-13 | Blends awaiting action | Drafts not yet approved, sent-to-office status (preparing / dispatched / delivered) |

### E. Clients
| ID | Screen | Content |
|---|---|---|
| CN-14 | Clients | Search (name / phone / ID), filters (Upcoming, Follow-up due, New, All), rows with avatar, last & next session, latest feeling face |
| CN-15 | Client profile | Header (name, ID, age, city, since) + tabs: **Overview** (next session, current blend, feelings trend, latest feedback) · **Sessions** · **Feelings** (journal, if shared) · **Remedies** (versions) · **Feedback** (her notes & ratings) · **Notes** 🔒 |
| CN-16 | Past session | Date, private notes, shared summary, blend given, her feedback for that session |
| CN-17 | Book for client | Pick type, mode, slot; payment link sent to client (or mark paid offline) |

### F. Calendar
| ID | Screen | Content |
|---|---|---|
| CN-18 | Calendar | Day / week views, sessions as soft blocks coloured by mode, tap → session prep |
| CN-19 | Availability | Weekly hours per day, online / in person per block, buffer between sessions, booking window |
| CN-20 | Time off | Block dates / half-days, affected sessions listed with "Reschedule & notify" |
| CN-21 | Reschedule | Move a session, client notified automatically |

### G. Follow-ups & listening
| ID | Screen | Content |
|---|---|---|
| CN-22 | Follow-ups | Due / Overdue / Upcoming; each: client, last session, blend end date · WhatsApp nudge · Book for client |
| CN-23 | Client notes & feedback | Inbox of notes and ratings clients left after sessions (CL-23); mark read; open client |

### H. Library
| ID | Screen | Content |
|---|---|---|
| CN-24 | Bach Flower library | 38 flowers in 7 groups, soft 3D/illustrated flower, search |
| CN-25 | Flower detail | Approved description (shown to clients) · **his own notes** 🔒 · used in N active blends |

### I. Me
| ID | Screen | Content |
|---|---|---|
| CN-26 | My profile | What clients see on CL-12: portrait, approach, years, languages, quote — edit & preview |
| CN-27 | Settings | Video link, session reminders, notification preferences, app lock, sign out |
| CN-28 | My month | Gentle stats: sessions held, returning clients, average session rating, blends sent |

### J. States
| ID | Screen | Content |
|---|---|---|
| CN-29 | Empty & states | No sessions today (calm free day), no follow-ups, offline (notes saved locally, encrypted, sync later) |

## Proposed additions (expert recommendations — owner to confirm)
1. **Session prep page** (CN-05) — everything he needs 2 minutes before a session on one calm page.
2. **Dictation** in all note fields — speak notes between sessions instead of typing.
3. **App lock** (CN-02) — protects sensitive notes if the iPad is shared or left open.
4. **Blend templates** (CN-12) and **Duplicate last blend** — 30-second remedy building.
5. **My month** (CN-28) — gentle, non-competitive stats.
6. **Feelings tab** shows the client's owl-face journal only if the client shares it (D-15).

## Open questions for the owner
- Which device does Jitu Bhaiya use most — **iPad, laptop or phone**? (Designs are iPad-first with phone versions.)
- Should he see **remedy payment status** (paid / not paid) for his clients? Default: yes, status only, no amounts.
- Should he be able to **message clients** inside the app, or only via WhatsApp? Default: WhatsApp nudge only.
