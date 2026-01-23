// app/api/assistant/route.ts
import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { q } = await req.json().catch(() => ({ q: '' }));
  const prompt = String(q ?? '');

  // FIX: aiChat expects { messages }, not a raw string
  const text = await aiChat({
    messages: [
      { role: 'system', content: 'You are Dr. Eam — Dreampage helper. Keep it short and helpful.' },
      { role: 'user', content: prompt }
    ]
  });

  return NextResponse.json({ a: text });
}
