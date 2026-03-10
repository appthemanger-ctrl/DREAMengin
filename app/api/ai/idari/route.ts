// app/api/ai/idari/route.ts
// IDARi — universal AI for Dreamengin.
// Available to ALL authenticated users. Capabilities scale with role:
//   user  → platform guidance, personalization help, creative coaching
//   admin → + diagnostics, feed config, system status
//   owner → + schema access, RLS inspection, infrastructure checks

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { DrEamsRunBodySchema, type Intent } from '@/lib/ai/schemas';
import { boogieEvaluate } from '@/lib/ai/boogieman';
import { writeAuditLog } from '@/lib/ai/audit';
import { checkRateLimit, getCurrentRPM } from '@/lib/ai/rateLimit';
import { isOwnerEmail, validateWithIdari, AI_MODELS } from '@/lib/ai/triad';
import { groqChat, type GroqMessage } from '@/lib/ai/groq';

export const dynamic = 'force-dynamic';

type ActorRole = 'user' | 'admin' | 'owner';


// Rate limits per role (requests per 60 seconds)
const RATE_LIMITS: Record<ActorRole, number> = {
  user:  20,
  admin: 40,
  owner: 60,
};

function buildSystemPrompt(actorRole: ActorRole): string {
  const base =
    `You are IDARi, the AI companion inside Dreamengin — a creative platform where users build personalised digital spaces.\n` +
    `Your personality: warm, precise, proactive. You speak in plain language — no jargon unless asked.\n` +
    `Always respond with ONLY valid JSON. No markdown wrapping.\n` +
    `Output shape: { response_text: string, intents: Intent[] }\n` +
    `Intent types allowed for this session are listed below. Max 3 intents. If unsure, return intents: [].\n\n`;

  if (actorRole === 'owner') {
    return base +
      `Actor role: OWNER — full platform access.\n` +
      `Allowed intents: DIAG_SCHEMA_SNAPSHOT, DIAG_RLS_SNAPSHOT, DIAG_ENV_CHECKLIST, SEARCH.\n` +
      `You can discuss database structure, RLS policies, environment config, and deployment.\n` +
      `Be direct, technical, and precise. Include rollback steps for risky suggestions.`;
  }

  if (actorRole === 'admin') {
    return base +
      `Actor role: ADMIN — platform management access.\n` +
      `Allowed intents: DIAG_SCHEMA_SNAPSHOT, SEARCH.\n` +
      `Help with feed configuration, widget management, user reports, and platform settings.\n` +
      `Be direct and technical. Flag anything that requires owner review.`;
  }

  // user
  return base +
    `Actor role: USER — full creative platform access.\n` +
    `Allowed intents: SEARCH.\n` +
    `Help the user get the most from Dreamengin: themes, widgets, Daydreams, connections, AI tools.\n` +
    `Encourage creativity. Suggest features they might not know about. Be warm and motivating.\n` +
    `Never discuss internal database schemas, RLS policies, or server infrastructure with users.`;
}

async function idariPlanner(
  message: string,
  actorRole: ActorRole
): Promise<{ response_text: string; intents: Intent[] }> {
  const system: GroqMessage = {
    role: 'system',
    content: buildSystemPrompt(actorRole),
  };

  const userMsg: GroqMessage = { role: 'user', content: message };

  try {
    const raw = await groqChat({
      model: AI_MODELS.IDARI_PRIMARY,
      messages: [system, userMsg],
      temperature: actorRole === 'user' ? 0.4 : 0.1,
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
      return { response_text: raw.length > 8 ? raw : `IDARi is here! Ask me anything about Dreamengin.`, intents: [] };
    }

    const response_text = String(parsed.response_text || `IDARi is here! How can I help?`).trim();
    const rawIntents = Array.isArray(parsed.intents) ? parsed.intents : [];
    const intents: Intent[] = rawIntents
      .slice(0, 3)
      .map((x: Record<string, unknown>) => ({
        intent_id: typeof x?.intent_id === 'string' ? x.intent_id : uuidv4(),
        type: x?.type as Intent['type'],
        confidence: typeof x?.confidence === 'number' ? x.confidence : 0.7,
        requires_confirmation: Boolean(x?.requires_confirmation),
        rationale: typeof x?.rationale === 'string' ? x.rationale : 'IDARi request',
        idempotency_key: typeof x?.idempotency_key === 'string' ? x.idempotency_key : `idari-${Date.now()}`,
        payload: (x?.payload && typeof x.payload === 'object') ? x.payload as Record<string, unknown> : {},
      }));
    return { response_text, intents };
  } catch {
    return { response_text: `IDARi is here! What can I help you with?`, intents: [] };
  }
}

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = DrEamsRunBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonApiError(400, 'VALIDATION_ERROR', 'Invalid request body', parseResult.error.flatten());
  }

  const request = parseResult.data;

  // Authenticate — ALL users welcome
  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in to talk to IDARi.');
  }

  // Determine role (no blocking — role only affects capabilities)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isOwner = isOwnerEmail(user.email);
  const dbRole = (roleData as { role?: string } | null)?.role;
  const actorRole: ActorRole = isOwner ? 'owner' : dbRole === 'admin' ? 'admin' : 'user';

  // Rate limit (per-role)
  const rateOk = await checkRateLimit(user.id, '/api/ai/idari', RATE_LIMITS[actorRole], 60);
  if (!rateOk.allowed) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'idari',
      ok: false,
      error_code: 'RATE_LIMIT',
      latency_ms: Date.now() - requestStart,
    });
    return jsonApiError(429, 'RATE_LIMIT', 'Too many requests. Please slow down.', {
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

  const idariResult = validateWithIdari(intents, actorRole === 'user' ? 'user' : 'admin');
  const validatedIntents = idariResult.intents;

  const boogieResult = boogieEvaluate({
    actorRole: actorRole === 'user' ? 'user' : 'admin',
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
    return jsonApiError(403, 'BLOCKED', 'Request blocked by safety policy.', {
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
    payload: { message: request.message, intent_count: allowedIntents.length, actor_role: actorRole },
  });

  return NextResponse.json(
    { response_text, proposed_intents: allowedIntents, boogie_decisions: allowedDecisions },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
