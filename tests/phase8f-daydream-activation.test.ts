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
  return readFileSync(join(root, `components/daydream/${name}`), 'utf-8');
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
    expect(src).toContain("'music:stem-ready'");
    expect(src).toContain('bridge.subscribe');
  });

  it('surfaces stemPrompt notification when stem received', () => {
    const src = readComp('ContentEngin.tsx');
    expect(src).toContain('stemPrompt');
  });
});

describe('Phase 8 §F — DaydreamShell (Points 47-50)', () => {
  it('wires useDaydreamState for visit tracking', () => {
    const src = readFileSync(join(root, 'components/daydream/DaydreamShell.tsx'), 'utf-8');
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
