import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/analytics
 *
 * Returns real engagement counts for the authenticated user.
 *
 * Architecture justification:
 *   docs/AXIOMS.md §3 — every visible action must do something real.
 *   AnalyticsPanel previously used hardcoded mock data. This route returns
 *   live counts from the actual database tables.
 *
 *   docs/LAW.md §2 — nothing is public by default.
 *   Analytics are private to the authenticated user; no cross-user reads.
 *
 * Query param:
 *   range  — '7d' | '30d' | '90d'  (default: '30d')
 *
 * Returns:
 *   { total_views, total_likes, total_comments, total_followers, total_revenue,
 *     views_change, likes_change, comments_change, followers_change, revenue_change }
 *
 * "change" values are percentage change vs. the preceding equivalent period.
 */

export const dynamic = 'force-dynamic';

// Parse range param to a number of days
function parseDays(range: string | null): number {
  if (range === '7d')  return 7;
  if (range === '90d') return 90;
  return 30;  // default
}

// Calculate pct change from previous to current period (null-safe)
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseDays(searchParams.get('range'));

  const now        = new Date();
  const periodStart = new Date(now.getTime() - days * 86_400_000).toISOString();
  const prevStart   = new Date(now.getTime() - days * 2 * 86_400_000).toISOString();

  // ── Pull the user's post IDs (needed for like/comment joins) ────────────
  const { data: myPostRows } = await supabase
    .from('app_posts')
    .select('id')
    .eq('user_id', user.id);

  const myPostIds: string[] = (myPostRows ?? []).map((r: { id: string }) => r.id);

  // ── Parallel fetches ──────────────────────────────────────────────────────
  const [
    // Total likes received on user's posts
    { count: likesTotal },
    { count: likesPrev },
    // Total comments received on user's posts
    { count: commentsTotal },
    { count: commentsPrev },
    // Followers gained in this period
    { count: followersTotal },
    { count: followersPrev },
    // Total posts as a proxy for "views" (real view tracking would need a views table)
    { count: viewsTotal },
    { count: viewsPrev },
  ] = await Promise.all([
    // likes this period
    myPostIds.length > 0
      ? supabase.from('likes').select('*', { count: 'exact', head: true })
          .in('content_id', myPostIds)
          .eq('content_type', 'post')
          .gte('created_at', periodStart)
      : Promise.resolve({ count: 0 }),
    // likes previous period
    myPostIds.length > 0
      ? supabase.from('likes').select('*', { count: 'exact', head: true })
          .in('content_id', myPostIds)
          .eq('content_type', 'post')
          .gte('created_at', prevStart)
          .lt('created_at', periodStart)
      : Promise.resolve({ count: 0 }),

    // comments this period
    myPostIds.length > 0
      ? supabase.from('comments').select('*', { count: 'exact', head: true })
          .in('post_id', myPostIds)
          .gte('created_at', periodStart)
      : Promise.resolve({ count: 0 }),
    // comments previous period
    myPostIds.length > 0
      ? supabase.from('comments').select('*', { count: 'exact', head: true })
          .in('post_id', myPostIds)
          .gte('created_at', prevStart)
          .lt('created_at', periodStart)
      : Promise.resolve({ count: 0 }),

    // followers gained this period
    supabase.from('follows').select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)
      .gte('created_at', periodStart),
    // followers gained previous period
    supabase.from('follows').select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)
      .gte('created_at', prevStart)
      .lt('created_at', periodStart),

    // posts (proxy for views) this period
    supabase.from('app_posts').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', periodStart),
    // posts previous period
    supabase.from('app_posts').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', prevStart)
      .lt('created_at', periodStart),
  ]);

  // Total followers (all-time)
  const { count: followersAllTime } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', user.id);

  // Revenue: count of ad_orders where buyer indirectly funded this user
  // (ad_slots owned by user → ad_listings → ad_orders)
  const { data: mySlots } = await supabase
    .from('ad_slots')
    .select('id')
    .eq('owner_id', user.id);
  const mySlotIds = (mySlots ?? []).map((s: { id: string }) => s.id);

  let revenueTotal = 0;
  let revenuePrev  = 0;

  if (mySlotIds.length > 0) {
    const { data: myListings } = await supabase
      .from('ad_listings')
      .select('id')
      .in('slot_id', mySlotIds);
    const myListingIds = (myListings ?? []).map((l: { id: string }) => l.id);

    if (myListingIds.length > 0) {
      const { count: rtTotal } = await supabase
        .from('ad_orders')
        .select('*', { count: 'exact', head: true })
        .in('listing_id', myListingIds)
        .eq('payment_status', 'paid')
        .gte('created_at', periodStart);
      const { count: rtPrev } = await supabase
        .from('ad_orders')
        .select('*', { count: 'exact', head: true })
        .in('listing_id', myListingIds)
        .eq('payment_status', 'paid')
        .gte('created_at', prevStart)
        .lt('created_at', periodStart);
      revenueTotal = rtTotal ?? 0;
      revenuePrev  = rtPrev  ?? 0;
    }
  }

  const l  = likesTotal   ?? 0;
  const lp = likesPrev    ?? 0;
  const c  = commentsTotal ?? 0;
  const cp = commentsPrev  ?? 0;
  const f  = followersTotal ?? 0;
  const fp = followersPrev  ?? 0;
  const v  = viewsTotal    ?? 0;
  const vp = viewsPrev     ?? 0;

  return NextResponse.json({
    total_views:      v,
    total_likes:      l,
    total_comments:   c,
    total_followers:  followersAllTime ?? 0,
    total_revenue:    revenueTotal,
    views_change:     pctChange(v,  vp),
    likes_change:     pctChange(l,  lp),
    comments_change:  pctChange(c,  cp),
    followers_change: pctChange(f,  fp),
    revenue_change:   pctChange(revenueTotal, revenuePrev),
    period_days:      days,
  });
}
