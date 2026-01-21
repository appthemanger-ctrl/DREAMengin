
import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/router';
export async function POST(req: Request) {
  const { q } = await req.json();
  const text = await aiChat(String(q ?? ''));
  return NextResponse.json({ a: text });
}
