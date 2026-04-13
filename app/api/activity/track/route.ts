// app/api/activity/track/route.ts
// Phase 9 — Track Activity Endpoint
//
// Records user activity with tier classification and optional verification.
// Awards activity points based on tier per ACTIVITY_FIRST_PROTOCOL.md §II

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateActivityPoints, calculateDecayDate } from '@/lib/activity/scoring';
import type {
  TrackActivityRequest,
  TrackActivityResponse,
  ActivityTier,
  VerificationMethod,
} from '@/lib/activity/types';
import { VERIFICATION_STRENGTH } from '@/lib/activity/types';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();

  // Auth check
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as TrackActivityRequest;
    const {
      tier,
      activity_type,
      description,
      post_id,
      verification_method,
      evidence_url,
      evidence_metadata,
    } = body;

    // Validate tier
    if (tier < 0 || tier > 6) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Calculate points
    const points = calculateActivityPoints(tier);
    const decayTimestamp = calculateDecayDate();

    // Create verification record if evidence provided
    let verificationId: string | undefined;
    let verification: any = undefined;

    if (verification_method && evidence_url) {
      const verificationStrength = VERIFICATION_STRENGTH[verification_method] ?? 0;

      const verificationResult = await (supabase as any)
        .from('activity_verification')
        .insert({
          user_id: user.id,
          tier,
          verification_method,
          verification_strength: verificationStrength,
          evidence_url,
          evidence_metadata: evidence_metadata ?? {},
          verified: verification_method === 'on_platform', // Auto-verify on-platform
          verified_at: verification_method === 'on_platform' ? new Date().toISOString() : null,
          verified_by: verification_method === 'on_platform' ? 'auto' : null,
        })
        .select()
        .single();

      if (verificationResult.error) {
        console.error('[TrackActivity] Verification error:', verificationResult.error);
      } else {
        verificationId = verificationResult.data?.id;
        verification = verificationResult.data;
      }
    }

    // Create activity point record
    const activityResult = await (supabase as any)
      .from('activity_points')
      .insert({
        user_id: user.id,
        tier,
        points,
        activity_type,
        description,
        verification_id: verificationId,
        post_id,
        decay_timestamp: decayTimestamp.toISOString(),
      })
      .select()
      .single();

    if (activityResult.error) {
      console.error('[TrackActivity] Activity error:', activityResult.error);
      return NextResponse.json(
        { error: 'Failed to track activity' },
        { status: 500 },
      );
    }

    // Return response
    const response: TrackActivityResponse = {
      activity_point: activityResult.data as any,
      verification,
      points_earned: points,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[TrackActivity] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
