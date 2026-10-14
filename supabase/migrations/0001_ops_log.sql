-- ops-board: manual done-log. Run once in the monico-agent Supabase SQL editor.
create table if not exists ops_log (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ops_log_created_idx on ops_log (created_at desc);
