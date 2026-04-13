// app/api/metrics/platform/route.ts
// Phase 9 — Get Platform Health Metrics Endpoint
//
// Retrieves platform-wide health metrics for IDARi dashboard.
// Per ACTIVITY_FIRST_PROTOCOL.md §IV (Platform Health Metrics)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { GetPlatformMetricsResponse } from '@/lib/activity/types';

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();

  // Auth required (admin only)
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Calculate platform metrics
    // Real Shit Rate: verified posts / total posts
    const { data: realShitData } = await supabase.rpc('sql', {
      query: `
        SELECT
          COALESCE(AVG(real_shit_rate), 0) as real_shit_rate
        FROM user_metrics
      `,
    });

    // Average AQS
    const { data: aqsData } = await supabase.rpc('sql', {
      query: `
        SELECT
          COALESCE(AVG(aqs), 0) as average_aqs,
          COUNT(DISTINCT user_id) as total_active_users
        FROM user_metrics
        WHERE aqs > 0
      `,
    });

    // Ad View Rate: verified ad views / total ad impressions
    const { data: adData } = await supabase.rpc('sql', {
      query: `
        SELECT
          COALESCE(
            COUNT(*) FILTER (WHERE verified = true)::float /
            NULLIF(COUNT(*)::float, 0) * 100,
            0
          ) as ad_view_rate
        FROM ad_views
        WHERE created_at > now() - interval '30 days'
      `,
    });

    // Total verified views
    const { count: totalVerifiedViews } = await supabase
      .from('views')
      .select('*', { count: 'exact', head: true })
      .eq('verified', true);

    // TODO: Calculate creation_to_consumption_ratio, outside_activity_rate, harmful_content_rate
    // These require more complex queries and data collection

    const response: GetPlatformMetricsResponse = {
      real_shit_rate: realShitData?.[0]?.real_shit_rate ?? 0,
      creation_to_consumption_ratio: 0, // TODO: Implement
      outside_activity_rate: 0, // TODO: Implement
      ad_view_rate: adData?.[0]?.ad_view_rate ?? 0,
      harmful_content_rate: 0, // TODO: Implement
      average_aqs: aqsData?.[0]?.average_aqs ?? 0,
      total_active_users: aqsData?.[0]?.total_active_users ?? 0,
      total_verified_views: totalVerifiedViews ?? 0,
      calculated_at: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=300' }, // Cache for 5 min
    });
  } catch (err) {
    console.error('[GetPlatformMetrics] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
