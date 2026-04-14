// app/api/views/track/route.ts
// Phase 9 — Track View Endpoint
//
// Records verified views on content. Views are the primary metric.
// Per ACTIVITY_FIRST_PROTOCOL.md §I.3 (Views Are the Currency)
//
// Stream 7.2 — BoogieMan fraud detection (ACTIVITY_FIRST_PROTOCOL.md §V)
// Enhanced bot detection and per-user/per-post hourly rate-limit.

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

    // ── Fraud detection via TheBoogieMan.Ai — ACTIVITY_FIRST_PROTOCOL.md §V ──
    const fingerprint = {
      userAgent: req.headers.get('user-agent') ?? '',
      ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? '',
      timestamp: Date.now(),
    };

    // Check for obvious bot patterns (enhanced: includes 'headless' signal)
    const isBotPattern = /bot|crawler|spider|scraper|headless/i.test(fingerprint.userAgent);
    if (isBotPattern) {
      return NextResponse.json(
        { error: 'View not verified: bot pattern detected' },
        { status: 400 },
      );
    }

    // Rate-limit: max 1 view per post per user per hour (authenticated users only)
    if (user) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentViewCount } = await (supabase as any)
        .from('views')
        .select('id', { count: 'exact', head: true })
        .eq('viewer_id', user.id)
        .eq('post_id', post_id)
        .gte('created_at', oneHourAgo);

      if ((recentViewCount ?? 0) > 0) {
        return NextResponse.json(
          { error: 'Duplicate view within cooldown window' },
          { status: 429 },
        );
      }
    }
    // ── End fraud detection ───────────────────────────────────────────────────

    // Get client info for storage
    const viewerIp = fingerprint.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const viewerAgent = fingerprint.userAgent || null;

    // Verify view (human, minimum duration)
    const verified =
      !isBotPattern &&
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
        is_bot: isBotPattern,
        is_duplicate: false, // duplicates are rejected above
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
