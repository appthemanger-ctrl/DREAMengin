import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { q, messages } = await req.json().catch(() => ({ q: '' }));
  const text = await aiChat(messages ? { messages } : String(q ?? ''));
  return NextResponse.json({ a: text });
}
