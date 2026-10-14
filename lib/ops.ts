import { supabase } from './supabase';

export type RunRow = {
  id: string;
  objective: string;
  status: string;
  dispatched: number;
  completed: number;
  failed: number;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  run_id: string;
  worker_label: string;
  objective: string;
  status: string;
  result_summary: string | null;
  updated_at: string;
};

export type NoteRow = {
  id: string;
  author: string;
  topic: string;
  note: string;
  created_at: string;
};

export type OpsLogRow = {
  id: string;
  title: string;
  detail: string | null;
  created_at: string;
};

const ACTIVE = ['queued', 'running', 'dispatched'];

/** Currently active work: live swarm runs plus their in-flight tasks. */
export async function getNow() {
  const { data: runs } = await supabase()
    .from('swarm_runs')
    .select('id,objective,status,dispatched,completed,failed,created_at,updated_at')
    .in('status', ACTIVE)
    .order('updated_at', { ascending: false })
    .limit(20);

  const runIds = (runs || []).map((r) => r.id);
  let tasks: TaskRow[] = [];
  if (runIds.length) {
    const { data } = await supabase()
      .from('swarm_tasks')
      .select('id,run_id,worker_label,objective,status,result_summary,updated_at')
      .in('run_id', runIds)
      .neq('status', 'done')
      .order('updated_at', { ascending: false })
      .limit(50);
    tasks = (data || []) as TaskRow[];
  }
  return { runs: (runs || []) as RunRow[], tasks };
}

/** Finished work: completed runs plus manual ops log entries. */
export async function getDone() {
  const { data: runs } = await supabase()
    .from('swarm_runs')
    .select('id,objective,status,dispatched,completed,failed,created_at,updated_at')
    .eq('status', 'done')
    .order('updated_at', { ascending: false })
    .limit(20);

  let log: OpsLogRow[] = [];
  const { data: logData, error } = await supabase()
    .from('ops_log')
    .select('id,title,detail,created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  if (!error) log = (logData || []) as OpsLogRow[];

  return { runs: (runs || []) as RunRow[], log };
}

/** Up next: task notes Jay wrote plus queued runs not yet started. */
export async function getNext() {
  const { data: notes } = await supabase()
    .from('shared_notes')
    .select('id,author,topic,note,created_at')
    .eq('topic', 'task')
    .order('created_at', { ascending: false })
    .limit(30);

  const { data: queued } = await supabase()
    .from('swarm_runs')
    .select('id,objective,status,dispatched,completed,failed,created_at,updated_at')
    .eq('status', 'queued')
    .order('created_at', { ascending: false })
    .limit(10);

  return { notes: (notes || []) as NoteRow[], queued: (queued || []) as RunRow[] };
}

/** Jay assigns a task from the board. Lands in shared_notes for agents to pick up. */
export async function addTask(note: string, author = 'jay') {
  const { data, error } = await supabase()
    .from('shared_notes')
    .insert({ author, topic: 'task', note })
    .select('id,author,topic,note,created_at')
    .single();
  if (error) throw new Error(error.message);
  return data as NoteRow;
}

/** Mark a task note done by removing it from the queue and logging it. */
export async function completeTask(noteId: string) {
  const { data: note } = await supabase()
    .from('shared_notes')
    .select('note')
    .eq('id', noteId)
    .single();
  if (note) {
    await supabase().from('ops_log').insert({ title: note.note.slice(0, 200), detail: 'completed from board' });
  }
  const { error } = await supabase().from('shared_notes').delete().eq('id', noteId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** Manual log entry for finished work. */
export async function logDone(title: string, detail = '') {
  const { data, error } = await supabase()
    .from('ops_log')
    .insert({ title, detail })
    .select('id,title,detail,created_at')
    .single();
  if (error) throw new Error(error.message);
  return data as OpsLogRow;
}
