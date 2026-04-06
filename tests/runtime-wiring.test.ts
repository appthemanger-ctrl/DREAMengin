import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import { dreamOSBus, type DreamOSSharedArtifact } from '@/lib/runtime/dreamOSBus';
import { getSwap, toggleSwap } from '@/lib/runtime/swapManager';

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Runtime Wiring: dualRuntimeBridge + dreamOSBus', () => {
  beforeEach(() => {
    bridge.clearAll();
    dreamOSBus.clearAll();
    vi.unstubAllGlobals();
  });

  it('propagates a code event through dualRuntimeBridge subscribers', async () => {
    const testPayload = {
      code: 'console.log("hello")',
      language: 'typescript',
      engine: 'lab',
    };
    let receivedPayload: typeof testPayload | null = null;

    bridge.subscribe('code', 'code:run', (payload) => {
      receivedPayload = payload;
    });

    bridge.emit('code', 'code:run', testPayload);

    await nextTick();

    expect(receivedPayload).toEqual(testPayload);
  });

  it('mirrors bridge emissions into dreamOSBus shared artifacts', async () => {
    const testEvent = {
      code: 'console.log("hello")',
      language: 'typescript',
      engine: 'lab',
    };

    bridge.emit('code', 'code:run', testEvent);

    await nextTick();

    const artifact = dreamOSBus.getSnapshot().artifacts[0] as DreamOSSharedArtifact | undefined;

    expect(artifact).toBeDefined();
    expect(artifact?.kind).toBe('event');
    expect(artifact?.sourceSubsystem).toBe('CodeEngin');
    expect(artifact?.payload).toMatchObject({
      channel: 'code',
      event: 'code:run',
      ...testEvent,
    });
  });

  it('toggles persisted swap state through swapManager helpers', () => {
    const storage = new Map<string, string>();
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
      clear: vi.fn(() => {
        storage.clear();
      }),
    };

    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('window', { localStorage: localStorageMock });

    expect(getSwap('code')).toBe(false);
    expect(toggleSwap('code')).toBe(true);
    expect(getSwap('code')).toBe(true);
  });
});
