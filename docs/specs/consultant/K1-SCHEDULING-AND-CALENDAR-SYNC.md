# K1 — Scheduling engine, holds, payments & calendar sync (spec v1)

> **Owner:** CONSULTANT · Module `scheduling` · Screens CN-15…CN-19, CN-28 · Contract `docs/03-CONTRACTS.md` §5 *scheduling*
> Decisions: D-08 (reschedule), D-09 (fees ₹1,000 / ₹800), D-14 (N consultants, 1 in UI), D-16 (no refunds), D-31 (calendar sync)
> Status: **SPEC — written before FOUNDATION ✅**. Code follows this file; any change here is logged in `docs/coordination/log/consultant.md`.

---

## 1. Goals & non-goals

| Goal | Measure |
|---|---|
| A client never sees a slot that cannot be booked | slot list = same pure function used to validate a hold |
| No double booking, ever | Postgres exclusion constraint is the last line of defence, not app code |
| A slot is held while the client pays | 15-min hold, released automatically |
| Jitendra Khimlani's personal calendar blocks client slots | Google free/busy + iCloud busy times, refreshed ≤ 10 min |
| His BeWise sessions show up in his own calendar | Pushed to a dedicated "BeWise sessions" calendar (Google / iCloud) + private ICS feed |
| Nothing private leaks to calendars | Event titles carry at most a first name; never notes, intake, remedy |

Non-goals (v1): group sessions, multiple rooms, recurring appointments, waitlist, client-side time zones other than IST (display only).

---

## 2. Tables (migration `<ts>_scheduling_core.sql`, header `-- @owner CONSULTANT @module scheduling`)

All tables: `id uuid pk default gen_random_uuid()`, audit columns, RLS on. Money in paise. Times `timestamptz`.

### 2.1 `consultation_types`  (fees/durations edited from Owner settings via `upsertConsultationType`)
| Column | Type | Notes |
|---|---|---|
| code | text unique | `first`, `followup` |
| name | text | "First consultation", "Follow-up" |
| duration_min | int check > 0 | **60 / 30** default (D-09 — durations to confirm) |
| fee_paise | bigint check ≥ 0 | **100000 / 80000** — `// @decision(D-09)` |
| includes_remedy | bool default true | D-02: remedy given after a paid session → ₹0 remedy order |
| modes_allowed | appointment_mode[] | default `{online,in_person}` |
| intake_required | text check in (`first`,`followup`,`none`) | `first` → full intake; `followup` → 2-min check-in (D-35) |
| eligibility | text check in (`new_client`,`returning_client`,`any`) | first = new_client, followup = returning_client |
| active | bool | |
| sort | int | |

### 2.2 `scheduling_preferences` (one row per consultant — **new table, additive, owned by scheduling**)
| Column | Default | Meaning |
|---|---|---|
| consultant_id (unique) | — | `staff_members.id` |
| gap_min | **10** | minimum gap after every session (and after an external busy block) |
| slot_step_min | **30** | candidate start times align to :00/:30 IST |
| min_notice_min | **720** (12 h) | earliest bookable start = now + notice |
| booking_window_days | **30** | latest bookable start |
| max_sessions_per_day | null | optional cap |
| hold_minutes | **15** | client checkout hold |
| consultant_hold_hours | **24** | hold when he books for a client and sends a WhatsApp payment link (CN-15) |
| late_payment_grace_min | **10** | captured payment after hold expiry still confirms if the slot is free |
| reschedule_free_hours | **24** | D-08 |
| reschedule_max_free | **3** | free reschedules per appointment (≥24 h) |
| calendar_title_style | `first_name` | `first_name` → "BeWise · Priya S." / `anonymous` → "BeWise session" |
| default_meeting_url | null | his Google Meet/Zoom room (D-09) |

### 2.3 `availability_rules`
| Column | Type | Notes |
|---|---|---|
| consultant_id | uuid | |
| weekday | smallint 1–7 | ISO, 1 = Monday |
| start_local / end_local | time | IST wall-clock, `end_local > start_local` (no overnight) |
| mode | appointment_mode null | null = both modes |
| valid_from / valid_to | date / date null | seasonal hours |
Overlapping rules for the same weekday+mode are merged (union) by the engine; UI (CN-17) prevents them anyway.

### 2.4 `availability_exceptions`
| Column | Type | Notes |
|---|---|---|
| consultant_id | uuid | |
| kind | text check in (`time_off`,`extra_hours`) | CN-18 = time_off |
| starts_at / ends_at | timestamptz | all-day = 00:00–24:00 IST |
| mode | appointment_mode null | for extra_hours |
| note | text | private to him |

### 2.5 `appointments`
| Column | Type | Notes |
|---|---|---|
| code | text unique | `BW-A-00001` (sequence) |
| client_id, consultant_id, consultation_type_id | uuid | |
| mode | appointment_mode | |
| status | appointment_status | enum from contracts §3 |
| starts_at, ends_at | timestamptz | `ends_at = starts_at + duration` |
| block | tstzrange **generated** `tstzrange(starts_at, ends_at + gap, '[)')` | gap snapshotted in `gap_min` column at hold time |
| gap_min | int | snapshot |
| hold_expires_at | timestamptz null | set while `pending_payment` |
| fee_paise | bigint | snapshot of type fee at hold time |
| paid_at, payment_id | timestamptz / uuid null | from `payment.captured` |
| needs_new_time | bool default false | paid after the slot was lost (§5.3) |
| intake_id | uuid null | via `attachIntakeToAppointment` |
| client_note | text null `// @sensitive` | CL-15 booking note, consultant-only |
| meeting_url | text null | online sessions |
| source | text check in (`client`,`consultant`,`manager`) | |
| free_reschedules_used | smallint default 0 | |
| late_reschedule_used | bool default false | |
| cancel_reason | text null | |
| external_refs | jsonb default '{}' | `{ google: {eventId, calendarId}, apple: {href, etag} }` |
| row_version | int | optimistic concurrency for UI edits |

**No double booking — exclusion constraint** (needs `btree_gist`, requested from HUB):
```sql
alter table appointments add constraint appointments_no_overlap
  exclude using gist (consultant_id with =, block with &&)
  where (status in ('pending_payment','confirmed','checked_in','in_session','completed'));
```
Expired holds are flipped to `expired` before any insert (§4.2), so a stale hold never blocks a slot.

### 2.6 `appointment_history` (append-only)
`appointment_id, at, actor_profile_id, actor_role, action, from_status, to_status, from_starts_at, to_starts_at, reason, meta jsonb`.
Actions: `held · confirmed · payment_failed · expired · paid_after_expiry · rescheduled · cancelled · checked_in · started · completed · no_show · note_edited`.

### 2.7 `session_feedback` (CL-23 → CN-21)
`appointment_id unique, client_id, consultant_id, rating smallint 1–5, tags text[], notes_for_consultant text null // @sensitive, submitted_at, edited_at`. Owner analytics sees `rating` only (view `analytics.v_session_ratings`).

### 2.8 Calendar tables
| Table | Columns | Privacy |
|---|---|---|
| `calendar_connections` | `consultant_id, provider ('google'\|'apple'), account_label, status ('active'\|'error'\|'revoked'), secret_ref` (Supabase Vault id → OAuth refresh token / Apple app password), `read_calendar_ids text[], write_calendar_id, push_sessions bool, block_busy bool, last_synced_at, last_error, apple_principal_url, apple_home_url` | secret never leaves the server; `secret_ref` column not selectable by any client role |
| `external_busy_blocks` | `connection_id, consultant_id, starts_at, ends_at` | **start/end only** — no title, no attendees, no location, no event id (D-31) |
| `calendar_feed_tokens` | `consultant_id, token_hash (sha256), created_at, revoked_at, last_accessed_at` | raw token shown once |

### 2.9 RLS summary
| Table | client | consultant | manager | owner |
|---|---|---|---|---|
| consultation_types | read active | read | read | read (write via function) |
| availability_*, scheduling_preferences | — | own rw | read | read |
| appointments | own rows, **without** `client_note` of others (only own) | own consultant_id | all (no `client_note` — column privilege revoked, view `ops.v_appointments`) | all (no `client_note`) |
| appointment_history | own appointment | own | all | all |
| session_feedback | own rw | own appointments | ❌ | rating via analytics view |
| calendar_* | ❌ | own (no `secret_ref`) | ❌ | ❌ |

---

## 3. Slot engine — `computeSlots()` (pure function, unit-tested)

`getAvailableSlots(q)` loads data in 4 queries, then calls a **pure** function so the same code validates holds and reschedules.

```ts
// src/modules/scheduling/slots.ts
type Interval = { start: number; end: number }            // epoch ms, half-open [start, end)
type SlotInput = {
  now: number
  type: { durationMin: number; modesAllowed: AppointmentMode[] }
  mode: AppointmentMode
  prefs: { gapMin; slotStepMin; minNoticeMin; bookingWindowDays; maxSessionsPerDay: number | null }
  rules: AvailabilityRule[]                                 // weekday, startLocal, endLocal, mode, validFrom, validTo
  exceptions: AvailabilityException[]
  busy: Interval[]          // existing appointments' block ranges (already include their gap)
  external: Interval[]      // external busy blocks, raw
  from: string; to: string  // IST dates 'YYYY-MM-DD', inclusive
}
type Slot = { startsAt: string; endsAt: string; mode: AppointmentMode; consultantId: string }
```

**Algorithm** (all date math through one helper `istToUtc(date, time)`; IST is fixed +05:30 but always via `date-fns-tz`/Temporal, never hand-added):
1. `mode ∉ type.modesAllowed` → `[]`.
2. Window: `lo = max(startOf(from IST), now + minNotice)`, `hi = min(endOf(to IST), startOfDay(today IST) + bookingWindowDays + 1d)`. Range capped at 31 days (`RANGE_TOO_LARGE`).
3. For each IST date `d` in `[lo, hi]`:
   1. **Open** = union of rules where `weekday(d)` matches, `validFrom ≤ d ≤ validTo`, `rule.mode ∈ {null, mode}` → converted to UTC intervals.
   2. Open ∪= `extra_hours` exceptions (mode null or equal) overlapping `d`.
   3. Open −= `time_off` exceptions.
   4. **Blocked** = `busy` ∪ `external.map(e => [e.start, e.end + gap])`.
   5. Candidates: `s` from each open interval's start rounded **up** to the next multiple of `slotStepMin` (aligned to IST midnight), stepping `slotStepMin`, while `s + duration ≤ open.end`.
   6. Keep `s` if `s ≥ lo` and `[s, s + duration + gap)` overlaps no **Blocked** interval. (Gap after the candidate is part of its range; gap after existing sessions/externals is part of theirs → symmetric spacing.)
   7. If `maxSessionsPerDay` and `count(busy sessions starting on d) ≥ max` → drop the day.
4. Return sorted ascending; de-duplicate.

**Properties tested** (Vitest + fast-check):
- every returned slot passes `isSlotBookable(slot, sameInput)`;
- no slot overlaps a busy/external block or violates the gap;
- no slot before `now + minNotice` or after the window;
- time_off fully removes slots; extra_hours adds them;
- IST day boundaries (23:30 IST session, rules ending 24:00) correct;
- 60-min first consultation vs 30-min follow-up on the same rules.

Performance: ≤ 31 days × ~20 candidates/day — in-memory, < 5 ms. Queries index on `(consultant_id, starts_at)` and `block` (gist).

`Slot.isPreferred` (optional, contract-additive): first available slot of each day → UI can highlight. Not needed for v1.

---

## 4. Holds & booking

### 4.1 `holdAppointment(input)` — contract v1 (signature unchanged)
```
requirePermission('scheduling.appointment.create')   // client: own clientId only; consultant/manager: any client
validate: type active, mode allowed, eligibility (first → client has no completed/confirmed first session; followup → has ≥1 completed)
tx:
  pg_advisory_xact_lock(hashtext('sched:' || consultantId))
  update appointments set status='expired' where consultant_id=$c and status='pending_payment' and hold_expires_at < now()
       → history 'expired' + emit appointment.expired (additive event) for each
  release this client's other active holds (one live hold per client) → status 'expired'
  re-run computeSlots for that IST day; slot must be present → else SLOT_TAKEN
  insert appointment (status 'pending_payment', fee snapshot, gap snapshot,
         hold_expires_at = now() + (source='consultant' ? consultant_hold_hours : hold_minutes))
  on exclusion violation (23P01) → SLOT_TAKEN
  history 'held' · emit appointment.held { appointmentId, clientId, holdExpiresAt }
return { appointmentId, holdExpiresAt, amountPaise: fee_paise }
```
Errors (`Result.error.code`): `SLOT_TAKEN`, `SLOT_OUTSIDE_AVAILABILITY`, `TYPE_NOT_ELIGIBLE`, `MODE_NOT_ALLOWED`, `INTAKE_REQUIRED` (only enforced at confirm time, see 4.3), `FORBIDDEN`.

Booking sequence (CLIENT C2): `getAvailableSlots → holdAppointment → attachIntakeToAppointment → finance.createCheckout({purpose:'appointment', refId}) → Razorpay → webhook → payment.captured → (us) confirm`.
Fee is **₹0 for nobody** in v1 — there is no free type; dev builds expose `@stub markAppointmentPaid()` behind flag `booking` (removed before prod).

### 4.2 Expiry
- Lazy (inside every hold, §4.1) **and** cron `/api/cron/scheduling-expire` every minute: `pending_payment && hold_expires_at < now()` → `expired`, history, `appointment.expired { appointmentId, clientId }`.
- Client UI shows the countdown from `holdExpiresAt`; at 0 it calls `getAppointment` and offers "Pick a time again".

### 4.3 `// @handles payment.captured` (idempotent by `event.id` via `event_handler_runs`)
```
if !payload.appointmentId → ignore
a = select … for update
case a.status:
  'confirmed' (same payment)        → no-op
  'pending_payment'                 → confirm
  'expired' and now ≤ hold_expires_at + late_payment_grace and slot still free (exclusion check) → confirm
  'expired' otherwise               → paid_at, payment_id, needs_new_time = true, history 'paid_after_expiry',
                                      emit appointment.needs_new_time { appointmentId, clientId }  (additive) — no refund (D-16):
                                      client/manager picks a new time via rescheduleAppointment (expired+paid → confirmed)
confirm = status 'confirmed', paid_at, payment_id, hold_expires_at null, meeting_url = prefs.default_meeting_url (online),
          history 'confirmed', emit appointment.confirmed { appointmentId, clientId, consultantId, startsAt, mode }
          → calendar push (§6) and notifications (OWNER) consume it
```
`payment.failed` → history `payment_failed` only; the hold stays until expiry so the client can retry.

Intake gate: confirmation does **not** wait for intake; if `consultation_types.intake_required ≠ 'none'` and no intake is attached at confirm time, emit nothing extra — the reminder lives in CLIENT (IN-xx) / OWNER notifications; CN-05 shows "Intake not filled yet". (Blocking a paid booking on a form would strand money with no refunds.)

---

## 5. Reschedule, cancel, no-show (D-08, D-16)

### 5.1 State machine (only these transitions; everything else → `INVALID_TRANSITION`)
```
pending_payment → confirmed | expired | cancelled(client abandons)
expired(+paid)  → confirmed (via reschedule to a new slot)
confirmed       → confirmed (reschedule) | checked_in | in_session | no_show | cancelled
checked_in      → in_session | no_show
in_session      → completed
confirmed       → completed  (he ends a session he never pressed Start on)
```
`no_show` allowed only after `starts_at + 15 min`. `completed`/`no_show`/`cancelled`/`expired(unpaid)` are terminal.

### 5.2 `rescheduleAppointment({ appointmentId, startsAt, reason? })`
| Actor | Rule |
|---|---|
| Client, ≥ `reschedule_free_hours` before start | allowed while `free_reschedules_used < reschedule_max_free` → counter +1 |
| Client, < 24 h before start | allowed **once** (`late_reschedule_used = false → true`) |
| Client, after start / no_show | `RESCHEDULE_NOT_ALLOWED` (no-show forfeits — D-08) |
| Consultant / manager | always allowed, counters untouched, reason required when < 24 h |
| Expired + paid (`needs_new_time`) | allowed for client/manager, any time, → `confirmed` |

Same lock + `computeSlots` + exclusion path as holds (the appointment's own block is excluded from `busy`). Same type; mode may change if allowed. Emits `appointment.rescheduled { appointmentId, fromStartsAt, toStartsAt, by }`; calendar events patched.

### 5.3 `cancelAppointment({ appointmentId, reason })` — contract signature kept
- Always returns `{ refundEligiblePaise: 0 }` — `// @decision(D-16)` no refunds. `appointment.cancelled.refundEligiblePaise = 0`.
- Client: UI steers to Reschedule first (CL); cancelling a paid session forfeits the fee — copy says so before confirm.
- Consultant/manager: allowed with reason; for a **paid** appointment we set `needs_new_time = true` instead of cancelling (so the client keeps their session) unless the client asked to cancel — `// @decision(D-08)`; owner to confirm.

### 5.4 Time off with booked sessions (CN-18)
`previewTimeOff({ startsAt, endsAt })` → affected confirmed appointments. Saving time off never auto-cancels; each affected session gets a "Reschedule & notify" action (CN-19). Until moved, they stay confirmed and are shown red in CN-16.

### 5.5 Other functions in this milestone
`listConsultationTypes`, `upsertConsultationType` (OWNER caller; validates fee ≥ 0, duration 15–180, writes audit), `listAppointments` (RLS-scoped, paged, filters: date range, status, clientId), `getAppointment`, `checkInAppointment` (manager desk; in_person only; within 60 min of start), `submitSessionFeedback` (client; only after `completed`; editable for 14 days), `listSessionFeedback`. Internal for K1 UI: `saveAvailabilityRules`, `saveException`, `previewTimeOff`, `updateSchedulingPreferences`, `markNoShow`.

---

## 6. Calendar sync (D-31) — CN-28

BeWise is the **source of truth** for sessions. External calendars contribute **busy times only**.

### 6.1 Google (OAuth 2.0, web-server flow, `access_type=offline`, `prompt=consent`)
- Scopes (least privilege): `https://www.googleapis.com/auth/calendar.freebusy` (pull busy) + `https://www.googleapis.com/auth/calendar.app.created` (create and manage only the calendar we create). If `calendar.app.created` is unavailable for the project, fall back to `calendar.events` + `calendar.calendarlist.readonly` (decide at build time; logged).
- `connectCalendar({ provider:'google', authCode })` → exchange code, store refresh token in **Supabase Vault** (`secret_ref`), create secondary calendar **"BeWise sessions"** (timezone Asia/Kolkata), save its id as `write_calendar_id`, default `read_calendar_ids = ['primary']` (he can tick others in CN-28).
- **Pull** (every 10 min via `/api/cron/calendar-sync`, plus on demand when slots are requested and `last_synced_at` > 10 min old — fire-and-forget): `freebusy.query` over `[now, now + booking_window_days]` for `read_calendar_ids` **excluding** `write_calendar_id` (so our own sessions don't double-block). Replace this connection's `external_busy_blocks` in one transaction. FreeBusy returns only ranges → no titles ever reach us.
- **Push** (`// @handles appointment.confirmed | appointment.rescheduled | appointment.cancelled | appointment.no_show`): `events.insert/patch/delete` on `write_calendar_id` with `extendedProperties.private.bewiseAppointmentId` (idempotency), title per `calendar_title_style`, description = `https://<app>/consult/appointments/<id>` + meeting link, location = studio address for in-person. **Never** notes, intake, concerns, remedy, phone, email.
- If he deletes a BeWise event in Google, the next sync recreates it (a paid session can't be cancelled from a personal calendar); CN-28 explains this.
- Errors: `invalid_grant` → status `revoked`, in-app notice "Reconnect Google"; 5xx/429 → exponential backoff, `last_error`. While not syncing, CN-16/CN-28 show a banner "Your Google busy times may not be blocking client slots".

### 6.2 Apple iCloud (CalDAV)
- `connectCalendar({ provider:'apple', appleId, appPassword })` — app-specific password (appleid.apple.com), stored in Vault. Library: `tsdav` (CalDAV + iCloud discovery). Discover principal → calendar-home-set → calendars; create **"BeWise sessions"** via `MKCALENDAR` (fallback: he picks an existing one).
- **Pull**: `REPORT calendar-query` with `time-range` + `expand` over the window for selected calendars (minus the write calendar); parse **only** `DTSTART/DTEND/TRANSP/STATUS` (skip `TRANSPARENT` and `CANCELLED`); everything else is discarded in memory, never logged.
- **Push**: `PUT <home>/<cal>/<appointmentId>.ics` with `UID: <appointmentId>@bewise`, `If-Match` etag for updates, `DELETE` on cancel.
- Auth failure (401) → `revoked`, reconnect prompt.

### 6.3 Private ICS feed
- `getCalendarFeedUrl()` → creates (or returns existing) token: 32 random bytes base64url, store sha256; URL `https://<app>/api/calendar/feed/<token>.ics`. Raw token shown only on create/regenerate; "Regenerate link" revokes the old one.
- Route (scheduling-owned) returns VCALENDAR of his `confirmed/checked_in/in_session/completed` appointments in `[-30 d, +window]`, minimal VEVENTs (title per style, link, mode), `Cache-Control: private, max-age=300`, rate-limited (60/h per token), `last_accessed_at` updated. Unknown/revoked token → 404 (no oracle).

### 6.4 `syncCalendar(connectionId)` — contract v1
Runs pull + reconciles push for confirmed future appointments missing `external_refs` → `{ pushed, busyBlocks }`. Called by cron (all active connections) and by CN-28 "Sync now".

### 6.5 Hold-time recheck
`holdAppointment` uses the stored `external_busy_blocks` (no live API call in the booking path — Google/Apple outages must not break booking). Worst case: a personal event created < 10 min ago is not yet blocking; acceptable and disclosed in CN-28.

---

## 7. Events (emit inside the same tx via `emitEvent`)
| Event | Payload | Note |
|---|---|---|
| `appointment.held` | `appointmentId, clientId, holdExpiresAt` | contract |
| `appointment.confirmed` | `appointmentId, clientId, consultantId, startsAt, mode` | contract |
| `appointment.rescheduled` | `appointmentId, fromStartsAt, toStartsAt, by` | contract |
| `appointment.cancelled` | `appointmentId, by, reason, refundEligiblePaise: 0` | contract (always 0, D-16) |
| `appointment.no_show` | `appointmentId` | contract |
| `appointment.completed` | `appointmentId, consultationRecordId` | emitted in K4 (End session) |
| `appointment.expired` | `appointmentId, clientId` | **additive** |
| `appointment.needs_new_time` | `appointmentId, clientId` | **additive** (paid after hold lost) |
| `session_feedback.submitted` | `feedbackId, appointmentId, clientId, consultantId, rating` | contract — no tags/notes in payload |

Handles: `payment.captured`, `payment.failed` (§4.3); later `shipment.delivered` (K4/K6 follow-up clock).

---

## 8. Screens in K1 (phone first; boards `CN-phone-06/07`, iPad `CN-board-10/11`)
| ID | Key behaviour |
|---|---|
| CN-15 Book for client | client search → type (eligibility enforced) → mode → slot grid (same `getAvailableSlots`) → optional note → toggle "Send WhatsApp payment link" (on: 24 h hold + finance payment link; off: 15-min hold for paying now on his phone) |
| CN-16 Calendar | day/week; online vs in-person colours **and** icons; external busy shown as grey "Busy (Google)" with no detail; pending holds dashed |
| CN-17 Availability | weekly hours per mode, gap, notice, window, max/day; live preview "Next 7 days: 23 slots" |
| CN-18 Time off | date range / all-day, affected sessions list → CN-19 |
| CN-19 Reschedule | new slot grid, message to client (optional), shows policy result for client-initiated cases |
| CN-28 Calendar sync | Google connect/disconnect, calendars to read, push toggle, last synced; Apple connect (Apple ID + app password how-to); ICS link copy/regenerate; privacy note "We only read when you're busy — never what's in your calendar" |

Each: loading skeleton · empty · error with retry · offline (read-only cached view of today/week, no edits) · no-permission.

---

## 9. Tests (definition of done)
- **Unit:** `computeSlots` property tests (§3), transition table, reschedule policy matrix (actor × hours-before × counters), fee snapshot, ICS rendering (no private fields), title style.
- **DB:** exclusion constraint under 20 concurrent `holdAppointment` for one slot → exactly 1 success; expired holds don't block; RLS: manager cannot select `client_note`; client cannot read other clients' rows; `external_busy_blocks` has no text columns.
- **Handlers:** `payment.captured` twice → one confirmation; late payment within grace; late payment slot lost → `needs_new_time`.
- **Integration (mocked Google/CalDAV):** freebusy → blocks replaced; own write calendar excluded; revoked token path.
- **E2E (Playwright, consultant side):** set availability → client sees slots → hold → stub pay → appears on Today & Calendar.

## 10. Open items (defaults used meanwhile)
| # | Question | Default |
|---|---|---|
| 1 | Durations 60 / 30 min (D-09) | 60 / 30 |
| 2 | Free reschedules ≥24 h: unlimited or capped? | capped at 3 |
| 3 | Can Jitendra Khimlani confirm a booking without online payment (cash / complimentary)? | No — needs owner decision + finance `recordPayment` path |
| 4 | Consultant-initiated cancel of a paid session | becomes "needs new time", not a cancellation |
| 5 | Calendar event title shows client first name + initial? | yes (`first_name`), switchable to anonymous in CN-28 |
| 6 | Google OAuth client + Apple app-specific password | CONTENT-CHECKLIST #8a — needed before CN-28 works outside dev |
