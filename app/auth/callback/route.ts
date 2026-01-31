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
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (session?.user && !sessionError) {
      // Check if profile exists, if not create one
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()
      
      if (!existingProfile) {
        // Generate a unique handle from email or random string
        const emailPrefix = session.user.email?.split('@')[0] || 'user'
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const handle = `${emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '')}${randomSuffix}`
        
        await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            handle,
            display_name: emailPrefix,
          })
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
