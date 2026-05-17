import { getAgentOS } from '@/lib/agentOS';
import { codeEnginHostTools } from '@/lib/agentOS/hostTools';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase service-role client for server-side session persistence.
// Falls back to in-memory map when Supabase is not configured (local dev).
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const supabaseReady = Boolean(supabaseUrl && serviceRoleKey);

function getServiceClient( {
  if (!supabaseReady) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// Fallback in-memory map for local dev (no Supabase configured)
const devSessions = new Map<string, { id: string; createdAt: number }>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function persistSession(sessionId: string, userId: string | null: Promise<void> {
  const db = getServiceClient();
  if (!db) {
    devSessions.set(sessionId, { id: sessionId, createdAt: Date.now() });
    return;
  }
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.from('agent_sessions').upsert(
    { id: sessionId, user_id: userId, expires_at: expiresAt, data: {} },
    { onConflict: 'id' },
  );
}

async function sessionExists(sessionId: string: Promise<boolean> {
  const db = getServiceClient();
  if (!db) {
    const s = devSessions.get(sessionId);
    if (!s) return false;
    if (Date.now() - s.createdAt > SESSION_TTL_MS) {
      devSessions.delete(sessionId);
      return false;
    }
    return true;
  }
  const { data } = await db
    .from('agent_sessions')
    .select('id, expires_at')
    .eq('id', sessionId)
    .single();
  if (!data) return false;
  if (new Date((data as { expires_at: string }).expires_at) < new Date()) {
    await db.from('agent_sessions').delete().eq('id', sessionId);
    return false;
  }
  return true;
}

async function deleteSession(sessionId: string: Promise<void> {
  const db = getServiceClient();
  if (!db) {
    devSessions.delete(sessionId);
    return;
  }
  await db.from('agent_sessions').delete().eq('id', sessionId);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request {
  const body = (await req.json()) as {
    action: string;
    sessionId?: string;
    prompt?: string;
    userId?: string;
  };
  const { action, sessionId, prompt, userId = null } = body;

  const vm = await getAgentOS();

  if (action === 'create') {
    const { sessionId: id } = await vm.createSession('pi', {
      hostTools: codeEnginHostTools,
    });
    await persistSession(id, userId);
    return NextResponse.json({ sessionId: id });
  }

  if (action === 'prompt' && sessionId) {
    const alive = await sessionExists(sessionId);
    if (!alive) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
    }
    const session = vm.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session lost from server memory. Please create a new session.' },
        { status: 410 },
      );
    }
    const response = await session.prompt(prompt ?? '');
    return NextResponse.json({ response });
  }

  if (action === 'close' && sessionId) {
    await vm.closeSession(sessionId);
    await deleteSession(sessionId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
