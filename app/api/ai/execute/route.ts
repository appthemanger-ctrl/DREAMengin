// app/api/ai/execute/route.ts
// Execute validated intents after confirmation

import { NextRequest } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { ExecuteBodySchema } from '@/lib/ai/schemas';
import { verifyConfirmToken } from '@/lib/ai/confirm';
import { writeAuditLog } from '@/lib/ai/audit';
import { checkRateLimit } from '@/lib/ai/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestStart = Date.now();

  // Parse and validate request
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = ExecuteBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonApiError(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const request = parseResult.data;

  // Authenticate
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
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
    return jsonApiError(429, 'RATE_LIMIT', 'Too many requests.');
  }

  // Demo mode: always require confirmation token
  if (!request.confirm_token) {
    return jsonApiError(403, 'CONFIRMATION_REQUIRED', 'Confirmation token required.');
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

    return jsonApiError(403, 'INVALID_TOKEN', 'Confirmation token is invalid or expired.');
  }

  // Intent execution is not yet implemented.
  // The intents were validated and the confirm token verified above, but
  // no actual side-effects are dispatched. Returning NOT_IMPLEMENTED rather
  // than lying with executed: true.
  await writeAuditLog({
    request_id: request.request_id,
    user_id: user.id,
    agent: 'execute',
    ok: false,
    error_code: 'NOT_IMPLEMENTED',
    latency_ms: Date.now() - requestStart,
    payload: { intent_ids: request.intent_ids },
  });

  return jsonApiError(501, 'NOT_IMPLEMENTED',
    'Intent execution is not yet available. Your intents were validated but not executed.');
}
