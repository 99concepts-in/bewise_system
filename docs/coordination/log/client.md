# CLIENT chat — work log

> Only the CLIENT chat writes this file. **Newest entry at the top.** Format: see `docs/04-COORDINATION-PROTOCOL.md` §4.

## 2026-11-17 — Step 0 specs (foundation not ready) · branch claude/new-session-94881h
**Status:** Specs drafted — waiting for `FOUNDATION: ✅` before scaffolding
**Done:** `docs/specs/client/02-SHARED-UI-PATTERNS.md` (v4 frame, nav, states, drafts, analytics, routes) · `CL-08-home.md` (Home, Log a feeling, progress card; one-contextual-card priority table) · `C3-booking-wizard.md` (CL-11…17, hold → Razorpay → confirm sequence, CL-53 variants) · `C3-intake-IN-01-IN-12.md` (8-step UI, autosave/resume, voice note, body map, safety card incl. 112, check-in) · `C6-shop-checkout-CL-32-40.md` (allergy/pregnancy warnings, combined remedy + product bag, ₹0 orders skip Razorpay) · `C7-CL-55-ask-bewise.md` (Messages API + tool runner proposal, 13 tools, CompanionReply JSON, guardrails, system prompt, evals) · `legal/` drafts (privacy DPDP, terms, consultation & cancellation, shipping, replacement, wellness disclaimer) for owner review
**Contracts changed:** none (proposals only: `IntakeAnswers` shape, `CompanionReply` JSON)
**Events:** none yet (will emit order.placed / order.paid / order.cancelled in C6)
**Migrations:** none
**Needs from others:** CONSULTANT `20261117-client-to-consultant-booking-intake-contract.md` (P1) · MANAGER `20261117-client-to-manager-catalog-fields.md` · OWNER `20261117-client-to-owner-settings-checkout.md` (P1) · HUB `20261117-client-to-hub-contract-drift.md` (refund leftovers, `intake` flag, nav order, Ask BeWise surface decision)
**Owner content needed:** product list (due 18 Nov) + reorder price, testimonials w/ consent, studio address, languages, legal entity/GSTIN/grievance officer, legal-draft answers (11 questions in `legal/README.md`), Anthropic API key
**Breaking changes:** none
**Next:** C1 public site & onboarding specs (CL-01…07), then journal/goals; start C1 build as soon as FOUNDATION ✅

