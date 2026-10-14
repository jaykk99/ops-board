'use client';

import { useEffect, useState } from 'react';

type Tab = 'now' | 'done' | 'next';

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Page() {
  const [tab, setTab] = useState<Tab>('now');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState('');

  async function load(t: Tab) {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/${t}`, { cache: 'no-store' });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'load failed');
      setData(j);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(tab); }, [tab]);

  async function addTask() {
    const note = newTask.trim();
    if (!note) return;
    await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
    setNewTask('');
    load('next');
  }

  async function complete(noteId: string) {
    await fetch('/api/tasks/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId }) });
    load('next');
  }

  return (
    <div className="wrap">
      <h1>Ops Board</h1>
      <div className="muted">Now, done, next. Tell me what to do from here.</div>

      <div className="tabs">
        <button className={tab === 'now' ? 'on' : ''} onClick={() => setTab('now')}>Now</button>
        <button className={tab === 'done' ? 'on' : ''} onClick={() => setTab('done')}>Done</button>
        <button className={tab === 'next' ? 'on' : ''} onClick={() => setTab('next')}>Next</button>
      </div>

      {error && <div className="err">{error}</div>}

      {tab === 'next' && (
        <div className="addrow">
          <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
            placeholder="Tell me what to do..." onKeyDown={(e) => e.key === 'Enter' && addTask()} />
          <button className="btn" onClick={addTask}>Add</button>
        </div>
      )}

      {loading ? <div className="empty">Loading...</div> : (
        <>
          {tab === 'now' && <NowView d={data} />}
          {tab === 'done' && <DoneView d={data} />}
          {tab === 'next' && <NextView d={data} onComplete={complete} />}
        </>
      )}
    </div>
  );
}

function NowView({ d }: { d: any }) {
  const runs = d?.runs || [];
  const tasks = d?.tasks || [];
  if (!runs.length && !tasks.length) return <div className="empty">Nothing running right now.</div>;
  return (
    <>
      {runs.map((r: any) => (
        <div className="card" key={r.id}>
          <div className="top"><strong>{r.objective.slice(0, 120)}</strong><span className="pill blue">{r.status}</span></div>
          <div className="meta">{r.completed}/{r.dispatched} done{r.failed ? `, ${r.failed} failed` : ''} &middot; {timeAgo(r.updated_at)}</div>
        </div>
      ))}
      {tasks.map((t: any) => (
        <div className="card" key={t.id}>
          <div className="top"><span>{t.worker_label}: {t.objective.slice(0, 100)}</span><span className="pill amber">{t.status}</span></div>
          {t.result_summary && <div className="meta">{t.result_summary.slice(0, 160)}</div>}
        </div>
      ))}
    </>
  );
}

function DoneView({ d }: { d: any }) {
  const runs = d?.runs || [];
  const log = d?.log || [];
  if (!runs.length && !log.length) return <div className="empty">Nothing finished yet.</div>;
  return (
    <>
      {log.map((l: any) => (
        <div className="card" key={l.id}>
          <div className="top"><strong>{l.title}</strong><span className="pill green">done</span></div>
          {l.detail && <div className="meta">{l.detail}</div>}
          <div className="meta">{timeAgo(l.created_at)}</div>
        </div>
      ))}
      {runs.map((r: any) => (
        <div className="card" key={r.id}>
          <div className="top"><strong>{r.objective.slice(0, 120)}</strong><span className="pill green">done</span></div>
          <div className="meta">{r.completed} completed{r.failed ? `, ${r.failed} failed` : ''} &middot; {timeAgo(r.updated_at)}</div>
        </div>
      ))}
    </>
  );
}

function NextView({ d, onComplete }: { d: any; onComplete: (id: string) => void }) {
  const notes = d?.notes || [];
  const queued = d?.queued || [];
  if (!notes.length && !queued.length) return <div className="empty">Queue is empty. Add something above.</div>;
  return (
    <>
      {notes.map((n: any) => (
        <div className="card" key={n.id}>
          <div className="top"><strong>{n.note}</strong></div>
          <div className="meta">{n.author} &middot; {timeAgo(n.created_at)}</div>
          <div style={{ marginTop: 8 }}><button className="btn small ghost" onClick={() => onComplete(n.id)}>Mark done</button></div>
        </div>
      ))}
      {queued.map((r: any) => (
        <div className="card" key={r.id}>
          <div className="top"><strong>{r.objective.slice(0, 120)}</strong><span className="pill">queued</span></div>
          <div className="meta">{timeAgo(r.created_at)}</div>
        </div>
      ))}
    </>
  );
}
