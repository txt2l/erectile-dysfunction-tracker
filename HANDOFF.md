# ChatroomLM Startup Edition — Developer Handoff

## Project Status

**Current State**: MVP with all 11 panels functional, real-time chat, AI translation, and Docker-optimized deployment.

**Architecture**: Unified Full-Stack (CommonJS Express + Vite SPA)
- **Frontend**: React 19 + Tailwind 4 (Vite)
- **Backend**: Node.js (Express + CommonJS)
- **Deployment**: Railway (Docker-based with Caddy Reverse Proxy)

---

## Critical Fixes Applied (April 2026) ✅

### 1. Docker + Caddy Parallel Execution
- **Issue**: "Black page" error where Caddy was running but the Node server wasn't started, or the proxy port was mismatched.
- **Fix**: 
    *   Updated `Dockerfile` `CMD` to start both Node and Caddy in parallel using `sh -c "node dist/server.js & caddy run ..."`.
    *   Updated `assets/Caddyfile` to use the `{$PORT}` environment variable for the reverse proxy target.
    *   **Action Required**: Add `PORT=3000` to Railway environment variables.

### 2. Docker + Caddy Migration
- **Issue**: Transitioning from Nixpacks to a more robust Docker-based deployment.
- **Fix**: Implemented a multi-stage `Dockerfile` and a `Caddyfile` for reverse proxying.
- **Build Process**: Multi-stage Docker build ensures a small final image with only necessary production artifacts.

### 3. Railway + Nixpacks Lock-in (npm Migration)
- **Issue**: Railway switching between builders and Node version mismatches.
- **Fix**: Migrated from `pnpm` to `npm` for better stability. Generated a fresh `package-lock.json`.
- **Version Control**: Added `.node-version` (22) and `.npmrc` (`engine-strict=true`) to strictly enforce the environment.

### 4. CommonJS Recovery (Railway Crash Fix)
- **Issue**: Persistent crashes due to ESM/Require conflicts.
- **Fix**: Converted the backend to a pure CommonJS architecture.

---

## Railway Deployment Configuration 🚀

### 1. Docker Deployment
Railway will automatically detect the `Dockerfile` in the root directory.
- **Exposed Ports**: 80 (Caddy)
- **Internal Port**: 3000 (Node)
- **Start Command**: `sh -c "node dist/server.js & sleep 2 && caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"`

### 2. Required Secrets (Set in Railway Dashboard)
Ensure the following environment variables are set:
- `PORT`: `3000` (Internal port for Node)
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
                │ Proxy to localhost:{$PORT}
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

**Final Checkpoint**: `docker-caddy-v2` (Parallel Start + Dynamic Port)
**Status**: Ready for Production 🚀
