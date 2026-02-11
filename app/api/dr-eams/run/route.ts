// app/api/dr-eams/run/route.ts
// DREAMENGIN AI SYSTEM v2026.0 - Dr. Eams Agent Endpoint (UPDATED)
// User-facing AI agent - JSON-only intents, NO direct execution

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { DrEamsRunBodySchema, IntentSchema, type Intent, type DrEamsRunResponse } from '@/lib/ai/schemas';
import { boogieEvaluate } from '@/lib/ai/boogieman';
import { makeConfirmToken } from '@/lib/ai/confirm';
import { writeAuditLog } from '@/lib/ai/audit';
import { checkRateLimit, getCurrentRPM } from '@/lib/ai/rateLimit';

export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

// ============================================================================
// DR. EAMS PLANNER (Placeholder - In production, call OpenAI/Claude)
// ============================================================================

async function drEamsPlanner(message: string): Promise<{ response_text: string; intents: Intent[] }> {
  // This is a placeholder that generates simple test intents
  // In production, this would call an LLM with a structured prompt
  
  const response_text = `I understand you want to: "${message}". Here's what I can help with.`;
  
  // Example: Parse simple commands
  const intents: Intent[] = [];
  
  if (message.toLowerCase().includes('open home menu')) {
    intents.push({
      intent_id: uuidv4(),
      type: 'HOME_MENU_OPEN',
      payload: {},
      confidence: 0.9,
      requires_confirmation: false,
      rationale: 'Opening home menu as requested',
      idempotency_key: `home-menu-${Date.now()}`,
    });
  }
  
  if (message.toLowerCase().includes('search')) {
    const query = message.replace(/search\s+(for\s+)?/i, '').trim();
    intents.push({
      intent_id: uuidv4(),
      type: 'SEARCH',
      payload: { query, scope: 'all' },
      confidence: 0.85,
      requires_confirmation: false,
      rationale: `Searching for: ${query}`,
      idempotency_key: `search-${query}-${Date.now()}`,
    });
  }
  
  if (message.toLowerCase().includes('create post')) {
    intents.push({
      intent_id: uuidv4(),
      type: 'POST_CREATE',
      payload: { content: message.replace(/create post/i, '').trim() },
      confidence: 0.75,
      requires_confirmation: true,
      rationale: 'Creating a new post',
      idempotency_key: `post-create-${Date.now()}`,
    });
  }
  
  return { response_text, intents };
}

// ============================================================================
// POST /api/dr-eams/run
// ============================================================================

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  // Parse request
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  // Validate with Zod
  const parseResult = DrEamsRunBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid request body', parseResult.error.flatten());
  }

  const request = parseResult.data;

  // Authenticate
  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    return jsonError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  const actorRole = roleData?.role || 'user';

  // Rate limit check
  const rateLimitCheck = await checkRateLimit(user.id, '/api/dr-eams/run', 60, 60);
  if (!rateLimitCheck.allowed) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'dr_eams',
      ok: false,
      error_code: 'RATE_LIMIT',
      latency_ms: Date.now() - requestStart,
    });

    return jsonError(429, 'RATE_LIMIT', 'Too many requests. Please slow down.', {
      retry_after_seconds: rateLimitCheck.retry_after_seconds,
    });
  }

  // Get current RPM for Boogie signals
  const rpm = await getCurrentRPM(user.id, '/api/dr-eams/run');

  // Call planner (LLM)
  const { response_text, intents } = await drEamsPlanner(request.message);

  // If planner failed to produce valid intents, return safe response
  if (!Array.isArray(intents) || intents.length === 0) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'dr_eams',
      ok: true,
      latency_ms: Date.now() - requestStart,
    });

    return NextResponse.json(
      {
        response_text,
        proposed_intents: [],
        boogie_decisions: [],
      } as DrEamsRunResponse,
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Validate intents against schema
  const validIntents = intents.filter(intent => IntentSchema.safeParse(intent).success);

  if (validIntents.length === 0) {
    return NextResponse.json(
      {
        response_text,
        proposed_intents: [],
        boogie_decisions: [],
      } as DrEamsRunResponse,
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Verify intents with Boogie Man
  const boogieOutput = boogieEvaluate({
    actorRole: actorRole as 'user' | 'admin',
    rateRpm: rpm,
    intents: validIntents,
  });

  // Check for global hard block
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

  // Filter to ALLOW and CONFIRM intents
  const allowedIntents = validIntents.filter((intent, idx) => {
    const decision = boogieOutput.per_intent[idx];
    return decision && (decision.decision === 'ALLOW' || decision.decision === 'CONFIRM');
  });

  const allowedDecisions = boogieOutput.per_intent.filter(
    (d) => d.decision === 'ALLOW' || d.decision === 'CONFIRM'
  );

  // Generate confirm token if any intents need confirmation
  let confirm_token: string | undefined;
  const needsConfirmation = allowedDecisions.some((d) => d.decision === 'CONFIRM');

  if (needsConfirmation) {
    confirm_token = makeConfirmToken({
      requestId: request_id,
      userId: user.id,
      ttlSeconds: 300, // 5 min expiry
    });
  }

  // Audit the request
  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'dr_eams',
    ok: true,
    latency_ms: Date.now() - requestStart,
  });

  const response: DrEamsRunResponse = {
    response_text,
    proposed_intents: allowedIntents,
    boogie_decisions: allowedDecisions,
    confirm_token,
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
