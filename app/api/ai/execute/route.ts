// app/api/ai/execute/route.ts
// Execute validated intents after confirmation

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ExecuteBodySchema, type ExecuteResponse } from '@/lib/ai/schemas';
import { verifyConfirmToken } from '@/lib/ai/confirm';
import { writeAuditLog } from '@/lib/ai/audit';
import { checkRateLimit } from '@/lib/ai/rateLimit';
import { checkIdempotency } from '@/lib/ai/idempotency';
import { boogieEvaluate } from '@/lib/ai/boogieman';

export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: NextRequest) {
  const requestStart = Date.now();

  // Parse and validate request
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = ExecuteBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const request = parseResult.data;

  // Authenticate
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  const actorRole = roleData?.role || 'user';

  // Rate limit
  const rateLimitCheck = await checkRateLimit(user.id, '/api/ai/execute', 30, 60);
  if (!rateLimitCheck.allowed) {
    return jsonError(429, 'RATE_LIMIT', 'Too many requests.');
  }

  // Demo mode: always require confirmation token
  if (!request.confirm_token) {
    return jsonError(403, 'CONFIRMATION_REQUIRED', 'Confirmation token required.');
  }

  // Verify confirmation token
  const tokenValid = verifyConfirmToken({
    token: request.confirm_token,
    requestId: request.request_id,
    userId: user.id,
  });

  if (!tokenValid) {
    await writeAuditLog({
      request_id: request.request_id,
      user_id: user.id,
      agent: 'execute',
      ok: false,
      error_code: 'INVALID_TOKEN',
      latency_ms: Date.now() - requestStart,
    });

    return jsonError(403, 'INVALID_TOKEN', 'Confirmation token is invalid or expired.');
  }

  // For demo purposes, we'll just log and return success
  // In production, this would execute the actual intents
  const results = request.intent_ids.map(intent_id => {
    // Check idempotency for each intent
    // This is a simplified version - in production, you'd check against stored intents
    return {
      intent_id,
      executed: true,
      error: undefined,
    };
  });

  // Audit success
  await writeAuditLog({
    request_id: request.request_id,
    user_id: user.id,
    agent: 'execute',
    ok: true,
    latency_ms: Date.now() - requestStart,
    payload: {
      intent_ids: request.intent_ids,
    },
  });

  const response: ExecuteResponse = {
    ok: true,
    results,
    boogie: {
      allowed: true,
    },
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
