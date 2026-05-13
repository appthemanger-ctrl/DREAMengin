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
  it('mounts DreamDMBar shell in app/dreamdmbar layout and keeps root runtime providers', () => {
    const rootLayout = source('app/layout.tsx');
    const dmbarLayout = source('app/dreamdmbar/layout.tsx');

    expect(rootLayout).toContain('DreamSystemProvider');
    expect(rootLayout).toContain('DualRuntimeContainer');
    expect(rootLayout).not.toContain('GlobalDreamBar');
    expect(rootLayout).not.toContain('PersistentDreamBar');
    expect(dmbarLayout).toContain('GlobalDreamBar');
    expect(dmbarLayout).toContain('PersistentDreamBar');
  });

  it('wires DreamR to a real app page', () => {
    const page = source('app/dreamr/page.tsx');

    expect(page).toContain("from '@/app/dreamdmbar/_components/dreamr/dreamsurface.dreamr'");
    expect(page).toContain('<DreamRSection');
    expect(page).not.toContain("redirect('/homedream')");
  });

  it('redirects root app page to /dreamdmbar', () => {
    const rootPage = source('app/page.tsx');
    expect(rootPage).toContain("redirect('/dreamdmbar')");
  });

  it('keeps DMBar mounts only at app/dreamdmbar/layout.tsx', () => {
    const dmbarLayout = source('app/dreamdmbar/layout.tsx');
    const homedreamPage = source('app/dreamdmbar/homedream/page.tsx');
    const dreamspacePage = source('app/dreamdmbar/dreamspace/page.tsx');
    const dualruntimePage = source('app/dreamdmbar/dualruntime/page.tsx');

    expect(dmbarLayout).toContain('PersistentDreamBar');
    expect(dmbarLayout).toContain('GlobalDreamBar');
    expect(homedreamPage).not.toContain('PersistentDreamBar');
    expect(homedreamPage).not.toContain('GlobalDreamBar');
    expect(dreamspacePage).not.toContain('PersistentDreamBar');
    expect(dreamspacePage).not.toContain('GlobalDreamBar');
    expect(dualruntimePage).not.toContain('PersistentDreamBar');
    expect(dualruntimePage).not.toContain('GlobalDreamBar');
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

  it('uses the GameEngin builder for 32x32 original character assets', () => {
    const builder = source('components/engines/games/panels/dream.panel.BuilderPanel.tsx');

    expect(builder).toContain('const GRID_SIZE = 32');
    expect(builder).toContain('Character Builder');
    expect(builder).toContain("assetType: 'character'");
    expect(builder).toContain('32×32 character asset');
    expect(builder).toContain('role="grid"');
    expect(builder).toContain('role="gridcell"');
  });

  for (const [path, sideB] of DAYDREAM_PAGES) {
    it(`${path} mounts DaydreamShell with ${sideB}`, () => {
      const page = source(path);

      expect(page).toContain('DaydreamShell');
      expect(page).toContain(sideB);
      expect(page).toContain('sideBComponent=');
    });
  }
});
