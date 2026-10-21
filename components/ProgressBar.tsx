'use client';

import { progressPct } from '@/lib/format';

export default function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = progressPct(done, total);
  return (
    <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}
