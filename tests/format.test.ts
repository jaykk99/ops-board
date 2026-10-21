import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  timeAgo,
  truncate,
  progressPct,
  runProgressLabel,
  pillClass,
  statusLabel,
  clampPriority,
  isUuid,
  isValidNote,
  PRIORITY_LABELS,
} from '../lib/format.js';

describe('timeAgo', () => {
  const now = new Date('2026-10-20T19:40:00Z').getTime();
  const at = (ms: number) => new Date(now - ms).toISOString();

  it('says just now for recent timestamps', () => {
    assert.equal(timeAgo(at(0), now), 'just now');
    assert.equal(timeAgo(at(59_000), now), 'just now');
  });
  it('handles minutes', () => {
    assert.equal(timeAgo(at(60_000), now), '1m ago');
    assert.equal(timeAgo(at(30 * 60_000), now), '30m ago');
  });
  it('handles hours', () => {
    assert.equal(timeAgo(at(3_600_000), now), '1h ago');
    assert.equal(timeAgo(at(23 * 3_600_000), now), '23h ago');
  });
  it('handles days', () => {
    assert.equal(timeAgo(at(86_400_000), now), '1d ago');
    assert.equal(timeAgo(at(5 * 86_400_000), now), '5d ago');
  });
  it('clamps future timestamps to just now and flags bad input', () => {
    assert.equal(timeAgo(at(-60_000), now), 'just now');
    assert.equal(timeAgo('not-a-date', now), 'unknown');
  });
});

describe('truncate', () => {
  it('returns short text untouched', () => {
    assert.equal(truncate('hello', 10), 'hello');
  });
  it('cuts long text with an ellipsis without leaving a half word', () => {
    const out = truncate('the quick brown fox jumps over', 12);
    assert.ok(out.length <= 12);
    assert.ok(out.endsWith('…'));
    assert.equal(out, 'the quick…');
  });
  it('falls back to a hard cut when there are no spaces', () => {
    assert.equal(truncate('abcdefghijklmnop', 6), 'abcde…');
  });
  it('trims surrounding whitespace', () => {
    assert.equal(truncate('  hi  ', 10), 'hi');
  });
});

describe('progressPct', () => {
  it('computes a rounded 0..100 percentage', () => {
    assert.equal(progressPct(1, 2), 50);
    assert.equal(progressPct(1, 3), 33);
    assert.equal(progressPct(7, 12), 58);
  });
  it('guards zero totals, negatives and overshoot', () => {
    assert.equal(progressPct(0, 0), 0);
    assert.equal(progressPct(5, 0), 0);
    assert.equal(progressPct(-2, 10), 0);
    assert.equal(progressPct(12, 10), 100);
  });
  it('tolerates non-numeric junk', () => {
    assert.equal(progressPct(NaN as number, 10), 0);
  });
});

describe('runProgressLabel', () => {
  it('renders done counts and only mentions failures when present', () => {
    assert.equal(runProgressLabel({ completed: 7, dispatched: 12, failed: 0 }), '7/12 done');
    assert.equal(runProgressLabel({ completed: 7, dispatched: 12, failed: 2 }), '7/12 done, 2 failed');
  });
});

describe('pillClass', () => {
  it('maps statuses to colors', () => {
    assert.equal(pillClass('done'), 'green');
    assert.equal(pillClass('running'), 'blue');
    assert.equal(pillClass('dispatched'), 'blue');
    assert.equal(pillClass('queued'), 'amber');
    assert.equal(pillClass('failed'), 'amber');
  });
  it('is case-insensitive and defaults to plain', () => {
    assert.equal(pillClass('DONE'), 'green');
    assert.equal(pillClass('weird'), '');
    assert.equal(pillClass(''), '');
  });
});

describe('statusLabel', () => {
  it('passes labels through and names blanks unknown', () => {
    assert.equal(statusLabel('running'), 'running');
    assert.equal(statusLabel('  '), 'unknown');
  });
});

describe('clampPriority', () => {
  it('keeps 1..3 and defaults everything else to 2', () => {
    assert.equal(clampPriority(1), 1);
    assert.equal(clampPriority(2), 2);
    assert.equal(clampPriority(3), 3);
    assert.equal(clampPriority(99), 3);
    assert.equal(clampPriority(0), 1);
    assert.equal(clampPriority('high'), 2);
    assert.equal(clampPriority(undefined), 2);
  });
  it('labels line up with values', () => {
    assert.deepEqual(PRIORITY_LABELS, { 1: 'low', 2: 'normal', 3: 'high' });
  });
});

describe('isUuid', () => {
  it('accepts v4 uuids and rejects junk', () => {
    assert.equal(isUuid('a3bb189e-8bf9-3888-9912-ace4e6543002'), true);
    assert.equal(isUuid('A3BB189E-8BF9-3888-9912-ACE4E6543002'), true);
    assert.equal(isUuid('not-an-id'), false);
    assert.equal(isUuid(''), false);
    assert.equal(isUuid(42), false);
  });
});

describe('isValidNote', () => {
  it('accepts normal text and rejects blank or huge notes', () => {
    assert.equal(isValidNote('fix the thing'), true);
    assert.equal(isValidNote('   '), false);
    assert.equal(isValidNote('x'.repeat(2001)), false);
    assert.equal(isValidNote('x'.repeat(2000)), true);
    assert.equal(isValidNote(null), false);
  });
});
