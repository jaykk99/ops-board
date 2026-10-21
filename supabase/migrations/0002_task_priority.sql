-- ops-board: task priority on shared_notes. Run once in the monico-agent Supabase SQL editor.
alter table shared_notes add column if not exists priority smallint not null default 2;
alter table shared_notes add constraint shared_notes_priority_check check (priority between 1 and 3);
create index if not exists shared_notes_task_priority_idx
  on shared_notes (topic, priority desc, created_at desc)
  where topic = 'task';
