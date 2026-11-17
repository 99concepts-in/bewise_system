# Intake & Case-Taking (before booking) — spec v1

> **Owner:** HUB (designed with the business owner, 2026-11-17). Status: **APPROVED IN PRINCIPLE — designs in `design/intake-v2/` (v2 Quiet Luxury)**.
> Supersedes D-18 ("no questionnaire"). Client screens **IN-01…IN-12** (client chat builds UI), data + AI + consultant views
> **CN-33…CN-36** (consultant chat). Design language: v2 Quiet Luxury.

## 1. Why
Jitu Bhaiya needs a proper case before he meets someone: what is troubling them emotionally, how it shows up in the body,
sleep/energy, life context, safety factors, and what they want to feel instead. The client fills it once (≈5 min) before
their first booking; follow-ups get a 2-minute "Since we last met" check-in. An AI model turns the answers into a short,
verifiable case summary for him and a transparent list of **flowers to consider** (his judgement decides; client never sees).

## 2. Where it sits in the flow
```
FIRST BOOKING   Choose consultation → INTAKE (IN-01…IN-11, save & finish later) → Online/In person → Date & time → Review & pay
FOLLOW-UP       Choose follow-up → CHECK-IN (IN-12a…c, 2 min) → Date & time → Review & pay
UPDATE          Client can edit intake answers until 2 h before the session (Appointments → Your answers)
```
- Returning clients' last answers are pre-filled. Booking for "My child / someone else" creates a separate case (dependent profile).
- If the client abandons mid-intake, a gentle reminder after 24 h ("Your answers are saved — finish in 3 minutes").

## 3. Question bank (v1) — client language, one topic per screen

| Step | ID | Question | Type | Options / notes |
|---|---|---|---|---|
| — | IN-01 | Intro | info | Private · save anytime · no wrong answers · ≈5 min |
| 1 | IN-02a | Who is this for? | single | Me · My child · Someone else (→ name, age, relation) |
| 1 | IN-02b | What's been on your mind? | long text + **voice note** | required (min 10 chars or a voice note) |
| 1 | IN-02c | For how long? | single | Days · Weeks · Months · Years |
| 2 | IN-03 | How have you been feeling? | multi chips | Fear · Worry · Anxiety · Overthinking · Anger · Irritability · Sadness · Loneliness · Guilt · Low confidence · Overwhelm · Indecision · Exhaustion · Grief or loss · Shock · Jealousy · Hopelessness · Restlessness · Something else (text) |
| 3 | IN-04 | Tell us a little more | per selected feeling: "which feels closest?" (single/multi) + intensity Mild · Moderate · Strong | nuance statements in §4 |
| 4 | IN-05 | Any physical discomfort? | No / Yes → **body map** (front/back) + chips | Head · Neck · Shoulders · Upper back · Lower back · Chest · Stomach · Joints · Skin · Other; type: Pain · Stiffness · Tension · Other. Note: "We don't diagnose or treat medical conditions — please keep seeing your doctor." |
| 5 | IN-06 | Sleep & energy | owl-face scale + pills + sliders | Sleep quality (5 owl faces) · hours (<5, 5–6, 7–8, 8+) · waking at night (Y/N) · energy 1–5 · stress 1–5 · appetite (less / same / more) |
| 6 | IN-07 | Anything changing in life? | multi chips + text | New job or role · Relationship · Loss of someone close · Moving home · Exams · Health · Money worries · New baby · Retirement · Nothing major · Other |
| 7 | IN-08 | For your safety | yes/no rows | Seeing a doctor/therapist? · Taking medicines? (text) · Pregnant or breastfeeding? · **Prefer alcohol-free remedy?** · Allergies / sensitive skin (for oils)? (text) · Any diagnosed condition you'd like us to know? (optional text) |
| 8 | IN-09 | One gentle question | single | "Lately, have you had thoughts of harming yourself, or that life isn't worth living?" No · Sometimes · Often → **§6 safety protocol** |
| 8 | IN-10 | How would you like to feel? | multi chips + text | Calm · Confident · Rested · Clear-minded · Hopeful · Connected · Patient · Lighter · Free · Focused |
| — | IN-11 | Review & consent | summary + toggles | Edit per section; "Share with my consultant" (required); "Let AI prepare a private summary for my consultant" (default on, can turn off) |
| — | IN-11b | Saved → continue booking | info | "Jitu Bhaiya will read this before you meet." |

**Follow-up check-in (IN-12):** (a) overall now (5 owl faces) · (b) each feeling from last time → Better / Same / Harder + "Something new" · (c) anything new (text/voice) + "Took my drops": Every day / Most days / Sometimes / Rarely.

## 4. Nuance statements → Bach flower mapping (reference for the consultant)

Shown to the client as plain statements; each maps to the flower(s) Dr Bach described for that state. Jitu Bhaiya may edit wording and mapping (`intake_mapping` table, versioned).

> ✅ **Owner decision 2026-11-17:** "Flowers to consider" stays — **visible to Jitu Bhaiya only**. ⏳ **Jitu Bhaiya to review and approve every statement and flower below before launch** (CONTENT-CHECKLIST #4b). Build the mapping as editable data so his changes need no code.

| Feeling chip | Client statement ("which feels closest?") | Flower(s) |
|---|---|---|
| Fear | Fear of specific things (exams, illness, travel, people) | Mimulus |
| Fear | A vague fear of the unknown, without knowing why | Aspen |
| Fear | Sudden panic or terror | Rock Rose |
| Fear | Fear of losing control or "snapping" | Cherry Plum |
| Fear / Worry | Constant worry for my loved ones | Red Chestnut |
| Overthinking | The same thoughts go round and round; can't switch off | White Chestnut |
| Indecision | Can't decide between two choices; mood swings | Scleranthus |
| Indecision | I doubt my own judgement and keep asking others | Cerato |
| Indecision | Unsure what to do with my life | Wild Oat |
| Low confidence | I expect to fail, so I don't try | Larch |
| Low confidence | I can't say no; I please others | Centaury |
| Sadness | Heavy gloom that comes for no clear reason | Mustard |
| Sadness | Discouraged after a setback | Gentian |
| Hopelessness | I've given up hope | Gorse |
| Hopelessness | At the very end of what I can bear | Sweet Chestnut |
| Exhaustion | Completely drained after a long effort | Olive |
| Exhaustion | Mondays/tasks feel too heavy to start | Hornbeam |
| Exhaustion | I keep pushing on even when exhausted | Oak |
| Overwhelm | Overwhelmed by responsibilities | Elm |
| Overwhelm | Trying too hard; over-enthusiastic, can't relax | Vervain |
| Anger / Irritability | Quick to get impatient | Impatiens |
| Anger / Jealousy | Jealousy, envy, suspicion or anger | Holly |
| Anger | Bitterness, resentment, "why me?" | Willow |
| Anger | Critical and intolerant of others | Beech |
| Anger | Need to control or dominate | Vine |
| Guilt | I blame myself, even for others' mistakes | Pine |
| Guilt | Feeling unclean or disliking something about myself | Crab Apple |
| Loneliness | I prefer to be alone; others find me distant | Water Violet |
| Loneliness | I can't bear being alone; I need to talk about my problems | Heather |
| Loneliness | Possessive; I need to be needed | Chicory |
| Grief or loss | Shock or grief I haven't recovered from | Star of Bethlehem |
| Grief or loss | Living in the past; homesick; nostalgic | Honeysuckle |
| Shock | A recent shock or trauma | Star of Bethlehem |
| Restlessness | Hiding worries behind a cheerful face | Agrimony |
| Restlessness | Daydreaming; not really "here" | Clematis |
| Worry | Hard on myself; very strict standards | Rock Water |
| Apathy (Something else) | Resigned; nothing interests me | Wild Rose |
| Repeating patterns | I keep making the same mistakes | Chestnut Bud |
| Life change (IN-07) | Any big change (job, move, relationship, baby, retirement) | Walnut |

## 5. AI case summary (consultant only)
- **When:** on IN-11 submit, on any edit, and on each follow-up check-in. Cached; regenerated on change.
- **Model:** Claude via the server-side API (the building chat loads the `claude-api` skill to pick the current model and set up prompt caching). Never called from the browser.
- **Inputs:** intake answers only (+ previous check-ins). **Not** the consultant's private notes. Client consent (IN-11) required; if declined, Jitu sees the structured answers without AI text.
- **Output (strict JSON → UI):** `summary` (4 short lines: who & main concern · emotional picture · body/sleep/energy · goals), `flags` (safety, alcohol-free, pregnancy, allergies, medication, under-18), `questions_to_explore` (3 open questions he might ask), `progress_note` (follow-ups: 3 lines Better/Same/Harder).
- **Flowers to consider:** generated **deterministically from §4 mapping**, not by the AI, so every suggestion shows its reason ("Aspen — 'a vague fear of the unknown'"). AI may only order them by intensity. Labelled "Reference — your judgement decides"; **never shown to the client**; one-tap "+ Add to blend" (D-37).
- **Guardrails:** no diagnosis, no medical claims, no remedy prescriptions in the summary text; language "client reports…"; every summary shows "AI summary · verify with the client"; prompts and outputs logged (audit) without being used for training.

## 6. Safety protocol (IN-09)
- **No:** continue. **Sometimes / Often:** immediately show the support card (Tele-MANAS **14416**, free, 24×7 — *verify number before launch*), plus "If you are in immediate danger call **112**"; client can continue booking.
- Creates a **priority flag for Jitu Bhaiya only** (push notification + rose banner on session prep) — owner decision 2026-11-17: nobody else is alerted. The answer is visible only to him.
- Wording reviewed and approved by Jitu Bhaiya before launch (D-38).

## 7. Cross-module effects
| Data | Used by |
|---|---|
| Alcohol-free preference | Remedy builder default base; **Manager prep sheet shows "ALCOHOL-FREE BASE"** |
| Allergies / sensitive skin, pregnancy | Ask BeWise + shop: hide/warn on unsuitable oils; consultant flags |
| Feelings from intake | Pre-fill "What's troubling her?" in Live session (tag "from intake") and progress tracking baseline |
| Check-in Better/Same/Harder | 3-line progress summary (CL-56 / CN-05) |

## 8. Privacy (India DPDP Act 2023)
Sensitive personal data: explicit consent (IN-11), purpose-limited, encrypted at rest, consultant-only RLS (manager/owner cannot read answers; owner sees aggregate stats only), client can view/edit/delete, retention policy set by owner. AI processing disclosed and optional.

## 9. Screens
| ID | Screen | Board |
|---|---|---|
| IN-01 | Intro | intake-01 |
| IN-02 | Who & what's on your mind | intake-01 |
| IN-03 | How have you been feeling? | intake-01 |
| IN-04 | Tell us a little more (nuance + intensity) | intake-02 |
| IN-05 | Physical discomfort (body map) | intake-02 |
| IN-06 | Sleep & energy | intake-02 |
| IN-07 | Life changes | intake-03 |
| IN-08 | For your safety | intake-03 |
| IN-09 | One gentle question (+ support card) | intake-03 |
| IN-10 | How would you like to feel? | intake-04 |
| IN-11 | Review & consent → Saved | intake-04 |
| IN-12 | Follow-up check-in (3 steps) | intake-05 |
| CN-33 | Session prep with AI case summary + flags | intake-06 |
| CN-34 | Her answers (Summary · Answers · Changes) | intake-06 |
| CN-35 | Flowers to consider (reference) | intake-06 |
| CN-36 | Safety notification · Troubling pre-filled from intake · Since last time (AI progress note) | intake-07 |
