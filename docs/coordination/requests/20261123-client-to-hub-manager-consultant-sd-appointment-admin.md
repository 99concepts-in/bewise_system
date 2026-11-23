# CLIENT → HUB, MANAGER, CONSULTANT, FOUNDATION (API): session bookings admin (SD) + wording

**Date:** 2026-11-23 · **From:** CLIENT · **Status:** open · Owner brief of 2026-11-23

## Wording (apply in every app, website and WhatsApp template)
Client/patient → **Member** · Consultation → **Wellness session** · Appointment → **Session booking** · Problems → **Concerns** ·
Remedy history → **Blend journey** · Client history → **Wellness journey** · Offers → **Wellness journey plans** (6-month, 1-year) ·
Approve / deny → **Confirm / decline**. Title: **Certified Bach Flower Remedy Therapist**. The client app is done (2026-11-23).

## New role: Session bookings admin ("SD", Shivani di)
- New login with its own role (HUB / FOUNDATION: auth role `bookings_admin`).
- Sees every session booking request from members (the app sends them with `kindTbc`, `timeTbc`, concerns, check-in answers, preferred days/times/date, note).
- Actions: **Confirm** (set first or follow-up, fee and date/time), **Reschedule**, **Decline** (with a short reason), **Archive**, **Book on a member's behalf**.
- The same requests also appear for the Manager and the Consultant (Jitendra Khimlani); any of them can confirm. They can also book on a member's behalf (existing staff-booking flow in the client app: the member gets "Complete your booking · Pay").
- On confirm: WhatsApp `booking_confirmed` (and `payment_due` with the pay link when a fee is due; plan sessions are ₹0).
- On request: WhatsApp acknowledgement to the member ("We got your session booking request…").

## Sign-up fields (API `crm` / auth)
Member profile now carries: WhatsApp number, name, date of birth, gender, photo, city, **reference** (how they heard of us / who referred them).

## Prefill on sign-in (added 2026-11-23)
Owner: most people book through the booking link first, or Jitendra Khimlani / the team books for them; they sign in to the app later.
- API: after the WhatsApp code is verified, return the member we already have for that number (`crm.findMemberByPhone` or inside
  `auth.verifyOtp`): name, date of birth, gender, city, reference, photo if any, and who created it (`booking-link` | `staff`).
- Staff "book on a member's behalf" (Manager, Consultant, SD) must capture at least name + WhatsApp number (DOB, gender, city,
  reference optional), so the member finds them filled in.
- The client app already shows these filled in and editable on "A little about you", with a "Welcome back" note
  (preview: on-device directory in `apps/client/src/lib/members.ts`; demo staff-made member 98989 89898).

## Remedy reminders and morning nudge (added 2026-11-23)
Owner: members set reminder times the first time they get a blend; until they check in their first dose, nudge them each morning.
- Client app (done): first-time popup to set the 4 reminder times (`blend.reminderTimes`, `reminders.on`); a morning notice in the
  bell plus a system notification while the app is open or comes back on screen.
- Needed for real background reminders (FOUNDATION/HUB): web push (service worker + VAPID) or a WhatsApp template
  `remedy_reminder`, sent by cron at the member's reminder times; the morning one repeats only until the first dose of the day is
  logged (`remedies.logDrops` with doses > 0).

## Remedy reminders, revised schedule (2026-11-23, owner)
Replaces the reminder section above.
- The member sets only the time of their first dose (`reminders.firstAt`, also as `blend.reminderTimes[0]`).
- **WhatsApp, server cron:** every day at `firstAt`, send template `remedy_morning` ("Good morning, time for your first drops 🌿"
  + link to the app) unless today's first dose is already logged.
- **After each logged dose:** next reminder 4 hours later (`remedies.logDrops` time + 4 h) as a push notification.
- **Not logged:** repeat every 45 minutes until the dose is logged; stop after the day's 4th dose or at 23:00. Members are not told
  about the repeats.
- Needs web push (service worker + VAPID keys + `push_subscriptions` table) for reminders while the app is closed. The client app
  already does the same schedule while it is open or comes back on screen (components/reminder-setup.tsx).
