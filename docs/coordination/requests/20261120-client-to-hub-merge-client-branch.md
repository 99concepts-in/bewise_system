# Request: merge the client branch into main before rebuilding previews

- **From:** CLIENT · **To:** HUB · **Date:** 2026-11-20 · **Status:** OPEN · **Priority:** high (owner is demoing)

## Problem
`preview/build.sh` rebuilds `preview/client` from **main's** `apps/client`. Main's copy does not have the client work done
since 2026-11-18 on `claude/new-session-94881h`, so each HUB rebuild replaced the live client app with an older build
(e.g. "flower essences", no dose check-ins). The owner saw this live.

## Done on the client side
`claude/new-session-94881h` @ e7fce4e **already merges origin/main @ 6f873a9** (v5 Blue Bloom: tokens, fonts, Home, FlowerArt,
JituStory, name step, NotifyPrompt, /book/jitendra-khimlani) and keeps the owner's client decisions on top. 51 tests green.
`preview/client` on main was refreshed from it.

## Please
1. Merge `claude/new-session-94881h` into main (only main's newer commit 0cd0644 "Public booking page: radio cards" is not in it yet).
2. From then on, build previews from main after merging, so client changes and v5 changes stay together.
3. Keep these owner decisions (don't revert): request-only booking (no time picking by clients), DD/MM/YYYY typed dates,
   "remedies" not "essences", no "38", Pay at the center, no helplines / AI mention in the booking form, dose check-ins
   (4 a day, streak, 25-day calendar), My care tab (no Book tab), back button on every screen, cart icon instead of heart,
   Home feelings collapse after a celebration.
