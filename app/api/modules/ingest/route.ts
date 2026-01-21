
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
import { connectorModules } from '@/lib/modules/registry.gen';

export async function POST() {
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const tasks = connectorModules.map(c => c.impl?.ingest?.({ userId: user.id }));
  await Promise.allSettled(tasks);
  return NextResponse.json({ ok: true, ran: connectorModules.length });
}
