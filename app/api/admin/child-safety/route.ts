// app/api/admin/child-safety/route.ts
// Admin endpoint for child safety incident review queue and hash registry management.
//
// GET  /api/admin/child-safety?status=PENDING_REVIEW   — fetch incident queue
// POST /api/admin/child-safety/review                  — update incident status
// POST /api/admin/child-safety/hashes                  — add known-bad hashes to registry
//
// Access: admin + owner only.

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { isOwnerEmail } from '@/lib/ai/triad';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = [
  'PENDING_REVIEW',
  'NCMEC_SUBMITTED',
  'NCMEC_SUBMISSION_FAILED',
  'REVIEWED_ACTIONED',
  'REVIEWED_DISMISSED',
] as const;

// ============================================================================
// GET — fetch incident review queue
// ============================================================================

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');

  const { data: roleData } = await (supabase as any)
    .from('user_roles').select('role').eq('user_id', user.id).single();
  const isOwner = isOwnerEmail(user.email);
  const isAdmin = isOwner || (roleData as { role?: string } | null)?.role === 'admin';
  if (!isAdmin) return jsonApiError(403, 'FORBIDDEN', 'Admin access required.');

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'PENDING_REVIEW';
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const { data: incidents, error } = await (supabase as any)
    .from('child_safety_incidents')
    .select('id, created_at, rule_code, category, severity, confidence, signal_count, surface, status, ncmec_report_id, ncmec_error, reported_at, hash_match, reported_user_id, reporter_user_id')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return jsonApiError(500, 'DB_ERROR', error.message);

  return NextResponse.json(
    { incidents, count: incidents?.length ?? 0 },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// ============================================================================
// POST — review incident OR add hashes (discriminated by action field)
// ============================================================================

const ReviewBodySchema = z.object({
  action: z.literal('review'),
  incident_id: z.string().uuid(),
  status: z.enum(VALID_STATUSES),
  notes: z.string().max(2000).optional(),
});

const AddHashesBodySchema = z.object({
  action: z.literal('add_hashes'),
  hashes: z.array(
    z.object({
      hash_sha256: z.string().regex(/^[0-9a-f]{64}$/i),
      source: z.string().max(64).default('NCMEC'),
      content_type: z.enum(['image', 'video', 'audio', 'file']).default('image'),
      notes: z.string().max(500).optional(),
    }),
  ).min(1).max(500),
});

const AdminBodySchema = z.discriminatedUnion('action', [ReviewBodySchema, AddHashesBodySchema]);

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');

  const { data: roleData } = await (supabase as any)
    .from('user_roles').select('role').eq('user_id', user.id).single();
  const isOwner = isOwnerEmail(user.email);
  const isAdmin = isOwner || (roleData as { role?: string } | null)?.role === 'admin';
  if (!isAdmin) return jsonApiError(403, 'FORBIDDEN', 'Admin access required.');

  let body: unknown;
  try { body = await req.json(); } catch { return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.'); }

  const parsed = AdminBodySchema.safeParse(body);
  if (!parsed.success) return jsonApiError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());

  const data = parsed.data;

  // ── Review an incident ─────────────────────────────────────────────────
  if (data.action === 'review') {
    const { error } = await (supabase as any)
      .from('child_safety_incidents')
      .update({
        status: data.status,
        reviewer_id: user.id,
        reviewer_notes: data.notes ?? null,
      })
      .eq('id', data.incident_id);

    if (error) return jsonApiError(500, 'DB_ERROR', error.message);

    return NextResponse.json({ ok: true, incident_id: data.incident_id, status: data.status });
  }

  // ── Add known-bad hashes ───────────────────────────────────────────────
  if (data.action === 'add_hashes') {
    const rows = data.hashes.map((h) => ({
      hash_sha256: h.hash_sha256.toLowerCase(),
      source: h.source,
      content_type: h.content_type,
      notes: h.notes ?? null,
      added_by: user.id,
    }));

    const { data: inserted, error } = await (supabase as any)
      .from('child_safety_hash_registry')
      .upsert(rows, { onConflict: 'hash_sha256', ignoreDuplicates: true })
      .select('id');

    if (error) return jsonApiError(500, 'DB_ERROR', error.message);

    return NextResponse.json({
      ok: true,
      inserted_count: inserted?.length ?? 0,
      submitted_count: rows.length,
    });
  }

  return jsonApiError(400, 'UNKNOWN_ACTION', 'Unknown action.');
}
