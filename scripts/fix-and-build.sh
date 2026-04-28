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

# Build
npx vite build
npx tsup server/index.ts --out-dir dist --format cjs --clean

# Verify
if [ ! -f "dist/server.js" ]; then
  echo "ERROR: dist/server.js missing"
  exit 1
fi

echo "Build OK"
