import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password are required' }, { status: 400 });
    }
    const supabase = supaServer();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, session: data.session ?? null });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
