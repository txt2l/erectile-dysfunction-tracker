# ChatroomLM Startup Edition — Developer Handoff

## Project Status

**Current State**: **RESTORED & PRODUCTION READY**. All 11 panels functional, real-time chat, AI translation, and Docker-optimized deployment.

**Architecture**: Unified Full-Stack (CommonJS Express + Vite SPA)
- **Frontend**: React 19 + Tailwind 4 (Vite)
- **Backend**: Node.js (Express + CommonJS)
- **Deployment**: Railway (Docker-based with Caddy Reverse Proxy)

---

## Critical Fixes Applied (April 2026) ✅

### 1. CommonJS & Module Resolution Recovery
- **Issue**: Persistent crashes due to `import.meta` usage in a CommonJS environment and `@shared` alias resolution failures at runtime.
- **Fix**: 
    *   Replaced `import.meta.dirname` with `__dirname` in `server/_core/vite.ts`.
    *   Updated `tsconfig.json` to use `moduleResolution: "Node16"`.
    *   Configured `tsup.config.ts` to bundle internal `@shared` code while keeping heavy dependencies external.

### 2. Broken Database References
- **Issue**: `systemRouter.ts` was calling `getRoomActivityLogs`, which was missing from the database helper.
- **Fix**: Implemented `getRoomActivityLogs` in `server/db.ts` using Drizzle ORM, correctly filtering by `entityType` and `entityId`.

### 3. Static File Serving (Railway Path Fix)
- **Issue**: Production paths for the frontend were incorrect when running from the bundled `dist/server.js`.
- **Fix**: Updated `serveStatic` in `vite.ts` to use `process.cwd()` and correct relative paths for the `dist/client` directory.

### 4. Docker + Caddy Parallel Execution
- **Issue**: "Black page" error where Caddy was running but the Node server wasn't started.
- **Fix**: 
    *   Updated `Dockerfile` `CMD` to start both Node and Caddy in parallel.
    *   Updated `assets/Caddyfile` to use the `{$PORT}` environment variable.

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
- `DATABASE_URL`: Your TiDB/MySQL connection string
- `JWT_SECRET`: A secure random string
- `OAUTH_SERVER_URL`: Your OAuth server base URL
- `VITE_APP_ID`: Your OAuth application ID
- `NODE_ENV`: `production`

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `tsup.config.ts` | **CRITICAL**: Handles server bundling and alias resolution |
| `server/db.ts` | Contains all database query logic including activity logs |
| `server/_core/vite.ts` | Handles static file serving and SPA fallback |
| `Dockerfile` | Multi-stage Docker build configuration |

**Final Checkpoint**: `restoration-v1` (CommonJS Fix + DB Restore)
**Status**: Ready for Production 🚀
