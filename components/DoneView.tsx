'use client';

import { useState } from 'react';
import { timeAgo, truncate } from '@/lib/format';
import type { OpsLogRow, RunRow } from '@/lib/ops';

export default function DoneView({
  runs,
  log,
  onLog,
}: {
  runs: RunRow[];
  log: OpsLogRow[];
  onLog: (title: string, detail: string) => Promise<void>;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || saving) return;
    setSaving(true);
    await onLog(title.trim(), detail.trim());
    setTitle('');
    setDetail('');
    setFormOpen(false);
    setSaving(false);
  }

  return (
    <>
      <div className="addrow">
        <button className="btn small ghost" onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? 'Cancel' : 'Log finished work'}
        </button>
      </div>
      {formOpen && (
        <div className="card">
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What got finished?"
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <input
            className="field"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Detail (optional)"
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <button className="btn small" onClick={save} disabled={saving || !title.trim()}>
            {saving ? 'Saving...' : 'Add to log'}
          </button>
        </div>
      )}
      {!runs.length && !log.length && <div className="empty">Nothing finished yet.</div>}
      {log.map((l) => (
        <div className="card" key={l.id}>
          <div className="top"><strong>{l.title}</strong><span className="pill green">done</span></div>
          {l.detail && <div className="meta">{l.detail}</div>}
          <div className="meta">{timeAgo(l.created_at)}</div>
        </div>
      ))}
      {runs.map((r) => (
        <div className="card" key={r.id}>
          <div className="top"><strong>{truncate(r.objective, 120)}</strong><span className="pill green">done</span></div>
          <div className="meta">
            {r.completed} completed{r.failed ? `, ${r.failed} failed` : ''} &middot; {timeAgo(r.updated_at)}
          </div>
        </div>
      ))}
    </>
  );
}
