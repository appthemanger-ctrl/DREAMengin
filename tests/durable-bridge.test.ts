import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

beforeEach(() => {
  bridge.clearAll();
});

describe('DualRuntimeBridge – durable delivery', () => {
  describe('emitDurable', () => {
    it('returns a non-empty string ID', () => {
      const id = bridge.emitDurable('music', 'stem-ready', { stemUrl: 'x', trackId: 't1' });
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('delivers the event to active subscribers immediately', () => {
      const received: string[] = [];
      bridge.subscribe('music', 'stem-ready', (p) => {
        received.push((p as { trackId: string }).trackId);
      });
      bridge.emitDurable('music', 'stem-ready', { stemUrl: 'x', trackId: 'track-7' });
      expect(received).toEqual(['track-7']);
    });

    it('stores the emission in the durable queue with status "pending"', () => {
      const id = bridge.emitDurable('brand', 'template-ready', { templateId: 'tpl-1' });
      const queue = bridge.getDurableQueue();
      const entry = queue.find((e) => e.id === id);
      expect(entry).toBeDefined();
      expect(entry?.status).toBe('pending');
      expect(entry?.channel).toBe('brand');
      expect(entry?.event).toBe('template-ready');
    });

    it('notifies global emission listeners as with a regular emit', () => {
      const emissions: string[] = [];
      bridge.subscribeEventActivity((e) => emissions.push(e.event));
      bridge.emitDurable('content', 'deploy-status', { status: 'live' });
      expect(emissions).toContain('deploy-status');
    });
  });

  describe('ack', () => {
    it('transitions a pending emission to "acked"', () => {
      const id = bridge.emitDurable('code', 'build-success', { buildId: 'b1' });
      bridge.ack(id);
      const entry = bridge.getDurableQueue().find((e) => e.id === id);
      expect(entry?.status).toBe('acked');
      expect(entry?.ackedAt).toBeGreaterThan(0);
    });

    it('is idempotent — acking an already-acked entry is a no-op', () => {
      const id = bridge.emitDurable('code', 'build-success', { buildId: 'b2' });
      bridge.ack(id);
      const ackedAt = bridge.getDurableQueue().find((e) => e.id === id)?.ackedAt;
      bridge.ack(id); // second call
      const ackedAt2 = bridge.getDurableQueue().find((e) => e.id === id)?.ackedAt;
      expect(ackedAt2).toBe(ackedAt);
    });

    it('silently ignores unknown IDs', () => {
      expect(() => bridge.ack('non-existent-id')).not.toThrow();
    });
  });

  describe('replayPending', () => {
    it('re-delivers all pending events to current subscribers', () => {
      const received: string[] = [];

      // Emit durably BEFORE subscriber is registered
      const id = bridge.emitDurable('lab', 'result-ready', { resultId: 'r1' });

      // Subscriber comes online later
      bridge.subscribe('lab', 'result-ready', (p) => {
        received.push((p as { resultId: string }).resultId);
      });

      bridge.replayPending();

      expect(received).toContain('r1');
      // Should still be pending (replay does not auto-ack)
      const entry = bridge.getDurableQueue().find((e) => e.id === id);
      expect(entry?.status).toBe('pending');
    });

    it('does NOT re-deliver acked events', () => {
      const received: string[] = [];
      const id = bridge.emitDurable('lab', 'result-ready', { resultId: 'r2' });
      bridge.ack(id);

      bridge.subscribe('lab', 'result-ready', (p) => {
        received.push((p as { resultId: string }).resultId);
      });
      bridge.replayPending();

      expect(received).not.toContain('r2');
    });

    it('filters replay to a specific channel when supplied', () => {
      const received: { channel: string; event: string }[] = [];
      bridge.subscribeEventActivity((e) => received.push({ channel: e.channel, event: e.event }));

      bridge.emitDurable('music', 'stem-ready', { stemUrl: 'u' });
      bridge.emitDurable('code', 'build-success', { buildId: 'b3' });

      // Clear the initial-emit records so only replays show
      received.length = 0;

      bridge.replayPending('music');

      const replayed = received.map((r) => r.channel);
      expect(replayed).toContain('music');
      expect(replayed).not.toContain('code');
    });

    it('skips entries whose TTL has expired (marks them as "dropped")', () => {
      vi.useFakeTimers();
      const id = bridge.emitDurable('content', 'preset-applied', { preset: 'p1' }, 1_000);
      // Advance past TTL
      vi.advanceTimersByTime(2_000);

      const received: unknown[] = [];
      bridge.subscribe('content', 'preset-applied', (p) => received.push(p));
      bridge.replayPending();

      expect(received).toHaveLength(0);
      const entry = bridge.getDurableQueue().find((e) => e.id === id);
      expect(entry?.status).toBe('dropped');
      vi.useRealTimers();
    });
  });

  describe('clearAll', () => {
    it('empties the durable queue', () => {
      bridge.emitDurable('music', 'stem-ready', { stemUrl: 'u' });
      bridge.clearAll();
      expect(bridge.getDurableQueue()).toHaveLength(0);
    });

    it('removes all event listeners', () => {
      bridge.subscribe('code', 'build-success', () => {});
      bridge.clearAll();
      expect(bridge.listenerCount('code:build-success')).toBe(0);
    });
  });
});
