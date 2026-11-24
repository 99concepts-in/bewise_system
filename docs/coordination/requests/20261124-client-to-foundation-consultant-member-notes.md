# CLIENT → FOUNDATION (API), CONSULTANT: member notes to Jitendra Khimlani (personal chat with read receipts)

**Date:** 2026-11-24 · **From:** CLIENT · **Status:** open · Owner brief of 2026-11-24

## What members see (client app, live in the preview)
- Home card **"Send a note to Jitendra Khimlani"** with three choices: **How I feel** (pick a feeling), **Say thank you**, **Something else**.
- A personal chat screen `/app/chat` with Jitendra Khimlani. Each note the member sends shows ticks:
  one grey (sent), two grey (delivered), two blue + "Read by Jitendra Khimlani · time" once he opens it.
- After **every** mood log, a popup offers "Send a note to Jitendra Khimlani?" which opens the chat with that feeling filled in.
- Preview only: there is no server yet, so the app marks a note delivered after 1.5 s and read after 12 s
  (`apps/client/src/lib/notes.ts`, `usePreviewReceipts`). Remove that once the API below is live.

## API (FOUNDATION)
- `messages.send({ text, topic: 'feeling' | 'gratitude' | 'other', mood?, valence? })` → `{ id, at, deliveredAt }`
  (member → Jitendra Khimlani; text up to 1000 chars).
- `messages.list({ since? })` → the member's thread, both directions, with `deliveredAt` and `readAt` per message.
- `readAt` is set when Jitendra Khimlani (or staff he allows) opens the message in the Consultant app.
- Push / WhatsApp to the member when he replies (template `note_reply`, short: "Jitendra Khimlani replied to your note").
- Privacy: notes are member wellbeing data; visible only to the member, Jitendra Khimlani and roles he allows.

## Consultant app (CONSULTANT)
- An inbox of member notes (newest first), unread badge, the member's feeling chip (mood + pleasant/unpleasant level),
  and the member's mood garden next to the thread. Opening a thread marks its notes read. Reply box.
