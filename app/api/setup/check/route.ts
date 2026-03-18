import { NextResponse } from 'next/server';
import { getSetupStatus } from '@/lib/setup/checks';

/**
 * GET /api/setup/check
 *
 * Reports whether required env vars are resolved — does NOT return values.
 * Uses the centralised lib/supabase/env.ts resolver so every naming
 * convention is checked correctly, not just the first hardcoded name.
 */
export async function GET() {
  const { ok, checks } = getSetupStatus();

  return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() });
}
