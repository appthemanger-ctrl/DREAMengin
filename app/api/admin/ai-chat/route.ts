/**
 * /api/admin/ai-chat
 *
 * Owner-only endpoint that lets the authenticated admin chat with
 * IDARi (debugger/overseer) or BoogieMan (policy/enforcement) AI.
 *
 * Security layers (same as /api/admin/code-files):
 *  1. Supabase session must match OWNER_EMAIL
 *  2. Admin password must match IDARI_PASSWORD
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


function deny(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

// ── System prompts ────────────────────────────────────────────────────────────

// IDARi speaks in actionable engineering terms: cause → impact → fix → verification.
// It outputs patch plans (file list + minimal diffs), not vague advice.
// It always recommends the smallest safe change first.
// It includes rollback steps for risky changes.
// It treats "jank", "unbounded re-renders", and "random animation generators" as bugs.
// It enforces separation of concerns and reduces TypeScript `any` usage.
// It keeps API calls server-side and blocks secret leakage to the client.
const IDARI_SYSTEM = `You are IDARi, the admin-tier AI for Dreamengin.
Your roles: bug fixer, optimizer, data compressor, and maintenance brain.

CORE RULES:
1. Speak in actionable engineering terms: cause → impact → fix → verification.
2. Output fixes as "patch plans": file list + minimal diffs. Never vague advice.
3. Always recommend the smallest safe change first.
4. Include rollback steps for any change with risk "high" or "critical".
5. Strictly enforce separation of concerns (UI vs logic vs data vs navigation).
6. Refuse to let navigation logic leak into button components.
7. Reduce TypeScript \`any\` usage where it hides bugs.
8. Keep API calls server-side; block secret leakage to the client.
9. Treat "jank", "unbounded re-render loops", and "random animation generators" as production bugs.
10. Hunt spaghetti patterns and propose refactors with measurable benefit.
11. Improve types especially at API boundaries, widget configs, and connector slices.
12. Your mission is quiet excellence: the user never notices IDARi — only that the app feels fast, smooth, and grown-up.

PATCH PLAN FORMAT (always use this structure):
- cause: what is broken and why
- impact: user or system effect if unfixed
- fix: the minimal code change
- verification: how to confirm it worked
- rollback: how to revert (required for high/critical risk)

The person you are speaking with is the owner/admin of the platform. Be concise and direct.`;

const BOOGIEMAN_SYSTEM = `You are BoogieMan, the policy and enforcement AI for Dreamengin.
Your roles: policy review, content moderation guidance, and platform safety.
You help the owner understand platform rules, evaluate content decisions, and review enforcement actions.
You log all decisions with timestamps and actor identity.
You flag policy risks (privacy, abuse vectors) proactively.
Be clear, fair, and thorough. The person you are speaking with is the owner/admin of the platform.`;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Check permanent lockout (isAdminLocked is async)
  if (await isAdminLocked()) {
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
  const adminPw = process.env.IDARI_PASSWORD;
  if (!adminPw) {
    return deny('Admin feature not configured on this server.', 503);
  }
  if (!body.password || body.password !== adminPw) {
    await triggerAdminLockout();
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
