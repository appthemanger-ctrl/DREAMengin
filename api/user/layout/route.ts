import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LAYOUT = { home: { dreams: [] }, dreamspace: { dreams: [] }, hidden: [] };

function normalizeLayout(input: unknown ){
  const obj = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return {
    home: { dreams: Array.isArray(obj.home?.dreams) ? obj.home.dreams.filter((id: any) => typeof id === 'string') : [] },
    dreamspace: { dreams: Array.isArray(obj.dreamspace?.dreams) ? obj.dreamspace.dreams.filter((id: any) => typeof id === 'string') : [] },
    hidden: Array.isArray(obj.hidden) ? obj.hidden.filter((id: any) => typeof id === 'string') : [],
  };
}

export async function GET( ): Promise<Response> {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('user_layout')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, layout: DEFAULT_LAYOUT });
  }

  return NextResponse.json({ ok: true, layout: normalizeLayout((data as Record<string, unknown>)?.user_layout) });
}

export async function POST(req: NextRequest ): Promise<Response> {
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

  const bodyObject = body && typeof body === 'object' ? body as Record<string, unknown> : null;
  if (!bodyObject || !('layout' in bodyObject)) {
    return NextResponse.json({ ok: false, error: 'layout is required' }, { status: 400 });
  }

  const layout = normalizeLayout(bodyObject.layout);
  const { error } = await (supabase as SupabaseClient)
    .from('profiles')
    .update({ user_layout: layout })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, layout });
}