/**
 * Integration Tests — Cross-engine wiring, Command Palette, DaydreamPulseStrip.
 *
 * Verifies that the integration layer properly connects:
 *   1. CommandPalette is mounted globally and contains all engines
 *   2. DaydreamPulseStrip includes Forge surface
 *   3. Root layout mounts CommandPalette
 *   4. HomeDream surface does NOT use localStorage
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';

// ── Mock localStorage ────────────────────────────────────────────────────────
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value; },
  removeItem: (key: string) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('window', { localStorage: localStorageMock });

import {
  ENGIN_REGISTRY,
  CREATIVE_ENGINES,
} from '@/lib/forge/forgeRegistry';

// ── Source file reads for structural assertions ─────────────────────────────

const commandPaletteSrc = readFileSync(
  resolve(__dirname, '../components/CommandPalette.tsx'),
  'utf8',
);

const rootLayoutSrc = readFileSync(
  resolve(__dirname, '../app/layout.tsx'),
  'utf8',
);

const daydreamPulseStripSrc = readFileSync(
  resolve(__dirname, '../components/home/DaydreamPulseStrip.tsx'),
  'utf8',
);

const workspaceDashboardSrc = readFileSync(
  resolve(__dirname, '../components/home/WorkspaceDashboard.tsx'),
  'utf8',
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Global Integration — CommandPalette', () => {
  it('root layout imports and mounts CommandPalette', () => {
    expect(rootLayoutSrc).toContain("import CommandPalette from '@/components/CommandPalette'");
    expect(rootLayoutSrc).toContain('<CommandPalette />');
  });

  it('CommandPalette includes all 6 Daydream surfaces', () => {
    expect(commandPaletteSrc).toContain("id: 'music'");
    expect(commandPaletteSrc).toContain("id: 'games'");
    expect(commandPaletteSrc).toContain("id: 'lab'");
    expect(commandPaletteSrc).toContain("id: 'code'");
    expect(commandPaletteSrc).toContain("id: 'brand'");
    expect(commandPaletteSrc).toContain("id: 'create'");
    expect(commandPaletteSrc).toContain("id: 'forge'");
  });

  it('CommandPalette includes Engines Hub and all 6 engine app entries', () => {
    expect(commandPaletteSrc).toContain("id: 'engines-hub'");
    expect(commandPaletteSrc).toContain("id: 'engine-games'");
    expect(commandPaletteSrc).toContain("id: 'engine-music'");
    expect(commandPaletteSrc).toContain("id: 'engine-code'");
    expect(commandPaletteSrc).toContain("id: 'engine-lab'");
    expect(commandPaletteSrc).toContain("id: 'engine-brand'");
    expect(commandPaletteSrc).toContain("id: 'engine-create'");
  });

  it('CommandPalette has an "Engines" category', () => {
    expect(commandPaletteSrc).toContain("category: 'Engines'");
  });

  it('engine app entries route to /engines/* paths', () => {
    expect(commandPaletteSrc).toContain("router.push('/engines')");
    expect(commandPaletteSrc).toContain("router.push('/engines/games')");
    expect(commandPaletteSrc).toContain("router.push('/engines/music')");
    expect(commandPaletteSrc).toContain("router.push('/engines/code')");
    expect(commandPaletteSrc).toContain("router.push('/engines/lab')");
    expect(commandPaletteSrc).toContain("router.push('/engines/brand')");
    expect(commandPaletteSrc).toContain("router.push('/engines/create')");
  });
});

describe('Global Integration — DaydreamPulseStrip', () => {
  it('includes Forge surface alongside the other daydreams', () => {
    expect(daydreamPulseStripSrc).toContain("id: 'forge'");
    expect(daydreamPulseStripSrc).toContain("href: '/daydream/forge'");
    expect(daydreamPulseStripSrc).toContain("label: 'Forge'");
    expect(daydreamPulseStripSrc).toContain("emoji: '🔥'");
  });

  it('DaydreamPulseStrip does not use localStorage', () => {
    expect(daydreamPulseStripSrc).not.toContain('localStorage');
  });

  it('DaydreamPulseStrip does not use DreamBeatCanvas', () => {
    expect(daydreamPulseStripSrc).not.toContain('DreamBeatCanvas');
  });
});

describe('Global Integration — HomeDream surface', () => {
  it('WorkspaceDashboard does NOT import or render ForgeActivityWidget', () => {
    expect(workspaceDashboardSrc).not.toContain('ForgeActivityWidget');
  });

  it('WorkspaceDashboard does NOT use localStorage', () => {
    expect(workspaceDashboardSrc).not.toContain('localStorage');
  });

  it('WorkspaceDashboard does NOT have filler RUNTIME_SIGNALS cards', () => {
    expect(workspaceDashboardSrc).not.toContain('RUNTIME_SIGNALS');
  });

  it('WorkspaceDashboard renders HomeFeed before DaydreamPulseStrip', () => {
    const feedIdx = workspaceDashboardSrc.indexOf('<HomeFeed');
    const stripIdx = workspaceDashboardSrc.indexOf('<DaydreamPulseStrip');
    expect(feedIdx).toBeGreaterThan(-1);
    expect(stripIdx).toBeGreaterThan(-1);
    expect(feedIdx).toBeLessThan(stripIdx);
  });
});

describe('Global Integration — ENGIN_REGISTRY consistency', () => {
  it('every engine in ENGIN_REGISTRY has both daydreamHref and enginHref', () => {
    for (const entry of ENGIN_REGISTRY) {
      expect(entry.daydreamHref).toMatch(/^\//);
      expect(entry.enginHref).toMatch(/^\//);
    }
  });

  it('CREATIVE_ENGINES count matches CommandPalette engine entries', () => {
    const engineEntryCount = (commandPaletteSrc.match(/id: 'engine-/g) || []).length;
    expect(engineEntryCount).toBe(CREATIVE_ENGINES.length);
  });
});
