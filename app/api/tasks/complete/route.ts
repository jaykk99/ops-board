import { NextRequest, NextResponse } from 'next/server';
import { completeTask } from '@/lib/ops';

export const dynamic = 'force-dynamic';

/** POST {noteId} -> move a task note to the done log. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const noteId = String(body.noteId || '').trim();
    if (!noteId) return NextResponse.json({ ok: false, error: 'noteId required' }, { status: 400 });
    return NextResponse.json(await completeTask(noteId));
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}
