
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { provider, account_id } = await req.json();
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await s.from('connection_accounts')
    .update({ status: 'disconnected' })
    .eq('user_id', user.id).eq('provider', provider).eq('account_id', account_id);
  return NextResponse.json({ ok: true });
}
