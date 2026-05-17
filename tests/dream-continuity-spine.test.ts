/**
 * tests/dream-continuity-spine.test.ts
 *
 * Tests for lib/intelligence/continuityHelpers.ts — pure logic only.
 * All test inputs are plain objects; no browser APIs required.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveResumeDest,
  formatArtifactKind,
  getArtifactAccent,
} from '@/lib/intelligence/continuityHelpers';
import type { ForgeActivityPulse } from '@/lib/forge/forgeRegistry';

// ── resolveResumeDest ─────────────────────────────────────────────────────────

describe('resolveResumeDest', () => {
  it('returns null when continueFrom is null and activity is empty', () => {
    expect(resolveResumeDest(null, [])).toBeNull();
  });

  it('resolves by registry id (e.g. "code" → CodeEngin route)', () => {
    const dest = resolveResumeDest('code', []);
    expect(dest).not.toBeNull();
    expect(dest!.href).toBe('/daydream/code');
    expect(dest!.label).toBe('CodeEngin');
  });

  it('resolves by Engin name (e.g. "CodeEngin" → CodeEngin route)', () => {
    const dest = resolveResumeDest('CodeEngin', []);
    expect(dest).not.toBeNull();
    expect(dest!.href).toBe('/daydream/code');
    expect(dest!.label).toBe('CodeEngin');
  });

  it('resolves GameEngin by name', () => {
    const dest = resolveResumeDest('GameEngin', []);
    expect(dest).not.toBeNull();
    expect(dest!.href).toBe('/daydream/games');
    expect(dest!.emoji).toBe('🎮');
  });

  it('resolves "games" by registry id', () => {
    const dest = resolveResumeDest('games', []);
    expect(dest).not.toBeNull();
    expect(dest!.href).toBe('/daydream/games');
  });

  it('resolves StarMakerEngin by name', () => {
    const dest = resolveResumeDest('StarMakerEngin', []);
    expect(dest).not.toBeNull();
    expect(dest!.href).toBe('/daydream/music');
    expect(dest!.emoji).toBe('🎵');
  });

  it('falls back to hottest activity pulse when continueFrom is null', () => {
    const activity: ForgeActivityPulse[] = [
      { enginId: 'lab',   lastActive: new Date().toISOString(), heat: 0.3, label: 'LabEngin active' },
      { enginId: 'music', lastActive: new Date().toISOString(), heat: 0.9, label: 'StarMakerEngin active' },
      { enginId: 'code',  lastActive: new Date().toISOString(), heat: 0.5, label: 'CodeEngin active' },
    ];
    const dest = resolveResumeDest(null, activity);
    expect(dest).not.toBeNull();
    // music has the highest heat
    expect(dest!.href).toBe('/daydream/music');
    expect(dest!.label).toBe('StarMakerEngin');
  });

  it('prefers continueFrom over activity pulses', () => {
    const activity: ForgeActivityPulse[] = [
      { enginId: 'games', lastActive: new Date().toISOString(), heat: 1.0, label: 'GameEngin active' },
    ];
    // continueFrom says "lab" even though games heat is 1.0
    const dest = resolveResumeDest('lab', activity);
    expect(dest).not.toBeNull();
    expect(dest!.href).toBe('/daydream/lab');
  });

  it('returns null for unknown subsystem ids with no activity', () => {
    expect(resolveResumeDest('non-existent-engin', [])).toBeNull();
  });

  it('falls back to activity when continueFrom maps to nothing', () => {
    const activity: ForgeActivityPulse[] = [
      { enginId: 'brand', lastActive: new Date().toISOString(), heat: 0.8, label: 'BrandingEngin active' },
    ];
    const dest = resolveResumeDest('non-existent-engin', activity);
    expect(dest).not.toBeNull();
    expect(dest!.href).toBe('/daydream/brand');
  });

  it('returns null when all activity pulses have unknown enginIds', () => {
    const activity: ForgeActivityPulse[] = [
      { enginId: 'ghost', lastActive: new Date().toISOString(), heat: 1.0, label: 'ghost' },
    ];
    expect(resolveResumeDest(null, activity)).toBeNull();
  });

  it('includes accent colour in the result', () => {
    const dest = resolveResumeDest('code', []);
    expect(dest!.accent).toBeTruthy();
    expect(dest!.accent).toMatch(/^#/);
  });
});

// ── formatArtifactKind ────────────────────────────────────────────────────────

describe('formatArtifactKind', () => {
  it('maps known kinds to short labels', () => {
    expect(formatArtifactKind('event')).toBe('EVT');
    expect(formatArtifactKind('code-run')).toBe('CODE');
    expect(formatArtifactKind('code-output')).toBe('OUT');
    expect(formatArtifactKind('lab-run')).toBe('LAB');
    expect(formatArtifactKind('lab-result')).toBe('RES');
    expect(formatArtifactKind('build')).toBe('BUILD');
    expect(formatArtifactKind('asset')).toBe('ASSET');
    expect(formatArtifactKind('prompt')).toBe('AI');
    expect(formatArtifactKind('draft')).toBe('DRAFT');
  });

  it('truncates unknown kinds to 5 uppercase characters', () => {
    expect(formatArtifactKind('hello')).toBe('HELLO');
    expect(formatArtifactKind('something-very-long')).toBe('SOMET');
    expect(formatArtifactKind('x')).toBe('X');
  });
});

// ── getArtifactAccent ─────────────────────────────────────────────────────────

describe('getArtifactAccent', () => {
  it('returns a CSS colour string for known kinds', () => {
    const known = ['event', 'code-run', 'code-output', 'lab-run', 'lab-result', 'build', 'asset', 'prompt', 'draft'];
    for (const kind of known) {
      const c = getArtifactAccent(kind);
      expect(typeof c).toBe('string');
      expect(c.length).toBeGreaterThan(0);
    }
  });

  it('returns a fallback string for unknown kinds', () => {
    const c = getArtifactAccent('some-unknown-kind');
    expect(typeof c).toBe('string');
    expect(c.length).toBeGreaterThan(0);
  });

  it('event accent matches gold palette', () => {
    expect(getArtifactAccent('event')).toMatch(/d4a843/i);
  });

  it('code-run accent is cyan (matches CodeEngin palette)', () => {
    expect(getArtifactAccent('code-run')).toMatch(/22d3ee/i);
  });
});
