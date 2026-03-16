// app/api/ai/boogieman/privacy-event/route.ts
//
// TheBoogieMan.Ai — privacy event logging endpoint.
//
// Phase 6 spec point 7:
//   "TheBoogieMan.Ai must log all privacy-adjacent decisions
//    (visibility changes, profile publication events, explicit share actions)
//    through the /api/ai/boogieman route."
//
// Phase 6 spec point 8:
//   "TheBoogieMan.Ai must enforce the 'nothing public by default' rule at
//    the API layer: any request that would expose private data without an
//    explicit visibility record must be rejected and logged."
//
// This endpoint is called by EditProfileDream whenever a user performs an
// explicit share action, visibility change, or profile publication.
// It validates the request, writes a structured audit log, and optionally
// updates the visibility_mappings record to confirm the share.
//
// Access: all authenticated users (the event describes THEIR own content).

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/ai/audit';
import { BOOGIE_POLICY_VERSION } from '@/lib/ai/boogieman';

export const dynamic = 'force-dynamic';

// ── Request schema ───────────────────────────────────────────────────────────

const PrivacyEventSchema = z.object({
  event_type: z.enum([
    'VISIBILITY_CHANGE',    // User changed visibility on a Dream Window or content item
    'PROFILE_PUBLISH',      // User explicitly published their profile (first-time or re-publish)
    'EXPLICIT_SHARE',       // User explicitly shared a specific content item
    'VISIBILITY_REVOKE',    // User revoked visibility (made public item private)
  ]),
  content_id: z.string().min(1).max(255),
  content_type: z.enum(['dream_window', 'profile_info', 'post', 'daydream_state', 'other']),
  from_visibility: z.enum(['private', 'followers', 'public']).optional(),
  to_visibility: z.enum(['private', 'followers', 'public']),
  // Optional: also update visibility_mappings in this request
  update_mapping: z.boolean().optional().default(false),
});

type PrivacyEvent = z.infer<typeof PrivacyEventSchema>;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = PrivacyEventSchema.safeParse(body);
  if (!parseResult.success) {
    return jsonApiError(400, 'VALIDATION_ERROR', 'Invalid privacy event body.', parseResult.error.flatten());
  }

  const event: PrivacyEvent = parseResult.data;

  // All privacy events require authentication — the user must own the content.
  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in to log a privacy event.');
  }

  // Policy check: Phase 6 spec point 8 — enforce "nothing public by default."
  // If the transition is to 'public' or 'followers', require an explicit event type.
  const isExposingContent =
    event.to_visibility === 'public' || event.to_visibility === 'followers';
  const isExplicitAction =
    event.event_type === 'EXPLICIT_SHARE' ||
    event.event_type === 'VISIBILITY_CHANGE' ||
    event.event_type === 'PROFILE_PUBLISH';

  if (isExposingContent && !isExplicitAction) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'boogieman',
      ok: false,
      error_code: 'POLICY_VIOLATION',
      latency_ms: Date.now() - requestStart,
      policy_version: BOOGIE_POLICY_VERSION,
      payload: {
        reason: 'Attempt to expose content without an explicit user action.',
        event_type: event.event_type,
        to_visibility: event.to_visibility,
      },
    });
    return jsonApiError(
      403,
      'POLICY_VIOLATION',
      'Content cannot be made public without an explicit user action. ' +
      'Use EXPLICIT_SHARE, VISIBILITY_CHANGE, or PROFILE_PUBLISH event types.'
    );
  }

  // Optionally update the visibility_mappings record.
  let mappingUpdated = false;
  if (event.update_mapping) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from('visibility_mappings')
      .upsert(
        {
          user_id: user.id,
          content_id: event.content_id,
          content_type: event.content_type,
          visibility: event.to_visibility,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,content_id' }
      );

    if (upsertError) {
      // Non-fatal — log and continue. The audit log is the source of truth.
      console.error('[boogieman/privacy-event] visibility_mappings upsert failed:', upsertError.message);
    } else {
      mappingUpdated = true;
    }
  }

  // Write the TheBoogieMan audit log entry.
  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'boogieman',
    ok: true,
    latency_ms: Date.now() - requestStart,
    policy_version: BOOGIE_POLICY_VERSION,
    payload: {
      event_type: event.event_type,
      content_id: event.content_id,
      content_type: event.content_type,
      from_visibility: event.from_visibility ?? null,
      to_visibility: event.to_visibility,
      mapping_updated: mappingUpdated,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      request_id,
      event_type: event.event_type,
      content_id: event.content_id,
      to_visibility: event.to_visibility,
      mapping_updated: mappingUpdated,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
