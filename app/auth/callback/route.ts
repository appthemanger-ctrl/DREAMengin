import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Handles Supabase magic-link/OAuth redirects.
// Supabase redirects here with a `code` param (PKCE). We exchange it for a session and bounce into /home.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  // Preserve an explicit redirect target if provided.
  const next = url.searchParams.get('next') || '/home'

  if (code) {
    const supabase = await createServerClient()
    // exchangeCodeForSession writes the auth cookies via our server client
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
