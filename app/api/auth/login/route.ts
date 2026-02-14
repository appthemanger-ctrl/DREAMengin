import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        error:
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY).',
      },
      { status: 500 }
    )
  }

  let body: { email?: string; password?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const email = (body.email ?? '').trim()
  const password = body.password ?? ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })

  type CookieToSet = {
    name: string
    value: string
    options?: Parameters<typeof response.cookies.set>[2]
  }

  const supabase = createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async getAll() {
        const store = await cookies()
        return store.getAll()
      },
      async setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        code: (error as unknown as { code?: string }).code ?? null,
        status: (error as unknown as { status?: number }).status ?? null,
      },
      { status: 401 }
    )
  }

  return response
}
