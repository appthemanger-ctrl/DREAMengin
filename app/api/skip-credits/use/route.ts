// app/api/skip-credits/use/route.ts
// Phase 9 — Use Skip Credits Endpoint
//
// Spends skip credits to skip ads.
// Per ACTIVITY_FIRST_PROTOCOL.md §V (Skip Reward System)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type {
  UseSkipCreditsRequest,
  UseSkipCreditsResponse,
} from '@/lib/activity/types';

export async function POST(req: NextRequest) {
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
    const body = (await req.json()) as UseSkipCreditsRequest;
    const { ad_id } = body;

    // Get current credits
    const { data: credits } = await supabase
      .from('skip_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!credits || credits.credits_balance < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 },
      );
    }

    // Spend 1 credit
    const { data: updatedCredits, error: updateError } = await supabase
      .from('skip_credits')
      .update({
        credits_balance: credits.credits_balance - 1,
        spent_total: credits.spent_total + 1,
        last_spent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[UseSkipCredits] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to spend credits' },
        { status: 500 },
      );
    }

    const response: UseSkipCreditsResponse = {
      skip_credit: updatedCredits,
      credits_spent: 1,
      new_balance: updatedCredits.credits_balance,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[UseSkipCredits] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
