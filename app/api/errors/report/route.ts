
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';
export async function POST(req: Request) {
  const { message, stack, path } = await req.json();
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  await s.from('error_reports').insert({
    reporter_id: user?.id ?? null,
    message, stack, path
  });
  return NextResponse.json({ ok: true });
}
