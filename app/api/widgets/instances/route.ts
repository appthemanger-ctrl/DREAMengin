// app/api/widgets/instances/route.ts
// Widget System V2 — surface instance listing

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

// ── PUT — upsert widget instances for a surface ────────────────────────────────

const WidgetPutSchema = z.object({
  surface: z.string().default('PROFILE'),
  widgets: z.array(z.object({
    id: z.string().optional(),
    type: z.string(),
    size: z.string().optional(),
    config: z.record(z.unknown()).optional(),
    visibility: z.enum(['private', 'followers', 'public']).optional().default('private'),
  })),
});

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parseResult = WidgetPutSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid body', details: parseResult.error.flatten() }, { status: 400 });
    }

    const { widgets } = parseResult.data;
    const surface = Surface.PROFILE;
    const surfaceKey = 0;

    // Build upsert rows
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const rows = widgets.map((w, idx) => ({
      ...(w.id && UUID_RE.test(w.id) ? { id: w.id } : {}),
      owner_id: user.id,
      surface,
      surface_key: surfaceKey,
      widget_slug: w.type,
      config: w.config ?? {},
      visibility: w.visibility ?? 'private',
      focus_rank: idx,
      z_index: widgets.length - idx,
    }));

    // Get existing IDs to find deletions
    const { data: existing } = await supabase
      .from('widget_instances')
      .select('id')
      .eq('owner_id', user.id)
      .eq('surface', surface)
      .eq('surface_key', surfaceKey);

    const submittedIds = new Set(rows.filter(r => r.id).map(r => r.id));
    const toDelete = (existing ?? [])
      .map(r => r.id as string)
      .filter(id => !submittedIds.has(id));

    // Upsert
    const { error: upsertError } = await supabase
      .from('widget_instances')
      .upsert(rows, { onConflict: 'id' });

    if (upsertError) {
      console.error('[widgets/instances PUT] Upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to save widgets' }, { status: 500 });
    }

    // Delete removed widgets
    if (toDelete.length > 0) {
      await supabase
        .from('widget_instances')
        .delete()
        .in('id', toDelete);
    }

    return NextResponse.json({ ok: true, count: rows.length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[widgets/instances PUT] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
