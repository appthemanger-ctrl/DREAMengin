import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

function source(path: string) {
  return readFileSync(join(root, path), 'utf-8');
}

const ENGINE_PAGES = [
  ['app/engines/games/page.tsx', 'GameEnginApp'],
  ['app/engines/music/page.tsx', 'MusicEnginApp'],
  ['app/engines/code/page.tsx', 'CodeEnginApp'],
  ['app/engines/lab/page.tsx', 'LabEnginApp'],
  ['app/engines/brand/page.tsx', 'BrandEnginApp'],
  ['app/engines/create/page.tsx', 'CreateEnginApp'],
  ['app/engines/portfolio/page.tsx', 'PortfolioEnginApp'],
] as const;

const ENGINE_PANEL_PAGES = [
  ['app/engines/games/library/page.tsx', 'LibraryPanel'],
  ['app/engines/games/scores/page.tsx', 'ScoresPanel'],
  ['app/engines/games/builder/page.tsx', 'BuilderPanel'],
  ['app/engines/music/studio/page.tsx', 'StudioPanel'],
  ['app/engines/music/arrange/page.tsx', 'ArrangePanel'],
  ['app/engines/music/library/page.tsx', 'MusicLibraryPanel'],
  ['app/engines/code/notebook/page.tsx', 'NotebookPanel'],
  ['app/engines/code/projects/page.tsx', 'ProjectsPanel'],
  ['app/engines/code/ai/page.tsx', 'AIPanel'],
  ['app/engines/lab/experiments/page.tsx', 'ExperimentsPanel'],
  ['app/engines/lab/data/page.tsx', 'DataVizPanel'],
  ['app/engines/lab/quantum/page.tsx', 'QuantumPanel'],
  ['app/engines/brand/identity/page.tsx', 'IdentityPanel'],
  ['app/engines/brand/campaigns/page.tsx', 'CampaignsPanel'],
  ['app/engines/create/editor/page.tsx', 'EditorPanel'],
  ['app/engines/create/calendar/page.tsx', 'CalendarPanel'],
  ['app/engines/create/queue/page.tsx', 'QueuePanel'],
  ['app/engines/portfolio/optimize/page.tsx', 'OptimizePanel'],
  ['app/engines/portfolio/assets/page.tsx', 'AssetsPanel'],
  ['app/engines/portfolio/quantum/page.tsx', 'PortfolioQuantumPanel'],
] as const;

const DAYDREAM_PAGES = [
  ['app/daydream/music/page.tsx', 'StarMakerEngin'],
  ['app/daydream/games/page.tsx', 'GameEngin'],
  ['app/daydream/lab/page.tsx', 'LabEngin'],
  ['app/daydream/code/page.tsx', 'CodeEngin'],
  ['app/daydream/brand/page.tsx', 'BrandingEngin'],
  ['app/daydream/create/page.tsx', 'ContentEngin'],
  ['app/daydream/forge/page.tsx', 'ForgeEngin'],
  ['app/daydream/lab/portfolio/page.tsx', 'PortfolioEngin'],
] as const;

describe('page surface wiring', () => {
  it('mounts DreamDMBar and dual-runtime providers from the root layout', () => {
    const layout = source('app/layout.tsx');

    expect(layout).toContain('DreamSystemProvider');
    expect(layout).toContain('DualRuntimeContainer');
    expect(layout).toContain('GlobalDreamBar');
    expect(layout).toContain('PersistentDreamBar');
  });

  it('wires DreamR to a real app page', () => {
    const page = source('app/dreamr/page.tsx');

    expect(page).toContain("from '@/dreamdmbar/homedream/dreamr/dreamsurface.dreamr'");
    expect(page).toContain('<DreamRSection');
    expect(page).not.toContain("redirect('/homedream')");
  });

  for (const [path, component] of ENGINE_PAGES) {
    it(`${path} renders ${component}`, () => {
      const page = source(path);

      expect(page).toContain(component);
      expect(page).not.toContain("redirect('/engines");
    });
  }

  for (const [path, panel] of ENGINE_PANEL_PAGES) {
    it(`${path} renders ${panel} inside EnginAppShell`, () => {
      const page = source(path);

      expect(page).toContain('EnginAppShell');
      expect(page).toContain(panel);
      expect(page).not.toContain("redirect('/engines");
    });
  }

  for (const [path, sideB] of DAYDREAM_PAGES) {
    it(`${path} mounts DaydreamShell with ${sideB}`, () => {
      const page = source(path);

      expect(page).toContain('DaydreamShell');
      expect(page).toContain(sideB);
      expect(page).toContain('sideBComponent=');
    });
  }
});
