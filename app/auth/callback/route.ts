import { NextRequest, NextResponse } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/home'

  const redirectUrl = new URL(next, url.origin)
  const res = NextResponse.redirect(redirectUrl)

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res
  }

  const supabase = createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet: any[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set({ name, value, ...(options ?? {}) })
        })
      },
    },
  })

  if (code) {
    const { data: { session }, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (session?.user && !sessionError) {
      const userId = session.user.id
      const emailPrefix = (session.user.email?.split('@')[0] || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 24)

      const randomSuffix = Math.random().toString(36).slice(2, 8)
      const handle = `${emailPrefix}${randomSuffix}`.slice(0, 32)

      await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            handle,
            display_name: emailPrefix || 'user',
          },
          { onConflict: 'id' }
        )
    }
  }

  return res
}
