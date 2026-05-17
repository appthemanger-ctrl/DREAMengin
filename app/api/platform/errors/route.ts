import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerClient();
  const { data, error } = await (supabase as SupabaseClient)
    .from('platform_errors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, errors: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === 'string' ? body.message.slice(0, 2000) : 'Unknown platform error';
  const stack = typeof body.stack === 'string' ? body.stack.slice(0, 8000) : null;
  const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};
  const { error } = await (supabase as SupabaseClient).from('platform_errors').insert({
    user_id: user?.id ?? null,
    source: typeof body.source === 'string' ? body.source : 'client',
    message,
    stack,
    metadata,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
