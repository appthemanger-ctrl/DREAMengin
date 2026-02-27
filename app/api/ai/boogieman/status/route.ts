// app/api/ai/boogieman/status/route.ts
// TheBoogieMan.Ai — policy health endpoint (req 65).
// Dr. Eams queries this to surface enforcement status to users (req 66, 67).
// Public-read: returns ok/degraded/offline + current policy version.

import { NextResponse } from 'next/server';
import { BOOGIE_POLICY_VERSION } from '@/lib/ai/boogie-policy';

export const dynamic = 'force-dynamic';

export async function GET() {
  const simulationMode = process.env.BOOGIE_SIMULATION_MODE === 'true';

  // In production, Boogie is always "ok" unless an env flag marks it degraded.
  const forceDegraded = process.env.BOOGIE_DEGRADED === 'true';
  const forceOffline = process.env.BOOGIE_OFFLINE === 'true';

  const status = forceOffline ? 'offline' : forceDegraded ? 'degraded' : 'ok';

  return NextResponse.json(
    {
      status,
      policy_version: BOOGIE_POLICY_VERSION,
      simulation_mode: simulationMode,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
