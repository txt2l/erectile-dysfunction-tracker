#!/usr/bin/env bash

set -e

echo "Starting fix..."

# Remove conflicting package.json
if [ -f "server/package.json" ]; then
  echo "Removing server/package.json"
  rm server/package.json
fi

# Clean old build
rm -rf dist

# Install deps
npm install --legacy-peer-deps

# Build client
npx vite build

# Detect server entry
ENTRY=""

if [ -f "server/index.ts" ]; then
  ENTRY="server/index.ts"
elif [ -f "server/src/index.ts" ]; then
  ENTRY="server/src/index.ts"
elif [ -f "server_core/index.ts" ]; then
  ENTRY="server_core/index.ts"
else
  echo "ERROR: No server entry file found"
  exit 1
fi

echo "Using entry: $ENTRY"

# Build server
npx tsup $ENTRY --out-dir dist --format cjs --clean

# Verify output
if [ ! -f "dist/server.js" ]; then
  echo "ERROR: dist/server.js missing"
  exit 1
fi

echo "Build OK"
