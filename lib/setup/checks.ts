import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} from '@/lib/supabase/config';

export type SetupCheck = {
  key: string;
  ok: boolean;
  hint?: string;
  note?: string;
  required?: boolean;
};

export interface SetupCheckSummary {
  ok: boolean;
  checks: SetupCheck[];
  requiredPassed: number;
  requiredTotal: number;
  optionalPassed: number;
  optionalTotal: number;
  missingRequired: SetupCheck[];
  missingOptional: SetupCheck[];
}

/**
 * Reports whether required env vars are resolved — does NOT return values.
 * Uses the centralised lib/supabase/config.ts resolver.
 */
export function getSetupChecks(env: NodeJS.ProcessEnv = process.env): SetupCheck[] {
  return [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      ok: Boolean(SUPABASE_URL),
      hint: SUPABASE_URL
        ? undefined
        : 'Set NEXT_PUBLIC_SUPABASE_URL in Vercel → Project → Settings → Environment Variables.',
      note: 'Accepted names: NEXT_PUBLIC_SUPABASE_URL',
      required: true,
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      ok: Boolean(SUPABASE_PUBLISHABLE_KEY),
      hint: SUPABASE_PUBLISHABLE_KEY
        ? undefined
        : 'Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel → Project → Settings → Environment Variables.',
      note: 'Accepted names: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      required: true,
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      ok: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      hint: 'Optional – set SUPABASE_SERVICE_ROLE_KEY for admin features.',
      note: 'Accepted names: SUPABASE_SERVICE_ROLE_KEY',
      required: false,
    },
    {
      key: 'SUPABASE_JWT_SECRET',
      ok: Boolean(env.SUPABASE_JWT_SECRET),
      hint: 'Optional – set SUPABASE_JWT_SECRET for JWT verification.',
      required: false,
    },
    {
      key: 'IDARI_PASSWORD',
      ok: Boolean(env.IDARI_PASSWORD),
      hint: 'Required for /api/admin/* endpoints.',
      required: false,
    },
    {
      key: 'ADMIN_UNLOCK_KEY',
      ok: Boolean(env.ADMIN_UNLOCK_KEY),
      hint: 'Required to unlock admin lockout.',
      required: false,
    },
    {
      key: 'SESSION_SECRET',
      ok: Boolean(env.SESSION_SECRET),
      hint: 'Required for session management.',
      required: false,
    },
    {
      key: 'GROQ_API_KEY',
      ok: Boolean(env.GROQ_API_KEY || env.OPENAI_API_KEY),
      hint: 'Required for AI-powered features (prefer GROQ_API_KEY; OPENAI_API_KEY remains compatibility fallback).',
      required: false,
    },
    {
      key: 'GOOGLE_OAUTH_CLIENT_ID',
      ok: Boolean(env.GOOGLE_OAUTH_CLIENT_ID),
      hint: 'Google OAuth client ID — configure in Supabase Auth → Providers → Google. See /api/setup/google-oauth for setup instructions.',
      required: false,
    },
  ];
}

export function summarizeSetupChecks(checks: SetupCheck[]): SetupCheckSummary {
  const requiredChecks = checks.filter((check: Record<string, unknown>) => check.required !== false);
  const optionalChecks = checks.filter((check: Record<string, unknown>) => check.required === false);
  const missingRequired = requiredChecks.filter((check: Record<string, unknown>) => !check.ok);
  const missingOptional = optionalChecks.filter((check: Record<string, unknown>) => !check.ok);

  return {
    ok: missingRequired.length === 0,
    checks,
    requiredPassed: requiredChecks.length - missingRequired.length,
    requiredTotal: requiredChecks.length,
    optionalPassed: optionalChecks.length - missingOptional.length,
    optionalTotal: optionalChecks.length,
    missingRequired,
    missingOptional,
  };
}

export function getSetupStatus(env: NodeJS.ProcessEnv = process.env): SetupCheckSummary {
  return summarizeSetupChecks(getSetupChecks(env));
}