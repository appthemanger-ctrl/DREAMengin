import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const SURFACE = {
  HOME: 0,
  FACE: 1,
} as const;

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const dreamId = body?.dreamData?.dream_id;
  const toRuntime = body?.toRuntime === 'FACE' ? 'FACE' : 'HOME';
  const position = body?.position && typeof body.position === 'object' ? body.position : {};
  if (body?.swap === true) {
    const { data: rows, error: readError } = await (supabase as any)
      .from('dream_instances')
      .select('instance_id,surface')
      .eq('owner_id', user.id)
      .in('surface', [SURFACE.HOME, SURFACE.FACE]);
    if (readError) {
      return NextResponse.json({ ok: false, error: readError.message }, { status: 500 });
    }
    const updates = (rows ?? []).map((row: any) => (supabase as any)
      .from('dream_instances')
      .update({ surface: row.surface === SURFACE.HOME ? SURFACE.FACE : SURFACE.HOME, updated_at: new Date().toISOString() })
      .eq('instance_id', row.instance_id)
      .eq('owner_id', user.id));
    const results = await Promise.all(updates);
    const failed = results.find((result: any) => result.error);
    if (failed?.error) {
      return NextResponse.json({ ok: false, error: failed.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, swapped: rows?.length ?? 0 });
  }
  if (typeof dreamId !== 'string') {
    return NextResponse.json({ ok: false, error: 'dream_id is required' }, { status: 400 });
  }

  const { error } = await (supabase as any)
    .from('dream_instances')
    .update({
      surface: SURFACE[toRuntime as keyof typeof SURFACE],
      surface_key: 0,
      transform_x: typeof position.x === 'number' ? position.x : 0,
      transform_y: typeof position.y === 'number' ? position.y : 0,
      updated_at: new Date().toISOString(),
    })
    .eq('instance_id', dreamId)
    .eq('owner_id', user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, dream_id: dreamId, runtime: toRuntime });
}
