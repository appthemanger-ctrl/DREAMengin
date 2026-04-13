// app/api/skip-credits/earn/route.ts
// Phase 9 — Earn Skip Credits Endpoint
//
// Awards skip credits for watching ads.
// Per ACTIVITY_FIRST_PROTOCOL.md §V (Skip Reward System)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type {
  EarnSkipCreditsRequest,
  EarnSkipCreditsResponse,
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
    const body = (await req.json()) as EarnSkipCreditsRequest;
    const { ad_view_id } = body;

    // Verify ad view exists and is verified
    const { data: adView } = await (supabase as any)
      .from('ad_views')
      .select('*')
      .eq('id', ad_view_id)
      .eq('viewer_id', user.id)
      .eq('verified', true)
      .single();

    if (!adView) {
      return NextResponse.json(
        { error: 'Ad view not found or not verified' },
        { status: 404 },
      );
    }

    // Check if already rewarded
    if (adView.watched_pct < 95) {
      return NextResponse.json(
        { error: 'Ad not watched sufficiently' },
        { status: 400 },
      );
    }

    // Calculate credits earned
    const creditsEarned = adView.ad_type === 'rewarded' ? 3 : 1;

    // Get or create skip_credits record
    const { data: existingCredits } = await (supabase as any)
      .from('skip_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let skipCredit;
    if (existingCredits) {
      // Update existing
      const { data, error } = await (supabase as any)
        .from('skip_credits')
        .update({
          credits_balance: existingCredits.credits_balance + creditsEarned,
          earned_total: existingCredits.earned_total + creditsEarned,
          last_earned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[EarnSkipCredits] Update error:', error);
        return NextResponse.json(
          { error: 'Failed to update credits' },
          { status: 500 },
        );
      }
      skipCredit = data;
    } else {
      // Create new
      const { data, error } = await (supabase as any)
        .from('skip_credits')
        .insert({
          user_id: user.id,
          credits_balance: creditsEarned,
          earned_total: creditsEarned,
          last_earned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[EarnSkipCredits] Insert error:', error);
        return NextResponse.json(
          { error: 'Failed to create credits' },
          { status: 500 },
        );
      }
      skipCredit = data;
    }

    const response: EarnSkipCreditsResponse = {
      skip_credit: skipCredit,
      credits_earned: creditsEarned,
      new_balance: skipCredit.credits_balance,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[EarnSkipCredits] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
