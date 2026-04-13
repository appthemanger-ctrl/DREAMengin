// app/api/ads/view/route.ts
// Phase 9 — Track Ad View Endpoint
//
// Records verified ad views for CPV (Cost Per View) billing.
// Per ACTIVITY_FIRST_PROTOCOL.md §V (Ad System)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { qualifiesForPremiumCPV } from '@/lib/activity/aqs';
import type {
  TrackAdViewRequest,
  TrackAdViewResponse,
  CPVTier,
} from '@/lib/activity/types';
import { CPV_PRICING } from '@/lib/activity/types';

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
    const body = (await req.json()) as TrackAdViewRequest;
    const { ad_id, ad_type, view_duration, watched_pct, post_id } = body;

    // Validate watched percentage
    if (watched_pct < 0 || watched_pct > 100) {
      return NextResponse.json(
        { error: 'Invalid watched_pct' },
        { status: 400 },
      );
    }

    // Verify ad view using database function
    const { data: verified } = await supabase.rpc('verify_ad_view', {
      p_ad_id: ad_id,
      p_viewer_id: user.id,
      p_watched_pct: watched_pct,
    });

    // Determine CPV tier
    let cpvTier: CPVTier = 'standard';
    if (verified) {
      const isPremium = await qualifiesForPremiumCPV(user.id);
      const isSuperPremium = watched_pct === 100 && view_duration >= 30;

      if (isSuperPremium) {
        cpvTier = 'super_premium';
      } else if (isPremium) {
        cpvTier = 'premium';
      }
    }

    const cpvAmount = CPV_PRICING[cpvTier];

    // Record ad view
    const { data: adView, error: adViewError } = await supabase
      .from('ad_views')
      .insert({
        ad_id,
        ad_type,
        viewer_id: user.id,
        post_id,
        view_duration,
        watched_pct,
        cpv_tier: cpvTier,
        cpv_amount: cpvAmount,
        verified: verified ?? false,
        verified_at: verified ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (adViewError) {
      console.error('[TrackAdView] Error:', adViewError);
      return NextResponse.json(
        { error: 'Failed to track ad view' },
        { status: 500 },
      );
    }

    // Calculate credits earned (only if verified and watched 95%+)
    const creditsEarned = verified && watched_pct >= 95
      ? (ad_type === 'rewarded' ? 3 : 1)
      : 0;

    const response: TrackAdViewResponse = {
      ad_view: adView,
      verified: verified ?? false,
      credits_earned: creditsEarned,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[TrackAdView] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
