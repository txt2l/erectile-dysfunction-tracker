# ChatroomLM Startup Edition — Developer Handoff

## Project Status

**Current State**: MVP with all 11 panels functional, real-time chat, AI translation, and Docker-optimized deployment.

**Architecture**: Unified Full-Stack (CommonJS Express + Vite SPA)
- **Frontend**: React 19 + Tailwind 4 (Vite)
- **Backend**: Node.js (Express + CommonJS)
- **Deployment**: Railway (Docker-based with Caddy Reverse Proxy)

---

## Critical Fixes Applied (April 2026) ✅

### 1. Docker + Caddy Migration
- **Issue**: Transitioning from Nixpacks to a more robust Docker-based deployment with a reverse proxy.
- **Fix**: Implemented a multi-stage `Dockerfile` and a `Caddyfile` for reverse proxying.
- **Caddy Configuration**: Caddy handles HTTPS (on Railway) and reverse proxies traffic to the Node.js server running on port 3000.
- **Build Process**: Multi-stage Docker build ensures a small final image with only necessary production artifacts.

### 2. Railway + Nixpacks Lock-in (npm Migration)
- **Issue**: Railway switching between builders and Node version mismatches. pnpm was causing Nix derivation failures.
- **Fix**: Migrated from `pnpm` to `npm` for better stability. Generated a fresh `package-lock.json`.
- **Version Control**: Added `.node-version` (22) and `.npmrc` (`engine-strict=true`) to strictly enforce the environment.

### 3. CommonJS Recovery (Railway Crash Fix)
- **Issue**: Persistent crashes due to ESM/Require conflicts.
- **Fix**: Converted the backend to a pure CommonJS architecture.
    *   Removed `"type": "module"` from `package.json`.
    *   Updated `tsconfig.json` to force `CommonJS` output.
    *   Used `tsup` for a reliable CommonJS server bundle (`dist/server.js`).

### 4. Static Path Resolution & SPA Routing
- **Issue**: "Not Found" errors because the server couldn't locate the frontend build or handle deep routes.
- **Fix**: Standardized on `path.join(process.cwd(), "dist/client")` for all static serving and SPA fallback logic.

---

## Railway Deployment Configuration 🚀

### 1. Docker Deployment
Railway will automatically detect the `Dockerfile` in the root directory and use it for deployment, ignoring Nixpacks.
- **Exposed Ports**: 3000 (Node), 80 (Caddy)
- **Start Command**: `caddy run --config /etc/caddy/Caddyfile --adapter caddyfile`

### 2. Required Secrets (Set in Railway Dashboard)
Ensure the following environment variables are set:
- `DATABASE_URL`: Your MySQL connection string
- `JWT_SECRET`: A secure random string (min 32 chars)
- `OAUTH_SERVER_URL`: Your OAuth server base URL
- `VITE_APP_ID`: Your OAuth application ID
- `VITE_OAUTH_PORTAL_URL`: Your OAuth portal URL
- `NODE_ENV`: `production`
- `CI`: `true`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Caddy Reverse Proxy (Port 80)                               │
└───────────────┬─────────────────────────────────────────────┘
                │ Proxy to localhost:3000
┌───────────────▼─────────────────────────────────────────────┐
│ Unified Backend (Express + CommonJS) (Port 3000)            │
│ /server/                                                    │
│ ├── index.ts (Entry Point)                                  │
│ ├── app.ts (Express Setup & SPA Fallback)                   │
│ └── db.ts (Database Helpers)                                │
└───────────────┬─────────────────────────────────────────────┘
                │
        ┌───────┼───────┐
        │       │       │
    MySQL DB  S3 Storage  LLM API
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `Dockerfile` | **CRITICAL**: Multi-stage Docker build configuration |
| `assets/Caddyfile` | **CRITICAL**: Caddy reverse proxy configuration |
| `server/app.ts` | Handles static file serving and SPA fallback |
| `package-lock.json` | Fresh npm lockfile for stable builds |
| `.node-version` | Forces Node 22 |

---

**Final Checkpoint**: `docker-caddy-v1` (Docker + Caddy + Node 22)
**Status**: Ready for Production 🚀
