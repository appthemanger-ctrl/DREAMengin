
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json();
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await s.from('feed_items').update({
    saved_by_user: true,
    retained_until: new Date(Date.now()+24*3600*1000).toISOString()
  }).eq('id', body.id).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
