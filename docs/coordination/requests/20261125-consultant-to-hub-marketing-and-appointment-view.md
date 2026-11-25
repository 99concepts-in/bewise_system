# Request: CONSULTANT → HUB (+ CLIENT, OWNER) — marketing tab + appointment view backend

**Date:** 2026-11-25 · **Priority:** P1 (owner request) · **Spec:** `docs/specs/consultant/04-APPOINTMENT-VIEW-AND-MARKETING.md`

1. **CLIENT:** record app usage (`clients.app_last_open_at`, set on app open) so "Not using the app" works; show broadcasts and nudges in the member's in-app inbox.
2. **HUB:** tables `broadcasts (id, created_by, audience, body, channels, recipient_count, created_at)` and `nudges (id, client_id, kind, created_at)`; a send job that uses approved WhatsApp templates; nobody nudged twice in 7 days (server check).
3. **HUB:** allow `remedies.appointment_id NULL` (a remedy between sessions: a refill or a changed blend).
4. **OWNER:** approve the WhatsApp template wording (in `src/lib/marketing.ts`), and decide whether a between-session refill is charged (which product).
5. **HUB:** BOOKING_LINK now points to `https://bewiseglobal.in/consultations.html`; confirm that is the page for requests.
