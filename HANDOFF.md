# ChatroomLM Startup Edition — Developer Handoff

## Project Status

**Current State**: MVP with all 11 panels functional, real-time chat, AI translation, and Railway-optimized deployment.

**Architecture**: Unified Full-Stack (Express + Vite SPA)
- **Frontend**: React 19 + Tailwind 4 (Vite)
- **Backend**: Node.js (Express + tRPC + Socket.IO)
- **Deployment**: Railway (Single Service)

---

## Critical Fixes Applied (April 2026) ✅

### 1. FULL AUTO Project Rewrite
- **Restructured Project Root**: Moved `index.html` and the `src/` directory to the project root to align with standard Vite expectations.
- **Forced Vite Build Path**: Updated `vite.config.ts` to ensure `outDir: "dist/client"` is strictly enforced.
- **Simplified Server Architecture**:
    *   Created `server/app.ts` with the exact SPA fallback and static serving logic.
    *   Created `server/index.ts` as the clean entry point listening on port 3000.

### 2. ESM / Require Conflict Fix
- **Issue**: Server crashed with "require is not defined in ES module scope" because the project uses `"type": "module"` but the build was outputting CommonJS.
- **Fix**: Added `--format=esm` to the `esbuild` command in `package.json` to ensure the server bundle is a valid ES Module.

### 3. SPA Fallback Routing (Railway 404 Fix)
- **Issue**: Deep routes (e.g., `/login`, `/dashboard`) returned 404 on Railway because Express wasn't configured for SPA fallback.
- **Fix**: Implemented `app.get("*")` in `server/app.ts` using `res.sendFile` to ensure the frontend `index.html` is served for all non-API routes.
- **Verification**: Added `console.log("CLIENT EXISTS:", fs.existsSync(...))` to the server startup to confirm the build is detected at runtime.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React 19 + Tailwind 4)                            │
│ /src/                                                       │
│ ├── App.tsx (Main App)                                      │
│ └── main.tsx (Entry Point)                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ tRPC + Socket.IO
┌──────────────────────────▼──────────────────────────────────┐
│ Unified Backend (Express + tRPC + Socket.IO)                │
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
- `PORT`: `3000` (Railway will override this, which is handled by the code)
- `DATABASE_URL`: Your MySQL connection string
- `JWT_SECRET`: A secure random string
- `VITE_OAUTH_PORTAL_URL`: `https://manus.im/auth`
- `VITE_APP_ID`: `erectile-dysfunction-tracker`
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: For file storage

### 2. Build & Start Commands
Railway should automatically detect these from `package.json`:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/server.js`

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `server/index.ts` | Main server entry point |
| `server/app.ts` | **CRITICAL**: Handles static file serving and SPA fallback |
| `vite.config.ts` | **CRITICAL**: Defines frontend build output path (`dist/client`) |
| `server/routers.ts` | All tRPC API procedures |
| `src/App.tsx` | Main React application component |

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

**Final Checkpoint**: `fa27a57` (FULL AUTO Rewrite + ESM Fix)
**Status**: Ready for Production 🚀
