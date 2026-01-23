import { NextResponse } from 'next/server';
import { supaServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const form = await req.formData();
  const email = String(form.get('email') || '').trim();
  if (!email) return NextResponse.redirect(new URL('/login?e=missing', req.url));

  try {
    const s = supaServer();
    const { error } = await s.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
    return NextResponse.redirect(new URL('/login?sent=1', req.url));
  } catch (e) {
    return NextResponse.redirect(new URL('/login?e=send', req.url));
  }
}
