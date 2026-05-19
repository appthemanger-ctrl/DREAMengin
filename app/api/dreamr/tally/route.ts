/**
 * POST /api/dreamr/tally
 *
 * Records a DreamR publish/share tally event. Called by DreamRCore whenever
 * a 'create:published' bridge event fires — i.e. a user publishes content
 * from any Engin surface and the DreamR reactor picks it up.
 *
 * Body:
 *   { contentId: string, sharerId: string }
 *
 * Behaviour:
 *   1. Verify the caller is authenticated.
 *   2. Upsert a row in `dreamr_tally` (contentId, sharerId, tallied_at, viewer_id).
 *      If Supabase is unavailable the endpoint still returns 200 so the bridge
 *      event callback never throws and the UI stays alive.
 *   3. Return { ok: true, tallied: boolean }.
 *
 * Table: dreamr_tally
 *   id           uuid  PK default gen_random_uuid()
 *   content_id   text  NOT NULL
 *   sharer_id    text  NOT NULL
 *   viewer_id    text  NOT NULL
 *   tallied_at   timestamptz NOT NULL default now()
 *   UNIQUE (content_id, sharer_id, viewer_id)   ← idempotent upsert
 *
 * Privacy: only the viewer's own rows are written; no cross-user reads.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const TallyBodySchema = z.object({
  contentId: z.string().min(1).max(256),
  sharerId:  z.string().min(1).max(256),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse + validate body ─────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
  }

  const parsed = TallyBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { contentId, sharerId } = parsed.data;

  // ── 2. Auth ──────────────────────────────────────────────────────────────
  let viewerId: string;
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ ok: false, error: 'NOT_AUTHENTICATED' }, { status: 401 });
    }
    viewerId = user.id;

    // ── 3. Upsert tally row ───────────────────────────────────────────────
    // Upsert is idempotent: the same (content, sharer, viewer) triple only
    // ever writes one row. Re-publishing the same content just refreshes
    // tallied_at which is acceptable and keeps the table from bloating.
    const db = supabase as SupabaseClient;
    const { error: upsertErr } = await db
      .from('dreamr_tally')
      .upsert(
        {
          content_id:  contentId,
          sharer_id:   sharerId,
          viewer_id:   viewerId,
          tallied_at:  new Date().toISOString(),
        },
        { onConflict: 'content_id,sharer_id,viewer_id' },
      );

    if (upsertErr) {
      // Log but don't fail the caller — tally is best-effort so the bridge
      // event callback always resolves cleanly.
      console.warn('[dreamr/tally] upsert warning:', upsertErr.message);
    }
  } catch (err: any) {
    // Supabase unavailable (local dev without DB) — return ok:true so the
    // DreamRCore bridge callback doesn't surface an error to the UI.
    console.warn('[dreamr/tally] Supabase unavailable, skipping tally:', err);
    return NextResponse.json({ ok: true, tallied: false, note: 'db_unavailable' });
  }

  return NextResponse.json({ ok: true, tallied: true });
}