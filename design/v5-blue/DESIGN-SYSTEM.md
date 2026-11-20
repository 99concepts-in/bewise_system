# BeWise v5 "Blue Bloom": design system (client app + Jitu Bhaiya's app)

> **Owner:** HUB · 2026-11-20 · Owner direction:
> - Blue theme only, with colourful elements.
> - Calm, never cluttered.
> - **The logo is identical everywhere.**
> - Mindful Remedies and the v5 "Warm Bloom" mockups are *inspiration only*: we copy nothing.
>
> This replaces v4 Soft Bloom (D-43) in the client app and the consultant app. Decision **D-45**.

## 1. Logo: one kit, never redrawn
- **Source:** `design/brand/kit/`, a vector trace of the master `design/brand/bewise-logo-holistic-wellness.jpg`.
- **Files:** `bewise-logo-horizontal(-white).svg` · `bewise-logo-stacked(-white).svg` · `bewise-mark(-white).svg` · `bewise-wordmark(-white).svg`.
- **Rules:**
  - Always use these files: no CSS text "BeWise", no re-typed wordmark, no other owl.
  - **Clear space** = the owl circle's radius on every side. **Minimum size:** horizontal 28 px high, mark 24 px.
  - **Colour:** navy `#243D91` on light backgrounds; the white version on navy or photos. Never recolour, stretch, rotate or add effects.
- **App headers:** horizontal lockup, 32 px high (client) or 28 px (consultant).
- **Splash / welcome / Jitu Bhaiya story:** stacked logo or mark.

## 2. Colour: blue base, colourful accents
| Token | Hex | Role |
|---|---|---|
| `navy` | #243D91 | logo, primary buttons, active nav, links |
| `ink` | #17214A | headings and body text (13.9:1 on paper) |
| `ink-2` | #4A5478 | secondary text (7.4:1) |
| `muted` | #6B7391 | captions (4.8:1 on white) |
| `blue` | #4C6FD6 | highlights, progress, focus ring |
| `sky-50` | #F3F6FF | **app background** (cool paper) |
| `sky-100` | #E6EDFF | soft cards, selected-state fill |
| `sky-200` | #CFDBFF | dividers on blue, chips |
| `line` | #E3E8F5 | hairlines |
| `white` | #FFFFFF | cards |

**Accents.** Feelings, categories and illustrations only; never body text. Each accent has a strong colour (`-500`), used on circles, icons, and white text at 18 px or larger bold, and a pale tint (`-100`) for backgrounds and chips with ink text.

| Accent | 500 | 100 | Used for |
|---|---|---|---|
| marigold | #F2A93B | #FFF1D9 | Joyful, Hopeful, energy |
| coral | #EE7F5F | #FFE6DE | Anxious, Fear |
| rose | #E06A8E | #FDE3EB | Overthinking, Love, Grateful |
| lilac | #8E74DB | #EEE8FF | Low mood, Sleep |
| teal | #2FA39A | #DDF4F1 | Tired, Calm, Growth |
| sky | #3E9BE6 | #DFF0FF | Worry, Clarity |
| navy | #243D91 | #E6EDFF | Stressed, Focus |

White text is allowed on coral, rose, lilac, teal, sky and navy at 18 px or larger bold. On marigold always use ink text.

**Background.** `sky-50`, with **one** soft wash at the top of Home only (`linear-gradient(180deg,#E6EDFF 0,#F3F6FF 280px)`). No other gradients. Colour comes from the accents, not from tinted pages.

## 3. Typography
| Role | Font | Notes |
|---|---|---|
| Display & headings, buttons, quiz options, card titles | **Fraunces** (variable; `SOFT` 100, `WONK` 0, `opsz` auto) | Free stand-in for **Roca** until licensed. Change `--font-display` in one place to switch |
| Body, labels, inputs, numbers | **Inter** (variable) | `font-feature-settings: "cv11","ss01"`; tabular numbers for money and times |

**Scale (mobile):**
| Role | Font · weight | Size / line height | Tracking |
|---|---|---|---|
| Display | Fraunces 700 | 36/40 | −1% |
| H1 | Fraunces 650 | 28/32 | — |
| H2 | Fraunces 600 | 22/28 | — |
| Card title | Fraunces 600 | 18/24 | — |
| Eyebrow | Inter 600 | 12, uppercase | +6% |
| Body | Inter 400 | 16/24 | — |
| Small | Inter 500 | 14/20 | — |
| Caption | Inter 500 | 12/16 | — |

Sentence case everywhere. Never more than **one Display per screen**.

## 4. Space, shape, depth
- **Spacing:** 4-pt grid. Screen gutter 20 px; gap 12 px inside cards and 24 px between sections.
- **Radii:**
  - cards 24 px;
  - large hero cards 32 px;
  - buttons 16 px;
  - chips and pills 999 px;
  - feeling circles fully round.
- **Depth:** one shadow, `0 6px 20px rgba(23,33,74,.06)`, for cards. Floating bars use `0 14px 32px rgba(23,33,74,.18)`. No borders on cards; 1 px `line` only inside lists.
- **Uncluttered rules:**
  - at most **3 sections** above the fold;
  - one primary action per screen;
  - section headers say one thing;
  - keep empty space.

## 5. Components
- **Buttons:**
  - Primary: navy, white Fraunces 600 17 px, 54 px tall, radius 16.
  - Secondary: white, navy text, 1 px `sky-200` border.
  - Text button: navy text with an underline offset of 4.
- **Feeling circle:** 96 px (home, 3 per row) or 104 px (quiz). Accent-500 fill + white line icon (home), or white fill + 1.5 px `sky-200` ring + ink icon (quiz).
  - Selected: accent-500 fill, white icon and a small white check badge.
  - Label: Inter 600 13 px below the circle.
- **Floating action pill:** navy, 60 px high, radius 999, sitting 12 px above the tab bar. Content:
  - client: "Book your consultation · ₹1,000 →";
  - during intake: "Your check-in · 3/8";
  - consultant: "Build remedy · 3/7 flowers".
- **Cards:** white, radius 24, padding 20, Fraunces title, Inter body. A *feature card* may use one accent-100 fill (for example "Meet Jitu Bhaiya" on `sky-100` with a marigold sparkle).
- **FAQ accordion** (Care tab): a navy card (`#243D91`) with white Fraunces questions, 32 px marigold "+" circles that rotate to "×", answers in `sky-100` text, and a flower vector peeking from the bottom-right.
- **Flower tile:** square 1:1, `sky-50` background, flower SVG at 80%, Fraunces 15 px name below. Used in the library, the remedy builder and "Your blend".
- **Tab bar:** white, 64 px plus safe area. Active tab = navy icon + label with a 4 px navy dot above. Inactive = `muted`.
- **Prompts** (install / notifications): a single small bottom sheet card, never stacked, dismissible. See §7.

## 6. Icons & illustration
- **Feeling icons:** our own line set, `design/assets/v5/feelings/*.svg`. 18 feelings, traced from one sheet so they match. Single colour, so they can be tinted (ink or white).
- **UI icons:** lucide (already in both apps), 1.75 stroke, 22 px.
- **Bach flowers:** realistic vectors, `design/assets/v5/flowers/<id>.svg`, for all 38 plus Rescue. The id equals the API's `bach_remedies.id` (for example `white-chestnut`, `star-of-bethlehem`).
- **Owl mascot** (v4 3D owl) only on welcome/empty states. Never in place of the logo.

## 7. Key experiences
**Client home:**
1. Greeting + "How are you feeling today?" as 6 feeling circles. Tapping one logs the mood with a petal burst, then shows a one-line suggestion.
2. **Meet Jitu Bhaiya** card.
3. Today's blend (when one exists).
4. Shop row.
5. The floating "Book" pill.

**Jitu Bhaiya story (tap the card):** full-screen.
- The portrait card grows into a tall arch (shared-element feel: scale + radius morph, 450 ms).
- Navy hero with the white stacked logo small at the top and floating line-flower petals drifting slowly (CSS, 18–30 s loops).
- The headline reveals word by word; stats count up; "His approach" in 3 steps with icons drawing in.
- A testimonial carousel, then a sticky "Book with Jitu Bhaiya" button. Close with a ⨯ or swipe down.
- *prefers-reduced-motion* turns all motion into fades.

**Intake quiz (Book):**
1. "What should we call you?" (prefilled, skipped if known).
2. "Nice to meet you, {name}!" with the feelings as icon circles, choose up to 3.
3. Per feeling, statements as **list cards** (tap to select; selected = `sky-100` fill + navy check).
4. Body, sleep, life changes, safety, goals.

A thin blue progress bar, the sticky primary "Next", autosave, and back. The answers keep the same shape (API unchanged).

**Care (2nd tab, today "Remedies"):** next appointment → your blend (flower tiles, day x of 25, drops tick) → **FAQ accordion** (8 questions, `design/v5-bloom/BRIEF.md` §8, pending Jitu Bhaiya's wording).

**Install prompt:**
- Shown after the 2nd visit or right after the first booking; never on the first screen.
- iOS: a small sheet with 3 tiny illustrated steps (Share → Add to Home Screen → Add).
- Android / Chrome: uses `beforeinstallprompt`.
- "Not now" snoozes it for 14 days; hidden when already installed (`display-mode: standalone`).

**Notification prompt:**
- Asked only in context, after a booking or after giving a blend: "Want a gentle reminder before your session?"
- Only "Yes" triggers `Notification.requestPermission()`. On iOS it's offered only when installed.
- It can be changed later in Me → Reminders.

**Consultant (Jitu Bhaiya):**
- **Today:** a serif greeting, a navy summary card (sessions · blends to give · today's sales), and a timeline of sessions showing each client's chosen feelings as coloured chips.
- **Remedy builder:** a flower-tile grid with "Flowers to consider" first; the floating pill shows the count out of 7.
- **Client profile:** mood colours, blend history with flower thumbnails.

## 8. Motion
- **Easing:** `cubic-bezier(.22,1,.36,1)`.
- **Durations:** 160 ms for taps, 280 ms for sheets, 450 ms for hero transitions.
- **Signature moments only:**
  - feeling circle press (scale .94 → 1.04 → 1 + petals);
  - the Jitu story opening;
  - the quiz step slide;
  - confetti petals on booking or blend.
- *prefers-reduced-motion*: replace with fades.

## 9. Accessibility
- **Tap targets** are at least 44 px.
- **Text contrast** is AA or better (checked above).
- **Feeling circles** carry text labels; the colour is never the only signal.
- **Focus ring:** 2 px `blue` with a 3 px offset (keyboard only).
- **Images:** the flower SVGs have `alt` = the flower name.
