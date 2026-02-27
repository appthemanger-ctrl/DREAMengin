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
// Dr. Eams: create a concise reply + up to 3 JSON intents.
// ---------------------------------------------------------------------------

export async function planWithEams(input: {
  message: string;
  actorEmail?: string | null;
  actorRole: 'user' | 'admin' | 'owner';
  uiRoute?: string;
}): Promise<EamsPlan> {
  const system: GroqMessage = {
    role: 'system',
    content:
      `You are Dr. Eams, the user-facing AI for DREAMengin.\n` +
      `Your job: help the user navigate and use the app.\n\n` +
      `RULES (strict):\n` +
      `1) Respond with ONLY JSON. No markdown.\n` +
      `2) Output shape: { response_text: string, interpreted_intent?: string, intents: Intent[] }.\n` +
      `3) Intents must match the app schema exactly. Max 3 intents.\n` +
      `4) Only propose SAFE UI intents: NAV_DELTA, HOME_MENU_OPEN, SEARCH, POST_CREATE.\n` +
      `5) If you are unsure, return intents: [] and give a helpful response_text.\n\n` +
      `The user's role is ${input.actorRole}. Current route: ${input.uiRoute || 'unknown'}.\n` +
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
            intent_id: x?.intent_id || uuidv4(),
            type: x?.type as IntentType,
            confidence: typeof x?.confidence === 'number' ? x.confidence : 0.6,
            requires_confirmation: Boolean(x?.requires_confirmation),
            rationale: typeof x?.rationale === 'string' ? x.rationale : 'Requested by user',
            idempotency_key: typeof x?.idempotency_key === 'string' ? x.idempotency_key : `eams-${Date.now()}`,
            payload: (x?.payload && typeof x.payload === 'object') ? x.payload : {},
          };
          return base;
        })
        .filter((intent) => IntentSchema.safeParse(intent).success);

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

const ALLOWED_INTENT_TYPES: IntentType[] = ['NAV_DELTA', 'HOME_MENU_OPEN', 'SEARCH', 'POST_CREATE'];

export function validateWithIdari(intents: Intent[]): { intents: Intent[]; notes: string[] } {
  const notes: string[] = [];
  const filtered = intents
    .filter((i) => ALLOWED_INTENT_TYPES.includes(i.type))
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
      `You are Boogie (policy AI) for DREAMengin.\n` +
      `You must enforce: Helpful, Honest, Harmless. Respect privacy. Obey laws.\n` +
      `Return ONLY JSON: { hard_block: boolean, reason?: string }.\n` +
      `Hard-block requests that involve: illegal activity, doxxing, credential theft, malware, bypassing auth, privacy violations.\n` +
      `If safe, hard_block=false.`,
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
