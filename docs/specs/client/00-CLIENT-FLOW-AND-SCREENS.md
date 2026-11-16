# Client App — Complete Flow & Screen List (v2)

> **Owner:** HUB (drafted with the business owner, module by module). Status: **DRAFT — waiting for owner's
> per-screen info.** Supersedes the client part of `docs/02-FLOWS-AND-SCREENS.md` once approved.
> Visual direction: `design/inspiration/README.md` (Quiet Luxury).
> Screen IDs `CL-xx` are stable — use them in code headers, PRs and logs.

## Navigation

Floating glass bottom nav: **Home · Remedies · ( Book ) · Shop · Me** — Book is the raised navy centre button.
Journal, appointments, orders and payments are reached from Home cards and Me.

## The flow at a glance

```
FIRST OPEN      Splash → Welcome story → Phone → OTP → About you → Consent → What brings you here → You're in
DAILY           Home (mood check-in, next step, ritual) → Mood check-in → Notifications
BOOK            Choose consultation → Meet your consultant → Online / In person → Date & time → A little about you
                → Review & pay → [Razorpay] → Booking confirmed
PREPARE         Questionnaire intro → Questions → Review & submit → Appointment detail → Waiting room / directions
                (Reschedule · Cancel)
AFTER SESSION   Session summary → Your remedy is ready → Confirm & pay → Remedy ritual & reminders → My Remedies
FEEL            Journal → New entry → Weekly insights → My goals
SHOP            Shop → Collection → Product → Bag → Delivery address → Review & pay → Order placed
TRACK           Orders → Order tracking → Return request · Payments & invoices → Pay due
ME              Profile → Personal details · Addresses · Reminders & notifications · Privacy & data · Help
```

## Screens

### A. First open & sign-in
| ID | Screen | Purpose |
|---|---|---|
| CL-01 | Splash | Owl line-draw animation, brand moment (1.5–2s) |
| CL-02 | Welcome story | 3 calm slides: *Talk* (consultation) · *Receive* (personal remedy) · *Ritual* (care at home). "Begin" / "I have an account" |
| CL-03 | Your phone number | +91 number entry, one field, one button |
| CL-04 | Verify code | 6-digit OTP, auto-fill, resend timer |
| CL-05 | About you | Name, date of birth, city (gender optional) |
| CL-06 | Your privacy | Plain-language consent: data processing (required), WhatsApp updates, offers |
| CL-07 | What brings you here? | Optional soft chips (sleep, stress, change, confidence, relationships, just exploring) to personalise Home — never a diagnosis |
| CL-08 | You're in | Warm welcome, first suggested step (book or explore shop) |

### B. Home & daily
| ID | Screen | Purpose |
|---|---|---|
| CL-09 | Home | Greeting + "How are you *feeling* today?" mood hero · one contextual **Next step** card (book / questionnaire / join / remedy ready / pay due / follow-up) · today's remedy ritual · quiet shop picks |
| CL-10 | Mood check-in | Bottom sheet: owl-eyes mood scale, optional sleep & stress, one-line note |
| CL-11 | Notifications | Inbox grouped Today / Earlier |

### C. Book a consultation
| ID | Screen | Purpose |
|---|---|---|
| CL-12 | Choose consultation | First consultation / Follow-up — duration, fee, what to expect |
| CL-13 | Meet your consultant | Jitu Bhaiya's profile: photo, approach, experience, languages, testimonials (approved) |
| CL-14 | Online or in person | Two large choice cards; in-person shows address & map preview |
| CL-15 | Pick a date & time | Week date strip (selected = navy circle) + morning / afternoon / evening slot pills |
| CL-16 | A little about you | Optional "What would you like to talk about?" + consent reminder |
| CL-17 | Review & pay | Summary, cancellation policy in one line, total, **Pay ₹x** pill (opens Razorpay) |
| CL-18 | Booking confirmed | Calm success, add to calendar, "Complete your questionnaire" next step |

### D. Before the session
| ID | Screen | Purpose |
|---|---|---|
| CL-19 | Questionnaire intro | Why it helps, ~8 minutes, can save and finish later |
| CL-20 | Question | One question per screen, progress, rating / choice / text |
| CL-21 | Review & submit | Edit any answer, submit, thank-you state |
| CL-22 | My appointments | Upcoming / Past (pill tabs), date-tile rows like ref-01 |
| CL-23 | Appointment detail | Time, mode, consultant, Join (online) or Directions (in person), Reschedule, Cancel, receipt |
| CL-24 | Waiting room | Online: opens 10 min before, tips to prepare, Join button activates |
| CL-25 | Reschedule | Same slot picker, shows policy outcome before confirming |
| CL-26 | Cancel appointment | Reason (optional), refund outcome shown clearly, confirm |

### E. After the session — remedies
| ID | Screen | Purpose |
|---|---|---|
| CL-27 | Session summary | Summary shared by the consultant (never private notes), next follow-up date |
| CL-28 | Your remedy is ready | Hero 3D bottle, blend name, what's inside, price (or included), add a store product, **Confirm & pay** |
| CL-29 | My Remedies | Current blend hero card, flowers in it, ritual (drops × times/day), days remaining, reorder, past blends |
| CL-30 | Flower detail | One Bach flower: soft 3D render, gentle description (approved text), why it's in your blend (client-safe wording) |
| CL-31 | Remedy ritual & reminders | Set reminder times for drops, mark taken today, streak (gentle, no pressure) |
| CL-32 | Past blends | Version history v1, v2… with dates |

### F. Journal & insights
| ID | Screen | Purpose |
|---|---|---|
| CL-33 | Journal | Week strip + day timeline with dot connectors (ref-03), entries as soft rows |
| CL-34 | New entry | Mood, sleep, stress, energy, note, optional photo; "Share with my consultant" toggle |
| CL-35 | Weekly insights | Emotional state bubbles (ref-03), sleep & mood trend, gentle written reflection |
| CL-36 | My goals | 1–3 personal goals with soft progress |

### G. Shop
| ID | Screen | Purpose |
|---|---|---|
| CL-37 | Shop | Hero ritual collection, collection pills (Oils · Sprays · Bath · Gift sets), curated rows |
| CL-38 | Collection | Grid of products on beige cream tiles, filter & sort sheet |
| CL-39 | Search | Recent, popular, results |
| CL-40 | Product | Large cutout photo, size pills, price, Description · Ingredients · How to use · Safety, add to bag |
| CL-41 | Wishlist | Saved products |
| CL-42 | Bag | Remedy + products together, quantities, subtotal, GST, delivery |
| CL-43 | Delivery address | Saved addresses / add new (pincode auto-fills city & state) |
| CL-44 | Review & pay | Items, address, totals, **Pay ₹x** |
| CL-45 | Order placed | Calm success, estimated delivery, track order |

### H. Orders & payments
| ID | Screen | Purpose |
|---|---|---|
| CL-46 | My orders | Active / Past pill tabs |
| CL-47 | Order tracking | Stepper Ordered → Preparing → Shipped → Delivered, courier & AWB, invoice |
| CL-48 | Return request | Items, reason, photos, policy |
| CL-49 | Payments & invoices | Due / Paid, invoice rows |
| CL-50 | Invoice & pay | Invoice detail, download PDF, Pay now |

### I. Me
| ID | Screen | Purpose |
|---|---|---|
| CL-51 | Me | Profile header + quick links (appointments, orders, payments, journal, settings) |
| CL-52 | Personal details | Edit name, DOB, phone, email |
| CL-53 | Addresses | List, add, edit, default |
| CL-54 | Reminders & notifications | Channels (in-app, WhatsApp, email), remedy reminders, appointment reminders |
| CL-55 | Privacy & data | Consents, download my data, delete account request |
| CL-56 | Help & support | FAQs, WhatsApp us, policies (refund, shipping, privacy, terms) |

### J. System states (designed once, reused)
| ID | Screen | Purpose |
|---|---|---|
| CL-57 | Empty states | No appointments, no remedies yet, empty bag, no orders — 3D botanical + one action |
| CL-58 | Payment failed / slot taken / hold expired | Calm recovery with clear next step |
| CL-59 | Offline | Gentle banner + what still works |

**Public website** (P-01…P-09) stays a separate step after the app screens are approved.
