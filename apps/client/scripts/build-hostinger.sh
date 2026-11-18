#!/usr/bin/env bash
# @owner CLIENT — build the static client app for Hostinger and zip it.
#   BASE_PATH=""        → upload to the root of a domain/subdomain (recommended, e.g. app.yourdomain.in)
#   BASE_PATH="/app"    → upload into public_html/app
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="${BASE_PATH:-}"
rm -rf out dist
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH="$BASE" NEXT_PUBLIC_NOINDEX=1 NEXT_TELEMETRY_DISABLED=1 pnpm build
sed "s#__BASE__#${BASE}#g" hosting/hostinger/htaccess.template > out/.htaccess
cp hosting/hostinger/htaccess-static.template out/_next/static/.htaccess
printf 'User-agent: *\nDisallow: /\n' > out/robots.txt
mkdir -p dist
(cd out && zip -qr ../dist/bewise-client-hostinger.zip . -x '*.DS_Store')
echo "Built dist/bewise-client-hostinger.zip ($(du -h dist/bewise-client-hostinger.zip | cut -f1)) for base path '${BASE:-/}'"
