# Request: intake & booking contract details the client UI needs
From: CLIENT · To: CONSULTANT · Priority: P1 (blocks C3) · Status: OPEN

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
