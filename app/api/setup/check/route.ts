import { NextResponse } from 'next/server';
import { getSetupStatus } from '@/lib/setup/checks';

/**
 * GET /api/setup/check
 *
 * Reports whether required env vars are resolved — does NOT return values.
 * Uses the centralised lib/supabase/config.ts resolver.
 */
export async function GET( ){
  const { ok, checks } = getSetupStatus();

  return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() });
}