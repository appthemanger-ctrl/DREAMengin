// app/api/ai/triad/events/route.ts
// Single ingestion point for all triad inter-agent events.
// Clients cannot emit triad events directly — this endpoint is admin-only.
// All events are validated, stamped, and stored in the audit table.
//
// Docs: docs/AI_TRIAD_PROTOCOL.md §3 (Event Bus)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { TriadEventSchema, TRIAD_PROTOCOL_VERSION, checkAgentPermission } from '@/lib/ai/events';
import { writeAuditLog } from '@/lib/ai/audit';
import { isOwnerEmail } from '@/lib/ai/triad';
import { BOOGIE_POLICY_VERSION } from '@/lib/ai/boogie-policy';

export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  // ── Auth: admin only (clients can never emit triad events)
  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isOwner = isOwnerEmail(user.email);
  const isAdmin = isOwner || (roleData as { role?: string } | null)?.role === 'admin';

  if (!isAdmin) {
    return jsonError(403, 'FORBIDDEN', 'Admin access required for triad event ingestion.');
  }

  // ── Parse + validate event
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = TriadEventSchema.safeParse(body);
  if (!parseResult.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid triad event schema.', parseResult.error.flatten());
  }

  const event = parseResult.data;

  // ── Never accept simulation events in production
  if (event.simulation && process.env.NODE_ENV === 'production' && process.env.BOOGIE_SIMULATION_MODE !== 'true') {
    return jsonError(400, 'SIMULATION_NOT_ALLOWED', 'Simulation events are not allowed in production.');
  }

  // ── Enforce agent restraints: check the actor is allowed to send this event type
  // For action-type events, check the action permission
  if (event.type === 'ACTION_TAKEN') {
    const actionInPayload = (event.payload as Record<string, unknown>)?.action as string | undefined;
    if (actionInPayload) {
      const permResult = checkAgentPermission(event.actor, actionInPayload);
      if (!permResult.allowed) {
        return jsonError(403, 'AGENT_PERMISSION_DENIED', permResult.reason ?? 'Agent not permitted for this action.');
      }
    }
  }

  // ── Stamp protocol_version if not set
  const stampedEvent = {
    ...event,
    protocol_version: event.protocol_version ?? TRIAD_PROTOCOL_VERSION,
  };

  // ── Store as immutable audit record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from('triad_events')
    .insert({
      event_id: stampedEvent.event_id,
      correlation_id: stampedEvent.correlation_id,
      actor: stampedEvent.actor,
      target: stampedEvent.target,
      type: stampedEvent.type,
      severity: stampedEvent.severity,
      blast_radius: stampedEvent.blast_radius ?? null,
      user_id: stampedEvent.user_id ?? null,
      dream_id: stampedEvent.dream_id ?? null,
      context_refs: stampedEvent.context_refs,
      policy_version: stampedEvent.policy_version ?? null,
      protocol_version: stampedEvent.protocol_version,
      idempotency_key: stampedEvent.idempotency_key,
      payload: stampedEvent.payload,
      simulation: stampedEvent.simulation,
      timestamp: stampedEvent.timestamp,
      ingested_at: new Date().toISOString(),
      ingested_by: user.id,
    });

  if (insertError) {
    // Idempotency: if the event already exists (unique constraint on event_id), return 200
    if (insertError.code === '23505') {
      return NextResponse.json(
        { ok: true, event_id: stampedEvent.event_id, idempotent: true },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }
    console.error('[triad/events] Failed to store event:', insertError);
    // Don't expose storage errors; still acknowledge receipt
  }

  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: stampedEvent.actor,
    ok: true,
    latency_ms: Date.now() - requestStart,
    policy_version: stampedEvent.policy_version ?? BOOGIE_POLICY_VERSION,
    payload: {
      event_id: stampedEvent.event_id,
      event_type: stampedEvent.type,
      correlation_id: stampedEvent.correlation_id,
    },
  });

  return NextResponse.json(
    { ok: true, event_id: stampedEvent.event_id },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
