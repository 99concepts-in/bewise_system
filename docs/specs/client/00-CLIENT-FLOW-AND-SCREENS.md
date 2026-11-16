# Client App — Complete Flow & Screen List (v3, owner-approved changes)

> **Owner:** HUB (designed with the business owner). Status: **APPROVED FLOW — designs in progress.**
> Supersedes the client part of `docs/02-FLOWS-AND-SCREENS.md` (C-01…C-14 → CL-01…CL-54).
> Visual direction: `design/inspiration/README.md` (Quiet Luxury). Boards: `design/client-v2/`.
> Screen IDs `CL-xx` are stable — use them in code headers, PRs and logs.

## Owner changes (2026-11-16)
1. ❌ Removed "What brings you here?" from onboarding.
2. ➕ Short animation explaining **how Bach remedies work on the emotional level** (welcome story slide 2, reused on Meet your consultant + My Remedies). Asset: `design/motion/how-bach-remedies-work-9x16.mp4`.
3. ✏️ **Journal is minimal**: only date, time, emotion + search. No notes, no insights, no goals inside the journal.
4. ➕ **Goals** kept as a separate, simple screen (under Me).
5. ➕ **After every appointment the client can add feedback and notes, visible to the consultant** (CL-23).
6. ❌ **No questionnaire** in the client flow. While booking, the client can optionally write what they'd like to talk about (CL-15).
7. ✅ UI font: **Plus Jakarta Sans**; display font stays Cormorant Garamond.

## Navigation
Floating frosted-glass pill nav: **Home · Remedies · ( Book ) · Shop · Me** — Book is the raised deep-navy centre button.

## Flow
```
FIRST OPEN   Splash → Welcome story (3 slides, slide 2 = Bach animation) → Phone → Code → About you → Privacy → You're in
DAILY        Home → Log a feeling (sheet) → Notifications
BOOK         Choose consultation → Meet your consultant → Online / In person → Date & time
             → Anything you'd like to share? (optional) → Review & pay → [Razorpay] → Booking confirmed
APPOINTMENT  My appointments → Appointment detail → Waiting room (online) / Directions (in person) · Reschedule · Cancel
AFTER        How was your session? (feedback + notes → consultant) → Session summary → Your remedy is ready
             → Confirm & pay → My Remedies → Flower detail → Ritual & reminders → Past blends
FEEL         Journal (date · time · emotion · search) · Goals (separate, under Me)
SHOP         Shop → Collection → Search → Product → Wishlist → Bag → Address → Review & pay → Order placed
TRACK        My orders → Order tracking → Return · Payments & invoices → Invoice & pay
ME           Me → Personal details · Addresses · Goals · Reminders & notifications · Privacy & data · Help
```

## Screens

### A. First open
| ID | Screen | Content |
|---|---|---|
| CL-01 | Splash | Owl line-draw animation (`design/motion/splash-owl-1x1.mp4`) |
| CL-02 | Welcome story | 3 slides with page dots: **1 Talk** — "A gentle conversation about how you *feel*" · **2 How it works** — Bach animation + "Flower essences, chosen for your emotions, help you find your way back to *balance*" · **3 Your ritual** — "A personal blend, a few drops a day". Buttons: Begin / I have an account |
| CL-03 | Your number | Serif "Welcome to *BeWise*", +91 phone pill field, Continue |
| CL-04 | Verify | 6 code boxes, auto-fill, "Resend in 0:24" |
| CL-05 | About you | Name, date of birth, city (gender optional) — one card, three pills |
| CL-06 | Your privacy | Three toggles in plain language: keep my wellbeing data safe (required) · updates on WhatsApp · gentle offers. Link to policy |
| CL-07 | You're in | Owl + "You're *in*, Priya" + two choices: Book your first consultation / Explore the shop |

### B. Daily
| ID | Screen | Content |
|---|---|---|
| CL-08 | Home | "Good morning, Priya" · hero "How are you *feeling* today?" with 5 owl emotion faces (tap = log) · **one** contextual card (next consultation / remedy ready / feedback pending / payment due) · Today's ritual card (drops taken today) · nothing else |
| CL-09 | Log a feeling | Bottom sheet: 8 owl faces (Calm, Joyful, Grateful, Hopeful, Tired, Anxious, Sad, Irritated), auto date & time, Save. That's all |
| CL-10 | Notifications | Today / Earlier, soft rows |

### C. Book
| ID | Screen | Content |
|---|---|---|
| CL-11 | Choose consultation | Two large cards: First consultation (60 min · ₹fee) / Follow-up (30 min · ₹fee), one-line "what to expect" |
| CL-12 | Meet your consultant | Portrait, name, approach in 2 lines, languages, years, "How Bach remedies work" mini animation card |
| CL-13 | Online or in person | Two choice cards; in person shows studio address |
| CL-14 | Date & time | Month label, week strip (selected = navy circle), slots grouped Morning / Afternoon / Evening as pills |
| CL-15 | Anything you'd like to share? | **Optional** text box "What would you like to talk about?" + Skip. Visible to consultant only |
| CL-16 | Review & pay | Summary card, policy in one line, total, navy pill "Pay ₹2,500" |
| CL-17 | Booking confirmed | Soft 3D flower, "You're *booked*", date/time, Add to calendar, View appointment |

### D. Appointments
| ID | Screen | Content |
|---|---|---|
| CL-18 | My appointments | Upcoming / Past pill tabs; rows = date tile · type · time · mode |
| CL-19 | Appointment detail | Hero date/time, consultant, mode, your shared note, Join / Directions, Reschedule, Cancel, receipt; past appointments show "Add feedback & notes" |
| CL-20 | Waiting room | "Your session begins in *8 minutes*", 3 gentle tips, Join (activates 10 min before) |
| CL-21 | Reschedule | Date & time picker + policy outcome |
| CL-22 | Cancel | Optional reason, clear refund outcome, Confirm cancel |

### E. After the session
| ID | Screen | Content |
|---|---|---|
| CL-23 | How was your session? | 5-step owl rating, quick chips (Felt heard, Clear guidance, Calming…), **"Notes for Jitu Bhaiya"** free text, "Visible only to your consultant". Can be added/edited later from the appointment. → `session_feedback` |
| CL-24 | Session summary | Summary shared by consultant, next follow-up date, Book follow-up |
| CL-25 | Your remedy is ready | Hero 3D amber bottle, blend name, flowers inside (chips), price / included, optional add-ons, Confirm & pay |
| CL-26 | My Remedies | Current blend hero, ritual (4 drops × 4 a day), days left ring, Reorder, Past blends link |
| CL-27 | Flower detail | 3D flower, name, one-paragraph approved description, "in your blend since 18 Nov" |
| CL-28 | Ritual & reminders | Reminder times (pills), today's drops checklist, gentle streak |
| CL-29 | Past blends | v1, v2… with dates & flowers |

### F. Feel
| ID | Screen | Content |
|---|---|---|
| CL-30 | Journal | Title, search pill (feeling or date), week strip, list grouped by day: date tile · emotion · time · owl face. Nothing else |
| CL-31 | Goals | Separate, under Me: up to 3 personal goals, each a soft card with a simple progress ring; add / complete |

### G. Shop
| ID | Screen | Content |
|---|---|---|
| CL-32 | Shop | Hero ritual collection banner, collection pills, 2 curated rows |
| CL-33 | Collection | 2-column grid of cutouts on beige cream tiles, filter/sort sheet |
| CL-34 | Search | Recent, popular, results |
| CL-35 | Product | Big cutout, size pills, price & MRP, tabs (About · Ingredients · How to use · Safety), Add to bag |
| CL-36 | Wishlist | Saved items |
| CL-37 | Bag | Remedy + products together, qty steppers, totals |
| CL-38 | Address | Saved addresses, add new (pincode auto-fill) |
| CL-39 | Review & pay | Items, address, totals, Pay |
| CL-40 | Order placed | Calm success, ETA, Track order |

### H. Orders & payments
| ID | Screen | Content |
|---|---|---|
| CL-41 | My orders | Active / Past |
| CL-42 | Order tracking | Vertical dot timeline Ordered → Preparing → Shipped → Delivered, courier, AWB, invoice |
| CL-43 | Return | Items, reason, photo, policy |
| CL-44 | Payments & invoices | Due / Paid |
| CL-45 | Invoice & pay | Detail, PDF, Pay now |

### I. Me
| ID | Screen | Content |
|---|---|---|
| CL-46 | Me | Avatar, name, quick tiles: Appointments · Orders · Payments · Journal · Goals; settings list |
| CL-47 | Personal details | Edit |
| CL-48 | Addresses | List / add / default |
| CL-49 | Reminders & notifications | Channels & reminder types |
| CL-50 | Privacy & data | Consents, journal sharing with consultant, download data, delete account |
| CL-51 | Help | FAQs, WhatsApp us, policies |

### J. System states
| ID | Screen | Content |
|---|---|---|
| CL-52 | Empty states | 3D botanical + one line + one action |
| CL-53 | Payment issue | Failed / slot taken / hold expired, calm recovery |
| CL-54 | Offline | Soft banner, what still works |

## Data/contract impact (for build chats)
- New table `session_feedback` (CONSULTANT module, scheduling): `appointment_id, client_id, rating 1–5, tags[], notes_for_consultant, created_at, updated_at`. Client writes own; consultant of that appointment reads; owner sees rating only. Event `session_feedback.submitted`.
- `appointments.client_note` (optional text from CL-15) visible to consultant only.
- Questionnaire auto-assignment **removed**; questionnaire module becomes optional/P3.
- Journal entry = `{ emotion, logged_at }` only. Emotion enum: `calm, joyful, grateful, hopeful, tired, anxious, sad, irritated`.
- Goals: `client_goals { title, progress 0–100, status }`, separate from journal.
