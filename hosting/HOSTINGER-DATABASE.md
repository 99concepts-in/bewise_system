# Turn on the real database on Hostinger (one time, ~10 minutes)

> **Owner:** HUB · 2026-11-18 · Decision **D-44**: BeWise runs on Hostinger: PHP API + Hostinger MySQL, instead of Supabase.
> It works on every Hostinger plan, and you don't need Node.js on the server.
> **Never paste a password into chat, GitHub or an issue.** Type passwords only into hPanel or the BeWise setup page.

## What's on the site after the next deploy
| Address | What it is |
|---|---|
| `https://<domain>/` | The landing page, with links to the four apps |
| `/client/` · `/consultant/` · `/manager/` · `/owner/` | The four apps |
| `/api/` | The backend: sign-in, bookings, intake, remedies, orders, payments, accounts |
| `/api/install.php` | **One-time setup page.** It locks itself after you finish |
| `/api/v1/system.health` | Health check: shows `"ok":true` once the database is connected |

## Step 1: Make sure the latest build is deployed
1. Open hPanel → **Websites** → **Manage** → **Advanced** → **GIT**.
2. Check that the repository branch is **`hostinger-site`**, not the source branch, and that the install path is empty (`public_html`).
3. Click **Deploy**. With auto-deployment ON, every push to `main` updates the site within about 2 minutes.
4. Open `https://<domain>/api/v1/system.health`. You should see `"code":"not_installed"`. That's correct: the API is there and waiting for the database.

## Step 2: Create the MySQL database (hPanel)
1. Open hPanel → **Websites** → **Manage** → **Databases** → **Management**.
2. Under **Create a new MySQL database and database user**:
   - **Database name:** `bewise`. Hostinger adds a prefix, for example `u123456789_bewise`.
   - **Username:** `bewise`. This also becomes something like `u123456789_bewise`.
   - **Password:** click **Generate** and save it in your password manager.
3. Click **Create**.
4. Note the full database name and username exactly as the list below the form shows them.

## Step 3: Create a mailbox for sign-in codes (hPanel)
Clients sign in with a 6-digit code sent by email.
1. Open hPanel → **Emails** → **Email accounts** → **Create email account**, for example `care@<domain>`.
2. Set a strong password and save it.

## Step 4: Run the BeWise setup page
1. Open **`https://<domain>/api/install.php`** right away, before anyone else does.
2. Fill in the form:
   1. **Database:** the name, user and password from Step 2. Host stays `localhost`, port stays `3306`.
   2. **Owner account:** your name, email and a password of at least 10 characters. You'll use this to sign in to `/owner/`.
   3. **Team (optional):** Jitu Bhaiya's and Haresh's emails, each with a temporary password. Give them the passwords in person; they can change them after signing in.
   4. **Email:** choose *Hostinger mailbox (SMTP)*, enter the address from Step 3 and its password. Leave the host as `smtp.hostinger.com` and the port as `465`.
   5. **Razorpay:** leave it empty for now. Until it's added, clients can choose *Pay at the studio / pay later*, and Haresh records cash or UPI payments in the manager app.
3. Click **Create tables & finish setup**.
4. Check the result:
   - You should see **"All set 🎉"**.
   - `https://<domain>/api/v1/system.health` should now show `"status":"ok"`.
   - The setup page is now locked.

**Where the passwords are stored:** the setup page writes a private file, `bewise-private/config.php`, one level **above** `public_html`. It is outside the website, so the web can't reach it and deploys don't overwrite it. To change a setting later, edit that file in hPanel → **File Manager**.

## Step 5: Add Razorpay later (online payments)
1. In the Razorpay Dashboard, go to **Settings → API Keys** and generate a key. Use **Test mode** first.
2. Go to **Settings → Webhooks** → **Add webhook**:
   - **URL:** `https://<domain>/api/webhooks/razorpay`
   - **Events:** `payment.captured` and `payment.failed`
   - **Secret:** create one.
3. In hPanel → **File Manager**, open `bewise-private/config.php` and add these lines before the final `);`:
   ```php
   'razorpay' => ['key_id' => 'rzp_test_…', 'key_secret' => '…', 'webhook_secret' => '…'],
   ```
4. Save. Checkout switches to Razorpay at once.
5. When you're ready to take real payments, replace the test keys with live keys.

## Backups
hPanel → **Databases** → **phpMyAdmin** → **Export** downloads a copy. Hostinger also keeps automatic backups under **Files → Backups**.

## Developers: how updates reach the database
- A new table or column is a new file in `api/migrations/NNNN_<module>_<what>.sql`. Never edit a file that has already shipped.
- The first API request after a deploy applies new migrations automatically, then runs the idempotent seed.
- API reference: `api/README.md`. Browser SDK: `/api/sdk/bewise-api.js`.
