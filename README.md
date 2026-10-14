# Ops Board

Jay's mission control. Three views: what agents are doing now, what is done, what is next. Jay assigns tasks from the Next tab; they land in Error Inbox shared notes for agents to pick up.

## Views

- **Now**: live `swarm_runs` (queued/running/dispatched) plus in-flight `swarm_tasks`
- **Done**: finished runs plus the manual `ops_log`
- **Next**: task notes from `shared_notes` (topic=task) plus queued runs

## MCP

Point an MCP client at `/api/mcp`. Tools: `ops_list_now`, `ops_list_done`, `ops_list_next`, `ops_add_task`, `ops_complete_task`. No auth in v1.

## Setup

1. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` / `SUPABASE_KEY` (monico-agent project, service role).
2. Run `supabase/migrations/0001_ops_log.sql` once in the Supabase SQL editor.
3. `npm install && npm run dev`

Deploy on Vercel with the two env vars set.
