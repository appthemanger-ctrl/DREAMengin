import { getAgentOS } from '@/lib/agentOS';
import { codeEnginHostTools } from '@/lib/agentOS/hostTools';
import { NextResponse } from 'next/server';

/**
 * In-process session store.
 * Move session IDs to Supabase for persistence across server restarts.
 */
const sessions = new Map<string, { id: string }>();

export async function POST(req: Request) {
  const body = await req.json() as {
    action: string;
    sessionId?: string;
    prompt?: string;
  };
  const { action, sessionId, prompt } = body;

  const vm = await getAgentOS();

  if (action === 'create') {
    const { sessionId: id } = await vm.createSession('pi', {
      hostTools: codeEnginHostTools,
    });
    sessions.set(id, { id });
    return NextResponse.json({ sessionId: id });
  }

  if (action === 'prompt' && sessionId) {
    const session = vm.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const response = await session.prompt(prompt ?? '');
    return NextResponse.json({ response });
  }

  if (action === 'close' && sessionId) {
    await vm.closeSession(sessionId);
    sessions.delete(sessionId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
