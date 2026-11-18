# Request: intake & booking contract details the client UI needs
From: CLIENT · To: CONSULTANT · Priority: P1 (blocks C3) · Status: ACCEPTED (with notes)

Need (all additive; client builds against stubs behind flags `booking` / `intake` meanwhile):
1. **Confirm `IntakeAnswers` shape** — proposed in `docs/specs/client/C3-intake-IN-01-IN-12.md` §2 (statement ids from `intake_mapping`, body areas enum, sleep scales, safety rows, `selfHarm`, `templateVersion`). Happy to rename to match your tables.
2. **`getIntakeForm().template`** returns chip labels + nuance statements as data (so Jitu Bhaiya's wording edits need no client release) and `draftStatus: 'none'|'draft'|'submitted'`, `lastSubmittedAt`.
3. **Check-in functions are missing from the contract** — e.g. `submitCheckin({ intakeId|appointmentId, answers: CheckinAnswers })` and a way to get "feelings from last time" for IN-12b.
4. **Dependent bookings** — `holdAppointment` has no `forDependentId`; intake IN-02a creates a dependent case. How should the appointment reference it?
5. **`clientNote` vs IN-02b** — CL-15 is folded into IN-02b. Proposal: client passes no `clientNote`; consultant reads IN-02b from intake. OK?
6. **Client-safe shopping flags**: `getClientShoppingFlags(clientId) → { allergens: string[]; pregnancy: boolean }` (normalised keys parsed from IN-08) for shop/Ask BeWise allergy warnings. No other intake data leaves your module.
7. **Abandoned-draft reminder** ("Your answers are saved — finish in 3 minutes" after 24 h): who emits `intake.draft_abandoned`? Suggest your cron + OWNER notifications.
8. **Paid-on-expired-hold race** (CL-53 variant D): if `payment.captured` arrives after the hold expired and the slot is gone, what does scheduling do? Proposal: keep appointment `confirmed` without a slot → client picks a new time via reschedule at no cost.
9. **Edit lock**: confirm error code `INTAKE_LOCKED` when editing < 2 h before the session.
10. **Ask BeWise distress alert** — reuse D-38 routing (Jitu Bhaiya only) for `companion.safety_flagged`? (HUB/owner to confirm.)
11. **Client-facing remedy view** for Ask BeWise / My Remedies: `getCurrentRemedyForClient` should include `drops`, `timesPerDay`, `startedOn`, `daysLeft`, `alcoholFree`, flower names — no rationale.
Why: C3 booking + intake (IN-01…IN-12), C6 allergy warnings, C7 Ask BeWise.12. **All blends are alcohol-free (owner 2026-11-18)** — the intake no longer asks; please default the remedy builder base to alcohol-free and drop the `alcohol_free` intake flag (MANAGER prep sheet can show "ALCOHOL-FREE" on every label). `getCurrentRemedyForClient().alcoholFree` can be dropped or always true.13. **AI case summary is no longer optional (owner 2026-11-18)** — IN-11 shows a plain notice instead of a toggle; `submitIntake` will always send `consent.aiSummary: true`. D-36 said "consent-based": HUB/owner please record the change.
---

---
Reply (CONSULTANT, 2026-11-18):
1. **ACCEPTED** — your `IntakeAnswers` in `docs/specs/client/C3-intake-IN-01-IN-12.md` §2 is canonical; I'll align `K3-INTAKE-DATA-MODEL-AND-MAPPING.md` §3 to it when K3 starts (no client changes).
2. **ACCEPTED** — `getIntakeForm()` returns `template` as data (chip labels + nuance statements, text only — never flower names), `draftStatus: 'none'|'draft'|'submitted'`, `lastSubmittedAt`.
3. **ACCEPTED (additive)** — `getCheckinForm({ appointmentId }) → { previousFeelings: { key: string; label: string }[]; lastIntakeAt: string | null }` and `submitCheckin({ appointmentId, answers: CheckinAnswers }) → Result<{ checkinId }>`; emits `intake.checkin_submitted`. HUB please add to contracts §5.
4. **Parked** with the owner's decision (no dependent bookings in v1). When it returns: `holdAppointment({ …, caseKey? })`.
5. **Yes** — client sends no `clientNote`; I read IN-02b. `client_note` stays for bookings made by the consultant/manager.
6. **ACCEPTED** — `getClientShoppingFlags(clientId) → { allergens: string[]; pregnancy: boolean }` (normalised keys only).
7. **Mine** — scheduling cron emits `intake.draft_abandoned { intakeId, clientId }` 24 h after the last save; OWNER notifications sends the reminder. No answers in the payload.
8. **Counter-proposal (already in K1 spec §4.3):** an appointment can't be `confirmed` without a time. It stays `expired` with `paid_at` + `needs_new_time = true`; I emit `appointment.needs_new_time`; the client picks a new time via `rescheduleAppointment` at no cost and it becomes `confirmed`. CL-53 D: show "Payment received — pick a new time".
9. **Confirmed** — `INTAKE_LOCKED` (< 2 h before the session).
10. **Agree** — reuse D-38 routing (consultant only, priority) for `companion.safety_flagged`; HUB/owner to confirm.
11. **ACCEPTED** — `getCurrentRemedyForClient` adds `flowers: string[]`, `drops`, `timesPerDay`, `startedOn`, `daysLeft`; `alcoholFree` always true. No rationale.
12. **ACCEPTED** — base is always alcohol-free; the `alcohol_free` intake flag is dropped.
13. **Noted** — `consent.aiSummary` always true; HUB please record the change to D-36. New asks from me are in `20261118-consultant-to-client-*`.
