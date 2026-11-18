# BeWise Consultant app — interactive prototype (Jitu Bhaiya)

> **Owner:** CONSULTANT chat · **Status:** prototype on demo data, built 2026-11-17 at the owner's request.
> Lives in its own folder on purpose: the real app is built inside `src/app/(consultant)/consult/**` once the HUB
> foundation is ✅. Screens, logic and components here are meant to be ported there (React + motion, same tokens).

![Overview](screenshots/overview.jpg)

## What it does
| Tab | What Jitu Bhaiya gets |
|---|---|
| **Today** (CN-03) | Greeting · **Today's bloom**: one petal per session (done, next, later); tap a petal to open the session · next session with booking note, Prepare / Start · **Needs you**: a swipeable deck of insights computed from data (remedy not given yet, unpaid booking, a check-in where something feels harder, follow-ups overdue, next week almost full → open Saturday morning, quiet clients) with one-tap actions · today's timeline · **Your week**: weekly goal ring, people in care, and **what clients told him**, his kind words |
| **Sessions** (CN-14/16) | Upcoming and Past in one place (segmented), search, filters (first / follow-up / online / in person / awaiting payment / no-show), grouped by day with sticky headers; tap → session sheet (Start, Reschedule with live slot picker, WhatsApp, Call, Give remedy, Book follow-up) |
| **People** (CN-12/13) | Everyone registered (128 demo), search by name / city / phone, groups with counts (In care, Follow-up due, New this month, Quiet 4+ months), 3 sorts; profile with progress since last remedy, mood week (mood characters), troubling emotions across sessions, current blend with delivery tracker, all sessions, Book |
| **Growth** (CN-26) | Month so far vs same days last month, people met, returning visits, rating, remedies; sessions per week; when people book him (heatmap); what people bring (top troubling emotions); next milestone |
| **Your impact** (top of Today, full on Growth) | Next milestone (sessions and people helped), people helped on BeWise, 2,00,000+ reached, % who said something feels better, hours of listening, five-star sessions, came back %, and **what people said they felt** (from session feedback tags) |
| **Live session** (CN-05/06/08) | Start opens the session for that person: summary first (booking note, since last remedy, current blend, taking-the-remedy strip), what's troubling them today, private notes 🔒, flowers to consider; **End session** → follow-up + optional client summary → **Give remedy** |
| **Suggested flowers** (D-37) | Rule-based from today's troubling emotions, last 3 sessions, the check-in and what helped last time; each with its reason; one tap or "Add all"; never auto-applied |
| **Taking the remedy** | Profile card: % of days taken since the blend, streak, 14-day strip (took / missed / not logged), "Send a gentle nudge"; People group "Missing drops"; insight on Today |
| **New person / Express booking** | Add someone (validated +91 mobile, duplicate check, city, she/he/they) → Save or Save and book; Express: pick person → next free times → **Greet and confirm** (editable WhatsApp greeting) → payment link goes out automatically afterwards |
| **Share my link** (top of Today) | His booking link: Copy, WhatsApp with ready messages (new client / follow-up / workshop), phone Share, QR code to show at workshops or the studio (download) |
| **Today's appointments** (top of Today) | Every session today with one action each: **Check in** (arrived / joined) → **Start** → **Open**, **Give remedy** after; check-in form filled or "Ask" to send it; booking note on the next one |
| **Calendar** (Today + Sessions) | Month view with sessions per day and unpaid marker; tap a day to see and open its appointments |
| Bell | Updates feed (bookings, reschedules, ratings, deliveries, check-ins, payments) with unread state |

Slot picking uses the same rules as `docs/specs/consultant/K1-SCHEDULING-AND-CALENDAR-SYNC.md` §3 (10-min gap, 30-min steps, 1 h notice).
Changes he makes (give remedy, reschedule, book, dismiss) persist on the device for the day; demo data regenerates daily relative to "now".

## Run
```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build && pnpm preview   # production build on :4173
```

## Speed (measured, Lighthouse mobile: slow 4G + 4× CPU)
| | Before | After |
|---|---|---|
| Performance / Accessibility / Best practices | 90 / 93 / 96 | **96 / 100 / 100** |
| First paint · Largest paint | 2.4 s · 2.9 s | **1.4 s · 2.4 s** |
| Page weight | 258 KB | **166 KB** |
| First-load JS (gzip) | 122 KB | **80 KB** (rest prefetched on idle) |
| Tab switch / open sheet (test) | — | ~100 ms |

How: instant HTML skeleton before JS · Today in the first bundle, every other screen and all sheets code-split and **prefetched while idle** (no loading flash later) · animation engine loaded after first paint (LazyMotion async) · count-ups via a tiny rAF loop · self-hosted variable font (one file, all weights, ₹ included) · right-sized WebP images · offline service worker for instant repeat opens · long lists rendered incrementally with `content-visibility`.

## Works on every size
Checked automatically at 320, 360, 375, 393, 430 px phones, phone landscape, iPad mini, iPad landscape, laptop, desktop and 1920 px: no sideways scrolling, nothing hidden behind the nav, sheets fit the screen. Phones use the floating nav; 960 px+ gets a side rail; 1180 px+ shows Today in two columns. Inputs are 16 px (no iOS zoom), hover effects only where there's a mouse, safe areas respected, reduced motion respected.

## Tests
```bash
pnpm test        # 30 unit tests: slot engine, data integrity (no double bookings), suggestions, adherence, impact, insights, booking state
pnpm test:e2e    # 89 browser tests on phone, 320 px phone, tablet, desktop: every flow, 11 screen sizes, axe accessibility, performance budgets, offline
```

## Not real yet (by design)
Demo data only; no auth, no server. WhatsApp/Call open `wa.me` / `tel:` links. "Progress since last remedy" is a rule-based stand-in for the AI summary (K6). The remedy sheet never suggests flowers — his judgement decides (D-25/D-37).
