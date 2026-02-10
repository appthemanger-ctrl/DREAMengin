// app/api/dr-eams/run/route.ts
// DREAMENGIN AI SYSTEM v2026.0 - Dr. Eams Agent Endpoint
// User-facing AI agent - JSON-only intents, NO direct execution

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import {
  DrEamsRunRequest,
  DrEamsRunResponse,
  Intent,
  ActorContext,
  UIContext,
} from '@/types/ai-system';
import { buildActorContext } from '@/lib/ai/capability-gate';
import { verifyIntents } from '@/lib/ai/boogie-verifier';
import { checkRateLimit, getCurrentRPM } from '@/lib/ai/rate-limiter';
import { generateConfirmToken, storeConfirmToken } from '@/lib/ai/confirm-token';
import { writeAuditLog } from '@/lib/ai/audit';

// Import handlers to ensure registration
import '@/lib/ai/handlers';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

// ============================================================================
// DR. EAMS PLANNER (Placeholder - In production, call OpenAI/Claude)
// ============================================================================

async function drEamsPlanner(
  message: string,
  actor: ActorContext,
  ui: UIContext
): Promise<{ response_text: string; intents: Intent[] }> {
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

  const request = body as Partial<DrEamsRunRequest>;

  if (!request.message || typeof request.message !== 'string') {
    return jsonError(400, 'MISSING_MESSAGE', 'Request must include a message string.');
  }

  if (!request.ui) {
    return jsonError(400, 'MISSING_UI', 'Request must include UI context.');
  }

  // Authenticate
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return jsonError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  // Rate limit check
  const rateLimitCheck = await checkRateLimit(user.id, '/api/dr-eams/run');
  if (!rateLimitCheck.allowed) {
    return jsonError(429, 'RATE_LIMIT', 'Too many requests. Please slow down.', {
      resetAt: rateLimitCheck.resetAt,
    });
  }

  // Build actor context
  const actor = await buildActorContext(user.id);

  // Get current RPM for Boogie signals
  const rpm = await getCurrentRPM(user.id, '/api/dr-eams/run');

  // Call planner (LLM)
  const { response_text, intents } = await drEamsPlanner(
    request.message,
    actor,
    request.ui
  );

  // If planner failed to produce valid intents, return safe response
  if (!Array.isArray(intents) || intents.length === 0) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'dr_eams',
      ok: true,
      latency_ms: Date.now() - requestStart,
    });

    return NextResponse.json({
      response_text,
      proposed_intents: [],
      boogie_decisions: [],
    });
  }

  // Verify intents with Boogie Man
  const boogieOutput = await verifyIntents(
    request_id,
    intents,
    actor,
    'dr_eams',
    request.message,
    rpm
  );

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
  const allowedIntents = intents.filter((intent, idx) => {
    const decision = boogieOutput.per_intent[idx];
    return decision.decision === 'ALLOW' || decision.decision === 'CONFIRM';
  });

  const allowedDecisions = boogieOutput.per_intent.filter(
    (d) => d.decision === 'ALLOW' || d.decision === 'CONFIRM'
  );

  // Generate confirm token if any intents need confirmation
  let confirm_token: string | undefined;
  const needsConfirmation = allowedDecisions.some((d) => d.decision === 'CONFIRM');

  if (needsConfirmation) {
    const intentIds = allowedIntents.map((i) => i.intent_id);
    confirm_token = generateConfirmToken(request_id, user.id, 300); // 5 min expiry

    await storeConfirmToken(
      confirm_token,
      request_id,
      user.id,
      intentIds,
      request.ui,
      300
    );
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

  return NextResponse.json(response);
}
