/**
 * /api/admin/ai-chat
 *
 * Owner-only endpoint that lets the authenticated admin chat with
 * IDARi (debugger/overseer) or BoogieMan (policy/enforcement) AI.
 *
 * Security layers (same as /api/admin/code-files):
 *  1. Supabase session must match OWNER_EMAIL
 *  2. Admin password must match ADMIN_CODE_PASSWORD
 *  3. One wrong password → permanent lockout via shared lockout module
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { groqChat, type GroqMessage } from '@/lib/ai/groq';
import { AI_MODELS } from '@/lib/ai/triad';
import {
  isAdminLocked,
  triggerAdminLockout,
  isOwner,
} from '@/lib/admin/lockout';

export const dynamic = 'force-dynamic';

function deny(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

// ── System prompts ────────────────────────────────────────────────────────────

const IDARI_SYSTEM = `You are IDARi, the admin-tier AI for DREAMengin.
Your roles: debugger, overseer, and system maintainer.
You help the owner diagnose widget issues, inspect system health, review code problems, and propose fixes.
Be concise, technical, and direct. The person you are speaking with is the owner/admin of the platform.`;

const BOOGIEMAN_SYSTEM = `You are BoogieMan, the policy and enforcement AI for DREAMengin.
Your roles: policy review, content moderation guidance, and platform safety.
You help the owner understand platform rules, evaluate content decisions, and review enforcement actions.
Be clear, fair, and thorough. The person you are speaking with is the owner/admin of the platform.`;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Check permanent lockout
  if (isAdminLocked()) {
    return deny('Access permanently locked. Edit repository configuration to reset.', 403);
  }

  // 2. Verify Supabase session — must be owner email
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!isOwner(user?.email)) {
      return deny('Access denied.', 403);
    }
  } catch {
    return deny('Authentication error.', 401);
  }

  // 3. Parse body
  let body: { password?: string; agent?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return deny('Invalid request body.', 400);
  }

  // 4. Password check — one wrong attempt = permanent lockout
  const adminPw = process.env.ADMIN_CODE_PASSWORD;
  if (!adminPw) {
    return deny('Admin feature not configured on this server.', 503);
  }
  if (!body.password || body.password !== adminPw) {
    triggerAdminLockout();
    return deny('Incorrect password.', 401);
  }

  // 5. Validate agent + message
  const agent = body.agent;
  if (agent !== 'idari' && agent !== 'boogieman') {
    return deny('agent must be "idari" or "boogieman".', 400);
  }

  const message = (body.message ?? '').trim();
  if (!message) {
    return deny('message is required.', 400);
  }

  // 6. Call the appropriate AI
  const systemPrompt = agent === 'idari' ? IDARI_SYSTEM : BOOGIEMAN_SYSTEM;
  const primaryModel = agent === 'idari' ? AI_MODELS.IDARI_PRIMARY : AI_MODELS.BOOGIE;
  const fallbackModel = agent === 'idari' ? AI_MODELS.IDARI_FALLBACK : AI_MODELS.EAMS_FALLBACK;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ];

  let responseText: string;
  try {
    responseText = await groqChat({ model: primaryModel, messages, temperature: 0.3, max_tokens: 900 });
  } catch {
    try {
      responseText = await groqChat({ model: fallbackModel, messages, temperature: 0.3, max_tokens: 900 });
    } catch {
      return deny('AI service unavailable. Check GROQ_API_KEY and model availability.', 502);
    }
  }

  return NextResponse.json({ response: responseText, agent });
}
