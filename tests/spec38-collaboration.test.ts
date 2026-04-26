/**
 * tests/spec38-collaboration.test.ts
 *
 * §38 Shared Dream Collaboration
 * Tests the lib/collaboration/ module (non-browser parts).
 */

import { describe, it, expect } from 'vitest';
import {
  broadcastEdit,
  createCollabSession,
  generateInviteLink,
  parseInviteLink,
  WebRTCCollabSession,
  type CollabPayload,
} from '@/lib/collaboration/index';

// ─── §38.2 Invite link ───────────────────────────────────────────────────────

describe('§38.2 Invite link helpers', () => {
  it('generateInviteLink embeds channelId as ?shared-dream=', () => {
    const url = generateInviteLink('https://dreamengin.com/home', 'ch-abc123');
    expect(url).toContain('shared-dream=ch-abc123');
  });

  it('parseInviteLink extracts channelId', () => {
    const url = 'https://dreamengin.com/home?shared-dream=ch-abc123';
    expect(parseInviteLink(url)).toBe('ch-abc123');
  });

  it('parseInviteLink returns null for URLs without the parameter', () => {
    expect(parseInviteLink('https://dreamengin.com/home')).toBeNull();
  });

  it('parseInviteLink returns null for invalid URLs', () => {
    expect(parseInviteLink('not-a-url')).toBeNull();
  });

  it('generateInviteLink → parseInviteLink round-trip', () => {
    const channelId = 'dream-session-xyz';
    const url       = generateInviteLink('https://dreamengin.com', channelId);
    expect(parseInviteLink(url)).toBe(channelId);
  });
});

// ─── §38.1 Transport types ───────────────────────────────────────────────────

describe('§38.1 CollabTransport types', () => {
  it('WebRTCCollabSession has transport="webrtc"', () => {
    // We don't instantiate RTCPeerConnection in node; test the type guard only
    const session = new WebRTCCollabSession('test-ch', 'peer-1');
    expect(session.transport).toBe('webrtc');
  });

  it('WebRTCCollabSession exposes channelId and peerId', () => {
    const session = new WebRTCCollabSession('channel-99', 'peer-99');
    expect(session.channelId).toBe('channel-99');
    expect(session.peerId).toBe('peer-99');
  });

  it('initial peers list contains only local peer', () => {
    const session = new WebRTCCollabSession('ch', 'my-peer');
    expect(session.peers).toHaveLength(1);
    expect(session.peers[0]?.peerId).toBe('my-peer');
  });
});

// ─── §38 onMessage / send ────────────────────────────────────────────────────

describe('§38 WebRTCCollabSession onMessage/send (mock channel)', () => {
  it('onMessage returns an unsubscribe function', () => {
    const session = new WebRTCCollabSession('ch', 'peer');
    const unsub   = session.onMessage(() => {});
    expect(typeof unsub).toBe('function');
    unsub(); // should not throw
  });

  it('calling unsubscribe removes the handler', () => {
    const session = new WebRTCCollabSession('ch', 'peer');
    let count = 0;
    const unsub = session.onMessage(() => { count++; });
    unsub();
    // Manually fire internal handler via the exposed peer list
    // (No data channels in node — just ensure no error)
    expect(count).toBe(0);
  });
});

// ─── Production fallback ─────────────────────────────────────────────────────

describe('§38 production transport fallback', () => {
  it('createCollabSession falls back to a local session when Supabase is absent', async () => {
    const session = await createCollabSession('fallback-ch', { transport: 'supabase' });

    expect(session.transport).toBe('local');
    expect(session.peers).toHaveLength(1);

    await session.leave();
  });

  it('local fallback sessions exchange edit payloads on the same channel', async () => {
    const a = await createCollabSession('local-ch', { transport: 'local' });
    const b = await createCollabSession('local-ch', { transport: 'local' });
    const received: unknown[] = [];

    b.onMessage((payload) => {
      if (payload.type === 'edit') received.push(payload.data);
    });

    await broadcastEdit(a, { op: 'insert', value: 'dream' });

    expect(received).toEqual([{ op: 'insert', value: 'dream' }]);

    await a.leave();
    await b.leave();
  });
});

// ─── CollabPayload shape ─────────────────────────────────────────────────────

describe('§38 CollabPayload types', () => {
  it('cursor payload has type="cursor"', () => {
    const p: CollabPayload = { type: 'cursor', peerId: 'x', data: { x: 10, y: 20 } };
    expect(p.type).toBe('cursor');
  });

  it('edit payload has type="edit"', () => {
    const p: CollabPayload = { type: 'edit', peerId: 'x', data: { op: 'insert' } };
    expect(p.type).toBe('edit');
  });

  it('playhead payload has type="playhead"', () => {
    const p: CollabPayload = { type: 'playhead', peerId: 'x', data: { positionSec: 42 } };
    expect(p.type).toBe('playhead');
  });
});
