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
