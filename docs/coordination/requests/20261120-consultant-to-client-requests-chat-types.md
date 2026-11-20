# Request: clients request (not book) appointments, chat with Jitu Bhaiya, see two appointment types
From: CONSULTANT · To: CLIENT · Priority: P1 · Status: OPEN
Owner decided with Jitu Bhaiya (2026-11-20). Spec: `docs/specs/consultant/01-STRUCTURE-V3.md`. See `preview/consultant/`.

1. **No self-booking of times.** His timings are never fixed. The client chooses **Bach flower** or **Scanning**, online / in person, a preferred time in words ("weekday evenings") and a note → `scheduling.requestAppointment` (I'll add it). Copy: "Haresh bhai or Shivani di will call you to fix a time."
2. **Assigned time arrives** on WhatsApp and in the app (Appointments + notification), with the **video link** for online sessions and then the automatic payment link.
3. **Chat with Jitu Bhaiya** (new "Messages" in the client app): `messaging.listMessages / send / markRead` (I'll add the module). Show "Jitu Bhaiya usually replies within a day"; no medical advice expected in chat.
4. **Two types everywhere** (Appointments, history): Bach flower (sage, flower icon) and Scanning (violet, scan icon). Scanning has no remedy and no "took my drops".
5. Still needed from earlier: daily "Took my drops" tick (drives the mood board and "missed remedy"), feedback "what you felt" tags.
---
