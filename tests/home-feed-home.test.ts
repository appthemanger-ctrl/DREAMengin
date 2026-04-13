import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';

describe('HomeDream home surface', () => {
  const dashboard = readFileSync(
    resolve(__dirname, '../components/home/WorkspaceDashboard.tsx'),
    'utf8',
  );
  // Canonical HomeSystem — kept in sync with dreamdmbar/homedream/HomeSystem.tsx
  const homeSystem = readFileSync(
    resolve(__dirname, '../components/home/HomeSystem.tsx'),
    'utf8',
  );
  const runtimeShell = readFileSync(
    resolve(__dirname, '../components/runtime/RuntimeShell.tsx'),
    'utf8',
  );
  // Authoritative DreamDMBar (in dreamdmbar/ directory)
  const dreamDmBar = readFileSync(
    resolve(__dirname, '../dreamdmbar/DreamDMBar.tsx'),
    'utf8',
  );
  // Shell-First: the persistent bar wrapper that lives in app/layout.tsx
  const persistentBar = readFileSync(
    resolve(__dirname, '../components/home/PersistentDreamBar.tsx'),
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

  it('uses persistent dual-runtime layout with the DreamDM seam as the live divider', () => {
    // DreamDMBar still declares onMinimizedChange as an optional prop (prop contract unchanged)
    expect(dreamDmBar).toContain('onMinimizedChange?:');
    // HomeSystem renders two fixed runtime regions on one screen
    expect(homeSystem).toContain("position: 'fixed'");
    expect(homeSystem).toContain('height: topHeight');
    expect(homeSystem).toContain('height: bottomHeight');
    // Shell-First: divider mode is now wired from PersistentDreamBar (in layout.tsx),
    // not from HomeSystem directly — HomeSystem writes splitRatio to context instead.
    expect(homeSystem).toContain('splitRatio');
    expect(homeSystem).toContain('setSplitRatio');
    expect(homeSystem).toContain('setIsBarMinimized');
    // PersistentDreamBar passes split props to DreamDMBar from context
    expect(persistentBar).toContain('splitRatio={isHomeSystemActive ? splitRatio : undefined}');
    expect(persistentBar).toContain('onSplitChange={isHomeSystemActive ? setSplitRatio : undefined}');
    expect(persistentBar).toContain('onMinimizedChange={isHomeSystemActive ? setIsBarMinimized : undefined}');
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
