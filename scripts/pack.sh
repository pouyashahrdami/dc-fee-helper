#!/usr/bin/env bash
# Builds dist/dc-fee-helper-<version>.zip containing only what the extension needs (upload this to the Chrome Web Store).
set -euo pipefail
cd "$(dirname "$0")/.."
v=$(jq -r .version manifest.json)
node --check content.js && node --check background.js
mkdir -p dist
rm -f "dist/dc-fee-helper-$v.zip"
zip -qr "dist/dc-fee-helper-$v.zip" manifest.json background.js content.js icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png
unzip -l "dist/dc-fee-helper-$v.zip" | tail -n +4
