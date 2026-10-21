# Ops Board

Jay's mission control. Three views: what agents are doing now, what is done, what is next. Jay assigns tasks from the Next tab; they land in Error Inbox shared notes for agents to pick up.

## Views

- **Now**: live `swarm_runs` (queued/running/dispatched) with progress bars plus in-flight `swarm_tasks`. Auto-refreshes every 10s (toggleable, pauses when the tab is hidden).
- **Done**: finished runs plus the manual `ops_log`. "Log finished work" button adds entries straight to the log.
- **Next**: task notes from `shared_notes` (topic=task), sorted highest-priority first, plus queued runs. Notes support priorities (low/normal/high), inline editing, and delete.

## API

- `GET /api/now`, `/api/done`, `/api/next` — the three views as JSON.
- `POST /api/notes` `{note, author?, priority?}` — new task note.
- `PATCH /api/notes` `{id, note?, priority?}` — edit a task note.
- `DELETE /api/notes` `{id}` — drop a task note without logging.
- `POST /api/notes?log=1` `{title, detail?}` — add a done-log entry.
- `POST /api/tasks/complete` `{noteId}` — move a task note to the done log.

## MCP

Point an MCP client at `/api/mcp`. No auth in v1. `GET /api/mcp` returns server info and the tool list.

Tools: `ops_list_now`, `ops_list_done`, `ops_list_next`, `ops_add_task` (takes `priority`), `ops_complete_task`, `ops_log_done`, `ops_summary`.

## Setup

1. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` / `SUPABASE_KEY` (monico-agent project, service role).
2. Run the migrations in `supabase/migrations/` once in the Supabase SQL editor, in order:
   - `0001_ops_log.sql` — the manual done log
   - `0002_task_priority.sql` — task priorities on `shared_notes`
3. `npm install && npm run dev`

## Dev

- `npm run typecheck` — strict TypeScript check
- `npm test` — compile `lib/` + `tests/` and run the node:test suite
- `npm run build` — production Next.js build

Deploy on Vercel with the two env vars set.
