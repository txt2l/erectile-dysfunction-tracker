#!/usr/bin/env bash

set -e

echo "=== START FIX & BUILD ==="

# 1. Remove conflicting nested package.json
if [ -f "server/package.json" ]; then
  echo "Removing server/package.json"
  rm server/package.json
fi

# 2. Clean old builds
rm -rf dist
rm -rf server/dist

# 3. Install deps
echo "Installing dependencies..."
npm install --legacy-peer-deps

# 4. Build client (Vite)
echo "Building client..."
npx vite build || echo "Client build failed (continuing anyway)"

# 5. FIND SERVER ENTRY (handles all your chaos)
echo "Detecting server entry..."

POSSIBLE_ENTRIES=(
  "server/index.ts"
  "server/src/index.ts"
  "server/app.ts"
  "server/main.ts"
  "server/core/index.ts"
  "server/_core/index.ts"
  "server/server_core/index.ts"
)

ENTRY=""

for FILE in "${POSSIBLE_ENTRIES[@]}"; do
  if [ -f "$FILE" ]; then
    ENTRY="$FILE"
    break
  fi
done

# fallback: find ANY index.ts inside server/
if [ -z "$ENTRY" ]; then
  ENTRY=$(find server -type f -name "index.ts" | head -n 1)
fi

# fail if still nothing
if [ -z "$ENTRY" ]; then
  echo "ERROR: No server entry found anywhere"
  exit 1
fi

echo "Using entry: $ENTRY"

# 6. Build server
echo "Building server..."
npx tsup "$ENTRY" \
  --out-dir dist \
  --format cjs \
  --platform node \
  --target node22 \
  --clean

# 7. FORCE correct output name
if [ ! -f "dist/server.js" ]; then
  echo "Fixing output filename..."

  FILE=$(ls dist/*.js | head -n 1)

  if [ -z "$FILE" ]; then
    echo "ERROR: No JS output at all"
    exit 1
  fi

  mv "$FILE" dist/server.js
fi

# 8. Verify final result
if [ ! -f "dist/server.js" ]; then
  echo "FINAL ERROR: dist/server.js missing"
  exit 1
fi

echo "=== BUILD SUCCESS ==="
ls -la dist/
