# Hosting the BeWise client app on Hostinger

> @owner CLIENT · 2026-11-17 · Works on **any Hostinger plan** (Premium/Business shared, Cloud, VPS) — the app is a
> static site (HTML/JS/images), so no Node.js is needed. Tested on Apache 2.4 with the included `.htaccess`.

## 0. Before you start (5 min)
1. **Pick the address.** Recommended: a sub-domain such as **`app.yourdomain.in`** (hPanel → Domains → Subdomains → create `app`).
   Hostinger creates a folder for it, e.g. `public_html/app` — that folder is the site root.
2. **Switch on SSL** for that (sub)domain: hPanel → Security → SSL → Install (free). The onboarding **camera only works on https**.

## ⭐ Automatic deploy on every commit (recommended)
Every push that changes `apps/client/**` runs **GitHub → Actions → "Client app → Pages & Hostinger"**: it type-checks,
builds, and uploads **only the changed files** to Hostinger over FTP. Typical deploy: ~1 minute after the commit.

**One-time setup (10 min):**
1. **Hostinger:** hPanel → **Files → FTP Accounts**. Note the **FTP IP/hostname**, **username** and (re)set a **password**.
   Check which folder the account opens in:
   - main domain → usually the account root *is* `public_html` → folder `./`
   - sub-domain `app.yourdomain.in` → its folder, e.g. `public_html/app/` or `domains/app.yourdomain.in/public_html/`
   (Tip: create a dedicated FTP account limited to the site folder — then the folder is simply `./`.)
2. **GitHub:** repo → **Settings → Secrets and variables → Actions**.
   - Tab **Secrets → New repository secret**, add three:
     | Name | Value |
     |---|---|
     | `HOSTINGER_FTP_SERVER` | FTP hostname or IP from hPanel (no `ftp://`) |
     | `HOSTINGER_FTP_USERNAME` | FTP username |
     | `HOSTINGER_FTP_PASSWORD` | FTP password |
   - Tab **Variables** (only if needed):
     | Name | When | Example |
     |---|---|---|
     | `HOSTINGER_FTP_DIR` | the site folder is not the FTP account's root | `public_html/app/` (must end with `/`) |
     | `HOSTINGER_FTP_PROTOCOL` | FTPS is refused | `ftp` (default `ftps`, encrypted) |
     | `HOSTINGER_BASE_PATH` | the site lives in a sub-folder of a domain (`yourdomain.in/app`) | `/app` |
3. **Test:** GitHub → **Actions → "Client app → Pages & Hostinger" → Run workflow** (or push any commit).
   The run summary shows "✅ FTP sync to Hostinger". Open your site.

Notes: the first deploy uploads everything (~3.5 MB); later ones send only changes (a small
`.ftp-deploy-sync-state.json` file on the server keeps track — leave it there). Deploys run in order, never in parallel.
Never paste FTP passwords into chats, commits or issues — only into GitHub Secrets.

**Alternative — Hostinger's own Git deploy:** set up Option B below, then add the hPanel **auto-deployment webhook URL**
as GitHub secret `HOSTINGER_WEBHOOK_URL` (instead of a GitHub webhook). The workflow calls it right after the fresh build is
on `hostinger-build`, so Hostinger always pulls the new version.

## Option A — Upload the zip (manual, ~5 min)
1. Get `bewise-client-hostinger.zip`:
   - from GitHub → **Actions** → latest "Client preview" run → **Artifacts**, or
   - build it yourself: `cd apps/client && pnpm install && pnpm export:hostinger` → `apps/client/dist/`.
2. hPanel → **Files → File Manager** → open the site root folder (`public_html` or `public_html/app`).
3. Delete the default `default.php` / `index.php` if present.
4. **Upload** the zip → right-click → **Extract** here. You should see `index.html`, `.htaccess`, `_next/`, `img/`, `app/` …
   (File Manager hides dot-files by default — `.htaccess` is there.)
5. Open `https://app.yourdomain.in` → splash → story. Done.

## Option B — Auto-deploy from GitHub (every push updates the site)
GitHub builds the site on every push and keeps the ready files on the branch **`hostinger-build`**.
1. hPanel → **Websites → Manage → Advanced → GIT**.
2. Repository: `git@github.com:exceptionalappstudios-ship-it/bewise_system.git` · Branch: **`hostinger-build`** ·
   Directory: leave empty for the site root (the folder must be empty — delete `default.php` first).
3. The repo is private: hPanel shows an **SSH key** → in GitHub: repo **Settings → Deploy keys → Add** (read-only) → paste it.
4. Click **Create**, then **Deploy**.
5. Auto-deploy: in the same Git screen enable **Auto Deployment**, copy the **webhook URL** → GitHub repo
   **Settings → Secrets and variables → Actions → New secret** `HOSTINGER_WEBHOOK_URL` (the workflow calls it after each build;
   a plain GitHub webhook could fire before the new build is ready).

## Hosting in a sub-folder instead (e.g. `yourdomain.in/app`)
The build must know the folder: `BASE_PATH=/app pnpm export:hostinger`, then upload into `public_html/app`.
(Option B's branch is built for a domain/sub-domain **root**.)

## What the included `.htaccess` does
HTTPS redirect · `index.html` per folder (pretty URLs) · branded 404 · gzip · security headers
(`Permissions-Policy: camera=(self)`, nosniff, HSTS, frame-deny) · `noindex` (preview stays out of Google) ·
caching: HTML no-cache, images 7 days, `_next/static` 1 year immutable.

## Check after going live
- [ ] `https://…` opens the splash; `http://…` redirects to https
- [ ] Sign in with demo code **2468**, take a photo (browser asks for camera permission)
- [ ] Me → **Explore with sample data** → Home, Journal, Remedies, Shop all show content
- [ ] Refresh on a deep page (e.g. `/app/journal/`) still works

## Important — this is the **preview**
Everything is stored **on the visitor's own phone**; there are no real accounts, SMS, payments, bookings or AI yet.
Share it for review/demo, not with real clients, until the backend (Supabase + Razorpay + notifications) is connected.
