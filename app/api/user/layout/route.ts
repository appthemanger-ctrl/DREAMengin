import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const DEFAULT_LAYOUT = { home: { dreams: [] }, dreamspace: { dreams: [] } };

function normalizeLayout(input: unknown) {
  const obj = input && typeof input === 'object' ? input as Record<string, any> : {};
  return {
    home: { dreams: Array.isArray(obj.home?.dreams) ? obj.home.dreams.filter((id: unknown) => typeof id === 'string') : [] },
    dreamspace: { dreams: Array.isArray(obj.dreamspace?.dreams) ? obj.dreamspace.dreams.filter((id: unknown) => typeof id === 'string') : [] },
  };
}

export async function GET() {
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

  return NextResponse.json({ ok: true, layout: normalizeLayout((data as any)?.user_layout) });
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

  const layout = normalizeLayout((body as Record<string, unknown>)?.layout ?? body);
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ user_layout: layout })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, layout });
}
