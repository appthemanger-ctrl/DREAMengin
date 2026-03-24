/**
 * app/api/connectors/[provider]/items/route.ts
 *
 * Read-only helper route for widget rendering.
 * Returns the user's most recently synced normalised items for a provider.
 *
 * This is the missing bridge between:
 *   connector sync -> feed_items storage -> actual widget display
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const supabase = await createServerClient();
   
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, items: [], error: 'Unauthorised' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawLimit = Number(searchParams.get('limit') ?? '6');
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(24, Math.floor(rawLimit)))
    : 6;

  const { data, error } = await db
    .from('feed_items')
    .select('payload, published_at')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { ok: false, items: [], error: error.message },
      { status: 500 },
    );
  }

  const items = (data ?? [])
    .map((row: { payload?: unknown }) => row.payload)
    .filter(Boolean);

  return NextResponse.json({
    ok: true,
    items,
  });
}
