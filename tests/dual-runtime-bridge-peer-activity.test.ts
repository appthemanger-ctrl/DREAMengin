import { beforeEach, describe, expect, it } from 'vitest';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

describe('Dual runtime bridge peer activity observers', () => {
  beforeEach(() => {
    bridge.clearAll();
  });

  it('publishes peer snapshots on subscribe, emit, and unsubscribe', () => {
    const snapshots: Array<ReadonlyArray<ReturnType<typeof bridge.getPeers>[number]>> = [];
    const unsubscribeObserver = bridge.subscribePeerActivity((peers) => {
      snapshots.push(peers.map((peer) => ({ ...peer })));
    });

    const unsubscribeCode = bridge.subscribe('code', 'code:output', () => {});
    bridge.emit('code', 'code:output', { lines: ['ok'], status: 'done' });
    unsubscribeCode();

    unsubscribeObserver();

    const lastSnapshot = snapshots.at(-1);
    expect(snapshots.length).toBeGreaterThanOrEqual(3);
    expect(lastSnapshot).toBeDefined();
    expect(lastSnapshot?.find((peer) => peer.channel === 'code')?.subscriberCount).toBe(0);
    expect(snapshots.some((snapshot) =>
      (snapshot.find((peer) => peer.channel === 'code')?.lastActivityAt ?? 0) > 0,
    )).toBe(true);
  });

  it('publishes event emissions to global observers', () => {
    const emissions: Array<{ channel: string; event: string }> = [];
    const unsubscribe = bridge.subscribeEventActivity((emission) => {
      emissions.push({ channel: emission.channel, event: emission.event });
    });

    bridge.emit('music', 'music:bpm-changed', { bpm: 128, trackId: 'track-1' });
    bridge.emit('create', 'create:draft-saved', {
      draftId: 'draft-1',
      contentType: 'text',
      title: 'hello',
    });

    unsubscribe();

    expect(emissions).toEqual([
      { channel: 'music', event: 'music:bpm-changed' },
      { channel: 'create', event: 'create:draft-saved' },
    ]);
  });
});
