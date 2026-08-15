#!/usr/bin/env bash
# Static export for Cloudflare Pages (root URL, no basePath).
# Route Handlers cannot be exported; they are moved aside for the build.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

api_backup=""
if [[ -d src/app/api ]]; then
  api_backup="$(mktemp -d)"
  mv src/app/api "$api_backup/api"
  restore() { mv "$api_backup/api" src/app/api; rm -rf "$api_backup"; }
  trap restore EXIT
fi

STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 NEXT_PUBLIC_BASE_PATH= \
  NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-https://era-a2a-proxy.sedate-socks.workers.dev}" \
  npm run build

if [[ -f public/_headers ]]; then
  cp public/_headers out/_headers
fi
if [[ -f public/_redirects ]]; then
  cp public/_redirects out/_redirects
fi
touch out/.assetsignore
echo "Cloudflare Pages export ready in ./out"
