# Request: contract / doc drift found while writing client specs
From: CLIENT · To: HUB · Priority: P2 · Status: OPEN

1. **Refund leftovers vs D-16**: `03-CONTRACTS` §3 `SalesOrderStatus` has `return_requested | returned | refunded`; `cancelAppointment` returns `refundEligiblePaise`; event `appointment.cancelled` carries `refundEligiblePaise`; §2 commerce lists `return_requests` while my brief lists `replacement_requests`. Proposal: rename table to `replacement_requests`, add `replacement_requested` status, deprecate refund fields (keep enum values for history only).
2. **Flags**: brief uses `intake`; contract §8 has no `intake` flag. Please add `intake` (and reuse `ai_assistant` for Ask BeWise).
3. **Nav order**: `01-DESIGN-SYSTEM` §5/§13 says "Home · Book · Remedies · Shop · Profile"; brief + v4 boards say **Home · Remedies · Book · Shop · Me**. I'm building the brief's order.
4. **Design system file** still says v2/Inter in places (D-43 makes v4 + Plus Jakarta Sans the build language).
5. **STATUS milestones** C1–C6 are the old plan; brief v2 has C1–C8 (C2 home/journal, C3 booking+intake, … C7 Ask BeWise, C8 polish).
6. **Boards to not copy**: CL4-10 shows ₹2,500 and "Holistic Wellness Consultant" (use ₹1,000/₹800 and "Bach Remedy Therapist"); CL4-08 IN-09 support card lacks the **112** line (D-38 requires it); typo "reschedile".
7. **New decision needed — Ask BeWise surface**: proposal = Claude Messages API + Tool Runner in our Next.js server (data stays in our tables for DPDP deletion; tools are RLS reads). Rationale in `docs/specs/client/C7-CL-55-ask-bewise.md` §3.
8. **Chat distress alert routing** — extend D-38 (Jitu Bhaiya only) to Ask BeWise?9. **Owner changes 2026-11-18 (client chat applied them in apps/client):**
   - Journal entries get an optional **note** (supersedes D-19 "emotion + time only") → `journal_entries.note text null` (client-owned table, additive).
   - **Emotion enum extended** from 8 to 31 values (adds `happy`, `excited`, `loved`, `peaceful`, `stressed`, `overwhelmed`, `lonely`, `angry`, …; list in `apps/client/src/lib/data.ts`). Extra feelings reuse the 8 characters tinted until new illustrations exist. Consultant journal views must handle the new values.
   - **Sign-in OTP is 4 digits** (D-04 provider config).
   - **Session durations are never shown** to clients (fees stay ₹1,000 / ₹800).
   - **WhatsApp updates + gentle offers consents default ON** — owner's call; DPDP counsel review needed before launch.
   - Booking shows a "Seen Jitu Bhaiya before? Book a follow-up" path for clients without app history.
   - **Intake fully optional** (owner): every IN-xx question can be skipped; "Who is this for?" removed (dependent bookings parked). CONSULTANT's case summary must cope with sparse answers.
   - "Client stories" testimonials section on booking — empty until consented quotes arrive (CONTENT-CHECKLIST #1).
---
