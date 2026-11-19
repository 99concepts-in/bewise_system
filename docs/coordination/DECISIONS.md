# Decisions Register

> **Owner:** HUB only. Chats build with the **Default** until a decision is recorded here, and tag the code
> `// @decision(D-xx)` so it's easy to change later.

| ID | Question | Default used until decided | Needed by | Status |
|---|---|---|---|---|
| D-01 | Tech stack & hosting | **SUPERSEDED by D-44 (2026-11-18):** Hostinger — static apps (Next.js export / Vite) + **PHP 8 API + Hostinger MySQL**. Razorpay unchanged | Phase 0 | ✅ DECIDED (D-44) |
| D-02 | Remedy charged separately? | **DECIDED 2026-11-17: remedy INCLUDED in the consultation fee** — remedy given after a paid session creates a ₹0 remedy order; **reorders** are charged at `remedy.reorder_price` (owner to set) | K4, C4 | ✅ DECIDED |
| D-03 | Can the owner read practitioner private notes & questionnaire answers? | **No** by default; break-glass permission with audit | K2 | OPEN |
| D-04 | Client sign-in method | Phone OTP (+91) primary, email fallback; staff email + password | Phase 0 | OPEN — needs SMS provider (MSG91/Twilio) |
| D-05 | Payment account | Razorpay test keys in dev; live keys at go-live; GSTIN & legal entity name for invoices | O2 | OPEN — credentials needed |
| D-06 | Courier partner | **DECIDED: Shiprocket** (multiple couriers, rates, labels, pickups, tracking); manual AWB fallback. Needs Shiprocket API credentials | M2 | ✅ DECIDED |
| D-07 | WhatsApp provider | **DECIDED 2026-11-19: Mart2Meta** (WhatsJet-based WhatsApp Cloud API panel, login.mart2meta.com). Template messages via `api/lib/whatsapp.php`; credentials on `/api/tools.php` (private config); templates & texts `hosting/WHATSAPP-MART2META.md` | O3 | ✅ DECIDED |
| D-08 | Cancellation / reschedule policy | **No refunds** (D-16). Default: reschedule free ≥24h before; <24h one reschedule; no-show forfeits — owner to confirm the reschedule window | K1, C2 | PARTLY DECIDED |
| D-09 | Consultation types & fees | **DECIDED 2026-11-17: First consultation ₹1,000 · Follow-up ₹800 — both include the remedy blend.** Durations default 60 / 30 min (confirm); online link = consultant's Google Meet/Zoom | K1, O1 | ✅ DECIDED (fees) |
| D-10 | Source & approval of Bach Flower library content | Names + 7 groups seeded; descriptions written/approved by Jitu Bhaiya before go-live | K4 | OPEN |
| D-11 | Manager scope (Haresh) | **DECIDED:** office ops, catalogue (phone + **computer**), inventory, **production & purchases**, all money follow-ups (collect + pay + expenses); no accounting/approvals | Phase 0 | ✅ DECIDED |
| D-12 | Domain, email sender, brand email | e.g. bewisewellness.in, `care@` sender | Go-live | OPEN |
| D-13 | Chart of accounts, GST treatment, inventory valuation method | Draft CoA by OWNER chat, validated by a qualified accountant before go-live | O2 | OPEN |
| D-14 | Multiple consultants in future? | Data model supports N consultants; v1 UI assumes one (Jitu) with consultant picker hidden | K1 | OPEN |
| D-15 | Client journal shared with consultant by default? | Yes, toggle in Privacy & data (CL-50) | C5, K2 | OPEN |
| D-18 | Questionnaires in client flow? | **SUPERSEDED by D-35 (2026-11-17).** Was: No. Optional booking note instead (CL-15). Questionnaire module → P3 | K3, C3 | ✅ DECIDED |
| D-19 | Journal scope | **DECIDED: minimal** — date, time, emotion (8 owl faces) + search. Goals separate | C5 | ✅ DECIDED |
| D-20 | Post-session feedback | **DECIDED: yes** — rating + tags + notes for consultant after every appointment (CL-23), consultant can read | K2, C3 | ✅ DECIDED |
| D-21 | UI font | **DECIDED: Plus Jakarta Sans** (UI) + Cormorant Garamond (display). Owner approved | Phase 0 | ✅ DECIDED |
| D-22 | Visual direction | **DECIDED: Quiet Luxury v2** (`design/inspiration/README.md`, boards in `design/client-v2/`) | All | ✅ DECIDED |
| D-16 | Refunds | **DECIDED 2026-11-16: no refunds at all.** Damaged/wrong/RTO → replacement order; session cancellations → reschedule only | All | ✅ DECIDED |
| D-17 | Who is the Owner account (person) and is the owner also a consultant? | Separate owner account; multi-role supported | Phase 0 | OPEN |
| D-23 | Logo update | **DECIDED 2026-11-16:** new master logo 'BeWise · Holistic Wellness' (`design/brand/bewise-logo-holistic-wellness.jpg`), descriptor 'Holistic Wellness' replaces 'WELLNESS'. Logo navy sampled `#243D91` (UI navy tokens unchanged). Client v2 boards still show the old descriptor — update when building. Needs SVG master | All | ✅ DECIDED |
| D-24 | Consultant main device | **DECIDED 2026-11-16: phone first**; iPad/laptop adaptation | CN | ✅ DECIDED |
| D-25 | Remedy approval workflow | **DECIDED: none.** Consultant taps "Give remedy" → client + office. FormulaStatus = draft (silent autosave) · given · superseded | K4 | ✅ DECIDED |
| D-26 | Client summary after session | **DECIDED: optional** (toggle) | K5 | ✅ DECIDED |
| D-27 | Troubling emotions per session | **DECIDED: yes**, editable catalogue (Anger, Insecurity, Loneliness, Fear, Anxiety, …) | K5 | ✅ DECIDED |
| D-28 | 3-line progress summary since last remedy for client + consultant | **DECIDED: yes**, AI-generated; client version excludes private notes; private notes not sent to AI by default | K, C | ✅ DECIDED |
| D-29 | Client AI chatbot "Ask BeWise" (answers on own data, suggests products) | **DECIDED: yes**, with guardrails (no diagnosis, no remedy changes, confirm before actions) | C | ✅ DECIDED |
| D-30 | Bach library size: owner said 36; standard is 38 + Rescue | Configurable library seeded with 38, hideable | K | OPEN |
| D-31 | Calendar sync | **DECIDED: yes** — Google two-way (OAuth; push sessions, pull busy times), Apple via iCloud CalDAV, private ICS feed for any app; clients get Add-to-calendar. Needs Google Cloud OAuth client (credential) | K1, CN-28 | ✅ DECIDED |
| D-32 | Apple Health / Google Health Connect | **DECIDED: later phase** — requires native wrapper (Capacitor) since a PWA can't access them; consent per data type | Client P3 | ✅ DECIDED (later) |
| D-33 | Consultant & manager see business numbers | **DECIDED: yes, sales AND profit** (owner 2026-11-17) — read-only for Jitu Bhaiya (CN-30…32), in reports for Haresh | K, M | ✅ DECIDED |
| D-34 | Design v3 "Luxe" | **REJECTED 2026-11-17** ("last one was nice, this is basic"). **v2 Quiet Luxury stays** for the whole app (Cormorant Garamond + Plus Jakarta Sans, tone-on-tone cards, no dark hero cards). The custom icon SVGs remain available as an optional asset only | All | ❌ REJECTED |
| D-17 | (see above) Owner name & personal finance / payroll timing / accountant login | Asked in owner spec | O | OPEN |
| D-35 | Intake / case-taking before booking | **DECIDED 2026-11-17: yes** — full intake before first booking (≈5 min, save & resume), 2-min check-in before follow-ups; emotional (Bach-mapped nuance), physical (body map), sleep/energy, life changes, safety (meds, pregnancy, alcohol-free, allergies), self-harm check, goals | C, K | ✅ DECIDED |
| D-36 | AI case summary for consultant | **DECIDED: yes** — Claude server-side, consultant-only, consent-based, verify label, never in client view | K | ✅ DECIDED |
| D-37 | "Flowers to consider" for consultant | **DECIDED: ON for Jitu Bhaiya only** — deterministic mapping with reasons, reference only, his judgement decides, never shown to client (PRD §6/§15: system must not autonomously prescribe) | K | ✅ DECIDED 2026-11-17: **yes, Jitu Bhaiya only** |
| D-38 | Self-harm question + helpline | **DECIDED 2026-11-17:** keep the question; client sees Tele-MANAS 14416 / 112 immediately; **alert goes to Jitu Bhaiya only** (no owner/other contact); Jitu Bhaiya reviews wording; verify numbers before launch | C, K | ✅ DECIDED |
| D-39 | Accountant / CA login | **DECIDED 2026-11-17: yes** — role `accountant`: view & export reports, invoices, bills, ledgers, GST; no edits; no consultation or intake data | O | ✅ DECIDED |
| D-40 | Personal finance | **DECIDED: later phase** (not in first release) | O | ✅ DECIDED |
| D-41 | Payroll | **DECIDED: later phase** | O | ✅ DECIDED |
| D-42 | Owner greeting name | Pending — app says "Good morning" until the owner gives a name | O | OPEN |
| D-43 | Design v4 "Soft Bloom" (owner refs: Sintelly mobile + mood-tracker dashboard) | **ACCEPTED 2026-11-17 for the client app; v4 is the visual language for the whole build** (tokens `design/tokens.json` → `v4`, rules `design/v4-soft-bloom/README.md`). Consultant/manager/owner boards to be restyled in v4; until then build their layouts from v2 boards with v4 tokens | All | ✅ DECIDED |
| D-44 | Backend & database | **DECIDED 2026-11-18 (owner: "use Hostinger now", incl. DB):** PHP 8.1+ API in `api/` (RPC `POST /api/v1/<module>.<fn>`, names = contracts §5) + **Hostinger MySQL/MariaDB**, migrations in `api/migrations/`, one-time setup `/api/install.php`, private config outside `public_html`. Email-OTP for clients, password for staff. Sensitive columns encrypted (sodium). Works on every Hostinger plan (no Node server needed). Guide `hosting/HOSTINGER-DATABASE.md`, reference `api/README.md` | All | ✅ DECIDED |
