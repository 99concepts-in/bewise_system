# CLIENT chat — work log

> Only the CLIENT chat writes this file. **Newest entry at the top.** Format: see `docs/04-COORDINATION-PROTOCOL.md` §4.

## 2026-11-24 · Gender step icons
- Replaced the emoji with proper icons in tinted circles: Female (♀, rose), Male (♂, blue), Prefer not to say (lock, periwinkle); white on the selected option.

## 2026-11-24 · Products entrance + relaxing music in stories
- Welcome products screen: bath salt pops up first, then the spray, then the roll-on, each springing up from below with a little bounce and sparkles, then floating.
- Stories: relaxing loop music generated live with the Web Audio API (lib/ambient.ts, no audio files or licences): Calm (slow pad chords), Rain (soft rain and wind, droplets), Chimes (pentatonic wind chimes); all over a soft drone with reverb, gentle fade in/out. Header has the track button (tap to change) and a mute button; both remembered on the device. Each story starts on its own default track; sound begins on the first tap (browser rule) and fades out when the story closes. Test added (66).

## 2026-11-24 · Welcome fixes
- Opening animation about twice as fast (ring in ~0.5 s, merge at ~1 s, owl at ~1.8 s) and the ring flowers stay hidden after merging; only the background flowers remain.
- Products screen: bath salt behind in the middle, Sleep spray and Immutime roll-on in front on either side, nothing hidden.
- Jitendra Khimlani screen: "Certified Bach Flower Therapist" tag moved below his face (bottom of the portrait); "5.0 Rated on Google" beside his shoulder.

## 2026-11-24 · Welcome polish + Jitendra Khimlani screen
- Welcome: the flower ring circles, spirals into the glowing centre and merges, the owl blooms out with a soft burst, then the ring re-forms and keeps turning. CTA "Start my journey".
- No "Benefit 1/2/3" labels. Smoother transitions: art crossfades with a soft scale and blur, text crossfades in place, background fades over 0.9 s.
- Bottle: bottle-remedy.png with real transparency (the white box on iPhone came from mix-blend-multiply not applying inside an animated layer). Used everywhere the bottle shows.
- Learn screen: "Learn how Bach flowers can help you". Shop screen: "All your favourite wellness products in one place", products centred and floating (session card removed).
- New last screen: "Get personal guidance from Jitendra Khimlani" with his portrait in an arch, verified "Certified Bach Flower Therapist" tag and "5.0 ★★★★★ Rated on Google" (owner-stated rating), then "Let's get started".

## 2026-11-24 · New onboarding: welcome + 5 benefits → phone → name → birthdate → gender → Home tour
- Welcome (after the golden splash): colourful warm gradients and floating Bach flowers on every screen. 0 "Welcome to BeWise Holistic Wellness" (owl in a turning ring of flowers) with "My journey" + "Already a member". Benefits: 1 emotional wellbeing (mood flower opening and closing, faces), 2 Bach flower journey (our bottle, drops filling today's dose circles; reminders / moods / sessions), 3 Learn (story covers fanning and cycling), 4 Ask BeWise (chat typing in), 5 Sessions + shop (session reminder over products) → "Let's get started" → phone sign-in.
- Sign-up is now one question per screen: /onboarding/name, /onboarding/dob, /onboarding/gender, then straight to Home (privacy agreement line on the last step; WhatsApp on for reminders). Prefill from the booking link / staff booking still applies. Old about/photo/privacy/done pages are no longer in the flow (city, reference, photo can be added later in Me).
- Home tour (components/tour.tsx): spotlight + card, "Quick tour · n of N", Next / Skip tour; steps: remedy or blend, how you feel, book a session, learn, Ask BeWise, tabs. Shown once (profile.tourPending). Reminder popup waits until the tour is done.
- "Your blend is being prepared" (components/blend-preparing.tsx) on Home and in My care after a session and before the blend is set: bottle filling, steps (session ✓, flowers chosen ✓, being prepared, ready on WhatsApp).
- Tests: 65.

## 2026-11-24 · Bach flower story slider + 4 new stories
- Home and My care: "How Bach flowers can help" is now a slider of bold colour cards with a big blob flower (owner reference), one per story with a short headline ("Rest easy tonight", "Calm about money"…); auto-slides every 5 s, swipe, dots; each card opens its story directly. "All" goes to Learn.
- New stories (7 slides each, Higgsfield covers): Confidence, Money and business worries, Constant change, Self-doubt. "Did you know" quotes checked against Bach's text (Larch, Elm, Walnut, Cerato under "uncertainty"). Same care notes; testimonials reused from the 3 real quotes. Learn now has 7 stories. Test added (64).

## 2026-11-24 · Mood logger: our own flower + live backdrop
- Replaced the abstract layered shapes (too close to Apple's) with our flower (MoodShape keeps its API): a small closed, cool-coloured bud at "very unpleasant" that opens into a full warm bloom at "very pleasant": outer petals grow, widen and round off, an inner petal layer unfolds, golden stamens appear; petals sway and the flower breathes. Same flower in the pick step, summary card and Home "You felt" tile.
- LiveBackdrop: three soft mood-coloured lights drifting (GPU transforms) and pollen floating up, always moving; still for reduced motion.

## 2026-11-24 · Mood slider fixed ("sometimes not working")
- Causes: (1) the visible thumb sat over an invisible native range; on iPhone Safari a native range only drags when the finger lands on its own small thumb, so many drags did nothing; (2) the snap-to-level spring kept running and fought a quick second drag; (3) the spring could overshoot past the ends.
- Fix: the whole track is now a custom pointer slider (touch-action none, pointer capture): tap anywhere to jump, drag from anywhere. Snap animation stops on a new touch, no overshoot, values clamped. A visually hidden range keeps keyboard / screen-reader access. Test added with real touch events (63).

## 2026-11-24 · Mood logger: our feeling faces
- Step 2 ("What describes this feeling?") now shows each feeling as a tile with our own face (MoodImg) and label in a 3-column grid; selected tiles turn white with a tick. Search and up-to-3 picks unchanged.

## 2026-11-24 · "You felt" card: Add a note
- After logging, the Home card shows "You felt · level · time", the feelings, the note if any (tap to edit), and two buttons: "Add a note" / "Edit note" (opens the journal note editor for that entry) and "Log again".

## 2026-11-24 · Simpler icon on "Log how you feel"
- Replaced the animated six-petal flower on the Home card with a simple rounded tile in the mood colours (purple → teal → orange) with a smile icon and a slow, gentle breathing scale.

## 2026-11-24 · Last dose → breathe → mood slider
- Tapping the day's 4th dose opens components/breathe.tsx: "All 4 doses done today · Let's take one breath", then a glowing circle that grows for "Breathe in…" (4 s, blue) and settles for "Breathe out…" (6 s, teal), gentle haptic at each change, Skip anytime. It then opens the mood slider ("Right now"). Test added (62).

## 2026-11-24 · Learn search: no remedy names
- Owner: no remedy suggestions in search. Searching a concern now shows "We can help with this" with the matching concerns, a line that Jitendra Khimlani prepares a blend made only for you in a session, and Book a session. No flower names or reasons. (The concern list in lib/remedy-finder.ts stays for the Consultant app.)

## 2026-11-23 · Learn: member quotes no longer stick to the screen edge
- The "What members say" carousel snapped cards flush to the left edge (no scroll padding). Now `snap-mandatory scroll-px-5` + an end spacer: every card rests 20 px from the edge, like the rest of the page.

## 2026-11-23 · Reminders: one time to set, then 4 h after each dose
- Popup asks only for the time of the first drops ("Your first reminder each day comes on WhatsApp"). The day's 4 times are derived 4 h apart for My care.
- In-app schedule (open or back on screen): first dose: WhatsApp sends the on-time reminder, the app follows up after 45 min; later doses: reminder 4 h after the last checked-in dose; not logged: repeat every 45 min (not mentioned to members); stops after the 4th dose or 23:00. `reminders.lastDoseAt` set on each new dose today.
- Server request updated (WhatsApp `remedy_morning` cron + web push for the 4 h / 45 min schedule). Test added (61).

## 2026-11-23 · Mood logger redesigned (immersive, morphing shapes)
- components/mood-shape.tsx: three translucent nested shapes with glossy outlines that morph continuously with the slider: spiky star (very unpleasant) → wavy → softer ripples → circle (neutral) → soft five-lobe → rounded star → five-petal flower (very pleasant); purple → blue → icy blue → green → gold → orange; slow spin and breathing (still for reduced motion).
- Logger is now a dark, colour-tinted full sheet (owner shared reference screens): big level label with a soft blur change, grey track with a white thumb, Next button in the mood colour (dark text on light colours). Step 2: pick up to 3 feelings as chips (or search), optional note. Step 3: summary card ("Peaceful, Grateful · A very pleasant day"), then Done. Entries store extra feelings in `also`.
- Home "You felt" card shows the mood shape and all feelings picked.

## 2026-11-23 · Verified badge for Jitendra Khimlani
- components/verified.tsx: blue scalloped rosette with a white tick and an occasional shine (still for reduced motion), labelled "Verified: Certified Bach Flower Therapist". Shown next to his name on the Home card, booking screen, review step, public booking link, session page, and inside the "Certified Bach Flower Therapist" tag of his story.

## 2026-11-23 · "Your consultant" → "Certified Bach Flower Therapist" + "12+ years"
- Jitendra Khimlani's story sheet: the "Your consultant" tag is now "Certified Bach Flower Therapist" with a "12+ years" tag beside it. Home consultant card eyebrow renamed the same (duplicate title line removed).

## 2026-11-23 · Home: remedy first, new mood logger, real bottle, reminders, Learn card
- Home order: greeting → remedy card (first) → "Log how you feel right now" → next session / pay → offer → consultant card → Learn card → goals → shop → your space. The feelings grid is removed.
- New mood logger (components/mood-logger.tsx): bottom sheet with X; "Right now" or "Today overall"; slider very unpleasant → very pleasant with a flower that opens, warms and pulses on each step (purple to orange), haptic tick per step; then matching feelings or search any feeling, optional note. Journal entries now carry `valence` (1 to 7) and `kind`.
- After logging, Home shows "You felt X · time" for 4 hours, then asks again. From 7 PM: "How was your day overall?" until the day is logged.
- Remedy bottle: label-free replica of our own 30 ml frosted dropper bottle (Higgsfield, from the product photo), liquid clipped inside (bottle-remedy.webp + mask).
- First-time reminders popup (4 times, editable) + morning nudge until the first dose is checked in (bell notice, system notification when allowed). Real background push needs the server (request updated).
- Colourful animated "Learn how Bach flowers can help you" card on Home and in My care. "How our remedies are made" now only in My care (removed from Learn).
- Tests: 60.

## 2026-11-23 · Onboarding for existing members + details filled in
- Welcome: 4 slides. Added "Stay connected to your wellness journey" (daily drops, blend journey, mood journal, sessions). Slide 2 says "Certified Bach Flower Therapist".
- "You're in": no booking prompt any more (members book inside the app). Buttons: Take me home, Read a Bach flower story. Only the public booking link still continues to its booking.
- Sign-up adds "How did you hear about us?" (Jitendra Khimlani, Someone I know + name, Instagram, Google, A workshop, Other) → `profile.reference`.
- Prefill: on sign-in we look the number up (lib/members.ts; live: crm.findMemberByPhone, requested). Details from the booking link or from a booking made by Jitendra Khimlani / the team arrive filled in on "A little about you" with a "Welcome back" note, all editable. Booking requests remember the member's details. Demo staff-made member: 98989 89898 (code 2468).
- Tests: 59.

## 2026-11-23 · Learn tab: Bach flower stories · remedy instructions · made with care
- New Learn tab ("Know how Bach flower therapy can help you"): search by concern, 3 Insta-style stories (sleep, anxiety, relationships), 8 slides each with cover, text, flower cards, steps, "Did you know", a real member quote and an end slide with a care note. Covers made in Higgsfield (public/img/stories). Tap right = next, left = back, hold = pause, auto-advance after a reading pause. Original writing informed by the owner's books (Bach 1931/1936; Non Shaw 1998).
- Owner: members must not self-pick remedies. Every place that names remedies shows "Take Bach remedies only after a session with Jitendra Khimlani…".
- "How our remedies are made" card (My care + Learn): vibrationally charged with mantras, curated by a certified expert, best quality flower blends.
- My care: "How to take your remedy" from the owner's WhatsApp instructions (4 drops 4 times a day or 16 drops in a litre of water, any drink or food, any time, 25 days, book the next session near the end, keep from children, cool dry place, share how you feel on WhatsApp 98980 20939). Softened: no "no side effects", first-days changes described as emotional only.
- Google reviews could not be read automatically (Google blocks it). Added "Read all reviews on Google" links (Learn, Member stories sheet). Owner asked to paste the reviews to show.
- Remedy finder: lib/remedy-finder.ts + docs/knowledge/remedy-finder.json (41 concerns); request filed for the Consultant app.
- Tests: 57.

## 2026-11-23 · Owner brief (onboarding, Bach flower stories, journeys, SD) · step 1 shipped: wording
- Plan (priority order): 1) wording + "Certified" title ✅ · 2) member onboarding for existing members (3-4 inspiring screens on Bach flowers, Jitendra Khimlani's expertise and the app's benefits; no booking prompt) + reference field · 3) after-first-session flow: star feedback → consistency → wellness journey plans → pay → sessions left (no charge for plan sessions) · 4) "Bach flower can help" tab: Insta-story style stories (5-9 slides, tap right for next), 3 to start (sleep, anxiety, relationships), Higgsfield covers, search by concern · 5) public booking link as its own flow: 3 intro screens → WhatsApp sign-in → profile if missing → concerns (Family, Big life event, Relationship, Health, Finance or business, Other) → questionnaire, every section skippable → session bookings screen (+ WhatsApp confirmation, server) · 6) member journeys: occasional / regular / drifting nudges · 7) staff side (SD role etc.): request filed.
- Step 1: Client→Member, Consultation→Wellness session, Appointment→Session booking, Past blends→Blend journey, Offers→Wellness journey plans, "Certified Bach Flower Remedy Therapist". Real testimonial quotes left as written.
- Request filed: requests/20261123-client-to-hub-manager-consultant-sd-appointment-admin.md.

## 2026-11-21 · Offer banner only on Home
- Removed the introductory offer banner from My care (owner). It now shows only on Home, below the feelings. The plan choice on the booking screen is unchanged.

## 2026-11-21 · One kind of appointment (no first / follow-up choice)
- Owner: ~500 clients already met Jitendra Khimlani, so booking no longer asks "First consultation or Follow-up". "Book an appointment" → plan or One appointment → 2-minute check-in (for everyone) → online / in person → preferred time → Send request.
- One appointment: nothing to pay at booking. Jitendra Khimlani or Haresh bhai set type, fee and time; the booking then shows "Complete your booking · Pay ₹X". Plans (6 months / Yearly) are still paid at booking, and also offered in the offer banner.
- `Appointment.kindTbc`; `apptName()` shows "Appointment" until the team sets the type. Check-in answers given while booking are now saved with the request (they were dropped before).
- Copy updated across Home (consultant card), My care, onboarding, help FAQ, Ask BeWise, public booking link (no choice cards). Splash subtitle darker (axe caught it mid-fade).
- Request filed: requests/20261121-client-to-manager-consultant-hub-one-appointment-type.md (staff set type + fee; API support). 53 tests.

## 2026-11-21 · Drops: 4 per dose, gentle haptics, no duplicate tracker
- Each dose circle now shows 4 little drops (one dose = 4 drops) that fall in together when ticked (Home and the 25-day calendar).
- Gentle haptics: `buzz()` uses the Vibration API on Android and, on iPhone (no vibrate in Safari), a hidden native switch tap that gives the light system haptic on iOS 18+.
- My care: removed the repeated "today's drops" dots and "Took a dose" button (they live on Home). The section is now "Your progress": day of bottle, % taken, streak, the 25-day calendar and the reminder times.

## 2026-11-21 · "Start" check-in did nothing (fixed)
- On the live host, a tap could be lost while the app was still loading routes in the background, so the session page's "2-minute check-in · Start" did nothing. It is now a real link (works even before the page finishes loading), and every in-app `router.push` now goes through `goSafe` (falls back to a normal page load if the screen hasn't changed after 1.5 s; it now compares path + query). New test: session page Start opens the check-in (52 tests).

## 2026-11-21 · Follow-up shows the plans
- Book a session: choosing Follow-up now always shows "How would you like to continue?" (6 months Recommended, Yearly Best value, One time), also for clients with no history in the app (e.g. via "Book a follow-up · ₹800"). The page scrolls to the plans when Follow-up is tapped. Clients with an active plan still see "This one is included".

## 2026-11-21 · Consultant card on Home books
- Home "Your consultant" card redesigned: arch portrait, Jitendra Khimlani, title, chips (12+ years, Online or in person), then a full-width "Book appointment" (first consultation or follow-up) and "More about him" (opens his story), with the fee line underneath. This replaces the removed floating Book button as Home's way to book.

## 2026-11-21 · Home: floating Book button removed
- Removed the big floating "Book your consultation · ₹1,000" / "Book a follow-up" pill from Home (owner). Booking stays in My care ("Book your first consultation" / "Book a new session"), the offer card, and the pay/continue cards on Home when a booking is in progress.

## 2026-11-21 · Offer banner placement
- The introductory offer banner is no longer at the top of Home. It now sits below the feelings card on Home, and in My care (the booking tab) under the sessions card. Same banner, same offer flow; hidden when the offer ends or a plan is bought.

## 2026-11-21 · Shorter welcome, owl says hi
- Welcome slide 1 text shortened: "A gentle, private space for your emotional wellbeing, guided by Jitendra Khimlani and Bach Flower Remedies."
- "You're in" screen: the owl beside the photo waves on a loop with a "Hi! 👋" bubble. Removed the CSS drop-shadow on that owl (iOS Safari drew it as a grey box inside the animated wrapper); Mascot has a `shadow` prop for this.

## 2026-11-21 · Splash: golden line back
- Owner prefers the earlier splash: owl mark in a white disc with a thin golden ring that draws itself, "BeWise" rising in letter by letter, "HOLISTIC WELLNESS" below. Replaces the v5 stacked-logo splash (welcome/page.tsx).

## 2026-11-20 · Realistic remedy bottle on Home
- Replaced the drawn bottle with a photo-real slim clear-glass dropper bottle (Higgsfield render, public/img/bottle-slim.webp). Amber liquid is a CSS layer clipped to the inside of the glass by public/img/bottle-slim-mask.png, with the bottle multiplied on top, so the level still drops day by day and dips on each dose (surface ripple). Small BeWise "Flower Remedy" label on the upper body keeps the level visible.

## 2026-11-20 · My care tidy-up
- Removed the "Running low? Reorder" card from My care (owner). Reordering a blend is still possible from the shop's personal blend card.
- Past blends row redesigned: the version badge no longer squeezes, "Blend 1 · Current" with "Since DD/MM/YYYY", and every remedy shown as a wrapping chip instead of a clipped line.

## 2026-11-20 · Check-in order
- "Since we last met" (check-in and follow-up intake): options now read Harder · Same · Better, so Better sits on the right (owner).

## 2026-11-20 · Home blend card redesigned (bottle + 4 drops)
- Home "Your remedy" card: a remedy bottle (components/remedy-bottle.tsx) whose liquid follows the bottle's 25 days and lowers a notch with each dose today (ripple on each tap), Day X of 25, days left, streak, then the 4 tappable drops with a short caption, and "View my blend & progress" into My care.
- Flowers row, stats, progress bar and the "Took a dose" button removed from Home; the full tracker (stats, 25-day calendar, past days) and the remedies with their emotions stay in My care.

## 2026-11-20 · Session feedback simplified
- "How was your session?" now has only the faces and the quick tags (Felt heard, Clear guidance, ...), then an optional "Add a comment". The "How do you feel after the session?" benefit chips were removed on the owner's request; `feedback.benefits` is still sent (kept from earlier feedback, otherwise empty) so the consultant view keeps working.
- Faces are grey until one is picked; only the picked face shows in colour.

## 2026-11-20 · Welcome copy, studio renamed to center, Home feeling card
- Welcome slides 1 and 2 use the owner's new copy: "Get Started" on slide 1, "I already have an account" at the bottom; slide 2 "Meet Jitendra Khimlani · Your Bach Flower Therapist" with a "Personal guidance, just for you." kicker (duplicate title chip on the photo removed). Kept "Jitendra Khimlani" instead of "Jitu Bhaiya", per the earlier rename-everywhere rule.
- "studio" renamed to "center" in all visible text: client (FAQ, checkout pickup, data), website, consultant and manager apps, and API messages. Identifiers and the `studio` settings key are unchanged.
- Home feeling card: only "Add a note" and "My journal" (evening ritual button removed).

## 2026-11-20 — Typed DD/MM/YYYY dates, request-only booking, remedies with emotions · branch claude/new-session-94881h
**Status:** Pushed; live preview refreshed (preview/client on main)
**Done:** dates DD/MM/YYYY everywhere, typed number boxes (no date pickers) · clients only request sessions (optional days / time of day / preferred date / note), "Time to be confirmed" until the team sets it, "Can't make it?" asks for a new time · My care lists every remedy in the blend with the feeling it supports (38 mapped) · earlier today: name Jitendra Khimlani, remedies not essences, privacy note before the form, no helplines/AI mention in the form, pay at the center, Android calendar, shop scroll, back buttons, cart icons, dose check-ins + streak + 25-day calendar, My care tab
**Tests:** 49 green
**Requests:** 20261120-client-to-manager-consultant-request-only-booking.md (OPEN)

## 2026-11-18 — Launch offer, plans, coupon, subscriptions, pay-first booking with time approval · branch claude/new-session-94881h
**Status:** Pushed (preview in `apps/client`)
**Done:** top-of-Home launch banner → full-screen animated offer: Yearly ₹9,600 cut to ₹8,000 (2 months free, save ₹1,600), Pay or WhatsApp 90542 20952 "I want to avail the yearly offer"; ✕ → "Are you sure?" → 6-month offer ₹4,800 → ₹4,000 (1 month free) with claim / skip; live countdown to 1 Dec · after paying: congratulations animation + 15% first-purchase coupon WELCOME15 (7 days, applied at bag/checkout on products) · checkout asks to subscribe per product (every 30 days) and places the order only after confirm · delivered orders ask for a review (stars + note) · follow-up booking offers 6 months (Recommended) / Yearly (Best value) / One time; plans cover later follow-ups · booking order is now pay → preferred time → "Time requested" (confirmed by Jitu Bhaiya or Haresh bhai, else the team calls) · helpline Mr. Haresh 96013 45289 on Help, booking done and session screens
**Tests:** 43 green (8 flows incl. launch offer + plan booking, 11 sizes, axe)
**Needs MANAGER/CONSULTANT:** approve/adjust requested times (`timeRequested`), mark pay-after-session payments, refill subscriptions confirmation and the WhatsApp review message a few days after delivery
**OWNER confirmed 2026-11-18:** a plan = one ₹800 follow-up consultation a month (yearly = 12 × ₹800 = ₹9,600, launch ₹8,000; 6 months ₹4,800, launch ₹4,000); launch prices end 1 Dec 23:59 IST
**Live:** https://99concepts-in.github.io/bewise_system/preview/client/ (preview/client on main, refreshed with owner approval)

## 2026-11-18 — Real product range, shop redesign, owner intake + booking feedback · branch claude/new-session-94881h
**Status:** Pushed (preview in `apps/client`)
**Done:** all 18 products from `Bewise Products Range.xlsx` (7 roll-ons ₹600, 4 aura sprays ₹1,200, Bach remedy dropper/spray ₹800 as reorder of the client's own blend, Rescue Remedy, Hair Oil, Beauty mist, 2 bath salts ₹500) · product images made from the owner's photos (cutouts, recoloured roll-on bands, BeWise labels) · shop: categories, "How do you want to feel?" intents, most loved, disclaimer · first consultation pre-selected; follow-up link only · "Skip" with a recommendation dialog (new clients) · feelings as face tiles + "More feelings"; nuance step skipped when empty; sleep faces; duration + goals screens removed; alcohol notes removed; privacy line rewritten · **pay after session** option (booking stays confirmed; pay later from the session) · no em/en dashes in any copy · brochure testimonials (3, verbatim) + WhatsApp 90542 20952 · remedy label facts (lasts up to 25 days, storage, personal use)
**Tests:** `pnpm build && pnpm test:e2e`: 41 green (6 flows incl. pay later, 11 sizes, axe)
**Flags for OWNER:** product names "Diabetes", "BP", "Cough & Cold" and sheet claims (blood sugar, BP, immunity, relief from cold) were softened to wellbeing language with "not a medicine" notes because of the DMR Act / no-medical-claims rule; please confirm or have counsel review. Ingredient lists not in the sheet ("full list on the label"). Confirm the brochure clients consent to in-app use. Pay-later needs a staff "mark paid" step in the manager app.
**Next:** owner review

## 2026-11-18 — Consultant request + owner rules: drops tick, feedback benefits, booking link, staff-booking pay, check-in link · branch claude/new-session-94881h
**Status:** Pushed — preview in `apps/client`; merged `origin/main` + consultant branch `claude/new-session-1j1y0u` first
**Done:** daily "Took my drops" tick (Home + My Remedies, 2 days editable, 14-day strip, gentle copy) · feedback "How do you feel after the session?" → `benefits[]` · public link `/book/jitu-bhaiya?type=` (landing → sign-in → onboarding → booking, type kept) · `/app/pay?appointment=` for consultant/manager-made bookings (no slot picking) + "Payment received — pick a new time" (consultant point 8) · `/app/checkin?appointment=` deep link · welcome slide 3 story: dropper lifts out, 4 drops, Sad → Happy · speed: CSS skeleton, `loading.tsx`, idle prefetch · AA: muted #5F667A, small grey text → muted, peri/rose/sage tokens darkened, roles on labelled elements
**Tests:** `pnpm build && pnpm test:e2e` — 40 green (5 flows, 11 screen sizes × 24 routes overflow + nav-clear, axe WCAG A/AA on 24 routes)
**Contracts used (consultant ACCEPTED):** `logDrops`, `submitSessionFeedback.benefits`, `getCheckinForm/submitCheckin`, `appointment.needs_new_time`
**Requests:** consultant `20261118-consultant-to-client-drops-feedback-booking.md` → DONE (reply in file)
**Blocked / needs:** FTP secrets in GitHub for auto-deploy to Hostinger (builds green, upload step skipped); domain D-12 for the QR link; OWNER payment-link sender
**Next:** owner review; then fold `apps/client` into the foundation when ✅

## 2026-11-18 — Owner review round 1 (preview) · branch claude/new-session-94881h
**Status:** Pushed — auto-deploys via "Client app → Pages & Hostinger"
**Done:** welcome story rewritten (Welcome to BeWise Wellness · Book with Jitendra Khimlani · Bach flower remedy benefits · "Let's begin"); decorative rings contained (no overlap with text); all cut-out art re-made with neural background removal (no floor patches); mood characters normalised to one box/baseline; **31 feelings** incl. Happy with search in the log sheet; **journal notes** (add/edit/search); **goals on Home**; 4-digit OTP; no session durations shown; photo copy rewritten; WhatsApp + offers consents default on (owner); subtle focus ring; bottom nav fixed for trailing-slash URLs on static hosting; Meet sheet layout fixed; "Client stories" testimonials section (empty until consented quotes); follow-up path for returning clients
**Verified:** Apache 2.4 + static export, full journeys, 0 errors / 0 broken assets
**Contracts changed:** proposals in `20261117-client-to-hub-contract-drift.md` §9 (journal note, Emotion enum, OTP length)
**Also (late round 1):** intake fully optional (every question skippable; review shows "Skipped"), "Who is this for?" removed — dependent bookings parked until the owner asks again
**Intake flow (owner):** guided breathing first ("Take a deep breath", 4-2-6 rhythm) → feelings → detail → body → sleep → life → personal message/voice note → safety → gentle question → goals
**Also:** sleep quality is a simple 5-step scale (Very poor → Very good); all remedy blends alcohol-free — question removed, note shown, legal drafts updated
**Also:** IN-11 sharing + AI summary are now a plain notice, not toggles (owner) — privacy draft updated; counsel to confirm wording
**Also:** studio address added (102, Yogikrupa Apartment, 19/A, Nutan Bharat Society, Alkapuri, Vadodara 390007) — mode card, session Directions (Google Maps listing "Be Wise Holistic Wellness"), calendar invites, legal drafts; CL-13 art replaced with code-drawn video-call phone + Alkapuri map tile
**Also:** Home "Your blend" card — bottle empties from blend start to the next appointment (or run-out), today's drops, pre-book follow-up on a suggested date (opens booking with `?date=`); My Remedies ring uses the same supply maths. Replaces the separate ritual card and the follow-up context card
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

