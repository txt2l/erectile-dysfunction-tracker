# ChatroomLM Startup Edition — TODO

## Theme & Layout
- [x] Dark industrial theme with brutalist typography (grey/black/orange/tan palette)
- [x] Global dark theme applied to all panels and views consistently
- [x] Main workspace layout with sidebar navigation (icons for all panels)
- [x] Landing page with signup/login

## Chat Panel
- [x] Real-time WebSocket chat rooms
- [x] Message history (loads 50 messages)
- [ ] Load older messages pagination (load-more button)
- [x] Brutalist chat bubbles with avatars
- [x] Markdown rendering via Streamdown
- [x] Emoji/reaction support
- [x] Thread replies
- [x] Message formatting bar (bold, italic, underline, lists, code)
- [x] In-context AI translation button in chat

## Memory Bank / Second Brain (^M)
- [x] Store and organize knowledge notes/references
- [x] Search by text, tags
- [x] Tagging support
- [x] View/edit memory files

## Tasks / To-Do (^T)
- [x] Create/edit/delete tasks
- [x] Priority levels, due dates, status tracking
- [ ] Assignee selection from room members
- [ ] Drag-and-drop reorder persistence
- [x] Status toggle (todo/in_progress/done)

## Calendar (^C)
- [x] Shared calendar with month view
- [x] Event creation with title, time, notes
- [x] Upcoming events list
- [ ] Week and day views
- [ ] Task-calendar linking in UI

## File Explorer (^F)
- [x] Upload files to S3 storage
- [x] Folder creation with color
- [x] File preview (images, video, audio)
- [x] Name search
- [x] Timestamps and metadata on all items
- [ ] Folder rename and archive controls
- [ ] Advanced filters (type, uploader, date, size)

## Mindmap / Canvas (^X)
- [x] Visual brainstorming canvas
- [x] Nodes with text content
- [x] Connections between nodes with delete
- [x] Zoom, pan, drag nodes
- [ ] Image/link node types
- [ ] Freeform drawing tools

## Digital Signatures (^S)
- [x] Signature creation (mouse drawing with canvas)
- [x] Store multiple signatures per user
- [x] Pen color and size options
- [ ] Document signing workflow UI
- [ ] Signed documents list view

## Notebook
- [x] Markdown notes with preview mode
- [x] Graph-paper background aesthetic
- [x] In-context AI translation button in notebook
- [ ] Rich-text toolbar controls

## AI Translation
- [x] Dev jargon ↔ casual language translation
- [x] Japanese ↔ English translation
- [x] Accessible from chat and notebook panels

## Activity Log (^L)
- [x] Chronological log of all actions with date grouping
- [x] Free-text search
- [x] Messages, file uploads, task/calendar creation logged
- [ ] Structured filters by action type and user

## Profile & Auth
- [x] User profile page with display name, bio, timezone
- [x] Login/logout flow
- [x] Initial-based avatar in chat
- [ ] Avatar image upload

## Keyboard Shortcuts
- [x] ^M = Memory Bank
- [x] ^T = Tasks
- [x] ^C = Calendar
- [x] ^F = File Explorer
- [x] ^X = Mindmap/Canvas
- [x] ^S = Signatures
- [x] ^L = Activity Log

## Deployment Guide
- [x] Step-by-step Netlify frontend deployment instructions (layman-friendly)
- [x] Step-by-step Snap Deploy backend deployment instructions (layman-friendly)
- [x] netlify.toml configuration file
- [x] Environment variables reference

## Testing
- [x] Backend API tests (vitest) — 24 tests passing
