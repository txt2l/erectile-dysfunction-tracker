JavaScript
Copy
#!/usr/bin/env node
/**
 * AI-PROOF BUILD VALIDATOR v1.0
 * Pre-commit diagnostic suite for React 19 + Vite 6 + Tailwind v4 + tRPC + Drizzle stack
 * Run: node diagnose.js [--fix] [--strict] [--ci]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const SHOULD_FIX = args.includes('--fix');
const STRICT_MODE = args.includes('--strict');
const CI_MODE = args.includes('--ci');

const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, 'client');
const SERVER_DIR = path.join(ROOT, 'server');

let EXIT_CODE = 0;
let TOTAL_ISSUES = 0;
let FIXED_ISSUES = 0;

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function log(type, msg, detail = '') {
  const icons = { error: '✗', warn: '⚠', info: 'ℹ', success: '✓', fix: '🔧' };
  const colors = { error: C.red, warn: C.yellow, info: C.blue, success: C.green, fix: C.cyan };
  console.log(`${colors[type]}${icons[type]}${C.reset} ${msg}`);
  if (detail) console.log(`   ${C.dim}${detail}${C.reset}`);
}

function section(title) {
  console.log(`\n${C.bold}${C.magenta}▶ ${title}${C.reset}`);
  console.log(`${C.dim}${'─'.repeat(60)}${C.reset}`);
}

function fail(msg, detail = '', autoFix = null) {
  TOTAL_ISSUES++;
  log('error', msg, detail);
  if (SHOULD_FIX && autoFix) {
    try {
      autoFix();
      FIXED_ISSUES++;
      log('fix', `Auto-fixed: ${msg}`);
    } catch (e) {
      log('error', `Auto-fix failed for: ${msg}`, e.message);
    }
  }
  if (STRICT_MODE) EXIT_CODE = 1;
}

function warn(msg, detail = '') {
  TOTAL_ISSUES++;
  log('warn', msg, detail);
}

// ============================================================
// CHECK 1: File Structure & Critical Files
// ============================================================
function checkFileStructure() {
  section('FILE STRUCTURE & CRITICAL FILES');
  
  const criticalFiles = [
    { path: 'package.json', desc: 'Root package.json' },
    { path: 'client/package.json', desc: 'Client package.json' },
    { path: 'server/package.json', desc: 'Server package.json' },
    { path: 'client/src/index.css', desc: 'Client CSS entry (Tailwind)' },
    { path: 'client/vite.config.ts', desc: 'Vite config' },
    { path: 'server/src/index.ts', desc: 'Server entry point' },
    { path: 'Dockerfile', desc: 'Docker build file' },
    { path: 'docker-compose.yml', desc: 'Docker compose (optional but recommended)' },
    { path: '.env.example', desc: 'Environment template' },
    { path: 'railway.json', desc: 'Railway deployment config' },
  ];

  criticalFiles.forEach(file => {
    const fullPath = path.join(ROOT, file.path);
    if (!fs.existsSync(fullPath)) {
      if (file.path === 'docker-compose.yml') {
        warn(`Missing ${file.path}`, file.desc);
      } else {
        fail(`Missing ${file.path}`, file.desc);
      }
    } else {
      log('success', `${file.path} exists`);
    }
  });
}

// ============================================================
// CHECK 2: Dependency Resolution (The #1 AI Killer)
// ============================================================
function checkDependencies() {
  section('DEPENDENCY RESOLUTION (AI ERROR #1)');

  let rootPkg, clientPkg, serverPkg;
  try {
    rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  } catch (e) { fail('Cannot parse root package.json', e.message); return; }
  
  try {
    clientPkg = JSON.parse(fs.readFileSync(path.join(CLIENT_DIR, 'package.json'), 'utf8'));
  } catch (e) { fail('Cannot parse client/package.json', e.message); }
  
  try {
    serverPkg = JSON.parse(fs.readFileSync(path.join(SERVER_DIR, 'package.json'), 'utf8'));
  } catch (e) { fail('Cannot parse server/package.json', e.message); }

  const allDeps = {
    ...((rootPkg || {}).dependencies || {}),
    ...((rootPkg || {}).devDependencies || {}),
    ...((clientPkg || {}).dependencies || {}),
    ...((clientPkg || {}).devDependencies || {}),
  };

  if (allDeps['tailwindcss']) {
    const twVersion = allDeps['tailwindcss'];
    log('info', `Tailwind version: ${twVersion}`);
    
    if (!twVersion.startsWith('4') && !twVersion.includes('^4') && !twVersion.includes('~4') && !twVersion.includes('latest')) {
      warn(`Tailwind version ${twVersion} may not be v4. Ensure @import syntax works.`);
    }
  }

  if (!allDeps['tw-animate-css'] && !allDeps['tailwindcss-animate']) {
    fail(
      'Missing tw-animate-css',
      'Your CSS likely imports "tw-animate-css" but it is not in package.json. This WILL break Docker builds.',
      () => {
        const pkgPath = path.join(ROOT, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies['tw-animate-css'] = '^1.0.0';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      }
    );
  } else {
    log('success', 'tw-animate-css or tailwindcss-animate found');
  }

  if (!allDeps['@tailwindcss/vite']) {
    warn('Missing @tailwindcss/vite', 'Tailwind v4 requires the Vite plugin, not PostCSS');
  }

  const trpcClient = allDeps['@trpc/client'];
  const trpcServer = allDeps['@trpc/server'];
  
  if (trpcClient && trpcServer && trpcClient !== trpcServer) {
    fail(
      'tRPC version mismatch',
      `Client: ${trpcClient}, Server: ${trpcServer}. These MUST match exactly.`
    );
  }

  const peerChecks = [
    { name: 'react', context: 'React 19' },
    { name: 'react-dom', context: 'React DOM 19' },
    { name: 'typescript', context: 'TypeScript' },
    { name: 'vite', context: 'Vite 6' },
    { name: 'drizzle-orm', context: 'Drizzle ORM' },
    { name: 'mysql2', context: 'MySQL driver for TiDB' },
    { name: 'socket.io', context: 'Socket.io server' },
    { name: 'socket.io-client', context: 'Socket.io client' },
  ];

  peerChecks.forEach(dep => {
    if (!allDeps[dep.name]) {
      warn(`Missing ${dep.name}`, dep.context);
    }
  });

  if (!fs.existsSync(path.join(ROOT, 'package-lock.json')) && 
      !fs.existsSync(path.join(ROOT, 'pnpm-lock.yaml')) &&
      !fs.existsSync(path.join(ROOT, 'yarn.lock'))) {
    fail('No lockfile found', 'You need package-lock.json, pnpm-lock.yaml, or yarn.lock committed');
  }
}

// ============================================================
// CHECK 3: CSS Import Audit (Tailwind v4 Specific)
// ============================================================
function checkCSSImports() {
  section('CSS IMPORT AUDIT (TAILWIND V4)');

  const cssFile = path.join(CLIENT_DIR, 'src/index.css');
  if (!fs.existsSync(cssFile)) {
    fail('client/src/index.css not found');
    return;
  }

  const cssContent = fs.readFileSync(cssFile, 'utf8');
  
  if (!cssContent.includes('@import "tailwindcss"') && !cssContent.includes("@import 'tailwindcss'")) {
    if (cssContent.includes('@tailwind base') || cssContent.includes('@tailwind components')) {
      fail(
        'Using Tailwind v3 @tailwind directives in v4 project',
        'Tailwind v4 uses @import "tailwindcss", not @tailwind base/components/utilities',
        () => {
          const newCss = cssContent
            .replace(/@tailwind\s+base;/g, '@import "tailwindcss";')
            .replace(/@tailwind\s+components;/g, '')
            .replace(/@tailwind\s+utilities;/g, '');
          fs.writeFileSync(cssFile, newCss);
        }
      );
    } else {
      warn('No @import "tailwindcss" found in index.css');
    }
  } else {
    log('success', 'Tailwind v4 @import syntax detected');
  }

  if (cssContent.includes('tw-animate-css')) {
    log('info', 'tw-animate-css import found in CSS');
    
    const pkgPath = path.join(ROOT, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (!allDeps['tw-animate-css']) {
        fail(
          'CSS imports tw-animate-css but it is NOT in package.json',
          'This is EXACTLY the error that killed your Docker build.',
          () => {
            pkg.dependencies = pkg.dependencies || {};
            pkg.dependencies['tw-animate-css'] = '^1.0.0';
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
          }
        );
      }
    }
  }
}

// ============================================================
// CHECK 4: Vite Config Validation
// ============================================================
function checkViteConfig() {
  section('VITE CONFIGURATION');

  const viteConfigPaths = [
    'client/vite.config.ts',
    'client/vite.config.js',
    'vite.config.ts',
    'vite.config.js'
  ];

  let viteConfigPath = null;
  for (const vp of viteConfigPaths) {
    if (fs.existsSync(path.join(ROOT, vp))) {
      viteConfigPath = path.join(ROOT, vp);
      break;
    }
  }

  if (!viteConfigPath) {
    fail('No Vite config found');
    return;
  }

  log('success', `Vite config: ${path.relative(ROOT, viteConfigPath)}`);
  
  const viteContent = fs.readFileSync(viteConfigPath, 'utf8');

  if (!viteContent.includes('@tailwindcss/vite')) {
    fail(
      'Missing @tailwindcss/vite plugin in Vite config',
      'Tailwind v4 requires: import tailwindcss from "@tailwindcss/vite"'
    );
  } else {
    log('success', '@tailwindcss/vite plugin imported');
  }

  if (!viteContent.includes('proxy') && !viteContent.includes('/api')) {
    warn('No API proxy configured in Vite', 'Client may fail to reach server in dev');
  }
}

// ============================================================
// CHECK 5: Dockerfile Logic
// ============================================================
function checkDockerfile() {
  section('DOCKERFILE LOGIC');

  const dockerfilePath = path.join(ROOT, 'Dockerfile');
  if (!fs.existsSync(dockerfilePath)) {
    fail('Dockerfile not found');
    return;
  }

  const dockerContent = fs.readFileSync(dockerfilePath, 'utf8');
  const lines = dockerContent.split('\n');

  if (!dockerContent.includes('node:22')) {
    warn('Dockerfile not using Node 22', 'Your stack requires Node 22');
  } else {
    log('success', 'Node 22 base image confirmed');
  }

  const copyPackage = lines.findIndex(l => l.includes('COPY package*.json'));
  const npmInstall = lines.findIndex(l => l.includes('npm install'));
  const copyAll = lines.findIndex(l => l.includes('COPY . .'));
  const npmBuild = lines.findIndex(l => l.includes('npm run build'));

  if (copyPackage === -1 || npmInstall === -1) {
    fail('Dockerfile missing COPY package*.json or npm install');
  } else if (copyPackage > npmInstall) {
    fail('npm install runs before COPY package*.json', 'Cache will never work');
  } else {
    log('success', 'Package install order is correct');
  }

  if (copyAll !== -1 && npmBuild !== -1 && copyAll > npmBuild) {
    fail('npm build runs before COPY . .', 'Source files won\'t be available for build');
  }

  if (!dockerContent.includes('--legacy-peer-deps')) {
    warn('Dockerfile missing --legacy-peer-deps', 'May cause peer dependency resolution failures');
  } else {
    log('success', '--legacy-peer-deps flag present');
  }

  if (!dockerContent.includes('BUILD VERIFICATION') && !dockerContent.includes('index.html')) {
    warn('No build verification in Dockerfile', 'Add checks to confirm dist/ was created');
  } else {
    log('success', 'Build verification steps detected');
  }

  if (!dockerContent.includes('AS production') && !dockerContent.includes('npm prune')) {
    warn('No production optimization', 'Consider multi-stage build or npm prune --omit=dev');
  }

  if (!dockerContent.includes('CMD') && !dockerContent.includes('ENTRYPOINT')) {
    fail('No CMD or ENTRYPOINT in Dockerfile', 'Container won\'t know how to start');
  }
}

// ============================================================
// CHECK 6: Environment & Configuration
// ============================================================
function checkEnvironment() {
  section('ENVIRONMENT & CONFIGURATION');

  const envExample = path.join(ROOT, '.env.example');
  if (!fs.existsSync(envExample)) {
    fail('.env.example missing', 'New developers/deployment won\'t know required env vars');
  } else {
    const envContent = fs.readFileSync(envExample, 'utf8');
    const requiredVars = ['DATABASE_URL', 'PORT', 'NODE_ENV', 'JWT_SECRET', 'AWS_REGION'];
    const missingVars = requiredVars.filter(v => !envContent.includes(v));
    if (missingVars.length > 0) {
      warn(`Missing recommended env vars: ${missingVars.join(', ')}`);
    } else {
      log('success', 'Key environment variables documented');
    }
  }

  const railwayConfig = path.join(ROOT, 'railway.json');
  if (!fs.existsSync(railwayConfig)) {
    warn('railway.json missing', 'Needed for Railway deployment with TiDB');
  } else {
    try {
      JSON.parse(fs.readFileSync(railwayConfig, 'utf8'));
      log('success', 'railway.json is valid JSON');
    } catch (e) {
      fail('railway.json is invalid JSON', e.message);
    }
  }

  const serverFiles = [];
  function scanDir(dir, base = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(base, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanDir(fullPath, relPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        serverFiles.push({ path: fullPath, rel: relPath });
      }
    }
  }
  scanDir(path.join(ROOT, 'server/src'));

  let hasTiDBConfig = false;
  for (const file of serverFiles) {
    const content = fs.readFileSync(file.path, 'utf8');
    if (content.includes('mysql2') || content.includes('drizzle') || content.includes('DATABASE_URL')) {
      hasTiDBConfig = true;
      break;
    }
  }
  
  if (!hasTiDBConfig) {
    warn('No database connection code detected in server/', 'Ensure Drizzle + mysql2 is configured for TiDB');
  } else {
    log('success', 'Database configuration detected');
  }
}

// ============================================================
// CHECK 7: TypeScript & Build Readiness
// ============================================================
function checkTypeScript() {
  section('TYPESCRIPT & BUILD READINESS');

  const tsconfigs = ['tsconfig.json', 'client/tsconfig.json', 'server/tsconfig.json'];
  let foundTsConfig = false;
  
  for (const tc of tsconfigs) {
    if (fs.existsSync(path.join(ROOT, tc))) {
      foundTsConfig = true;
      log('success', `${tc} exists`);
      
      const content = fs.readFileSync(path.join(ROOT, tc), 'utf8');
      if (!content.includes('"strict"')) {
        warn(`${tc} missing strict mode`, 'Consider enabling strict TypeScript checking');
      }
      if (!content.includes('"esModuleInterop"')) {
        warn(`${tc} missing esModuleInterop`);
      }
    }
  }
  
  if (!foundTsConfig) {
    fail('No tsconfig.json found anywhere');
  }

  const clientSrc = path.join(CLIENT_DIR, 'src');
  if (fs.existsSync(clientSrc)) {
    const entries = fs.readdirSync(clientSrc, { withFileTypes: true });
    const hasMainEntry = entries.some(e => 
      e.name === 'main.tsx' || e.name === 'main.ts' || e.name === 'index.tsx'
    );
    if (!hasMainEntry) {
      warn('No main.tsx or index.tsx found in client/src/');
    } else {
      log('success', 'Client entry point found');
    }
  }
}

// ============================================================
// CHECK 8: Socket.io Consistency
// ============================================================
function checkSocketIO() {
  section('SOCKET.IO CONSISTENCY');

  const allDeps = {};
  try {
    const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    Object.assign(allDeps, rootPkg.dependencies || {}, rootPkg.devDependencies || {});
  } catch (e) {}

  try {
    const clientPkg = JSON.parse(fs.readFileSync(path.join(CLIENT_DIR, 'package.json'), 'utf8'));
    Object.assign(allDeps, clientPkg.dependencies || {}, clientPkg.devDependencies || {});
  } catch (e) {}

  try {
    const serverPkg = JSON.parse(fs.readFileSync(path.join(SERVER_DIR, 'package.json'), 'utf8'));
    Object.assign(allDeps, serverPkg.dependencies || {}, serverPkg.devDependencies || {});
  } catch (e) {}

  const hasSocketServer = !!allDeps['socket.io'];
  const hasSocketClient = !!allDeps['socket.io-client'];

  if (hasSocketServer && !hasSocketClient) {
    warn('socket.io on server but socket.io-client missing on client');
  } else if (!hasSocketServer && hasSocketClient) {
    warn('socket.io-client on client but socket.io missing on server');
  } else if (hasSocketServer && hasSocketClient) {
    log('success', 'Socket.io client + server dependencies present');
  } else {
    log('info', 'Socket.io not used (OK if not needed)');
  }
}

// ============================================================
// CHECK 9: Try Dry Build (if not in CI)
// ============================================================
function checkDryBuild() {
  section('DRY BUILD TEST');

  if (CI_MODE) {
    log('info', 'Skipping dry build in CI mode (run locally for this)');
    return;
  }

  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    log('info', 'node_modules not found — skipping dry build (run npm install first)');
    return;
  }

  try {
    const cssFile = path.join(CLIENT_DIR, 'src/index.css');
    if (fs.existsSync(cssFile)) {
      const cssContent = fs.readFileSync(cssFile, 'utf8');
      const imports = cssContent.match(/@import\s+["']([^"']+)["']/g) || [];
      
      for (const imp of imports) {
        const pkgName = imp.replace(/@import\s+["']/, '').replace(/["']/, '');
        if (pkgName.startsWith('.') || pkgName.startsWith('http')) continue;
        
        const pkgPath = path.join(ROOT, 'node_modules', pkgName.split('/')[0]);
        if (!fs.existsSync(pkgPath)) {
          fail(
            `CSS imports "${pkgName}" but it is NOT in node_modules`,
            'Run npm install or add to package.json'
          );
        }
      }
    }
    log('success', 'CSS imports resolvable');
  } catch (e) {
    warn('Dry build check failed', e.message);
  }
}

// ============================================================
// CHECK 10: AI Common Mistakes
// ============================================================
function checkAIMistakes() {
  section('AI COMMON MISTAKES');

  const allPkgFiles = [];
  function findPackageJson(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'package.json') {
        allPkgFiles.push(path.join(dir, entry.name));
      } else if (entry.isDirectory() && entry.name !== 'node_modules') {
        findPackageJson(path.join(dir, entry.name));
      }
    }
  }
  findPackageJson(ROOT);

  let tailwindVersions = [];
  for (const pkgFile of allPkgFiles) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['tailwindcss']) {
        tailwindVersions.push({ file: path.relative(ROOT, pkgFile), version: deps['tailwindcss'] });
      }
    } catch (e) {}
  }

  if (tailwindVersions.length > 1) {
    const versions = tailwindVersions.map(v => v.version);
    if (new Set(versions).size > 1) {
      fail(
        'Multiple Tailwind versions detected',
        tailwindVersions.map(v => `  ${v.file}: ${v.version}`).join('\n')
      );
    }
  }

  const reactVersions = [];
  for (const pkgFile of allPkgFiles) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['react']) {
        reactVersions.push({ file: path.relative(ROOT, pkgFile), version: deps['react'] });
      }
    } catch (e) {}
  }
  
  if (reactVersions.length > 1) {
    const versions = reactVersions.map(v => v.version);
    if (new Set(versions).size > 1) {
      warn(
        'Multiple React versions detected',
        reactVersions.map(v => `  ${v.file}: ${v.version}`).join('\n')
      );
    }
  }

  const wrongImports = [
    { wrong: 'from "tailwindcss-animate"', right: 'tw-animate-css or tailwindcss-animate', file: 'CSS' },
  ];

  function scanSource(dir, patterns) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanSource(fullPath, patterns);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.css'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of patterns) {
          if (content.includes(pattern.wrong)) {
            warn(`Possible wrong import in ${path.relative(ROOT, fullPath)}`, pattern.right);
          }
        }
      }
    }
  }
  
  scanSource(path.join(ROOT, 'client/src'), wrongImports);
  scanSource(path.join(ROOT, 'server/src'), wrongImports);
}

// ============================================================
// MAIN EXECUTION
// ============================================================
console.log(`
${C.bold}${C.c
