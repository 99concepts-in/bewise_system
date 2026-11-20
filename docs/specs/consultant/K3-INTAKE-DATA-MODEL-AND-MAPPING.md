# K3 — Intake data model, mapping table, flags & safety (spec v1)

> **Owner:** CONSULTANT · Module `intake` (data, mapping, AI, safety) · CLIENT builds IN-01…IN-12 UI · Consultant screens CN-33…CN-36
> Source: `docs/specs/client/01-INTAKE-CASE-TAKING.md` (question bank §3, mapping §4, AI §5, safety §6, privacy §8)
> Decisions: D-35 (intake), D-36 (AI case summary), D-37 (flowers to consider — Jitu only), D-38 (safety alert — Jitu only), D-03 (owner can't read)
> Status: **SPEC — written before FOUNDATION ✅**. AI prompts/schemas live in `K6-AI-PROMPTS-AND-SCHEMAS.md`.

---

## 1. Principles
1. **The client form never contains flower names.** `getIntakeForm()` returns statements as plain text only; the statement→flower link is consultant-only data.
2. **Answers are encrypted at rest** (application-level AES-256-GCM envelope via HUB `lib/crypto`, key id stored with each row). Decrypted only inside `src/modules/intake` after `requirePermission` + an `audit_logs` `view_sensitive` row.
3. **Deterministic first, AI second.** Flags and flowers-to-consider are computed by code from answers + mapping. AI only writes prose (summary, questions, progress note) and never decides anything.
4. **Mapping is data, not code.** Jitendra Khimlani edits wording and flowers in-app; every edit is versioned; old answers keep their meaning.
5. Nothing from answers, flags' text, or mapping reasons goes into events, logs, analytics or notifications (`// @sensitive`).

---

## 2. Tables (migration `<ts>_intake_core.sql`, `-- @owner CONSULTANT @module intake`)

| Table | Key columns | Notes |
|---|---|---|
| `intake_templates` | `kind ('first'\|'followup')`, `version int`, `status ('draft'\|'published'\|'retired')`, `definition jsonb`, `published_at` | unique `(kind, version)`; exactly one `published` per kind. `definition` = steps/questions/options (§3) **without flowers** |
| `intake_responses` 🔒 | `client_id`, `subject ('self'\|'dependent')`, `case_key text` (groups answers per person: `self` or hash of dependent name+relation), `template_id`, `status ('draft'\|'submitted'\|'superseded')`, `answers_enc bytea`, `key_id`, `last_step text`, `consent_share bool`, `consent_ai bool`, `submitted_at`, `locked_at` (2 h before attached session), `revision int` | one **draft** per `(client_id, case_key, kind)` |
| `intake_response_revisions` 🔒 *(additive)* | `response_id, revision, answers_enc, key_id, submitted_at` | snapshot on every submit/edit → CN-34 "Changes" tab |
| `intake_checkins` 🔒 | `client_id, case_key, appointment_id, previous_response_id, answers_enc, key_id, consent_ai, submitted_at` | IN-12 |
| `intake_flags` | `client_id, case_key, source_type ('response'\|'checkin'), source_id, kind intake_flag_kind, level text null, active bool, acknowledged_at, acknowledged_by` | **no free text** (medicine/allergy text stays in encrypted answers) |
| `intake_mapping` | `statement_key text, revision int, feeling_keys text[], statement_text text, flower_keys text[], sort int, active bool, approved_at, approved_by, change_note` | unique `(statement_key, revision)`; current = max revision where active |
| `intake_appointment_links` *(or column on appointments — see note)* | `intake_id \| checkin_id, appointment_id` | `attachIntakeToAppointment` writes here + `appointments.intake_id` |
| `case_summaries` 🔒 | see K6 §5 | AI output, consultant-only |

`intake_flag_kind` enum: `safety · alcohol_free · pregnancy · allergy · medication · minor · under_care · diagnosed_condition`.

Note: `appointments.intake_id` (K1) points at the response or check-in through the link table to keep one FK type; the link table carries which kind it is.

### 2.1 RLS
| Table | client | consultant (assigned) | manager | owner |
|---|---|---|---|---|
| intake_templates (published) | read | read/write drafts | ❌ | ❌ |
| intake_responses / revisions / checkins | own rows via functions only (decrypt server-side) | read via functions | ❌ | ❌ (aggregate stats via `analytics.v_intake_counts`: counts only) |
| intake_flags | ❌ (client sees their own safety card in UI only) | read, acknowledge | ❌ — only `getIntakeFlagsForPrep` (security definer → `{ alcoholFree }`) | ❌ |
| intake_mapping | ❌ **never** | read/write | ❌ | ❌ |
| case_summaries | ❌ | read | ❌ | ❌ |

"Assigned" = the client has an appointment (any status except `expired` unpaid) with this consultant, or the consultant has a completed session with them. With one consultant (D-14) this is effectively "Jitendra Khimlani".

---

## 3. Answer shapes (zod schemas shared by CLIENT UI and server)

```ts
// src/modules/intake/types.ts  (public)  — @contract v1
export type FeelingKey = 'fear'|'worry'|'anxiety'|'overthinking'|'anger'|'irritability'|'sadness'|'loneliness'
  |'guilt'|'low_confidence'|'overwhelm'|'indecision'|'exhaustion'|'grief'|'shock'|'jealousy'|'hopelessness'
  |'restlessness'|'other'
export type Intensity = 'mild'|'moderate'|'strong'
export type BodyArea = 'head'|'neck'|'shoulders'|'upper_back'|'lower_back'|'chest'|'stomach'|'joints'|'skin'|'other'
export type LifeChangeKey = 'new_job'|'relationship'|'loss'|'moving_home'|'exams'|'health'|'money'|'new_baby'|'retirement'|'nothing_major'|'other'
export type GoalKey = 'calm'|'confident'|'rested'|'clear_minded'|'hopeful'|'connected'|'patient'|'lighter'|'free'|'focused'

export type IntakeAnswers = {
  who:      { for: 'me'|'child'|'other'; name?: string; age?: number; relation?: string }          // IN-02a
  onMind:   { text?: string; voiceNoteFileId?: string }                                            // IN-02b: text ≥10 chars OR voice note
  duration: 'days'|'weeks'|'months'|'years'                                                         // IN-02c
  feelings: FeelingKey[]; feelingOther?: string                                                     // IN-03 (≥1)
  nuance:   Partial<Record<FeelingKey, { statementKeys: string[]; intensity: Intensity }>>          // IN-04
  extraStatements?: string[]                                                                        // IN-04 "A few more" group (§4.2)
  body:     { any: boolean; areas: { area: BodyArea; side: 'front'|'back'; kinds: ('pain'|'stiffness'|'tension'|'other')[] }[]; note?: string }  // IN-05
  sleep:    { quality: 1|2|3|4|5; hours: 'lt5'|'5to6'|'7to8'|'gt8'; wakesAtNight: boolean; energy: 1|2|3|4|5; stress: 1|2|3|4|5; appetite: 'less'|'same'|'more' }  // IN-06
  life:     { keys: LifeChangeKey[]; note?: string }                                                // IN-07
  safety:   { underCare: boolean; medicines: { taking: boolean; text?: string }; pregnantOrBreastfeeding: boolean | null;
              alcoholFree: boolean; allergies: { has: boolean; text?: string }; condition?: string } // IN-08
  selfHarm: 'no'|'sometimes'|'often'                                                                // IN-09
  goals:    { keys: GoalKey[]; note?: string }                                                      // IN-10
}

export type CheckinAnswers = {                                                                       // IN-12
  overall: 1|2|3|4|5
  feelings: Partial<Record<FeelingKey, 'better'|'same'|'harder'>>
  newFeelings?: FeelingKey[]
  note?: string; voiceNoteFileId?: string
  adherence: 'every_day'|'most_days'|'sometimes'|'rarely'
}
```
Validation: drafts accept partial objects (`IntakeAnswers` deep-partial); **submit** requires every step except optional texts; `nuance` must have an entry for every selected feeling except `other`; text fields ≤ 2,000 chars; age 0–120; voice notes ≤ 3 min, stored in private bucket `intake-voice/` (consultant-only signed URLs, 10-min expiry).

---

## 4. Mapping table (seed = spec §4, **pending Jitendra Khimlani's approval** — CONTENT-CHECKLIST #4b)

`approved_at` stays null until he approves each row in CN-35's "Edit mapping" view. Unapproved rows are still used (owner decision: flowers-to-consider is ON) but CN-35 shows a small "draft wording" tag until approved.

### 4.1 Seed rows
| statement_key | Shown under feeling(s) | Client statement | flower_keys |
|---|---|---|---|
| `st_fear_specific` | fear, anxiety | Fear of specific things (exams, illness, travel, people) | mimulus |
| `st_fear_unknown` | fear, anxiety | A vague fear of the unknown, without knowing why | aspen |
| `st_panic` | fear, anxiety | Sudden panic or terror | rock_rose |
| `st_lose_control` | fear, anxiety, anger | Fear of losing control or "snapping" | cherry_plum |
| `st_worry_loved_ones` | fear, worry, anxiety | Constant worry for my loved ones | red_chestnut |
| `st_thoughts_loop` | overthinking, worry | The same thoughts go round and round; can't switch off | white_chestnut |
| `st_two_choices` | indecision | Can't decide between two choices; mood swings | scleranthus |
| `st_doubt_judgement` | indecision, low_confidence | I doubt my own judgement and keep asking others | cerato |
| `st_life_direction` | indecision | Unsure what to do with my life | wild_oat |
| `st_expect_fail` | low_confidence | I expect to fail, so I don't try | larch |
| `st_cant_say_no` | low_confidence | I can't say no; I please others | centaury |
| `st_gloom_no_reason` | sadness | Heavy gloom that comes for no clear reason | mustard |
| `st_discouraged` | sadness, hopelessness | Discouraged after a setback | gentian |
| `st_given_up` | hopelessness | I've given up hope | gorse |
| `st_end_of_bearing` | hopelessness | At the very end of what I can bear | sweet_chestnut |
| `st_drained` | exhaustion | Completely drained after a long effort | olive |
| `st_too_heavy_start` | exhaustion | Mondays/tasks feel too heavy to start | hornbeam |
| `st_push_on` | exhaustion | I keep pushing on even when exhausted | oak |
| `st_responsibilities` | overwhelm | Overwhelmed by responsibilities | elm |
| `st_trying_too_hard` | overwhelm, restlessness | Trying too hard; over-enthusiastic, can't relax | vervain |
| `st_impatient` | anger, irritability | Quick to get impatient | impatiens |
| `st_jealousy` | anger, jealousy | Jealousy, envy, suspicion or anger | holly |
| `st_resentment` | anger | Bitterness, resentment, "why me?" | willow |
| `st_critical` | anger, irritability | Critical and intolerant of others | beech |
| `st_control_others` | anger | Need to control or dominate | vine |
| `st_self_blame` | guilt | I blame myself, even for others' mistakes | pine |
| `st_unclean` | guilt | Feeling unclean or disliking something about myself | crab_apple |
| `st_prefer_alone` | loneliness | I prefer to be alone; others find me distant | water_violet |
| `st_cant_be_alone` | loneliness | I can't bear being alone; I need to talk about my problems | heather |
| `st_need_needed` | loneliness | Possessive; I need to be needed | chicory |
| `st_grief_unrecovered` | grief, shock | Shock or grief I haven't recovered from | star_of_bethlehem |
| `st_living_past` | grief | Living in the past; homesick; nostalgic | honeysuckle |
| `st_recent_shock` | shock | A recent shock or trauma | star_of_bethlehem |
| `st_cheerful_mask` | restlessness, worry | Hiding worries behind a cheerful face | agrimony |
| `st_daydreaming` | restlessness | Daydreaming; not really "here" | clematis |
| `st_strict_self` | worry | Hard on myself; very strict standards | rock_water |
| `st_resigned` | other (+ "A few more") | Resigned; nothing interests me | wild_rose |
| `st_same_mistakes` | other (+ "A few more") | I keep making the same mistakes | chestnut_bud |
| `lc_any_change` | — (from IN-07 life changes) | Any big change (job, move, relationship, baby, retirement) | walnut |

Coverage check: all **38** flowers appear at least once (Star of Bethlehem twice). Rescue Remedy is not mapped (he adds it by judgement).

### 4.2 Gaps found in the spec — proposed defaults, **need his approval**
| Gap | Proposal |
|---|---|
| "Anxiety" chip had no statements | Show the fear statements + "worry for loved ones" under Anxiety (rows tagged above) |
| "Irritability", "Jealousy" chips | Reuse Impatiens/Beech and Holly rows (tagged above) |
| Wild Rose & Chestnut Bud had no natural chip | IN-04 ends with an optional "A few more — any of these feel true?" group showing both → `extraStatements` |
| "Something else" free text | No mapping; text goes to the AI summary and CN-34 only |
| Walnut from life changes | Every `life.keys` except `nothing_major`/`other` → Walnut with reason "Life change: <label>" |

### 4.3 Editing (CN-35 → "Edit mapping", consultant only)
- Edit wording/flowers/feelings → new row `revision+1`, `change_note` optional, previous row kept (never deleted).
- Deactivate a statement → hidden from new forms; past answers still resolve to their revision.
- `getIntakeForm` always serves the **current active revision's text**; answers store `statementKey` + `revision` seen (`nuance[f].statementKeys` entries are `key@rev` internally).

---

## 5. Deterministic outputs

### 5.1 Flags (on draft save of the relevant step and on submit)
| Flag | Rule |
|---|---|
| `safety` (level) | `selfHarm ∈ {sometimes, often}` |
| `alcohol_free` | `safety.alcoholFree` |
| `pregnancy` | `safety.pregnantOrBreastfeeding === true` |
| `allergy` | `safety.allergies.has` |
| `medication` | `safety.medicines.taking` |
| `minor` | `who.for === 'child'` or `who.age < 18` |
| `under_care` | `safety.underCare` |
| `diagnosed_condition` | non-empty `safety.condition` |
Re-submits reconcile: flags no longer true → `active = false` (history kept).

### 5.2 `getFlowersToConsider(appointmentId)` — contract v1
```
resp  = intake response (or latest response for the case) attached to the appointment
check = check-in attached (follow-ups), optional
reasons: Map<flowerKey, { reasons: string[]; intensity: Intensity; weight: number }>
for each feeling f in resp.nuance: for each statementKey@rev:
   row = intake_mapping(statementKey, rev)
   for flower in row.flower_keys: add reason `“${row.statement_text}” · ${label(f)} · ${intensity}` ; weight += W[intensity] (mild 1, moderate 2, strong 3)
for key in resp.extraStatements: same with intensity 'moderate'
for lc in resp.life.keys \ {nothing_major, other}: walnut += reason `Life change: ${label(lc)}`, intensity 'moderate'
if check: for f with 'harder': every flower already reasoned from f gets reason `Check-in: ${label(f)} feels harder` and weight += 1
          for f in newFeelings: reason `Check-in: new feeling — ${label(f)}` (no flower unless nuance exists)
drop flowers hidden in his library (bach_remedies.hidden) → returned separately as hiddenCount
intensity(flower) = max intensity among its reasons
sort: weight desc, intensity desc, flower name asc
return [{ flowerId, reasons, intensity }]
```
Pure function `rankFlowers(answers, mapping, checkin?, hidden)` — unit tested with fixtures. Never callable by client/manager/owner roles. The AI never sees this list (prevents it echoing flower names into prose).

### 5.3 `getIntakeFlagsForPrep(remedyOrderId)` — contract v1
Security-definer SQL function: remedy_order → client + case → active `alcohol_free` flag → `{ alcoholFree }`. Callable with `fulfilment.prep.view`. Returns nothing else.

---

## 6. Safety protocol (D-38)
1. IN-09 answer is saved with the draft as soon as the client leaves the step (`saveIntakeDraft`). On `sometimes|often`:
   - upsert `intake_flags(kind='safety', level)` (dedupe per response; escalate `sometimes → often`, never downgrade until submit),
   - emit `intake.safety_flagged { clientId, level }` — **no answer text, no name**,
   - OWNER notifications routes it to **Jitendra Khimlani only**, priority (push + in-app). Template copy: "Priority: a client needs a gentle check-in. Open BeWise." — no client name on the lock screen.
2. Client UI (CLIENT) shows the support card immediately: **Tele-MANAS 14416** (free, 24×7) and **112** for immediate danger — *numbers to be verified before launch*. The client can continue.
3. CN-36 (consultant): priority card on Today + rose banner on Session prep: "She said *{level}* to the self-harm question on {date}. Consider calling before the session." Buttons: **Call** (tel:), **WhatsApp**, **Mark as reached out** (sets `acknowledged_at/by`; remains visible on prep until the session).
4. Firing on draft save (not only submit) is deliberate — a client who stops at IN-09 must still reach him. The IN-09 copy must say "Jitendra Khimlani will be gently informed so he can support you" (request to CLIENT). DPDP basis: vital interest / consent at IN-01 — **HUB/owner to confirm**.
5. Wording of the question and card: Jitendra Khimlani approves before launch (CONTENT-CHECKLIST #4b).

---

## 7. Functions (contract §5 *intake*, signatures unchanged)
| Function | Caller | Behaviour |
|---|---|---|
| `getIntakeForm({ clientId, kind, forDependentId? })` | CLIENT | published template + current mapping **statements (text only)** + existing draft (resume) or prefill from last submitted answers of the same `case_key` → `IntakeForm { intakeId, kind, template, statements, answers, lastStep, prefilledFrom? }`. Creates the draft row if none. For `followup`, returns the previous feelings to rate (IN-12b) |
| `saveIntakeDraft({ intakeId, answers })` | CLIENT | deep-partial validate, encrypt, store, update `last_step`; recompute flags (§5.1, §6). Debounce on client (every step change + 10 s idle). 409 `INTAKE_LOCKED` after `locked_at` |
| `submitIntake({ intakeId, answers, consent })` | CLIENT | full validate; `consent.shareWithConsultant` must be `true` (else `CONSENT_REQUIRED`); store revision; flags; emit `intake.submitted { intakeId, clientId, appointmentId? }`; enqueue AI case summary if `consent.aiSummary` (K6). Returns `{ intakeId, flags: IntakeFlag[] }` where `IntakeFlag` = kinds only |
| `attachIntakeToAppointment({ intakeId, appointmentId })` | CLIENT booking | same client; sets `locked_at = starts_at − 2 h`; on reschedule K1 recomputes `locked_at` |
| `getCaseSummary(appointmentId)` | CONSULTANT | `{ summary[4], flags[], questionsToExplore[3], progressNote?[3], status, generatedAt, aiConsent }` — flags from §5.1 (not AI) |
| `getFlowersToConsider(appointmentId)` | CONSULTANT | §5.2 |
| `getIntakeFlagsForPrep(remedyOrderId)` | MANAGER | §5.3 |
| `submitCheckin(...)` *(internal to CLIENT's IN-12 via `submitIntake` with `kind='followup'`)* | CLIENT | stores `intake_checkins`, emits `intake.checkin_submitted { checkinId, clientId, appointmentId? }`, enqueues progress note (K6) |

Consultant-only internals: `getIntakeAnswers(appointmentId)` (CN-34, decrypts + audit), `getIntakeChanges(appointmentId)` (diff of revisions / vs previous check-in), `acknowledgeSafetyFlag(flagId)`, `listMapping()`, `editMappingRow(...)`, `approveMappingRows(keys[])`.

Pre-fill of "What's troubling her?" (D-27, CN-36): K4's `setSessionConcerns` seeds the session chips from intake feelings via a fixed map `FeelingKey → concern_catalog.key` (fear→fear, worry→worry, anxiety→anxiety, anger/irritability→anger, sadness→sadness, loneliness→loneliness, guilt→guilt, low_confidence→insecurity, overwhelm→overwhelm, indecision→indecision, exhaustion→exhaustion, grief→grief, shock→shock, jealousy→jealousy, hopelessness→hopelessness, restlessness→restlessness, overthinking→overthinking), tagged `source='intake'`.

## 8. Retention & client rights (DPDP)
- Client can view/edit (until lock) and **delete** their answers (CL privacy screen → `deleteMyIntake` → crypto-shred: destroy row keys, keep a tombstone with no content; case summaries deleted too). Consultant's own notes are separate (consultation module).
- Retention default: answers kept while the client is active + 3 years after last session — **owner to set** (`settings: privacy.intake_retention_months`).
- Owner sees only aggregate counts (number of intakes, % with AI consent) — never content.

## 9. Tests
- Fixtures: 10 synthetic intakes (incl. child, alcohol-free, self-harm "often", "Something else" only, all-mild, follow-up with "harder").
- `rankFlowers` snapshot tests; mapping revision change doesn't alter historical results.
- RLS: manager/owner/accountant `select` on `intake_responses`, `intake_mapping`, `case_summaries`, `intake_flags` → 0 rows; `getIntakeFlagsForPrep` returns only `{alcoholFree}`.
- `getIntakeForm` response JSON contains none of the 38 flower names (string scan test).
- Events: `intake.safety_flagged` payload has exactly `{clientId, level}`.
- Encryption: DB dump of `intake_responses` contains no plaintext answer strings.
