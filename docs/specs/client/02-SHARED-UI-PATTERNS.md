# Client app — shared UI patterns (v4 "Soft Bloom")

> **Owner:** CLIENT chat · Status: **DRAFT v0.1 (2026-11-17)** — Step 0 spec, written before the foundation exists.
> Applies to every `CL-xx` / `IN-xx` screen. Per-screen specs only describe what differs from this file.
> Sources: `design/v4-soft-bloom/README.md`, `design/tokens.json → v4`, `docs/01-DESIGN-SYSTEM.md` §6–10, boards `design/client-v4/`.

## 1. Frame & layout

| Item | Rule |
|---|---|
| Target | **375 × 812 first**; must work 320 → 430 px. ≥ 768 px: content column max 480 px centred on the gradient (client app stays a phone layout on desktop; public site has its own desktop layout) |
| Background | `v4.background-gradient` (periwinkle `#DCE2F5` → ivory `#FAF9F5` → sage `#DCE7D9`) fixed to the viewport, never on cards |
| Gutters | 20 px side padding; 16 px between cards; cards `#FFF`, radius 32, shadow `0 8px 24px rgba(24,41,87,.06)`, inner padding 20–24 |
| Header (tab screens) | Logo lock-up "BeWise · Holistic Wellness" (D-23) left; 44 px round white icon buttons right: **Search** (global, CL-34 when on Shop; else app search) · **Bell** (CL-10, dot when unread) |
| Header (flow screens) | Logo left, 44 px round **Back** button right (as boards CL4-10). Wizards add a stepper or "Step n of N · Save & finish later" bar under the header |
| Headline | Two-tone Plus Jakarta Sans 700, 28–32 px: first words navy `#182957`, rest grey `#8A90A0` ("Pick a *time*", "Review & *pay*") |
| Body | 15 px / 24 · labels 13 px 500 · secondary text `#5B6275` (AA on white) — `#8A90A0` is **headline-only** (fails AA at body size) |
| Bottom nav | Floating navy pill (64 px high, 16 px from bottom + safe-area), icons only with `aria-label`: **Home · Remedies (leaf) · Book (calendar) · Shop (bag) · Me (person)**. Active = white circle + navy icon. Shown on tab roots only; hidden in wizards, checkout, chat, sheets |
| Primary CTA | Full-width navy pill 56 px, pinned above the safe area in flows. Pay buttons use `v4.cta-gradient` + lock icon ("Pay ₹1,000"), caption "Secured by Razorpay · UPI, cards, netbanking" |
| Mascot | 3D owl appears **at most once per screen** (Home Ask BeWise card, empty states, success screens, chat) |

## 2. Mood characters (journal, home, intake scales)

`Emotion = calm | joyful | grateful | hopeful | tired | anxious | sad | irritated` (contract §3). Sprite `design/assets/v4/mood-characters.png` → export to 8 individual WebP/PNG @1x/2x/3x + `alt` = label. Colours `v4.mood-colors`. Never colour-only: label always under the character. Selected = 2 px navy ring + `aria-pressed="true"`.

## 3. States (every screen — `docs/04` §8 DoD)

| State | Pattern |
|---|---|
| Loading | Skeleton blocks matching final card layout (no spinners for page loads). Buttons: inline spinner + disabled |
| Empty | CL-52: mascot or 3D botanical + one line + one action. Copy per screen spec |
| Error (load) | Card: "We couldn't load this right now." + **Try again**. No codes, no stack traces. Log `client_error` event |
| Error (field) | Red text under field with icon, `aria-describedby`; validate on blur + submit |
| Success | Only after the **server** confirms (no optimistic "paid", no misleading toasts) |
| No permission | "This page isn't available for your account" + Back to Home |
| Offline (CL-54) | Soft top banner "You're offline — we'll keep what you've done safe." Read cached **public** pages only; writes disabled except intake/journal drafts, which queue locally and sync (§7) |
| Feature flag off | Route not linked and returns 404 page; no dead buttons (PRD §20) |

## 4. Forms

- Labels always visible; required = `*` + "(required)" for screen readers.
- Phone `+91` prefix pill, 10 digits, `inputmode="numeric"`, `autocomplete="tel-national"`.
- OTP: **4 boxes** (owner 2026-11-18) as one `<input autocomplete="one-time-code" inputmode="numeric" maxlength=4>` visually split (Web OTP API where available). SMS provider must send 4-digit codes.
- Pincode → city/state auto-fill (India Post data; MANAGER/HUB helper — fallback manual).
- Money is always formatted by `formatINR()` from paise (Indian grouping `₹1,000`); never compute prices client-side for anything sent to the server.
- Dates: `Thu 21 Nov · 11:00 AM`, timezone `Asia/Kolkata`, "Times in IST" caption on slot pickers.
- Chip groups: `role="group"` + `aria-labelledby`; single-select = radio semantics, multi = checkbox semantics.

## 5. Accessibility

WCAG 2.1 AA · 44 px targets · focus ring 2 px navy + 2 px ivory offset · `prefers-reduced-motion` → no splash/Bach animation autoplay (static poster) · `lang="en-IN"` · bottom sheets trap focus and close on Esc/back gesture · charts (journal daily bars) have a visually-hidden table alternative.

## 6. Copy voice (enforced in review)

Warm, plain, short. **No** cure/medical claims ("heals", "treats", "therapeutic", "clinically proven"), **no refund wording** (D-16) except "Sessions are non-refundable". Practitioner is **"Jitendra Khimlani"**, title **"Bach Remedy Therapist"** (board QA note — boards say "Holistic Wellness Consultant", don't copy). Fees: **First consultation ₹1,000 · Follow-up ₹800, both include your remedy blend** (D-09/D-02) — boards showing ₹2,500 are illustrative only.

## 7. Drafts & local storage

| Data | Where | Rule |
|---|---|---|
| Intake draft | Server via `saveIntakeDraft` (debounced 800 ms + on step change). Flag `intake` off → IndexedDB `bw-intake-draft` encrypted with a per-session key; cleared on submit/sign-out | Never in `localStorage`; never in the service-worker cache |
| Journal entry offline | IndexedDB queue → POST when online (idempotency key = client UUID) | |
| Cart | Server cart (`carts`) once signed in; guest bag (public shop) in `localStorage` as variant ids + qty only, merged on sign-in | |
| Wizard position | `sessionStorage` (step index only) | |

Service worker caches **public assets & public pages only** (contract §7.6) — never `/app/*` HTML or any API response.

## 8. Analytics events (client-side, no PII)

`screen_view{screen_id}` · `cta_tap{screen_id,cta}` · `booking_step{step,kind}` · `intake_step{step_id,ms_on_step}` · `intake_saved_for_later` · `checkout_open{purpose}` · `checkout_result{purpose,outcome}` · `mood_logged{emotion,source}` · `companion_message_sent` · `client_error{screen_id,code}`. Never send free text, intake answers, health data, names or phone numbers to analytics.

## 9. Routes (proposed)

```
(public)  /  /consultations  /about  /shop  /shop/[collection]  /product/[slug]  /legal/[page]  /help
(auth)    /welcome  /sign-in  /verify  /onboarding/about-you  /onboarding/privacy  /onboarding/done
(client)  /app  /app/journal  /app/goals  /app/notifications
          /app/book  /app/book/intake/[step]  /app/book/mode  /app/book/time  /app/book/review  /app/book/confirmed/[appointmentId]
          /app/book/check-in/[step]
          /app/sessions  /app/sessions/[id]  /app/sessions/[id]/waiting  /app/sessions/[id]/reschedule  /app/sessions/[id]/feedback  /app/sessions/[id]/summary
          /app/remedies  /app/remedies/flower/[id]  /app/remedies/ritual  /app/remedies/past  /app/remedies/ready/[remedyOrderId]
          /app/shop  /app/shop/[collection]  /app/shop/search  /app/product/[slug]  /app/saved  /app/bag  /app/checkout/address  /app/checkout/review  /app/orders/[id]/placed
          /app/orders  /app/orders/[id]  /app/orders/[id]/replacement  /app/payments  /app/payments/[invoiceId]
          /app/me  /app/me/details  /app/me/addresses  /app/me/reminders  /app/me/privacy  /app/help
          /app/ask
```
