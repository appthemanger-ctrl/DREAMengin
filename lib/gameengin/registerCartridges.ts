'use client';

import { CARTRIDGE_MANIFEST } from '@/lib/gameengin/cartridges/manifest';
import { moduleRegistry } from '@/lib/runtime/moduleRegistry';
import type { ModuleManifest } from '@/types/module-manifest';

function manifestToModule(entry: (typeof CARTRIDGE_MANIFEST)[number]): ModuleManifest {
  return {
    id: `cartridge:${entry.id}`,
    type: 'game-cartridge',
    sourceRuntime: 'homedream',
    compatibleRuntimes: ['homedream', 'dreamspace'],
    content: {
      cartridgeId: entry.id,
      label: entry.label,
      category: entry.category,
      renderMode: entry.renderMode,
      tier: entry.tier,
      description: entry.description,
    },
    ui: {
      defaultSize: { width: 360, height: 240 },
      resizable: true,
      movable: true,
    },
  };
}

export function registerCartridges(): string[] {
  const ids: string[] = [];
  for (const entry of CARTRIDGE_MANIFEST) {
    const manifest = manifestToModule(entry);
    moduleRegistry.register(manifest);
    ids.push(manifest.id);
  }
  return ids;
}
