import { beforeEach, describe, expect, it } from 'vitest';
import {
  hideArtifact,
  listSystemArtifacts,
  listVisibleArtifacts,
  loadArtifacts,
  restoreArtifact,
  saveArtifact,
} from '@/lib/artifactStore';
import {
  loadActiveModules,
  removeActiveModule,
  saveActiveModule,
} from '@/lib/activeModulesStore';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';
import type { DreamArtifact } from '@/types/dreamArtifact';

const accountId = 'user-123';

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: createLocalStorageMock() },
    writable: true,
  });
});

describe('modular OS stores', () => {
  it('loads default system artifacts for a new account', () => {
    const artifacts = loadArtifacts(accountId);
    expect(artifacts.some((artifact) => artifact.id === 'music-generator')).toBe(true);
    expect(listSystemArtifacts(accountId).length).toBeGreaterThan(1);
  });

  it('persists custom artifacts and supports hide/restore', () => {
    const artifact: DreamArtifact = {
      id: 'custom-bot',
      type: 'bot',
      name: 'Custom Bot',
      source: 'user-created',
      capabilities: ['chat'],
      ownerId: accountId,
      isSystemModule: false,
      createdAt: Date.now(),
    };

    saveArtifact(accountId, artifact);
    expect(loadArtifacts(accountId).some((entry) => entry.id === 'custom-bot')).toBe(true);

    hideArtifact(accountId, 'music-generator');
    expect(listVisibleArtifacts(accountId).some((entry) => entry.id === 'music-generator')).toBe(false);

    restoreArtifact(accountId, 'music-generator');
    expect(listVisibleArtifacts(accountId).some((entry) => entry.id === 'music-generator')).toBe(true);
  });

  it('persists active module instances', () => {
    saveActiveModule(accountId, {
      instanceId: 'module-1',
      artifactId: 'music-generator',
      runtimeRegion: 'surface',
      containerId: 'module-1',
      state: {},
    });

    expect(loadActiveModules(accountId)).toHaveLength(1);
    removeActiveModule(accountId, 'module-1');
    expect(loadActiveModules(accountId)).toHaveLength(0);
  });
});

describe('dreamOSBus modular events', () => {
  it('emits and receives modular OS custom events', () => {
    const received: string[][] = [];
    const unsubscribe = dreamOSBus.on('capability:add', ({ capabilities }) => {
      received.push(capabilities);
    });

    dreamOSBus.emit('capability:add', {
      artifactId: 'music-generator',
      accountId,
      capabilities: ['generate-music', 'compose'],
    });

    unsubscribe();
    expect(received).toEqual([['generate-music', 'compose']]);
  });
});
