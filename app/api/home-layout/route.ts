// app/api/home-layout/route.ts
// Phase 8 §A Point 4 — Dream Window layout configuration for HomeDream Surface.
//
// GET  /api/home-layout  — Returns the authenticated user's HomeDream layout
// POST /api/home-layout  — Persists HomeDream Dream Window layout to DB
//
// Layout shape stored in profiles.home_layout:
//   {
//     slots: Array<{
//       id: string,
//       type: string,
//       title?: string,
//       position: number,
//       config?: Record<string, unknown>
//     }>
//   }
//
// Architecture: docs/ARCHITECTURE.md §3 — layout config in Supabase.
// Privacy (AXIOM 5): layout is user-scoped; RLS prevents cross-user reads.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface LayoutSlot {
  id: string;
  type: string;
  title?: string;
  position: number;
  config?: Record<string, unknown>;
}

interface HomeLayout {
  slots: LayoutSlot[];
}

function isValidSlot(s: unknown): s is LayoutSlot {
  if (!s || typeof s !== 'object') return false;
  const obj = s as Record<string, unknown>;
  return typeof obj.id === 'string' && typeof obj.type === 'string' && typeof obj.position === 'number';
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('home_layout')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

   
  const layout = ((data as any)?.home_layout as HomeLayout | null) ?? { slots: [] };
  return NextResponse.json({ ok: true, layout });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const b = body as Record<string, unknown> | null;
  if (!b || !Array.isArray(b.slots)) {
    return NextResponse.json({ ok: false, error: 'layout.slots must be an array' }, { status: 400 });
  }

  const slots: LayoutSlot[] = (b.slots as unknown[])
    .filter(isValidSlot)
    .map((s) => ({
      id:       s.id,
      type:     s.type,
      title:    s.title,
      position: s.position,
      config:   s.config,
    }));

  const layout: HomeLayout = { slots };

   
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ home_layout: layout })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, layout });
}
