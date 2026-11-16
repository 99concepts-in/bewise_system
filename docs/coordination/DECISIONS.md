# Decisions Register

> **Owner:** HUB only. Chats build with the **Default** until a decision is recorded here, and tag the code
> `// @decision(D-xx)` so it's easy to change later.

| ID | Question | Default used until decided | Needed by | Status |
|---|---|---|---|---|
| D-01 | Tech stack & hosting | Next.js 15 + TypeScript + Tailwind + shadcn/ui · Supabase (Mumbai) · Vercel · Razorpay | Phase 0 | **OPEN — recommend approve** |
| D-02 | Is the remedy blend charged separately or included in the consultation fee? | Separate remedy order; price from setting `remedy.pricing` (placeholder ₹0 → configurable) | K4, C4 | OPEN |
| D-03 | Can the owner read practitioner private notes & questionnaire answers? | **No** by default; break-glass permission with audit | K2 | OPEN |
| D-04 | Client sign-in method | Phone OTP (+91) primary, email fallback; staff email + password | Phase 0 | OPEN — needs SMS provider (MSG91/Twilio) |
| D-05 | Payment account | Razorpay test keys in dev; live keys at go-live; GSTIN & legal entity name for invoices | O2 | OPEN — credentials needed |
| D-06 | Courier partner | Manual courier + AWB entry v1; Shiprocket API later | M2 | OPEN |
| D-07 | WhatsApp provider | Meta WhatsApp Cloud API (or BSP like Interakt/AiSensy); templates need Meta approval | O3 | OPEN |
| D-08 | Cancellation / reschedule policy | ≥24h before: free reschedule / full refund; <24h: one reschedule, no refund; no-show: no refund | K1, C2 | OPEN |
| D-09 | Consultation types, durations, fees, online meeting tool | First consultation 60 min, Follow-up 30 min, fees placeholder; consultant's fixed Google Meet/Zoom link | K1, O1 | OPEN |
| D-10 | Source & approval of Bach Flower library content | Names + 7 groups seeded; descriptions written/approved by Jitu Bhaiya before go-live | K4 | OPEN |
| D-11 | Manager scope (Haresh) | Office ops + catalogue + inventory + manufacturing + procurement + billing entry + follow-ups; no accounting/reports/approvals | Phase 0 | OPEN — confirm |
| D-12 | Domain, email sender, brand email | e.g. bewisewellness.in, `care@` sender | Go-live | OPEN |
| D-13 | Chart of accounts, GST treatment, inventory valuation method | Draft CoA by OWNER chat, validated by a qualified accountant before go-live | O2 | OPEN |
| D-14 | Multiple consultants in future? | Data model supports N consultants; v1 UI assumes one (Jitu) with consultant picker hidden | K1 | OPEN |
| D-15 | Client journal shared with consultant by default? | Yes, toggle in Privacy & data (CL-50) | C5, K2 | OPEN |
| D-18 | Questionnaires in client flow? | **DECIDED 2026-11-16: No.** Optional booking note instead (CL-15). Questionnaire module → P3 | K3, C3 | ✅ DECIDED |
| D-19 | Journal scope | **DECIDED: minimal** — date, time, emotion (8 owl faces) + search. Goals separate | C5 | ✅ DECIDED |
| D-20 | Post-session feedback | **DECIDED: yes** — rating + tags + notes for consultant after every appointment (CL-23), consultant can read | K2, C3 | ✅ DECIDED |
| D-21 | UI font | **DECIDED: Plus Jakarta Sans** (UI) + Cormorant Garamond (display). Owner approved | Phase 0 | ✅ DECIDED |
| D-22 | Visual direction | **DECIDED: Quiet Luxury v2** (`design/inspiration/README.md`, boards in `design/client-v2/`) | All | ✅ DECIDED |
| D-16 | Refund approval threshold for Manager | Manager can refund up to ₹2,000; above needs Owner approval | O4 | OPEN |
| D-17 | Who is the Owner account (person) and is the owner also a consultant? | Separate owner account; multi-role supported | Phase 0 | OPEN |
