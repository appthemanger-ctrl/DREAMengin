import { NextResponse } from 'next/server';

type Check = {
  key: string;
  ok: boolean;
  hint?: string;
};

function envCheck(name: string, hint?: string): Check {
  const ok = !!process.env[name];
  return { key: name, ok, hint: ok ? undefined : hint };
}

export async function GET() {
  // This endpoint is intentionally safe:
  // - It does NOT return secret values
  // - It only reports whether expected config exists

  const checks: Check[] = [
    envCheck('NEXT_PUBLIC_SUPABASE_URL', 'Set this in Vercel → Project → Settings → Environment Variables.'),
    envCheck('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'Preferred key name. Set this in Vercel → Project → Settings → Environment Variables.'),
    envCheck('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Legacy key name. Use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY instead.'),
    envCheck('SUPABASE_SERVICE_ROLE_KEY', 'Optional unless you use server-side admin actions.'),
  ];

  // Overall status: true only if all required checks pass.
  // Note: we intentionally do NOT disclose secret values.
  // At least one of PUBLISHABLE_KEY or ANON_KEY must be set
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ok = !!process.env.NEXT_PUBLIC_SUPABASE_URL && hasKey;


  return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() });
}