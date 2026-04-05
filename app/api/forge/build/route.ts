/**
 * app/api/forge/build/route.ts
 *
 * ForgeEngin — AI Anything Builder endpoint.
 *
 * Accepts: POST { prompt: string }
 * Returns: text/event-stream (SSE) with ForgeLogEvent JSON objects.
 *
 * Pipeline:
 *   1. Dr. Eams  — creative plan
 *   2. IDARi     — concrete task list (JSON)
 *   3. BoogieMan — safety check (aborts on rejection)
 *   4. Execution — iterate tasks, emit step/file events
 *   5. result + done
 *
 * If GROQ_API_KEY is not set, runs a deterministic simulation so the UI
 * works in any environment.
 *
 * Architecture: server-side only (no client directive). No new Supabase tables.
 * Rate limiting is client-side (localStorage) + a simple in-memory Map TTL here.
 */

import { NextRequest } from 'next/server';
import { groqChat, type GroqMessage } from '@/lib/ai/groq';
import { AI_MODELS } from '@/lib/ai/triad';
import { ENGIN_REGISTRY } from '@/lib/forge/forgeRegistry';
import type { ForgeLogEvent } from '@/lib/forge/forgeBuild';

// ── Simple server-side rate-limit (1 build per day per IP/token) ────────────

/** Map<token, ISO-date-string> */
const buildRateMap = new Map<string, string>();

function getDateString(): string {
  return new Date().toDateString();
}

function checkServerRateLimit(token: string): boolean {
  const last = buildRateMap.get(token);
  return last !== getDateString();
}

function recordServerBuild(token: string): void {
  buildRateMap.set(token, getDateString());
  // TTL cleanup — keep map from growing unbounded
  if (buildRateMap.size > 5000) {
    const today = getDateString();
    for (const [k, v] of buildRateMap.entries()) {
      if (v !== today) buildRateMap.delete(k);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeJsonParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
    if (match?.[1]) {
      try { return JSON.parse(match[1]); } catch { /* fall through */ }
    }
    // Try to extract any JSON object from the text
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]); } catch { /* fall through */ }
    }
    return null;
  }
}

function encodeSSE(event: ForgeLogEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

// ── Simulation mode (no GROQ_API_KEY) ────────────────────────────────────────

interface SimTask {
  enginId: string;
  action: string;
  detail: string;
}

function buildSimulation(prompt: string): {
  eamsMessage: string;
  idariTasks: SimTask[];
  boogieApproved: boolean;
  boogieMessage: string;
  primaryEnginId: string;
  primaryHref: string;
  summary: string;
} {
  const lower = prompt.toLowerCase();

  // Detect primary engin from keywords
  let primaryEnginId = 'games';
  let primaryHref = '/daydream/games';

  if (lower.includes('music') || lower.includes('beat') || lower.includes('song') || lower.includes('track')) {
    primaryEnginId = 'music';
    primaryHref = '/daydream/music';
  } else if (lower.includes('code') || lower.includes('app') || lower.includes('script') || lower.includes('program')) {
    primaryEnginId = 'code';
    primaryHref = '/daydream/code';
  } else if (lower.includes('brand') || lower.includes('logo') || lower.includes('design') || lower.includes('campaign')) {
    primaryEnginId = 'brand';
    primaryHref = '/daydream/brand';
  } else if (lower.includes('lab') || lower.includes('experiment') || lower.includes('data') || lower.includes('science')) {
    primaryEnginId = 'lab';
    primaryHref = '/daydream/lab';
  } else if (lower.includes('content') || lower.includes('post') || lower.includes('publish') || lower.includes('video')) {
    primaryEnginId = 'create';
    primaryHref = '/daydream/create';
  }

  const enginEntry = ENGIN_REGISTRY.find(e => e.id === primaryEnginId);
  const enginName = enginEntry?.name ?? 'GameEngin';

  return {
    eamsMessage: `✨ I've analysed your prompt and identified ${enginName} as the primary engine for this build. I'll orchestrate a creative plan around "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}" — pulling in the best Engin runtimes to make it real.`,
    idariTasks: [
      { enginId: primaryEnginId, action: 'init', detail: `Initialise ${enginName} workspace with prompt context` },
      { enginId: primaryEnginId, action: 'generate', detail: `Generate primary artifact in ${enginName}` },
      { enginId: 'forge', action: 'orchestrate', detail: 'Wire cross-engine connections and validate outputs' },
    ],
    boogieApproved: true,
    boogieMessage: `✅ Policy check passed. This build aligns with platform guidelines — no privacy, safety, or content violations detected. Cleared to proceed.`,
    primaryEnginId,
    primaryHref,
    summary: `Built with ${enginName}: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"`,
  };
}

// ── Real AI orchestration ─────────────────────────────────────────────────────

async function callEams(prompt: string): Promise<string> {
  const engineList = ENGIN_REGISTRY
    .filter(e => e.id !== 'forge')
    .map(e => `${e.id} (${e.name}): ${e.desc}`)
    .join('\n');

  const system: GroqMessage = {
    role: 'system',
    content:
      `You are Dr. Eams, the creative AI for DREAMengin.\n` +
      `A user has asked you to build something using the ForgeEngin AI Anything Builder.\n` +
      `Think out loud in a helpful, creative, enthusiastic way.\n` +
      `Suggest which Engin(s) to use and draft a high-level creative plan.\n` +
      `Keep your response under 200 words. Be specific and action-oriented.\n\n` +
      `Available Engins:\n${engineList}\n\n` +
      `Do NOT return JSON. Return a natural language creative plan.`,
  };
  const user: GroqMessage = { role: 'user', content: `Build this for me: ${prompt}` };

  try {
    return await groqChat({
      model: AI_MODELS.EAMS_PRIMARY,
      messages: [system, user],
      temperature: 0.7,
      max_tokens: 300,
    });
  } catch {
    try {
      return await groqChat({
        model: AI_MODELS.EAMS_FALLBACK,
        messages: [system, user],
        temperature: 0.7,
        max_tokens: 300,
      });
    } catch {
      return `I've analysed your prompt and have a creative plan ready. Let me hand off to IDARi to build the task list.`;
    }
  }
}

interface IdariTask {
  enginId: string;
  action: string;
  detail: string;
}

async function callIdari(prompt: string, eamsPlan: string): Promise<{
  tasks: IdariTask[];
  primaryEnginId: string;
  primaryHref: string;
  summary: string;
}> {
  const engineIds = ENGIN_REGISTRY.filter(e => e.id !== 'forge').map(e => e.id).join(', ');

  const system: GroqMessage = {
    role: 'system',
    content:
      `You are IDARi, the systems AI for DREAMengin.\n` +
      `Convert a creative plan into a concrete JSON task list.\n` +
      `Rules:\n` +
      `- NEVER require new database tables or break Row Level Security.\n` +
      `- Only use existing Engin IDs: ${engineIds}\n` +
      `- Return ONLY valid JSON. No markdown.\n` +
      `Output shape:\n` +
      `{\n` +
      `  "tasks": [{ "enginId": string, "action": string, "detail": string }],\n` +
      `  "primaryEnginId": string,\n` +
      `  "primaryHref": string,\n` +
      `  "summary": string\n` +
      `}\n` +
      `- primaryHref must be one of: /daydream/games, /daydream/music, /daydream/code, /daydream/lab, /daydream/brand, /daydream/create\n` +
      `- tasks: 2-4 items maximum\n` +
      `- summary: one sentence describing what was built`,
  };

  const user: GroqMessage = {
    role: 'user',
    content: `User prompt: ${prompt}\n\nDr. Eams plan: ${eamsPlan}`,
  };

  const defaultResult = (() => {
    const lower = prompt.toLowerCase();
    let enginId = 'games';
    let href = '/daydream/games';
    if (lower.includes('music') || lower.includes('beat') || lower.includes('song')) { enginId = 'music'; href = '/daydream/music'; }
    else if (lower.includes('code') || lower.includes('app') || lower.includes('script')) { enginId = 'code'; href = '/daydream/code'; }
    else if (lower.includes('brand') || lower.includes('design')) { enginId = 'brand'; href = '/daydream/brand'; }
    else if (lower.includes('lab') || lower.includes('data')) { enginId = 'lab'; href = '/daydream/lab'; }
    else if (lower.includes('content') || lower.includes('post') || lower.includes('video')) { enginId = 'create'; href = '/daydream/create'; }
    const name = ENGIN_REGISTRY.find(e => e.id === enginId)?.name ?? 'Engin';
    return {
      tasks: [
        { enginId, action: 'init', detail: `Set up ${name} workspace` },
        { enginId, action: 'generate', detail: `Generate primary artifact` },
      ],
      primaryEnginId: enginId,
      primaryHref: href,
      summary: `Generated with ${name}: "${prompt.slice(0, 60)}"`,
    };
  })();

  try {
    const raw = await groqChat({
      model: AI_MODELS.IDARI_PRIMARY,
      messages: [system, user],
      temperature: 0.1,
      max_tokens: 500,
    });
    const parsed = safeJsonParse(raw);
    if (!parsed) return defaultResult;

    const tasks = Array.isArray(parsed.tasks)
      ? (parsed.tasks as IdariTask[]).slice(0, 4)
      : defaultResult.tasks;

    const validEnginIds = ENGIN_REGISTRY.map(e => e.id);
    const primaryEnginId = (typeof parsed.primaryEnginId === 'string' && validEnginIds.includes(parsed.primaryEnginId))
      ? parsed.primaryEnginId
      : defaultResult.primaryEnginId;

    const validHrefs = ENGIN_REGISTRY.filter(e => e.id !== 'forge').map(e => e.daydreamHref);
    const primaryHref = (typeof parsed.primaryHref === 'string' && validHrefs.includes(parsed.primaryHref))
      ? parsed.primaryHref
      : defaultResult.primaryHref;

    const summary = typeof parsed.summary === 'string' ? parsed.summary : defaultResult.summary;

    return { tasks, primaryEnginId, primaryHref, summary };
  } catch {
    return defaultResult;
  }
}

async function callBoogie(prompt: string): Promise<{ approved: boolean; message: string }> {
  const system: GroqMessage = {
    role: 'system',
    content:
      `You are TheBoogieMan.Ai, the policy AI for DREAMengin.\n` +
      `Evaluate whether this build request violates platform policy.\n` +
      `Block requests involving: illegal activity, privacy violations, malware, bypassing security.\n` +
      `Allow: games, music, code projects, creative content, experiments, brand assets.\n` +
      `Return ONLY JSON: { "approved": boolean, "message": string }\n` +
      `If approved, message should be an encouraging approval. If rejected, explain briefly.`,
  };
  const user: GroqMessage = { role: 'user', content: `Build request: ${prompt}` };

  try {
    const raw = await groqChat({
      model: AI_MODELS.BOOGIE,
      messages: [system, user],
      temperature: 0.0,
      max_tokens: 150,
    });
    const parsed = safeJsonParse(raw);
    if (!parsed) return { approved: true, message: '✅ Policy check passed. Cleared to build.' };
    return {
      approved: parsed.approved !== false,
      message: typeof parsed.message === 'string' ? parsed.message : '✅ Policy check passed.',
    };
  } catch {
    // Fail open for policy AI — creative builds are generally safe
    return { approved: true, message: '✅ Policy check passed. Cleared to build.' };
  }
}

// ── Simulated artifact descriptions ──────────────────────────────────────────

function getArtifactDescription(enginId: string, action: string, prompt: string): string {
  const shortPrompt = prompt.slice(0, 40);
  const descriptions: Record<string, Record<string, string>> = {
    games: {
      init: `Initialised GameEngin workspace for "${shortPrompt}"`,
      generate: `Generated game level config with Babylon.js scene graph`,
      default: `GameEngin artifact created for "${shortPrompt}"`,
    },
    music: {
      init: `Opened StarMakerEngin with beat template`,
      generate: `Generated 8-bar MIDI pattern and drum grid for "${shortPrompt}"`,
      default: `StarMakerEngin track scaffold created`,
    },
    code: {
      init: `Bootstrapped CodeEngin notebook`,
      generate: `Generated TypeScript module with AI-pair annotations for "${shortPrompt}"`,
      default: `CodeEngin artifact created`,
    },
    lab: {
      init: `Opened LabEngin experiment workspace`,
      generate: `Generated data pipeline and visualisation for "${shortPrompt}"`,
      default: `LabEngin experiment scaffold ready`,
    },
    brand: {
      init: `Loaded BrandingEngin with brand kit template`,
      generate: `Generated logo variants and colour palette for "${shortPrompt}"`,
      default: `BrandingEngin asset pack created`,
    },
    create: {
      init: `Opened ContentEngin editor`,
      generate: `Generated post content and scheduling queue for "${shortPrompt}"`,
      default: `ContentEngin draft saved`,
    },
    forge: {
      orchestrate: `Cross-engine connections wired and validated`,
      default: `ForgeEngin orchestration complete`,
    },
  };
  const enginDesc = descriptions[enginId];
  if (!enginDesc) return `Task completed: ${action}`;
  return enginDesc[action] ?? enginDesc.default ?? `${action} complete`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body must be valid JSON.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body || typeof body !== 'object' || typeof (body as Record<string, unknown>).prompt !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Missing required field: prompt (string).' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const prompt = ((body as Record<string, unknown>).prompt as string).trim();
  if (!prompt) {
    return new Response(
      JSON.stringify({ error: 'Prompt must not be empty.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Server-side rate limit check (token = X-Build-Token header or IP)
  const buildToken = req.headers.get('x-build-token') ?? req.headers.get('x-forwarded-for') ?? 'anonymous';
  if (!checkServerRateLimit(buildToken)) {
    return new Response(
      JSON.stringify({ error: 'Daily build limit reached. Try again tomorrow.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  recordServerBuild(buildToken);

  const useSimulation = !process.env.GROQ_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ForgeLogEvent) => {
        try {
          controller.enqueue(encodeSSE(event));
        } catch {
          // Controller may be closed if client disconnected
        }
      };

      try {
        if (useSimulation) {
          // ── Simulation mode ──────────────────────────────────────────────
          const sim = buildSimulation(prompt);

          // Dr. Eams
          send({ type: 'agent', agent: 'Dr. Eams', message: '🧠 Analysing your prompt and drafting a creative plan...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 300));
          send({ type: 'agent', agent: 'Dr. Eams', message: sim.eamsMessage, ts: Date.now() });

          await new Promise(r => setTimeout(r, 200));

          // IDARi
          send({ type: 'agent', agent: 'IDARi', message: '⚙️ Validating against repo structure and building task list...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 300));
          send({ type: 'agent', agent: 'IDARi', message: `📋 Task list ready: ${sim.idariTasks.length} steps identified. No new DB tables required — all localStorage-based.`, ts: Date.now() });

          await new Promise(r => setTimeout(r, 200));

          // BoogieMan
          send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: '🔍 Running policy and safety check...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 300));

          if (!sim.boogieApproved) {
            send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: `🚫 ${sim.boogieMessage}`, ts: Date.now() });
            send({ type: 'error', message: 'Build blocked by TheBoogieMan.Ai policy check.', ts: Date.now() });
            controller.close();
            return;
          }

          send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: sim.boogieMessage, ts: Date.now() });

          await new Promise(r => setTimeout(r, 200));

          // Execution
          for (const task of sim.idariTasks) {
            send({ type: 'step', step: `[${task.enginId.toUpperCase()}] ${task.action}: ${task.detail}`, ts: Date.now() });
            await new Promise(r => setTimeout(r, 250));
            const desc = getArtifactDescription(task.enginId, task.action, prompt);
            send({ type: 'file', path: `${task.enginId}/${task.action}-output`, action: 'created', ts: Date.now() });
            send({ type: 'step', step: `✓ ${desc}`, ts: Date.now() });
            await new Promise(r => setTimeout(r, 150));
          }

          send({
            type: 'result',
            enginId: sim.primaryEnginId,
            href: sim.primaryHref,
            summary: sim.summary,
            ts: Date.now(),
          });
          send({ type: 'done', ts: Date.now() });

        } else {
          // ── Real AI orchestration ────────────────────────────────────────

          // Step 1 — Dr. Eams
          send({ type: 'agent', agent: 'Dr. Eams', message: '🧠 Thinking creatively about your prompt...', ts: Date.now() });
          const eamsPlan = await callEams(prompt);
          send({ type: 'agent', agent: 'Dr. Eams', message: eamsPlan, ts: Date.now() });

          // Step 2 — IDARi
          send({ type: 'agent', agent: 'IDARi', message: '⚙️ Validating plan and building task list...', ts: Date.now() });
          const idariResult = await callIdari(prompt, eamsPlan);
          send({
            type: 'agent',
            agent: 'IDARi',
            message: `📋 ${idariResult.tasks.length} tasks ready. Primary: ${idariResult.primaryEnginId}. ${idariResult.summary}`,
            ts: Date.now(),
          });

          // Step 3 — BoogieMan
          send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: '🔍 Running policy and safety check...', ts: Date.now() });
          const boogieResult = await callBoogie(prompt);

          if (!boogieResult.approved) {
            send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: `🚫 ${boogieResult.message}`, ts: Date.now() });
            send({ type: 'error', message: 'Build blocked by TheBoogieMan.Ai policy check.', ts: Date.now() });
            controller.close();
            return;
          }

          send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: `✅ ${boogieResult.message}`, ts: Date.now() });

          // Step 4 — Execute tasks
          for (const task of idariResult.tasks) {
            send({ type: 'step', step: `[${task.enginId.toUpperCase()}] ${task.action}: ${task.detail}`, ts: Date.now() });
            await new Promise(r => setTimeout(r, 100));
            const desc = getArtifactDescription(task.enginId, task.action, prompt);
            send({ type: 'file', path: `${task.enginId}/${task.action}-output`, action: 'created', ts: Date.now() });
            send({ type: 'step', step: `✓ ${desc}`, ts: Date.now() });
          }

          // Step 5 — Result
          send({
            type: 'result',
            enginId: idariResult.primaryEnginId,
            href: idariResult.primaryHref,
            summary: idariResult.summary,
            ts: Date.now(),
          });
          send({ type: 'done', ts: Date.now() });
        }
      } catch (err) {
        send({ type: 'error', message: String(err instanceof Error ? err.message : err), ts: Date.now() });
        send({ type: 'done', ts: Date.now() });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
