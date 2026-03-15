import { NextResponse } from 'next/server';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET,
} from '@/lib/supabase/env';

type Check = {
  key: string;
  ok: boolean;
  hint?: string;
  note?: string;
  required?: boolean;
};

/**
 * GET /api/setup/check
 *
 * Reports whether required env vars are resolved — does NOT return values.
 * Uses the centralised lib/supabase/env.ts resolver so every naming
 * convention is checked correctly, not just the first hardcoded name.
 */
export async function GET() {
  const checks: Check[] = [
    {
      key: 'SUPABASE_URL',
      ok: Boolean(SUPABASE_URL),
      hint: SUPABASE_URL
        ? undefined
        : 'Set NEXT_PUBLIC_SUPABASE_URL in Vercel → Project → Settings → Environment Variables.',
      note: 'Accepted names: NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_dreamengin_SUPABASE_URL · dreamengin_SUPABASE_URL',
      required: true,
    },
    {
      key: 'SUPABASE_ANON_KEY',
      ok: Boolean(SUPABASE_ANON_KEY),
      hint: SUPABASE_ANON_KEY
        ? undefined
        : 'Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Project → Settings → Environment Variables.',
      note: 'Accepted names: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY · NEXT_PUBLIC_SUPABASE_ANON_KEY · NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY · NEXT_PUBLIC_dreamengin_SUPABASE_PUBLISHABLE_KEY · dreamengin_SUPABASE_ANON_KEY',
      required: true,
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      ok: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      hint: 'Optional – set dreamengin_SUPABASE_SECRET_KEY or dreamengin_SUPABASE_SERVICE_ROLE_KEY for admin features.',
      note: 'Accepted names: dreamengin_SUPABASE_SECRET_KEY · dreamengin_SUPABASE_SERVICE_ROLE_KEY · SUPABASE_SERVICE_ROLE_KEY',
      required: false,
    },
    {
      key: 'SUPABASE_JWT_SECRET',
      ok: Boolean(SUPABASE_JWT_SECRET),
      hint: 'Optional – set dreamengin_SUPABASE_JWT_SECRET for JWT verification.',
      required: false,
    },
    {
      key: 'INNERDREAMS_PASSWORD',
      ok: Boolean(process.env.INNERDREAMS_PASSWORD),
      hint: 'Required for /api/admin/* endpoints.',
      required: false,
    },
    {
      key: 'ADMIN_UNLOCK_KEY',
      ok: Boolean(process.env.ADMIN_UNLOCK_KEY),
      hint: 'Required to unlock admin lockout.',
      required: false,
    },
    {
      key: 'SESSION_SECRET',
      ok: Boolean(process.env.SESSION_SECRET),
      hint: 'Required for session management.',
      required: false,
    },
    {
      key: 'OPENAI_API_KEY',
      ok: Boolean(process.env.OPENAI_API_KEY),
      hint: 'Required for OpenAI-powered features.',
      required: false,
    },
    {
      key: 'GOOGLE_OAUTH_CLIENT_ID',
      ok: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
      hint: 'Google OAuth client ID — configure in Supabase Auth → Providers → Google. See /api/setup/google-oauth for setup instructions.',
      required: false,
    },
  ];

  const ok = checks.filter(c => c.required !== false).every(c => c.ok);

  return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() });
}
