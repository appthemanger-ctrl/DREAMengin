/**
 * GET /api/social/livekit/room?roomName=<name>
 *
 * Fetches current participant list for a LiveKit room from the backend service.
 * Returns 404 with an empty participant list when the room doesn't exist yet
 * so callers can treat "no room" as zero participants rather than an error.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { LiveKitRoomInfo } from '@/lib/social/livekit';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roomName = req.nextUrl.searchParams.get('roomName');
  if (!roomName) {
    return NextResponse.json(
      { error: 'roomName query param is required' },
      { status: 400 }
    );
  }

  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(
      `${backendUrl}/api/livekit/room?roomName=${encodeURIComponent(roomName)}`,
      { next: { revalidate: 5 } }
    );

    if (res.status === 404) {
      const empty: LiveKitRoomInfo = {
        roomName,
        participantCount: 0,
        participants: [],
        connectionState: 'disconnected',
      };
      return NextResponse.json(empty, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Backend unreachable — return empty room so UI degrades gracefully.
    const empty: LiveKitRoomInfo = {
      roomName,
      participantCount: 0,
      participants: [],
      connectionState: 'disconnected',
    };
    return NextResponse.json(empty, { status: 200 });
  }
}