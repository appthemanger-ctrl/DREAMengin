import { beforeEach, describe, expect, it } from 'vitest';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

describe('Dual runtime bridge peer activity observers', () => {
  beforeEach(() => {
    bridge.clearAll();
  });

  it('publishes peer snapshots on subscribe, emit, and unsubscribe', () => {
    const snapshots: Array<readonly ReturnType<typeof bridge.getPeers>> = [];
    const unsubscribeObserver = bridge.subscribePeerActivity((peers) => {
      snapshots.push(peers.map((peer) => ({ ...peer })));
    });

    const unsubscribeCode = bridge.subscribe('code', 'code:output', () => {});
    bridge.emit('code', 'code:output', { lines: ['ok'], status: 'done' });
    unsubscribeCode();

    unsubscribeObserver();

    expect(snapshots.length).toBeGreaterThanOrEqual(3);
    expect(snapshots.at(-1)?.find((peer) => peer.channel === 'code')?.subscriberCount).toBe(0);
    expect(snapshots.some((snapshot) =>
      (snapshot.find((peer) => peer.channel === 'code')?.lastActivityAt ?? 0) > 0,
    )).toBe(true);
  });
});
