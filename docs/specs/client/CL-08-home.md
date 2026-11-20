# CL-08 Home · CL-09 Log a feeling · CL-56 Progress card

> **Owner:** CLIENT chat · Milestone **C2** · Status: **DRAFT v0.1 (2026-11-17)** · Board: `design/client-v4/CL4-board-00-home-feeling-journal.jpg` (style master), `CL4-board-04` (progress)
> Shared rules: `02-SHARED-UI-PATTERNS.md`. Decisions: D-19 (minimal journal), D-28 (progress), D-29 (Ask BeWise), D-43 (v4).

## CL-08 Home — `/app`

### Purpose
In 5 seconds the client knows: how they feel today (one tap), what happens next (one card), and that help is one tap away.

### Layout (top → bottom, 375 px)
1. **Header** — logo · Search · Bell (unread dot).
2. **Greeting** — "Hi {firstName}" (navy) / "how are you feeling today?" (grey). Time-aware variant is *not* used (owner D-42 applies to owner app only; keep "Hi").
3. **Ask BeWise card** — title "Ask BeWise", body "Your wise companion — answers about your remedy, journal and orders.", navy pill **Start a chat** → `/app/ask`. Mascot (pose: waving) right, overflowing the card top. Hidden when flag `ai_assistant` off.
4. **Today's mood card** — "Today's mood" / "Tap once to reflect. Takes 3 seconds." · 5 mood characters: **Calm · Joyful · Tired · Anxious · Sad** (board). Tap = log immediately (no sheet) with a soft check animation on the character + inline line "Logged at 9:41 AM · *Change*" ("Change" opens CL-09 prefilled). A "More feelings" ghost link opens CL-09 (all 8). If already logged today: show the last logged character selected + "Logged 3 times today" and still allow another tap.
5. **ONE contextual card** — highest priority wins (only one shown):

| Priority | Condition (server) | Card |
|---|---|---|
| 1 | Unpaid appointment hold < 15 min left | "Finish booking — your time is held for **mm:ss**" · **Pay ₹1,000** |
| 2 | Intake draft exists, no submitted intake | "Your answers are saved — finish in 3 minutes" · **Continue** |
| 3 | Appointment starts ≤ 60 min | "Your session begins in **8 minutes**" · **Join** (active 10 min before) / **Directions** |
| 4 | Remedy given & order not dispatched/paid | "Your remedy is ready" · **See your blend** (CL-25) |
| 5 | Past appointment without feedback (≤ 14 days) | "How was your session?" · **Share feedback** (CL-23) |
| 6 | Invoice due | "₹800 due on 25 Nov" · **Pay now** (CL-45) |
| 7 | Upcoming appointment | "Next session — Thu 21 Nov · 11:00 AM · Online with Jitendra Khimlani" + illustration · **View** |
| 8 | Follow-up due (`followup.due`) and none booked | "Time for your follow-up" · **Book follow-up** |
| 9 | New client, nothing booked | "Begin with a first consultation — ₹1,000, your remedy blend included" · **Book** |

6. **Today's ritual card** (only if a current blend exists) — "Today's ritual · 4 drops, 4 times a day" + 4 drop dots (filled = taken) · tap a dot = mark taken (writes ritual log, C5; hidden until C5 ships).
7. **Progress card (CL-56 compact)** — only if `getProgressSummary({audience:'client'})` returns lines: "Since your blend began" + first line + "See more" → My Remedies.
8. Bottom nav (Home active).

**Not on Home:** shop promos, product carousels, journal list, goals. ("nothing else" — flow spec.)

### Data (server component, one round-trip)
| Data | Source | Flag / fallback |
|---|---|---|
| firstName | `crm.getClient(currentClientId)` | — |
| Today's moods | `journal.listEntries({ from: startOfDayIST })` (own module) | `journal` |
| Contextual card | `client.home.getContextCard()` (CLIENT, composes: `scheduling.listAppointments`, `intake.getIntakeForm` draft status, `remedies.getCurrentRemedyForClient`, `scheduling.listSessionFeedback`, `finance.listInvoices`, `consultation.listFollowUps`) | each source behind its flag; failure of one source **skips** that rule, never breaks Home |
| Ritual | remedies/ritual (C5) | hidden |
| Progress | `progress.getProgressSummary` | hidden (no empty state on Home) |

### Events / writes
`journal.createEntry({ emotion, loggedAt: now(), source: 'home' })` → returns entry. Analytics `mood_logged{emotion, source:'home'}`.

### States
Loading: skeleton greeting + 3 card skeletons. Error in one card: card hidden. Whole page error: CL-52 pattern "We couldn't load your home — Try again". Offline: mood tap queued (IndexedDB) and shown as "Saved — will sync".

### Acceptance
- [ ] Exactly one contextual card; priority order as table; unit-tested rule function `pickHomeCard(state)`.
- [ ] Tap a mood → entry persisted with IST timestamp; second tap same minute creates a second entry (journal is a log, not a daily value).
- [ ] No practitioner notes, flower reasons or AI case text anywhere on Home.
- [ ] Lighthouse mobile ≥ 90; LCP element = greeting text (mascot lazy, `fetchpriority=low`).

---

## CL-09 Log a feeling — bottom sheet (from Home "More feelings", Journal "+", notification deep link `?log=1`)

| Element | Spec |
|---|---|
| Handle + title | "How are you *feeling*?" · sub "Today · 9:41 AM" (live clock; tap to change time — native time picker limited to today, not future) |
| Grid | 4 × 2 mood characters: Calm, Joyful, Grateful, Hopeful / Tired, Anxious, Sad, Irritated. Single select, selected = navy ring |
| CTA | **Save** (disabled until a selection) → `journal.createEntry({ emotion, loggedAt, source:'sheet' })` → sheet closes, toast "Logged · Calm" (after server OK) |
| Not included | notes, intensity, tags (D-19 minimal) |

Errors: save fails → sheet stays open, inline "Couldn't save — Try again"; offline → queued + toast "Saved — will sync".

---

## CL-56 Progress card — "Since your blend began"

Full version on My Remedies (C5) and board CL4-04 right; compact on Home.

| Element | Spec |
|---|---|
| Title | "Since your blend began" · sub "21 Nov → today" (`since`) |
| Lines | Exactly 3 rows, each = mood character inferred by keyword (calm/anxious/tired… else owl) + line text from `ProgressSummary.lines` (AI, client-safe, generated by CONSULTANT progress module) |
| Mood mix | Donut + legend of last 14 days' journal emotions (computed locally from own journal; %) with table alternative |
| Daily insight | One line, deterministic from journal (see Journal spec C2): e.g. "You've felt calm 3 days in a row. Lovely." — **not** medical, never mentions remedies working |
| Footnote | "Written with AI from your journal and check-ins · not medical advice" |

Hidden when no current blend or no summary. Never show `audience:'consultant'` summaries.
