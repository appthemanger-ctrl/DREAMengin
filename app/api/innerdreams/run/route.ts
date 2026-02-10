// app/api/innerdreams/run/route.ts
// DREAMENGIN AI SYSTEM v2026.0 - iDari/InnerDreams Agent Endpoint
// Admin-facing AI agent - diagnostics and proposals only

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import {
  IDariRunRequest,
  IDariRunResponse,
  Intent,
} from '@/types/ai-system';
import { buildActorContext } from '@/lib/ai/capability-gate';
import { verifyIntents } from '@/lib/ai/boogie-verifier';
import { checkRateLimit, getCurrentRPM } from '@/lib/ai/rate-limiter';
import { writeAuditLog } from '@/lib/ai/audit';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

// iDari PLANNER (Placeholder - In production, call OpenAI/Claude)
async function idariPlanner(
  message: string,
  actor: any,
  ui: any
): Promise<{ response_text: string; intents: Intent[] }> {
  const response_text = `[iDari Admin Agent] Analyzing: "${message}"`;
  const intents: Intent[] = [];
  
  if (message.toLowerCase().includes('schema') || message.toLowerCase().includes('database')) {
    intents.push({
      intent_id: uuidv4(),
      type: 'DIAG_SCHEMA_SNAPSHOT',
      payload: { include_policies: true },
      confidence: 0.9,
      requires_confirmation: false,
      rationale: 'Generating database schema snapshot',
      idempotency_key: `diag-schema-${Date.now()}`,
    });
  }
  
  if (message.toLowerCase().includes('rls') || message.toLowerCase().includes('policies')) {
    intents.push({
      intent_id: uuidv4(),
      type: 'DIAG_RLS_SNAPSHOT',
      payload: {},
      confidence: 0.9,
      requires_confirmation: false,
      rationale: 'Checking RLS policies',
      idempotency_key: `diag-rls-${Date.now()}`,
    });
  }
  
  if (message.toLowerCase().includes('env') || message.toLowerCase().includes('environment')) {
    intents.push({
      intent_id: uuidv4(),
      type: 'DIAG_ENV_CHECKLIST',
      payload: {},
      confidence: 0.9,
      requires_confirmation: false,
      rationale: 'Checking environment configuration',
      idempotency_key: `diag-env-${Date.now()}`,
    });
  }
  
  return { response_text, intents };
}

// POST /api/innerdreams/run
export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const request = body as Partial<IDariRunRequest>;

  if (!request.message || typeof request.message !== 'string') {
    return jsonError(400, 'MISSING_MESSAGE', 'Request must include a message string.');
  }

  if (!request.ui) {
    return jsonError(400, 'MISSING_UI', 'Request must include UI context.');
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return jsonError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  const actor = await buildActorContext(user.id);

  if (actor.role !== 'admin') {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'idari',
      ok: false,
      error_code: 'FORBIDDEN',
      latency_ms: Date.now() - requestStart,
    });

    return jsonError(403, 'FORBIDDEN', 'Admin access required.');
  }

  const rateLimitCheck = await checkRateLimit(user.id, '/api/innerdreams/run');
  if (!rateLimitCheck.allowed) {
    return jsonError(429, 'RATE_LIMIT', 'Too many requests. Please slow down.', {
      resetAt: rateLimitCheck.resetAt,
    });
  }

  const rpm = await getCurrentRPM(user.id, '/api/innerdreams/run');
  const { response_text, intents } = await idariPlanner(
    request.message,
    actor,
    request.ui
  );

  if (!Array.isArray(intents) || intents.length === 0) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'idari',
      ok: true,
      latency_ms: Date.now() - requestStart,
    });

    return NextResponse.json({
      response_text,
      proposed_intents: [],
      boogie_decisions: [],
    });
  }

  const boogieOutput = await verifyIntents(
    request_id,
    intents,
    actor,
    'idari',
    request.message,
    rpm
  );

  if (boogieOutput.global.hard_block) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'boogieman',
      ok: false,
      error_code: 'HARD_BLOCK',
      latency_ms: Date.now() - requestStart,
    });

    return jsonError(403, 'BLOCKED', 'Request blocked by security policy.', {
      cooldown_seconds: boogieOutput.global.cooldown_seconds,
    });
  }

  const allowedIntents = intents.filter((intent, idx) => {
    const decision = boogieOutput.per_intent[idx];
    return decision.decision === 'ALLOW' || decision.decision === 'CONFIRM';
  });

  const allowedDecisions = boogieOutput.per_intent.filter(
    (d) => d.decision === 'ALLOW' || d.decision === 'CONFIRM'
  );

  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'idari',
    ok: true,
    latency_ms: Date.now() - requestStart,
  });

  const response: IDariRunResponse = {
    response_text,
    proposed_intents: allowedIntents,
    boogie_decisions: allowedDecisions,
  };

  return NextResponse.json(response);
}
