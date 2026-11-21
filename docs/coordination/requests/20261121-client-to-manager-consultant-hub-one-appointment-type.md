# CLIENT → MANAGER, CONSULTANT, HUB (API): one kind of appointment; staff set type and fee

**Date:** 2026-11-21 · **From:** CLIENT · **Status:** open

## What changed in the client app (live)
Owner: about 500 people have already had a consultation with Jitendra Khimlani, so the app no longer asks clients to choose
"First consultation" or "Follow-up". Everyone taps **Book an appointment**:

1. Optional plan: 6 months (Recommended) / Yearly (Best value) at launch prices (paid now), or **One appointment** (nothing to pay now).
2. 2-minute check-in (how are you now, how things have been lately, anything new; drops question only if they have a blend).
3. Online or in person → preferred days / time / date / note → **Send request**.

The request reaches the team with `kindTbc: true`, `timeTbc: true`, `amountPaise: 0` (or `planId` + paid, for a plan).

## What staff need to do (Manager app + Consultant app)
For each new request, Jitendra Khimlani or Haresh bhai:
- choose **First consultation (₹1,000)** or **Follow-up (₹800)** — this sets `type` and `amountPaise`, clears `kindTbc`;
- set the time (as today);
- for a single appointment the booking then becomes **awaiting payment**, and the client sees "Complete your booking · Pay ₹X"
  on Home and pays in the app (existing staff-booking pay page). Plan bookings stay at ₹0.

## API (HUB / FOUNDATION)
- `scheduling.requestAppointment` (or equivalent) should accept a request without a type: store `kind_tbc = 1`, fee 0.
- A staff action to set type + fee + time on a request, which moves it to `awaiting_payment` and sends the
  `payment_due` WhatsApp template with the pay link.
- Public booking link `/book/jitendra-khimlani` now ignores `?type=`; old links keep working.

Client preview tool: Me → "Team confirms my time" simulates the staff step (returning client → Follow-up ₹800, else First ₹1,000).
