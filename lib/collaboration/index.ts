/**
 * lib/collaboration/index.ts — §38 Shared Dream Collaboration
 *
 * Real-time multi-user session layer supporting two transports:
 *
 *   1. Supabase Realtime (broadcast) — zero infrastructure, up to ~40 peers
 *   2. WebRTC Data Channels (peer-to-peer) — ultra-low latency, LAN/offline
 *
 * §38.1 Architecture:
 *   - Two instances of the same component on the same page.
 *   - Shared view (top) visible to all; private controls (bottom) per user.
 *   - Communication via WebRTC Data Channels OR Supabase Realtime.
 *
 * §38.2 Invite flow:
 *   "Launch Shared Dream" → generate invite link → friend accepts
 *   → real-time sync (cursors, edits, playhead). Optional audio call.
 *
 * §38.3 Scaling:
 *   Works for 2–40+ users (WebRTC mesh up to ~8, then Supabase broadcast).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ── §38.1 Transport type ──────────────────────────────────────────────────────

export type CollabTransport = 'supabase' | 'webrtc' | 'local';

// ── Shared event types ────────────────────────────────────────────────────────

export type CollabEventType =
  | 'cursor'
  | 'edit'
  | 'playhead'
  | 'peer_join'
  | 'peer_leave'
  | 'audio_offer'
  | 'audio_answer'
  | 'ice_candidate'
  | 'custom';

export interface CollabPayload {
  type: CollabEventType;
  peerId: string;
  data: unknown;
}

export type CollabEventHandler = (payload: CollabPayload) => void;

// ── Peer info ─────────────────────────────────────────────────────────────────

export interface PeerInfo {
  peerId: string;
  joinedAt: number;
  /** Transport in use for this peer. */
  transport: CollabTransport;
}

// ── Session interface (common to both transports) ─────────────────────────────

export interface CollabSession {
  channelId: string;
  peerId: string;
  transport: CollabTransport;
  /** List of known peers (updated on join/leave). */
  readonly peers: readonly PeerInfo[];
  /** Broadcast an arbitrary payload to all peers. */
  send(payload: CollabPayload): Promise<void>;
  /** Add an event handler for incoming messages. */
  onMessage(handler: CollabEventHandler): () => void;
  /** Leave the session and clean up. */
  leave(): Promise<void>;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function generatePeerId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── §38 local fallback transport ─────────────────────────────────────────────

interface LocalCollabBus {
  peers: Map<string, PeerInfo>;
  handlers: Map<string, Set<CollabEventHandler>>;
}

const localBuses = new Map<string, LocalCollabBus>();

function getLocalBus(channelId: string): LocalCollabBus {
  const existing = localBuses.get(channelId);
  if (existing) return existing;
  const bus: LocalCollabBus = {
    peers: new Map(),
    handlers: new Map(),
  };
  localBuses.set(channelId, bus);
  return bus;
}

class LocalCollabSession implements CollabSession {
  readonly transport: CollabTransport = 'local';
  private readonly _bus: LocalCollabBus;
  private readonly _handlers = new Set<CollabEventHandler>();

  constructor(
    readonly channelId: string,
    readonly peerId: string,
  ) {
    this._bus = getLocalBus(channelId);
    this._bus.handlers.set(peerId, this._handlers);
    this._bus.peers.set(peerId, { peerId, joinedAt: Date.now(), transport: 'local' });
    void this.send({ type: 'peer_join', peerId, data: { joinedAt: Date.now(), transport: 'local' } });
  }

  get peers(): readonly PeerInfo[] {
    return Array.from(this._bus.peers.values());
  }

  async send(payload: CollabPayload): Promise<void> {
    if (payload.type === 'peer_join') {
      this._bus.peers.set(payload.peerId, {
        peerId: payload.peerId,
        joinedAt: (payload.data as { joinedAt?: number }).joinedAt ?? Date.now(),
        transport: 'local',
      });
    } else if (payload.type === 'peer_leave') {
      this._bus.peers.delete(payload.peerId);
    }

    for (const [peerId, handlers] of this._bus.handlers.entries()) {
      if (peerId === this.peerId && payload.type !== 'peer_join' && payload.type !== 'peer_leave') {
        continue;
      }
      for (const h of Array.from(handlers)) {
        try { h(payload); } catch {}
      }
    }
  }

  onMessage(handler: CollabEventHandler): () => void {
    this._handlers.add(handler);
    return () => { this._handlers.delete(handler); };
  }

  async leave(): Promise<void> {
    await this.send({ type: 'peer_leave', peerId: this.peerId, data: { leftAt: Date.now() } });
    this._handlers.clear();
    this._bus.handlers.delete(this.peerId);
    if (this._bus.handlers.size === 0) {
      localBuses.delete(this.channelId);
    }
  }
}

export function createLocalCollabSession(channelId: string): CollabSession {
  return new LocalCollabSession(channelId, generatePeerId());
}

// ─── §38 Supabase transport ───────────────────────────────────────────────────

class SupabaseCollabSession implements CollabSession {
  readonly transport: CollabTransport = 'supabase';
  private readonly _peers = new Map<string, PeerInfo>();
  private readonly _handlers = new Set<CollabEventHandler>();
  private _channel: import('@supabase/supabase-js').RealtimeChannel;

  constructor(
    readonly channelId: string,
    readonly peerId: string,
    channel: import('@supabase/supabase-js').RealtimeChannel,
  ) {
    this._channel = channel;
    this._peers.set(peerId, { peerId, joinedAt: Date.now(), transport: 'supabase' });

    channel.on('broadcast', { event: 'collab' }, ({ payload }) => {
      const p = payload as CollabPayload;
      if (p.type === 'peer_join') {
        this._peers.set(p.peerId, {
          peerId: p.peerId,
          joinedAt: (p.data as { joinedAt?: number }).joinedAt ?? Date.now(),
          transport: 'supabase',
        });
      } else if (p.type === 'peer_leave') {
        this._peers.delete(p.peerId);
      }
      for (const h of this._handlers) {
        try { h(p); } catch {}
      }
    });
  }

  get peers(): readonly PeerInfo[] {
    return Array.from(this._peers.values());
  }

  async send(payload: CollabPayload): Promise<void> {
    await this._channel.send({
      type: 'broadcast',
      event: 'collab',
      payload,
    });
  }

  onMessage(handler: CollabEventHandler): () => void {
    this._handlers.add(handler);
    return () => { this._handlers.delete(handler); };
  }

  async leave(): Promise<void> {
    await this.send({ type: 'peer_leave', peerId: this.peerId, data: { leftAt: Date.now() } });
    await this._channel.unsubscribe();
  }
}

/**
 * createSupabaseCollabSession(channelId, supabaseClient, handlers?)
 *
 * §38: Create (or join) a Supabase Realtime collaborative session.
 * Up to 40+ peers via Supabase broadcast.
 */
export async function createSupabaseCollabSession(
  channelId: string,
  supabaseClient: SupabaseClient,
  handlers: CollabEventHandler[] = [],
): Promise<CollabSession> {
  const peerId = generatePeerId();
  const channel = supabaseClient.channel(`dream:collab:${channelId}`, {
    config: { broadcast: { self: false } },
  });

  const session = new SupabaseCollabSession(channelId, peerId, channel);
  for (const h of handlers) session.onMessage(h);

  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
    });
  });

  await session.send({
    type: 'peer_join',
    peerId,
    data: { joinedAt: Date.now(), transport: 'supabase' },
  });

  return session;
}

// ─── §38 WebRTC transport ─────────────────────────────────────────────────────

/**
 * WebRTC data-channel session for ultra-low-latency 2-8 peer collaboration.
 *
 * §38.2: Signalling is done out-of-band (via Supabase Realtime or any other
 * mechanism). Once both peers have the channel open, messages are sent P2P.
 *
 * For SFU / broadcast mode (8+ peers), fall back to SupabaseCollabSession.
 */
export class WebRTCCollabSession implements CollabSession {
  readonly transport: CollabTransport = 'webrtc';
  private readonly _peers = new Map<string, PeerInfo>();
  private readonly _handlers = new Set<CollabEventHandler>();
  private readonly _channels = new Map<string, RTCDataChannel>();
  private readonly _connections = new Map<string, RTCPeerConnection>();
  private readonly _iceServers: RTCIceServer[];

  constructor(
    readonly channelId: string,
    readonly peerId: string,
    iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }],
  ) {
    this._iceServers = iceServers;
    this._peers.set(peerId, { peerId, joinedAt: Date.now(), transport: 'webrtc' });
  }

  get peers(): readonly PeerInfo[] {
    return Array.from(this._peers.values());
  }

  /**
   * Create an offer to connect to a remote peer.
   * The returned offer SDP should be sent to the remote peer via signalling.
   */
  async createOffer(remotePeerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = new RTCPeerConnection({ iceServers: this._iceServers });
    const dc = pc.createDataChannel('collab', { ordered: false });
    this._setupDataChannel(dc, remotePeerId);
    this._connections.set(remotePeerId, pc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Accept an offer from a remote peer.
   * The returned answer SDP should be sent back via signalling.
   */
  async acceptOffer(
    remotePeerId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    const pc = new RTCPeerConnection({ iceServers: this._iceServers });
    this._connections.set(remotePeerId, pc);

    pc.ondatachannel = ({ channel }) => {
      this._setupDataChannel(channel, remotePeerId);
    };

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  /** Apply an answer from a remote peer. */
  async applyAnswer(
    remotePeerId: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    const pc = this._connections.get(remotePeerId);
    if (!pc) throw new Error(`No connection for peer ${remotePeerId}`);
    await pc.setRemoteDescription(answer);
  }

  /** Add an ICE candidate from a remote peer. */
  async addIceCandidate(
    remotePeerId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const pc = this._connections.get(remotePeerId);
    if (!pc) return;
    await pc.addIceCandidate(candidate);
  }

  async send(payload: CollabPayload): Promise<void> {
    const json = JSON.stringify(payload);
    for (const dc of this._channels.values()) {
      if (dc.readyState === 'open') {
        dc.send(json);
      }
    }
  }

  onMessage(handler: CollabEventHandler): () => void {
    this._handlers.add(handler);
    return () => { this._handlers.delete(handler); };
  }

  async leave(): Promise<void> {
    await this.send({ type: 'peer_leave', peerId: this.peerId, data: { leftAt: Date.now() } });
    for (const dc of this._channels.values()) dc.close();
    for (const pc of this._connections.values()) pc.close();
    this._channels.clear();
    this._connections.clear();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private _setupDataChannel(dc: RTCDataChannel, remotePeerId: string): void {
    this._channels.set(remotePeerId, dc);

    dc.onopen = () => {
      this._peers.set(remotePeerId, {
        peerId: remotePeerId,
        joinedAt: Date.now(),
        transport: 'webrtc',
      });
      const joinPayload: CollabPayload = {
        type: 'peer_join',
        peerId: remotePeerId,
        data: { joinedAt: Date.now(), transport: 'webrtc' },
      };
      for (const h of this._handlers) {
        try { h(joinPayload); } catch {}
      }
    };

    dc.onmessage = ({ data }) => {
      try {
        const payload = JSON.parse(String(data)) as CollabPayload;
        for (const h of this._handlers) {
          try { h(payload); } catch {}
        }
      } catch {}
    };

    dc.onclose = () => {
      this._peers.delete(remotePeerId);
      const leavePayload: CollabPayload = {
        type: 'peer_leave',
        peerId: remotePeerId,
        data: { leftAt: Date.now() },
      };
      for (const h of this._handlers) {
        try { h(leavePayload); } catch {}
      }
    };
  }
}

// ─── §38 Hybrid session (auto-select transport) ───────────────────────────────

export interface CollabSessionOptions {
  /** Force a specific transport. Default: auto-select. */
  transport?: CollabTransport;
  /** Supabase client (required when transport='supabase' or auto). */
  supabaseClient?: SupabaseClient;
  /** ICE servers for WebRTC (optional, defaults to Google STUN). */
  iceServers?: RTCIceServer[];
  /** Peer count estimate — >8 forces Supabase transport. */
  expectedPeerCount?: number;
}

/**
 * createCollabSession(channelId, options)
 *
 * §38.2: Auto-selects the best transport:
 *   - WebRTC when RTCPeerConnection is available and expectedPeerCount ≤ 8
 *   - Supabase Realtime otherwise
 *
 * Returns a unified CollabSession interface regardless of transport.
 */
export async function createCollabSession(
  channelId: string,
  options: CollabSessionOptions = {},
): Promise<CollabSession> {
  const { transport, supabaseClient, iceServers, expectedPeerCount = 2 } = options;
  const hasSupabaseClient =
    supabaseClient &&
    typeof (supabaseClient as unknown as { channel?: unknown }).channel === 'function';

  if (transport === 'local') {
    return createLocalCollabSession(channelId);
  }

  if (transport === 'supabase') {
    if (hasSupabaseClient) {
      return createSupabaseCollabSession(channelId, supabaseClient);
    }
    return createLocalCollabSession(channelId);
  }

  if (!transport && hasSupabaseClient) {
    return createSupabaseCollabSession(channelId, supabaseClient);
  }

  const useWebRTC =
    transport === 'webrtc' &&
    typeof RTCPeerConnection !== 'undefined' &&
    expectedPeerCount <= 8;

  if (useWebRTC) {
    const peerId = generatePeerId();
    return new WebRTCCollabSession(channelId, peerId, iceServers);
  }

  return createLocalCollabSession(channelId);
}

// ─── §38.2 Invite link helpers ────────────────────────────────────────────────

/**
 * generateInviteLink(baseUrl, channelId)
 *
 * §38.2: Generates the invite URL for "Launch Shared Dream".
 * The recipient opens the link → auto-joins the collaborative session.
 */
export function generateInviteLink(baseUrl: string, channelId: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('shared-dream', channelId);
  return url.toString();
}

/**
 * parseInviteLink(url)
 *
 * Extracts a channelId from a dream invite URL.
 * Returns null if no invite parameter is present.
 */
export function parseInviteLink(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('shared-dream');
  } catch {
    return null;
  }
}

// ─── §38 Cursor / edit / playhead broadcast helpers ──────────────────────────

/** Broadcast cursor position to all session peers. */
export function broadcastCursor(session: CollabSession, x: number, y: number): Promise<void> {
  return session.send({ type: 'cursor', peerId: session.peerId, data: { x, y } });
}

/** Broadcast an edit operation to all session peers. */
export function broadcastEdit(session: CollabSession, edit: unknown): Promise<void> {
  return session.send({ type: 'edit', peerId: session.peerId, data: edit });
}

/** Broadcast playhead position (e.g., for audio/video sync). */
export function broadcastPlayhead(session: CollabSession, positionSec: number): Promise<void> {
  return session.send({ type: 'playhead', peerId: session.peerId, data: { positionSec } });
}
