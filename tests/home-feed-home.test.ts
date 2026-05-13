import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';

describe('HomeDream home surface', () => {
  const dashboard = readFileSync(
    resolve(__dirname, '../app/dreamdmbar/_components/HomeDreamRegion.tsx'),
    'utf8',
  );
  // Canonical HomeSystem.
  const homeSystem = readFileSync(
    resolve(__dirname, '../app/dreamdmbar/_components/DreamBarDataBridge.tsx'),
    'utf8',
  );
  const runtimeShell = readFileSync(
    resolve(__dirname, '../components/runtime/dream.shell.RuntimeShell.tsx'),
    'utf8',
  );
  // Authoritative DreamDMBar (in dreamdmbar/ directory)
  const dreamDmBar = readFileSync(
    resolve(__dirname, '../dreamdmbar/dreamsurface.dreamdmbar.tsx'),
    'utf8',
  );
  // Shell-First: the persistent bar wrapper that lives in app/layout.tsx
  const persistentBar = readFileSync(
    resolve(__dirname, '../components/home/dream.bar.PersistentDreamBar.tsx'),
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
    // PersistentDreamBar is the true home container — it renders the two fixed runtime regions
    expect(persistentBar).toContain("position: 'fixed'");
    expect(persistentBar).toContain('height: topHeight');
    expect(persistentBar).toContain('height: bottomHeight');
    // DreamBarDataBridge still reads splitRatio/isBarMinimized from context (used by callbacks + effects)
    expect(homeSystem).toContain('splitRatio');
    expect(homeSystem).toContain('setSplitRatio');
    expect(homeSystem).toContain('setIsBarMinimized');
    // PersistentDreamBar passes split props to DreamDMBar only when isHomeActive (bar IS home on /homedream)
    expect(persistentBar).toContain('splitRatio={isHomeActive ? splitRatio : undefined}');
    expect(persistentBar).toContain('onSplitChange={isHomeActive ? setSplitRatio : undefined}');
    expect(persistentBar).toContain('onMinimizedChange={isHomeActive ? setIsBarMinimized : undefined}');
  });

  it('preserves runtimes when bar is minimized (Bar Ownership Law §0)', () => {
    // Per Bar Ownership Law §0: hiding the bar must NOT force splitRatio to 1.
    // Both runtimes remain visible at their last split position.
    expect(persistentBar).toContain('const runtimeSplitRatio = splitRatio');
    expect(persistentBar).toContain('splitRatio={runtimeSplitRatio}');
  });

  it('keeps feed scrolling native while limiting divider drag capture to the centered seam handle', () => {
    expect(runtimeShell).toContain("touchAction: 'manipulation'");
    expect(dreamDmBar).toContain("pointerEvents: 'none'");
    expect(dreamDmBar).toContain("width: isDividerMode ? 112 : '100%'");
  });
});

describe('DreamDM divider layout', () => {
  it('reserves only the visible seam height between runtimes', () => {
    expect(DIVIDER_H).toBe(2);
  });
});
