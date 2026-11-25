# Appointment view + Marketing tab (owner request, 2026-11-25)

> **Owner:** CONSULTANT · Built in `prototypes/consultant-app/` · Tests: `src/__tests__/v4.test.ts`, `tests/flows.spec.ts`.

## 1. Appointment view (`#/appt/:id`)
Tapping any appointment (Today, Sessions, calendar, a member's sessions) opens a full screen instead of the old sheet:
- **Appointment card:** member (→ profile), type + journey tag, when / length / online or in person, status + fee, who fixed the time, the member's note, video link (edit, "Use my room", share on WhatsApp), **one main action** (Check in → Start → Open live → Give remedy → Book the next one), then Move · Message · Call · WhatsApp.
- **Sliding tabs** (swipe left/right on phones, tap, or arrow keys; dots show position; remembered in the URL):

| Tab | Summary at the top | Body |
|---|---|---|
| Overview | AI wellness summary (flag, feelings, last blend, journey, suggested focus) | stats, **at a glance** tiles (Lo Shu, Moods, Notes, Remedy — each opens its tab), wellness journey, concerns, week |
| Lo Shu | driver, conductor, personal year, room to grow | grid, **general reading** (day to day, life path, this year's theme, strengths, room to grow), missing / repeated numbers, planes |
| Moods | feelings in 4 weeks, most common, trend, check-in | 4-week mood calendar, how often (bars), last check-in better / same / harder |
| Notes | summary of all his notes (themes, last, follow-up) | **Add a note**, every note (after a session or added) |
| Remedy | current blend, days left, drops, how many remedies | **Create a new remedy**, current blend with flower pictures + delivery, drops calendar, **all past remedies** (added / left out, how they felt) |
| Sessions | count, rating, last / next, journey | every session (opens its appointment) |
| About | app usage, with you since | mobile, city, date of birth, app, pronoun, joined, Archive |

The member profile (`#/people/:id`) uses the same tabs under the member header.

**New remedy** goes to: this appointment once it has started (or a session that ended in the last 2 days); otherwise it is a remedy **between sessions** (refill or changed blend) stored on the member (`people[].remedies`, backend: `remedies` row with `appointment_id NULL`).

**Lo Shu general reading:** driver trait, conductor trait, personal year = day + month + current year reduced (theme per year 1–9). Wording: "general tendencies … not a forecast".

## 2. Marketing tab (`#/marketing`, 6th nav tab)
- **This week:** posts shared, people messaged, asked or booked; one tip.
- **Do this today** (counts exclude anyone messaged in the last 7 days): Not using the app (never installed / not opened in 14 days) · Follow-up due · Drifting away · Happy members (5★ in 90 days → ask for a Google review / referral) · Missing their drops. Each opens a **nudge sheet**: template with `{name}`, live preview, pick people, **Send to N** (BeWise WhatsApp number + in-app), or send one from his own WhatsApp.
- **Share and post:** Share a BeWise story · Share a review (ready image) · **Broadcast to all** (audience: everyone / on a remedy / Bach flower / scanning / not seen in 2 months; templates; app and/or WhatsApp; confirm step) · My booking link (link + QR).
- **Ready to post:** images drawn in the browser with the BeWise logo and the website's flower illustrations: story, reviews, flower of the week, wellness tip, "Ask for a session" with his photo, milestone. Post (1080²) or story (1080×1920). **Share** opens the phone's share sheet (WhatsApp, Instagram…) with image + caption; on a computer the image is saved and the caption copied. Reviews show "A member, City" unless he switches the first name on (after asking).
- **Recently sent:** broadcasts, nudges, shares.

## 3. Backend / other chats (requests filed 2026-11-25)
- CLIENT: report app usage (`clients.app_last_open_at`), show broadcasts + nudges in the app inbox.
- HUB / OWNER: WhatsApp approved templates for nudges and broadcasts; tables `broadcasts`, `nudges`; `remedies.appointment_id` nullable for between-session remedies (and whether a refill is charged).
