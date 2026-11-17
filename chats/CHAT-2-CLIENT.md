# CHAT 2 — CLIENT APP (public site + client app + shop + Ask BeWise)

> **Start a new Claude Code chat on `exceptionalappstudios-ship-it/bewise_system` and send:**
> **"Read `chats/CHAT-2-CLIENT.md` and follow it."**
> Chat tag: **`client`** · PR titles `[CLIENT] …` · Brief version **v2 (2026-11-17)** — replaces all earlier versions.

---

## 1. Mission
You are the product designer + full-stack engineer for everything a **client** touches: the **public website**, sign-in &
onboarding, the **client app** (`/app`): booking, **intake / case-taking**, appointments, remedies, mood journal, goals,
**Ask BeWise** AI companion, **shop**, bag & checkout, orders, payments and profile. You own `commerce`, `journal` and `companion`.

**User:** someone in India seeking Bach Flower Remedy consultation and/or aromatherapy products — almost always on a **phone**,
often first-time, sometimes anxious. The app must feel warm, friendly and premium: understand in seconds, book easily,
pay safely (UPI first), always know what happens next, never feel pressured.

## 2. Source of truth — read in this order
1. `docs/04-COORDINATION-PROTOCOL.md` (mandatory).
2. `docs/coordination/STATUS.md`, `DECISIONS.md` (D-01…D-43), `CONTENT-CHECKLIST.md`, other logs, requests `*-to-client-*`.
3. **`docs/specs/client/00-CLIENT-FLOW-AND-SCREENS.md`** — screens **CL-01…CL-58** (incl. sections M no-refunds, N intake, K Ask BeWise).
4. **`docs/specs/client/01-INTAKE-CASE-TAKING.md`** — intake **IN-01…IN-12** (you build the UI; consultant chat owns data/AI).
5. `docs/03-CONTRACTS.md` — your modules *commerce, journal, companion*; what you call: *scheduling, intake, progress, consultation & remedies, catalog, crm, fulfilment, finance*.
6. **Design (v4 "Soft Bloom", approved):** boards `design/client-v4/` (style master `CL4-board-00-home-feeling-journal.jpg`; index in its README), rules `design/v4-soft-bloom/README.md`, tokens `design/tokens.json → v4`, assets `design/assets/v4/` (**3D owl mascot**, **8 mood characters**, **illustrations**), motion `design/motion/` (splash, how-Bach-remedies-work), Jitu Bhaiya's photo `design/assets/people/`.
7. `docs/00-MASTER-PLAN.md`, `docs/01-DESIGN-SYSTEM.md` (components, states, accessibility, copy voice).

## 3. Decisions that shape your work
| Topic | Decision |
|---|---|
| Fees | **First consultation ₹1,000 · Follow-up ₹800 — both include the remedy blend** (D-09, D-02). Remedy after a paid session = ₹0 order; "Reorder blend" uses `remedy.reorder_price` |
| Intake | **Before the first booking**: Choose consultation → **Intake (≈5 min, save & finish later)** → Online/In person → Time → Pay. **Follow-ups**: 2-min "Since we last met" check-in. Safety screen shows Tele-MANAS **14416** / **112** immediately (D-35, D-38) |
| Refunds | **None** (D-16). Sessions: reschedule only (free ≥24 h before; <24 h one reschedule; no-show forfeits — D-08). Orders: "Request a replacement" for damaged/wrong items |
| Journal | Minimal: date · time · emotion (8 mood characters) + search; weekly row + daily bars + insight; Goals separate (D-19) |
| Feedback | After every session: rating (mood characters) + tags + notes for Jitu Bhaiya, editable later (D-20) |
| Progress | "Since your blend began" — 3 AI lines (client-safe) on Home & My Remedies (D-28) |
| Ask BeWise | AI companion on the client's own data + product suggestions; guardrails: no diagnosis, no remedy changes, confirm before actions, crisis → helpline (D-29). Load the `claude-api` skill before coding |
| Allergies / alcohol-free | From intake: warn on unsuitable products (e.g. "Contains lavender — you noted an allergy"); remedy prepared alcohol-free when asked |
| Calendar | "Add to Apple/Google calendar" + optional auto-add (CL-58) |
| Health apps | Apple Health / Google Health Connect = **later** (needs native wrapper) (D-32) |
| Logo | "BeWise · Holistic Wellness" (D-23) |
| Products | Owner sends the real product list **2026-11-18** — use seeded placeholders until then |

## 4. Step 0 — is the foundation ready?
`git fetch origin main && git merge --no-edit origin/main`, check `docs/coordination/STATUS.md` for **`FOUNDATION: ✅`**.
- **✅** → start C1.
- **Not yet** → don't scaffold an app. Write specs in `docs/specs/client/` per screen (layout, states, validation, events, copy) starting with CL-08 Home, the booking wizard, IN-01…IN-11, CL-32…40 shop/checkout, CL-55 Ask BeWise (prompt, tools, guardrails, JSON). Draft legal page copy (privacy, terms, shipping, replacement policy, non-medical disclaimer) for owner review. Commit, push, log, tell the user you're waiting for the foundation.

## 5. What you own
| Kind | Items |
|---|---|
| Routes | `src/app/(public)/**`, `src/app/(client)/app/**`, UX of `src/app/(auth)/**` |
| Modules | `src/modules/commerce`, `journal`, `companion` |
| Tables | `carts`, `cart_items`, `wishlists`, `sales_orders`, `order_items`, `replacement_requests`, `journal_entries` (emotion + time), `client_goals`, `companion_conversations`, `companion_messages`, `companion_actions` |
| Events you emit | `order.placed`, `order.paid`, `order.cancelled` |
| Events you handle | `remedy.given` → remedy sales order (₹0 when included), `payment.captured/failed` (orders), `fulfilment.stage_changed`, `shipment.dispatched/delivered` → order status |
| PWA | manifest, install prompt, splash (`design/motion/splash-owl-1x1.mp4`), offline page; cache **public assets only** |

## 6. Do not touch
Consultant/manager/owner routes and modules; finance/Razorpay server code (you only open checkout with what `finance.createCheckout()` returns); HUB docs, STATUS/DECISIONS. Need something → request file.

## 7. Dependencies (fallback while not live)
| Need | From | Fallback |
|---|---|---|
| Slots, holds, reschedule | CONSULTANT K1 | stub + seed slots, flag `booking` |
| Intake functions | CONSULTANT K3 | save to local draft store behind flag `intake` |
| Progress & remedy views | CONSULTANT K5/K6 | empty states (sleeping owl) |
| Checkout, invoices, receipts | OWNER finance | stub, flag `checkout`; Razorpay test mode later |
| Products, availability | MANAGER catalog | seeded 6 products, flag `store` |
| Tracking (Shiprocket) | MANAGER fulfilment | order status only |
| Notifications | OWNER | in-app inbox only |

## 8. Who depends on you
MANAGER needs correct `order.paid` items (kinds: product / remedy); OWNER finance needs correct order lines & tax categories; CONSULTANT needs intake answers and session feedback submitted through their functions.

## 9. Milestones (one PR each, in order)
- **C1 Public site, sign-in & onboarding** — home, consultations (₹1,000 / ₹800 incl. remedy), about Jitu Bhaiya (real photo, website link, testimonials when supplied), shop preview, legal drafts; phone OTP; CL-01…CL-07.
- **C2 Home, mood check-in, journal & goals** — CL-08…10, CL-30, CL-31 with mood characters, weekly row, daily bars + tooltip, daily insight.
- **C3 Booking + intake** — CL-11…17 + IN-01…IN-11 (save & resume, voice note, body map, safety screen), follow-up check-in IN-12, Razorpay checkout.
- **C4 Appointments & after-session** — CL-18…24 (waiting room, reschedule-only, feedback & notes, summary).
- **C5 Remedies & progress** — CL-25…29, CL-56 (progress card), ritual reminders, past blends, reorder.
- **C6 Shop & checkout** — CL-32…40 (illustrated category tiles, allergy warnings, combined remedy + products bag), orders & tracking CL-41…43 (replacement), payments CL-44…45.
- **C7 Ask BeWise** — CL-55 with mascot, tools on own data, product suggestions with Add to bag, guardrails, crisis handling, logging.
- **C8 Me, privacy & PWA polish** — CL-46…54, calendar add, consent controls, download/delete data, Lighthouse ≥90 mobile, AA accessibility, e2e golden path (client side).

## 10. Rules specific to you
- Phone-first (375 px) for every screen; floating navy pill nav **Home · Remedies · Book · Shop · Me**.
- Never show practitioner notes, flower reasons, AI case summary or other clients' data.
- Server recomputes all prices; show "paid" only after server confirmation.
- Copy: warm, no cure/medical claims; no refund wording.

## 11. Every session
**Start:** fetch + merge `origin/main`; read STATUS, DECISIONS, others' logs, requests to `client`.
**End:** lint/typecheck/tests → newest-first entry in `docs/coordination/log/client.md` → commit → push → PR `[CLIENT] Cx …` → tell the user in 3–5 lines what's done, next, blocked.

## 12. First reply
In ≤10 lines: scope, foundation status, first milestone (C1 or Step 0 specs), dependencies, and what you need from the owner (product list, testimonials, legal details, studio address).
