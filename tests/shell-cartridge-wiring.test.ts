import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CARTRIDGE_MANIFEST } from '@/lib/gameengin/cartridges/manifest';
import { registerCartridges } from '@/lib/gameengin/registerCartridges';
import { moduleRegistry, useModuleRegistry } from '@/lib/runtime/moduleRegistry';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('shell + cartridge wiring', () => {
  it('mounts DMBar from app/layout.tsx only', () => {
    const layout = source('app/layout.tsx');
    expect(layout).toMatch(/<\s*PersistentDreamBar\b|<\s*DreamDMBar\b/);

    const files = [
      'app/layout.tsx',
      'components/providers/dream.AppSurfaceShell.tsx',
      'components/home/dream.bar.PersistentDreamBar.tsx',
      'app/homedream/page.tsx',
      'app/dreamspace/page.tsx',
    ];

    const totalMounts = files
      .map((path) => source(path).match(/<\s*PersistentDreamBar\b|<\s*DreamDMBar\b/g)?.length ?? 0)
      .reduce((sum, count) => sum + count, 0);

    expect(totalMounts).toBe(1);
  });

  it('registers every cartridge manifest entry in moduleRegistry', () => {
    for (const id of Object.keys(useModuleRegistry.getState().modules)) {
      moduleRegistry.unregister(id);
    }

    registerCartridges();

    const moduleIds = new Set(Object.keys(useModuleRegistry.getState().modules));
    for (const entry of CARTRIDGE_MANIFEST) {
      expect(moduleIds.has(`cartridge:${entry.id}`)).toBe(true);
    }
  });

  it('HomeDream page does not import PersistentDreamBar', () => {
    const homePage = source('app/homedream/page.tsx');
    expect(homePage).not.toContain('PersistentDreamBar');
  });
});
