export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { addTask, logDone, updateTask, deleteTask } from '@/lib/ops';

export const dynamic = 'force-dynamic';

/**
 * POST {note, author?, priority?} -> new task note.
 * POST {title, detail?} with ?log=1 -> done-log entry.
 * PATCH {id, note?, priority?} -> edit a task note.
 * DELETE {id} -> drop a task note without logging.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (req.nextUrl.searchParams.get('log') === '1') {
      const entry = await logDone(String(body.title || ''), String(body.detail || ''));
      return NextResponse.json({ ok: true, entry });
    }
    const task = await addTask(String(body.note || ''), String(body.author || 'jay'), body.priority);
    return NextResponse.json({ ok: true, task });
  } catch (e: any) {
    const status = /required|valid|chars/i.test(e?.message || '') ? 400 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const task = await updateTask(String(body.id || ''), { note: body.note, priority: body.priority });
    return NextResponse.json({ ok: true, task });
  } catch (e: any) {
    const status = /required|valid|chars|nothing/i.test(e?.message || '') ? 400 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json(await deleteTask(String(body.id || '')));
  } catch (e: any) {
    const status = /required|valid/i.test(e?.message || '') ? 400 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status });
  }
}
