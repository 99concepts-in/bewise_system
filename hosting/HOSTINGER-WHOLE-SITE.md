# Moving the whole BeWise system to Hostinger

> @owner HUB · 2026-11-18. Hosts the **landing page + all four apps** on your Hostinger domain:
>
> | URL | App |
> |---|---|
> | `https://YOURDOMAIN/` | landing page (links to every app) |
> | `https://YOURDOMAIN/client/` | client app |
> | `https://YOURDOMAIN/consultant/` | Jitendra Khimlani's app |
> | `https://YOURDOMAIN/manager/` | Haresh's app |
> | `https://YOURDOMAIN/owner/` | owner app |
>
> Works on every Hostinger plan (it's a static site — no Node.js needed). Built by `hosting/build-hostinger-site.sh`,
> deployed by GitHub Actions workflow **"Whole system → Hostinger"** on every change to `main`.

## Step 1 — Prepare the domain in Hostinger (5 min)
1. Log in to **hPanel**. Decide where BeWise lives:
   - a **sub-domain** (recommended for now), e.g. `app.bewisewellness.in` → **Domains → Subdomains → Create** → `app`; or
   - the **main domain** → its folder is `public_html`.
2. **Security → SSL** → install the free SSL for that (sub)domain (the client camera only works on https).
3. **Files → File Manager** → open the site folder (e.g. `public_html` or `public_html/app` /
   `domains/app.bewisewellness.in/public_html`) → **delete `default.php`** (the folder must be empty).

## Step 2 — Choose how updates reach Hostinger
### ⭐ Option A — Automatic over FTP (recommended: every change goes live by itself)
1. hPanel → **Files → FTP Accounts** → note **FTP host/IP**, **username**, and set a **password**.
   Best: **create a new FTP account whose directory is the site folder** → then the folder is simply `./`.
2. GitHub → repo **Settings → Secrets and variables → Actions**:
   - **Secrets → New repository secret** (three):
     | Name | Value |
     |---|---|
     | `HOSTINGER_FTP_SERVER` | FTP host or IP (no `ftp://`) |
     | `HOSTINGER_FTP_USERNAME` | FTP username |
     | `HOSTINGER_FTP_PASSWORD` | FTP password |
   - **Variables** (only if needed):
     | Name | When | Example |
     |---|---|---|
     | `HOSTINGER_FTP_DIR` | FTP account opens above the site folder | `public_html/app/` (end with `/`) |
     | `HOSTINGER_FTP_PROTOCOL` | FTPS refused | `ftp` |
     | `HOSTINGER_BASE_PATH` | site in a sub-folder (`yourdomain.in/bewise`) | `/bewise` |
3. GitHub → **Actions → "Whole system → Hostinger" → Run workflow**. In ~3 minutes the summary shows
   "✅ FTP sync to Hostinger". From now on every merge to `main` updates Hostinger automatically.

### Option B — Hostinger Git (Hostinger pulls the ready site)
1. hPanel → **Websites → Manage → Advanced → GIT**.
2. Repository `git@github.com:exceptionalappstudios-ship-it/bewise_system.git` · Branch **`hostinger-site`** · Directory: empty.
3. The repo is private: copy the **SSH key** hPanel shows → GitHub repo **Settings → Deploy keys → Add deploy key** (read-only).
4. **Create → Deploy**. Then turn on **Auto Deployment**, copy its **webhook URL** → GitHub secret `HOSTINGER_WEBHOOK_URL`.

### Option C — Upload once by hand (5 min, no automation)
1. Get `bewise-hostinger-site.zip`: GitHub → **Actions** → latest "Whole system → Hostinger" run → **Artifacts**
   (or run `bash hosting/build-hostinger-site.sh` → `dist/bewise-hostinger-site.zip`).
2. File Manager → site folder → **Upload** the zip → right-click → **Extract** here.
   You should see `index.html`, `.htaccess` (hidden), `client/`, `consultant/`, `manager/`, `owner/`.

## Step 3 — Check it (2 min)
- [ ] `https://YOURDOMAIN/` shows the landing page; `http://` redirects to `https://`
- [ ] Each app opens: `/client/`, `/consultant/`, `/manager/`, `/owner/`
- [ ] Client: sign in with demo code **2468**, refresh on a deep page (`/client/app/journal/`) still works
- [ ] `https://YOURDOMAIN/version.txt` shows the latest build commit

## Notes
- **Old client-only Hostinger deploy is switched off** (it would have overwritten the site root with just the client app).
  GitHub Pages links keep working as before.
- These are **prototypes with sample data** (simulated OTP, payments, AI, messages) and are hidden from Google (`noindex`).
- The **real system** (Supabase database, Razorpay, WhatsApp, Shiprocket) will need **Node.js hosting** —
  Hostinger **Business/Cloud "Node.js web apps"** or a **VPS** — plus a Supabase project. That's a later step; this setup
  is what we'll extend.
- Never paste passwords into chats, commits or issues — only into GitHub Secrets / hPanel.

## Real database & backend (D-44, 2026-11-18)
The build now also ships **`/api/`**: a PHP 8 API on Hostinger MySQL. Turn it on once by following **`hosting/HOSTINGER-DATABASE.md`**:
1. Create the database in hPanel.
2. Open `/api/install.php`.
3. Fill in the form.

When it's done, the landing page chip changes to *"Live · real database connected"*.
