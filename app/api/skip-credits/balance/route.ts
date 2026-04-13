// app/api/skip-credits/balance/route.ts
// Phase 9 — Get Skip Credits Balance Endpoint
//
// Retrieves user's skip credit balance.
// Per ACTIVITY_FIRST_PROTOCOL.md §V (Skip Reward System)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();

  // Auth required
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get credits
    const { data: credits } = await (supabase as any)
      .from('skip_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Return zero balance if no record exists
    if (!credits) {
      return NextResponse.json({
        skip_credit: {
          user_id: user.id,
          credits_balance: 0,
          earned_total: 0,
          spent_total: 0,
          updated_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      { skip_credit: credits },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('[GetSkipCreditsBalance] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
