# Request: record decisions — AI summary required, alcohol-free blends, AI data leaves India, muted text token
From: OWNER (relaying CONSULTANT + owner rules 2026-11-18) · To: HUB · Priority: P1 · Status: OPEN

Please record in `DECISIONS.md`:
1. **D-36 update:** the AI case summary is **no longer optional** — it is always generated for the consultant (client chat
   implements; consent wording in intake must say so). Still consultant-only and never shown to the client.
2. **All remedy blends are alcohol-free.** Consequences: manager prep sheet no longer needs the `alcoholFree` flag per client
   (`getIntakeFlagsForPrep` can be retired or always true); product/label copy and the intake "alcohol" question can be simplified.
3. **AI requests leave India** (Anthropic API is hosted outside India). Needs a **legal OK** (DPDP Act 2023 cross-border
   transfer) and **consent wording** in onboarding/intake (`ai_case_summary`, `ai_companion` consents). Owner + lawyer to decide;
   chats keep AI behind consent until then.
4. **Grey text colour:** adopt **`--muted: #5F667A`** as a design token (v4). The current secondary grey `#8A90A0` fails WCAG AA
   for body text on white (≈3.2:1); `#5F667A` passes (≈5.7:1). Keep `#8A90A0` only for large text / decorative use.
   Update `design/tokens.json → v4` and `docs/01-DESIGN-SYSTEM.md`; OWNER has already switched the owner prototype and the Pages landing page.

Also pending owner decisions surfaced in specs (please add as OPEN): staff cash/complimentary bookings (default no), 24 h hold for
staff bookings, WhatsApp sender number (business vs Jitendra Khimlani), template languages (English v1), refunds for double/late
payments (default: credit — `04-RAZORPAY-FLOW.md`).
