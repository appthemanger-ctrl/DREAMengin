/**
 * tests/tech-foundation.test.ts — Technical Foundation validation suite.
 *
 * Validates that every pillar of the DREAMengin technical foundation spec
 * is implemented and properly wired:
 *
 *  1. Next.js 16+ with PPR enabled
 *  2. Dual-runtime spatial environment
 *  3. TypeScript strict mode
 *  4. Tailwind tokenized design system (Neumorphic Dark)
 *  5. Framer Motion for DreamDM Bar physics
 *  6. Babylon.js WebGPU-native engine factory
 *  7. WebAssembly SIMD (physics + audio)
 *  8. Dream Window lifecycle (Unbound → Bound → Mounted → Collapsed)
 *  9. Supabase Postgres RLS + Realtime + pgvector
 * 10. Client-heavy rendering strategy
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

// ── Helpers ─────────────────────────────────────────────────────────────────

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

function fileExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Next.js 16+ with PPR
// ═══════════════════════════════════════════════════════════════════════════

describe('Next.js 16+ with PPR', () => {
  it('uses Next.js 16+ in package.json', () => {
    const pkg = JSON.parse(readFile('package.json'));
    const nextVersion = pkg.dependencies?.next ?? '';
    // Accept ^16, ~16, >=16, or literal 16.x
    expect(nextVersion).toMatch(/16/);
  });

  it('has PPR enabled via cacheComponents in next.config.mjs', () => {
    const config = readFile('next.config.mjs');
    // Next.js 16+ uses cacheComponents: true for PPR.
    // Routes use connection() from next/server instead of dynamic = 'force-dynamic'.
    expect(config).toContain('cacheComponents');
    expect(config).toContain('Partial Prerendering');
  });

  it('uses App Router (app/ directory exists with layout.tsx)', () => {
    expect(fileExists('app/layout.tsx')).toBe(true);
    expect(fileExists('app/page.tsx')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Dual-runtime spatial environment
// ═══════════════════════════════════════════════════════════════════════════

describe('Dual-runtime spatial environment', () => {
  it('has dual runtime bridge module', () => {
    expect(fileExists('lib/runtime/dualRuntimeBridge.ts')).toBe(true);
  });

  it('has useDualRuntime React hook', () => {
    expect(fileExists('lib/runtime/useDualRuntime.ts')).toBe(true);
    const hook = readFile('lib/runtime/useDualRuntime.ts');
    expect(hook).toContain('useDualRuntime');
    expect(hook).toContain('emit');
    expect(hook).toContain('subscribe');
  });

  it('has runtime memory / SAB layout', () => {
    expect(fileExists('lib/runtime/memory.ts')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. TypeScript strict mode
// ═══════════════════════════════════════════════════════════════════════════

describe('TypeScript strict mode', () => {
  it('has strict: true in tsconfig.json', () => {
    const tsconfig = JSON.parse(readFile('tsconfig.json'));
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('uses TypeScript 5.5+ in devDependencies', () => {
    const pkg = JSON.parse(readFile('package.json'));
    const tsVersion = pkg.devDependencies?.typescript ?? '';
    expect(tsVersion).toMatch(/5\.[5-9]|5\.\d{2}/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Tailwind tokenized design system (Neumorphic Dark)
// ═══════════════════════════════════════════════════════════════════════════

describe('Tailwind tokenized design system (Neumorphic Dark)', () => {
  it('has tailwind.config.ts with neumorphic shadow tokens', () => {
    const config = readFile('tailwind.config.ts');
    expect(config).toContain('neu-raise');
    expect(config).toContain('neu-inset');
    expect(config).toContain('neu-gold');
  });

  it('has gold/sky colour tokens', () => {
    const config = readFile('tailwind.config.ts');
    expect(config).toContain('de-gold');
    expect(config).toContain('de-sky');
    expect(config).toContain('midnight');
  });

  it('has spring timing functions', () => {
    const config = readFile('tailwind.config.ts');
    expect(config).toContain('spring');
    expect(config).toContain('expo-out');
  });

  it('has CSS custom properties for the design system', () => {
    const globals = readFile('styles/globals.css');
    expect(globals).toContain('--de-');
    expect(globals).toContain('--gt-');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Framer Motion for DreamDM Bar
// ═══════════════════════════════════════════════════════════════════════════

describe('Framer Motion for DreamDM Bar', () => {
  it('has framer-motion dependency', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.dependencies['framer-motion']).toBeTruthy();
  });

  it('has barInteractions with physics-based snap points', () => {
    expect(fileExists('lib/dreamdm/barInteractions.ts')).toBe(true);
    const bar = readFile('lib/dreamdm/barInteractions.ts');
    expect(bar).toContain('SPLIT_SNAP_POINTS');
    expect(bar).toContain('snapSplitRatioOnRelease');
    expect(bar).toContain('SPLIT_FLING_VELOCITY');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Babylon.js WebGPU-native engine
// ═══════════════════════════════════════════════════════════════════════════

describe('Babylon.js WebGPU-native engine', () => {
  it('has @babylonjs/core dependency', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.dependencies['@babylonjs/core']).toBeTruthy();
  });

  it('has WebGPU-first engine factory', () => {
    expect(fileExists('lib/babylon/createEngine.ts')).toBe(true);
    const factory = readFile('lib/babylon/createEngine.ts');
    expect(factory).toContain('WebGPUEngine');
    expect(factory).toContain('createBabylonEngine');
    expect(factory).toContain('isWebGPU');
  });

  it('has WebGPU quality director', () => {
    expect(fileExists('lib/webgpu/director.ts')).toBe(true);
    expect(fileExists('lib/webgpu/useWebGPUDirector.ts')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. WebAssembly SIMD
// ═══════════════════════════════════════════════════════════════════════════

describe('WebAssembly SIMD', () => {
  it('has AssemblyScript source with SIMD physics', () => {
    expect(fileExists('assembly/index.ts')).toBe(true);
    const asm = readFile('assembly/index.ts');
    expect(asm).toContain('tickPhysicsSIMD');
    expect(asm).toContain('f32x4');
  });

  it('has AssemblyScript source with SIMD audio DSP', () => {
    const asm = readFile('assembly/index.ts');
    expect(asm).toContain('processAudioBufferSIMD');
  });

  it('has WASM worker with SAB integration', () => {
    expect(fileExists('public/workers/engin-shader.worker.ts')).toBe(true);
    const worker = readFile('public/workers/engin-shader.worker.ts');
    expect(worker).toContain('SharedArrayBuffer');
    expect(worker).toContain('wasmSIMDAddF32x4');
  });

  it('has WASM audio bridge for StarMaker DAW', () => {
    expect(fileExists('lib/music/wasmAudioBridge.ts')).toBe(true);
    const bridge = readFile('lib/music/wasmAudioBridge.ts');
    expect(bridge).toContain('createWasmAudioBridge');
    expect(bridge).toContain('processAudioBufferSIMD');
    expect(bridge).toContain('applyGain');
    expect(bridge).toContain('mixDown');
  });

  it('has asbuild scripts in package.json', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.scripts['asbuild:release']).toBeTruthy();
    expect(pkg.scripts['asbuild:debug']).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Dream Window lifecycle
// ═══════════════════════════════════════════════════════════════════════════

describe('Dream Window lifecycle (Unbound → Bound → Mounted → Collapsed)', () => {
  it('has DreamWindowLifecycle module', () => {
    expect(fileExists('lib/dream-window/DreamWindowLifecycle.ts')).toBe(true);
  });

  it('exports all four lifecycle transition functions', () => {
    const lifecycle = readFile('lib/dream-window/DreamWindowLifecycle.ts');
    expect(lifecycle).toContain('bindDreamWindow');
    expect(lifecycle).toContain('mountDreamWindow');
    expect(lifecycle).toContain('collapseDreamWindow');
    expect(lifecycle).toContain('activateDreamWindow');
    expect(lifecycle).toContain('unmountDreamWindow');
    expect(lifecycle).toContain('unbindDreamWindow');
  });

  it('exports createDreamWindowInstance factory', () => {
    const lifecycle = readFile('lib/dream-window/DreamWindowLifecycle.ts');
    expect(lifecycle).toContain('createDreamWindowInstance');
  });

  it('exports layer validation', () => {
    const lifecycle = readFile('lib/dream-window/DreamWindowLifecycle.ts');
    expect(lifecycle).toContain('validateDreamWindowLayers');
    expect(lifecycle).toContain('DREAM_WINDOW_REQUIRED_LAYERS');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. Supabase: Postgres RLS + Realtime + pgvector
// ═══════════════════════════════════════════════════════════════════════════

describe('Supabase Postgres with RLS', () => {
  it('has RLS migration enabling row-level security', () => {
    expect(fileExists('supabase/migrations/20240120000001_enable_rls.sql')).toBe(true);
    const rls = readFile('supabase/migrations/20240120000001_enable_rls.sql');
    expect(rls).toContain('ENABLE ROW LEVEL SECURITY');
    expect(rls).toContain('CREATE POLICY');
  });

  it('has Supabase client with graceful degradation', () => {
    expect(fileExists('lib/supabase/client.ts')).toBe(true);
    const client = readFile('lib/supabase/client.ts');
    expect(client).toContain('createBrowserClient');
  });

  it('has Supabase server client', () => {
    expect(fileExists('lib/supabase/server.ts')).toBe(true);
  });
});

describe('Supabase Realtime (DreamR + live messaging)', () => {
  it('has realtime module', () => {
    expect(fileExists('lib/supabase/realtime.ts')).toBe(true);
  });

  it('exports DreamR pulse subscription', () => {
    const rt = readFile('lib/supabase/realtime.ts');
    expect(rt).toContain('subscribeDreamR');
    expect(rt).toContain('DreamRPulse');
    expect(rt).toContain('sendPulse');
  });

  it('exports live messaging subscription', () => {
    const rt = readFile('lib/supabase/realtime.ts');
    expect(rt).toContain('subscribeLiveMessages');
    expect(rt).toContain('LiveMessage');
    expect(rt).toContain('setTyping');
  });

  it('exports presence tracking', () => {
    const rt = readFile('lib/supabase/realtime.ts');
    expect(rt).toContain('trackPresence');
    expect(rt).toContain('PresenceState');
    expect(rt).toContain('PresenceTracker');
  });

  it('uses de: namespace prefix for channels', () => {
    const rt = readFile('lib/supabase/realtime.ts');
    expect(rt).toContain("de:dreamr:");
    expect(rt).toContain("de:dm:");
    expect(rt).toContain("de:presence:");
  });
});

describe('Supabase pgvector (Dr. Eams discovery)', () => {
  it('has pgvector migration', () => {
    expect(fileExists('supabase/migrations/20260403000001_pgvector_embeddings.sql')).toBe(true);
    const migration = readFile('supabase/migrations/20260403000001_pgvector_embeddings.sql');
    expect(migration).toContain('CREATE EXTENSION IF NOT EXISTS vector');
    expect(migration).toContain('content_embeddings');
    expect(migration).toContain('vector(1536)');
    expect(migration).toContain('ivfflat');
  });

  it('has vector search RPC function', () => {
    expect(fileExists('supabase/migrations/20260403000002_pgvector_search_rpc.sql')).toBe(true);
    const rpc = readFile('supabase/migrations/20260403000002_pgvector_search_rpc.sql');
    expect(rpc).toContain('match_content_embeddings');
    expect(rpc).toContain('query_embedding');
    expect(rpc).toContain('<=>');
  });

  it('has vector search library', () => {
    expect(fileExists('lib/supabase/vector.ts')).toBe(true);
    const vector = readFile('lib/supabase/vector.ts');
    expect(vector).toContain('upsertEmbedding');
    expect(vector).toContain('searchSimilar');
    expect(vector).toContain('deleteEmbedding');
    expect(vector).toContain('logTriadConsensus');
    expect(vector).toContain('deriveConsensus');
  });

  it('has AI Triad consensus log table', () => {
    const migration = readFile('supabase/migrations/20260403000001_pgvector_embeddings.sql');
    expect(migration).toContain('ai_triad_consensus_log');
    expect(migration).toContain('eams_vote');
    expect(migration).toContain('idari_vote');
    expect(migration).toContain('boogie_vote');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. Client-heavy rendering & WebGPU/WASM
// ═══════════════════════════════════════════════════════════════════════════

describe('Client-heavy rendering strategy', () => {
  it('has WGSL shaders for WebGPU renderer', () => {
    expect(fileExists('components/webgpu/shaders.ts')).toBe(true);
    const shaders = readFile('components/webgpu/shaders.ts');
    expect(shaders).toContain('COMPUTE_WGSL');
    expect(shaders).toContain('COMPOSITE_FRAG_WGSL');
    expect(shaders).toContain('aces');
  });

  it('has WebGPU renderer with multi-pass pipeline', () => {
    expect(fileExists('components/webgpu/renderer.ts')).toBe(true);
    const renderer = readFile('components/webgpu/renderer.ts');
    expect(renderer).toContain('WebGPURenderer');
    expect(renderer).toContain('frame');
    expect(renderer).toContain('resize');
  });

  it('has Neural Post-Processing WGSL shader', () => {
    expect(fileExists('components/webgpu/neuralPostProcess.ts')).toBe(true);
    const neural = readFile('components/webgpu/neuralPostProcess.ts');
    expect(neural).toContain('NEURAL_POST_PROCESS_WGSL');
    expect(neural).toContain('casSharp');
    expect(neural).toContain('dreamenginGrade');
    expect(neural).toContain('neuVignette');
    expect(neural).toContain('createNeuralPostProcessPipeline');
    expect(neural).toContain('dispatchNeuralPostProcess');
  });

  it('neural shader has gold/light-blue colour grading', () => {
    const neural = readFile('components/webgpu/neuralPostProcess.ts');
    expect(neural).toContain('goldBias');
    expect(neural).toContain('skyBias');
    expect(neural).toContain('#D4AF37');
    expect(neural).toContain('#7DD3FC');
  });

  it('has WebGPU showcase component', () => {
    expect(fileExists('components/webgpu/WebGPUShowcase.tsx')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Bonus: AI Triad consensus logic
// ═══════════════════════════════════════════════════════════════════════════

describe('AI Triad consensus derivation', () => {
  it('correctly derives consensus from votes', async () => {
    const { deriveConsensus } = await import('../lib/supabase/vector');

    // 2+ approve → approved
    expect(deriveConsensus('approve', 'approve', 'reject')).toBe('approved');
    expect(deriveConsensus('approve', 'approve', 'approve')).toBe('approved');
    expect(deriveConsensus('approve', 'approve', 'abstain')).toBe('approved');

    // 2+ reject → rejected
    expect(deriveConsensus('reject', 'reject', 'approve')).toBe('rejected');
    expect(deriveConsensus('reject', 'reject', 'abstain')).toBe('rejected');

    // No majority → escalated
    expect(deriveConsensus('approve', 'reject', 'abstain')).toBe('escalated');
    expect(deriveConsensus('abstain', 'abstain', 'abstain')).toBe('escalated');
    expect(deriveConsensus('approve', 'reject', 'reject')).toBe('rejected');
  });
});
