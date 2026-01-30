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
    envCheck('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Set this in Vercel → Project → Settings → Environment Variables.'),
    envCheck('SUPABASE_SERVICE_ROLE_KEY', 'Optional unless you use server-side admin actions.'),
    envCheck('HORIZON_LEDGER_SECRET', 'Optional: makes the firewall ledger cookie tamper-resistant.'),
    envCheck('HORIZON_CSP_FRAME_SRC', 'Optional: add extra iframe origins (space-separated) for embeds.'),
  ];

  const ok = checks.every((c) => c.ok || c.key === 'SUPABASE_SERVICE_ROLE_KEY' || c.key.startsWith('HORIZON_'));

  return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() });
}
