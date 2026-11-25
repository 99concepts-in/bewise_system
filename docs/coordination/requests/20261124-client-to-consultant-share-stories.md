# CLIENT → CONSULTANT (and FOUNDATION): share Bach flower stories from the Consultant portal

**Date:** 2026-11-24 · **From:** CLIENT · **Status:** open · Owner brief of 2026-11-24

## What is live in the client app
- Every story has a **public page**: `https://app.bewiseglobal.in/client/s/<id>/` (e.g. `/client/s/anger/`).
  - Anyone can read the whole story without signing in. Closing it asks "You seem to be new here" with
    **Start my journey** (onboarding) or **View more stories** (`/client/stories/`).
  - Signed-in members are sent to the same story inside the app.
  - Each page has its own link preview (og:title, og:description, og:image 1200×630) so WhatsApp shows the cover.
- Members share from the story (Share icon on every slide, and "Share this story" on the last slide).
  - The share sheet shows a 1080×1920 card: the cover, the title, a "Read more on BeWise Wellness" button and the link.
  - It shares through the system sheet (WhatsApp, Instagram stories, …), and also offers WhatsApp, Copy link and Save image.

## For the Consultant portal
- **Story list (static JSON):** `https://app.bewiseglobal.in/client/stories.json`. Each entry has
  `{ id, title, tag, line, link, cover, preview, shareText }`. New stories appear there automatically on each deploy.
- **Suggested UI:** a "Share a story" list (cover, title, tag) with two actions:
  - **WhatsApp:** `https://wa.me/?text=` + encoded `shareText + "\n" + link`.
  - **Copy link.**
  - Optionally a Share button with the same 1080×1920 card. The drawing code is in `apps/client/src/lib/share.ts` (`storyCard`) and can be reused as is.
- Optional: send to one member on WhatsApp with the member's name ("Hi Priya, this may help: …").

## Review cards (FYI)
After 4 or 5 star session feedback, members can create a review card: their stars, their own words (or the kind tags they
picked), Jitendra Khimlani and a link to `/client/welcome/`. It can be shared to Instagram or WhatsApp, and there is a link to
review on Google. Nothing is shown for 1 to 3 stars.
