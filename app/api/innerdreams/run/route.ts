// app/api/innerdreams/run/route.ts
// Version: fix-plain-string-returns (no `{ text }` destructuring)
import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const prompt: string = String(body?.prompt ?? '');
    const errs = Array.isArray(body?.errors) ? body.errors : [];

    // aiChat returns a STRING. Normalize just in case it changes in future.
    const raw = await aiChat({
      messages: [
        { role: 'system', content: 'You generate safe patch suggestions.' },
        { role: 'user', content: `${prompt}\nErrors:\n${JSON.stringify(errs).slice(0, 8000)}` },
      ],
    });

    const text = typeof raw === 'string'
      ? raw
      : (raw && typeof (raw as any).text === 'string' ? (raw as any).text : String(raw ?? ''));

    return NextResponse.json({ ok: true, text });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown error' }, { status: 500 });
  }
}
