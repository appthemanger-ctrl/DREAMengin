import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputPath = path.resolve(process.cwd(), 'docs/mobile-ps5-web-gaming-engine-spec.md');

const researchSources = [
  { area: 'rendering', title: 'WebGPU API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API' },
  { area: 'rendering', title: 'WebGPU Fundamentals', url: 'https://webgpufundamentals.org/' },
  { area: 'platform', title: 'Can I use: WebGPU', url: 'https://caniuse.com/webgpu' },
  { area: 'performance', title: 'web.dev: Optimize JavaScript execution', url: 'https://web.dev/articles/optimize-javascript-execution' },
  { area: 'performance', title: 'web.dev: Render blocking resources', url: 'https://web.dev/articles/rendering-performance' },
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

const capabilityChecklist = [
  {
    name: 'Graphics & Rendering',
    levelTarget: 'Console-grade visuals on mobile web (WebGPU-first, graceful WebGL fallback).',
    requiredSpecArtifacts: [
      'Frame-time budget table (16.6ms @ 60fps, 8.3ms @ 120fps target mode).',
      'Tiered quality ladder (ultra/high/medium/low) with explicit toggles per device class.',
      'Material, lighting, shadows, post-processing and LOD policy with hard caps.',
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
  },
  {
    name: 'Input & Controls',
    levelTarget: 'Native-feeling touch + controller + keyboard/mouse parity on mobile browser.',
    requiredSpecArtifacts: [
      'Input abstraction mapping touch gestures, gamepad, keyboard, and accessibility remaps.',
      'Latency budget from hardware event to simulation tick and rendered frame.',
      'DualSense/gamepad feature policy (haptics/trigger semantics where available).',
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
  },
  {
    name: 'Networking & Online Systems',
    levelTarget: 'Fast, resilient multiplayer and social synchronization for mobile conditions.',
    requiredSpecArtifacts: [
      'Transport matrix (WebSocket/WebRTC/WebTransport) and authority model.',
      'Jitter/packet-loss tolerance targets and reconnection strategy.',
      'Cheat-resistance model and secure state validation boundaries.',
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
  },
  {
    name: 'Offline, Recovery & Session Continuity',
    levelTarget: 'Game survives tab lifecycle events and intermittent connectivity.',
    requiredSpecArtifacts: [
      'Offline behavior matrix for gameplay and social features.',
      'Suspend/resume/restore contract for background/foreground transitions.',
      'Corruption protection + recovery playbook for cached state and saves.',
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
  },
  {
    name: 'Quality Engineering & Telemetry',
    levelTarget: 'Continuous proof that the engine meets target quality on real mobile devices.',
    requiredSpecArtifacts: [
      'KPI dashboard: FPS, frame pacing, crash-free sessions, startup time, battery impact.',
      'Device coverage matrix and regression test gates.',
      'Auto-rollback and release confidence criteria tied to live telemetry.',
    ],
  },
];

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
      snippet: normalized.slice(0, 1800),
    };
  } catch (error) {
    return {
      ...source,
      ok: false,
      status: error instanceof Error ? error.message : 'fetch_error',
    };
  }
}

function scoreCapability(capability, research) {
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
    statusLabel: coveragePct >= 75 ? 'Research coverage strong' : coveragePct >= 40 ? 'Research coverage partial' : 'Research coverage weak',
  };
}

function buildSpecMarkdown(research) {
  const successful = research.filter((item) => item.ok);
  const failed = research.filter((item) => !item.ok);

  const lines = [];
  lines.push('# Mobile Web “PS5-Level” Gaming Engine Spec (Auto-Evolving)');
  lines.push('');
  lines.push('This document is regenerated by `.github/workflows/mobile-ps5-spec-evolution.yml` every 15 minutes.');
  lines.push('It continuously researches public web platform sources and refreshes the target spec for AI-assisted implementation in DREAMengin.');
  lines.push('');
  lines.push('## End-Point Definition (When the mission is complete)');
  lines.push('');
  lines.push('The spec is considered complete when **every capability pillar** below has:');
  lines.push('1. Explicit architecture decisions and trade-offs for DREAMengin.');
  lines.push('2. Measurable performance/quality budgets and acceptance gates.');
  lines.push('3. Validation tests + telemetry metrics proving readiness on real mobile devices.');
  lines.push('4. Rollout and fallback strategy for lower-tier devices/browsers.');
  lines.push('');
  lines.push('## What qualifies as “PS5-level mobile web gaming engine”');
  lines.push('');

  for (const capability of capabilityChecklist) {
    const score = scoreCapability(capability, research);
    lines.push(`### ${capability.name}`);
    lines.push(`- **Target level:** ${capability.levelTarget}`);
    lines.push(`- **Current research coverage:** ${score.statusLabel} (${score.coveragePct}%)`);
    lines.push('- **Must be specified:**');
    for (const item of capability.requiredSpecArtifacts) {
      lines.push(`  - ${item}`);
    }
    lines.push(`- **Research areas expected:** ${score.requiredAreas.join(', ') || 'n/a'}`);
    lines.push(`- **Research areas currently covered:** ${score.coveredAreas.join(', ') || 'none'}`);
    lines.push('');
  }

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

  lines.push('## AI Dev Application Checklist for DREAMengin');
  lines.push('');
  lines.push('- [ ] Convert each capability pillar into concrete DREAMengin architecture decisions (docs + implementation tickets).');
  lines.push('- [ ] Define benchmark scenes and automated quality gates for 30/60/120fps targets.');
  lines.push('- [ ] Ship adaptive quality system tied to live telemetry and device classes.');
  lines.push('- [ ] Implement controller + touch parity with low-latency input abstraction.');
  lines.push('- [ ] Finalize networking authority model and anti-cheat boundaries.');
  lines.push('- [ ] Validate offline/session-resume resilience on real mobile browsers.');
  lines.push('- [ ] Publish release criteria that map directly to this spec and block regressions.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function main() {
  const fetched = await Promise.all(researchSources.map((source) => fetchSource(source)));
  const next = buildSpecMarkdown(fetched);

  let previous = '';
  try {
    previous = await readFile(outputPath, 'utf8');
  } catch {
    previous = '';
  }

  if (previous !== next) {
    await writeFile(outputPath, next, 'utf8');
    console.log('Updated mobile web PS5 spec.');
  } else {
    console.log('No spec changes detected.');
  }
}

await main();
