// app/api/metrics/user/[userId]/route.ts
// Phase 9 — Get User Metrics Endpoint
//
// Retrieves aggregated user metrics including AQS, Real Shit Rate, views.
// Per ACTIVITY_FIRST_PROTOCOL.md §IV (Metrics & Measurement)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { ActivityTier, type GetUserMetricsResponse, type UserMetrics } from '@/lib/activity/types';

type ActivityTierRow = { tier: number | null };
type ActivityPointsQueryBuilder = PromiseLike<{ data: ActivityTierRow[] | null }> & {
  eq(column: 'user_id' | 'is_decayed', value: string | boolean): ActivityPointsQueryBuilder;
  gte(column: 'created_at', value: string): ActivityPointsQueryBuilder;
  order(column: 'tier', options: { ascending: boolean }): ActivityPointsQueryBuilder;
  limit(count: number): PromiseLike<{ data: ActivityTierRow[] | null }>;
};
type ActivityPointsClient = {
  from(table: 'activity_points'): {
    select(columns: 'tier'): ActivityPointsQueryBuilder;
  };
};

function toNumber(value: number | string | null | undefined): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const supabase = await createServerClient();
  const { userId } = await params;

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let currentTier30d = ActivityTier.PASSIVE;
    try {
      const { data: tierRows } = await (supabase as unknown as ActivityPointsClient)
        .from('activity_points')
        .select('tier')
        .eq('user_id', userId)
        .eq('is_decayed', false)
        .gte('created_at', thirtyDaysAgo)
        .order('tier', { ascending: false })
        .limit(1);
      const tier = tierRows?.[0]?.tier;
      if (typeof tier === 'number' && tier >= ActivityTier.PASSIVE && tier <= ActivityTier.NEVER_DONE_BEFORE) {
        currentTier30d = tier;
      }
    } catch {
      currentTier30d = ActivityTier.PASSIVE;
    }

    // Get metrics using database function
    const { data, error } = await supabase.rpc(
      'get_user_metrics' as unknown as keyof Database['public']['Functions'],
      { p_user_id: userId } as Database['public']['Functions']['get_user_metrics']['Args'],
    );

    if (error) {
      console.error('[GetUserMetrics] Error:', error);
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 },
      );
    }

    // If no metrics, return defaults
    const rawMetrics = (
      data && typeof data === 'object' && !Array.isArray(data)
        ? data
        : null
    ) as Partial<UserMetrics> | null;

    if (!rawMetrics || Object.keys(rawMetrics).length === 0) {
      const response: GetUserMetricsResponse = {
        metrics: {
          user_id: userId,
          aqs: 0,
          current_tier_30d: currentTier30d,
          real_shit_rate: 0,
          total_views: 0,
          views_per_post: 0,
          activity_points_30d: 0,
          days_active_30d: 0,
          most_viewed_count: 0,
          total_posts: 0,
          verified_posts: 0,
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
      return NextResponse.json(response);
    }

    const metrics: UserMetrics = {
      user_id: rawMetrics.user_id ?? userId,
      aqs: toNumber(rawMetrics.aqs),
      current_tier_30d: currentTier30d,
      real_shit_rate: toNumber(rawMetrics.real_shit_rate),
      total_views: toNumber(rawMetrics.total_views),
      views_per_post: toNumber(rawMetrics.views_per_post),
      activity_points_30d: toNumber(rawMetrics.activity_points_30d),
      days_active_30d: toNumber(rawMetrics.days_active_30d),
      most_viewed_post_id: rawMetrics.most_viewed_post_id,
      most_viewed_count: toNumber(rawMetrics.most_viewed_count),
      total_posts: toNumber(rawMetrics.total_posts),
      verified_posts: toNumber(rawMetrics.verified_posts),
      calculated_at: rawMetrics.calculated_at ?? new Date().toISOString(),
      updated_at: rawMetrics.updated_at ?? new Date().toISOString(),
    };

    const response: GetUserMetricsResponse = {
      metrics,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=300' }, // Cache for 5 min
    });
  } catch (err) {
    console.error('[GetUserMetrics] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
