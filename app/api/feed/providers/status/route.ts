// GET /api/feed/providers/status
// Returns provider health for dev/admin inspection.
// Not exposed in production UI.

import { NextResponse } from 'next/server';
import { getAllProviderHealth } from '@/lib/feed/providers/index';
import { ensureProvidersRegistered } from '@/lib/feed/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureProvidersRegistered();

  const health = getAllProviderHealth();
  return NextResponse.json({ providers: health });
}
