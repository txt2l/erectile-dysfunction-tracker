# ChatroomLM Startup Edition — Developer Handoff

## Project Status

**Current State**: MVP with all 11 panels functional, real-time chat, AI translation, and Railway-optimized deployment.

**Architecture**: Unified Full-Stack (CommonJS Express + Vite SPA)
- **Frontend**: React 19 + Tailwind 4 (Vite)
- **Backend**: Node.js (Express + CommonJS)
- **Deployment**: Railway (Single Service)

---

## Critical Fixes Applied (April 2026) ✅

### 1. CommonJS Recovery (Railway Crash Fix)
- **Issue**: Persistent crashes due to ESM/Require conflicts ("require is not defined" or "Dynamic require" errors).
- **Fix**: Converted the backend to a pure CommonJS architecture.
    *   Removed `"type": "module"` from `package.json`.
    *   Updated `tsconfig.json` to force `CommonJS` output.
    *   Replaced `esbuild` with `tsup` for a reliable CommonJS server bundle (`dist/server.js`).
    *   Updated server files (`server/app.ts`, `server/index.ts`) to use standard `require()` and `module.exports`.

### 2. Static Path Resolution
- **Issue**: "Not Found" errors because the server couldn't locate the frontend build.
- **Fix**: Standardized on `path.join(process.cwd(), "dist/client")` for all static serving and SPA fallback logic.
- **Verification**: Added `console.log("CLIENT EXISTS:", fs.existsSync(...))` to the server startup to confirm the build is detected at runtime.

### 3. Build Pipeline Alignment
- **Vite Config**: Updated `vite.config.ts` to explicitly set `outDir: "dist/client"`.
- **Package Scripts**:
  - `build`: `vite build && tsup server/index.ts --out-dir dist --format cjs --minify --entry.server server/index.ts`
  - `start`: `node dist/server.js`

---

## Railway Deployment Configuration 🚀

### 1. Build & Start Commands
Railway is configured via `railway.json` to use the following:
- **Builder**: `NIXPACKS`
- **Build Command**: `npm install && npm run build`
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
| `railway.json` | **CRITICAL**: Railway deployment configuration |
| `server/routers.ts` | All tRPC API procedures |

---

## Development Workflow

```bash
# Install
pnpm install

# Dev (Hot Reload)
pnpm dev

# Build (Production)
pnpm build

# Start (Production)
pnpm start
```

---

**Final Checkpoint**: `d0cbe6a` (Railway Deployment Ready)
**Status**: Ready for Production 🚀
