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

  // Check if anon key is set
  const hasAnonKey = !!process.env.NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY;

  const checks: Check[] = [
    envCheck('NEXT_PUBLIC_dreamengin_SUPABASE_URL', 'Set this in Vercel → Project → Settings → Environment Variables.'),
    {
      key: 'NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY',
      ok: hasAnonKey,
      hint: hasAnonKey ? undefined : 'Set NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY in Vercel Environment Variables.',
      required: true,
    },
    envCheck('dreamengin_SUPABASE_SECRET_KEY', 'Optional unless you use server-side admin actions.', undefined, false),
    envCheck('dreamengin_SUPABASE_JWT_SECRET', 'Required for JWT verification.', undefined, false),
    envCheck('INNERDREAMS_PASSWORD', 'Required to access admin endpoints.', undefined, false),
    envCheck('ADMIN_UNLOCK_KEY', 'Required to unlock admin lockout.', undefined, false),
    envCheck('SESSION_SECRET', 'Required for session management.', undefined, false),
    envCheck('OPENAI_API_KEY', 'Required for OpenAI-powered features.', undefined, false),
  ];

  // Overall status: true only if all required checks pass.
  // Note: we intentionally do NOT disclose secret values.
  const ok = checks.filter(c => c.required !== false).every((c) => c.ok);


  return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() });
}