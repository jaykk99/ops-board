'use client';

import { useState } from 'react';
import { timeAgo, truncate, PRIORITY_LABELS, clampPriority, type Priority } from '@/lib/format';
import type { NoteRow, RunRow } from '@/lib/ops';

const PRIORITY_ORDER: Priority[] = [3, 2, 1];

function priorityPill(p: Priority) {
  const cls = p === 3 ? 'red' : p === 2 ? '' : 'green';
  return <span className={`pill ${cls}`}>{PRIORITY_LABELS[p]}</span>;
}

function TaskCard({
  note,
  onComplete,
  onDelete,
  onPriority,
  onRename,
}: {
  note: NoteRow;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPriority: (id: string, p: Priority) => void;
  onRename: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.note);
  const priority = clampPriority(note.priority);

  function saveEdit() {
    const text = draft.trim();
    if (text && text !== note.note) onRename(note.id, text);
    setEditing(false);
  }

  return (
    <div className="card">
      <div className="top">
        {editing ? (
          <input
            className="field inline"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') { setDraft(note.note); setEditing(false); }
            }}
            onBlur={saveEdit}
          />
        ) : (
          <strong>{note.note}</strong>
        )}
        {priorityPill(priority)}
      </div>
      <div className="meta">{note.author} &middot; {timeAgo(note.created_at)}</div>
      <div className="rowbtns">
        <button className="btn small ghost" onClick={() => onComplete(note.id)}>Mark done</button>
        {!editing && <button className="btn small ghost" onClick={() => { setDraft(note.note); setEditing(true); }}>Edit</button>}
        <select
          className="sel"
          value={priority}
          onChange={(e) => onPriority(note.id, clampPriority(Number(e.target.value)))}
          aria-label="priority"
        >
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
        <button
          className="btn small ghost danger"
          onClick={() => { if (confirm('Delete this task?')) onDelete(note.id); }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function NextView({
  notes,
  queued,
  onComplete,
  onDelete,
  onPriority,
  onRename,
}: {
  notes: NoteRow[];
  queued: RunRow[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPriority: (id: string, p: Priority) => void;
  onRename: (id: string, text: string) => void;
}) {
  if (!notes.length && !queued.length) return <div className="empty">Queue is empty. Add something above.</div>;
  return (
    <>
      {notes.map((n) => (
        <TaskCard key={n.id} note={n} onComplete={onComplete} onDelete={onDelete} onPriority={onPriority} onRename={onRename} />
      ))}
      {queued.map((r) => (
        <div className="card" key={r.id}>
          <div className="top"><strong>{truncate(r.objective, 120)}</strong><span className="pill">queued</span></div>
          <div className="meta">{timeAgo(r.created_at)}</div>
        </div>
      ))}
    </>
  );
}
