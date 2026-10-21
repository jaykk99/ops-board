'use client';

import { useState } from 'react';
import { PRIORITY_LABELS, type Priority } from '@/lib/format';

export default function AddTaskBar({ onAdd }: { onAdd: (note: string, priority: Priority) => Promise<void> }) {
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<Priority>(2);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const text = note.trim();
    if (!text || busy) return;
    setBusy(true);
    await onAdd(text, priority);
    setNote('');
    setPriority(2);
    setBusy(false);
  }

  return (
    <div className="addrow">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Tell me what to do..."
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <select className="sel" value={priority} onChange={(e) => setPriority(Number(e.target.value) as Priority)} aria-label="priority">
        <option value={3}>{PRIORITY_LABELS[3]}</option>
        <option value={2}>{PRIORITY_LABELS[2]}</option>
        <option value={1}>{PRIORITY_LABELS[1]}</option>
      </select>
      <button className="btn" onClick={submit} disabled={busy || !note.trim()}>
        {busy ? 'Adding...' : 'Add'}
      </button>
    </div>
  );
}
