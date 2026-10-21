/**
 * Pure display helpers for the ops board UI. No I/O, no React, so they are
 * trivially unit-testable (see tests/format.test.ts).
 */

export function timeAgo(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'unknown';
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) {
    const m = Math.floor(s / 60);
    return m === 1 ? '1m ago' : `${m}m ago`;
  }
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    return h === 1 ? '1h ago' : `${h}h ago`;
  }
  const d = Math.floor(s / 86400);
  return d === 1 ? '1d ago' : `${d}d ago`;
}

/** Cut a string to max chars, keeping whole words where easy, adding an ellipsis. */
export function truncate(s: string, max: number): string {
  const text = (s || '').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1).replace(/\s+\S*$/, '');
  return `${cut || text.slice(0, max - 1)}…`;
}

/** 0..100 integer. Guards against zero/negative totals and overshoot. */
export function progressPct(done: number, total: number): number {
  const d = Math.max(0, Number(done) || 0);
  const t = Math.max(0, Number(total) || 0);
  if (t === 0) return 0;
  return Math.min(100, Math.round((d / t) * 100));
}

export type RunProgress = { completed: number; dispatched: number; failed: number };

/** "7/12 done, 1 failed" style one-liner for a swarm run card. */
export function runProgressLabel(r: RunProgress): string {
  const failed = r.failed > 0 ? `, ${r.failed} failed` : '';
  return `${r.completed}/${r.dispatched} done${failed}`;
}

/** Map a swarm status to the pill color class used in globals.css. */
export function pillClass(status: string): 'green' | 'blue' | 'amber' | '' {
  const s = (status || '').toLowerCase();
  if (s === 'done' || s === 'completed' || s === 'success') return 'green';
  if (s === 'running' || s === 'dispatched') return 'blue';
  if (s === 'queued' || s === 'failed' || s === 'error') return 'amber';
  return '';
}

/** Human label for a raw status string. */
export function statusLabel(status: string): string {
  const s = (status || '').trim();
  return s ? s : 'unknown';
}

export type Priority = 1 | 2 | 3;

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: 'low',
  2: 'normal',
  3: 'high',
};

/** Normalize anything into a valid 1|2|3 priority, defaulting to normal. */
export function clampPriority(p: unknown): Priority {
  const n = Number(p);
  if (n >= 3) return 3;
  if (n <= 1) return 1;
  return 2;
}

/** Loose UUID check for note ids coming from the client. */
export function isUuid(id: unknown): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

/** True when the payload looks like a non-empty task note. */
export function isValidNote(note: unknown): boolean {
  return typeof note === 'string' && note.trim().length > 0 && note.trim().length <= 2000;
}
