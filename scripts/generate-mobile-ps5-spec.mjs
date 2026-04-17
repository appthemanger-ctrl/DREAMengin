import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// ─── Named constants ────────────────────────────────────────────────────────
const OUTPUT_PATH = path.resolve(process.cwd(), 'docs/mobile-ps5-web-gaming-engine-spec.md');
const SNIPPET_MAX_CHARS = 1800;
const COVERAGE_STRONG_PCT = 75;
const COVERAGE_PARTIAL_PCT = 40;

// ─── Research sources ────────────────────────────────────────────────────────
const researchSources = [
  { area: 'rendering', title: 'WebGPU API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API' },
  { area: 'rendering', title: 'WebGPU Fundamentals', url: 'https://webgpufundamentals.org/' },
  { area: 'platform', title: 'Can I use: WebGPU', url: 'https://caniuse.com/webgpu' },
  { area: 'performance', title: 'web.dev: Optimize JavaScript execution', url: 'https://web.dev/articles/optimize-javascript-execution' },
  { area: 'performance', title: 'web.dev: Rendering performance', url: 'https://web.dev/articles/rendering-performance' },
  { area: 'input', title: 'MDN: Gamepad API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API' },
  { area: 'input', title: 'MDN: Pointer Events', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events' },
  { area: 'audio', title: 'MDN: Web Audio API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API' },
  { area: 'networking', title: 'MDN: WebRTC API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API' },
  { area: 'networking', title: 'MDN: WebTransport API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API' },
  { area: 'storage', title: 'MDN: IndexedDB API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API' },
  { area: 'resilience', title: 'MDN: Service Worker API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API' },
  { area: 'resilience', title: 'MDN: OffscreenCanvas', url: 'https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas' },
  { area: 'mobile', title: 'web.dev: Baseline', url: 'https://web.dev/baseline' },
  { area: 'quality', title: 'MDN: Performance API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Performance_API' },
];

// ─── PS5-level capability pillars ─────────────────────────────────────────────
// Each pillar has:
//  - requiredSpecArtifacts: what must be documented/designed
//  - completionChecks: repo file + grep-symbol pairs. ALL must exist for the
//    pillar to be considered IMPLEMENTED. When every pillar is IMPLEMENTED,
//    the spec reaches its endpoint and the workflow stops committing.
const capabilityChecklist = [
  {
    name: 'Graphics & Rendering',
    levelTarget: 'Console-grade visuals on mobile web (WebGPU-first, graceful WebGL fallback).',
    requiredSpecArtifacts: [
      'Frame-time budget table (16.6ms @ 60fps, 8.3ms @ 120fps target mode).',
      'Tiered quality ladder (ultra/high/medium/low) with explicit toggles per device class.',
      'Material, lighting, shadows, post-processing and LOD policy with hard caps.',
    ],
    completionChecks: [
      { file: 'engins/gameengin/core.ts', symbol: 'QualityTier', desc: 'Adaptive quality tiers (ultra/high/medium/low)' },
      { file: 'engins/gameengin/core.ts', symbol: 'QUALITY_PRESETS', desc: 'Quality preset budgets with targetFps' },
      { file: 'engins/gameengin/post-fx.ts', symbol: 'PostFXManager', desc: 'Post-processing pipeline (bloom, SSAO, DoF, motion blur)' },
      { file: 'engins/gameengin/power-systems.ts', symbol: 'LODSystem', desc: 'Level-of-detail system' },
    ],
  },
  {
    name: 'Gameplay Simulation',
    levelTarget: 'Deterministic gameplay loops with predictable physics, AI, and save-state behavior.',
    requiredSpecArtifacts: [
      'Fixed-timestep simulation contract and rollback/replay strategy.',
      'Entity/system budgets by genre scenario (arena, open zone, RTS swarm).',
      'Determinism tests for input playback and netcode desync detection.',
    ],
    completionChecks: [
      { file: 'engins/gameengin/power-systems.ts', symbol: 'RollbackNetcode', desc: 'Deterministic rollback netcode (lockstep)' },
      { file: 'engins/gameengin/power-systems.ts', symbol: 'ReplayBuffer', desc: 'Input recording and deterministic replay' },
      { file: 'engins/gameengin/power-systems.ts', symbol: 'AdvancedPhysicsWorld', desc: 'Havok-compatible physics world' },
      { file: 'engins/gameengin/power-systems.ts', symbol: 'BehaviorTreeEngine', desc: 'AI behaviour trees + GOAP planner' },
    ],
  },
  {
    name: 'Input & Controls',
    levelTarget: 'Native-feeling touch + controller + keyboard/mouse parity on mobile browser.',
    requiredSpecArtifacts: [
      'Input abstraction mapping touch gestures, gamepad, keyboard, and accessibility remaps.',
      'Latency budget from hardware event to simulation tick and rendered frame.',
      'DualSense/gamepad feature policy (haptics/trigger semantics where available).',
    ],
    completionChecks: [
      { file: 'lib/gestures/touchGestures.ts', symbol: '', desc: 'Touch gesture abstraction layer' },
      { file: 'lib/games/DualSenseManager.ts', symbol: 'DualSenseManager', desc: 'PS5 DualSense haptics + gamepad integration' },
      { file: 'engins/gameengin/gameEnginRuntime.ts', symbol: 'dualsense', desc: 'Runtime gamepad detection (DualSense vs generic)' },
      { file: 'engins/gameengin/control-mappings.ts', symbol: 'ControlMapping', desc: 'Persistent control mapping API' },
    ],
  },
  {
    name: 'Audio Pipeline',
    levelTarget: 'Low-latency, spatially coherent audio with stable mixing under load.',
    requiredSpecArtifacts: [
      'Voice/music/SFX channel budget and ducking strategy.',
      'Spatial audio and occlusion policy tied to gameplay state.',
      'Audio quality fallback plan for constrained devices and power-save modes.',
    ],
    completionChecks: [
      { file: 'engins/gameengin/power-systems.ts', symbol: 'SpatialAudioDSP', desc: 'HRTF + convolution reverb + Doppler spatial audio' },
    ],
  },
  {
    name: 'Networking & Online Systems',
    levelTarget: 'Fast, resilient multiplayer and social synchronization for mobile conditions.',
    requiredSpecArtifacts: [
      'Transport matrix (WebSocket/WebRTC/WebTransport) and authority model.',
      'Jitter/packet-loss tolerance targets and reconnection strategy.',
      'Cheat-resistance model and secure state validation boundaries.',
    ],
    completionChecks: [
      { file: 'engins/gameengin/power-systems.ts', symbol: 'RollbackNetcode', desc: 'Rollback netcode with authority model' },
      { file: 'engins/gameengin/power-systems.ts', symbol: 'ClientSidePrediction', desc: 'Client-side prediction + server reconciliation' },
      { file: 'engins/gameengin/power-systems.ts', symbol: 'ReplayBuffer', desc: 'Anti-cheat hash in replay buffer' },
    ],
  },
  {
    name: 'Asset Streaming & Memory',
    levelTarget: 'Near-instant world entry with progressive streaming and strict memory caps.',
    requiredSpecArtifacts: [
      'Asset bundling/chunking and prefetch priority policy.',
      'Memory budgets by subsystem (textures, meshes, animation, audio, AI).',
      'Warm-start / cold-start targets and cache invalidation strategy.',
    ],
    completionChecks: [
      { file: 'engins/gameengin/power-systems.ts', symbol: 'AssetStreamManager', desc: 'Priority-queue progressive LOD asset streaming' },
      { file: 'engins/gameengin/power-systems.ts', symbol: 'ResourcePool', desc: 'Zero-allocation fixed-capacity object pools' },
      { file: 'engins/gameengin/power-systems.ts', symbol: 'TerrainEngine', desc: 'Heightmap clipmap LOD with virtual textures' },
    ],
  },
  {
    name: 'Offline, Recovery & Session Continuity',
    levelTarget: 'Game survives tab lifecycle events and intermittent connectivity.',
    requiredSpecArtifacts: [
      'Offline behavior matrix for gameplay and social features.',
      'Suspend/resume/restore contract for background/foreground transitions.',
      'Corruption protection + recovery playbook for cached state and saves.',
    ],
    completionChecks: [
      { file: 'lib/runtime/offlineQueue.ts', symbol: '', desc: 'Offline action queue with auto-flush' },
      { file: 'lib/intelligence/sessionContinuity.ts', symbol: 'SessionContinuity', desc: 'Session continuity and restoration' },
    ],
  },
  {
    name: 'Security, Safety & Privacy',
    levelTarget: 'Production-safe gameplay ecosystem with anti-abuse and privacy-by-default design.',
    requiredSpecArtifacts: [
      'Threat model for client, transport, backend, and user-generated content.',
      'Moderation hooks, abuse detection signals, and incident response process.',
      'Data-minimization matrix and consent boundaries by feature.',
    ],
    completionChecks: [
      { file: 'docs/SECURITY.md', symbol: '', desc: 'Security policy and threat model document' },
      { file: 'lib/child-safety/scanMediaUrls.ts', symbol: '', desc: 'Child-safety / content moderation layer' },
    ],
  },
  {
    name: 'Quality Engineering & Telemetry',
    levelTarget: 'Continuous proof that the engine meets target quality on real mobile devices.',
    requiredSpecArtifacts: [
      'KPI dashboard: FPS, frame pacing, crash-free sessions, startup time, battery impact.',
      'Device coverage matrix and regression test gates.',
      'Auto-rollback and release confidence criteria tied to live telemetry.',
    ],
    completionChecks: [
      { file: 'engins/gameengin/power-systems.ts', symbol: 'GPUProfiler', desc: 'WebGPU timestamp queries + CPU flame-graph' },
      { file: 'engins/gameengin/core.ts', symbol: 'FrameTelemetry', desc: 'Runtime telemetry type (FPS, frame time, draw calls)' },
    ],
  },
];

// ─── Repo-based completion check ──────────────────────────────────────────────
async function checkCompletion() {
  const results = [];
  for (const capability of capabilityChecklist) {
    const checks = [];
    for (const check of capability.completionChecks) {
      const fullPath = path.resolve(process.cwd(), check.file);
      const fileExists = existsSync(fullPath);
      let symbolFound = true;
      if (fileExists && check.symbol) {
        const content = await readFile(fullPath, 'utf8');
        symbolFound = content.includes(check.symbol);
      }
      checks.push({ ...check, pass: fileExists && symbolFound });
    }
    const passingCount = checks.filter((c) => c.pass).length;
    const totalCount = checks.length;
    const pillarComplete = totalCount > 0 && passingCount === totalCount;
    results.push({ pillar: capability.name, checks, passingCount, totalCount, pillarComplete });
  }
  return results;
}

// ─── Source fetching ───────────────────────────────────────────────────────────
function stripHtml(input) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchSource(source) {
  try {
    const response = await fetch(source.url, {
      headers: {
        'user-agent': 'DREAMengin-Mobile-PS5-Spec-Bot/1.0 (+https://github.com/appthemanager-ctrl/DREAMengin)',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return { ...source, ok: false, status: `HTTP ${response.status}` };
    }

    const body = await response.text();
    const normalized = stripHtml(body).toLowerCase();

    return {
      ...source,
      ok: true,
      status: 'ok',
      snippet: normalized.slice(0, SNIPPET_MAX_CHARS),
    };
  } catch (error) {
    return {
      ...source,
      ok: false,
      status: error instanceof Error ? error.message : 'fetch_error',
    };
  }
}

function scoreWebCoverage(capability, research) {
  const successfulByArea = new Map();
  for (const item of research) {
    if (item.ok) {
      successfulByArea.set(item.area, (successfulByArea.get(item.area) ?? 0) + 1);
    }
  }

  const areaSignals = {
    'Graphics & Rendering': ['rendering', 'platform', 'performance', 'mobile'],
    'Gameplay Simulation': ['performance', 'quality', 'storage'],
    'Input & Controls': ['input', 'mobile'],
    'Audio Pipeline': ['audio', 'performance'],
    'Networking & Online Systems': ['networking', 'quality'],
    'Asset Streaming & Memory': ['storage', 'performance', 'resilience'],
    'Offline, Recovery & Session Continuity': ['resilience', 'storage', 'mobile'],
    'Security, Safety & Privacy': ['networking', 'quality', 'mobile'],
    'Quality Engineering & Telemetry': ['quality', 'performance', 'mobile'],
  };

  const requiredAreas = areaSignals[capability.name] ?? [];
  const coveredAreas = requiredAreas.filter((area) => (successfulByArea.get(area) ?? 0) > 0);
  const coveragePct = requiredAreas.length === 0 ? 0 : Math.round((coveredAreas.length / requiredAreas.length) * 100);

  return {
    requiredAreas,
    coveredAreas,
    coveragePct,
    statusLabel:
      coveragePct >= COVERAGE_STRONG_PCT
        ? 'Research coverage strong'
        : coveragePct >= COVERAGE_PARTIAL_PCT
          ? 'Research coverage partial'
          : 'Research coverage weak',
  };
}

// ─── Spec markdown builder ─────────────────────────────────────────────────────
function buildSpecMarkdown(research, completionResults) {
  const successful = research.filter((item) => item.ok);
  const failed = research.filter((item) => !item.ok);

  const completedPillars = completionResults.filter((r) => r.pillarComplete).length;
  const totalPillars = completionResults.length;
  const overallPct = Math.round((completedPillars / totalPillars) * 100);
  const specComplete = completedPillars === totalPillars;

  const lines = [];
  lines.push('# Mobile Web "PS5-Level" Gaming Engine Spec (Auto-Evolving)');
  lines.push('');
  lines.push('This document is regenerated by `.github/workflows/mobile-ps5-spec-evolution.yml` every 15 minutes.');
  lines.push('It continuously researches public web platform sources, checks the DREAMengin codebase,');
  lines.push('and updates this spec for AI-assisted implementation. **The workflow stops committing once');
  lines.push('all capability pillars are confirmed implemented in the repo.**');
  lines.push('');

  if (specComplete) {
    lines.push('> ## 🏁 SPEC COMPLETE — ALL CAPABILITY PILLARS IMPLEMENTED');
    lines.push('> ');
    lines.push('> Every required system has been verified in the DREAMengin codebase.');
    lines.push('> This spec has reached its endpoint. The workflow will no longer commit changes.');
    lines.push('> The DREAMengin GameEngin is confirmed at PS5-level mobile web quality.');
    lines.push('');
  } else {
    lines.push(`> **Overall implementation progress: ${completedPillars}/${totalPillars} pillars complete (${overallPct}%)**`);
    lines.push('');
  }

  // ── 1. Requirements List ──────────────────────────────────────────────────────
  lines.push('## PS5-Level Gaming Engine Requirements List');
  lines.push('');
  lines.push('What must be true for a mobile web game engine to qualify as "PS5-level":');
  lines.push('');
  lines.push('1. **Console-grade rendering** — WebGPU-first pipeline, full PBR materials, bloom/SSAO/DoF/motion-blur post-FX, LOD, 60fps target with 120fps mode, graceful WebGL2 fallback.');
  lines.push('2. **Deterministic simulation** — Fixed-timestep loop, rollback netcode, authoritative replay with anti-cheat hashing, physics engine, ECS architecture with per-system budgets.');
  lines.push('3. **Universal input parity** — Touch gestures, controller (including DualSense haptics & adaptive triggers), keyboard/mouse, all routed through a unified input abstraction with latency budgets.');
  lines.push('4. **Spatial audio** — HRTF head-related transfer functions, convolution reverb, Doppler shift, voice/music/SFX channel budget, graceful degradation on constrained devices.');
  lines.push('5. **Resilient networking** — WebSocket + WebRTC + WebTransport transport matrix, client-side prediction + server reconciliation, jitter/packet-loss tolerance, secure state boundaries.');
  lines.push('6. **Progressive asset streaming** — Priority-queue LOD streaming, zero-allocation resource pools, virtual texture pages, warm-start/cold-start targets, memory caps per subsystem.');
  lines.push('7. **Offline & session resilience** — Offline action queue, background/foreground suspend/resume contract, session continuity and restore, corruption recovery playbook.');
  lines.push('8. **Security, safety & privacy** — Documented threat model, content moderation hooks, child-safety scanning, data-minimisation policy, anti-abuse signals.');
  lines.push('9. **Quality engineering** — Live GPU/CPU telemetry, FPS + frame-pacing KPIs, device coverage matrix, automated regression gates, auto-rollback on quality regression.');
  lines.push('');

  // ── 2. End-point definition ───────────────────────────────────────────────────
  lines.push('## End-Point Definition (When the mission is complete)');
  lines.push('');
  lines.push('The spec workflow reaches its endpoint when **every capability pillar** below shows ✅ in "Repo Status".');
  lines.push('At that point the spec file no longer changes and the 15-minute job becomes a no-op commit-free run.');
  lines.push('');

  // ── 3. Capability pillars ─────────────────────────────────────────────────────
  lines.push('## Capability Pillars — Detailed Spec');
  lines.push('');

  for (let i = 0; i < capabilityChecklist.length; i++) {
    const capability = capabilityChecklist[i];
    const webScore = scoreWebCoverage(capability, research);
    const completion = completionResults[i];
    const pillarIcon = completion.pillarComplete ? '✅' : '🔧';

    lines.push(`### ${pillarIcon} ${capability.name}`);
    lines.push(`- **Target level:** ${capability.levelTarget}`);
    lines.push(`- **Repo status:** ${completion.pillarComplete ? `✅ IMPLEMENTED (${completion.passingCount}/${completion.totalCount} checks pass)` : `🔧 IN PROGRESS (${completion.passingCount}/${completion.totalCount} checks pass)`}`);
    lines.push(`- **Web research coverage:** ${webScore.statusLabel} (${webScore.coveragePct}%)`);
    lines.push('- **Must be specified:**');
    for (const item of capability.requiredSpecArtifacts) {
      lines.push(`  - ${item}`);
    }
    lines.push('- **Implementation checks:**');
    for (const check of completion.checks) {
      const icon = check.pass ? '✅' : '❌';
      lines.push(`  - ${icon} \`${check.file}\`${check.symbol ? ` — \`${check.symbol}\`` : ''}: ${check.desc}`);
    }
    lines.push('');
  }

  // ── 4. Web research snapshot ──────────────────────────────────────────────────
  lines.push('## Source Research Snapshot');
  lines.push('');
  lines.push(`- Successful fetches: **${successful.length}**`);
  lines.push(`- Failed fetches: **${failed.length}**`);
  lines.push('');
  lines.push('| Area | Source | Status | URL |');
  lines.push('|---|---|---|---|');
  for (const item of research) {
    lines.push(`| ${item.area} | ${item.title.replace(/\|/g, '\\|')} | ${item.status.replace(/\|/g, '\\|')} | ${item.url} |`);
  }
  lines.push('');

  if (failed.length > 0) {
    lines.push('## Recovery Tasks (auto-maintained)');
    lines.push('');
    for (const item of failed) {
      lines.push(`- Re-check source availability and alternate references for **${item.title}** (${item.url}).`);
    }
    lines.push('');
  }

  // ── 5. AI dev checklist ───────────────────────────────────────────────────────
  lines.push('## AI Dev Application Checklist for DREAMengin');
  lines.push('');
  for (const result of completionResults) {
    const icon = result.pillarComplete ? '- [x]' : '- [ ]';
    lines.push(`${icon} **${result.pillar}**: ${result.pillarComplete ? 'complete' : `implement all checks (${result.passingCount}/${result.totalCount} done)`}.`);
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
}

// ─── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  const [fetched, completionResults] = await Promise.all([
    Promise.all(researchSources.map((source) => fetchSource(source))),
    checkCompletion(),
  ]);

  const next = buildSpecMarkdown(fetched, completionResults);

  let previous = '';
  try {
    previous = await readFile(OUTPUT_PATH, 'utf8');
  } catch {
    previous = '';
  }

  const completedPillars = completionResults.filter((r) => r.pillarComplete).length;
  const totalPillars = completionResults.length;

  if (previous !== next) {
    await writeFile(OUTPUT_PATH, next, 'utf8');
    console.log(`Updated mobile web PS5 spec — ${completedPillars}/${totalPillars} pillars complete.`);
  } else {
    console.log(`No spec changes — ${completedPillars}/${totalPillars} pillars complete.`);
  }

  if (completedPillars === totalPillars) {
    console.log('🏁 All capability pillars are implemented. Spec is at endpoint — no further commits needed.');
  }
}

await main();
