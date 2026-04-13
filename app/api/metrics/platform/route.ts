// app/api/metrics/platform/route.ts
// Phase 9 — Get Platform Health Metrics Endpoint
//
// Retrieves platform-wide health metrics for IDARi dashboard.
// Per ACTIVITY_FIRST_PROTOCOL.md §IV (Platform Health Metrics)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import type { GetPlatformMetricsResponse } from '@/lib/activity/types';

type UserMetricAggregateRow = {
  user_id: string | null;
  aqs: number | string | null;
  real_shit_rate: number | string | null;
};

type AdViewAggregateRow = {
  verified: boolean | null;
};

function toFiniteNumber(value: number | string | null | undefined): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function GET(_req: NextRequest) {
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
    const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin');
    if (adminErr || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceSupabase = await createServiceClient();

    const { data: userMetrics, error: userMetricsError } = await (serviceSupabase
      .from('user_metrics' as never)
      .select('user_id, aqs, real_shit_rate') as unknown as Promise<{
      data: UserMetricAggregateRow[] | null;
      error: { message: string } | null;
    }>);

    if (userMetricsError) {
      throw new Error(`Failed to load user metrics: ${userMetricsError.message}`);
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentAdViews, error: adViewsError } = await (serviceSupabase
      .from('ad_views' as never)
      .select('verified')
      .gte('created_at', thirtyDaysAgo) as unknown as Promise<{
      data: AdViewAggregateRow[] | null;
      error: { message: string } | null;
    }>);

    if (adViewsError) {
      throw new Error(`Failed to load ad views: ${adViewsError.message}`);
    }

    const realShitValues = (userMetrics ?? [])
      .map((row) => toFiniteNumber(row.real_shit_rate))
      .filter((value): value is number => value !== null);

    const activeUsers = (userMetrics ?? []).filter((row) => {
      const aqs = toFiniteNumber(row.aqs);
      return aqs !== null && aqs > 0;
    });

    const activeAqsValues = activeUsers
      .map((row) => toFiniteNumber(row.aqs))
      .filter((value): value is number => value !== null);

    const verifiedAdViews = (recentAdViews ?? []).filter((row) => row.verified === true).length;
    const totalAdViews = recentAdViews?.length ?? 0;

    // Total verified views
    const { count: totalVerifiedViews, error: verifiedViewsError } = await (serviceSupabase
      .from('views' as never)
      .select('id', { count: 'exact', head: true })
      .eq('verified', true) as unknown as Promise<{
      count: number | null;
      error: { message: string } | null;
    }>);

    if (verifiedViewsError) {
      throw new Error(`Failed to load verified views: ${verifiedViewsError.message}`);
    }

    // TODO: Calculate creation_to_consumption_ratio, outside_activity_rate, harmful_content_rate
    // These require more complex queries and data collection

    const response: GetPlatformMetricsResponse = {
      real_shit_rate: average(realShitValues),
      creation_to_consumption_ratio: 0, // TODO: Implement
      outside_activity_rate: 0, // TODO: Implement
      ad_view_rate: totalAdViews > 0 ? (verifiedAdViews / totalAdViews) * 100 : 0,
      harmful_content_rate: 0, // TODO: Implement
      average_aqs: average(activeAqsValues),
      total_active_users: new Set(
        activeUsers
          .map((row) => row.user_id)
          .filter((userId): userId is string => Boolean(userId)),
      ).size,
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
