#!/usr/bin/env bash
# Render the HTML documents in docs/discovery and docs/legal to PDF with headless Chrome.
# Usage: docs/_print/build.sh
set -euo pipefail

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

for html in "$ROOT"/docs/discovery/*.html "$ROOT"/docs/legal/*.html; do
  pdf="${html%.html}.pdf"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="$pdf" "file://$html" 2>/dev/null
  echo "wrote ${pdf#"$ROOT"/}"
done
