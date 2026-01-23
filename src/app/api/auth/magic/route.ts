import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const form = await request.formData()
  const email = String(form.get('email') || '')
  if (!email.includes('@')) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url))
  }
  // TODO: supabase.auth.signInWithOtp({ email })
  return NextResponse.redirect(new URL('/home?sent=1', request.url))
}
