import { getSetupStatus } from '@/lib/setup/checks';
import { NextResponse } from 'next/server';

/**
 * GET /api/setup/check
 *
 * Reports whether required env vars are resolved — does NOT return values.
 * Uses the centralised lib/supabase/config.ts resolver.
 */
export async function GET( ): Promise<NextResponse> {
  const { ok, checks } = getSetupStatus();

  return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() });
}