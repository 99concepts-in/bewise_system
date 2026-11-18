# Intake & check-in UI — IN-01…IN-12

> **Owner:** CLIENT chat builds the UI · CONSULTANT chat owns data, mapping, AI (`intake` module) · Milestone **C3** · Status: **DRAFT v0.1 (2026-11-17)**
> Content source: `01-INTAKE-CASE-TAKING.md` (question bank, mapping, safety protocol) — **that file wins on wording**; this file adds layout, validation, states, persistence and events.
> Boards: `design/client-v4/CL4-board-06…09` (intake), `CL4-board-14` (check-in). Decisions: D-35, D-36, D-37, D-38.

## 1. Frame (all intake steps)

- Header: Back (‹) · **"Step n of 8"** + progress bar · **"Save & finish later"** pill (top right). Steps = 8 (IN-02…IN-10 grouped as in the question bank: 1 IN-02 · 2 IN-03 · 3 IN-04 · 4 IN-05 · 5 IN-06 · 6 IN-07 · 7 IN-08 · 8 IN-09 + IN-10). IN-01 intro and IN-11 review are outside the count.
- Two-tone headline per step (board copy). One topic per screen. Pinned **Continue** CTA.
- **Autosave**: every change → debounced 800 ms `intake.saveIntakeDraft({ intakeId, answers })`; also on Continue/Back/visibilitychange. Indicator under the bar: "Saved ✓" / "Saving…" / "Offline — saved on this phone" (no spinners blocking input).
- **Save & finish later** → confirm sheet "Your answers are saved. We'll remind you tomorrow." → Home (contextual card priority 2). Scheduling a reminder = notifications (OWNER) via `intake.draft_abandoned` — CONSULTANT/OWNER to decide who emits (see request).
- **Resume**: `/app/book` with a draft → jumps to the first incomplete step; returning clients get last answers pre-filled from `getIntakeForm` (label "From your last visit — update anything that's changed").
- Route: `/app/book/intake/[stepId]` (stepId `intro|who|feelings|more|body|sleep|life|safety|gentle|goals|review|saved`). Deep-linkable, guarded (can't skip ahead past an unanswered required step).
- Text inputs: 1,000 char max (counter after 800). Voice note: 2 min max.
- Privacy line on every step footer (13 px): "🔒 Private — only Jitu Bhaiya sees your answers."

## 2. Answer model (proposed `IntakeAnswers`, for CONSULTANT to confirm — request filed)

```ts
type Intensity = 'mild' | 'moderate' | 'strong'
interface IntakeAnswers {
  who: { for: 'me' | 'child' | 'someone_else'; dependent?: { name: string; age: number; relation: string } }
  onMind: { text?: string; voiceNoteId?: string; duration: 'days' | 'weeks' | 'months' | 'years' }
  feelings: FeelingKey[]                               // IN-03 chips; 'something_else' + feelingsOther?: string
  feelingsOther?: string
  nuance: Record<FeelingKey, { statementIds: string[]; intensity: Intensity }>   // statementIds from intake_mapping (versioned)
  body: { any: boolean; areas: BodyArea[]; types: ('pain'|'stiffness'|'tension'|'other')[]; otherText?: string }
  sleep: { quality: 1|2|3|4|5; hours: 'lt5'|'5_6'|'7_8'|'8plus'; wakesAtNight: boolean; energy: 1|2|3|4|5; stress: 1|2|3|4|5; appetite: 'less'|'same'|'more' }
  life: { changes: LifeChangeKey[]; otherText?: string }
  safety: { seeingDoctor: boolean; medicines?: string | null; pregnantOrBreastfeeding: boolean; alcoholFree: boolean; allergies?: string | null; condition?: string | null }
  selfHarm: 'no' | 'sometimes' | 'often'
  goals: { feelings: GoalKey[]; text?: string }
  templateVersion: string
}
type BodyArea = 'head'|'neck'|'shoulders'|'upper_back'|'lower_back'|'chest'|'stomach'|'joints'|'skin'|'other'
```
Statements and chip labels come from `getIntakeForm().template` (data, not hard-coded) so Jitu Bhaiya's wording edits need no client release.

## 3. Screens

| ID | Headline | Controls | Required / validation | Notes |
|---|---|---|---|---|
| **IN-01** Intro | "Before you *meet*" | Mascot (calm pose) · 4 ticks: Private · Save anytime · No wrong answers · About 5 minutes | — | CTA **Begin** · secondary "Why we ask" sheet (2 lines + link to privacy) |
| **IN-02a** Who is this for? | "Who is this *for*?" | Segmented: Me · My child · Someone else → reveals Name, Age (number 0–120), Relation (chips: Child, Parent, Partner, Other) | required; dependent fields required when not "Me" | Child/someone else → note "You're answering on their behalf. If they're 18+, it's best they fill this themselves." Age < 18 → creates `minor` flag (server) |
| **IN-02b** On your mind | "What's been on your *mind*?" | Textarea (placeholder "In your own words…") + **🎙 Record a voice note** | text ≥ 10 chars **or** a voice note | Voice: MediaRecorder (webm/opus, m4a on iOS), waveform, play/re-record/delete; uploaded to private storage bucket `intake-voice` via signed URL → `voiceNoteId`. Mic denied → hide button, show "Voice notes need microphone access — you can type instead." Replaces CL-15 |
| **IN-02c** For how long? | inline under IN-02b | Pills: Days · Weeks · Months · Years | required | Same screen as IN-02b (board) |
| **IN-03** Feelings | "How have you been *feeling*?" | Multi chips (19 incl. "Something else" → text) | ≥ 1 | Max 6 suggested: after 6, hint "Pick the ones that feel strongest" (not blocking) |
| **IN-04** Nuance | "Tell us a little *more*" | One card per selected feeling: "**Fear** — which feels closest?" statements (radio by default; "Choose more than one" link switches to checkbox) + **Intensity** Mild · Moderate · Strong | each card: ≥ 1 statement + intensity | Feelings without statements (e.g. "Something else") skip. Order = IN-03 order. Long lists: cards collapse after answered ("Fear · A vague fear of the unknown · Moderate ✎") |
| **IN-05** Body | "Any physical *discomfort*?" | No / Yes → front + back figure (tap regions toggle, highlighted rose) **synced** with area chips; type chips Pain · Stiffness · Tension · Other | if Yes: ≥ 1 area + ≥ 1 type | Figure is SVG with `<button>` regions + `aria-label` ("Lower back, selected"); chips are the accessible primary control. Footer (always visible): "We don't diagnose or treat medical conditions — please keep seeing your doctor." |
| **IN-06** Sleep & energy | "Sleep & *energy*" | Sleep quality (5 mood characters, mapped 1–5: Tired=1, Anxious=2, Sad=3, Joyful=4, Calm=5 — labels shown), Hours pills, Waking at night Y/N, Energy slider 1–5, Stress slider 1–5, Appetite Less/Same/More | all required except appetite | Sliders: native `input[type=range]` styled, value text "2/5", step 1 |
| **IN-07** Life changes | "Anything changing in *life*?" | 2-col chips with mood characters (board) + "Anything else you'd like to share" text | ≥ 1 (incl. "Nothing major", exclusive) | |
| **IN-08** Safety | "For your *safety*" · sub "Helps us prepare your remedy and suggest products safely" | Yes/No rows; Yes reveals a short text field for Medicines, Allergies, Condition. Alcohol-free row hint "Bach remedies usually contain a little brandy" | every row answered; text required when Yes for medicines/allergies | Allergies text → also parsed server-side into `allergens[]` used by shop warnings (CL-35) — see shop spec |
| **IN-09** One gentle question | "One gentle *question*" | Exact wording from `01-INTAKE` §3 (template-driven). Pills No · Sometimes · Often | required | §4 safety protocol |
| **IN-10** Goals | "How would you like to *feel*?" | Multi chips (10) + "In your own words —" text | ≥ 1 chip or text | CTA **Review answers** |
| **IN-11** Review & consent | "Your *answers*" | Section cards (On your mind · Feelings · Body · Sleep · Life · Safety · Goals) each with summary + **Edit** (→ step, then "Back to review") · Toggles: 🔒 **Share with my consultant** (on) · ✨ **Let AI prepare a private summary for Jitu Bhaiya** (on, optional) + "What is this?" sheet | Share must be on to continue: if turned off → CTA disabled + note "Jitu Bhaiya needs your answers to prepare. You can keep them brief." | CTA **Save & choose a time** → `submitIntake({ intakeId, answers, consent:{ shareWithConsultant:true, aiSummary } })` |
| **IN-11b** Saved | "Thank you, *{firstName}*" | Mascot holding bottle · "Jitu Bhaiya will read this before you meet. You can update it until 2 hours before your session." | — | CTA **Choose a time** → CL-13 |

### IN-12 Follow-up check-in (`/app/book/check-in/[1|2|3]`, board CL4-14)
| Step | Content | Required |
|---|---|---|
| a | "How are you *now*?" — 5 mood characters (overall) | yes |
| b | "Since we last *met*" — each feeling from the last intake/check-in as a row: Better · Same · Harder; "+ Something new" → IN-03 chip picker (single sheet) | each row |
| c | "Anything *new*?" — text/voice (optional) + "Took my drops": Every day · Most days · Sometimes · Rarely · Safety recap: "Still alcohol-free? Still allergic to lavender?" quick confirm (edit opens IN-08 rows) | drops |
| submit | `intake.submitCheckin(...)` (**not in contract yet** — request) → "Thanks — Jitu Bhaiya will see how you've been." → CL-13 | |

## 4. Safety protocol UI (IN-09 → Sometimes / Often)
- Immediately (same screen, no extra tap) reveal the **support card**: heart icon · "**You're not alone.** Talk to someone now — free and confidential, 24×7." · row "Tele-MANAS · **14416**" + **Call** (`tel:14416`) · row "In immediate danger? Call **112**" + **Call** (`tel:112`) — *board omits 112; must be added* · line "Jitu Bhaiya will be gently informed before your session."
- Numbers come from `getSetting('safety.helplines')` with these defaults; **verify before launch** (D-38).
- Answer is saved immediately (not debounced) so the `intake.safety_flagged` alert (CONSULTANT, to Jitu Bhaiya only) fires even if the client abandons.
- Client may continue booking. No judgement copy, no red colours (soft periwinkle card).
- Same card component is reused by Ask BeWise crisis handling (CL-55) and Help (CL-51).

## 5. Editing after submit
Appointments → session detail (CL-19) → "Your answers" → IN-11 in edit mode until `startsAt − 2h` (server-enforced: `INTAKE_LOCKED`). Each save = new version (CONSULTANT handles history/"Changes" tab).

## 6. States & errors
| Case | Behaviour |
|---|---|
| Template load fails | IN-01 shows "We couldn't load the questions — Try again"; booking blocked (no intake-less path) |
| Draft save fails | Keep answers in memory + IndexedDB; indicator "Not saved yet — retrying"; Continue still allowed; submit retries and only proceeds on server OK |
| Flag `intake` off | Local-only draft store (IndexedDB, encrypted) + stub submit returning `{ intakeId:'local-…', flags:[] }`; banner in non-prod "Intake is in preview mode" |
| Voice upload fails | Keep local blob, retry ×3, then "Couldn't upload your voice note — type a few words instead?" |
| Back from IN-04 after removing a feeling in IN-03 | Drop that feeling's nuance answers (with toast "Removed answers for Anger") |

## 7. Acceptance
- [ ] Full intake ≈ 5 min on a 375 px phone (timed usability with 3 people); each step fits without scroll except IN-04/IN-11.
- [ ] Kill the tab on step 5 → reopen → resumes at step 5 with answers.
- [ ] "Sometimes"/"Often" shows the support card with working `tel:` links before any network round-trip completes.
- [ ] No flower names, mapping or AI summary text appear anywhere in client UI or network responses to the client (RLS + response-shape test).
- [ ] Screen reader can complete body map using chips only.
- [ ] Analytics carry step ids and timings only — never answers.

## 8. Events
CLIENT emits none; CONSULTANT `intake` emits `intake.submitted`, `intake.safety_flagged`, `intake.checkin_submitted`. Analytics `intake_step`, `intake_saved_for_later`.
