import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';

describe('HomeDream home surface', () => {
  const dashboard = readFileSync(
    resolve(__dirname, '../components/home/WorkspaceDashboard.tsx'),
    'utf8',
  );
  const homeSystem = readFileSync(
    resolve(__dirname, '../components/home/HomeSystem.tsx'),
    'utf8',
  );
  const runtimeShell = readFileSync(
    resolve(__dirname, '../components/runtime/RuntimeShell.tsx'),
    'utf8',
  );
  const dreamDmBar = readFileSync(
    resolve(__dirname, '../components/messaging/DreamDMBar.tsx'),
    'utf8',
  );

  it('keeps HomeDream feed-first and removes the extra home search surface', () => {
    expect(dashboard).toContain('HomeDream Feed');
    expect(dashboard).toContain('Dreamengin.com is where DreamR lives inside the HomeDream.');
    expect(dashboard).toContain('⚡ DreamR: The Human Media Manifesto');
    expect(dashboard.indexOf('<HomeFeed')).toBeLessThan(dashboard.indexOf('<DaydreamPulseStrip'));
    expect(dashboard).not.toContain('DrEamsSearchBar');
    expect(dashboard).not.toContain('Recent Activity');
    expect(dashboard).not.toContain('Telemetry');
    // No localStorage-based widgets on the home surface
    expect(dashboard).not.toContain('ForgeActivityWidget');
    expect(dashboard).not.toContain('localStorage');
    // No filler signal cards
    expect(dashboard).not.toContain('RUNTIME_SIGNALS');
  });

  it('uses the canonical Daydreams label in the home surface', () => {
    expect(dashboard).toContain('Daydreams');
  });

  it('uses full-screen Surface Space layout — no persistent DreamSpace split panel', () => {
    // DreamDMBar still declares onMinimizedChange as an optional prop (prop contract unchanged)
    expect(dreamDmBar).toContain('onMinimizedChange?:');
    // HomeSystem renders Surface Space as a full-screen fixed layer — no DreamSpace sliver
    expect(homeSystem).toContain("position: 'fixed'");
    expect(homeSystem).toContain('inset: 0');
    // The old persistent split panel ("DreamSpace (bottom runtime)") is gone
    expect(homeSystem).not.toContain('DreamSpace (bottom runtime)');
    // The bar floats in non-divider mode — no splitRatio/onSplitChange props from HomeSystem
    expect(homeSystem).not.toContain('splitRatio={splitRatio}');
    expect(homeSystem).not.toContain('onSplitChange={setSplitRatio}');
  });

  it('keeps feed scrolling native while limiting divider drag capture to the centered seam handle', () => {
    expect(runtimeShell).toContain("touchAction: 'pan-y'");
    expect(dreamDmBar).toContain("pointerEvents: 'none'");
    expect(dreamDmBar).toContain("width: isDividerMode ? 112 : '100%'");
  });
});

describe('DreamDM divider layout', () => {
  it('keeps enough divider height for the compact DreamDM bar content', () => {
    expect(DIVIDER_H).toBeGreaterThanOrEqual(80);
  });
});
