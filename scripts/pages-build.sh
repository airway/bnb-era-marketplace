#!/usr/bin/env bash
# Static export for GitHub Pages / Cloudflare Pages (no Route Handlers).
# force-dynamic pages are patched to force-static for the export only.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

backup="$(mktemp -d)"
restore() {
  if [[ -d "$backup/api" ]]; then
    rm -rf src/app/api
    mv "$backup/api" src/app/api
  fi
  if [[ -f "$backup/page.tsx" ]]; then
    cp "$backup/page.tsx" src/app/page.tsx
  fi
  if [[ -f "$backup/desk.tsx" ]]; then
    cp "$backup/desk.tsx" "src/app/desks/[category]/page.tsx"
  fi
  rm -rf "$backup"
}
trap restore EXIT

if [[ -d src/app/api ]]; then
  mv src/app/api "$backup/api"
fi
cp src/app/page.tsx "$backup/page.tsx"
cp "src/app/desks/[category]/page.tsx" "$backup/desk.tsx"
python3 - <<'PY'
from pathlib import Path
for p in [Path("src/app/page.tsx"), Path("src/app/desks/[category]/page.tsx")]:
    text = p.read_text()
    p.write_text(
        text.replace('export const dynamic = "force-dynamic";', 'export const dynamic = "force-static";')
        .replace("export const revalidate = 0;", "export const revalidate = 300;")
    )
PY

STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 \
  NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-}" \
  NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-https://increase-quizzes-warrant-modem.trycloudflare.com}" \
  npm run build

if [[ -f public/_headers ]]; then
  cp public/_headers out/_headers
fi
if [[ -f public/_redirects ]]; then
  cp public/_redirects out/_redirects
fi
touch out/.assetsignore
echo "Static export ready in ./out"
