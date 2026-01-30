import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { evaluateHorizon } from '@/lib/security/horizon-firewall';

export const runtime = 'edge';

async function handle(req: NextRequest) {
  const res = NextResponse.json({ ok: true });

  // Supabase session refresh + cookie sync
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set({ name, value, ...options });
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  // Horizon firewall
  const verdict = await evaluateHorizon(req);

  res.headers.set('X-Horizon-Mode', verdict.mode);
  res.headers.set('X-Horizon-Decision', verdict.decision);

  if (verdict.setCookie) res.headers.append('Set-Cookie', verdict.setCookie);

  if (verdict.decision === 'block') {
    return new NextResponse('Blocked by Horizon Firewall', {
      status: 403,
      headers: res.headers,
    });
  }

  if (verdict.decision === 'challenge') {
    const delayMs = verdict.delayMs ?? 600;
    await new Promise((r) => setTimeout(r, delayMs));
  }

  return res;
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
