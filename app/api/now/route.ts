export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getNow } from '@/lib/ops';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...(await getNow()) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}
