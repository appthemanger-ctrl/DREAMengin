// app/api/auth/signout/route.js
import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';

export async function POST() {
  const s = supaServer();
  await s.auth.signOut();
  return NextResponse.json({ ok: true });
}
