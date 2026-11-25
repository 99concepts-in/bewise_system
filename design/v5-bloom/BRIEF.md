# BeWise v5 "Warm Bloom": design brief (PROPOSAL, awaiting owner approval)

> **Owner:** HUB · 2026-11-20 · Scope: **client app + Jitendra Khimlani's app only** (manager and owner later).
> **Inspiration:** mindfulremedies.co.uk (owner's reference: site, quiz, FAQ; 10 screenshots).
> We take its *qualities*: warm editorial serif, confident colour blocks, friendly line icons, simple quiz rhythm.
> We do **not** copy its brand, logo, artwork or copy. BeWise keeps its owl logo, navy, Jitendra Khimlani and its own voice.
> v4 Soft Bloom (D-43) stays live until this brief is approved; then it becomes D-45.

## 1. Feeling we're designing for
A warm, safe, unhurried place people **want to open every day**: like a kind friend's living room, not a clinic.
Big, confident serif words, plenty of air, colour used in **calm blocks** rather than gradients, and little moments of
delight (petals, gentle motion) that reward coming back.

## 2. Typography (what Mindful Remedies uses, measured from their site)
| Role | Their font | BeWise v5 | Weights | Notes |
|---|---|---|---|---|
| Headings, buttons, card titles, quiz options | **Roca** (Fontfabric, via Adobe Fonts kit) | **Roca** | 400 · 700 · 800 | Same font. Commercial: needs **our own** licence, either Adobe Fonts via a Creative Cloud plan (web project) or a Fontfabric web licence. We may not use their kit. Until we have it, fallback = **Fraunces** (free; soft optical serif, closest look) |
| Body, labels, inputs | **Inter** | **Inter** | 400 · 500 · 600 | Free (Google Fonts) |

**Type scale (mobile):**
| Role | Font · weight | Size / line height |
|---|---|---|
| Display | Roca 800 | 40/44 |
| H1 | Roca 700 | 32/36 |
| H2 | Roca 700 | 24/28 |
| Card title | Roca 700 | 19/24 |
| Quiz option | Roca 700 | 18/24 |
| Eyebrow | Roca 400 | 16 |
| Body | Inter 400 | 16/26 |
| Caption | Inter 500 | 13/18 |

Headings use tight tracking (−0.5%). The style is sentence case everywhere (*"How are you feeling?"*).

## 3. Colour
**Ink: decision needed (see §10).** A = BeWise **midnight navy #1B2A4E** (keeps our logo family; recommended).
B = deep forest **#1A312C** (their ink; closer to them, further from our brand).

| Token | Hex | Use |
|---|---|---|
| `ink` | #1B2A4E (A) / #1A312C (B) | text, icons, dark pills |
| `paper` | #FFFCF7 | app background (warm white) |
| `peach` | #FFBE70 | hero / "about" sections (from their site) |
| `peach-soft` | #FFE3C2 | cards on paper, icon circles |
| `terracotta` | #DE6E3B | "Anxious" |
| `blush` | #E5C2CA | "Low mood", testimonials |
| `forest` | #2B5B4B | FAQ block, "Tired"; cream text on it |
| `salmon` | #E09D8C | "Sleep", "Want more?" banner |
| `rose` | #D26E89 | **primary CTA** (Next, Book, Pay), FAQ "+" |
| `sage` | #92B3A5 | **selected state** in quiz, success |
| `mist` | #D3E0DE | blog / library backgrounds |
| `cream` | #FBF3E6 | text on forest / navy |

Contrast: white text only on terracotta, forest, rose, ink and salmon at 18 px or larger bold. On blush, peach and sage, use ink text (all AA-checked).

## 4. Shapes & layout
- **Colour-block circles** for feelings (home + quiz): 148 px circles, white 2 px line icon, Roca label inside (home) or below (quiz).
- **Cards:** radius 28 px, no borders, soft shadow `0 10px 30px rgba(27,42,78,.08)`. **Full-bleed colour sections** (peach / forest / mist / salmon) alternate down long pages, like their homepage.
- **Buttons:** rose, full width, radius 16 px (softer than their square buttons), Roca 700 18 px, 56 px tall.
- **Floating progress pill:** dark ink, 64 px, radius 999. Client: "Your check-in · 3/8" during intake, "Book your consultation · ₹1,000" on home. Jitu: "Build remedy · 0/7 flowers".
- **Icon style:** one family of friendly line icons, 2 px stroke, rounded caps, people-centred (like theirs), drawn in-house for BeWise. 24 icons cover our 18 feelings + body + life events.

## 5. Bach flower vectors (all 38 + Rescue)
- **What:** realistic botanical **vector (SVG)** for each flower, in one consistent style: natural colours, subtle tonal shading, transparent background, no text.
- **Used for:**
  - flower library;
  - Jitendra Khimlani's remedy builder (tap-to-add tiles);
  - "Your blend" card and bottle label;
  - quiz results;
  - FAQ and empty states;
  - share cards.
- **Production:** 4 samples are in this round (Mimulus, Wild Rose, White Chestnut, Rock Rose). After approval, all 38 are made, cleaned and stored in `design/assets/flowers/*.svg`, then copied into both apps.

## 6. Client app: what changes
| Area | v5 design |
|---|---|
| Home | Greeting + **"How are you feeling today?"** colour-circle grid. Tapping a circle logs the mood and opens matching tips and products. Below that: the **"Meet Jitendra Khimlani" card**, today's blend, then the shop row. The floating "Book" pill stays above the tab bar |
| Jitendra Khimlani story (tap the card) | **Full-screen**, shared-element transition from the card (portrait grows into an arch). It has:<ul><li>a warm peach hero with slow-floating line flowers;</li><li>headline reveal word by word;</li><li>stats that count up (12+ years · 2,00,000+ guided · 38 flowers);</li><li>"His approach" in three steps (icons draw in);</li><li>a swipeable testimonials carousel;</li><li>a gentle sticky "Book with Jitendra Khimlani" button.</li></ul>Respects *reduced motion* |
| Intake quiz | Their rhythm:<ol><li>"What should we call you?";</li><li>"Nice to meet you, {name}!" + feelings as **icon circles** (choose up to 3, sage = selected);</li><li>"Tell us a little more" as **list cards**, one per nuance statement;</li><li>Body, sleep, life changes, safety, goals.</li></ol>Sticky rose **Next**, thin progress bar, autosave. Same questions and answers as today, only the look changes (the API stays the same) |
| Care tab (second tab) | Next appointment card, then **Your blend** card (flower vectors, day x of 25, "Took my drops"), then the **FAQ block**: a forest card with rose "+" accordions, Roca questions, and a bottle-on-petals image at the bottom. FAQ copy comes from Jitendra Khimlani; drafts are in §8 |
| Add to Home Screen | A **subtle** bottom card. It appears only after the 2nd visit or right after a first booking, and never on the first screen. iPhone shows 3 tiny illustrated steps (Share → Add to Home Screen). Android uses the native install prompt. "Not now" hides it for 14 days |
| Notifications | Asked **in context, once**: after booking, "Want a gentle reminder before your session?" Only on "Yes" does the system permission prompt appear (on iPhone this works after Add to Home Screen, iOS 16.4+). Notifications can be managed later in Me → Reminders |

## 7. Jitendra Khimlani's app: what changes
- **Today:**
  - serif greeting;
  - a peach summary card (sessions, blends to give, today's sales);
  - a timeline of sessions with **feeling chips in the same colours** the client chose;
  - a safety dot (D-38).
- **Remedy builder:** a flower grid built from the 38 vectors, with "Flowers to consider" first (D-37). The floating pill shows "Build remedy · 3/7 flowers".
- **Client profile:** the client's mood colours over time, the case summary card and the blend history with flower thumbnails.

## 8. FAQ (draft for Jitendra Khimlani's approval; plain words, no medical claims)
1. **What are Bach flower remedies?** Gentle flower essences, chosen for how you feel, to support emotional balance.
2. **How do I take my blend?** 4 drops, 4 times a day, or as Jitendra Khimlani advises. A bottle lasts about 25 days.
3. **How soon will I notice a change?** Everyone is different; many people notice small shifts in 2–3 weeks.
4. **Can I take them with my medicines?** They're a complementary practice and don't replace your doctor. Tell Jitendra Khimlani about any medicines.
5. **Is there alcohol in it?** Traditionally a little brandy is used as a preservative; alcohol-free blends are available on request.
6. **Are they safe for children and during pregnancy?** Tell us before your session and Jitendra Khimlani will advise. Always check with your doctor.
7. **Online or in person?** Both. Online by video call, or at our studio in Alkapuri, Vadodara.
8. **What if I need to reschedule?** It's free up to 24 hours before. We don't offer refunds, but your session is always kept for you.

## 9. Motion principles
- Slow and soft:
  - durations 240–600 ms, easing `cubic-bezier(.22,1,.36,1)`;
  - nothing bounces harder than a petal.
- Signature moments only:
  - mood circle **press-and-bloom**;
  - the Jitu card **opening into a story**;
  - Next → the next question **slides up**;
  - a petal confetti when a blend is given or a booking is confirmed.
- Everything is off with *prefers-reduced-motion*.

## 10. Decisions needed from the owner
1. **Ink colour:** A, BeWise navy (recommended), or B, forest green.
2. **Roca licence:** buy one (Adobe Fonts or Fontfabric), or start with free Fraunces and switch later?
3. **Flower style:** approve the samples in `design/v5-bloom/`, or ask for changes (more realistic / more illustrated / line-art).
4. **Mockups:** approve, or send changes. Implementation starts only after approval.
