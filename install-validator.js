#!/usr/bin/env node
/**
 * Install the AI-Proof Build Validator into your project
 * Run: node install-validator.js
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIR = process.cwd();
const SOURCE_DIR = __dirname;

console.log('🔧 Installing AI-Proof Build Validator...\n');

// Files to copy
const files = [
  { src: 'diagnose.js', dest: 'diagnose.js', exec: true },
  { src: '.github/workflows/validate.yml', dest: '.github/workflows/validate.yml', exec: false },
  { src: 'pre-commit', dest: '.git/hooks/pre-commit', exec: true },
];

let installed = 0;
let skipped = 0;

for (const file of files) {
  const srcPath = path.join(SOURCE_DIR, file.src);
  const destPath = path.join(TARGET_DIR, file.dest);

  if (!fs.existsSync(srcPath)) {
    console.log(`⚠ Skipped: ${file.src} (not found in source)`);
    skipped++;
    continue;
  }

  // Create directories if needed
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Don't overwrite existing workflow unless forced
  if (fs.existsSync(destPath) && file.dest.includes('.github')) {
    console.log(`⚠ Skipped: ${file.dest} (already exists, use --force to overwrite)`);
    skipped++;
    continue;
  }

  fs.copyFileSync(srcPath, destPath);

  if (file.exec) {
    fs.chmodSync(destPath, 0o755);
  }

  console.log(`✓ Installed: ${file.dest}`);
  installed++;
}

console.log(`\n📊 Summary: ${installed} installed, ${skipped} skipped`);
console.log('\n🚀 Usage:');
console.log('   node diagnose.js          # Run checks');
console.log('   node diagnose.js --fix    # Auto-fix issues');
console.log('   node diagnose.js --strict # Fail on warnings');
console.log('\n🔒 Pre-commit hook active — commits will be validated automatically.');
