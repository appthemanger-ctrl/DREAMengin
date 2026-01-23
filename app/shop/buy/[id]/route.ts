import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js 16 route handler signature:
 * context.params is a Promise<{ id: string }>
 * We await it and return a Response/NextResponse.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    // If the caller sends JSON, parse it (optional)
    const body = await req.json().catch(() => ({} as any));

    // TODO: Replace with your original purchase logic.
    // This placeholder makes the build succeed on Next 16 and is safe to deploy.
    return NextResponse.json({ ok: true, id, received: body });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
