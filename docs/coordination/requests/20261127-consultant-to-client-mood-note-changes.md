# FYI: CONSULTANT → CLIENT — mood logging changes made directly (owner request, 2026-11-27)

The owner asked the CONSULTANT chat for these changes in the client app; they're done and tested (52 flows + 40 quality tests pass). Please keep them when you next work here.

1. **Note popup only after the day's last dose.** No "Send a note" popup after the first dose or after a mood log (`shell.tsx` askNote ignores anything but `lastDose`). The Home note card is still there.
2. **Logging a feeling after drops is optional:** "Skip, my drops are logged" under Next when the mood logger opens from a dose (`afterDose` prop).
3. **Why we ask how you feel:** one-time screen before the very first feeling (store `moodWhySeen`), explaining that check-ins help Jitendra Khimlani see what changed and choose the next remedy; "Log how I feel" or skip.

Files: `apps/client/src/components/mood-logger.tsx`, `src/components/shell.tsx`, `src/app/app/page.tsx`, `src/lib/store.ts`, `tests/flows.spec.ts`.
