// app/api/ads/view/route.ts
// Phase 9 — Track Ad View Endpoint
//
// Records verified ad views for CPV (Cost Per View) billing.
// Per ACTIVITY_FIRST_PROTOCOL.md §V (Ad System)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { qualifiesForPremiumCPV } from '@/lib/activity/aqs';
import type {
  AdView,
  TrackAdViewRequest,
  TrackAdViewResponse,
} from '@/lib/activity/types';
import { CPV_PRICING, CPVTier } from '@/lib/activity/types';
import { calculateActivityRevenueSplit } from '@/lib/activity/revenueSplit';
import { calculateSkipCreditsEarned } from '@/lib/activity/skipCredits';

type ActivitySupabaseClient = {
  rpc: <T>(
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: T | null; error?: { message?: string } | null }>;
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => {
        single: () => Promise<{ data: Record<string, unknown> | null }>;
      };
    };
    insert: (values) => {
      select: () => {
        single: () => Promise<{
          data: Record<string, unknown> | null;
          error: { message?: string } | null;
        }>;
      };
    };
    update: (values) => {
      eq: (column: string, value: unknown) => Promise<{ error?: { message?: string } | null }>;
    };
  };
};

type InsertedAdViewRow = {
  id?: string | null;
};

function getInsertedAdViewId(adView: InsertedAdViewRow): string | null {
  const id = adView.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export async function POST(req: NextRequest ){
  const supabase = await createServerClient();
  const db = supabase as unknown as ActivitySupabaseClient;

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
    const { data: verified } = await db.rpc<boolean>('verify_ad_view', {
      p_ad_id: ad_id,
      p_viewer_id: user.id,
      p_watched_pct: watched_pct,
    });

    // Determine CPV tier
    let cpvTier: CPVTier = CPVTier.STANDARD;
    if (verified) {
      const isPremium = await qualifiesForPremiumCPV(user.id);
      const isSuperPremium = watched_pct === 100 && view_duration >= 30;

      if (isSuperPremium) {
        cpvTier = CPVTier.SUPER_PREMIUM;
      } else if (isPremium) {
        cpvTier = CPVTier.PREMIUM;
      }
    }

    const cpvAmount = CPV_PRICING[cpvTier];

    let creatorId: string | null = null;
    if (post_id) {
      const { data: post } = await db
        .from('app_posts')
        .select('user_id')
        .eq('id', post_id)
        .single();
      creatorId = typeof post?.user_id === 'string' ? post.user_id : null;
    }

    const split = calculateActivityRevenueSplit(cpvAmount);

    // Record ad view
    const { data: adView, error: adViewError } = await db
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
        creator_id: creatorId,
        platform_share: split.platformShare,
        creator_share: split.creatorShare,
        reward_pool_share: split.rewardPoolShare,
        verified: verified ?? false,
        verified_at: verified ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (adViewError || !adView) {
      console.error('[TrackAdView] Error:', adViewError);
      return NextResponse.json(
        { error: 'Failed to track ad view' },
        { status: 500 },
      );
    }

    const creditsEarned = calculateSkipCreditsEarned({
      adType: ad_type,
      verified: verified ?? false,
      watchedPct: watched_pct,
    });

    if (creditsEarned > 0) {
      const adViewId = getInsertedAdViewId(adView as InsertedAdViewRow);
      if (!adViewId) {
        console.error('[TrackAdView] Missing ad view ID:', adView);
        return NextResponse.json(
          {
            error: 'Failed to retrieve ad view ID after insert',
            revenue_split: {
              platformShare: split.platformShare,
              creatorShare: split.creatorShare,
              rewardPoolShare: split.rewardPoolShare,
            },
          },
          { status: 500 },
        );
      }
      await db.rpc<boolean>('award_skip_credits', {
        p_user_id: user.id,
        p_ad_view_id: adViewId,
        p_credits: creditsEarned,
      });
    }

    const trackedAdView = adView as unknown as AdView;
    const response: TrackAdViewResponse = {
      ad_view: trackedAdView,
      verified: verified ?? false,
      credits_earned: creditsEarned,
      revenue_split: {
        platformShare: split.platformShare,
        creatorShare: split.creatorShare,
        rewardPoolShare: split.rewardPoolShare,
      },
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