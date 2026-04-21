# ChatroomLM Startup Edition — Developer Handoff

## Project Status

**Current State**: MVP with all 11 panels functional, real-time chat, AI translation, and Railway-optimized deployment.

**Architecture**: Unified Full-Stack (Express + Vite SPA)
- **Frontend**: React 19 + Tailwind 4 (Vite)
- **Backend**: Node.js (Express + tRPC + Socket.IO)
- **Deployment**: Railway (Single Service)

---

## Critical Fixes Applied (April 2026) ✅

### 1. SPA Fallback Routing (Railway 404 Fix)
- **Issue**: Deep routes (e.g., `/login`, `/dashboard`) returned 404 on Railway because Express wasn't configured for SPA fallback.
- **Fix**: Implemented `app.get("*")` in `server/_core/vite.ts` using `res.sendFile` to ensure the frontend `index.html` is served for all non-API routes.
- **Pathing**: Standardized on `path.join(process.cwd(), "dist/client")` for robust path resolution in Railway's container environment.

### 2. Build Pipeline Standardization
- **Vite Config**: Updated `vite.config.ts` to explicitly set `outDir` to `dist/client` relative to the project root.
- **Package Scripts**:
  - `build`: `vite build --outDir dist/client && esbuild server/_core/index.ts --bundle --platform=node --format=esm --packages=external --outfile=dist/server.js`
  - `start`: `node dist/server.js`
- **Result**: A deterministic build that produces a clean `dist/client` for static assets and a `dist/server.js` for the backend.

### 3. Authentication & Cookie Security
- **Issue**: "Missing session cookie" errors due to browser security policies (SameSite/Secure).
- **Fix**: Updated `server/_core/cookies.ts` to dynamically set `SameSite=None` and `Secure=true` when running over HTTPS (Railway production), while falling back to `Lax` for local development.
- **Auth URL**: Replaced hardcoded Manus URLs in `Home.tsx` with the dynamic `getLoginUrl()` helper.

### 4. Manus Artifact Cleanup
- Removed all `__manus__` debug collector scripts and `vite-plugin-manus-runtime` dependencies to ensure a clean, production-ready codebase.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React 19 + Tailwind 4)                            │
│ /client/src/                                                │
│ ├── pages/Home.tsx (landing), Workspace.tsx (main app)      │
│ ├── components/panels/* (11 feature panels)                 │
│ └── index.css (dark industrial theme)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ tRPC + Socket.IO
┌──────────────────────────▼──────────────────────────────────┐
│ Unified Backend (Express + tRPC + Socket.IO)                │
│ /server/                                                    │
│ ├── _core/index.ts (Entry Point)                            │
│ ├── _core/vite.ts (Static Serving & SPA Fallback)           │
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
- **Build Command**: `pnpm run build`
- **Start Command**: `pnpm run start` (executes `node dist/server.js`)

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `server/_core/index.ts` | Main server entry point |
| `server/_core/vite.ts` | **CRITICAL**: Handles static file serving and SPA fallback |
| `vite.config.ts` | **CRITICAL**: Defines frontend build output path (`dist/client`) |
| `server/routers.ts` | All tRPC API procedures |
| `client/src/const.ts` | Frontend environment and Auth URL logic |

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

**Final Checkpoint**: `c7550a4` (SPA Fallback + Static Path Fix)
**Status**: Ready for Production 🚀
