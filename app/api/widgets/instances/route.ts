// app/api/widgets/instances/route.ts
// Widget System V2 — surface instance listing + instance mutation

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { Surface } from '@/types/widget-system-v2';

export const dynamic = 'force-dynamic';

type SurfaceName = 'HOME' | 'FACE' | 'PROFILE' | 'DOCK';

const QuerySchema = z.object({
  // Preferred (v2):
  surface: z.enum(['HOME', 'FACE', 'PROFILE', 'DOCK']).optional(),
  surface_key: z.coerce.number().int().optional(),

  // Legacy (v1):
  space: z.enum(['home', 'profile']).optional(),
});

function toSurface(name: SurfaceName): Surface {
  switch (name) {
    case 'HOME':
      return Surface.HOME;
    case 'FACE':
      return Surface.FACE;
    case 'PROFILE':
      return Surface.PROFILE;
    case 'DOCK':
      return Surface.DOCK;
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parseResult = QuerySchema.safeParse({
      surface: searchParams.get('surface') ?? undefined,
      surface_key: searchParams.get('surface_key') ?? undefined,
      space: searchParams.get('space') ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const q = parseResult.data;

    // Resolve (surface, key) with legacy compatibility.
    let surfaceName: SurfaceName = 'HOME';
    let surfaceKey = 0;

    if (q.surface) {
      surfaceName = q.surface;
      surfaceKey = q.surface_key ?? 0;
    } else if (q.space) {
      surfaceName = q.space === 'profile' ? 'PROFILE' : 'HOME';
      surfaceKey = 0;
    }

    if (surfaceName === 'FACE' && (q.surface_key == null || !Number.isFinite(q.surface_key))) {
      return NextResponse.json({ error: 'surface_key is required for FACE' }, { status: 400 });
    }

    const surface = toSurface(surfaceName);

    const query = supabase
      .from('widget_instances')
      .select(
        `
        *,
        widget_definitions!inner(*)
      `
      )
      .eq('owner_id', user.id)
      .eq('surface', surface)
      .eq('surface_key', surfaceKey)
      .order('focus_rank', { ascending: true })
      .order('z_index', { ascending: false })
      .limit(64);

    const { data, error } = await query;

    if (error) {
      console.error('[widgets/instances] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 });
    }

    return NextResponse.json(
      { items: data ?? [] },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[widgets/instances] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH /api/widgets/instances ──────────────────────────────────────────────
// Persist focus_rank (reorder), visibility, and/or transform for a single
// widget instance owned by the authenticated user.
//
// Body (JSON):
//   instance_id  — UUID of the widget_instances row (required)
//   focus_rank   — integer sort order (optional)
//   visibility   — 'private' | 'public' | 'followers' (optional)
//   transform_x  — float (optional)
//   transform_y  — float (optional)
//   z_index      — integer (optional)
//
// AXIOM 4: all writes are authenticated + owner-checked server-side.
// The DB UPDATE RLS policy additionally enforces owner_id = auth.uid().

const PatchBodySchema = z.object({
  instance_id: z.string().uuid('instance_id must be a valid UUID'),
  focus_rank: z.number().int().min(0).optional(),
  visibility: z.enum(['private', 'public', 'followers']).optional(),
  transform_x: z.number().optional(),
  transform_y: z.number().optional(),
  z_index: z.number().int().optional(),
}).refine(
  (d) =>
    d.focus_rank !== undefined ||
    d.visibility !== undefined ||
    d.transform_x !== undefined ||
    d.transform_y !== undefined ||
    d.z_index !== undefined,
  { message: 'At least one mutable field must be provided' },
);

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = PatchBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { instance_id, focus_rank, visibility, transform_x, transform_y, z_index } =
      parseResult.data;

    // Build the update payload — only include provided fields.
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (focus_rank !== undefined) patch.focus_rank = focus_rank;
    if (visibility !== undefined) patch.visibility = visibility;
    if (transform_x !== undefined) patch.transform_x = transform_x;
    if (transform_y !== undefined) patch.transform_y = transform_y;
    if (z_index !== undefined) patch.z_index = z_index;

    // RLS enforces owner_id = auth.uid() on UPDATE, but we filter here too so
    // we can distinguish "not found / not owned" (404) from other errors.
    const { data, error } = await supabase
      .from('widget_instances')
      .update(patch)
      .eq('instance_id', instance_id)
      .eq('owner_id', user.id)
      .select('instance_id, focus_rank, visibility, transform_x, transform_y, z_index, updated_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PostgREST: "The result contains 0 rows" — not found or not owned.
        return NextResponse.json(
          { error: 'Widget instance not found or access denied' },
          { status: 404 },
        );
      }
      console.error('[widgets/instances PATCH] DB error:', error);
      return NextResponse.json({ error: 'Failed to update widget instance' }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 200 });
  } catch (error) {
    console.error('[widgets/instances PATCH] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
