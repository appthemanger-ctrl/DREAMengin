/**
 * POST /api/social/livekit/token
 *
 * Server-side LiveKit token generation. Validates the Supabase session,
 * then calls `lib/social/livekit.generateServerToken` which proxies to
 * the backend livekitService or the LiveKit server SDK.
 *
 * Body: { roomName: string; identity: string }
 * Response: { token: string; wsUrl: string; roomName: string; identity: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateServerToken, LiveKitError } from '@/lib/social/livekit';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { roomName, identity } = body as { roomName?: string; identity?: string };

  if (!roomName || typeof roomName !== 'string') {
    return NextResponse.json(
      { error: 'roomName is required' },
      { status: 400 }
    );
  }

  // Use the user's Supabase ID as the identity if none is supplied.
  const resolvedIdentity = identity ?? user.id;

  try {
    const token = await generateServerToken(roomName, resolvedIdentity);
    const wsUrl = process.env.LIVEKIT_WS_URL ?? 'wss://livekit.example.com';

    return NextResponse.json({
      token,
      wsUrl,
      roomName,
      identity: resolvedIdentity,
    });
  } catch (err) {
    if (err instanceof LiveKitError) {
      const status =
        err.code === 'CREDENTIALS_MISSING' ||
        err.code === 'UNAUTHORIZED'
          ? 503
          : 500;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}
