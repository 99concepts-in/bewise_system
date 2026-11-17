# CHAT 2 — CLIENT EXPERIENCE (public website + client portal + store)

> **How to start this chat:** open a new Claude Code session on `exceptionalappstudios-ship-it/bewise_system`
> and send: **"Read `chats/CHAT-2-CLIENT.md` and follow it."**
> Your chat tag is **`client`** (logs, requests, PR titles `[CLIENT] …`).


> ⚠️ **UPDATE 2026-11-16 (owner):** The client app is now specified by **`docs/specs/client/00-CLIENT-FLOW-AND-SCREENS.md` (CL-01…CL-54)** and designed in **`design/client-v2/`** (Quiet Luxury, `design/inspiration/README.md`). It replaces C-01…C-14 below where they differ: no questionnaires (optional booking note instead), minimal journal (date/time/emotion/search), separate Goals, post-session feedback & notes (CL-23 → `scheduling.submitSessionFeedback`), floating nav Home · Remedies · (Book) · Shop · Me, font Plus Jakarta Sans.

> ⚠️ **UPDATE 2026-11-16 round 2 (owner):** add **CL-55 Ask BeWise** (AI companion on the client's own data + product suggestions, `companion` module — yours) and **CL-56 progress card** (3 lines from `progress.getProgressSummary`, audience client). Board: `design/client-v2/CL-board-18-progress-ask-bewise.jpg`. New master logo 'BeWise · Holistic Wellness'.

> ⚠️ **UPDATE 2026-11-16 round 3 (owner): NO REFUNDS.** CL-22 cancel → reschedule only; CL-43 return → request replacement (photo); remove refund wording everywhere. See client spec section M.

> ⚠️ **UPDATE 2026-11-17 (owner): INTAKE BEFORE BOOKING.** Build IN-01…IN-12 from `docs/specs/client/01-INTAKE-CASE-TAKING.md` (designs `design/intake-v3/`) using `intake.*` functions; first booking inserts the intake after 'Choose consultation'; follow-ups get the 2-min check-in. Safety screen (IN-09) must show the helpline immediately.

---

## 1. Who you are and who you build for

You are the product designer + full-stack engineer for everything a **client** touches: the **public website** (`/`), sign-in UX, the **client portal** (`/app`) and the **aromatherapy store**, including cart and combined checkout. You own the `commerce` (cart, sales orders) and `journal` modules.

Primary user: a person in India booking a Bach Flower consultation and/or buying aromatherapy products, **almost always on a phone**, often first-time, sometimes anxious. Needs: understand the offer in seconds, book without friction, pay safely (UPI first), know what happens next, see their remedy and orders clearly, feel cared for — never pressured.

Design feel: calm, warm, premium, generous whitespace; Cormorant Garamond headings, Inter UI, navy primary buttons, sage secondary, ivory backgrounds, beige product tiles. Copy: gentle, clear, no medical/cure claims (brand guide §7).

## 2. Read before doing anything (in this order)

1. `docs/04-COORDINATION-PROTOCOL.md` (**mandatory**).
2. `docs/coordination/STATUS.md`, `DECISIONS.md`, other chats' logs, requests to you (`*-to-client-*`).
3. `docs/00-MASTER-PLAN.md`, `docs/01-DESIGN-SYSTEM.md`, `design/tokens.json`.
4. `docs/02-FLOWS-AND-SCREENS.md` — journeys **J1, J2, J3, J4, J5, J8** and screens **P-01…P-09, A-01…A-04, C-01…C-14**.
5. `docs/03-CONTRACTS.md` — *commerce*, *journal* (yours) and what you call: *scheduling*, *questionnaires*, *consultation & remedies*, *catalog*, *crm*, *fulfilment*, *finance*.
6. Boards: `design/boards/01-client-home-booking.jpg`, `02-client-questionnaire-remedies-journal.jpg`, `03-client-store-checkout.jpg`, `04-public-website.jpg`. Motion: `design/motion/` (splash + website hero loop).

## 3. Step 0 — check the foundation

`git fetch origin main && git merge --no-edit origin/main`, open `docs/coordination/STATUS.md`.
- **`FOUNDATION: ✅`** → start C1.
- Otherwise → **don't scaffold an app.** Write specs in `docs/specs/client/` for P-01, P-04, P-05, C-02, C-03 (each wizard step), C-06, C-09, C-10: layout per breakpoint, copy, fields & validation, states, events, acceptance criteria; plus the content outline for the public site and legal pages (as drafts for owner review). Commit, push, log, and tell the user you're waiting for the foundation.

## 4. What you own

| Kind | Items |
|---|---|
| Routes | `src/app/(public)/**`, `src/app/(client)/app/**`; UX polish of `src/app/(auth)/**` (HUB scaffolds auth logic) |
| Modules | `src/modules/commerce`, `src/modules/journal` |
| Tables | `carts`, `cart_items`, `wishlists`, `sales_orders`, `order_items`, `return_requests`, `journal_entries`, `client_goals` |
| Functions others call | *commerce* in `docs/03-CONTRACTS.md` §5 (replace HUB stubs; keep signatures) |
| Events you emit | `order.placed`, `order.paid`, `order.cancelled` |
| Events you handle | `remedy.given` → `createRemedySalesOrder()` (price from `getSetting('remedy.pricing')`, `@decision(D-02)`; ₹0 → mark paid immediately); `payment.captured`/`payment.failed` (purpose sales_order); `fulfilment.stage_changed`, `shipment.dispatched`, `shipment.delivered` → order status; `payment.refunded` |
| PWA | Manifest polish, install prompt UX, offline page, **public-only** caching (HUB sets base service worker) |
| Specs / tests | `docs/specs/client/**`, `tests/e2e/client/**` |
| Log | `docs/coordination/log/client.md` |

## 5. Do not touch

Consultant/manager/owner routes and modules (`scheduling`, `questionnaires`, `remedies`, `catalog`, `fulfilment`, `inventory`, `finance`, `notifications`, `settings` …), HUB docs, STATUS/DECISIONS. You **call** their functions; you don't edit them. Payment gateway code (Razorpay server, webhooks) belongs to OWNER `finance` — you only open checkout with what `createCheckout()` returns.

## 6. What you depend on (fallback while not live)

| Need | From | Fallback |
|---|---|---|
| Slots, hold, reschedule, cancel | CONSULTANT K1 | Contract stub + seed slots, flag `booking` |
| Consultation types & fees, policies, remedy pricing | OWNER O1 (`getSetting`) / scheduling | Seeded values |
| `createCheckout()` / `verifyCheckout()` / invoices / receipts PDFs | OWNER O2 | Stub behind flag `checkout`; Razorpay **test mode** once O2 lands |
| Products, variants, collections, availability | MANAGER M1 (`catalog`) | Seeded 6 products, flag `store` |
| Order tracking (courier, AWB) | MANAGER M2 (`getOrderTracking`) | Show order status only |
| Questionnaire render/save/submit | CONSULTANT K3 | Flag `questionnaires` |
| Current remedy & summaries | CONSULTANT K4/K5 | Empty state "Your remedy will appear here after your consultation" |
| Notifications inbox & prefs | HUB inbox + OWNER O3 | In-app inbox only |

## 7. Who depends on you

- MANAGER fulfilment needs **`order.paid`** with correct items/kinds (C4) — get the payload exactly right.
- OWNER finance needs sales orders with correct line amounts, tax category per line, and `clientId` (C4).
- CONSULTANT needs remedy orders to become paid sales orders (handler for `remedy.given`).

## 8. Milestones (in order; one PR each)

### C1 — Public website, sign-in UX, onboarding & consent (P-01, P-02, P-07, P-09, A-01…A-04, C-01, C-13 basics)
- P-01 per board 04: hero with the hero loop video (poster image fallback, reduced-motion → still), Book CTA, service cards, How it works, shop strip, about the consultant, footer (navy).
- P-02 consultation details from `listConsultationTypes()`; P-07 contact form → CRM lead (request MANAGER if function missing); P-09 legal pages as **drafts marked for owner review**.
- Auth UX: phone OTP (+91) first, resend timer, OTP autofill; redirect back to where the user was (e.g. mid-booking). Browsing and cart never require login.
- C-01 onboarding: name, DOB, city, gender optional, separate consent checkboxes (data processing — required; WhatsApp updates; marketing) → `crm.recordConsent()`.
- SEO: metadata, OpenGraph, sitemap, robots, structured data (LocalBusiness, Product).

### C2 — Booking flow (C-03, C-04)
- Wizard: Type → Mode (Online/In-person) → Date strip + slot grid → Details & consent → Confirm & pay → Confirmation. Back always keeps choices. Sticky primary button. Board 01.
- `holdAppointment()` on Continue from step 3 → show 15-min hold countdown; `createCheckout({purpose:'appointment'})` → Razorpay Checkout (UPI first) → `verifyCheckout()` → wait for confirmation event (poll/realtime) → success screen with add-to-calendar (.ics), join instructions, questionnaire CTA.
- Failure/timeout states: payment failed, hold expired (offer to pick again), slot taken.
- C-04: upcoming/past list, detail, reschedule (slot picker), cancel with policy text and refund outcome before confirming.

### C3 — Portal home, questionnaires (C-02, C-05)
- C-02 per board 01: next appointment, order/remedy tracker, payment due, follow-up prompt, questionnaire banner, journal check-in. Each card only shows when relevant; good empty state for new users.
- C-05 per board 02: one question per screen, progress, save & finish later (autosave), review & submit, success.

### C4 — Store, cart, combined checkout, orders (P-04, P-05, P-06, C-08, C-09, C-10, C-11)
- Shop grid with collection chips, search, filters; product detail with variants, MRP vs price, tabs (Description · Ingredients · How to use · Safety), stock state; wishlist.
- Cart: guest cart in cookie/local DB merged on sign-in; remedy line (from `remedy_orders`) and product lines **in one order** (`kind='combined'`).
- Checkout: address book (pincode → city/state), shipping (from settings), GST breakdown (from finance tax config — don't hardcode), pay → `order.placed` → on `payment.captured` mark paid → emit `order.paid`.
- C-10 orders list + detail with tracker (Ordered → Preparing → Shipped → Delivered), courier link, invoice download, return request (policy).
- C-11 payments: due invoices with Pay now (`createCheckout({purpose:'invoice'})`), history, receipts.

### C5 — My Remedies, journal, notifications, profile & privacy (C-06, C-07, C-12, C-13, C-14)
- C-06 per board 02: current blend (names, plain description, instructions, duration, approved date), previous versions, **Reorder this blend** (creates remedy cart line — request CONSULTANT/OWNER if a reorder function is needed).
- C-07 journal: daily mood/sleep/stress (1–5), notes, goals, weekly chart, "Share with my consultant" toggle (`@decision(D-15)`).
- C-12 inbox + channel preferences; C-13 addresses, consents (withdraw), download my data, deletion request; C-14 help & policies.

### C6 — PWA, accessibility, performance
Install prompt, splash (`design/motion`), offline page, cache **only public pages/assets/product images**, Lighthouse ≥ 90 mobile on P-01/P-04/P-05, AA accessibility pass, e2e for J1 (client side), J2, J4.

## 9. Rules specific to you

- Phone-first (375px) for every screen; bottom tabs **Home · Book · Remedies · Shop · Profile**.
- Never show practitioner notes, formula rationale or other clients' data. Clients see only approved/shared content.
- Never trust prices from the browser: server recomputes totals from catalog + settings.
- Payment success is shown only after server confirmation (no optimistic "Paid!").
- Product and service copy: no cure/treatment claims; use "supports", "may help you feel" etc.

## 10. Every session

**Start:** fetch + merge `origin/main`; read STATUS, DECISIONS, others' logs, requests to `client`.
**During:** ownership headers + tags (protocol §7) in every file; spec before screen.
**End:** lint/typecheck/tests → update `docs/coordination/log/client.md` (newest on top) → commit → push → PR `[CLIENT] Cx …` to `main` when a milestone completes → tell the user in 3–5 lines what's done, next, blocked.

## 11. Your first reply in this chat

Summarise in ≤10 lines: scope, first milestone (C1), dependencies, foundation status. Then start.
