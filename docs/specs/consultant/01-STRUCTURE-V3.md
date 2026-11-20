# Consultant app — structure v3 (owner, from Jitu Bhaiya, 2026-11-20)

> **Owner:** CONSULTANT · Supersedes the navigation and booking parts of `00-CONSULTANT-FLOW-AND-SCREENS.md` · Built in `prototypes/consultant-app/` (live preview `preview/consultant/`).

## 1. What Jitu Bhaiya asked for → where it is
| # | Ask | Built as |
|---|---|---|
| 1 | First thing: **all today's appointments** | Today, block 1: every session today with one action each (Check in → Start → Open / Give remedy), type badge, video-link state, check-in form state |
| 2 | **Mood board** of people, missed remedy first, tap → all details | Today block 3 (strip) + **People** tab = mood board (latest feeling per person), groups: Missed remedy · Ends this week · Ends in 1–2 weeks · On a remedy · Scanning · Everyone · Archived |
| 3 | **Remedy about to end** (within a week / over a week), **archive** people | Today block 4 with two tabs, Message / Book / Archive per person; Archived group restores them |
| 4 | Clients **chat** with him in the app | **Messages** tab: inbox, conversation, quick replies, unread badge on the tab |
| 5 | **Dashboard**: how many take the remedy, message them personally | **Dashboard** tab: on a remedy now, split regular / missing days / not logging, ending soon; personal Message per person; impact, week, kind words, growth charts |
| 6 | **Finance board**: which products bring money, today's sales, profit | **Finance** tab (read-only, D-33): today's sales and profit, month revenue and profit vs last month, by source, by product (revenue / profit toggle), daily bars |
| 7 | Two appointment types, **Scanning** and **Bach flower**, easy to tell apart | `service: 'bach' | 'scanning'` on every appointment; one badge everywhere (Bach = sage + flower icon, Scanning = violet + scan icon) |
| 8 | Scanning = **notes history** only + **AI summary** of all notes | Scanning session = notes only, End → "End and save notes" (no remedy); profile shows notes timeline + summary (themes, last note, what to follow up). Live app: Claude summary (K6) |
| 9 | Manager and Jitu Bhaiya both create both types, **express** too | **New appointment** sheet: type → person → online/in person (+ link) → time (express = next free usual times) → greet & confirm. Manager app: request filed |
| 10 | Online: **add a link**, shared with the client on WhatsApp | Link field when booking + on every online session (Use my room / paste), Share on WhatsApp, shown in the client app |
| 11 | His timings are **never fixed**: clients only **request**; Haresh bhai / Shivani di call and assign a time; client gets it on WhatsApp and in the app | Clients send a request (type, mode, preferred time, note). Today block 2 "Asking for a time": Call + Assign → any time 7 AM–10 PM, clashes blocked → greet & confirm → WhatsApp + in-app, payment link follows automatically |

## 2. Rules
- **Scanning** fee: placeholder ₹1,200, 45 min (owner to set). Bach flower: ₹1,000 / ₹800, 60 / 30 min, remedy included (D-02, D-09).
- **Time picking:** any time 7 AM–10 PM in 15-minute steps; a 10-minute gap after every session; Express suggests the next free times in his usual hours (10–1, 4–8). Availability rules are no longer shown to clients.
- **Remedy end** = day given + blend weeks (default 3). "Within a week" = 0–7 days left; "1–2 weeks" = 8–14.
- **Missed remedy** = 3 or more of the last 7 days not ticked "took my drops" (client app).
- **Archive** hides a person from the mood board, remedy lists and dashboard; nothing is deleted; restorable.
- **Messages:** his replies never change medicines; he points to the doctor. Private to him and the client (not the office).
- **Finance:** read-only, aggregates only; profit = sales − product/remedy cost (gross).

## 3. Backend changes (api/, my modules) — next step, together with wiring (HUB P0 request)
| Need | Change |
|---|---|
| Scanning type | `consultation_types` row `scanning` (minutes 45, fee from owner, `includes_remedy = 0`) — the type id is the service; no schema change |
| Requests | client `scheduling.requestAppointment {consultationTypeId, mode, preferred, note?}` → appointment with `starts_at = NULL` (already allowed, status `pending_payment`, `payment_status = 'unpaid'`); staff `scheduling.listRequests` · `scheduling.assignTime {appointmentId, startsAt, meetingUrl?, greeting}` → emits `appointment.time_assigned` (WhatsApp + in-app + payment link) |
| Meeting link | `scheduling.setMeetingUrl {appointmentId, url}` (column exists) → `appointment.link_shared` |
| Messages | new module **messaging** (CONSULTANT): table `client_messages (id, client_id, from_role, body, created_at, read_at)`; `messaging.listThreads` · `listMessages {clientId}` · `send {clientId, body}` · `markRead {clientId}`; client side by CLIENT |
| Archive | CRM (MANAGER) `clients.archived_at` + `crm.setArchived {clientId, archived}` — request filed |
| Remedy end | from `formulas.days` (given in `giveRemedy`) — `remedies.listActiveBlends` returns `endsOn` |
| Finance | `finance.getSalesSummary {from, to}` must return by product (units, revenue, cost) + by source + daily — request filed to OWNER |
