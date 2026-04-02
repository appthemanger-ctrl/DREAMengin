// app/api/ai/idari/route.ts
// IDARi — admin-tier AI operator for DREAMengin.
// Access: admin and owner only. Regular users are rejected with 403.
//
// Per docs/IDARI_CONTRACT.md: "admin-only, server-side only."
// Per docs/dreamengin_phase6.md points 5–6:
//   "No IDARi endpoint may be surfaced through any standard user-accessible UI path."
//   "IDARi must be protected by an admin-guard check even when
//    NEXT_PUBLIC_DEV_BYPASS_AUTH is active."
//
// Role capabilities:
//   admin → diagnostics, feed config, system status, DIAG_SCHEMA_SNAPSHOT
//   owner → all admin + RLS inspection, infrastructure checks, DIAG_RLS_SNAPSHOT

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

type ActorRole = 'admin' | 'owner';


// Rate limits per role (requests per 60 seconds)
const RATE_LIMITS: Record<ActorRole, number> = {
  admin: 40,
  owner: 60,
};

function buildSystemPrompt(actorRole: ActorRole): string {
  const base =
    `You are IDARi, the AI companion inside DREAMengin — a dual-runtime spatial operating environment where users build personalised digital spaces.\n` +
    `Your personality: warm, precise, proactive. You speak in plain language — no jargon unless asked.\n` +
    `Always respond with ONLY valid JSON. No markdown wrapping.\n` +
    `Output shape: { response_text: string, intents: Intent[] }\n` +
    `Intent types allowed for this session are listed below. Max 3 intents. If unsure, return intents: [].\n\n` +
    `PLATFORM CAPABILITIES (v2):\n` +
    `- GameEngin powered by Babylon.js v8 — runs 20 original games across every major category.\n` +
    `- Games include: MADMAXI, DREAM FORCE, Tower Defense, VOID STRIKE, SHADOW SERPENT, DREAM BREAKER, BLOCK STACK, NITE FLYER, ENGIN CHESS, DREAM CIRCUIT, DREAM REALM QUEST, BEAT ENGINE, LABYRINTH ZERO, DREAMwars, ENGIN Battle, DREAMquest, Neon Drift, Echo Arena, Lucid Avenue, and DREAM GEMS.\n` +
    `- 3 AI agents: Dr. Eams (user), IDARi (builder/you), TheBoogieMan (policy).\n` +
    `- 25+ external connectors (social, productivity, media).\n` +
    `- 331 automated tests, deployed on Vercel with Supabase backend.\n\n` +
    `CHILD SAFETY — MANDATORY RULES (you must be aware of and enforce these):\n` +
    `- You will see child safety incidents in messaging and post surfaces as part of your admin role.\n` +
    `- Minors are users aged 13–17. Adults are 18+.\n` +
    `- Any image sent from a minor to an adult is ALWAYS blocked (rule C32_MINOR_IMAGE). No exceptions.\n` +
    `- Adults soliciting images from minors are permanently banned (rule C33_SOLICITING_IMAGES).\n` +
    `- CSAM (child sexual abuse material): zero-tolerance, mandatory NCMEC reporting.\n` +
    `- Evaluate context of minor-adult conversations: teacher-student, coach, family, youth group, tutor are safe.\n` +
    `- Child safety laws: PROTECT Act (18 U.S.C. §2256), COPPA (min age 13), CIPA, CDA §230 / STOP CSAM Act 2023, Age-Appropriate Design Codes.\n` +
    `- Flag any admin or system operation that could inadvertently expose child safety data or bypass child safety checks.\n\n`;

  if (actorRole === 'owner') {
    return base +
      `Actor role: OWNER — full platform access.\n` +
      `Allowed intents: DIAG_SCHEMA_SNAPSHOT, DIAG_RLS_SNAPSHOT, DIAG_ENV_CHECKLIST, SEARCH.\n` +
      `You can discuss database structure, RLS policies, environment config, and deployment.\n` +
      `Be direct, technical, and precise. Include rollback steps for risky suggestions.`;
  }

  // admin (default)
  return base +
    `Actor role: ADMIN — platform management access.\n` +
    `Allowed intents: DIAG_SCHEMA_SNAPSHOT, SEARCH.\n` +
    `Help with feed configuration, Dream Window management, user reports, and platform settings.\n` +
    `Be direct and technical. Flag anything that requires owner review.`;
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
      temperature: actorRole === 'owner' ? 0.05 : 0.1,
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

  // ── Service availability guard (Phase 6 item 6) ──────────────────────────
  // If IDARI_PASSWORD is not configured in the environment, the service cannot
  // be safely operated. Return 503 rather than silently accepting requests.
  // This check runs before any auth/body parsing so unauthenticated callers
  // still receive a safe error without leaking system details.
  if (!process.env.IDARI_PASSWORD) {
    return jsonApiError(
      503,
      'SERVICE_UNAVAILABLE',
      'IDARi service is not configured. IDARI_PASSWORD must be set in the environment.'
    );
  }

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

  // Authenticate — server-side only, no dev-bypass exemption (Phase 6 spec point 6).
  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in to access IDARi.');
  }

  // Determine role — admin/owner only gate (IDARI_CONTRACT.md, Phase 6 point 5).
   
  const { data: roleData } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isOwner = isOwnerEmail(user.email);
  const dbRole = (roleData as { role?: string } | null)?.role;
  const isAdmin = isOwner || dbRole === 'admin';

  // Hard admin gate — IDARi is never accessible to regular users.
  if (!isAdmin) {
    await writeAuditLog({
      request_id,
      user_id: user.id,
      agent: 'idari',
      ok: false,
      error_code: 'FORBIDDEN',
      latency_ms: Date.now() - requestStart,
    });
    return jsonApiError(403, 'FORBIDDEN', 'IDARi is an admin-only AI. Access denied.');
  }

  const actorRole: ActorRole = isOwner ? 'owner' : 'admin';

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

  const idariResult = validateWithIdari(intents, 'admin');
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
