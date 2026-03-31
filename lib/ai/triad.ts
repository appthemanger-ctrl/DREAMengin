// lib/ai/triad.ts
// Dr. Eams (user AI) + Idari (builder AI) + Boogie (policy AI)
//
// This module intentionally keeps the orchestration server-side.
// The UI should only ever talk to Dr. Eams endpoints.

import { groqChat, type GroqMessage } from '@/lib/ai/groq';
import { IntentSchema, type Intent, type IntentType } from '@/lib/ai/schemas';
import { v4 as uuidv4 } from 'uuid';

const OWNER_EMAIL_DEFAULT = 'appthemanger@gmail.com';

export const AI_MODELS = {
  // User-facing agent
  EAMS_PRIMARY: 'meta-llama/llama-4-scout-17b-16e-instruct',
  EAMS_FALLBACK: 'llama-3.3-70b-versatile',

  // Builder / maintainer
  IDARI_PRIMARY: 'moonshotai/kimi-k2-instruct-0905',
  IDARI_FALLBACK: 'openai/gpt-oss-120b',

  // Policy / safety
  BOOGIE: 'openai/gpt-oss-safeguard-20b',
} as const;

export function getOwnerEmail(): string {
  return process.env.OWNER_EMAIL || OWNER_EMAIL_DEFAULT;
}

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === getOwnerEmail().toLowerCase();
}

type EamsPlan = { response_text: string; intents: Intent[]; interpreted_intent?: string };

function safeJsonParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    // Try to recover JSON from a fenced block
    const match = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Phase 8 §A — Canonical routes for Dr. Eams navigation resolution (Point 9).
// These are the only valid NAV_DELTA route values Dr. Eams may propose.
// Any route not in this list is rejected at the intent-validation layer.
// ---------------------------------------------------------------------------

export const CANONICAL_NAV_ROUTES: ReadonlySet<string> = new Set([
  // Core surfaces
  '/homedream',
  '/home',
  '/edit-profiledream',
  '/edit-profile',
  '/view-profile',
  // Daydream surfaces
  '/daydream/music',
  '/daydream/games',
  '/daydream/lab',
  '/daydream/code',
  '/daydream/brand',
  '/daydream/create',
  '/daydream/analytics',
  // Platform modules
  '/messages',
  '/shop',
  '/marketplace',
  '/ads',
  '/connectors',
  '/settings',
  '/settings/feed',
  '/settings/appearance',
  '/settings/privacy',
  '/settings/widgets',
  '/settings/data',
  '/settings/help',
  '/feed-settings',
  '/discover',
  '/onboarding',
]);

// ---------------------------------------------------------------------------
// Dr. Eams: create a concise reply + up to 3 JSON intents.
// ---------------------------------------------------------------------------

export async function planWithEams(input: {
  message: string;
  actorEmail?: string | null;
  actorRole: 'user' | 'admin' | 'owner';
  uiRoute?: string;
  /** Optional: real content context fetched from Supabase (Phase 8 §A Point 10) */
  contentContext?: string;
}): Promise<EamsPlan> {
  const canonicalRouteList = Array.from(CANONICAL_NAV_ROUTES).join(', ');

  const system: GroqMessage = {
    role: 'system',
    content:
      `You are Dr. Eams, the user-facing AI for DREAMengin.\n` +
      `Your job: help the user navigate and use the app.\n\n` +
      `PLATFORM CONTEXT:\n` +
      `- DREAMengin v2 ships 20 built-in games (RTS, Tower Defense, Space Shooter, Match-3, Snake, Breakout, Tetris, Flappy, Pong, Minesweeper, Chess, Racing, Trivia, RPG, Rhythm, Maze, Solitaire, and more).\n` +
      `- 3 AI agents in the triad: Dr. Eams (you, user-facing), IDARi (builder/admin), TheBoogieMan (policy).\n` +
      `- GameEngin uses the Babylon.js v8 rendering engine for immersive 3D experiences.\n` +
      `- 25+ social/service integrations supported.\n` +
      `- 331 automated tests pass on every deploy.\n\n` +
      `CHILD SAFETY — MANDATORY RULES (you must enforce these at all times):\n` +
      `- Minors are users aged 13–17. Adults are 18+.\n` +
      `- Any image sent from a minor to an adult is ALWAYS blocked (rule C32_MINOR_IMAGE). No exceptions.\n` +
      `- Adults soliciting images from minors are permanently banned (rule C33_SOLICITING_IMAGES).\n` +
      `- Monitor all minor-adult conversations for grooming, harassment, or inappropriate content.\n` +
      `- Recognize safe contexts: teacher-student, coach-athlete, family member, youth group, tutor, mentor.\n` +
      `- If you see any grooming signals, secrecy coercion, platform migration requests, or sexual content involving minors, flag the conversation immediately for TheBoogieMan.Ai enforcement.\n` +
      `- Child safety laws: PROTECT Act (mandatory NCMEC reporting for CSAM), COPPA (min age 13), CIPA (block harmful content for minors), CDA §230 / STOP CSAM Act (act on known CSAM immediately).\n` +
      `- Images appearing to depict minors in sexual contexts are CSAM and must be reported regardless of stated adult age.\n\n` +
      `CANONICAL NAVIGATION ROUTES (Phase 8 §A Point 9 — only these are valid):\n` +
      `${canonicalRouteList}\n\n` +
      `RULES (strict):\n` +
      `1) Respond with ONLY JSON. No markdown.\n` +
      `2) Output shape: { response_text: string, interpreted_intent?: string, intents: Intent[] }.\n` +
      `3) Intents must match the app schema exactly. Max 3 intents.\n` +
      `4) Only propose SAFE UI intents: NAV_DELTA, HOME_MENU_OPEN, SEARCH, POST_CREATE.\n` +
      `5) For NAV_DELTA intents, the payload.route MUST be one of the canonical routes listed above.\n` +
      `6) If you are unsure, return intents: [] and give a helpful response_text.\n` +
      `7) If real content context is provided below, use it to answer content questions accurately.\n\n` +
      `The user's role is ${input.actorRole}. Current route: ${input.uiRoute || 'unknown'}.\n` +
      (input.contentContext ? `\nREAL CONTENT CONTEXT (from database):\n${input.contentContext}\n` : '') +
      `Be concise, confident, and action-oriented.`,
  };

  const user: GroqMessage = {
    role: 'user',
    content: input.message,
  };

  const tryModels = [AI_MODELS.EAMS_PRIMARY, AI_MODELS.EAMS_FALLBACK];

  let lastErr: unknown = null;
  for (const model of tryModels) {
    try {
      const raw = await groqChat({ model, messages: [system, user], temperature: 0.2, max_tokens: 700 });
      const parsed = safeJsonParse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('Eams output was not JSON');

      const response_text = String(parsed.response_text || '').trim();
      const interpreted_intent = parsed.interpreted_intent ? String(parsed.interpreted_intent) : undefined;
      const intentsRaw = Array.isArray(parsed.intents) ? parsed.intents : [];

      const intents: Intent[] = intentsRaw
        .slice(0, 3)
        .map((x: Record<string, unknown>) => {
          const base = {
            intent_id: typeof x?.intent_id === 'string' ? x.intent_id : uuidv4(),
            type: x?.type as IntentType,
            confidence: typeof x?.confidence === 'number' ? x.confidence : 0.6,
            requires_confirmation: Boolean(x?.requires_confirmation),
            rationale: typeof x?.rationale === 'string' ? x.rationale : 'Requested by user',
            idempotency_key: typeof x?.idempotency_key === 'string' ? x.idempotency_key : `eams-${Date.now()}`,
            payload: (x?.payload && typeof x.payload === 'object') ? x.payload as Record<string, unknown> : {},
          };
          return base;
        })
        // Phase 8 §A Point 9: validate NAV_DELTA payloads contain real canonical routes
        .filter((intent) => {
          if (!IntentSchema.safeParse(intent).success) return false;
          if (intent.type === 'NAV_DELTA') {
            const route = (intent.payload as Record<string, unknown>)?.route;
            if (typeof route === 'string' && route.length > 0) {
              // Accept canonical routes exactly; also accept /profile/[handle] patterns
              return CANONICAL_NAV_ROUTES.has(route) || /^\/profile\/[^/]+$/.test(route);
            }
            return false;
          }
          return true;
        });

      return {
        response_text: response_text || `Got it.`,
        interpreted_intent,
        intents,
      };
    } catch (e) {
      lastErr = e;
    }
  }

  // Hard fallback
  return {
    response_text: `I'm having trouble reaching my brain right now. Try again in a moment.`,
    intents: [],
    interpreted_intent: undefined,
  };
}

// ---------------------------------------------------------------------------
// Idari: sanity-check / shrink / normalize. (LLM optional; rule-based default)
// ---------------------------------------------------------------------------

// User-facing intents — safe for any authenticated actor.
const USER_ALLOWED_INTENT_TYPES: IntentType[] = [
  'NAV_DELTA',
  'HOME_MENU_OPEN',
  'SEARCH',
  'POST_CREATE',
];

// Admin-context intents — Idari builder/diagnostics only.
// Extends user-allowed list with admin-tier diagnostic types.
const ADMIN_ALLOWED_INTENT_TYPES: IntentType[] = [
  ...USER_ALLOWED_INTENT_TYPES,
  'DIAG_SCHEMA_SNAPSHOT',
  'DIAG_RLS_SNAPSHOT',
];

/**
 * Validate and filter intents produced by an AI planner.
 *
 * @param intents  Raw intents from the planner.
 * @param context  'user' (default) — restricts to safe UI intents only.
 *                 'admin' — also permits Idari diagnostic intent types.
 */
export function validateWithIdari(
  intents: Intent[],
  context: 'user' | 'admin' = 'user'
): { intents: Intent[]; notes: string[] } {
  const notes: string[] = [];
  const allowed = context === 'admin' ? ADMIN_ALLOWED_INTENT_TYPES : USER_ALLOWED_INTENT_TYPES;
  const filtered = intents
    .filter((i) => allowed.includes(i.type))
    .slice(0, 3);

  if (filtered.length !== intents.length) {
    notes.push('Removed unsupported intents.');
  }
  return { intents: filtered, notes };
}

// ---------------------------------------------------------------------------
// Boogie: policy layer. Use existing rule engine elsewhere; this is LLM helper.
// ---------------------------------------------------------------------------

export async function boogiePolicyCheck(input: {
  actorRole: 'user' | 'admin' | 'owner';
  actorEmail?: string | null;
  message: string;
}): Promise<{ hard_block: boolean; reason?: string }> {
  const sys: GroqMessage = {
    role: 'system',
    content:
      `You are TheBoogieMan.Ai, the policy AI for DREAMengin v2.\n` +
      `Platform context: DREAMengin runs 20 built-in games and 3 AI agents (Dr. Eams, IDARi, TheBoogieMan).\n` +
      `You must enforce: Helpful, Honest, Harmless. Respect privacy. Obey laws.\n` +
      `Return ONLY JSON: { hard_block: boolean, reason?: string }.\n` +
      `Hard-block requests that involve: illegal activity, doxxing, credential theft, malware, bypassing auth, privacy violations.\n` +
      `Gaming content, creative expression, and educational queries are always allowed.\n` +
      `If safe, hard_block=false.\n\n` +
      `CHILD SAFETY — ZERO-TOLERANCE (mandatory enforcement):\n` +
      `- Minors are users aged 13–17. Adults are 18+.\n` +
      `- Any image from a minor to an adult is ALWAYS blocked (rule C32_MINOR_IMAGE). No exceptions.\n` +
      `- Adults soliciting images from minors: recommend permanent ban (rule C33_SOLICITING_IMAGES), hard_block=true.\n` +
      `- CSAM (child sexual abuse material) of any kind: hard_block=true, zero-tolerance, mandatory NCMEC reporting.\n` +
      `- Grooming patterns (secrecy coercion, platform migration, bribery, meeting solicitation): hard_block=true for high-confidence signals.\n` +
      `- Evaluate context of minor-adult conversations: teacher-student, coach, family, youth group, tutor = safe with monitoring.\n` +
      `- Child safety laws: PROTECT Act (18 U.S.C. §2256), COPPA, CIPA, CDA §230 / STOP CSAM Act 2023, Age-Appropriate Design Codes.\n` +
      `- Any image that looks like pornography requires the subject to prove they are an adult. Images of third parties require age verification AND consent. Never show any image to humans that looks like child pornography.\n`,
  };
  const user: GroqMessage = { role: 'user', content: input.message };

  try {
    const raw = await groqChat({ model: AI_MODELS.BOOGIE, messages: [sys, user], temperature: 0.0, max_tokens: 220 });
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== 'object') return { hard_block: false };
    return {
      hard_block: Boolean(parsed.hard_block),
      reason: parsed.reason ? String(parsed.reason) : undefined,
    };
  } catch {
    // If Boogie model isn't available, fail open here; the rule engine will still run.
    return { hard_block: false };
  }
}
