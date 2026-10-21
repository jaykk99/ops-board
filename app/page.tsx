'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { timeAgo, type Priority } from '@/lib/format';
import type { RunRow, TaskRow, NoteRow, OpsLogRow } from '@/lib/ops';
import NowView from '@/components/NowView';
import DoneView from '@/components/DoneView';
import NextView from '@/components/NextView';
import AddTaskBar from '@/components/AddTaskBar';

type Tab = 'now' | 'done' | 'next';

type TabData = {
  now: { runs: RunRow[]; tasks: TaskRow[] };
  done: { runs: RunRow[]; log: OpsLogRow[] };
  next: { notes: NoteRow[]; queued: RunRow[] };
};

const EMPTY: TabData = {
  now: { runs: [], tasks: [] },
  done: { runs: [], log: [] },
  next: { notes: [], queued: [] },
};

/** The Now tab polls so Jay sees agents start/stop without refreshing. */
const NOW_POLL_MS = 10000;

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { cache: 'no-store', ...init });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error(j.error || `request failed (${r.status})`);
  return j;
}

export default function Page() {
  const [tab, setTab] = useState<Tab>('now');
  const [data, setData] = useState<TabData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async (t: Tab, quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const j = await api(`/api/${t}`);
      setData((d) => ({ ...d, [t]: j }));
      setUpdatedAt(Date.now());
    } catch (e: any) {
      setError(e.message);
    }
    if (!quiet) setLoading(false);
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  useEffect(() => {
    if (tab !== 'now' || !autoRefresh) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load('now', true);
    }, NOW_POLL_MS);
    return () => clearInterval(id);
  }, [tab, autoRefresh, load]);

  // Keep polling honest when the tab regains focus.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && tab === 'now' && autoRefresh) load('now', true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [tab, autoRefresh, load]);

  async function addTask(note: string, priority: Priority) {
    await api('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, priority }),
    });
    await load('next');
  }

  async function complete(id: string) {
    await api('/api/tasks/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: id }),
    });
    await load('next', true);
  }

  async function remove(id: string) {
    await api('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load('next', true);
  }

  async function setPriority(id: string, priority: Priority) {
    await api('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, priority }),
    });
    await load('next', true);
  }

  async function rename(id: string, text: string) {
    await api('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, note: text }),
    });
    await load('next', true);
  }

  async function logDone(title: string, detail: string) {
    await api('/api/notes?log=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, detail }),
    });
    await load('done', true);
  }

  const tabs: Tab[] = ['now', 'done', 'next'];

  return (
    <div className="wrap">
      <div className="headrow">
        <h1>Ops Board</h1>
        <button className="btn small ghost" onClick={() => load(tab)} title="Refresh">
          Refresh
        </button>
      </div>
      <div className="muted">
        Now, done, next. Tell me what to do from here.
        {updatedAt !== null && <> &middot; updated {timeAgo(new Date(updatedAt).toISOString())}</>}
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'now' && (
        <label className="checkrow">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          <span className="muted">Auto-refresh every 10s</span>
        </label>
      )}

      {error && (
        <div className="err">
          {error}{' '}
          <button className="btn small ghost" onClick={() => load(tab)}>
            Retry
          </button>
        </div>
      )}

      {tab === 'next' && <AddTaskBar onAdd={addTask} />}

      {loading ? (
        <div className="empty">Loading...</div>
      ) : (
        <>
          {tab === 'now' && <NowView runs={data.now.runs} tasks={data.now.tasks} />}
          {tab === 'done' && <DoneView runs={data.done.runs} log={data.done.log} onLog={logDone} />}
          {tab === 'next' && (
            <NextView
              notes={data.next.notes}
              queued={data.next.queued}
              onComplete={complete}
              onDelete={remove}
              onPriority={setPriority}
              onRename={rename}
            />
          )}
        </>
      )}
    </div>
  );
}
