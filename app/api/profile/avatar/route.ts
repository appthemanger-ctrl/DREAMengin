
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
export async function POST(req: Request) {
  const { url } = await req.json();
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await s.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
