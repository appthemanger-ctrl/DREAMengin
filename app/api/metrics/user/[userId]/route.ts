// app/api/metrics/user/[userId]/route.ts
// Phase 9 — Get User Metrics Endpoint
//
// Retrieves aggregated user metrics including AQS, Real Shit Rate, views.
// Per ACTIVITY_FIRST_PROTOCOL.md §IV (Metrics & Measurement)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import type { GetUserMetricsResponse, UserMetrics } from '@/lib/activity/types';

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
