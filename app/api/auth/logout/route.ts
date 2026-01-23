import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';

export async function POST() {
  const supabase = supaServer();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
