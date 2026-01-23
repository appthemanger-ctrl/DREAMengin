import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

/**
 * Admin-only (TODO: add auth check). For now returns a safe "plan" string.
 */
export async function POST(req) {
  const { prompt, errors } = await req.json().catch(() => ({ prompt: '', errors: [] }));
  const plan = await aiChat({ messages: [
    { role: 'system', content: 'You propose small, safe UI tweaks only.' },
    { role: 'user', content: `Prompt:${prompt}\nErrors:${JSON.stringify(errors ?? []).slice(0, 2000)}` }
  ]});
  return NextResponse.json({ ok: true, plan });
}
