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

## Deployment on Railway

### 1. Environment Variables
Ensure the following are set in your Railway project:
- `NODE_ENV`: `production`
- `PORT`: `3000` (Railway will override this)
- `DATABASE_URL`: Your MySQL connection string
- `JWT_SECRET`: A secure random string
- `VITE_OAUTH_PORTAL_URL`: `https://manus.im/auth`
- `VITE_APP_ID`: `erectile-dysfunction-tracker`

### 2. Build & Start Commands
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/server.js`

---

**Final Checkpoint**: `d3fbab8` (CommonJS Recovery Fix)
**Status**: Ready for Production 🚀
