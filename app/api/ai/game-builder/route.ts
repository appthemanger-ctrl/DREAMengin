// app/api/ai/game-builder/route.ts
// GameBuilder AI — user-accessible agent specialised in helping build games
// inside the DREAMengin GameEngin (Babylon.js v8, HTML5 Canvas, GameScript/Lua).
//
// Accessible to any authenticated user (not admin-only).
// Rate limit: 20 req / 60 s per user.

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { groqChat, type GroqMessage } from '@/lib/ai/groq';
import { AI_MODELS, boogiePolicyCheck } from '@/lib/ai/triad';
import { checkRateLimit } from '@/lib/ai/rateLimit';
import { writeAuditLog } from '@/lib/ai/audit';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// ── Request schema ─────────────────────────────────────────────────────────────

const GameBuilderBodySchema = z.object({
  /** The user's question or request about game development. */
  message: z.string().min(1).max(4000),
  /** Optional: the ID of the game currently open in GameEngin. */
  game_id: z.string().max(64).optional(),
  /** Optional: the current script code in the editor (for context). */
  script_context: z.string().max(3000).optional(),
  /** Optional: the world/tile grid state as a JSON string. */
  world_context: z.string().max(2000).optional(),
});

export type GameBuilderBody = z.infer<typeof GameBuilderBodySchema>;

// ── Response schema ────────────────────────────────────────────────────────────

export interface GameBuilderResponse {
  response_text: string;
  /** Optional code snippet the agent produced (GameScript / Lua / JS). */
  code_snippet?: string;
  /** Language hint for the code snippet (GameScript | Lua | JS). */
  code_language?: 'GameScript' | 'Lua' | 'JS';
  /** Short title for the code snippet, if provided. */
  code_title?: string;
  /** Suggested follow-up questions. */
  suggestions?: string[];
}

// ── System prompt ──────────────────────────────────────────────────────────────

function buildSystemPrompt(gameId?: string, hasScript?: boolean, hasWorld?: boolean): string {
  return (
    `You are the DREAMengin Game Builder AI — an expert game-development assistant embedded ` +
    `inside the DREAMengin platform.\n\n` +
    `PLATFORM CONTEXT:\n` +
    `- Game engine: Babylon.js v8 (3D) + HTML5 Canvas (2D), 27 built-in games.\n` +
    `- Game categories: platformer, RTS, tower-defense, shooter, puzzle, rhythm, RPG, sport, card.\n` +
    `- World Builder: 5×5 tile-grid (tiles: empty, ground, wall, water, spawn).\n` +
    `- Script editor: supports GameScript (DREAMengin scripting language) and Lua.\n` +
    `- Physics presets: moon (0.16g), earth (1g), mars (0.38g), jupiter (2.4g).\n` +
    `- Game Remote: PS5-style controller with left/right analog sticks, 34 action types.\n` +
    `- Input events: CustomEvent('de-game-input', { detail: { action, active } }).\n` +
    (gameId ? `- Currently open game: "${gameId}".\n` : '') +
    (hasScript ? `- A script is currently loaded in the editor (shown below as SCRIPT CONTEXT).\n` : '') +
    (hasWorld ? `- A world/tile layout is currently loaded (shown below as WORLD CONTEXT).\n` : '') +
    `\nYOUR ROLE:\n` +
    `Help the user design, code, and debug games. Answer questions about game mechanics, ` +
    `physics, scripting, tile design, and Babylon.js. When producing code, prefer GameScript ` +
    `unless the user specifies Lua or JavaScript.\n\n` +
    `RESPONSE FORMAT (respond with ONLY valid JSON, no markdown wrapping):\n` +
    `{\n` +
    `  "response_text": "Your explanation or answer (plain text, max 350 chars)",\n` +
    `  "code_snippet": "...optional code block...",\n` +
    `  "code_language": "GameScript" | "Lua" | "JS",\n` +
    `  "code_title": "Short title for the code (max 50 chars)",\n` +
    `  "suggestions": ["Follow-up question 1", "Follow-up question 2"]\n` +
    `}\n\n` +
    `Rules:\n` +
    `- Always return valid JSON.\n` +
    `- response_text is required. All other fields are optional.\n` +
    `- Only include code_snippet when producing actual code.\n` +
    `- Keep code_snippet under 80 lines.\n` +
    `- Include 2–3 suggestions to guide the user.\n` +
    `- Never include harmful, offensive, or platform-unrelated content.\n` +
    `- If the user asks about something unrelated to game development, politely redirect them.`
  );
}

// ── Planner ────────────────────────────────────────────────────────────────────

function safeJsonParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
    if (match?.[1]) {
      try { return JSON.parse(match[1]); } catch { /* fall through */ }
    }
    return null;
  }
}

async function planGameBuilder(
  message: string,
  gameId?: string,
  scriptContext?: string,
  worldContext?: string,
): Promise<GameBuilderResponse> {
  const systemContent = buildSystemPrompt(gameId, !!scriptContext, !!worldContext);

  let userContent = message;
  if (scriptContext) {
    userContent += `\n\nSCRIPT CONTEXT:\n\`\`\`\n${scriptContext}\n\`\`\``;
  }
  if (worldContext) {
    userContent += `\n\nWORLD CONTEXT:\n${worldContext}`;
  }

  const messages: GroqMessage[] = [
    { role: 'system', content: systemContent },
    { role: 'user',   content: userContent },
  ];

  const tryModels = [AI_MODELS.EAMS_PRIMARY, AI_MODELS.EAMS_FALLBACK];

  for (const model of tryModels) {
    try {
      const raw = await groqChat({ model, messages, temperature: 0.35, max_tokens: 900 });
      const parsed = safeJsonParse(raw);

      if (!parsed || typeof parsed !== 'object') {
        return { response_text: raw.slice(0, 500) || 'Ready to help you build games!' };
      }

      const response_text = String(parsed.response_text ?? '').trim() || 'Ready to help you build games!';
      const code_snippet  = typeof parsed.code_snippet === 'string' && parsed.code_snippet.trim()
        ? parsed.code_snippet.trim()
        : undefined;
      const rawLang = parsed.code_language;
      const code_language: GameBuilderResponse['code_language'] =
        rawLang === 'Lua' ? 'Lua' : rawLang === 'JS' ? 'JS' : (code_snippet ? 'GameScript' : undefined);
      const code_title = typeof parsed.code_title === 'string' ? parsed.code_title.slice(0, 50) : undefined;
      const suggestions = Array.isArray(parsed.suggestions)
        ? (parsed.suggestions as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 3)
        : undefined;

      return { response_text, code_snippet, code_language, code_title, suggestions };
    } catch {
      /* try next model */
    }
  }

  return {
    response_text: `I'm having trouble connecting right now. Try again in a moment!`,
    suggestions: [
      'How do I add a jump mechanic?',
      'What tile types are available in the World Builder?',
      'How do I handle collision in GameScript?',
    ],
  };
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = GameBuilderBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonApiError(400, 'VALIDATION_ERROR', 'Invalid request body.', parseResult.error.flatten());
  }

  const { message, game_id, script_context, world_context } = parseResult.data;

  // Authenticate
  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in to use the Game Builder AI.');
  }

  // Rate limit — 20 req / 60 s (lighter than Dr. Eams to keep costs down)
  const rateOk = await checkRateLimit(user.id, '/api/ai/game-builder', 20, 60);
  if (!rateOk.allowed) {
    return jsonApiError(429, 'RATE_LIMIT', 'Too many requests. Please slow down.', {
      retry_after_seconds: rateOk.retry_after_seconds,
    });
  }

  // BoogieMan policy gate
  const boogiePolicy = await boogiePolicyCheck({
    actorRole: 'user',
    actorEmail: user.email,
    message,
  });
  if (boogiePolicy.hard_block) {
    return jsonApiError(403, 'POLICY_BLOCKED', boogiePolicy.reason ?? 'Request blocked by policy.');
  }

  const result = await planGameBuilder(message, game_id, script_context, world_context);

  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'dr_eams',
    ok: true,
    latency_ms: Date.now() - requestStart,
    payload: { message, game_id, has_code: !!result.code_snippet },
  });

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
