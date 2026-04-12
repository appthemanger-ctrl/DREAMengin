import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

const upgradedSurfaces = [
  'daydreams/music/page.tsx',
  'daydreams/games/page.tsx',
  'daydreams/code/page.tsx',
  'daydreams/lab/page.tsx',
  'daydreams/brand/page.tsx',
  'daydreams/create/page.tsx',
  'app/daydream/analytics/page.tsx',
  'coresurfaces/DreamMarketplace.tsx',
  'app/settings/help/page.tsx',
  'app/settings/security/page.tsx',
  'app/settings/algorithm/page.tsx',
  'app/settings/widgets/page.tsx',
  'app/settings/safety/page.tsx',
  'app/settings/notifications/page.tsx',
] as const;

describe('authenticated UI shell upgrade rollout', () => {
  it('adds the shared authenticated page header component', () => {
    const src = readFileSync(join(root, 'components/ui/AuthenticatedPageHeader.tsx'), 'utf-8');
    expect(src).toContain('BrandLogo');
    expect(src).toContain('de-auth-header');
    expect(src).toContain('de-auth-badge');
  });

  it('defines the authenticated shell CSS primitives in globals.css', () => {
    const src = readFileSync(join(root, 'styles/globals.css'), 'utf-8');
    expect(src).toContain('.de-auth-header');
    expect(src).toContain('.de-auth-content');
    expect(src).toContain('.de-auth-hero');
  });

  it('rolls the shared authenticated header across upgraded post-login surfaces', () => {
    for (const rel of upgradedSurfaces) {
      const src = readFileSync(join(root, rel), 'utf-8');
      expect(src, rel).toContain("import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader'");
      expect(src, rel).toContain('<AuthenticatedPageHeader');
    }
  });

  it('upgrades shared post-login shells with premium framing', () => {
    const daydreamShell = readFileSync(join(root, 'components/daydream/DaydreamShell.tsx'), 'utf-8');
    const dashboard = readFileSync(join(root, 'dreamdmbar/homedream/WorkspaceDashboard.tsx'), 'utf-8');
    const pulseStrip = readFileSync(join(root, 'components/home/DaydreamPulseStrip.tsx'), 'utf-8');
    const dreamsPanel = readFileSync(join(root, 'components/dreams/DreamsSpacePanel.tsx'), 'utf-8');

    expect(daydreamShell).toContain('BrandLogo');
    expect(daydreamShell).toContain('accentColor');
    // EnginSurface now uses a dark premium hero block (no longer de-auth-hero)
    expect(dashboard).toContain('de-auth-hero');
    expect(dashboard).toContain('BrandLogo');
    expect(dashboard).toContain('DaydreamPulseStrip');
    expect(dashboard).toContain('onOpenDaydream');
    expect(pulseStrip).toContain('6 daydreams + analytics + forge');
    expect(pulseStrip).toContain('onOpenDaydream');
    expect(dreamsPanel).toContain('Pinned apps + feeds across the dual runtime');
  });
});
