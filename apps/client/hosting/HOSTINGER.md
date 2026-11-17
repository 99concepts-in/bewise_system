# Hosting the BeWise client app on Hostinger

> @owner CLIENT · 2026-11-17 · Works on **any Hostinger plan** (Premium/Business shared, Cloud, VPS) — the app is a
> static site (HTML/JS/images), so no Node.js is needed. Tested on Apache 2.4 with the included `.htaccess`.

## 0. Before you start (5 min)
1. **Pick the address.** Recommended: a sub-domain such as **`app.yourdomain.in`** (hPanel → Domains → Subdomains → create `app`).
   Hostinger creates a folder for it, e.g. `public_html/app` — that folder is the site root.
2. **Switch on SSL** for that (sub)domain: hPanel → Security → SSL → Install (free). The onboarding **camera only works on https**.

## Option A — Upload the zip (simplest, ~5 min)
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
   **Settings → Webhooks → Add webhook** → paste URL, content type `application/json`, "Just the push event".

## Hosting in a sub-folder instead (e.g. `yourdomain.in/app`)
The build must know the folder: `BASE_PATH=/app pnpm export:hostinger`, then upload into `public_html/app`.
(Option B's branch is built for a domain/sub-domain **root**.)

## What the included `.htaccess` does
HTTPS redirect · `index.html` per folder (pretty URLs) · branded 404 · gzip · security headers
(`Permissions-Policy: camera=(self)`, nosniff, HSTS, frame-deny) · `noindex` (preview stays out of Google) ·
caching: HTML no-cache, images 7 days, `_next/static` 1 year immutable.

## Check after going live
- [ ] `https://…` opens the splash; `http://…` redirects to https
- [ ] Sign in with demo code **246810**, take a photo (browser asks for camera permission)
- [ ] Me → **Explore with sample data** → Home, Journal, Remedies, Shop all show content
- [ ] Refresh on a deep page (e.g. `/app/journal/`) still works

## Important — this is the **preview**
Everything is stored **on the visitor's own phone**; there are no real accounts, SMS, payments, bookings or AI yet.
Share it for review/demo, not with real clients, until the backend (Supabase + Razorpay + notifications) is connected.
