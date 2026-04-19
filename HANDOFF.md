# ChatroomLM Startup Edition — Developer Handoff

## Project Status

**Current State**: MVP with all 11 panels functional, real-time chat, AI translation, and deployment guide.

**Tests**: 24 vitest tests passing (backend API validation).

**Checkpoint Version**: `eb44eb95`

---

## What's Complete ✅

### Core Infrastructure
- Dark industrial UI theme (brutalist, Space Grotesk + JetBrains Mono, orange/tan/grey palette)
- MySQL database schema with all tables
- tRPC backend API with all procedures
- WebSocket (Socket.IO) real-time messaging
- Manus OAuth authentication
- S3 file storage integration
- AI translation (Dev↔Casual, JP↔EN) via LLM

### All 11 Panels
1. **Chat** — Real-time messaging, markdown, emoji reactions, thread replies, pagination (load older)
2. **Memory Bank** — Knowledge storage with search and tagging
3. **Tasks** — Create/edit/delete with priority, due dates, status
4. **Calendar** — Month view with event creation
5. **Files** — S3 upload, folder navigation, file preview
6. **Mindmap** — Nodes, connections, zoom/pan, drag
7. **Signatures** — Canvas drawing, pen color/size, save to S3
8. **Notebook** — Markdown editing with preview
9. **Activity Log** — Timestamped action log with search
10. **Profile** — User settings, timezone, keyboard shortcuts
11. **Workspace** — Sidebar nav, panel switching, keyboard shortcuts (Ctrl+M/T/C/F/X/S/L)

### Deployment
- Comprehensive layman-friendly deployment guide (DEPLOYMENT_GUIDE.md)
- netlify.toml configuration for frontend + backend routing
- Step-by-step instructions for Netlify, Snap Deploy, PlanetScale/TiDB, AWS S3

---

## What Needs Finishing 🚧

These are enhancements that would improve the MVP but are not blocking deployment:

### High Priority (Nice to Have)

| Feature | Location | Work Required |
|---------|----------|----------------|
| **Chat pagination UI** | `client/src/components/panels/ChatPanel.tsx` | ✅ DONE — "Load older messages" button now works |
| **Task assignees** | `client/src/components/panels/TasksPanel.tsx` | Add dropdown to select room members; display assignee badges |
| **Task drag-and-drop** | `TasksPanel.tsx` | Implement react-beautiful-dnd or similar; persist sortOrder to DB |
| **Calendar week/day views** | `client/src/components/panels/CalendarPanel.tsx` | Add view toggle buttons; implement week/day rendering |
| **File rename/archive** | `client/src/components/panels/FilesPanel.tsx` | Add rename dialog; add archive toggle on files |
| **File advanced filters** | `FilesPanel.tsx` | Add filter UI for type/uploader/date/size |
| **Mindmap image/link nodes** | `client/src/components/panels/MindmapPanel.tsx` | Extend node types; add image upload; add link input |
| **Mindmap drawing tools** | `MindmapPanel.tsx` | Add freeform drawing canvas layer |
| **Document signing workflow** | `client/src/components/panels/SignaturesPanel.tsx` | Add "sign document" flow; display signed documents list |
| **Avatar upload** | `client/src/components/panels/ProfilePanel.tsx` | Add image upload field; store in S3 |
| **Activity log filters** | `client/src/components/panels/ActivityLogPanel.tsx` | Add structured filters for action type and user (not just free-text) |

### Lower Priority (Polish)

- Rich-text editor for Notebook (currently Markdown textarea)
- Collaborative real-time editing (Notebook, Memory Bank)
- Notification system (desktop/email)
- User presence indicators in chat
- Typing indicators
- Message search
- Memory Bank full-text search with Elasticsearch
- Calendar recurring events
- Task dependencies/subtasks
- File versioning
- Mindmap export (PNG/SVG)
- Signature verification
- Activity log export

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React 19 + Tailwind 4)                            │
│ /client/src/                                                │
│ ├── pages/Home.tsx (landing), Workspace.tsx (main app)      │
│ ├── components/panels/* (11 feature panels)                 │
│ ├── lib/trpc.ts (tRPC client)                               │
│ └── index.css (dark industrial theme)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP + WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│ Backend (Express 4 + tRPC 11 + Socket.IO)                   │
│ /server/                                                    │
│ ├── routers.ts (all tRPC procedures)                        │
│ ├── db.ts (query helpers)                                   │
│ ├── storage.ts (S3 helpers)                                 │
│ ├── _core/index.ts (server entry, Socket.IO setup)          │
│ └── _core/llm.ts (AI translation)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    MySQL DB           S3 Storage        LLM API
  (PlanetScale/     (AWS S3)         (OpenAI-compatible)
   TiDB Cloud)
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `drizzle/schema.ts` | Database schema (all tables) |
| `server/routers.ts` | All tRPC procedures (auth, chat, tasks, etc.) |
| `server/db.ts` | Query helpers (reusable across procedures) |
| `client/src/App.tsx` | Routes and layout wrapper |
| `client/src/pages/Workspace.tsx` | Main app with sidebar and panel switching |
| `client/src/components/panels/*.tsx` | Each of the 11 feature panels |
| `client/src/index.css` | Dark industrial theme (OKLCH colors) |
| `netlify.toml` | Netlify build config + API redirects |
| `DEPLOYMENT_GUIDE.md` | Step-by-step deployment for non-technical users |
| `todo.md` | Feature checklist (updated) |

---

## Development Workflow

### Running Locally

```bash
# Install dependencies
pnpm install

# Start dev server (both frontend + backend)
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Database Changes

1. Edit `drizzle/schema.ts`
2. Run `pnpm drizzle-kit generate` to create migration SQL
3. Apply migration via your database UI (PlanetScale/TiDB console)
4. Restart dev server

### Adding a New Feature

1. Add table(s) to `drizzle/schema.ts` if needed
2. Add query helpers to `server/db.ts`
3. Add tRPC procedures to `server/routers.ts`
4. Create panel component in `client/src/components/panels/`
5. Add route to `client/src/App.tsx`
6. Add to sidebar nav in `client/src/pages/Workspace.tsx`
7. Write tests in `server/routers.test.ts`
8. Run `pnpm test` to verify

### Styling

- Use Tailwind classes + CSS variables (defined in `client/src/index.css`)
- Dark theme colors: `bg-background`, `text-foreground`, `border-border`, etc.
- Primary accent: `text-primary` (orange)
- All components should follow the brutalist aesthetic (sharp corners, minimal shadows, high contrast)

---

## Environment Variables (Backend)

Required for deployment:

```
DATABASE_URL=mysql://user:pass@host/db?ssl=...
JWT_SECRET=random-32-char-string
NODE_ENV=production
PORT=3000
BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
BUILT_IN_FORGE_API_KEY=sk-...
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
```

Frontend (Netlify):

```
VITE_API_URL=https://your-backend.snapdeploy.app
VITE_APP_TITLE=ChatroomLM
```

---

## Testing

### Run Tests
```bash
pnpm test
```

### Test Coverage
- Auth (login, logout, me query)
- Profile (get, update)
- Rooms (list, create)
- Messages (list, create, react)
- Tasks (create, update, delete)
- Calendar (create, list)
- Memory (create, list, search)
- Notebooks (create, update)
- Signatures (list, create, delete)
- AI Translation (validate modes)

### Adding Tests
Create files named `*.test.ts` in `/server/`. Use vitest syntax (see `server/routers.test.ts` for examples).

---

## Deployment Checklist

Before going live:

- [ ] Database created (PlanetScale/TiDB)
- [ ] S3 bucket created with public read policy
- [ ] Backend deployed to Snap Deploy with all env vars
- [ ] Frontend deployed to Netlify with redirects
- [ ] Test login flow end-to-end
- [ ] Test chat messaging (real-time)
- [ ] Test file upload to S3
- [ ] Test AI translation
- [ ] Test all panel navigation
- [ ] Check browser console for errors
- [ ] Test on mobile (responsive design)

See `DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.

---

## Common Issues & Solutions

### "Cannot find module" errors
- Run `pnpm install` to ensure all dependencies are installed
- Restart dev server after installing new packages

### WebSocket not connecting
- Check that backend is running and Socket.IO is initialized in `server/_core/index.ts`
- Verify redirects in `netlify.toml` include `/api/socket.io/*`
- Check browser Network tab for WebSocket connection

### Database connection fails
- Verify `DATABASE_URL` is correct and includes SSL settings
- Check that database is running (PlanetScale/TiDB dashboard)
- Ensure IP whitelist allows your server (if applicable)

### S3 uploads not working
- Verify S3 bucket exists and has public read policy
- Check that `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are correct
- Ensure IAM user has `AmazonS3FullAccess` permission

### AI translation returns empty
- Verify `BUILT_IN_FORGE_API_KEY` is valid
- Check that API endpoint is correct (usually `https://api.openai.com/v1`)
- Look at server logs for API errors

---

## Next Steps for Next Developer

1. **Review** this handoff + `DEPLOYMENT_GUIDE.md`
2. **Implement** the high-priority features from the table above
3. **Test** each feature thoroughly before committing
4. **Deploy** following the deployment guide
5. **Monitor** logs and user feedback post-launch

---

## Contact / Questions

If you have questions about the codebase:
- Check `README.md` in the template (auto-generated)
- Review the tRPC procedures in `server/routers.ts` for API signatures
- Look at existing panel components for UI patterns
- Check `drizzle/schema.ts` for database structure

---

**Good luck! 🚀**
