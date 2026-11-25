# K6 — AI case summary & 3-line progress summary: prompts, schemas, guardrails (spec v1)

> **Owner:** CONSULTANT · Modules `intake` (case summary, progress note) and `progress` (3-line summaries)
> Decisions: D-28 (progress summary, client + consultant, private notes excluded), D-36 (AI case summary, consultant-only, consent-based)
> Screens: CN-05 / CN-33 (case summary), CN-13 (consultant progress), CN-36 (since last time) · client CL-08 / CL-26 / CL-56 (client progress, rendered by CLIENT via `getProgressSummary`)
> Status: **SPEC**. Written with the `claude-api` skill loaded (2026-11-17). Re-check model ids & SDK shapes with that skill when coding.

---

## 1. Hard rules (apply to every AI call)
1. **Server-side only.** `@anthropic-ai/sdk` in `src/modules/{intake,progress}/ai/*.ts` (server files, `import 'server-only'`). Key `ANTHROPIC_API_KEY` in server env only.
2. **The AI organises and summarises; it never prescribes.** No flower/remedy names, no dosages, no diagnosis, no medical claims, no advice to stop/start medicines. Enforced by prompt **and** by a code validator (§6).
3. **Inputs are minimised and pseudonymised:** no name, phone, email, address, city; "the client" / "you"; age as a band; dependent shown as "a child (age band)". Free text is scrubbed for phone numbers, emails, URLs before sending.
4. **Never sent:** practitioner private notes, flower reasons, the mapping, flowers-to-consider, payment data. (D-28: private notes are not sent to the AI by default — there is no setting to turn it on in v1.)
5. **Consent:** case summary only if `consent.aiSummary = true` on that intake/check-in. Progress summaries use data the client already shares (journal sharing toggle D-15 respected; if journal sharing is off, journal data is excluded from the consultant version).
6. **Label everywhere:** consultant UI "AI summary · verify with the client"; client UI "Auto summary". Output is stored, audited, and never used for training (Anthropic API commercial terms; disclosed in IN-11 consent copy).
7. **Failure is quiet:** any error, refusal, or validator rejection → the UI shows the structured answers / no summary, never a half summary.

## 2. Model & request settings
| Setting | Value | Why |
|---|---|---|
| Model | `claude-opus-5-5` | current default per `claude-api` skill; one model for all three tasks (one cache namespace) |
| API | `client.messages.parse({... output_config: { format: zodOutputFormat(Schema), effort } })` | structured output validated against the zod schema; `parsed_output` null → treat as failure |
| Thinking | omit `thinking` (Opus 5.5 runs adaptive; `disabled` is a 400) | |
| Effort | case summary `medium` · progress `low` (set explicitly — Opus 5.5 default is `medium`) | short summarisation; measure before raising |
| `max_tokens` | 4,000 | outputs are < 400 tokens; headroom for thinking |
| Refusal handling | check `stop_reason === 'refusal'` before reading output → status `failed`. Server-side fallback: `betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default'` — **verify at build time** that it combines with `parse()`/structured outputs; if not, skip fallbacks (failure path already safe) | skill guidance for Opus 5.5 |
| Prompt caching | `cache_control: { type: 'ephemeral' }` on the system block (stable prefix: role, rules, examples). Volatile data only in the user message. Check `usage.cache_read_input_tokens`; if the prefix is under the model minimum, caching silently doesn't apply — acceptable | |
| Timeout / retries | SDK default retries (2); per-request timeout 60 s; job-queue retry with backoff up to 3 times | |
| Data residency | Requests leave India (Anthropic API). **Owner/legal to confirm** under DPDP; disclosed in consent | |

Execution: never in the request path of a page. Jobs run from event handlers (`intake.submitted`, `intake.checkin_submitted`, `remedy.given`, `session_feedback.submitted`) and the daily cron; screens read the cached row. CN-05 "Refresh" triggers a job and polls.

## 3. Result caching & audit
- `input_hash = sha256(promptVersion + model + canonicalJSON(input))`. Same hash → reuse the stored output (no API call).
- Tables (mine):
  - `case_summaries` 🔒: `appointment_id, response_id, checkin_id, kind ('case'|'progress_note'), input_hash, prompt_version, model, status ('ok'|'failed'|'no_consent'|'rejected'), output jsonb, usage jsonb, generated_at`.
  - `progress_summaries`: `client_id, audience ('client'|'consultant'), window_start, input_hash, prompt_version, model, status, lines text[3], insufficient_data bool, generated_at`.
  - `ai_runs` 🔒 *(additive)*: `id, purpose, subject_client_id, request_enc, response_enc, key_id, model, prompt_version, stop_reason, usage, validator_result, latency_ms, created_at` — encrypted, consultant-only + break-glass; **retention 180 days** then purged. This is the audit trail (spec §5 "prompts and outputs logged").
- Events: `progress_summary.refreshed { clientId, audience }` only — no text.

---

## 4. Case summary (CN-33) — `prompt_version: case-v1`

### 4.1 Input (built by `buildCaseInput()`; JSON in the user message)
```jsonc
{
  "kind": "first",                        // or "followup"
  "subject": { "who": "self", "ageBand": "30-39" },       // or { "who": "child", "ageBand": "10-14" }
  "onMind": "…client words, scrubbed…",   // voice notes are NOT transcribed in v1
  "duration": "months",
  "feelings": [ { "feeling": "Fear", "intensity": "strong", "statements": ["A vague fear of the unknown, without knowing why"] } ],
  "feelingOther": "…",
  "body": [ { "area": "Shoulders", "side": "back", "kinds": ["Tension"] } ],
  "sleep": { "quality": 2, "hours": "5-6", "wakesAtNight": true, "energy": 2, "stress": 4, "appetite": "less" },
  "lifeChanges": ["New job or role"],
  "safetyContext": { "underCare": false, "takingMedicines": true, "pregnantOrBreastfeeding": false },  // booleans only, no medicine names
  "goals": ["Calm", "Rested"],
  "goalNote": "…",
  "previous": {                            // followup only: last intake digest + check-in
    "checkin": { "overall": 3, "feelings": { "Fear": "better", "Sadness": "harder" }, "newFeelings": ["Overwhelm"], "note": "…", "adherence": "most_days" }
  }
}
```
Excluded on purpose: self-harm answer (handled by the deterministic safety flag and banner — the AI must not soften or restate it), allergy/medicine/condition **text**, alcohol preference, flowers.

### 4.2 Output schema (zod)
```ts
const Line = z.string().min(8).max(160)
export const CaseSummarySchema = z.object({
  summary: z.tuple([Line, Line, Line, Line]),          // 1 who & main concern · 2 emotional picture · 3 body/sleep/energy · 4 goals
  questionsToExplore: z.tuple([Line, Line, Line]),     // open questions he might ask
  progressNote: z.tuple([Line, Line, Line]).nullable() // follow-ups only: Better / Same / Harder; null for first
})
```
`flags` in `CaseSummary` come from `intake_flags` (K3 §5.1), merged by code.

### 4.3 System prompt (stable, cached)
```text
You help Jitendra Khimlani, a Bach Flower Remedy therapist and life coach in India, prepare for a
consultation. You receive a client's own intake answers as JSON. Write a short, factual case summary he can read in
30 seconds before meeting them.

What to write
- summary: exactly 4 lines.
  1. Who the client is (self or a child, age band) and the main concern in their words, with how long it has lasted.
  2. The emotional picture: the feelings they chose, the statements they picked and the intensity.
  3. Body, sleep and energy: discomfort areas, sleep quality and hours, energy, stress, appetite.
  4. What they would like to feel instead, and any life change they mentioned.
- questionsToExplore: exactly 3 open, gentle questions he could ask to understand the person better
  (about situations, triggers, relationships, daily rhythm). One idea per question.
- progressNote: only when "previous" is present: exactly 3 lines — what feels better, what feels the same,
  what feels harder or new, plus how regularly they took their drops. Otherwise null.

How to write
- Report, don't interpret: "Client reports…", "They describe…", "They chose…". Use the client's own words when short.
- Plain English a busy practitioner can scan. Each line under 160 characters. No bullet symbols or markdown.
- Warm and neutral. No judgement, no reassurance, no predictions.

Never
- Never name or suggest any flower, remedy, essence, oil, supplement, medicine or dose.
- Never diagnose or use clinical labels (for example depression, anxiety disorder, insomnia, PTSD) unless quoting
  the client's own words in quotation marks.
- Never give medical, legal or financial advice, or advice to start or stop any treatment.
- Never mention safety questions, self-harm or risk — a separate safety alert handles that.
- Never invent facts. If a section has no answers, write "Not answered." for that line.
```
User message: `Intake answers:\n<intake_json>\n…\n</intake_json>` (JSON stringified with sorted keys so equal inputs hash and cache equally).

## 5. 3-line progress summary — `prompt_version: progress-v1`

### 5.1 Window & triggers
- Window: from the last `remedy.given` for this client (or first session) → today (IST).
- Refresh: daily 05:30 IST cron for clients with any new input since `generated_at`; on `intake.checkin_submitted`, `session_feedback.submitted`, `remedy.given`; before a session if older than 6 h (CN-05 opens → enqueue).
- **Insufficient data** (deterministic, no AI call): fewer than 3 journal entries in the window **and** no check-in → `insufficient_data = true`; client UI shows "Not enough check-ins yet — log how you feel to see your progress."; consultant UI shows "Not enough data since <date>".

### 5.2 Input
```jsonc
{
  "audience": "client",                      // or "consultant"
  "windowStart": "2026-11-03", "today": "2026-11-17", "remedyGivenOn": "2026-11-03",
  "journal": { "entries": 9, "byEmotion": { "calm": 4, "anxious": 3, "tired": 2 }, "firstHalf": {…}, "secondHalf": {…} },   // counts only (CLIENT journal API)
  "checkin": { "overall": 4, "feelings": { "Fear": "better" }, "adherence": "every_day" },                               // latest, if any
  "sessionConcerns": [ { "date": "2026-11-03", "concerns": ["Fear", "Overthinking"] } ],                                 // consultant: all sessions; client: latest session, gentle labels
  "feedback": { "latestRating": 5 }                                                                                       // consultant only
}
```
Client audience never receives: private notes, reasons, flowers, intake answers text, feedback text, other sessions' concerns.

### 5.3 Output schema
```ts
export const ProgressSchema = z.object({
  lines: z.tuple([z.string().min(8).max(110), z.string().min(8).max(110), z.string().min(8).max(110)])
})
```
Stored as `ProgressSummary { lines, since: windowStart, generatedAt }` (contract v1).

### 5.4 System prompts
**Consultant audience**
```text
You write a 3-line progress note for a Bach Flower Remedy therapist about one client, covering the period since
their last remedy. You receive counts and check-in answers as JSON.
- Exactly 3 lines, each under 110 characters, factual, third person ("Logged calm 4×, anxious 3× since 3 Nov").
- Line 1: overall direction from journal counts and the latest check-in (compare first and second half of the period).
- Line 2: what changed in the troubling emotions recorded in sessions or check-ins (better, same, harder, new).
- Line 3: routine signals: how often they logged feelings and how regularly they took their drops; latest session rating if present.
- Report numbers and changes only. No interpretation of causes, no advice, no predictions.
- Never name or suggest flowers, remedies, medicines or doses. Never diagnose. If data for a line is missing, say so briefly.
```
**Client audience**
```text
You write a gentle 3-line progress note for a person using BeWise Wellness, covering the time since their current
remedy blend began. You receive counts of the feelings they logged and their check-in answers as JSON.
- Exactly 3 short lines (under 110 characters each), second person, warm and plain ("You've logged calm more often this week.").
- Line 1: the overall trend in how they've been feeling. Line 2: one feeling that changed. Line 3: an encouraging,
  factual note about their routine (logging or drops) — no instructions.
- Describe only what the data shows. No promises, no "the remedy is working", no health claims, no diagnosis.
- Never name flowers, remedies, products or medicines. Never mention sessions' private content.
- If the data shows things are harder, say so kindly and without alarm, e.g. "Some days have felt heavier lately."
```

## 6. Validator (code, runs on every output before storing)
| Check | Rule | On fail |
|---|---|---|
| Shape | zod parse (tuple lengths, max lengths) | retry once |
| Flower/remedy names | case-insensitive match against the 38 names + "Rescue", "remedy", "essence", "drops of", "dose", "mg", "ml" (progress client: also "blend") | retry once with a system note naming the violation |
| Clinical/medical terms | list: diagnos*, disorder, depression, depressive, bipolar, PTSD, insomnia, OCD, ADHD, cure, treat*, prescri*, therapy for, medication change, stop taking — allowed only inside quotes that appear verbatim in the input text | retry once |
| Safety leakage | self-harm, suicid*, harm yourself, kill (case summary must not mention; safety is the banner) | reject, no retry |
| PII | phone/email/URL patterns, client name if known | reject |
| Promises | "will help", "will heal", "guarantee", "working" (client audience) | retry once |
Second failure → status `rejected`, `ai_runs.validator_result` stored, UI falls back. Weekly count of rejections visible to HUB in logs (counts only).

## 7. Eval before go-live (small, real-world shaped, synthetic data)
- 20 synthetic intakes (from K3 fixtures) + 10 progress windows, reviewed by Jitendra Khimlani once: rates each summary *useful / wrong / unsafe*.
- Automated: validator pass rate ≥ 95 % first try; 0 flower names; 0 safety mentions; latency p95 < 20 s (async job).
- Prompt changes bump `prompt_version` → cache misses by design.

## 8. Cost estimate (for the owner)
Inputs ~1.5k tokens, outputs ~300 tokens (+ thinking). At Opus 5.5 list price ($4 / $20 per M) that is roughly **$0.01–0.03 per summary**; ~5 summaries per client per month → well under ₹10 per active client per month. Recheck with real `usage` after the first week.
