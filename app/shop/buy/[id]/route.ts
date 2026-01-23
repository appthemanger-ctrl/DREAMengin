import { NextRequest, NextResponse } from 'next/server';

// Next.js 16 changed the Route Handler type for dynamic params to use a Promise.
// This handler works with both shapes by awaiting `context.params`.
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // TODO: replace this placeholder with your actual purchase logic.
    // Keeping it minimal here to unblock the build on Next 16.1.4.
    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
