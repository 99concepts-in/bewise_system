# bewiseglobal.in: public website, ready for Razorpay

> **Owner:** HUB · 2026-11-19 · Source: `website/` (build `python3 website/build.py` → `dist/website/`)
> Business details shown on every page (name, address, phone, email) live in **`website/build.py` → `BUSINESS`**.
> They must match your Razorpay KYC exactly.

## What's on it (everything Razorpay's website review looks for)
| Page | Link |
|---|---|
| Home: services, prices, products, testimonials | `/` |
| Book a consultation (live times, sign-in, pay) | `/consultations.html` |
| Shop + product details, bag, checkout (pay) | `/shop.html`, `/cart.html` |
| Pricing (every price in INR) | `/pricing.html` |
| About us · Contact us (address, phone, email, hours) | `/about.html`, `/contact.html` |
| Terms & conditions · Privacy policy | `/terms-and-conditions.html`, `/privacy-policy.html` |
| Cancellation & refund policy · Shipping & delivery policy | `/refund-policy.html`, `/shipping-policy.html` |
| My account (bookings, orders, pay pending) | `/account.html` |

The site uses the same database as app.bewiseglobal.in. Bookings and orders appear in Jitu Bhaiya's, Haresh's and the owner's apps.

## Go live (hPanel, once)
1. **Back up the old site:** hPanel → Websites → **bewiseglobal.in** → **File Manager** → `public_html` → select all → **Compress** → download the zip.
2. **Empty `public_html`.** Hostinger's GIT deploy only works into an empty folder.
3. **Connect Git:** Websites → bewiseglobal.in → **Advanced → GIT**.
   - **Repository:** `https://github.com/99concepts-in/bewise_system.git`
   - **Branch:** **`website-site`**
   - **Directory:** leave it empty, so it deploys to `public_html`.
   - Click **Create**, then **Deploy**, then turn on **Auto deployment**.
4. **Turn on SSL** for bewiseglobal.in (hPanel → Security → SSL) if it isn't already on.

Every push to `main` that changes the website rebuilds the `website-site` branch automatically.

## Razorpay setup (owner, on https://app.bewiseglobal.in/api/tools.php)
1. **Add Jitu Bhaiya** under *Add a team member*. Booking times only appear once a consultant exists. He gets default hours of Mon–Sat 10–1 and 4–7.
2. **Create the test login** for Razorpay's reviewers (username + password). Put the same details in the Razorpay form. Never put them in GitHub.
3. **Add the Razorpay test keys:**
   - In the Razorpay Dashboard, switch to **Test mode**, go to **API Keys** and generate a key.
   - Paste the key id and secret into the tools page.
   - In the Razorpay Dashboard, go to **Webhooks** and add the URL `https://app.bewiseglobal.in/api/webhooks/razorpay` with the events `payment.captured` and `payment.failed`.
   - Paste the webhook secret into the tools page.
4. **Test a payment:** on bewiseglobal.in, add a product → Checkout → pay with a Razorpay **test** card or UPI `success@razorpay`.
5. **Go live:** once Razorpay approves the account, replace the test keys with **live** keys on the same tools page.
