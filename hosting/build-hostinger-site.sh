#!/usr/bin/env bash
# @owner HUB — builds the WHOLE BeWise system as one static site for Hostinger.
#
#   yourdomain/             landing page (links to every app)
#   yourdomain/client/      client app        (apps/client, Next.js static export)
#   yourdomain/consultant/  Jitu Bhaiya's app (prototypes/consultant-app)
#   yourdomain/manager/     Haresh's app      (prototypes/manager)
#   yourdomain/owner/       owner app         (docs/specs/owner/prototype)
#
# Usage (repo root):  bash hosting/build-hostinger-site.sh
#   SITE_BASE=""        → site at the root of a domain/sub-domain (default, recommended)
#   SITE_BASE="/bewise" → site inside public_html/bewise
# Output: dist/hostinger-site/ (upload its CONTENTS) and dist/bewise-hostinger-site.zip
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
BASE="${SITE_BASE:-}"
OUT="$ROOT/dist/hostinger-site"
rm -rf "$OUT" "$ROOT/dist/bewise-hostinger-site.zip"
mkdir -p "$OUT"

# 1. Client app → /client (its own .htaccess knows the sub-folder)
(cd "$ROOT/apps/client" && pnpm install --frozen-lockfile && pnpm typecheck && BASE_PATH="$BASE/client" bash scripts/build-hostinger.sh)
cp -r "$ROOT/apps/client/out" "$OUT/client"

# 2. Consultant + manager prototypes (relative asset paths, work in any folder)
(cd "$ROOT/prototypes/consultant-app" && pnpm install --frozen-lockfile && pnpm build)
(cd "$ROOT/prototypes/manager" && pnpm install --frozen-lockfile && pnpm build)
cp -r "$ROOT/prototypes/consultant-app/dist" "$OUT/consultant"
cp -r "$ROOT/prototypes/manager/dist" "$OUT/manager"

# 3. Owner prototype (single self-contained HTML)
python3 "$ROOT/docs/specs/owner/prototype/build.py"
mkdir -p "$OUT/owner"
{ printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex">\n<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style>\n</head><body>\n'
  cat "$ROOT/docs/specs/owner/prototype/owner-command-centre.html"
  printf '\n</body></html>\n'; } > "$OUT/owner/index.html"

# 4. Landing page at the site root, links pointing at /client/, /consultant/ …
sed 's#href="preview/#href="#g' "$ROOT/index.html" > "$OUT/index.html"
sed "s#__BASE__#${BASE}#g" "$ROOT/hosting/htaccess-site.template" > "$OUT/.htaccess"
printf 'User-agent: *\nDisallow: /\n' > "$OUT/robots.txt"
printf 'BeWise site build %s · %s\n' "$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo local)" "$(date -u +%Y-%m-%dT%H:%MZ)" > "$OUT/version.txt"

(cd "$OUT" && zip -qr "$ROOT/dist/bewise-hostinger-site.zip" . -x '*.DS_Store')
echo "Built $OUT and dist/bewise-hostinger-site.zip ($(du -h "$ROOT/dist/bewise-hostinger-site.zip" | cut -f1)) for base '${BASE:-/}'"
