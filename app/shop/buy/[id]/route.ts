import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js 15/16 changed the Route Handler types so `context.params`
 * is now a Promise. You must `await` it before using.
 * This file compiles on 16.1.x.
 */

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  return NextResponse.json({ ok: true, id });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  // If you need request body:
  // const body = await req.json().catch(() => ({} as any));
  return NextResponse.json({ ok: true, id });
}
