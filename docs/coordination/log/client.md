# CLIENT chat — work log

> Only the CLIENT chat writes this file. **Newest entry at the top.** Format: see `docs/04-COORDINATION-PROTOCOL.md` §4.

## 2026-11-18 — Owner review round 1 (preview) · branch claude/new-session-94881h
**Status:** Pushed — auto-deploys via "Client app → Pages & Hostinger"
**Done:** welcome story rewritten (Welcome to BeWise Wellness · Book with Jitendra Khimlani · Bach flower remedy benefits · "Let's begin"); decorative rings contained (no overlap with text); all cut-out art re-made with neural background removal (no floor patches); mood characters normalised to one box/baseline; **31 feelings** incl. Happy with search in the log sheet; **journal notes** (add/edit/search); **goals on Home**; 4-digit OTP; no session durations shown; photo copy rewritten; WhatsApp + offers consents default on (owner); subtle focus ring; bottom nav fixed for trailing-slash URLs on static hosting; Meet sheet layout fixed; "Client stories" testimonials section (empty until consented quotes); follow-up path for returning clients
**Verified:** Apache 2.4 + static export, full journeys, 0 errors / 0 broken assets
**Contracts changed:** proposals in `20261117-client-to-hub-contract-drift.md` §9 (journal note, Emotion enum, OTP length)
**Also (late round 1):** intake fully optional (every question skippable; review shows "Skipped"), "Who is this for?" removed — dependent bookings parked until the owner asks again
**Needs from owner:** consented testimonials (Monika, Mitul Shah, Dhaval Gohil, Shivam S. + more); counsel view on pre-ticked consents

## 2026-11-17 — Auto-deploy to Hostinger on every commit · branch claude/new-session-94881h
**Status:** Workflow ready — activates when the owner adds FTP secrets (or the hPanel Git webhook secret)
**Done:** workflow "Client app → Pages & Hostinger": typecheck → Hostinger build → zip artifact → `hostinger-build` branch → FTP sync of changed files (secrets `HOSTINGER_FTP_SERVER/USERNAME/PASSWORD`, vars `HOSTINGER_FTP_DIR/PROTOCOL/BASE_PATH`) → optional hPanel webhook (`HOSTINGER_WEBHOOK_URL`); deploys queue (no cancel mid-upload); FTP step skips cleanly without secrets. Guide updated.

## 2026-11-17 — Hostinger hosting package · branch claude/new-session-94881h
**Status:** Ready — owner hosting on Hostinger 2026-11-18
**Done:** `pnpm export:hostinger` → `dist/bewise-client-hostinger.zip` (static export + `.htaccess`: https redirect, pretty URLs, 404, gzip, security headers incl. camera permission, noindex, caching); workflow job publishes branch `hostinger-build` + zip artifact for hPanel Git auto-deploy; guide `apps/client/hosting/HOSTINGER.md`. Verified on Apache 2.4 (routes, headers, caching, full browser journey incl. camera, 0 errors)
**Note:** preview only — data stays on the visitor's device; not for real clients until the foundation/backend lands
**Next:** owner picks the (sub)domain; HUB to fold hosting into D-01/D-12 decisions (planned prod host was Vercel)

## 2026-11-17 — Client preview on GitHub Pages · branch claude/new-session-94881h
**Status:** Workflow added — waiting for the owner to switch on Pages (Settings → Pages → gh-pages)
**Done:** static-export mode for `apps/client` (`STATIC_EXPORT=1`, base path, `?id=` detail routes, pre-rendered products); `.github/workflows/client-preview-pages.yml` (typecheck → export → publish to `gh-pages`); verified locally under `/bewise_system/` — full journey incl. camera, 0 errors, 0 broken assets
**Shared files touched:** new `.github/workflows/client-preview-pages.yml` (additive, scoped to `apps/client/**`) — HUB please fold into CI when the foundation lands
**Next:** PR `[CLIENT] Client app preview` for review

## 2026-11-17 — Client app built (standalone preview, owner request) · branch claude/new-session-94881h
**Status:** Built & pushed — preview app in `apps/client/` (foundation still ⬜, so self-contained; see request `20261117-client-to-hub-standalone-client-app.md`)
**Done:** 22 routes, Next.js 16 + Tailwind v4 + Motion: splash/story, phone OTP (demo), about you, **onboarding photo (live camera, flip, retake, gallery)**, privacy, you're in · Home (one contextual card, tap-to-log moods, ritual drops, Ask BeWise, progress, insight) · journal + goals · booking wizard with full intake IN-01…IN-11 (voice note, body map, safety card 14416/112) + follow-up check-in IN-12, IST slots, 15-min hold, Razorpay-style pay sheet, booked + calendar · sessions (countdown, reschedule-only, feedback) · remedies (blend, flowers, drops ritual, reminders, progress, reorder) · shop/product (allergy warnings) /bag/checkout/orders/tracking/replacement · Ask BeWise (on-device responder with spec guardrails) · Me (photo, details, reminders, privacy export/delete, sample data). Assets cut from design sheets by `apps/client/scripts/cut_assets.py`.
**Verified:** typecheck + production build clean; Playwright journey (onboarding → intake → pay → booked → shop → checkout → Ask BeWise) with 0 console errors; fake-camera capture saves photo; perf FCP 0.14–0.29 s, LCP 1.1–1.9 s (4× CPU, 4G).
**Contracts changed:** none (store actions annotated with the contract calls they stand in for)
**Migrations:** none · **Events:** none emitted (preview)
**Needs from others:** HUB — plan to fold `apps/client` into the foundation; MANAGER/crm — private photo storage for CL-05b; plus the earlier requests (consultant intake contract, manager catalog fields, owner settings/checkout)
**Breaking changes:** none
**Next:** owner review of the preview; swap stubs for real modules once FOUNDATION ✅ (C1…C8)

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

