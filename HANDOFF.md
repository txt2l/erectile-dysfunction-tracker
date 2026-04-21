# ChatroomLM Startup Edition — Developer Handoff

## Project Status

**Current State**: MVP with all 11 panels functional, real-time chat, AI translation, and Railway-optimized deployment.

**Architecture**: Unified Full-Stack (CommonJS Express + Vite SPA)
- **Frontend**: React 19 + Tailwind 4 (Vite)
- **Backend**: Node.js (Express + CommonJS)
- **Deployment**: Railway (Single Service via Nixpacks)

---

## Critical Fixes Applied (April 2026) ✅

### 1. Railway + Nixpacks Lock-in
- **Issue**: Railway switching between builders and Node version mismatches.
- **Fix**: Created `railway.toml` and `nixpacks.toml` to force the **NIXPACKS** builder and **Node 22**.
- **pnpm Enforcement**: Configured Nixpacks to use `pnpm` exclusively for all phases (setup, install, build).
- **Version Control**: Added `.node-version` (22) and `.npmrc` (`engine-strict=true`) to strictly enforce the environment.

### 2. CommonJS Recovery (Railway Crash Fix)
- **Issue**: Persistent crashes due to ESM/Require conflicts.
- **Fix**: Converted the backend to a pure CommonJS architecture.
    *   Removed `"type": "module"` from `package.json`.
    *   Updated `tsconfig.json` to force `CommonJS` output.
    *   Used `tsup` for a reliable CommonJS server bundle (`dist/server.js`).

### 3. Static Path Resolution
- **Issue**: "Not Found" errors because the server couldn't locate the frontend build.
- **Fix**: Standardized on `path.join(process.cwd(), "dist/client")` for all static serving and SPA fallback logic.
- **Verification**: Added `console.log("CLIENT EXISTS:", fs.existsSync(...))` to the server startup to confirm the build is detected at runtime.

---

## Railway Deployment Configuration 🚀

### 1. Build & Start Commands
Railway is configured via `railway.toml` and `nixpacks.toml`:
- **Builder**: `NIXPACKS`
- **Node Version**: `22`
- **Package Manager**: `pnpm`
- **Build Command**: `pnpm build`
- **Start Command**: `node dist/server.js`

### 2. Required Secrets (Set in Railway Dashboard)
Ensure the following environment variables are set:
- `DATABASE_URL`: Your MySQL connection string
- `JWT_SECRET`: A secure random string
- `OAUTH_SERVER_URL`: `https://manus.im/auth`
- `VITE_APP_ID`: `erectile-dysfunction-tracker`
- `VITE_OAUTH_PORTAL_URL`: `https://manus.im/auth`
- `NODE_ENV`: `production`
- `CI`: `true`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React 19 + Tailwind 4)                            │
│ /src/                                                       │
│ ├── App.tsx (Main App)                                      │
│ └── main.tsx (Entry Point)                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP + WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│ Unified Backend (Express + CommonJS)                        │
│ /server/                                                    │
│ ├── index.ts (Entry Point)                                  │
│ ├── app.ts (Express Setup & SPA Fallback)                   │
│ ├── routers.ts (API Logic)                                  │
│ └── db.ts (Database Helpers)                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    MySQL DB           S3 Storage        LLM API
  (Railway/TiDB)     (AWS S3)         (OpenAI-compatible)
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `server/index.ts` | Main server entry point |
| `server/app.ts` | **CRITICAL**: Handles static file serving and SPA fallback |
| `vite.config.ts` | **CRITICAL**: Defines frontend build output path (`dist/client`) |
| `railway.toml` | **CRITICAL**: Railway deployment configuration |
| `nixpacks.toml` | **CRITICAL**: Nixpacks environment and build phases |
| `.node-version` | Forces Node 22 |

---

**Final Checkpoint**: `c0b35f1` (Nixpacks + Node 22 Locked)
**Status**: Ready for Production 🚀
