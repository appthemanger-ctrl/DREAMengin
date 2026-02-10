import { NextResponse } from 'next/server';

type Check = {
  key: string;
  ok: boolean;
  hint?: string;
  note?: string;
  required?: boolean;
};

function envCheck(name: string, hint?: string, note?: string, required = true): Check {
  const ok = !!process.env[name];
  return { key: name, ok, hint: ok ? undefined : hint, note, required };
}

export async function GET() {
  // This endpoint is intentionally safe:
  // - It does NOT return secret values
  // - It only reports whether expected config exists

  // Check if at least one of the publishable keys is set
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const hasLegacyKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasAnyKey = hasPublishableKey || hasLegacyKey;

  const checks: Check[] = [
    envCheck('NEXT_PUBLIC_SUPABASE_URL', 'Set this in Vercel → Project → Settings → Environment Variables.'),
    {
      key: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ok: hasAnyKey,
      hint: hasAnyKey ? undefined : 'Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy).',
      note: hasPublishableKey 
        ? 'Using preferred NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' 
        : hasLegacyKey 
        ? 'Using legacy NEXT_PUBLIC_SUPABASE_ANON_KEY. Consider migrating to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.' 
        : undefined,
      required: true,
    },
    envCheck('SUPABASE_SERVICE_ROLE_KEY', 'Optional unless you use server-side admin actions.', undefined, false),
  ];

  // Overall status: true only if all required checks pass.
  // Note: we intentionally do NOT disclose secret values.
  const ok = checks.filter(c => c.required).every((c) => c.ok);


  return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() });
}