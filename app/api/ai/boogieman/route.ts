// app/api/ai/boogieman/route.ts
// TheBoogieMan.Ai policy endpoint — admin-only system overwatch.
// Runs both LLM policy check (boogiePolicyCheck) and rule engine (boogieEvaluate).
// Every audit log entry carries policy_version + rule_code (req 3, 18).
//
// ── ENFORCEMENT TRIGGER LOGIC ────────────────────────────────────────────────
//
// TheBoogieMan enforces policy in two complementary layers:
//
//   Layer 1 — LLM policy check (boogiePolicyCheck):
//     Evaluates the free-text `message` against the product policy rules
//     (privacy, safety, content). Returns hard_block=true if the message
//     violates policy. The LLM analysis is deterministic per message content.
//
//   Layer 2 — Rule engine (boogieEvaluate):
//     Evaluates structured intents + actor role + current RPM. For raw message
//     calls (no intents), this checks global guards only (e.g. rate limits).
//     Returns global.hard_block=true if system-level guards trip.
//
//   Trigger conditions that set hard_block=true:
//     - Message content violates product safety/privacy policy (Layer 1)
//     - Actor is not admin or owner (gate check — returns 403 before evaluation)
//     - Rate limit exceeded: > 20 req/min per user (Layer 2 global guard)
//     - Both layers are OR'd: either alone can trigger a hard block
//
//   Audit log: every request — allowed or blocked — is written to ai_audit_log
//   with policy_version, request_id, user_id, latency_ms, and block reason.
//
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { boogieEvaluate, BOOGIE_POLICY_VERSION } from '@/lib/ai/boogieman';
import { writeAuditLog } from '@/lib/ai/audit';
import { checkRateLimit } from '@/lib/ai/rateLimit';
import { boogiePolicyCheck, isOwnerEmail } from '@/lib/ai/triad';

export const dynamic = 'force-dynamic';

const BoogieRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  context: z.record(z.string(), z.unknown()).optional(),
  to_eams: z.boolean().optional(),
  summary: z.string().optional(),
});


export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = BoogieRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return jsonApiError(400, 'VALIDATION_ERROR', 'Invalid request body', parseResult.error.flatten());
  }

  const request = parseResult.data;

  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

   
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
      agent: 'boogieman',
      ok: false,
      error_code: 'FORBIDDEN',
      latency_ms: Date.now() - requestStart,
      policy_version: BOOGIE_POLICY_VERSION,
    });
    return jsonApiError(403, 'FORBIDDEN', 'Admin access required.');
  }

  const actorRole: 'user' | 'admin' | 'owner' = isOwner ? 'owner' : 'admin';

  const rateOk = await checkRateLimit(user.id, '/api/ai/boogieman', 20, 60);
  if (!rateOk.allowed) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'boogieman',
      ok: false,
      error_code: 'RATE_LIMIT',
      latency_ms: Date.now() - requestStart,
      policy_version: BOOGIE_POLICY_VERSION,
    });
    return jsonApiError(429, 'RATE_LIMIT', 'Too many requests. Please slow down.', {
      retry_after_seconds: rateOk.retry_after_seconds,
    });
  }

  // LLM policy check
  const policyResult = await boogiePolicyCheck({
    actorRole,
    actorEmail: user.email,
    message: request.message,
  });

  // Intent-level rule engine evaluation (no intents for a raw message — zero-intent check)
  const ruleResult = boogieEvaluate({
    actorRole: 'admin',
    rateRpm: 0,
    intents: [],
  });

  const hard_block = policyResult.hard_block || ruleResult.global.hard_block;
  const reason = policyResult.reason ?? (ruleResult.global.hard_block ? 'Rate limit exceeded' : undefined);

  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'boogieman',
    ok: !hard_block,
    error_code: hard_block ? 'HARD_BLOCK' : undefined,
    latency_ms: Date.now() - requestStart,
    policy_version: BOOGIE_POLICY_VERSION,
    payload: {
      message: request.message,
      hard_block,
      to_eams: request.to_eams ?? false,
      summary: request.summary,
    },
  });

  return NextResponse.json(
    {
      ok: !hard_block,
      hard_block,
      reason,
      summary: request.to_eams ? (request.summary ?? null) : undefined,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
