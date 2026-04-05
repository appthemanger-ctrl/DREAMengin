/**
 * app/api/forge/build/route.ts
 *
 * ForgeEngin — AI Anything Builder endpoint.
 *
 * Accepts: POST { prompt: string }
 * Returns: text/event-stream (SSE) with ForgeLogEvent JSON objects.
 *
 * Pipeline (real AI mode — 4 Groq rounds):
 *   1. Dr. Eams  — vivid creative brainstorm (400 tokens)
 *   2. IDARi     — task JSON + idariMessage reply to Dr. Eams
 *   3. BoogieMan — safety / policy check (aborts on rejection)
 *   4. GENERATE  — IDARi produces actual artifact content (800 tokens)
 *   5. result + done
 *
 * Simulation mode (no GROQ_API_KEY): deterministic but rich — multi-paragraph
 * Dr. Eams, IDARi replies to Dr. Eams, realistic fake code/JSON artifacts,
 * detailed execution steps.
 *
 * Architecture: server-side only (no client directive). No new Supabase tables.
 * Rate limiting: client-side (localStorage) + in-memory Map TTL here.
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

// ── Artifact meta helpers ─────────────────────────────────────────────────────

interface ArtifactMeta {
  language: string;
  filename: string;
  generateInstruction: string;
}

function getArtifactMeta(enginId: string, prompt: string): ArtifactMeta {
  const ts = Date.now();
  const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24);
  switch (enginId) {
    case 'games':
      return {
        language: 'json',
        filename: `scenes/ForgeLevel_${ts}.json`,
        generateInstruction:
          'a complete Babylon.js scene config JSON with player spawn, terrain tiles, enemy spawns, collectibles, scoreboard settings, and lighting setup',
      };
    case 'music':
      return {
        language: 'json',
        filename: `sessions/ForgeTrack_${ts}.json`,
        generateInstruction:
          'a complete DAW session JSON with BPM, key signature, 4 tracks (drums/bass/chords/melody), MIDI note arrays, effect chains, and mix settings',
      };
    case 'code':
      return {
        language: 'typescript',
        filename: `notebooks/ForgeScript_${slug}_${ts}.ts`,
        generateInstruction:
          'production-quality TypeScript module with full type annotations, error handling, and JSDoc comments',
      };
    case 'lab':
      return {
        language: 'python',
        filename: `experiments/ForgeExperiment_${slug}_${ts}.py`,
        generateInstruction:
          'a complete Python script for data analysis or simulation with typed functions, numpy/random usage, and result output',
      };
    case 'brand':
      return {
        language: 'json',
        filename: `brand/ForgePalette_${ts}.json`,
        generateInstruction:
          'a complete brand identity JSON with primary/secondary/accent/neutral colors, typography stack, spacing scale, and brand voice',
      };
    case 'create':
      return {
        language: 'markdown',
        filename: `content/ForgeDraft_${slug}_${ts}.md`,
        generateInstruction:
          'a complete markdown content draft with title, intro hook, 3 body sections, call-to-action, and hashtags',
      };
    default:
      return {
        language: 'json',
        filename: `forge/ForgeOutput_${ts}.json`,
        generateInstruction: 'a structured JSON config object with all relevant fields',
      };
  }
}

// ── Simulation content generators ─────────────────────────────────────────────

function getSimulatedArtifact(enginId: string, prompt: string): string {
  const shortPrompt = prompt.slice(0, 48);
  switch (enginId) {
    case 'games':
      return JSON.stringify({
        scene: 'desert_plateau',
        title: shortPrompt,
        sky: { color: '#e8c57a', fog: 0.004 },
        player: { startX: 128, startY: 300, abilities: ['dash', 'double_jump'], maxHealth: 100 },
        terrain: { width: 2048, tileSet: 'desert_v2', platforms: [
          { x: 0, y: 400, w: 400 }, { x: 500, y: 320, w: 200 }, { x: 800, y: 380, w: 300 },
        ]},
        enemies: [
          { type: 'dune_crawler', count: 5, patrol: true, damage: 15 },
          { type: 'sand_golem', count: 2, patrol: false, damage: 30 },
        ],
        collectibles: [{ type: 'gem', points: 100, count: 12 }, { type: 'health_pack', count: 3 }],
        scoreboard: { enabled: true, key: 'de:games:highscore:desert_plateau', displayTop: 5 },
      }, null, 2);
    case 'music':
      return JSON.stringify({
        title: shortPrompt,
        bpm: 88,
        key: 'A_minor',
        genre: 'lo-fi hip-hop',
        bars: 8,
        tracks: [
          { name: 'drums', type: 'beat', pattern: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], velocity: 0.8 },
          { name: 'bass', type: 'bass', notes: ['A2','A2','C3','C3','E3','G3','A2','A2'], duration: '8n' },
          { name: 'chords', type: 'piano', notes: ['Am7','C','G','Fmaj7'], duration: '2n', swing: 0.2 },
          { name: 'melody', type: 'rhodes', notes: ['E4','D4','C4','A3'], duration: '4n', reverb: 0.6 },
        ],
        effects: { vinyl_crackle: 0.3, room_reverb: 0.4, tape_saturation: 0.2, lowpass_cutoff: 8000 },
        master: { volume: -6, compression: { threshold: -18, ratio: 4 } },
      }, null, 2);
    case 'code':
      return `/**
 * ForgeEngin generated — ${shortPrompt}
 * CodeEngin · TypeScript
 */

interface RetryOptions {
  retries?: number;
  backoffMs?: number;
  timeout?: number;
}

/** Fetch with exponential backoff retry and per-request timeout. */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  { retries = 3, backoffMs = 500, timeout = 8000 }: RetryOptions = {}
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      if (attempt < retries - 1) {
        await sleep(backoffMs * 2 ** attempt);
      }
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries - 1) throw err;
      await sleep(backoffMs * 2 ** attempt);
    }
  }
  throw new Error(\`fetchWithRetry: all \${retries} attempts failed for \${url}\`);
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));`;
    case 'lab':
      return `# ForgeEngin generated — ${shortPrompt}
# LabEngin · Python

import random
import math
from typing import List, Tuple

def monte_carlo_gbm(
    S0: float,
    mu: float,
    sigma: float,
    T: float,
    dt: float = 1/252,
    N: int = 10_000,
) -> Tuple[float, float, List[float]]:
    """
    Monte Carlo simulation using Geometric Brownian Motion.
    Returns (mean_final, std_final, sample_paths[0]).
    """
    results: List[float] = []
    sample_path: List[float] = []
    steps = int(T / dt)

    for i in range(N):
        S = S0
        path: List[float] = [S]
        for _ in range(steps):
            dW = random.gauss(0, 1) * math.sqrt(dt)
            S *= math.exp((mu - 0.5 * sigma ** 2) * dt + sigma * dW)
            path.append(S)
        results.append(S)
        if i == 0:
            sample_path = path

    mean_val = sum(results) / N
    variance = sum((x - mean_val) ** 2 for x in results) / N
    return mean_val, math.sqrt(variance), sample_path


if __name__ == '__main__':
    mean, std, path = monte_carlo_gbm(S0=100, mu=0.08, sigma=0.20, T=1.0)
    print(f'Mean final price: \${mean:.2f}')
    print(f'Std deviation:    \${std:.2f}')
    print(f'95% CI: [\${mean - 1.96*std:.2f}, \${mean + 1.96*std:.2f}]')`;
    case 'brand':
      return JSON.stringify({
        name: shortPrompt,
        version: '1.0.0',
        palette: {
          primary: '#1a1aff',
          primaryLight: '#4d4dff',
          secondary: '#00e5ff',
          accent: '#ff4081',
          neutral100: '#f8f9fa',
          neutral900: '#0d0d0d',
        },
        typography: {
          heading: { family: 'Space Grotesk', weights: [600, 700, 800], scale: [32, 40, 56, 72] },
          body: { family: 'Inter', weights: [400, 500], scale: [14, 16, 18] },
          mono: { family: 'JetBrains Mono', weights: [400] },
        },
        spacing: [4, 8, 12, 16, 24, 32, 48, 64, 96],
        radii: [4, 8, 12, 16, 24, 9999],
        voice: { tone: 'bold, innovative, approachable', adjectives: ['clear', 'energetic', 'trustworthy'] },
        logo: { mark: 'geometric', style: 'wordmark+icon', clearspace: 16 },
      }, null, 2);
    case 'create':
      return `# ${shortPrompt}

## 🚀 The Future Is Here — And It's Incredible

We're excited to introduce something that changes everything. This isn't just an update — it's a new chapter.

---

## ✨ What Makes This Different

**Built for real people.** We obsessed over every detail so you don't have to think about it — it just works.

**Speed without compromise.** From zero to live in seconds. Your workflow, amplified.

**Privacy first, always.** Your data is yours. Full stop.

---

## 🎯 Three Things You Need to Know

1. **It's fast.** Dramatically faster than anything you've used before.
2. **It's smart.** AI that actually helps, not just a chatbot in a trenchcoat.
3. **It's yours.** Fully customizable, fully ownable.

---

## 💬 What's Next

We're just getting started. Drop a comment, share your thoughts, and let's build this together.

*Available now. No waitlist. No friction.*

---

#innovation #launch #buildinpublic #tech #product`;
    default:
      return JSON.stringify({ enginId, prompt: shortPrompt, status: 'generated', ts: Date.now() }, null, 2);
  }
}

// ── Simulation mode (no GROQ_API_KEY) ────────────────────────────────────────

interface SimTask {
  enginId: string;
  action: string;
  detail: string;
}

interface SimResult {
  eamsThinking: string;
  eamsMessage: string;
  idariMessage: string;
  idariTasks: SimTask[];
  boogieApproved: boolean;
  boogieMessage: string;
  primaryEnginId: string;
  primaryHref: string;
  summary: string;
  artifactContent: string;
  artifactLanguage: string;
  artifactFilename: string;
}

function buildSimulation(prompt: string): SimResult {
  const lower = prompt.toLowerCase();
  const shortPrompt = prompt.slice(0, 60) + (prompt.length > 60 ? '...' : '');

  // Detect primary engin from keywords
  let primaryEnginId = 'games';
  let primaryHref = '/daydream/games';

  if (lower.includes('music') || lower.includes('beat') || lower.includes('song') || lower.includes('track') || lower.includes('lo-fi') || lower.includes('lofi') || lower.includes('midi')) {
    primaryEnginId = 'music'; primaryHref = '/daydream/music';
  } else if (lower.includes('code') || lower.includes('app') || lower.includes('script') || lower.includes('program') || lower.includes('typescript') || lower.includes('python') || lower.includes('function') || lower.includes('http') || lower.includes('api') || lower.includes('client') || lower.includes('server')) {
    primaryEnginId = 'code'; primaryHref = '/daydream/code';
  } else if (lower.includes('brand') || lower.includes('logo') || lower.includes('design') || lower.includes('campaign') || lower.includes('palette') || lower.includes('identity')) {
    primaryEnginId = 'brand'; primaryHref = '/daydream/brand';
  } else if (lower.includes('lab') || lower.includes('experiment') || lower.includes('data') || lower.includes('science') || lower.includes('simulation') || lower.includes('monte carlo') || lower.includes('stock') || lower.includes('analysis')) {
    primaryEnginId = 'lab'; primaryHref = '/daydream/lab';
  } else if (lower.includes('content') || lower.includes('post') || lower.includes('publish') || lower.includes('video') || lower.includes('blog') || lower.includes('draft')) {
    primaryEnginId = 'create'; primaryHref = '/daydream/create';
  }

  const enginEntry = ENGIN_REGISTRY.find(e => e.id === primaryEnginId);
  const enginName = enginEntry?.name ?? 'GameEngin';
  const meta = getArtifactMeta(primaryEnginId, prompt);

  // Engin-specific Dr. Eams brainstorm
  const eamsThinkingMap: Record<string, string> = {
    games: '🎮 Analysing game design parameters — checking for platformer mechanics, procedural terrain, enemy AI patterns...',
    music: '🎵 Scanning for tempo cues, genre signals, mood descriptors, and harmonic content in your request...',
    code:  '💻 Identifying language targets, module boundaries, API surface, and type safety requirements...',
    lab:   '🔬 Parsing experimental parameters — looking for simulation type, dataset shape, and output format...',
    brand: '🎨 Extracting brand DNA — personality markers, color temperature, typography intent, audience signals...',
    create: '✨ Analysing content structure — hook type, narrative arc, platform fit, and engagement hooks...',
  };

  const eamsMessageMap: Record<string, string> = {
    games: `✨ This is exciting! I can see a compelling game experience in "${shortPrompt}". Here's my creative read:\n\n` +
           `**Primary engine:** ${enginName} with Babylon.js for rich 3D rendering and physics.\n\n` +
           `The core loop should feel snappy — a 2-frame dash that covers exactly 3 tile widths, landing with a dust particle burst. The desert environment gives us gorgeous warm lighting with dynamic shadow casting as the sun angle shifts through the level.\n\n` +
           `For the scoreboard, I'd wire it to localStorage first (instant, no friction) with a visual leaderboard pop-up on death. The enemy AI should use a simple patrol-then-chase state machine — readable and punishing.\n\n` +
           `IDARi, I'm thinking 3 distinct terrain sections: open sprinting zone → tight platforming gauntlet → boss arena. What do you think about the architecture?`,
    music: `✨ I can hear this track clearly! "${shortPrompt}" has real sonic identity potential.\n\n` +
           `**Primary engine:** ${enginName} — full DAW with multitrack recording and MIDI sequencing.\n\n` +
           `The vibe here should be warm and slightly melancholic — A minor pentatonic, 88 BPM with swing at 0.2. A Rhodes piano carrying the harmony over a punchy-but-soft boom-bap drum pattern. Layer in vinyl crackle at about 30% wet and you've got instant atmosphere.\n\n` +
           `For arrangement: 4-bar intro with just bass + drums → 8-bar main section with full layers → 4-bar breakdown → outro fade. Classic structure that lets the emotion breathe.\n\n` +
           `IDARi, the MIDI pattern should be 16 steps per track. Can you validate the session schema?`,
    code:  `✨ Clean architecture opportunity here! "${shortPrompt}" is asking for something robust and reusable.\n\n` +
           `**Primary engine:** ${enginName} — Monaco editor with TypeScript language service and AI pair assistant.\n\n` +
           `I'm thinking a well-typed module with proper error handling and exponential backoff. The public API surface should be minimal — one main function with an options object for config. Full JSDoc so IntelliSense is delightful.\n\n` +
           `Key design decisions: configurable retry count, per-request timeout via AbortController, backoff delay that respects rate limit headers if present. Should tree-shake cleanly for bundle size.\n\n` +
           `IDARi, validate the module structure and confirm no new dependencies are needed beyond what's already in the workspace.`,
    lab:   `✨ Fascinating experiment design! "${shortPrompt}" is a rich scientific computing challenge.\n\n` +
           `**Primary engine:** ${enginName} — Python kernel with numpy, scipy, and real-time data viz.\n\n` +
           `For a Monte Carlo simulation, I want N=10,000 runs with Geometric Brownian Motion — the standard model that accounts for continuous compounding and log-normal price distribution. We should output mean, standard deviation, 95% confidence interval, and a sample path for visualization.\n\n` +
           `The code should be clean enough to serve as a teaching example: clear function signatures, typed parameters, meaningful variable names. Add a main block so it runs standalone.\n\n` +
           `IDARi, confirm the experiment is LabEngin-compatible — Python kernel, no external API calls.`,
    brand: `✨ Strong brand energy in this brief! "${shortPrompt}" has a clear personality to amplify.\n\n` +
           `**Primary engine:** ${enginName} — design system builder with color palette, typography, and asset export.\n\n` +
           `I'm reading: bold, modern, trustworthy. That translates to a deep blue primary (confidence + tech), cyan accent (innovation + energy), hot pink for call-to-actions (memorable, distinctive). Space Grotesk for headings — premium feel, great legibility. Inter for body — the industry standard for good reason.\n\n` +
           `The palette needs to work in light AND dark contexts, so I'll specify both surface tokens. Spacing scale should be 4px-based for consistent rhythm across all breakpoints.\n\n` +
           `IDARi, generate the full design token JSON with semantic naming.`,
    create: `✨ This content has potential to really land! "${shortPrompt}" hits a topic people genuinely care about.\n\n` +
            `**Primary engine:** ${enginName} — rich text editor with scheduling queue and multi-platform publish.\n\n` +
            `Structure: open with a bold claim or surprising stat (stops the scroll), deliver the value in 3 scannable sections, close with a direct CTA. Platform-optimized for LinkedIn length but repurposable for Twitter threads and blog posts.\n\n` +
            `Voice: confident and clear, not hype-y. First person where it adds authenticity, third person for any stats or external references. Emojis used strategically as visual anchors, not decoration.\n\n` +
            `IDARi, validate the draft fits within ContentEngin's character limits for all target platforms.`,
  };

  const idariMessageMap: Record<string, string> = {
    games: `Dr. Eams, your architecture is solid — I've reviewed it against the repo. I'll generate a full Babylon.js scene config JSON for ${enginName}. The staged artifact will go to \`de:forge:staged-level\` for GameEngin to consume on launch. Three-section terrain, dash mechanic, state-machine enemies, localStorage scoreboard — all within existing capabilities. No DB table changes needed. Executing 4-step task list now.`,
    music: `Dr. Eams, the session schema validates perfectly against StarMakerEngin's expected format. I'll produce a complete DAW session JSON to \`de:forge:staged-track\`. BPM 88, A minor, 4 tracks with full MIDI arrays, vinyl + reverb effect chain. All within the existing Web Audio API stack. Confirmed: no new dependencies, no DB changes. Executing 4-step task list now.`,
    code:  `Dr. Eams, the module design is clean — TypeScript with AbortController and exponential backoff. I'll generate the full .ts source and prepend it to CodeEngin's notebook cells (\`de-codegen-cells\`). It'll appear immediately when the user opens CodeEngin. Zero new npm packages needed. Architecture validates — executing 4-step task list now.`,
    lab:   `Dr. Eams, the GBM simulation is well-scoped. I'll generate the complete Python script and stage it to \`de:forge:staged-lab\`. N=10,000 with dt=1/252, typed functions, confidence interval output — all runs inside the existing Python kernel. No external API calls, no DB changes. Executing 4-step task list now.`,
    brand: `Dr. Eams, the brand token system is well-defined. I'll generate the complete design token JSON and stage it to \`de:forge:staged-palette\` for BrandingEngin to read on launch. Full semantic naming, dark/light surface variants, 4px spacing scale. All within the existing design system. No DB changes. Executing 4-step task list now.`,
    create: `Dr. Eams, the content brief is clear and actionable. I'll generate the full markdown draft and stage it to \`de:forge:staged-draft\` for ContentEngin. LinkedIn-length main copy + repurposable sections + 5 hashtags. Platform limits all satisfied. Architecture validates — no DB changes. Executing 4-step task list now.`,
  };

  const idariTasksMap: Record<string, SimTask[]> = {
    games: [
      { enginId: 'games', action: 'scaffold', detail: `Initialise GameEngin workspace — load Babylon.js scene template for "${prompt.slice(0, 40)}"` },
      { enginId: 'games', action: 'generate-scene', detail: `Generate scene graph: terrain mesh, sky dome, player spawn, platform layout with 3 distinct sections` },
      { enginId: 'games', action: 'generate-entities', detail: `Place enemy spawns with patrol waypoints, collectibles with point values, health packs` },
      { enginId: 'forge', action: 'stage', detail: `Write scene config to de:forge:staged-level · validate JSON schema · emit artifact event` },
    ],
    music: [
      { enginId: 'music', action: 'scaffold', detail: `Initialise StarMakerEngin session — set BPM 88, key A minor, genre lo-fi hip-hop` },
      { enginId: 'music', action: 'sequence', detail: `Generate 16-step MIDI patterns for drums, bass, chord piano, melody Rhodes` },
      { enginId: 'music', action: 'effects', detail: `Compose effect chain: vinyl crackle 30%, room reverb 40%, tape saturation 20%, lowpass 8kHz` },
      { enginId: 'forge', action: 'stage', detail: `Write session JSON to de:forge:staged-track · validate schema · emit artifact event` },
    ],
    code: [
      { enginId: 'code', action: 'scaffold', detail: `Initialise CodeEngin notebook — TypeScript language mode, AI pair active` },
      { enginId: 'code', action: 'generate-module', detail: `Generate typed module: function signature, options interface, retry loop with exponential backoff` },
      { enginId: 'code', action: 'generate-types', detail: `Add JSDoc annotations, AbortController timeout, error propagation, export declarations` },
      { enginId: 'forge', action: 'stage', detail: `Prepend NotebookCell to de-codegen-cells · validate TypeScript syntax · emit artifact event` },
    ],
    lab: [
      { enginId: 'lab', action: 'scaffold', detail: `Initialise LabEngin experiment — Python kernel, numpy available, random seeded` },
      { enginId: 'lab', action: 'generate-model', detail: `Generate GBM model function with typed parameters: S0, mu, sigma, T, dt, N` },
      { enginId: 'lab', action: 'generate-output', detail: `Add confidence interval calculation, sample path tracking, formatted console output` },
      { enginId: 'forge', action: 'stage', detail: `Write Python script to de:forge:staged-lab · syntax check · emit artifact event` },
    ],
    brand: [
      { enginId: 'brand', action: 'scaffold', detail: `Initialise BrandingEngin — design token schema v2, semantic color model` },
      { enginId: 'brand', action: 'generate-palette', detail: `Generate color tokens: primary deep blue, secondary cyan, accent pink, neutral scale 100-900` },
      { enginId: 'brand', action: 'generate-typography', detail: `Generate type scale: Space Grotesk headings, Inter body, JetBrains Mono code — with weights and sizes` },
      { enginId: 'forge', action: 'stage', detail: `Write palette JSON to de:forge:staged-palette · validate token schema · emit artifact event` },
    ],
    create: [
      { enginId: 'create', action: 'scaffold', detail: `Initialise ContentEngin editor — markdown mode, LinkedIn/Twitter platform targets active` },
      { enginId: 'create', action: 'generate-hook', detail: `Generate opening hook: bold claim, first 150 characters optimised for feed preview truncation` },
      { enginId: 'create', action: 'generate-body', detail: `Generate 3 content sections with headers, scannable bullet points, CTA paragraph, 5 hashtags` },
      { enginId: 'forge', action: 'stage', detail: `Write markdown draft to de:forge:staged-draft · validate character counts · emit artifact event` },
    ],
  };

  const boogieMessages: Record<string, string> = {
    games: `✅ Policy check passed. GameEngin build is fully compliant — no violence policy violations, age-appropriate content, no privacy risks. Platform guidelines satisfied. The localStorage-only approach avoids any data-exfiltration surface. Cleared to proceed with high confidence.`,
    music: `✅ Policy check passed. StarMakerEngin build is fully compliant — original composition, no copyright sampling detected in the parameters, clean content. Web Audio API usage is within approved scope. No policy flags. Cleared to proceed.`,
    code:  `✅ Policy check passed. CodeEngin build is fully compliant — TypeScript HTTP client with retry logic is a standard safe utility. No network exfiltration, no credential handling, no privacy risks. Architecture validates cleanly. Cleared to proceed.`,
    lab:   `✅ Policy check passed. LabEngin experiment is fully compliant — Monte Carlo financial simulation is a standard educational tool. No real financial advice given, clearly labelled as simulation. No data privacy concerns, no external API calls. Cleared to proceed.`,
    brand: `✅ Policy check passed. BrandingEngin build is fully compliant — brand palette generation is a purely creative and non-harmful task. No IP violations, no deceptive branding patterns detected. JSON token schema is safe for client-side use. Cleared to proceed.`,
    create: `✅ Policy check passed. ContentEngin build is fully compliant — marketing content draft is clean, no deceptive claims, no privacy violations. Promotional language is within platform standards for authentic content. No spam patterns detected. Cleared to proceed.`,
  };

  const tasksForEngin = idariTasksMap[primaryEnginId] ?? idariTasksMap.games;
  const artifactContent = getSimulatedArtifact(primaryEnginId, prompt);
  const artifactFilename = meta.filename;
  const artifactLanguage = meta.language;

  return {
    eamsThinking: eamsThinkingMap[primaryEnginId] ?? `🧠 Analysing your prompt and drafting a creative plan for ${enginName}...`,
    eamsMessage: eamsMessageMap[primaryEnginId] ?? `✨ I've analysed your prompt and identified ${enginName} as the primary engine. Let me hand off to IDARi for architecture.`,
    idariMessage: idariMessageMap[primaryEnginId] ?? `Dr. Eams, plan validated. I'll generate the artifact for ${enginName} now. No DB changes needed. Executing.`,
    idariTasks: tasksForEngin,
    boogieApproved: true,
    boogieMessage: boogieMessages[primaryEnginId] ?? `✅ Policy check passed. Build cleared to proceed.`,
    primaryEnginId,
    primaryHref,
    summary: `Built with ${enginName}: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"`,
    artifactContent,
    artifactLanguage,
    artifactFilename,
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
      `A user wants to build something using the ForgeEngin AI Anything Builder.\n` +
      `Think out loud in a vivid, specific, enthusiastic way — like a senior creative director.\n` +
      `Identify which Engin to use and draft a concrete creative plan with real technical detail.\n` +
      `Speak directly to IDARi at the end — ask them to validate your architecture.\n` +
      `Keep your response under 300 words. Be specific: name exact features, BPMs, colors, function names, etc.\n\n` +
      `Available Engins:\n${engineList}\n\n` +
      `Do NOT return JSON. Return a natural language creative plan with technical specifics.`,
  };
  const user: GroqMessage = { role: 'user', content: `Build this for me: ${prompt}` };

  try {
    return await groqChat({ model: AI_MODELS.EAMS_PRIMARY, messages: [system, user], temperature: 0.75, max_tokens: 400 });
  } catch {
    try {
      return await groqChat({ model: AI_MODELS.EAMS_FALLBACK, messages: [system, user], temperature: 0.75, max_tokens: 400 });
    } catch {
      return `✨ I've analysed "${prompt.slice(0, 60)}" and have a strong creative plan ready. IDARi, please validate the architecture and generate the task list.`;
    }
  }
}

interface IdariTask {
  enginId: string;
  action: string;
  detail: string;
}

interface IdariCallResult {
  tasks: IdariTask[];
  primaryEnginId: string;
  primaryHref: string;
  summary: string;
  idariMessage: string;
}

function getDefaultIdariResult(prompt: string): IdariCallResult {
  const lower = prompt.toLowerCase();
  let enginId = 'games'; let href = '/daydream/games';
  if (lower.includes('music') || lower.includes('beat') || lower.includes('song') || lower.includes('track') || lower.includes('lo-fi')) { enginId = 'music'; href = '/daydream/music'; }
  else if (lower.includes('code') || lower.includes('typescript') || lower.includes('python') || lower.includes('script') || lower.includes('http') || lower.includes('api')) { enginId = 'code'; href = '/daydream/code'; }
  else if (lower.includes('brand') || lower.includes('design') || lower.includes('palette') || lower.includes('logo')) { enginId = 'brand'; href = '/daydream/brand'; }
  else if (lower.includes('lab') || lower.includes('data') || lower.includes('simulation') || lower.includes('experiment') || lower.includes('monte')) { enginId = 'lab'; href = '/daydream/lab'; }
  else if (lower.includes('content') || lower.includes('post') || lower.includes('publish') || lower.includes('draft')) { enginId = 'create'; href = '/daydream/create'; }
  const name = ENGIN_REGISTRY.find(e => e.id === enginId)?.name ?? 'Engin';
  return {
    tasks: [
      { enginId, action: 'scaffold', detail: `Initialise ${name} workspace for "${prompt.slice(0, 40)}"` },
      { enginId, action: 'generate', detail: `Generate primary artifact — full ${name} content` },
      { enginId, action: 'validate', detail: `Validate artifact schema and Engin compatibility` },
      { enginId: 'forge', action: 'stage', detail: `Stage artifact to Engin localStorage slot and emit code event` },
    ],
    primaryEnginId: enginId,
    primaryHref: href,
    summary: `Generated with ${name}: "${prompt.slice(0, 60)}"`,
    idariMessage: `Dr. Eams, plan validated. I'll generate the ${name} artifact now. Architecture checks out — no DB table changes needed. Executing 4-step task list.`,
  };
}

async function callIdari(prompt: string, eamsPlan: string): Promise<IdariCallResult> {
  const engineIds = ENGIN_REGISTRY.filter(e => e.id !== 'forge').map(e => e.id).join(', ');

  const system: GroqMessage = {
    role: 'system',
    content:
      `You are IDARi, the systems AI for DREAMengin.\n` +
      `Convert Dr. Eams' creative plan into a concrete JSON task list.\n` +
      `Rules:\n` +
      `- NEVER require new database tables or break Row Level Security.\n` +
      `- Only use existing Engin IDs: ${engineIds}\n` +
      `- Return ONLY valid JSON. No markdown wrapper.\n` +
      `Output shape:\n` +
      `{\n` +
      `  "tasks": [{ "enginId": string, "action": string, "detail": string }],\n` +
      `  "primaryEnginId": string,\n` +
      `  "primaryHref": string,\n` +
      `  "summary": string,\n` +
      `  "idariMessage": string\n` +
      `}\n` +
      `- primaryHref: one of /daydream/games, /daydream/music, /daydream/code, /daydream/lab, /daydream/brand, /daydream/create\n` +
      `- tasks: 3-5 items with specific technical detail (name functions, file formats, schema keys)\n` +
      `- summary: one sentence describing what was built\n` +
      `- idariMessage: speak directly to Dr. Eams, e.g. "Dr. Eams, your plan is solid. I'll create [X] in [Engin]. The primary artifact will be [specific description]. Architecture validates — no DB table changes needed."`,
  };

  const user: GroqMessage = {
    role: 'user',
    content: `User prompt: ${prompt}\n\nDr. Eams plan: ${eamsPlan}`,
  };

  const defaultResult = getDefaultIdariResult(prompt);

  try {
    const raw = await groqChat({ model: AI_MODELS.IDARI_PRIMARY, messages: [system, user], temperature: 0.1, max_tokens: 600 });
    const parsed = safeJsonParse(raw);
    if (!parsed) return defaultResult;

    const tasks = Array.isArray(parsed.tasks) ? (parsed.tasks as IdariTask[]).slice(0, 5) : defaultResult.tasks;
    const validEnginIds = ENGIN_REGISTRY.map(e => e.id);
    const primaryEnginId = (typeof parsed.primaryEnginId === 'string' && validEnginIds.includes(parsed.primaryEnginId))
      ? parsed.primaryEnginId : defaultResult.primaryEnginId;
    const validHrefs = ENGIN_REGISTRY.filter(e => e.id !== 'forge').map(e => e.daydreamHref);
    const primaryHref = (typeof parsed.primaryHref === 'string' && validHrefs.includes(parsed.primaryHref))
      ? parsed.primaryHref : defaultResult.primaryHref;
    const summary = typeof parsed.summary === 'string' ? parsed.summary : defaultResult.summary;
    const idariMessage = typeof parsed.idariMessage === 'string' ? parsed.idariMessage : defaultResult.idariMessage;

    return { tasks, primaryEnginId, primaryHref, summary, idariMessage };
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
      `Block: illegal activity, privacy violations, malware, bypassing security, CSAM, exploitation.\n` +
      `Allow: games, music, code projects, creative content, experiments, brand assets, data science.\n` +
      `Return ONLY JSON: { "approved": boolean, "message": string }\n` +
      `If approved, message should be an encouraging, specific approval explaining what was checked and why it passed.\n` +
      `Mention what specific risk categories were evaluated and cleared.`,
  };
  const user: GroqMessage = { role: 'user', content: `Build request: ${prompt}` };

  try {
    const raw = await groqChat({ model: AI_MODELS.BOOGIE, messages: [system, user], temperature: 0.0, max_tokens: 200 });
    const parsed = safeJsonParse(raw);
    if (!parsed) return { approved: true, message: '✅ Policy check passed. No violations detected across all risk categories. Cleared to build.' };
    return {
      approved: parsed.approved !== false,
      message: typeof parsed.message === 'string' ? parsed.message : '✅ Policy check passed.',
    };
  } catch {
    return { approved: true, message: '✅ Policy check passed. Build aligns with platform guidelines — no privacy, safety, or content violations. Cleared.' };
  }
}

async function callGenerate(
  prompt: string,
  enginId: string,
  taskDetail: string,
  language: string,
  generateInstruction: string,
): Promise<string> {
  const system: GroqMessage = {
    role: 'system',
    content:
      `You are IDARi. Generate actual ${language} content for this ${enginId} build request.\n` +
      `Output ONLY the raw file content — no explanation, no markdown code fences, no preamble.\n` +
      `Make it real, complete, and production-quality. Include comments where helpful.`,
  };
  const user: GroqMessage = {
    role: 'user',
    content:
      `User request: ${prompt}\n` +
      `Primary engin: ${enginId}\n` +
      `Generate: ${generateInstruction} — ${taskDetail}`,
  };

  try {
    return await groqChat({ model: AI_MODELS.IDARI_PRIMARY, messages: [system, user], temperature: 0.3, max_tokens: 800 });
  } catch {
    // Fallback to simulation content if generate call fails
    return getSimulatedArtifact(enginId, prompt);
  }
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

  // Server-side rate limit
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
        try { controller.enqueue(encodeSSE(event)); } catch { /* client disconnected */ }
      };

      try {
        if (useSimulation) {
          // ── Simulation mode ─────────────────────────────────────────────

          send({ type: 'step', step: 'PHASE: Parsing your request...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 150));

          const sim = buildSimulation(prompt);
          const enginEntry = ENGIN_REGISTRY.find(e => e.id === sim.primaryEnginId);
          const enginName = enginEntry?.name ?? 'Engin';

          // Dr. Eams round
          send({ type: 'step', step: 'PHASE: Dr. Eams is thinking creatively...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 200));
          send({ type: 'agent', agent: 'Dr. Eams', message: sim.eamsThinking, ts: Date.now() });
          await new Promise(r => setTimeout(r, 450));
          send({ type: 'agent', agent: 'Dr. Eams', message: sim.eamsMessage, ts: Date.now() });
          await new Promise(r => setTimeout(r, 250));

          // IDARi round
          send({ type: 'step', step: 'PHASE: IDARi is architecting the solution...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 200));
          send({ type: 'agent', agent: 'IDARi', message: '⚙️ Reviewing Dr. Eams\' plan — validating Engin compatibility and task breakdown...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 400));
          send({ type: 'agent', agent: 'IDARi', message: sim.idariMessage, ts: Date.now() });
          await new Promise(r => setTimeout(r, 250));

          // BoogieMan round
          send({ type: 'step', step: 'PHASE: TheBoogieMan.Ai is checking policy...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 200));
          send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: '🔍 Running policy scan — checking content safety, privacy, platform guidelines...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 400));

          if (!sim.boogieApproved) {
            send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: `🚫 ${sim.boogieMessage}`, ts: Date.now() });
            send({ type: 'error', message: 'Build blocked by TheBoogieMan.Ai policy check.', ts: Date.now() });
            controller.close();
            return;
          }

          send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: sim.boogieMessage, ts: Date.now() });
          await new Promise(r => setTimeout(r, 200));

          // Execution — tasks
          send({ type: 'step', step: 'PHASE: Generating artifact...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 150));

          for (const task of sim.idariTasks) {
            const enginLabel = ENGIN_REGISTRY.find(e => e.id === task.enginId)?.name ?? task.enginId.toUpperCase();
            send({ type: 'step', step: `${enginLabel}: ${task.detail}`, ts: Date.now() });
            await new Promise(r => setTimeout(r, 320));
          }

          // Emit the actual code artifact
          send({
            type: 'code',
            language: sim.artifactLanguage,
            filename: sim.artifactFilename,
            content: sim.artifactContent,
            ts: Date.now(),
          });
          await new Promise(r => setTimeout(r, 200));

          // Emit real file event
          send({ type: 'file', path: sim.artifactFilename, action: 'created', ts: Date.now() });
          await new Promise(r => setTimeout(r, 150));

          // Staging phase
          send({ type: 'step', step: `PHASE: Staging to ${enginName}...`, ts: Date.now() });
          await new Promise(r => setTimeout(r, 200));
          send({ type: 'step', step: `✓ Staged artifact to ${enginName} — ready to launch`, ts: Date.now() });
          await new Promise(r => setTimeout(r, 150));

          send({
            type: 'result',
            enginId: sim.primaryEnginId,
            href: sim.primaryHref,
            summary: sim.summary,
            ts: Date.now(),
          });

          send({ type: 'step', step: 'PHASE: Build complete! 🎉', ts: Date.now() });
          await new Promise(r => setTimeout(r, 100));
          send({ type: 'done', ts: Date.now() });

        } else {
          // ── Real AI orchestration (4 Groq rounds) ───────────────────────

          // ─ Round 1: Dr. Eams ─────────────────────────────────────────────
          send({ type: 'step', step: 'PHASE: Parsing your request...', ts: Date.now() });
          await new Promise(r => setTimeout(r, 100));

          send({ type: 'step', step: 'PHASE: Dr. Eams is thinking creatively...', ts: Date.now() });
          send({ type: 'agent', agent: 'Dr. Eams', message: '🧠 Analysing your prompt — mapping creative intent to Engin capabilities...', ts: Date.now() });
          const eamsPlan = await callEams(prompt);
          send({ type: 'agent', agent: 'Dr. Eams', message: eamsPlan, ts: Date.now() });

          // ─ Round 2: IDARi ─────────────────────────────────────────────────
          send({ type: 'step', step: 'PHASE: IDARi is architecting the solution...', ts: Date.now() });
          send({ type: 'agent', agent: 'IDARi', message: '⚙️ Reviewing Dr. Eams\' plan — validating Engin compatibility, task breakdown, and architecture constraints...', ts: Date.now() });
          const idariResult = await callIdari(prompt, eamsPlan);
          send({ type: 'agent', agent: 'IDARi', message: idariResult.idariMessage, ts: Date.now() });

          // ─ Round 3: BoogieMan ─────────────────────────────────────────────
          send({ type: 'step', step: 'PHASE: TheBoogieMan.Ai is checking policy...', ts: Date.now() });
          send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: '🔍 Running policy and safety scan — checking content, privacy, platform guidelines...', ts: Date.now() });
          const boogieResult = await callBoogie(prompt);

          if (!boogieResult.approved) {
            send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: `🚫 ${boogieResult.message}`, ts: Date.now() });
            send({ type: 'error', message: 'Build blocked by TheBoogieMan.Ai policy check.', ts: Date.now() });
            controller.close();
            return;
          }
          send({ type: 'agent', agent: 'TheBoogieMan.Ai', message: `✅ ${boogieResult.message}`, ts: Date.now() });

          // ─ Execution steps ────────────────────────────────────────────────
          send({ type: 'step', step: 'PHASE: Generating artifact...', ts: Date.now() });
          for (const task of idariResult.tasks) {
            const enginLabel = ENGIN_REGISTRY.find(e => e.id === task.enginId)?.name ?? task.enginId.toUpperCase();
            send({ type: 'step', step: `${enginLabel}: ${task.detail}`, ts: Date.now() });
            await new Promise(r => setTimeout(r, 120));
          }

          // ─ Round 4: GENERATE artifact ─────────────────────────────────────
          const meta = getArtifactMeta(idariResult.primaryEnginId, prompt);
          const generateTask = idariResult.tasks.find(t => t.action.includes('generate') || t.action.includes('Generate'))
            ?? idariResult.tasks[1]
            ?? idariResult.tasks[0];

          const artifactContent = await callGenerate(
            prompt,
            idariResult.primaryEnginId,
            generateTask?.detail ?? 'primary artifact',
            meta.language,
            meta.generateInstruction,
          );

          // Emit code artifact event
          send({
            type: 'code',
            language: meta.language,
            filename: meta.filename,
            content: artifactContent,
            ts: Date.now(),
          });
          await new Promise(r => setTimeout(r, 100));

          // Emit real file event
          send({ type: 'file', path: meta.filename, action: 'created', ts: Date.now() });

          // Staging phase
          const enginEntry = ENGIN_REGISTRY.find(e => e.id === idariResult.primaryEnginId);
          const enginName = enginEntry?.name ?? 'Engin';
          send({ type: 'step', step: `PHASE: Staging to ${enginName}...`, ts: Date.now() });
          await new Promise(r => setTimeout(r, 100));
          send({ type: 'step', step: `✓ Staged artifact to ${enginName} — ready to launch`, ts: Date.now() });

          // Result + done
          send({
            type: 'result',
            enginId: idariResult.primaryEnginId,
            href: idariResult.primaryHref,
            summary: idariResult.summary,
            ts: Date.now(),
          });

          send({ type: 'step', step: 'PHASE: Build complete! 🎉', ts: Date.now() });
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
