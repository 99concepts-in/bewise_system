# Connect WhatsApp (Mart2Meta)

> **Owner:** HUB · 2026-11-19 · Code: `api/lib/whatsapp.php`, settings on **https://app.bewiseglobal.in/api/tools.php**
> Mart2Meta runs on the WhatsApp Cloud API. BeWise sends **template messages** through its API:
> `POST https://login.mart2meta.com/api/<vendor-uid>/contact/send-template-message`, with a bearer token.
> **Never paste the token in chat or GitHub.** Paste it only on the tools page; it is saved in the private config on the server.

## What BeWise sends on WhatsApp
| When | To | Template |
|---|---|---|
| Booking confirmed, paid or "pay later" (and when the time is changed) | Client | `bw_booking_confirmed` |
| Jitu Bhaiya or Haresh books for a client who still has to pay | Client | `bw_payment_due` |
| About 24 h and about 2 h before the session (cron job) | Client | `bw_session_reminder` |
| Blend ready to collect at the studio | Client | `bw_remedy_ready` |
| Order paid | Client | `bw_order_confirmed` |
| Order dispatched (courier and tracking) | Client | `bw_order_dispatched` |
| New booking · **safety alert from the intake (D-38)** | **Jitu Bhaiya only** | `bw_staff_alert` |
| Sign-in code (optional, instead of email) | Client | `bw_auth` |

Clients who turn WhatsApp off in their privacy settings are skipped. Every send is logged; the last 8 show on the tools page.

## Step 1: Connect (2 minutes)
1. In Mart2Meta, open **Console** → **API & Webhook** (sometimes called *Settings → API Access*) and copy:
   - the **Vendor UID**;
   - an **Access token**. Click *Generate* if there isn't one.
2. On https://app.bewiseglobal.in/api/tools.php, go to **WhatsApp (Mart2Meta)**:
   - Paste the Vendor UID and the token, then click **Save WhatsApp**.
   - Under **Send a test**, enter your own mobile with template `hello_world` and language `en_US`. Every new WhatsApp account has this template. If it doesn't arrive, the page shows Mart2Meta's exact reply.
3. On the same page, in **Add a team member**, add each staff member's **WhatsApp number**. Jitu Bhaiya's number is needed for booking and safety alerts.

## Step 2: Create the templates in Mart2Meta (Templates → Create)
Create each template below and submit it. Meta usually approves within minutes to a few hours.
- **Category:** *Utility*, except the login code, which is *Authentication*.
- **Language:** English (`en`).

Copy the texts exactly. `{{1}}`, `{{2}}` and so on are the variables, in this order.

**bw_booking_confirmed** (Utility)
> Hello {{1}}, your {{2}} with Jitu Bhaiya is confirmed for {{3}}, {{4}}. Booking ID: {{5}}. To change the time, reply to this message or open My account on bewiseglobal.in. — BeWise Holistic Wellness

**bw_session_reminder** (Utility)
> Hello {{1}}, a gentle reminder: your session with Jitu Bhaiya is {{2}} at {{3}}, {{4}}. See you soon! — BeWise

**bw_payment_due** (Utility)
> Hello {{1}}, we've reserved your {{2}}. Amount due: {{3}}. You can pay securely here: {{4}} — BeWise Holistic Wellness

**bw_remedy_ready** (Utility)
> Hello {{1}}, your personal Bach flower blend is ready. {{2}} — BeWise

**bw_order_confirmed** (Utility)
> Hello {{1}}, thank you for your order {{2}} ({{3}}). We're preparing it with care and will let you know when it ships. — BeWise

**bw_order_dispatched** (Utility)
> Hello {{1}}, your order {{2}} is on its way with {{3}}. Tracking: {{4}} — BeWise

**bw_staff_alert** (Utility)
> BeWise team update: {{1}} Please open the BeWise app for details.

**bw_auth** (Authentication — sign-in code)
- Use Meta's standard authentication text: *"{{1}} is your verification code."*
- Add a **Copy code** button.

## If Mart2Meta says "Template not found in the system"
- In Mart2Meta → **Templates**, click **Sync** (or *Sync WhatsApp Templates*). Templates approved in Meta only appear after a sync.
- Check the template's **status is Approved** and its **name matches exactly** (lower case, underscores).
- BeWise tries the language codes `en`, `en_US` and `en_GB` automatically, and remembers the one that works.

## Step 3: Turn them on
1. On the tools page, open **WhatsApp messages** and tick each template once Meta has approved it. Unticked templates are never sent.
2. Check the **Parameters** column. It maps Mart2Meta's fields to BeWise values, for example `{"field_1":"{name}","field_2":"{session}"}`.
   - The defaults use Mart2Meta's names `field_1…field_n` for `{{1}}…{{n}}` and `copy_code` for the login button.
   - If Mart2Meta's API page shows different field names, change them here. No code change is needed.
3. Optional: tick **Let clients sign in with a WhatsApp code**. Clients then see a "WhatsApp code" option on bewiseglobal.in and can sign in with their phone number.

## Step 4: Reminders (cron job)
1. In hPanel → **app.bewiseglobal.in** → **Advanced → Cron Jobs**, set **Every 30 minutes**.
2. For the command, paste the one shown on the tools page. It looks like this:
   ```
   /usr/bin/php /home/<user>/domains/app.bewiseglobal.in/public_html/api/cron.php
   ```
   If your plan only allows URLs, use the cron **URL** from the tools page instead (it contains a private key).

The cron job also releases unpaid booking holds on time. Each reminder is sent once, about 24 h and about 2 h before the session.
