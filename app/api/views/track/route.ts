// app/api/views/track/route.ts
// Phase 9 — Track View Endpoint
//
// Records verified views on content. Views are the primary metric.
// Per ACTIVITY_FIRST_PROTOCOL.md §I.3 (Views Are the Currency)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { TrackViewRequest, TrackViewResponse } from '@/lib/activity/types';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();

  // Auth check (optional - allow anonymous views)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const body = (await req.json()) as TrackViewRequest;
    const { post_id, view_duration, scrolled_pct } = body;

    // Validate post exists
    const { data: post } = await supabase
      .from('app_posts')
      .select('id')
      .eq('id', post_id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get client info for fraud detection
    const viewerIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const viewerAgent = req.headers.get('user-agent');

    // Check for duplicate views (same user/IP, same post, last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    let isDuplicate = false;
    if (user) {
      const { data: existingView } = await (supabase as any)
        .from('views')
        .select('id')
        .eq('post_id', post_id)
        .eq('viewer_id', user.id)
        .gte('created_at', twentyFourHoursAgo)
        .single();

      isDuplicate = !!existingView;
    }

    // Basic bot detection
    const isBot = viewerAgent
      ? /bot|crawler|spider|scraper/i.test(viewerAgent)
      : false;

    // Verify view (human, not duplicate, minimum duration)
    const verified =
      !isBot &&
      !isDuplicate &&
      (view_duration === undefined || view_duration >= 3); // 3+ seconds

    // Record view
    const { data: view, error: viewError } = await (supabase as any)
      .from('views')
      .insert({
        post_id,
        viewer_id: user?.id,
        viewer_ip: viewerIp,
        viewer_agent: viewerAgent,
        view_duration,
        scrolled_pct,
        verified,
        verified_at: verified ? new Date().toISOString() : null,
        is_bot: isBot,
        is_duplicate: isDuplicate,
      })
      .select()
      .single();

    if (viewError) {
      console.error('[TrackView] Error:', viewError);
      return NextResponse.json(
        { error: 'Failed to track view' },
        { status: 500 },
      );
    }

    const response: TrackViewResponse = {
      view,
      verified,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[TrackView] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
