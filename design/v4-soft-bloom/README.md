# Design v4 "Soft Bloom" — client first, then consultant

> **Owner:** HUB. Status: **IN PROGRESS (owner request 2026-11-17)** — references `design/inspiration/ref-04-mood-tracker-dashboard.png`
> (desktop mood tracker) and `ref-05-sintelly-mobile.png` (mobile). Replaces v2 visuals for the **client app** once approved;
> consultant (Jitendra Khimlani) follows. Layouts, flows and screen IDs (CL-xx, IN-xx) are unchanged — only the visual language changes.

## What we take from the references → BeWise translation
| Reference trait | BeWise v4 |
|---|---|
| Soft lavender→lime gradient screens | **Periwinkle (navy-tint #DCE2F5) → ivory #FAF9F5 → soft sage #DCE7D9** vertical wash; lavender also nods to aromatherapy |
| Bold geometric sans, two-tone headlines ("Hi Emma" dark + "How can I help you today?" grey) | **Plus Jakarta Sans 700**, two-tone: navy #182957 + grey #8A90A0. Serif (Cormorant) only for rare brand moments (splash, quotes) |
| 3D robot assistant card | **3D owl mascot** (from the logo) as the Ask BeWise companion — `design/assets/v4/owl-mascot.png` |
| Colourful shaped mood faces | **8 mood characters** (soft clay pebbles with owl faces) — `design/assets/v4/mood-characters.png` |
| Illustrated category tiles with pastel gradient fills | Category tiles (Sleep, Calm, Bath, Remedies, Gifts, Consultation) with soft illustrations — `design/assets/v4/category-illustrations.png` |
| White cards, 28–32px radius, small round icon buttons top-right | Same: white cards on gradient, 32px radius, 44px round white icon buttons |
| Floating black pill nav, active item = white circle | **Deep navy #182957 floating pill**, icons only, active = white circle with navy icon |
| Black pill CTA / purple gradient full-width CTA | Navy pill CTA; hero CTA = **navy → periwinkle #5E7FB8 gradient pill** |
| "Tap once to reflect — takes 3 seconds" | Same micro-copy on the Home check-in |
| Weekly mood faces row + daily mood bar chart + tooltip "You logged 'Worried'. What caused it?" | Journal & insights: week row of mood characters, daily bars coloured by mood, tooltip invites a note |
| "Your daily insight" one-liner | Home + Journal insight line (from progress summary) |

## Rules
- Background: gradient wash per screen (top periwinkle tint 40%, mid ivory, bottom sage tint 40%); cards pure white with soft shadow `0 8px 24px rgba(24,41,87,0.06)`.
- Headlines 28–32px Plus Jakarta Sans 700, two-tone; body 15px 400; labels 13px 500.
- Primary text navy #182957; secondary #8A90A0; accents sage #82977E, gold #B89B64 (tiny).
- Nav: navy floating pill 64px high, 4–5 icons, active white circle; centre slot keeps **Book**.
- Mood characters replace owl line faces everywhere in the client app; the mascot appears on Home (Ask BeWise card), empty states, success screens — never more than once per screen.
- Keep: logo "BeWise · Holistic Wellness", no refunds, all flows/specs from `docs/specs/client/*`.
