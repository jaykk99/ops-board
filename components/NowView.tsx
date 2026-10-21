'use client';

import { timeAgo, truncate, pillClass, statusLabel, runProgressLabel } from '@/lib/format';
import type { RunRow, TaskRow } from '@/lib/ops';
import ProgressBar from './ProgressBar';

export default function NowView({ runs, tasks }: { runs: RunRow[]; tasks: TaskRow[] }) {
  if (!runs.length && !tasks.length) return <div className="empty">Nothing running right now.</div>;
  return (
    <>
      {runs.map((r) => (
        <div className="card" key={r.id}>
          <div className="top">
            <strong>{truncate(r.objective, 120)}</strong>
            <span className={`pill ${pillClass(r.status)}`}>{statusLabel(r.status)}</span>
          </div>
          <div className="meta">{runProgressLabel(r)} &middot; {timeAgo(r.updated_at)}</div>
          <ProgressBar done={r.completed} total={r.dispatched} />
        </div>
      ))}
      {tasks.map((t) => (
        <div className="card" key={t.id}>
          <div className="top">
            <span>{t.worker_label}: {truncate(t.objective, 100)}</span>
            <span className={`pill ${pillClass(t.status)}`}>{statusLabel(t.status)}</span>
          </div>
          {t.result_summary && <div className="meta">{truncate(t.result_summary, 160)}</div>}
          <div className="meta">{timeAgo(t.updated_at)}</div>
        </div>
      ))}
    </>
  );
}
