# ChatroomLM — START HERE

## What You're Getting

A **fully functional team collaboration web app** with:
- ✅ All 11 feature panels built (Chat, Memory Bank, Tasks, Calendar, Files, Mindmap, Signatures, Notebook, Activity Log, Profile)
- ✅ Real-time WebSocket messaging
- ✅ AI-powered translation (Dev↔Casual, JP↔EN)
- ✅ Dark industrial brutalist UI theme
- ✅ MySQL database schema
- ✅ Backend tRPC API
- ✅ S3 file storage integration
- ✅ Deployment guide for Netlify + Snap Deploy
- ✅ 24 passing vitest tests

**Status**: MVP ready for deployment. Some polish features are optional (see HANDOFF.md).

---

## Quick Start (5 minutes)

### 1. Install & Run

```bash
# Extract the ZIP file
unzip chatroomlm-complete.zip
cd chatroomlm

# Install dependencies
pnpm install

# Start dev server (frontend + backend)
pnpm dev
```

Visit `http://localhost:3000` in your browser.

### 2. Understand the Structure

```
chatroomlm/
├── client/                    # React frontend
│   └── src/
│       ├── pages/            # Landing page, Workspace
│       ├── components/panels/ # 11 feature panels
│       └── index.css         # Dark industrial theme
├── server/                    # Express + tRPC backend
│   ├── routers.ts            # All API procedures
│   ├── db.ts                 # Database helpers
│   └── _core/                # Server setup, Socket.IO, LLM
├── drizzle/                   # Database schema & migrations
├── DEPLOYMENT_GUIDE.md        # Step-by-step deployment
├── HANDOFF.md                 # Detailed developer guide
└── todo.md                    # Feature checklist
```

### 3. Deploy

Follow `DEPLOYMENT_GUIDE.md` for step-by-step instructions:
1. Push code to GitHub
2. Set up database (PlanetScale/TiDB)
3. Deploy backend to Snap Deploy
4. Deploy frontend to Netlify
5. Connect them via redirects

---

## What Needs Finishing (Optional)

See `HANDOFF.md` for a full list. High-priority items:

- Task assignees (select from room members)
- Task drag-and-drop reordering
- Calendar week/day views
- File rename/archive controls
- Avatar upload in profile
- Document signing workflow

---

## Key Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm test             # Run vitest tests
pnpm format           # Format code with Prettier
pnpm check            # TypeScript check
```

---

## Database Setup (Local Dev)

For local development, you can use SQLite or a local MySQL:

1. Update `DATABASE_URL` in `.env.local` (create this file)
2. Run migrations: `pnpm drizzle-kit migrate`
3. Start dev server: `pnpm dev`

For production, use PlanetScale or TiDB Cloud (see DEPLOYMENT_GUIDE.md).

---

## Environment Variables

Create `.env.local` in the root for local development:

```
DATABASE_URL=mysql://user:pass@localhost/chatroomlm
JWT_SECRET=your-random-secret-here
BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
BUILT_IN_FORGE_API_KEY=sk-your-key-here
```

For production, set these in Snap Deploy (backend) and Netlify (frontend) dashboards.

---

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/routers.test.ts

# Watch mode
pnpm test --watch
```

Tests cover auth, profile, rooms, messages, tasks, calendar, memory, notebooks, signatures, and AI translation.

---

## Troubleshooting

**"Cannot find module" error?**
- Run `pnpm install` again
- Restart dev server

**WebSocket not connecting?**
- Check that backend is running
- Look at browser Network tab for `/api/socket.io` connection
- Verify Socket.IO is initialized in `server/_core/index.ts`

**Database connection fails?**
- Verify `DATABASE_URL` is correct
- Ensure database is running and accessible
- Check SSL settings in connection string

**AI translation not working?**
- Verify `BUILT_IN_FORGE_API_KEY` is valid
- Check that API endpoint is correct
- Look at server logs for errors

---

## Next Steps

1. **Read** `HANDOFF.md` for detailed architecture and feature roadmap
2. **Review** `DEPLOYMENT_GUIDE.md` before deploying
3. **Implement** optional polish features from the checklist
4. **Test** thoroughly (run `pnpm test` + manual testing)
5. **Deploy** following the deployment guide

---

## File Locations

| What | Where |
|------|-------|
| Feature panels | `client/src/components/panels/*.tsx` |
| Backend API | `server/routers.ts` |
| Database schema | `drizzle/schema.ts` |
| Dark theme | `client/src/index.css` |
| Tests | `server/*.test.ts` |
| Deployment config | `netlify.toml` |

---

## Questions?

- **Architecture**: See `HANDOFF.md` → "Architecture Overview"
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Features**: See `todo.md` for checklist
- **Code patterns**: Look at existing panels in `client/src/components/panels/`

---

**Ready to build? Let's go! 🚀**
