// app/api/ai/execute/route.ts
// DREAMENGIN AI SYSTEM v2026.0 - Execute Endpoint
// The ONLY endpoint that executes AI intents after verification

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  ExecuteRequest,
  ExecuteResponse,
  ToolResult,
  UIDelta,
} from '@/types/ai-system';
import { buildActorContext } from '@/lib/ai/capability-gate';
import { consumeConfirmToken } from '@/lib/ai/confirm-token';
import { checkIdempotency, storeIdempotencyResult } from '@/lib/ai/idempotency';
import { executeIntents } from '@/lib/ai/tool-router';
import { checkRateLimit } from '@/lib/ai/rate-limiter';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

// POST /api/ai/execute
export async function POST(req: NextRequest) {
  const requestStart = Date.now();

  // Parse request
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const request = body as Partial<ExecuteRequest>;

  if (!request.request_id) {
    return jsonError(400, 'MISSING_REQUEST_ID', 'Request must include request_id.');
  }

  if (!request.intent_ids || !Array.isArray(request.intent_ids)) {
    return jsonError(400, 'MISSING_INTENT_IDS', 'Request must include intent_ids array.');
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
  const rateLimitCheck = await checkRateLimit(user.id, '/api/ai/execute');
  if (!rateLimitCheck.allowed) {
    return jsonError(429, 'RATE_LIMIT', 'Too many requests. Please slow down.', {
      resetAt: rateLimitCheck.resetAt,
    });
  }

  // If confirm_token provided, validate it
  if (request.confirm_token) {
    const tokenResult = await consumeConfirmToken(request.confirm_token, user.id);

    if (!tokenResult.valid) {
      return jsonError(403, 'INVALID_CONFIRM_TOKEN', 'Confirm token is invalid or expired.');
    }

    // Verify request_id matches
    if (tokenResult.requestId !== request.request_id) {
      return jsonError(403, 'TOKEN_MISMATCH', 'Confirm token does not match request_id.');
    }

    // Verify intent_ids match
    const tokenIntentIds = tokenResult.intentIds ?? [];
    const requestIntentIds = request.intent_ids;

    if (tokenIntentIds.length !== requestIntentIds.length ||
        !tokenIntentIds.every(id => requestIntentIds.includes(id))) {
      return jsonError(403, 'INTENT_MISMATCH', 'Intent IDs do not match confirm token.');
    }
  }

  // Build actor context
  const actor = await buildActorContext(user.id);

  // Fetch intents from cache
  const { data: cachedIntents, error: cacheError } = await supabase
    .from('intent_cache')
    .select('*')
    .eq('request_id', request.request_id)
    .in('id', request.intent_ids);

  if (cacheError || !cachedIntents || cachedIntents.length === 0) {
    return jsonError(404, 'INTENTS_NOT_FOUND', 'Intents not found in cache.');
  }

  // Check if already executed (via cache)
  if (cachedIntents.some(i => i.executed)) {
    return jsonError(409, 'ALREADY_EXECUTED', 'One or more intents already executed.');
  }

  // Check idempotency for each intent
  const tool_results: ToolResult[] = [];
  const ui_deltas: UIDelta[] = [];

  for (const cachedIntent of cachedIntents) {
    // Check idempotency
    const idempotencyCheck = await checkIdempotency(cachedIntent.idempotency_key);

    if (idempotencyCheck.exists) {
      // Return cached result
      tool_results.push(idempotencyCheck.result as ToolResult);
      continue;
    }

    // Execute intent
    const intent = {
      intent_id: cachedIntent.id,
      type: cachedIntent.intent_type,
      payload: cachedIntent.payload as Record<string, unknown>,
      confidence: cachedIntent.confidence,
      requires_confirmation: cachedIntent.requires_confirmation,
      rationale: cachedIntent.rationale ?? '',
      idempotency_key: cachedIntent.idempotency_key,
    };

    const result = await executeIntents(
      [intent],
      actor,
      request.ui,
      supabase,
      request.request_id
    );

    tool_results.push(...result);

    // Extract UI deltas
    result.forEach(r => {
      if (r.ui_delta) {
        ui_deltas.push(r.ui_delta);
      }
    });

    // Store idempotency result
    await storeIdempotencyResult(
      cachedIntent.idempotency_key,
      user.id,
      cachedIntent.intent_type,
      result[0]
    );

    // Mark intent as executed in cache
    await supabase
      .from('intent_cache')
      .update({ executed: true, executed_at: new Date().toISOString() })
      .eq('id', cachedIntent.id);
  }

  // Prepare response
  const response: ExecuteResponse = {
    tool_results,
    ui_deltas,
  };

  return NextResponse.json(response);
}
