// app/api/ai/idari/route.ts
// Admin-facing IDARi endpoint — diagnostics and builder AI.
// Admin or owner only. AI keys are server-side only.
//
// Role restraint (docs/AI_TRIAD_PROTOCOL.md §4):
//   IDARi cannot ban users or override Boogie enforcement.
//   IDARi cannot change public policy text alone.
//   IDARi can propose changes that affect policy surfaces — must trigger REQUEST_REVIEW to Boogie.
//   System throttle actions (THROTTLE_SYSTEM, SHED_LOAD) are IDARi-exclusive.
//   Role guard utility: lib/ai/events.ts → checkAgentPermission()

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { DrEamsRunBodySchema, type Intent } from '@/lib/ai/schemas';
import { boogieEvaluate } from '@/lib/ai/boogieman';
import { writeAuditLog } from '@/lib/ai/audit';
import { checkRateLimit, getCurrentRPM } from '@/lib/ai/rateLimit';
import { isOwnerEmail, validateWithIdari, AI_MODELS } from '@/lib/ai/triad';
import { groqChat, type GroqMessage } from '@/lib/ai/groq';

export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

async function idariPlanner(
  message: string,
  actorRole: 'admin' | 'owner'
): Promise<{ response_text: string; intents: Intent[] }> {
  const system: GroqMessage = {
    role: 'system',
    content:
      `You are iDari, the admin-facing builder AI for DREAMengin.\n` +
      `Your job: help admins diagnose, configure, and maintain the platform.\n\n` +
      `RULES (strict):\n` +
      `1) Respond with ONLY JSON. No markdown.\n` +
      `2) Output shape: { response_text: string, intents: Intent[] }.\n` +
      `3) Allowed intent types: DIAG_SCHEMA_SNAPSHOT, DIAG_RLS_SNAPSHOT, SEARCH.\n` +
      `4) Max 3 intents per request.\n` +
      `5) If unsure, return intents: [] with a helpful response_text.\n\n` +
      `Actor role: ${actorRole}.`,
  };

  const userMsg: GroqMessage = { role: 'user', content: message };

  try {
    const raw = await groqChat({
      model: AI_MODELS.IDARI_PRIMARY,
      messages: [system, userMsg],
      temperature: 0.1,
      max_tokens: 700,
    });

    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/```\s*([\s\S]*?)```/);
      if (match?.[1]) {
        try { parsed = JSON.parse(match[1]); } catch { /* ignore */ }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return { response_text: `[iDari] Analyzing: "${message}"`, intents: [] };
    }

    const response_text = String(parsed.response_text || `[iDari] Analyzing: "${message}"`).trim();
    const rawIntents = Array.isArray(parsed.intents) ? parsed.intents : [];
    const intents: Intent[] = rawIntents
      .slice(0, 3)
      .map((x: Record<string, unknown>) => ({
        intent_id: typeof x?.intent_id === 'string' ? x.intent_id : uuidv4(),
        type: x?.type as Intent['type'],
        confidence: typeof x?.confidence === 'number' ? x.confidence : 0.7,
        requires_confirmation: Boolean(x?.requires_confirmation),
        rationale: typeof x?.rationale === 'string' ? x.rationale : 'Admin request',
        idempotency_key: typeof x?.idempotency_key === 'string' ? x.idempotency_key : `idari-${Date.now()}`,
        payload: (x?.payload && typeof x.payload === 'object') ? x.payload as Record<string, unknown> : {},
      }));
    return { response_text, intents };
  } catch {
    return { response_text: `[iDari] Analyzing: "${message}"`, intents: [] };
  }
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

  const actorRole: 'admin' | 'owner' = isOwner ? 'owner' : 'admin';

  const rateOk = await checkRateLimit(user.id, '/api/ai/idari', 30, 60);
  if (!rateOk.allowed) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'idari',
      ok: false,
      error_code: 'RATE_LIMIT',
      latency_ms: Date.now() - requestStart,
    });
    return jsonError(429, 'RATE_LIMIT', 'Too many requests. Please slow down.', {
      retry_after_seconds: rateOk.retry_after_seconds,
    });
  }

  const rateRpm = await getCurrentRPM(user.id, '/api/ai/idari');

  const { response_text, intents } = await idariPlanner(request.message, actorRole);

  if (!Array.isArray(intents) || intents.length === 0) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'idari',
      ok: true,
      latency_ms: Date.now() - requestStart,
    });
    return NextResponse.json(
      { response_text, proposed_intents: [], boogie_decisions: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const idariResult = validateWithIdari(intents);
  const validatedIntents = idariResult.intents;

  const boogieResult = boogieEvaluate({
    actorRole: 'admin',
    rateRpm,
    intents: validatedIntents,
  });

  if (boogieResult.global.hard_block) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'boogieman',
      ok: false,
      error_code: 'HARD_BLOCK',
      latency_ms: Date.now() - requestStart,
    });
    return jsonError(403, 'BLOCKED', 'Request blocked by security policy.', {
      cooldown_seconds: boogieResult.global.cooldown_seconds,
    });
  }

  const allowedIntents = validatedIntents.filter((_, i) => {
    const d = boogieResult.per_intent[i];
    return d && (d.decision === 'ALLOW' || d.decision === 'CONFIRM');
  });

  const allowedDecisions = boogieResult.per_intent.filter(
    (d) => d.decision === 'ALLOW' || d.decision === 'CONFIRM'
  );

  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'idari',
    ok: true,
    latency_ms: Date.now() - requestStart,
    payload: { message: request.message, intent_count: allowedIntents.length },
  });

  return NextResponse.json(
    { response_text, proposed_intents: allowedIntents, boogie_decisions: allowedDecisions },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
