// app/api/metrics/user/[userId]/route.ts
// Phase 9 — Get User Metrics Endpoint
//
// Retrieves aggregated user metrics including AQS, Real Shit Rate, views.
// Per ACTIVITY_FIRST_PROTOCOL.md §IV (Metrics & Measurement)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { GetUserMetricsResponse } from '@/lib/activity/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const supabase = await createServerClient();
  const { userId } = await params;

  try {
    // Get metrics using database function
    const { data, error } = await supabase.rpc('get_user_metrics', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[GetUserMetrics] Error:', error);
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 },
      );
    }

    // If no metrics, return defaults
    if (!data || Object.keys(data).length === 0) {
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

    const response: GetUserMetricsResponse = {
      metrics: data,
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
