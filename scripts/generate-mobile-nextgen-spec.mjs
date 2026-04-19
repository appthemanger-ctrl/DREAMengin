import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// ─── Named constants ────────────────────────────────────────────────────────
const OUTPUT_PATH = path.resolve(process.cwd(), 'docs/mobile-nextgen-web-gaming-engine-spec.md');
const SNIPPET_MAX_CHARS = 1800;
const COVERAGE_STRONG_PCT = 75;
const COVERAGE_PARTIAL_PCT = 40;

// ─── Research sources (next-gen / beyond-PS5 web platform) ───────────────────
const researchSources = [
  { area: 'rendering', title: 'WebGPU Compute Shaders (W3C)', url: 'https://www.w3.org/TR/webgpu/' },
  { area: 'rendering', title: 'WebGPU Best Practices (Toji)', url: 'https://toji.dev/webgpu-best-practices/' },
  { area: 'neural', title: 'WebNN API (W3C)', url: 'https://www.w3.org/TR/webnn/' },
  { area: 'neural', title: 'TensorFlow.js — On-device ML', url: 'https://www.tensorflow.org/js' },
  { area: 'neural', title: 'ONNX Runtime Web', url: 'https://onnxruntime.ai/docs/tutorials/web/' },
  { area: 'xr', title: 'MDN: WebXR Device API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API' },
  { area: 'xr', title: 'WebXR Hand Input Module', url: 'https://www.w3.org/TR/webxr-hand-input-1/' },
  { area: 'streaming', title: 'MDN: WebTransport API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API' },
  { area: 'streaming', title: 'MDN: WebCodecs API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API' },
  { area: 'compute', title: 'MDN: WebAssembly SIMD', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/Numeric/SIMD' },
  { area: 'compute', title: 'WASI Preview 2', url: 'https://github.com/WebAssembly/WASI' },
  { area: 'sync', title: 'CRDTs for Collaborative State (Yjs)', url: 'https://docs.yjs.dev/' },
  { area: 'sync', title: 'Automerge CRDT', url: 'https://automerge.org/' },
  { area: 'audio', title: 'MDN: AudioWorklet', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet' },
  { area: 'accessibility', title: 'MDN: Accessibility on the Web', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility' },
];

// ─── Next-Gen capability pillars (BEYOND PS5) ────────────────────────────────
// Each pillar starts mostly UNIMPLEMENTED so the spec has runway to evolve.
// As DREAMengin adds the listed files/symbols, pillars flip to ✅ and the
// workflow eventually reaches its endpoint and stops committing.
const capabilityChecklist = [
  {
    name: 'Real-Time Path Tracing & Global Illumination',
    levelTarget: 'Hardware-class path-traced GI + reflections on mobile via WebGPU compute, with neural denoising.',
    requiredSpecArtifacts: [
      'Ray budget per frame by quality tier and device class.',
      'ReSTIR / spatiotemporal reservoir resampling policy.',
      'Neural denoiser model size, latency and fallback strategy.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/path-tracing.ts', symbol: 'PathTracer', desc: 'WebGPU path tracer with BVH acceleration' },
      { file: 'lib/gameengin/path-tracing.ts', symbol: 'RestirGI', desc: 'ReSTIR global illumination resampling' },
      { file: 'lib/gameengin/path-tracing.ts', symbol: 'NeuralDenoiser', desc: 'Neural denoiser for path-traced output' },
    ],
  },
  {
    name: 'Neural Rendering & Upscaling',
    levelTarget: 'On-device neural upscaling (DLSS-class) and neural texture compression for mobile bandwidth.',
    requiredSpecArtifacts: [
      'Upscale ratio policy (1.5x / 2x / 3x) per quality tier.',
      'Neural texture format spec and decode budget.',
      'Frame generation policy and motion-vector requirements.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/neural-render.ts', symbol: 'NeuralUpscaler', desc: 'WebNN/WebGPU neural upscaler' },
      { file: 'lib/gameengin/neural-render.ts', symbol: 'NeuralTextureCompression', desc: 'Neural texture compression decoder' },
      { file: 'lib/gameengin/neural-render.ts', symbol: 'FrameGenerator', desc: 'Motion-vector-based frame generation' },
    ],
  },
  {
    name: 'Generative AI NPCs',
    levelTarget: 'LLM-driven NPC behavior, dialogue, and emergent goals running on-device or via edge.',
    requiredSpecArtifacts: [
      'NPC token / latency budget per tick and graceful degradation.',
      'Personality / memory schema and persistence contract.',
      'Safety filters, refusal policy, and offline fallback dialogue trees.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/ai-npcs.ts', symbol: 'LLMNPCBrain', desc: 'LLM-backed NPC reasoning + memory' },
      { file: 'lib/gameengin/ai-npcs.ts', symbol: 'EmergentDialogue', desc: 'Generative dialogue with safety filters' },
      { file: 'lib/gameengin/ai-npcs.ts', symbol: 'NPCPersonalityStore', desc: 'Persistent NPC personality + memory store' },
    ],
  },
  {
    name: 'Procedural World Generation',
    levelTarget: 'Infinite, coherent procedurally generated worlds with deterministic seeds and biome blending.',
    requiredSpecArtifacts: [
      'Seed propagation and determinism contract across clients.',
      'Biome synthesis rules and macro/micro structure layering.',
      'Streaming budget for procedural chunk generation.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/procgen.ts', symbol: 'WaveFunctionCollapse', desc: 'WFC-based tile/structure synthesis' },
      { file: 'lib/gameengin/procgen.ts', symbol: 'BiomeSynthesizer', desc: 'Biome blending + macro structure generator' },
      { file: 'lib/gameengin/procgen.ts', symbol: 'ChunkScheduler', desc: 'Async procedural chunk scheduler' },
    ],
  },
  {
    name: 'Cloud Hybrid Compute & Edge Offload',
    levelTarget: 'Heavy workloads transparently offloaded to edge nodes when local budgets are exceeded.',
    requiredSpecArtifacts: [
      'Local-vs-edge decision policy with latency / cost SLOs.',
      'State handoff protocol and rollback on disconnect.',
      'Edge node trust model and result verification.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/cloud-compute.ts', symbol: 'EdgeOffloadRouter', desc: 'Local-vs-edge workload router' },
      { file: 'lib/gameengin/cloud-compute.ts', symbol: 'RemoteRenderHandoff', desc: 'Pixel-streamed remote-render handoff' },
      { file: 'lib/gameengin/cloud-compute.ts', symbol: 'ResultVerifier', desc: 'Edge result verification + rollback' },
    ],
  },
  {
    name: 'XR / Spatial Reality Parity',
    levelTarget: 'First-class WebXR parity with hand tracking, passthrough, and shared spatial anchors.',
    requiredSpecArtifacts: [
      'Session lifecycle, fallback to 2D, and entry/exit UX.',
      'Hand-tracking input mapping that mirrors gamepad/touch.',
      'Spatial anchor + passthrough composition policy.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/xr.ts', symbol: 'WebXRSession', desc: 'WebXR session lifecycle wrapper' },
      { file: 'lib/gameengin/xr.ts', symbol: 'HandTrackingInput', desc: 'Hand-tracking → unified input bridge' },
      { file: 'lib/gameengin/xr.ts', symbol: 'PassthroughComposite', desc: 'Passthrough AR + spatial anchor composer' },
    ],
  },
  {
    name: 'Generative Adaptive Audio',
    levelTarget: 'Music and SFX generated/adapted in real-time to gameplay state via on-device models.',
    requiredSpecArtifacts: [
      'Adaptive music transition graph and tension model.',
      'Neural foley / SFX synthesis budget and quality tiers.',
      'Voice-synthesis policy and consent boundaries.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/generative-audio.ts', symbol: 'AdaptiveMusicEngine', desc: 'Tension-driven adaptive music graph' },
      { file: 'lib/gameengin/generative-audio.ts', symbol: 'NeuralFoley', desc: 'On-device neural foley synthesizer' },
    ],
  },
  {
    name: 'Predictive Asset Streaming (ML)',
    levelTarget: 'ML-driven prefetch that anticipates the player\'s next location and warms caches preemptively.',
    requiredSpecArtifacts: [
      'Behavior anticipation model size, update cadence and accuracy target.',
      'Prefetch budget vs. data plan / metered connection policy.',
      'Cache eviction strategy informed by predicted dwell time.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/predictive-stream.ts', symbol: 'MLPrefetchModel', desc: 'On-device prefetch prediction model' },
      { file: 'lib/gameengin/predictive-stream.ts', symbol: 'BehaviorAnticipator', desc: 'Player behavior anticipation engine' },
    ],
  },
  {
    name: 'Persistent World CRDT Sync',
    levelTarget: 'Massively shared, eventually-consistent persistent worlds via CRDTs over WebTransport.',
    requiredSpecArtifacts: [
      'CRDT schema for world state (positions, ownership, structures).',
      'Conflict resolution and history compaction policy.',
      'Backpressure and partial-replica strategy for mobile.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/world-crdt.ts', symbol: 'WorldStateCRDT', desc: 'CRDT-based shared world state' },
      { file: 'lib/gameengin/world-crdt.ts', symbol: 'EventualConsistencyBridge', desc: 'WebTransport CRDT sync bridge' },
    ],
  },
  {
    name: 'Accessibility AI',
    levelTarget: 'Real-time AI-driven accessibility: captions, motion reduction, color-vision adaptation, input remap.',
    requiredSpecArtifacts: [
      'Realtime captioning model and latency target.',
      'Motion-reduction adaptive heuristics tied to vestibular safety.',
      'Color-vision adaptation matrix and per-user calibration.',
    ],
    completionChecks: [
      { file: 'lib/gameengin/accessibility-ai.ts', symbol: 'RealtimeCaptioner', desc: 'On-device speech-to-caption' },
      { file: 'lib/gameengin/accessibility-ai.ts', symbol: 'MotionReductionAI', desc: 'Adaptive motion-reduction governor' },
      { file: 'lib/gameengin/accessibility-ai.ts', symbol: 'ColorVisionAdapter', desc: 'Per-user color-vision adapter' },
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
        'user-agent': 'DREAMengin-Mobile-NextGen-Spec-Bot/1.0 (+https://github.com/appthemanger-ctrl/DREAMengin)',
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
    'Real-Time Path Tracing & Global Illumination': ['rendering', 'compute'],
    'Neural Rendering & Upscaling': ['neural', 'rendering'],
    'Generative AI NPCs': ['neural'],
    'Procedural World Generation': ['compute', 'rendering'],
    'Cloud Hybrid Compute & Edge Offload': ['streaming', 'compute'],
    'XR / Spatial Reality Parity': ['xr', 'rendering'],
    'Generative Adaptive Audio': ['audio', 'neural'],
    'Predictive Asset Streaming (ML)': ['streaming', 'neural'],
    'Persistent World CRDT Sync': ['sync', 'streaming'],
    'Accessibility AI': ['accessibility', 'neural'],
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
  lines.push('# Mobile Web "Next-Gen / Beyond-PS5" Gaming Engine Spec (Auto-Evolving)');
  lines.push('');
  lines.push('This document is regenerated by `.github/workflows/mobile-nextgen-spec-evolution.yml` every 15 minutes.');
  lines.push('It is the **second-tier upgrade** that activates AFTER `mobile-ps5-web-gaming-engine-spec.md` reaches');
  lines.push('its endpoint. It pushes DREAMengin past console-class fidelity into path tracing, neural rendering,');
  lines.push('generative NPCs, XR parity and persistent shared worlds. **The workflow stops committing once all');
  lines.push('next-gen capability pillars are confirmed implemented in the repo.**');
  lines.push('');

  if (specComplete) {
    lines.push('> ## 🚀 NEXT-GEN SPEC COMPLETE — ALL UPGRADE PILLARS IMPLEMENTED');
    lines.push('> ');
    lines.push('> Every next-gen system has been verified in the DREAMengin codebase.');
    lines.push('> This upgrade spec has reached its endpoint. The workflow will no longer commit changes.');
    lines.push('> The DREAMengin GameEngin is confirmed at next-gen mobile web quality (beyond PS5-class).');
    lines.push('');
  } else {
    lines.push(`> **Upgrade implementation progress: ${completedPillars}/${totalPillars} pillars complete (${overallPct}%)**`);
    lines.push('');
  }

  // ── 1. Requirements List ──────────────────────────────────────────────────────
  lines.push('## Next-Gen Mobile Web Gaming Engine Requirements List');
  lines.push('');
  lines.push('What must be true for a mobile web game engine to qualify as "next-gen / beyond PS5":');
  lines.push('');
  lines.push('1. **Real-time path tracing** — WebGPU compute path tracer, ReSTIR GI, neural denoiser, with quality tiers per device.');
  lines.push('2. **Neural rendering** — On-device neural upscaling, neural texture compression, motion-vector frame generation.');
  lines.push('3. **Generative AI NPCs** — LLM-driven NPC reasoning, emergent dialogue with safety filters, persistent NPC memory.');
  lines.push('4. **Procedural worlds** — Deterministic seed-based world generation, WFC structures, biome synthesis with chunk streaming.');
  lines.push('5. **Hybrid cloud compute** — Transparent edge offload with SLO-aware routing, pixel-streaming handoff and result verification.');
  lines.push('6. **XR / spatial reality parity** — WebXR session, hand tracking, passthrough composition, spatial anchors as first-class inputs.');
  lines.push('7. **Generative adaptive audio** — Real-time adaptive music graph, on-device neural foley, consented voice synthesis.');
  lines.push('8. **Predictive ML streaming** — Behavior-anticipation prefetch with metered-connection awareness and dwell-time eviction.');
  lines.push('9. **Persistent CRDT worlds** — CRDT-based shared world state over WebTransport with backpressure-safe partial replicas.');
  lines.push('10. **Accessibility AI** — Realtime captions, adaptive motion reduction, per-user color-vision adaptation.');
  lines.push('');

  // ── 2. End-point definition ───────────────────────────────────────────────────
  lines.push('## End-Point Definition (When the upgrade is complete)');
  lines.push('');
  lines.push('The next-gen spec workflow reaches its endpoint when **every upgrade pillar** below shows ✅ in "Repo Status".');
  lines.push('At that point the spec file no longer changes and the 15-minute job becomes a no-op commit-free run,');
  lines.push('mirroring the behavior of the PS5-tier spec evolver.');
  lines.push('');

  // ── 3. Capability pillars ─────────────────────────────────────────────────────
  lines.push('## Upgrade Pillars — Detailed Spec');
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
  lines.push('## AI Dev Application Checklist for DREAMengin (Next-Gen Tier)');
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
    console.log(`Updated next-gen mobile web spec — ${completedPillars}/${totalPillars} pillars complete.`);
  } else {
    console.log(`No spec changes — ${completedPillars}/${totalPillars} pillars complete.`);
  }

  if (completedPillars === totalPillars) {
    console.log('🚀 All next-gen capability pillars are implemented. Spec is at endpoint — no further commits needed.');
  }
}

await main();
