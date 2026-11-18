#!/usr/bin/env bash
# Rebuilds the GitHub Pages previews (Pages source = main / root).
#   https://exceptionalappstudios-ship-it.github.io/bewise_system/
# Run from the repo root:  bash preview/build.sh   then commit preview/ + index.html
set -euo pipefail
ROOT=$(pwd)
(cd apps/client && pnpm install --frozen-lockfile && pnpm typecheck && \
  STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/bewise_system/preview/client NEXT_PUBLIC_NOINDEX=1 NEXT_TELEMETRY_DISABLED=1 pnpm build)
(cd prototypes/consultant-app && pnpm install --frozen-lockfile && pnpm build)
(cd prototypes/manager && pnpm install --frozen-lockfile && pnpm build)
python3 docs/specs/owner/prototype/build.py
rm -rf preview/client preview/consultant preview/manager preview/owner
cp -r apps/client/out preview/client
cp -r prototypes/consultant-app/dist preview/consultant
cp -r prototypes/manager/dist preview/manager
mkdir -p preview/owner
{ printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex">\n<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style>\n</head><body>\n'
  cat docs/specs/owner/prototype/owner-command-centre.html
  printf '\n</body></html>\n'; } > preview/owner/index.html
touch .nojekyll
echo "Built previews into $ROOT/preview"
