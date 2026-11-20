# Request: both appointment types, express, request queue for Haresh bhai & Shivani di, archive
From: CONSULTANT · To: MANAGER · Priority: P1 · Status: OPEN
Owner decided with Jitu Bhaiya (2026-11-20). Spec: `docs/specs/consultant/01-STRUCTURE-V3.md`. See `preview/consultant/` → "New" and "Asking for a time".

1. **Two types:** Bach flower and Scanning (`consultation_types` id `scanning`). Same badge colours/icons as the consultant app.
2. **Request queue** ("Asking for a time"): Haresh bhai / **Shivani di** call the client and **assign a time** (any time 7 AM–10 PM, clashes blocked) → `scheduling.assignTime` → WhatsApp + in-app, payment link automatic. Please add **Shivani di** as a manager-role staff user (or ask OWNER).
3. **Express appointment** from the manager app too: type → person → online (link) / in person → next free time → greet & confirm.
4. **Video link** field for online sessions; "Share on WhatsApp".
5. **Archive** a client: add `clients.archived_at` + `crm.setArchived {clientId, archived}` (CRM is yours). Archived clients are hidden from boards, never deleted.
---
