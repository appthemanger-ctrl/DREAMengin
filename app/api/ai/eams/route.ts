// app/api/ai/eams/route.ts
// Canonical Dr. Eams endpoint — user-facing AI agent.
// AI keys are server-side only (Vercel env vars, never client).

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { DrEamsRunBodySchema, type DrEamsRunResponse } from '@/lib/ai/schemas';
import { boogieEvaluate } from '@/lib/ai/boogieman';
import { makeConfirmToken } from '@/lib/ai/confirm';
import { writeAuditLog } from '@/lib/ai/audit';
import { checkRateLimit, getCurrentRPM } from '@/lib/ai/rateLimit';
import { boogiePolicyCheck, isOwnerEmail, planWithEams, validateWithIdari } from '@/lib/ai/triad';

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

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

  // Rate limit
  const rateOk = await checkRateLimit(user.id, '/api/ai/eams', 30, 60);
  if (!rateOk.allowed) {
    return jsonError(429, 'RATE_LIMIT', 'Too many requests. Please slow down.');
  }
  const rateRpm = await getCurrentRPM(user.id, '/api/ai/eams');

  // Determine actor role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  const actorRole: 'user' | 'admin' | 'owner' = isOwnerEmail(user.email)
    ? 'owner'
    : ((roleData as { role?: string } | null)?.role === 'admin' ? 'admin' : 'user');

  // BoogieMan policy gate — check message before planning
  const boogiePolicy = await boogiePolicyCheck({
    actorRole,
    actorEmail: user.email,
    message: request.message,
  });
  if (boogiePolicy.hard_block) {
    return jsonError(403, 'POLICY_BLOCKED', boogiePolicy.reason ?? 'Request blocked by policy.');
  }

  // Plan with Dr. Eams
  let plan: Awaited<ReturnType<typeof planWithEams>>;
  try {
    plan = await planWithEams({
      message: request.message,
      actorEmail: user.email,
      actorRole,
      uiRoute: request.ui?.route,
    });
  } catch {
    plan = { response_text: "I'm here to help! What would you like to do?", intents: [] };
  }

  // Idari sanity check (synchronous rule-based)
  const idariResult = validateWithIdari(plan.intents);
  const validatedIntents = idariResult.intents;

  // BoogieMan rule-engine evaluation
  const boogieResult = boogieEvaluate({
    actorRole: actorRole === 'owner' ? 'admin' : actorRole,
    rateRpm,
    intents: validatedIntents,
  });

  // Filter to ALLOW and CONFIRM intents
  const allowedIntents = validatedIntents.filter((_, i) => {
    const d = boogieResult.per_intent[i];
    return d && (d.decision === 'ALLOW' || d.decision === 'CONFIRM');
  });

  const allowedDecisions = boogieResult.per_intent.filter(
    (d) => d.decision === 'ALLOW' || d.decision === 'CONFIRM'
  );

  // Generate confirm token if any intent needs confirmation
  let confirm_token: string | undefined;
  if (allowedDecisions.some((d) => d.decision === 'CONFIRM')) {
    confirm_token = makeConfirmToken({ requestId: request_id, userId: user.id, ttlSeconds: 300 });
  }

  const response_text = plan.interpreted_intent
    ? `${plan.response_text}\n\n• ${plan.interpreted_intent}`
    : plan.response_text;

  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'dr_eams',
    ok: true,
    latency_ms: Date.now() - requestStart,
    payload: { message: request.message, intent_count: allowedIntents.length },
  });

  const response: DrEamsRunResponse = {
    response_text,
    proposed_intents: allowedIntents,
    boogie_decisions: allowedDecisions,
    confirm_token,
  };

  return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
}
