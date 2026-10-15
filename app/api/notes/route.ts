export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { addTask, logDone } from '@/lib/ops';

export const dynamic = 'force-dynamic';

/** POST {note, author?} -> new task note. POST {title, detail?} with ?log=1 -> done entry. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (req.nextUrl.searchParams.get('log') === '1') {
      const title = String(body.title || '').trim();
      if (!title) return NextResponse.json({ ok: false, error: 'title required' }, { status: 400 });
      return NextResponse.json({ ok: true, entry: await logDone(title, String(body.detail || '')) });
    }
    const note = String(body.note || '').trim();
    if (!note) return NextResponse.json({ ok: false, error: 'note required' }, { status: 400 });
    return NextResponse.json({ ok: true, task: await addTask(note, String(body.author || 'jay')) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}
