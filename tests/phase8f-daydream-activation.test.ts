/**
 * tests/phase8f-daydream-activation.test.ts
 *
 * Phase 8 §F — Daydream Surface Network: Deep Activation.
 * Structural tests verifying each Engin has Supabase persistence wired in.
 *
 * Points covered:
 *   51 — StarMakerEngin persists creative state to daydream_states
 *   54 — CodeEngin persists editor state
 *   55 — BrandingEngin persists brand kit assets
 *   56 — ContentEngin saves drafts via /api/drafts
 *   57 — ContentEngin subscribes to music:stem-ready (multi-connection)
 *   58 — all 6 Daydream routes are live (DreamsSpacePanel verified separately)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

function readComp(name: string) {
  // Map engine names to their canonical engins/[EnginName]/index.tsx locations
  const canonical: Record<string, string> = {
    'StarMakerEngin.tsx': 'engins/StarMakerEngin/index.tsx',
    'CodeEngin.tsx':      'engins/CodeEngin/index.tsx',
    'BrandingEngin.tsx':  'engins/BrandingEngin/index.tsx',
    'ContentEngin.tsx':   'engins/ContentEngin/index.tsx',
    'GameEngin.tsx':      'engins/GameEngin/index.tsx',
    'LabEngin.tsx':       'engins/LabEngin/index.tsx',
  };
  const resolved = canonical[name] ?? `components/daydream/${name}`;
  return readFileSync(join(root, resolved), 'utf-8');
}

describe('Phase 8 §F — StarMakerEngin (Point 51)', () => {
  it('imports useDaydreamState', () => {
    expect(readComp('StarMakerEngin.tsx')).toContain("useDaydreamState");
  });

  it('calls persistState with creative workspace data', () => {
    const src = readComp('StarMakerEngin.tsx');
    expect(src).toContain('persistState');
    expect(src).toContain('bpm');
  });

  it('uses daydreamType music', () => {
    const src = readComp('StarMakerEngin.tsx');
    expect(src).toContain("'music'");
  });
});

describe('Phase 8 §F — CodeEngin (Point 54)', () => {
  it('imports useDaydreamState', () => {
    expect(readComp('CodeEngin.tsx')).toContain('useDaydreamState');
  });

  it('persists editor cells state', () => {
    const src = readComp('CodeEngin.tsx');
    expect(src).toContain('persistState');
    expect(src).toContain('cells');
  });
});

describe('Phase 8 §F — BrandingEngin (Point 55)', () => {
  it('imports useDaydreamState', () => {
    expect(readComp('BrandingEngin.tsx')).toContain('useDaydreamState');
  });

  it('persists brand kit assets', () => {
    const src = readComp('BrandingEngin.tsx');
    expect(src).toContain('persistState');
    expect(src).toContain('assets');
  });
});

describe('Phase 8 §F — ContentEngin (Point 56 + 57)', () => {
  it('saves drafts via /api/drafts (Point 56)', () => {
    const src = readComp('ContentEngin.tsx');
    expect(src).toContain('/api/drafts');
  });

  it('subscribes to music:stem-ready for multi-connection (Point 57)', () => {
    const src = readComp('ContentEngin.tsx');
    // ContentEngin wires music:stem-ready subscription via useContentEnginBridge hook.
    // The hook internally calls bridge.subscribe('music', 'music:stem-ready', ...).
    // We verify either the component has it directly, or delegates to the bridge hook.
    const hookSrc = readFileSync(join(root, 'lib/runtime/useEnginBridge.ts'), 'utf-8');
    const hasDirectStemReady = src.includes("'music:stem-ready'");
    const hasBridgeSubscribe = src.includes('bridge.subscribe');
    const hookHasMusicStemReady = hookSrc.includes("'music:stem-ready'");
    const hookHasBridgeSubscribe = hookSrc.includes("bridge.subscribe('music'");
    // Either direct in component OR delegated to hook (both must be present together)
    expect(
      (hasDirectStemReady && hasBridgeSubscribe) ||
      (src.includes('useContentEnginBridge') && hookHasMusicStemReady && hookHasBridgeSubscribe)
    ).toBe(true);
  });

  it('surfaces stemPrompt notification when stem received', () => {
    const src = readComp('ContentEngin.tsx');
    expect(src).toContain('stemPrompt');
  });
});

describe('Phase 8 §F — DaydreamShell (Points 47-50)', () => {
  it('wires useDaydreamState for visit tracking', () => {
    const src = readFileSync(join(root, 'components/daydream/dream.shell.DaydreamShell.tsx'), 'utf-8');
    expect(src).toContain('useDaydreamState');
  });
});

describe('Phase 8 §F — Daydream routes exist (Point 58)', () => {
  const routes = ['music', 'games', 'lab', 'code', 'brand', 'create'];

  for (const route of routes) {
    it(`/daydream/${route} page exists`, () => {
      expect(() =>
        readFileSync(join(root, `app/daydream/${route}/page.tsx`), 'utf-8')
      ).not.toThrow();
    });
  }
});
