# CLIENT chat — work log

> Only the CLIENT chat writes this file. **Newest entry at the top.** Format: see `docs/04-COORDINATION-PROTOCOL.md` §4.

## 2026-11-25 · Book page: simpler, one clear path

- Owner: the Book screen was cluttered and hard to understand, and other offers should be subtle. UX pass on the first step (`Choose` in `app/app/book/page.tsx`):
  1. Title, then a compact Jitendra Khimlani row (photo, name with badge, title, "About ›").
  2. **How it works**, 3 numbered steps:
     - Tell us how you feel (2-minute check-in).
     - We confirm your time (on WhatsApp; ₹1,000 first visit, ₹800 after that).
     - Meet Jitendra Khimlani (online or at the Center; blend included).
  3. **How you'll pay:** "One session · Pay once we confirm your time" selected. The plans sit behind a quiet "Coming every month? Save with a plan" row and open on tap (compact rows, launch-price note inside).
  4. Two quiet links: What members say, and About Bach flower remedies (opens a sheet with the accordion and the spotlight story link).
  5. The reschedule note. "Start 2-minute check-in" stays the one main button.
- Tests updated (plans open on tap; About opens a sheet). 91/91 pass.

## 2026-11-25 · Spotlight story: simpler words, initials instead of emoji

- "at the first tee" (a golf term) is now "before a big game". The line reads: "Before a film premiere, on a stage, before a big game."
- The people cards show an initials badge (EW, CB, JA…) instead of emoji.
- **Actor photos not added yet.** Using public figures' photos next to our brand can read as an endorsement (personality and publicity rights), and press photos are copyrighted. Asked the owner to decide:
  - (a) licensed photos (e.g. Wikimedia Commons with credit) and accept the risk, or
  - (b) keep initials, or
  - (c) remove the names.
- 91/91 pass.

## 2026-11-25 · "Send a note" popup also after the day's last dose

- Owner: the note popup should come first on a mood log, and also when the last (4th) dose is checked in.
- **Rule** (`AppChrome.askNote`):
  - Once after the first mood log of the day (`noteAskedOn`), as before.
  - Once more after the day's last dose (`noteAskedLastDoseOn`), even if it already came that day.
- **Flow:** the 4th dose opens the mood logger with `lastDose`. When it closes the popup comes, also if the member skipped logging.
  - Copy: "All your drops are done for today, and you felt calm. Tell him how your day went." Without a mood: "All your drops are done for today. Tell him how your day went."
  - Send a note opens the chat on "How I feel".
- Tests: last dose after an earlier popup; skipped logging; only once per day for the last dose. 91/91 pass.

## 2026-11-25 · Mood garden: solid white data card

- Owner: no gradient in the mood garden card, and make it a little different from the card below it (the note card, which keeps its soft gradient).
- The mood garden (and its first-10-check-ins state) is now a solid white card with a hairline ring. The flower is the only colour, with the small real rose in the corner.
- Feelings are a simple list: colour dot, name, %. No pill backgrounds.
- "Last 14 days" and the insights are separated by hairlines instead of nested tinted boxes. The tip sits in one soft yellow note.
- 89/89 pass.

## 2026-11-25 · Story "Bach flowers in the spotlight" + "About Bach flower remedies" section

- **New story** `spotlight` (7 slides), from public accounts on olive-tree.in/celebrities. Each line is attributed as reported, with its source shown:
  - Emma Watson (her words), Cate Blanchett, Jennifer Aniston, Hugh Grant (Daily Mail), Salma Hayek (InStyle), Kris Tschetter (Golf Today).
  - Left out on purpose: Princess Diana (mixed with vitamin C and "cleansing the blood") and Messi (sports-form claim).
  - The end note says these are public accounts, not endorsements of BeWise.
  - New slide kind `people` (name, role, line, source).
  - Higgsfield cover `img/stories/spotlight.webp` (backstage vanity, unlabelled bottle, wild flowers; no people) and `og/spotlight.jpg`.
  - Learn card "In the spotlight".
- **"About Bach flower remedies"** (`components/about-remedies.tsx`), on the in-app Book page and the public booking link `/book/jitendra-khimlani`:
  - An accordion: What are they / How is my blend made (made with mantras, best quality essences) / How do I take it / Can I take it with my other care.
  - Plus "Who else uses them?" linking to the spotlight story (public `/s/spotlight` on the booking link).
  - No remedy names, no medical claims.
- Tests: spotlight story + About section; 9 stories in Learn and on /stories. 89/89 pass.

## 2026-11-25 · Review card share screen redesigned; remedy names removed from My care

- **Share screen** (owner: swipeable styles, cleaner, Share as the main button, Google with their words). `ShareScreen` in `components/share-sheet.tsx`, laid out like a story editor:
  - Top bar: ✕, "Your review card", Edit.
  - The card is the hero: swipe between Blush, Midnight and Garden (real previews, side peeks). The style names below act as tabs, with no instruction text. The whole screen takes the style's colours (Midnight goes dark).
  - Bottom panel in thumb reach: one big **Share** (system share sheet with the image), a quiet row of WhatsApp, Instagram, Save and Copy link, and "Also post it on Google · we copy your words".
    - Google can't be pre-filled by any app, so the button copies their words to the clipboard, then opens the Google review page to paste.
  - **Edit** opens a panel with their words (up to 220 characters) and Your words / Tags / Both.
  - The swipe picks a style only once the cards come to rest; a tab tap's own scroll doesn't re-pick.
- **My care, no remedy names** (owner 2026-11-25):
  - The expanded list shows the flower image + "Supports: Everyday fears of known things".
  - The detail sheet is titled "A remedy in your blend", with the image, what it supports, "Chosen for how you feel" and a note that the blend works as a whole.
  - Blend journey shows flower images instead of name chips. The ABOUT texts (they named the flowers) are removed.
- Tests: share screen (main Share, styles as tabs, Edit panel, Google) and "no remedy names in My care". 88/88 pass.

## 2026-11-24 · Share your experience: clean layout

- Owner: "UI is all messed up". On iPhone the card preview (flex-1 + min height) overlapped the subtitle and the theme swatches.
- `ShareScreen` is now normal-flow and scrollable on short phones:
  - Title with the ✕ on one row, and a short line "Thank you 🌸 Pick a style, then share.".
  - A fixed-size preview: `min(44svh, 400px)`, 9:16.
  - Style chips in one row (Blush, Midnight, Garden, each with a colour dot).
  - Review / Tags / Both next to a small Edit button.
  - 5 share icons in a grid, then "Or write a Google review", then Done.
- On the card, short words now sit centred instead of at the top.
- 87/87 pass.

## 2026-11-24 · Feedback comment box: the real fix (focus kept)

- Owner: the feedback text box still didn't work on iPhone.
- **Real cause:** `Sheet` (`components/ui.tsx`) re-ran its open effect whenever `onClose` changed. The session page passes a new `onClose` on every render and re-renders every second (a 1-second clock). Each re-run moved focus back to the sheet, so within 0.3 s of tapping the comment box focus left it and the iPhone keyboard closed. This was reproduced in an iPhone 14 emulation: focus was on the dialog, not the textarea.
- **Fix:** the effect runs only when `open` changes (`onClose` is read through a ref). Initial focus is skipped when something inside the sheet already has focus. Focus moves use `preventScroll`. This benefits every sheet in the app.
- Test: samples focus 8 times over 2.4 s while the page ticks, then types more. It fails on the old code and passes now. 87/87 pass.

## 2026-11-24 · Feedback: reasons that fit an unhappy rating

- Owner: if they're not happy, list reasons that resonate with unhappiness. The quick tags now follow the face:
  - **1 or 2:** "We’re sorry it didn’t feel right. What happened?" with Didn’t feel heard, Felt rushed, Too short, Guidance wasn’t clear, Hard to connect, Started late, Call or audio issues, Not what I expected. The comment box asks "What could we do better?".
  - **3:** a mix: Felt heard, Calming, Too short, Want clearer next steps, Started late, Hard to connect.
  - **4 or 5:** the kind words only, as before.
- Changing the face drops tags that don't belong to the new set.
- Test added. 87/87 pass.

## 2026-11-24 · Story music: Calm and Chimes only

- Owner: remove the Ocean, Binaural and Rain sounds and keep the rest. `lib/ambient.ts` now has 2 soundscapes, **Calm** and **Chimes**: a random one on each open, tap to switch, mute remembered.
- The Rain, Ocean and Binaural render code and the noise helper were removed. The binaural headphones hint is gone with it.
- 86/86 pass.

## 2026-11-24 · Gift (wellness journey plan) only after a first session

- Owner: the gift card is only for people who have had at least one appointment with us.
- New `hadSession()` (`lib/appt.ts`): true when an appointment is completed, or confirmed with a set time that has passed. Requests and unpaid bookings don't count.
- The Home gift banner now needs `hadSession` (plus the offer running and no plan yet).
- Test added (no past session → no gift; with one → gift). 86/86 pass.

## 2026-11-24 · Session page: "Before you begin" only for online sessions

- Owner: no "Before you begin" tips (quiet spot, glass of water, three breaths before you join) on in-person session requests. They now show only when the session is online.
- Test added. 85/85 pass.

## 2026-11-24 · Booking: no past dates for the preferred date

- Owner: the preferred date accepted past dates (e.g. 10/05/1999).
- `DateInput` (`components/date-input.tsx`) now takes `min` / `max` (ISO) with messages. An out-of-range or impossible date shows a red message under the box and isn't saved.
- A saved draft date that is now in the past is flagged and cleared when the screen opens.
- Booking preferences: today to 6 months ahead. "Please choose today or a later date" / "Please choose a date within the next 6 months".
- Birth dates were already checked (18+ and a real year).
- Test: a past date is refused and a date 10 days ahead is accepted (no fixed date in the test any more). 84/84 pass.

## 2026-11-24 · Booking: "One session" selected by default; member stories need real reviews

- Owner: "pay once should be default selection". The plan picker on Book now starts on **One session (Pay later)**; 6 months and Yearly are a choice. Test updated. 84/84 pass.
- Owner: "add more member stories". Not done: only 3 real testimonials exist (brochure). A web search found no public reviews of Jitendra Khimlani, and Google reviews can't be read automatically. We never invent testimonials.
  - Asked the owner to paste review texts (Google screenshots, or WhatsApp messages with the member's permission) with the name to show. Adding them is a one-line change each in `TESTIMONIALS` (`lib/data.ts`).

## 2026-11-24 · Home: "Connect with me on Instagram"

- Owner: add "connect with me on Instagram" on Home (https://www.instagram.com/jitubhaiyajgd).
- New `InstagramCard` under the Meet / Book card: Jitendra Khimlani's photo in an Instagram gradient ring, "Connect with me on Instagram", name with the verified badge and @jitubhaiyajgd, and a full-width "Follow on Instagram" button.
- It opens the profile in a new tab (the Instagram app on phones). The link is stored without the tracking parameter (`JITU_INSTAGRAM` in `lib/data.ts`).
- Test added. 84/84 pass.

## 2026-11-24 · Review card: 3 themes, review / tags / both, edit the words

- Owner: 2 or 3 card options and themes to choose from, some with the chip text and some with only the review, and an edit option.
- `reviewCard` (`lib/share.ts`):
  - Themes: **Blush** (pastel), **Midnight** (deep blue, gold stars, real rose and chicory photos, white button) and **Garden** (cream, real rose, mimulus and chicory photos).
  - Content: **Review** (their words), **Tags** ("My session felt" + the kind tags as chips), or **Both** (words + chips).
- Share screen controls (`CardControls` in sessions/view):
  - Theme swatches, and a Review / Tags / Both switch (shown when there are both words and tags).
  - **Edit** opens an inline box for the words on the card (up to 220 characters; the feedback already sent is unchanged).
  - The preview redraws live (`ShareScreen` `deps`).
- Test: theme change redraws the card, edit the words, Review / Tags / Both. 83/83 pass.

## 2026-11-24 · Review card: full screen with the card, share icons, or a Google review

- Owner: the 4 or 5 star thank-you should be a full screen with the card preview and share icons, or a Google review instead.
- New `ShareScreen` (`components/share-sheet.tsx`). After 4 or 5 star feedback the sheet closes and a full screen opens. It shows:
  - "Thank you 🌸" and "Share your experience".
  - The review card as a large preview.
  - Icons: Instagram (the system share sheet with the image, else it saves the image), WhatsApp (text + link), More (system share), Save, Copy link.
  - "or", then "Write a Google review instead" with the Google icon, then Done.
- 1 to 3 stars: the plain thank-you, as before. The in-sheet invite card is gone.
- Test updated. 83/83 pass.

## 2026-11-24 · Sheets no longer close while typing (iPhone)

- Owner: tapping "Add a comment" in session feedback closed the sheet.
- **Cause:** the comment box was 15 px. iPhone Safari zooms into any text box under 16 px on focus (the screenshot showed the sheet shifted). Sheets could also be swiped closed from anywhere, so the zoom and scroll movement counted as a swipe down.
- **Fix:**
  - `Sheet` (`components/ui.tsx`) now swipes closed only from the handle at the top (`useDragControls`, `dragListener={false}`). Typing, scrolling and zoom inside never close it. The X and backdrop still close it.
  - Every text box in the app is now at least 16 px (14 inputs and textareas across 10 files), so iPhone never zooms.
- Test: a comment drag inside the sheet keeps it open, the box is 16 px, and the handle drag closes it. 83/83 pass.

## 2026-11-24 · Feedback: no negative tags with a smiling face

- Owner: remove negative words when the member picked a smiling face. With 4 or 5, the quick tags show only Felt heard, Clear guidance, Calming and Warm.
- "Too short" and "Hard to connect" are hidden, and dropped if they were picked before the rating changed. With 1 to 3, all tags show.
- Wording: "Visible only to your consultant" is now "Visible only to Jitendra Khimlani". The intake privacy line now says "your Certified Bach Flower Remedy Therapist".
- Test added. 82/82 pass.

## 2026-11-24 · After onboarding: Add to Home Screen, then "Turn on notifications?"; simpler mood flower; real flower photos

- **Setup after onboarding** (`components/prompts.tsx` `SetupFlow`, mounted on Home after the tour; once per device, `bewise-setup`):
  1. "Keep BeWise one tap away", the Add to Home Screen sheet.
     - iPhone: 3 steps (Share, or ••• then Share › Add to Home Screen › Add).
     - Android: Chrome's own install prompt when available, else the menu steps.
  2. "Turn on notifications?" (drop and session reminders, replies from Jitendra Khimlani). Only "Allow notifications" calls `Notification.requestPermission()`, which shows the phone's own dialog.
     - iPhone in Safari can't ask yet (Apple allows notifications only for home screen apps). The sheet says so, and we ask again the first time BeWise opens from the home screen (`notify-later`).
  - Then the first-dose reminder time sheet (it now waits for this setup).
  - The small install card stays away for 14 days after the setup.
- **Mood flower:** equal petals, opacity by how often each feeling was felt, no spinning, "N check-ins" in the centre. Line: "Brighter petals: feelings you felt more often".
- **Real flower photos** (Higgsfield, cut out) replace the drawn corner flowers: `img/deco/{rose,chicory}` on the mood garden, `mimulus` on the remedy card.
- Tests: Android path (Allow → system prompt asked, shown once) and iPhone Safari path (steps → ask later from the home screen). 81/81 pass.

## 2026-11-24 · Share stories (public story page) and review cards after 4 or 5 stars

- **Story sharing:**
  - Share icon on every slide and "Share this story" on the last slide (`components/story-viewer.tsx`, moved out of the route so the same viewer serves members and the public).
  - The share sheet (`components/share-sheet.tsx`) previews a 1080×1920 card drawn on the device (`lib/share.ts` `storyCard`): cover, tag, title, line, a "Read more on BeWise Wellness" button and the link.
  - Actions: Share (system sheet with the image; WhatsApp and Instagram stories), WhatsApp, Copy link, Save image.
- **Public story page** `/s/<id>/` (one static page per story, `generateStaticParams`):
  - Link preview per story (og:image `img/stories/og/<id>.jpg`, 1200×630, made from the covers).
  - Not signed in: the whole story plays. Closing asks "You seem to be new here", with Start my journey (`/welcome`) or View more stories (`/stories`, a public list with Start my journey / Sign in).
  - Signed-in members are sent to `/app/learn/story?id=<id>`.
- **Consultant portal:** static `stories.json` (id, title, tag, line, link, cover, preview, shareText). Request filed: `requests/20261124-client-to-consultant-share-stories.md`.
- **Review card** (session feedback, `app/app/sessions/view`):
  - Only after 4 or 5 stars: "Glad it helped 🌸 Share your experience?" opens a 1080×1920 card (`reviewCard`).
  - The card shows the stars and the member's own words: their comment, else the kind tags they picked, never invented. It also shows "First L., BeWise member", Jitendra Khimlani's photo and title, and "Begin your journey on BeWise" with the app link.
  - Also offers "Review on Google". Nothing is shown for 1 to 3 stars.
- New story covers need an og image too: re-run the small PIL step in this log entry's commit, or add `og/<id>.jpg` by hand.
- Site robots.txt (`hosting/build-hostinger-site.sh`): link-preview bots may read `/client/s/` and images; search engines still blocked.
- Tests: review card for 5 but not 3, story share sheet, public link (new here → stories → onboarding), member redirect. Axe and size checks on `/s/anger` and `/stories`.

## 2026-11-24 · Home: "View my progress" sheet, every dose asks how you feel, encouragement after each log

- **"View my progress":** Home's "View my blend & progress" link is now "View my progress". It opens the 25-day summary sheet (`DoseCalendar`) on Home instead of going to My care.
- **Every dose asks how they feel:** each dose checked in on Home opens the mood logger (it was only the last dose of the day). Unticking a dose does not.
- **Encouragement after each log** (`lib/encourage.ts`):
  - 12 short lines, picked at random and never the same twice in a row. For example: "Keep it up", "The first step to easing any feeling is noticing it. You just did.", "Logging regularly helps Jitendra Khimlani understand your journey at your next session."
  - They show on the logger's summary screen, and in the quick-log toast.
- The logger's summary screen had two close buttons. The left one is now hidden.
- Tests updated (each dose opens the logger; View my progress; the encouragement shows). 73/73 pass.

## 2026-11-24 · My care: blend remedies collapsed to a summary

- Owner: the long remedy list should be collapsed into a summary of what is being addressed, and expand on tap.
- New `BlendRemedies` in `app/app/remedies/page.tsx`. The header reads "Your blend supports", with small flower icons and "N flower remedies · tap to see each".
- Below the header are chips of what the blend supports (for example "Everyday fears of known things", "Low confidence").
- Tapping the header expands the list of remedies (each still opens its detail sheet) and tapping again collapses it. `aria-expanded` is set.
- Test added. 73/73 pass.

## 2026-11-24 · "Send a note" popup: once a day

- Owner: the "Send a note to Jitendra Khimlani" popup after a mood log should come only once a day.
- `AppChrome.askNote` now checks `noteAskedOn` (day key, persisted). The first mood log of the day shows the popup; later logs that day do not.
- The Home note card and the chat are always available.
- Test extended. 72/72 pass.

## 2026-11-24 · Mood logger: Next button cut off on iPhone 14 Safari

- **Cause:** the sheet is 94% of the visible height, but its content was fixed: a 300 px flower plus title, label, slider and button. With Safari's toolbars showing, the content was taller than the sheet, so the Next button was clipped.
- **Fix** (`components/mood-logger.tsx`):
  - The flower now measures the room that is left (ResizeObserver) and sizes itself between 140 and 300 px. The summary flower scales with it.
  - The sheet is anchored from the top in `svh` (5svh + 95svh).
- Test: on a 390×600 screen the Next button is fully on screen. 72/72 pass.

## 2026-11-24 · Checkout: saved address selected, new-address form closes

- Owner: "Add an option to close this. It is not letting me check out even if I have one address already, and that is selected."
- **Cause:** checkout read the saved addresses before the app's local storage had loaded. With none found, it opened the empty form and selected nothing. Pay was also locked while the form was open.
- **Fix** (`app/app/checkout/page.tsx`):
  - When the addresses arrive, the first one is selected and the empty form closes (unless the member opened it).
  - The form has a close (X) button whenever a saved address exists.
  - Pay is only locked when no address is selected.
- Test added. 71/71 pass.

## 2026-11-24 · Home: mood garden, blooming dose tracker, gift offer, notes to Jitendra Khimlani

Owner feedback (screenshots from My care and Home), all live:
- **Mood graph fixed and moved to Home** as "Your mood garden" (`components/mood-garden.tsx`).
  - The old donut drew every slice as a full ring (motion `pathLength` overrode `strokeDasharray`), so only one colour showed.
  - New graph: a "bloom" where each petal is a feeling, and a longer petal means it was felt more often. It also has feeling chips with %, a 14-day row of little flowers, two gentle lines and a tip.
  - Under 10 check-ins, a 10-petal flower fills one petal per check-in, with "N more check-ins to go" and a Log button.
  - Removed "Since your blend began" from My care.
- **Remedy tracker redesigned:**
  - Sunrise wash; the bottle sits on a glowing halo.
  - The bottle's 25 days are shown as a petal row.
  - Today's doses are buds on a vine (Morning / Afternoon / Evening / Night with times). Each one blooms into a flower when checked in.
- **"Streak" is gone everywhere.** Now "N days of self-care" (remedy) and "N days in a row" (goals). Toast: "Another day of self-care".
- **Last dose of the day opens the mood logger directly.** The breathe screen is off; the component is kept.
- **Offer card moved** near the bottom, above Gentle rituals. It now shows a gift box on a deep blue circle (gently bobbing, lid lifting, sparkles), and tapping it opens the offer.
- **Notes to Jitendra Khimlani:**
  - Home card with How I feel / Say thank you / Something else, plus the last note and its status.
  - Chat at `/app/chat` with ticks: sent, delivered, read.
  - After every mood log (logger or quick log sheet), a popup offers to send a note, prefilled with the feeling.
  - Read receipts are simulated in the preview. Server parts are requested in `requests/20261124-client-to-foundation-consultant-member-notes.md`.
- Tests: breathe test replaced; added mood garden gate, note send with delivered then read, and the popup after a mood log. Added `/app/chat` to the size and axe routes. 70/70 pass.

## 2026-11-24 · Learn: Anger story

- Owner: "Add one story on Anger in learn tab". New story `anger` (7 slides) in `apps/client/src/lib/stories.ts`:
  - Cover: "When small things set you off".
  - "Anger is a messenger".
  - Bach's own words on Holly (Twelve Healers, 1936).
  - Kinds of anger: Impatiens, Vervain, Holly, Beech, Willow (the SessionOnly note shows as usual).
  - Cool-down steps.
  - Divya Solanki's real quote.
  - End slide with the care note.
- Higgsfield cover `public/img/stories/anger.webp` (holly, impatiens, glass of water, warm light cooling to blue).
- Home and My care card slider: "Cool a quick temper" on a coral card. The Learn "Anger" chip now finds the story.
- Test: Learn shows 8 stories including anger. 66/66 pass.

## 2026-11-24 · Learn header made concise
- Headline "How Bach flowers help" (one line), description removed, shorter search placeholder ("Search sleep, worry, confidence…"), smaller chips and spacing; stories start higher.

## 2026-11-24 · Home order: Bach flower stories above Book a session
- "How Bach flowers can help" slider now sits directly above Jitendra Khimlani's Book a session card (tour order updated to match).

## 2026-11-24 · Story music works on iPhone; random; 5 soundscapes incl. binaural
- Couldn't hear it on iPhone: live Web Audio is silenced by the ringer switch and only starts on a completed tap. Now each soundscape is rendered once (OfflineAudioContext, 32 s, equal-power crossfaded seam, normalised) to a WAV loop and played through an <audio> element as media (navigator.audioSession = playback where supported). Sound starts on the first tap's touch end; all five are prepared in the background so switching starts instantly inside the tap.
- Random soundscape each time a story opens (mute is remembered). Added Ocean (slow wave swells) and Binaural (200 Hz left / 206 Hz right, 6 Hz theta, soft pads; "best with headphones" shown). Now: Calm, Rain, Chimes, Ocean, Binaural.
- Checked in a browser: every loop has healthy level (RMS 0.09 to 0.18), clean seams, binaural has the expected left/right difference.

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

