/**
 * lib/collaboration/index.ts — §38 Shared Dream Collaboration
 *
 * Canonical JAMM-N web session model for DREAMengin.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type CollabTransport = 'supabase' | 'webrtc' | 'local';

export type SessionRole =
  | 'host'
  | 'controller'
  | 'participant'
  | 'listener'
  | 'observer';

export type CollabMode =
  | 'shared_dream'
  | 'jammn_media_sync'
  | 'jammn_data_share'
  | 'classroom'
  | 'guided_experience'
  | 'collaborative_editor';

export type CollabEventType =
  // canonical families
  | 'peer_join'
  | 'peer_leave'
  | 'presence_update'
  | 'cursor'
  | 'edit'
  | 'state_patch'
  | 'media_sync'
  | 'data_packet'
  | 'control_signal'
  | 'mode_change'
  // backward-compatible
  | 'playhead'
  | 'audio_offer'
  | 'audio_answer'
  | 'ice_candidate'
  | 'custom';

export interface PresenceUpdateData {
  status?: 'active' | 'idle' | 'away';
  role?: SessionRole;
  mode?: CollabMode;
  profile?: Record<string, unknown>;
}

export interface MediaSyncData {
  command: 'play' | 'pause' | 'seek' | 'buffer' | 'stop' | string;
  timeRefSec?: number;
  payload?: Record<string, unknown>;
}

export interface CollabPayload<T = unknown> {
  type: CollabEventType;
  peerId: string;
  data: T;
  messageId?: string;
  timestamp?: number;
  channelId?: string;
  sessionId?: string;
  role?: SessionRole;
  mode?: CollabMode;
  sequence?: number;
  transport?: CollabTransport;
}

export type CollabOutboundPayload<T = unknown> =
  Pick<CollabPayload<T>, 'type' | 'peerId' | 'data'> &
  Partial<Omit<CollabPayload<T>, 'type' | 'peerId' | 'data'>>;

export type CollabEventHandler = (payload: CollabPayload) => void;

export interface PeerInfo {
  peerId: string;
  joinedAt: number;
  transport: CollabTransport;
  role: SessionRole;
  mode: CollabMode;
  lastSeenAt: number;
  sequence: number;
  presence?: PresenceUpdateData;
}

export interface CollabModeRuleSet {
  mode: CollabMode;
  constraints: {
    allowedEventTypes: readonly CollabEventType[];
    maxPeers: number;
  };
  permissions: Partial<Record<SessionRole, readonly CollabEventType[]>>;
  transformations?: Partial<Record<CollabEventType, (payload: CollabPayload) => CollabPayload>>;
  parameters?: Readonly<Record<string, unknown>>;
}

const ALL_EVENTS: readonly CollabEventType[] = [
  'peer_join',
  'peer_leave',
  'presence_update',
  'cursor',
  'edit',
  'state_patch',
  'media_sync',
  'data_packet',
  'control_signal',
  'mode_change',
  'playhead',
  'audio_offer',
  'audio_answer',
  'ice_candidate',
  'custom',
];

const BROADCAST_EVENTS: readonly CollabEventType[] = [
  'peer_join',
  'peer_leave',
  'presence_update',
  'cursor',
  'edit',
  'state_patch',
  'media_sync',
  'data_packet',
  'control_signal',
  'mode_change',
  'playhead',
  'custom',
];

const PASSIVE_EVENTS: readonly CollabEventType[] = [
  'peer_join',
  'peer_leave',
  'presence_update',
  'cursor',
  'data_packet',
  'media_sync',
  'playhead',
  'custom',
];

export const DEFAULT_MODE_RULESETS: Record<CollabMode, CollabModeRuleSet> = {
  shared_dream: {
    mode: 'shared_dream',
    constraints: { allowedEventTypes: ALL_EVENTS, maxPeers: 40 },
    permissions: {
      host: ALL_EVENTS,
      controller: BROADCAST_EVENTS,
      participant: BROADCAST_EVENTS,
      listener: PASSIVE_EVENTS,
      observer: ['peer_join', 'peer_leave', 'presence_update', 'cursor', 'custom'],
    },
    parameters: { syncCadenceMs: 50 },
  },
  jammn_media_sync: {
    mode: 'jammn_media_sync',
    constraints: {
      allowedEventTypes: [
        'peer_join',
        'peer_leave',
        'presence_update',
        'media_sync',
        'control_signal',
        'mode_change',
        'playhead',
        'custom',
      ],
      maxPeers: 60,
    },
    permissions: {
      host: ALL_EVENTS,
      controller: ['peer_join', 'peer_leave', 'presence_update', 'media_sync', 'control_signal', 'mode_change', 'playhead', 'custom'],
      participant: ['peer_join', 'peer_leave', 'presence_update', 'media_sync', 'playhead', 'custom'],
      listener: ['peer_join', 'peer_leave', 'presence_update', 'media_sync', 'playhead', 'custom'],
      observer: ['peer_join', 'peer_leave', 'presence_update', 'custom'],
    },
    parameters: { clockToleranceMs: 100 },
  },
  jammn_data_share: {
    mode: 'jammn_data_share',
    constraints: {
      allowedEventTypes: [
        'peer_join',
        'peer_leave',
        'presence_update',
        'state_patch',
        'data_packet',
        'control_signal',
        'mode_change',
        'custom',
      ],
      maxPeers: 50,
    },
    permissions: {
      host: ALL_EVENTS,
      controller: ['peer_join', 'peer_leave', 'presence_update', 'state_patch', 'data_packet', 'control_signal', 'mode_change', 'custom'],
      participant: ['peer_join', 'peer_leave', 'presence_update', 'state_patch', 'data_packet', 'custom'],
      listener: ['peer_join', 'peer_leave', 'presence_update', 'data_packet', 'custom'],
      observer: ['peer_join', 'peer_leave', 'presence_update', 'custom'],
    },
    parameters: { patchMerge: 'last_write_wins' },
  },
  classroom: {
    mode: 'classroom',
    constraints: { allowedEventTypes: ALL_EVENTS, maxPeers: 80 },
    permissions: {
      host: ALL_EVENTS,
      controller: BROADCAST_EVENTS,
      participant: ['peer_join', 'peer_leave', 'presence_update', 'cursor', 'edit', 'state_patch', 'custom'],
      listener: ['peer_join', 'peer_leave', 'presence_update', 'cursor', 'custom'],
      observer: ['peer_join', 'peer_leave', 'presence_update', 'custom'],
    },
    parameters: { moderated: true },
  },
  guided_experience: {
    mode: 'guided_experience',
    constraints: {
      allowedEventTypes: [
        'peer_join',
        'peer_leave',
        'presence_update',
        'cursor',
        'media_sync',
        'control_signal',
        'mode_change',
        'custom',
      ],
      maxPeers: 40,
    },
    permissions: {
      host: ALL_EVENTS,
      controller: ['peer_join', 'peer_leave', 'presence_update', 'cursor', 'media_sync', 'control_signal', 'mode_change', 'custom'],
      participant: ['peer_join', 'peer_leave', 'presence_update', 'cursor', 'custom'],
      listener: ['peer_join', 'peer_leave', 'presence_update', 'custom'],
      observer: ['peer_join', 'peer_leave', 'presence_update', 'custom'],
    },
    parameters: { followHostTimeline: true },
  },
  collaborative_editor: {
    mode: 'collaborative_editor',
    constraints: {
      allowedEventTypes: [
        'peer_join',
        'peer_leave',
        'presence_update',
        'cursor',
        'edit',
        'state_patch',
        'data_packet',
        'control_signal',
        'mode_change',
        'custom',
      ],
      maxPeers: 24,
    },
    permissions: {
      host: ALL_EVENTS,
      controller: ['peer_join', 'peer_leave', 'presence_update', 'cursor', 'edit', 'state_patch', 'data_packet', 'control_signal', 'mode_change', 'custom'],
      participant: ['peer_join', 'peer_leave', 'presence_update', 'cursor', 'edit', 'state_patch', 'data_packet', 'custom'],
      listener: ['peer_join', 'peer_leave', 'presence_update', 'cursor', 'data_packet', 'custom'],
      observer: ['peer_join', 'peer_leave', 'presence_update', 'custom'],
    },
    parameters: { merge: 'ot-lite' },
  },
};

function resolveModeRuleSet(mode: CollabMode, override?: Partial<CollabModeRuleSet>): CollabModeRuleSet {
  const base = DEFAULT_MODE_RULESETS[mode];
  if (!override) return base;
  return {
    mode,
    constraints: {
      allowedEventTypes: override.constraints?.allowedEventTypes ?? base.constraints.allowedEventTypes,
      maxPeers: override.constraints?.maxPeers ?? base.constraints.maxPeers,
    },
    permissions: { ...base.permissions, ...(override.permissions ?? {}) },
    transformations: { ...(base.transformations ?? {}), ...(override.transformations ?? {}) },
    parameters: { ...(base.parameters ?? {}), ...(override.parameters ?? {}) },
  };
}

function generatePeerId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function generateMessageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `msg-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function nowMs(): number {
  return Date.now();
}

function normalizePayload(payload: CollabOutboundPayload | CollabPayload, context: {
  channelId: string;
  peerId: string;
  role: SessionRole;
  mode: CollabMode;
  transport: CollabTransport;
  sequence: number;
}): CollabPayload {
  return {
    type: payload.type,
    peerId: payload.peerId ?? context.peerId,
    data: payload.data,
    messageId: payload.messageId ?? generateMessageId(),
    timestamp: payload.timestamp ?? nowMs(),
    channelId: payload.channelId ?? context.channelId,
    sessionId: payload.sessionId ?? context.channelId,
    role: payload.role ?? context.role,
    mode: payload.mode ?? context.mode,
    sequence: payload.sequence ?? context.sequence,
    transport: payload.transport ?? context.transport,
  };
}

function canSendPayload(payload: CollabPayload, role: SessionRole, peerCount: number, rules: CollabModeRuleSet): { allowed: boolean; reason?: string } {
  if (!rules.constraints.allowedEventTypes.includes(payload.type)) {
    return { allowed: false, reason: `event ${payload.type} is not enabled for mode ${rules.mode}` };
  }
  const allowedForRole = rules.permissions[role];
  if (allowedForRole && !allowedForRole.includes(payload.type)) {
    return { allowed: false, reason: `role ${role} cannot emit ${payload.type} in mode ${rules.mode}` };
  }
  if (payload.type === 'peer_join' && peerCount >= rules.constraints.maxPeers) {
    return { allowed: false, reason: `maxPeers ${rules.constraints.maxPeers} reached for mode ${rules.mode}` };
  }
  return { allowed: true };
}

function applyIncomingPeerState(peers: Map<string, PeerInfo>, payload: CollabPayload): void {
  if (payload.type === 'peer_leave') {
    peers.delete(payload.peerId);
    return;
  }

  const previous = peers.get(payload.peerId);
  const joinedAtFromJoinPayload =
    payload.type === 'peer_join'
      ? (payload.data as { joinedAt?: number } | undefined)?.joinedAt
      : undefined;

  const next: PeerInfo = {
    peerId: payload.peerId,
    joinedAt: joinedAtFromJoinPayload ?? previous?.joinedAt ?? payload.timestamp ?? nowMs(),
    transport: payload.transport ?? previous?.transport ?? 'local',
    role: payload.role ?? previous?.role ?? 'participant',
    mode: payload.mode ?? previous?.mode ?? 'shared_dream',
    lastSeenAt: payload.timestamp ?? nowMs(),
    sequence: payload.sequence ?? previous?.sequence ?? 0,
    presence: previous?.presence,
  };

  if (payload.type === 'presence_update') {
    const patch = payload.data as PresenceUpdateData;
    next.presence = { ...(previous?.presence ?? {}), ...patch };
    if (patch.role) next.role = patch.role;
    if (patch.mode) next.mode = patch.mode;
  }

  if (payload.type === 'mode_change') {
    const mode = (payload.data as { mode?: CollabMode } | undefined)?.mode;
    if (mode) next.mode = mode;
  }

  peers.set(payload.peerId, next);
}

export interface CollabSession {
  channelId: string;
  peerId: string;
  transport: CollabTransport;
  role: SessionRole;
  readonly mode: CollabMode;
  readonly modeRuleSet: CollabModeRuleSet;
  readonly peers: readonly PeerInfo[];
  send(payload: CollabOutboundPayload): Promise<void>;
  onMessage(handler: CollabEventHandler): () => void;
  leave(): Promise<void>;
  setMode(mode: CollabMode, changedByRole?: SessionRole): Promise<void>;
  updatePresence(presence: PresenceUpdateData): Promise<void>;
}

interface LocalCollabBus {
  peers: Map<string, PeerInfo>;
  handlers: Map<string, Set<CollabEventHandler>>;
}

const localBuses = new Map<string, LocalCollabBus>();

function getLocalBus(channelId: string): LocalCollabBus {
  const existing = localBuses.get(channelId);
  if (existing) return existing;
  const created: LocalCollabBus = { peers: new Map(), handlers: new Map() };
  localBuses.set(channelId, created);
  return created;
}

class BaseSession {
  protected _handlers = new Set<CollabEventHandler>();
  protected _sequence = 0;
  protected _mode: CollabMode;
  readonly modeRuleSet: CollabModeRuleSet;
  constructor(
    readonly channelId: string,
    readonly peerId: string,
    readonly transport: CollabTransport,
    readonly role: SessionRole,
    mode: CollabMode,
    modeRuleSet?: Partial<CollabModeRuleSet>,
  ) {
    this._mode = mode;
    this.modeRuleSet = resolveModeRuleSet(mode, modeRuleSet);
  }
  get mode(): CollabMode {
    return this._mode;
  }
  onMessage(handler: CollabEventHandler): () => void {
    this._handlers.add(handler);
    return () => this._handlers.delete(handler);
  }
  protected makePayload(payload: CollabOutboundPayload): CollabPayload {
    this._sequence += 1;
    return normalizePayload(payload, {
      channelId: this.channelId,
      peerId: this.peerId,
      role: this.role,
      mode: this._mode,
      transport: this.transport,
      sequence: this._sequence,
    });
  }
}

class LocalCollabSession extends BaseSession implements CollabSession {
  private readonly _bus: LocalCollabBus;
  constructor(channelId: string, peerId: string, role: SessionRole, mode: CollabMode, modeRuleSet?: Partial<CollabModeRuleSet>) {
    super(channelId, peerId, 'local', role, mode, modeRuleSet);
    this._bus = getLocalBus(channelId);
    this._bus.handlers.set(peerId, this._handlers);
    this._bus.peers.set(peerId, {
      peerId,
      joinedAt: nowMs(),
      transport: 'local',
      role,
      mode,
      lastSeenAt: nowMs(),
      sequence: 0,
    });
    void this.send({ type: 'peer_join', peerId, data: { joinedAt: nowMs(), role, mode, transport: 'local' } });
  }
  get peers(): readonly PeerInfo[] {
    return Array.from(this._bus.peers.values());
  }
  get mode(): CollabMode {
    return this._bus.peers.get(this.peerId)?.mode ?? this._mode;
  }
  async send(payload: CollabOutboundPayload): Promise<void> {
    let canonical = this.makePayload(payload);
    const permission = canSendPayload(canonical, this.role, this.peers.length, this.modeRuleSet);
    if (!permission.allowed) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[collaboration] dropped ${canonical.type}: ${permission.reason ?? 'blocked by rules'}`);
      }
      return;
    }
    canonical = this.modeRuleSet.transformations?.[canonical.type]?.(canonical) ?? canonical;
    applyIncomingPeerState(this._bus.peers, canonical);
    if (canonical.type === 'mode_change') {
      const mode = (canonical.data as { mode?: CollabMode } | undefined)?.mode;
      if (mode) {
        this._mode = mode;
        for (const peer of this._bus.peers.values()) {
          peer.mode = mode;
          this._bus.peers.set(peer.peerId, peer);
        }
      }
    }
    for (const handlers of this._bus.handlers.values()) {
      for (const handler of handlers) {
        try { handler(canonical); } catch {}
      }
    }
  }
  async setMode(mode: CollabMode, changedByRole: SessionRole = this.role): Promise<void> {
    await this.send({ type: 'mode_change', peerId: this.peerId, data: { mode, changedByRole }, mode });
  }
  async updatePresence(presence: PresenceUpdateData): Promise<void> {
    await this.send({ type: 'presence_update', peerId: this.peerId, data: { ...presence, role: presence.role ?? this.role, mode: presence.mode ?? this._mode } });
  }
  async leave(): Promise<void> {
    await this.send({ type: 'peer_leave', peerId: this.peerId, data: { leftAt: nowMs() } });
    this._handlers.clear();
    this._bus.handlers.delete(this.peerId);
    this._bus.peers.delete(this.peerId);
    if (this._bus.handlers.size === 0) localBuses.delete(this.channelId);
  }
}

class SupabaseCollabSession extends BaseSession implements CollabSession {
  private readonly _peers = new Map<string, PeerInfo>();
  constructor(
    channelId: string,
    peerId: string,
    private readonly _channel: import('@supabase/supabase-js').RealtimeChannel,
    role: SessionRole,
    mode: CollabMode,
    modeRuleSet?: Partial<CollabModeRuleSet>,
  ) {
    super(channelId, peerId, 'supabase', role, mode, modeRuleSet);
    this._peers.set(peerId, {
      peerId,
      joinedAt: nowMs(),
      transport: 'supabase',
      role,
      mode,
      lastSeenAt: nowMs(),
      sequence: 0,
    });
    _channel.on('broadcast', { event: 'collab' }, ({ payload }) => {
      const canonical = normalizePayload(payload as CollabPayload, {
        channelId: this.channelId,
        peerId: this.peerId,
        role: this.role,
        mode: this._mode,
        transport: this.transport,
        sequence: this._sequence,
      });
      applyIncomingPeerState(this._peers, canonical);
      if (canonical.type === 'mode_change') {
        const modeValue = (canonical.data as { mode?: CollabMode } | undefined)?.mode;
        if (modeValue) this._mode = modeValue;
      }
      for (const handler of this._handlers) {
        try { handler(canonical); } catch {}
      }
    });
  }
  get peers(): readonly PeerInfo[] {
    return Array.from(this._peers.values());
  }
  async send(payload: CollabOutboundPayload): Promise<void> {
    let canonical = this.makePayload(payload);
    const permission = canSendPayload(canonical, this.role, this.peers.length, this.modeRuleSet);
    if (!permission.allowed) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[collaboration] dropped ${canonical.type}: ${permission.reason ?? 'blocked by rules'}`);
      }
      return;
    }
    canonical = this.modeRuleSet.transformations?.[canonical.type]?.(canonical) ?? canonical;
    applyIncomingPeerState(this._peers, canonical);
    if (canonical.type === 'mode_change') {
      const modeValue = (canonical.data as { mode?: CollabMode } | undefined)?.mode;
      if (modeValue) this._mode = modeValue;
    }
    await this._channel.send({ type: 'broadcast', event: 'collab', payload: canonical });
  }
  async setMode(mode: CollabMode, changedByRole: SessionRole = this.role): Promise<void> {
    await this.send({ type: 'mode_change', peerId: this.peerId, data: { mode, changedByRole }, mode });
  }
  async updatePresence(presence: PresenceUpdateData): Promise<void> {
    await this.send({ type: 'presence_update', peerId: this.peerId, data: { ...presence, role: presence.role ?? this.role, mode: presence.mode ?? this._mode } });
  }
  async leave(): Promise<void> {
    await this.send({ type: 'peer_leave', peerId: this.peerId, data: { leftAt: nowMs() } });
    await this._channel.unsubscribe();
  }
}

export class WebRTCCollabSession extends BaseSession implements CollabSession {
  private readonly _peers = new Map<string, PeerInfo>();
  private readonly _channels = new Map<string, RTCDataChannel>();
  private readonly _connections = new Map<string, RTCPeerConnection>();
  private readonly _iceServers: RTCIceServer[];
  constructor(
    channelId: string,
    peerId: string,
    iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }],
    options: Required<Pick<CollabSessionOptions, 'role' | 'mode'>> & { modeRuleSet?: Partial<CollabModeRuleSet> } = { role: 'participant', mode: 'shared_dream' },
  ) {
    super(channelId, peerId, 'webrtc', options.role, options.mode, options.modeRuleSet);
    this._iceServers = iceServers;
    this._peers.set(peerId, { peerId, joinedAt: nowMs(), transport: 'webrtc', role: options.role, mode: options.mode, lastSeenAt: nowMs(), sequence: 0 });
  }
  get peers(): readonly PeerInfo[] {
    return Array.from(this._peers.values());
  }
  async createOffer(remotePeerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = new RTCPeerConnection({ iceServers: this._iceServers });
    const dc = pc.createDataChannel('collab', { ordered: false });
    this._setupDataChannel(dc, remotePeerId);
    this._connections.set(remotePeerId, pc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }
  async acceptOffer(remotePeerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = new RTCPeerConnection({ iceServers: this._iceServers });
    this._connections.set(remotePeerId, pc);
    pc.ondatachannel = ({ channel }) => this._setupDataChannel(channel, remotePeerId);
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }
  async applyAnswer(remotePeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this._connections.get(remotePeerId);
    if (!pc) throw new Error(`No connection for peer ${remotePeerId}`);
    await pc.setRemoteDescription(answer);
  }
  async addIceCandidate(remotePeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this._connections.get(remotePeerId);
    if (!pc) return;
    await pc.addIceCandidate(candidate);
  }
  async send(payload: CollabOutboundPayload): Promise<void> {
    let canonical = this.makePayload(payload);
    const permission = canSendPayload(canonical, this.role, this.peers.length, this.modeRuleSet);
    if (!permission.allowed) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[collaboration] dropped ${canonical.type}: ${permission.reason ?? 'blocked by rules'}`);
      }
      return;
    }
    canonical = this.modeRuleSet.transformations?.[canonical.type]?.(canonical) ?? canonical;
    applyIncomingPeerState(this._peers, canonical);
    if (canonical.type === 'mode_change') {
      const modeValue = (canonical.data as { mode?: CollabMode } | undefined)?.mode;
      if (modeValue) this._mode = modeValue;
    }
    const json = JSON.stringify(canonical);
    for (const channel of this._channels.values()) {
      if (channel.readyState === 'open') channel.send(json);
    }
    for (const handler of this._handlers) {
      try { handler(canonical); } catch {}
    }
  }
  async setMode(mode: CollabMode, changedByRole: SessionRole = this.role): Promise<void> {
    await this.send({ type: 'mode_change', peerId: this.peerId, data: { mode, changedByRole }, mode });
  }
  async updatePresence(presence: PresenceUpdateData): Promise<void> {
    await this.send({ type: 'presence_update', peerId: this.peerId, data: { ...presence, role: presence.role ?? this.role, mode: presence.mode ?? this._mode } });
  }
  async leave(): Promise<void> {
    await this.send({ type: 'peer_leave', peerId: this.peerId, data: { leftAt: nowMs() } });
    for (const dc of this._channels.values()) dc.close();
    for (const pc of this._connections.values()) pc.close();
    this._channels.clear();
    this._connections.clear();
  }
  private _setupDataChannel(dc: RTCDataChannel, remotePeerId: string): void {
    this._channels.set(remotePeerId, dc);
    dc.onopen = () => {
      const payload = normalizePayload({ type: 'peer_join', peerId: remotePeerId, data: { joinedAt: nowMs(), transport: 'webrtc' }, transport: 'webrtc' }, {
        channelId: this.channelId,
        peerId: this.peerId,
        role: this.role,
        mode: this._mode,
        transport: this.transport,
        sequence: this._sequence,
      });
      applyIncomingPeerState(this._peers, payload);
      for (const h of this._handlers) { try { h(payload); } catch {} }
    };
    dc.onmessage = ({ data }) => {
      try {
        const payload = normalizePayload(JSON.parse(String(data)) as CollabPayload, {
          channelId: this.channelId,
          peerId: this.peerId,
          role: this.role,
          mode: this._mode,
          transport: this.transport,
          sequence: this._sequence,
        });
        applyIncomingPeerState(this._peers, payload);
        if (payload.type === 'mode_change') {
          const modeValue = (payload.data as { mode?: CollabMode } | undefined)?.mode;
          if (modeValue) this._mode = modeValue;
        }
        for (const h of this._handlers) { try { h(payload); } catch {} }
      } catch {}
    };
    dc.onclose = () => {
      const payload = normalizePayload({ type: 'peer_leave', peerId: remotePeerId, data: { leftAt: nowMs() }, transport: 'webrtc' }, {
        channelId: this.channelId,
        peerId: this.peerId,
        role: this.role,
        mode: this._mode,
        transport: this.transport,
        sequence: this._sequence,
      });
      applyIncomingPeerState(this._peers, payload);
      for (const h of this._handlers) { try { h(payload); } catch {} }
    };
  }
}

export interface CollabSessionOptions {
  transport?: CollabTransport;
  supabaseClient?: SupabaseClient;
  iceServers?: RTCIceServer[];
  expectedPeerCount?: number;
  role?: SessionRole;
  mode?: CollabMode;
  modeRuleSet?: Partial<CollabModeRuleSet>;
}

export function createLocalCollabSession(channelId: string, options: Required<Pick<CollabSessionOptions, 'role' | 'mode'>> & { modeRuleSet?: Partial<CollabModeRuleSet> } = { role: 'participant', mode: 'shared_dream' }): CollabSession {
  return new LocalCollabSession(channelId, generatePeerId(), options.role, options.mode, options.modeRuleSet);
}

export async function createSupabaseCollabSession(
  channelId: string,
  supabaseClient: SupabaseClient,
  handlers: CollabEventHandler[] = [],
  options: Required<Pick<CollabSessionOptions, 'role' | 'mode'>> & { modeRuleSet?: Partial<CollabModeRuleSet> } = { role: 'participant', mode: 'shared_dream' },
): Promise<CollabSession> {
  const peerId = generatePeerId();
  const channel = supabaseClient.channel(`dream:collab:${channelId}`, { config: { broadcast: { self: false } } });
  const session = new SupabaseCollabSession(channelId, peerId, channel, options.role, options.mode, options.modeRuleSet);
  for (const handler of handlers) session.onMessage(handler);
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => { if (status === 'SUBSCRIBED') resolve(); });
  });
  await session.send({ type: 'peer_join', peerId, data: { joinedAt: nowMs(), role: options.role, mode: options.mode, transport: 'supabase' }, role: options.role, mode: options.mode });
  return session;
}

export async function createCollabSession(channelId: string, options: CollabSessionOptions = {}): Promise<CollabSession> {
  const {
    transport,
    supabaseClient,
    iceServers,
    expectedPeerCount = 2,
    role = 'participant',
    mode = 'shared_dream',
    modeRuleSet,
  } = options;
  const hasSupabaseClient = supabaseClient && typeof (supabaseClient as unknown as { channel?: unknown }).channel === 'function';
  if (transport === 'local') return createLocalCollabSession(channelId, { role, mode, modeRuleSet });
  if (transport === 'supabase') {
    if (hasSupabaseClient) return createSupabaseCollabSession(channelId, supabaseClient, [], { role, mode, modeRuleSet });
    return createLocalCollabSession(channelId, { role, mode, modeRuleSet });
  }
  if (!transport && hasSupabaseClient) return createSupabaseCollabSession(channelId, supabaseClient, [], { role, mode, modeRuleSet });
  const useWebRTC = transport === 'webrtc' && typeof RTCPeerConnection !== 'undefined' && expectedPeerCount <= 8;
  if (useWebRTC) return new WebRTCCollabSession(channelId, generatePeerId(), iceServers, { role, mode, modeRuleSet });
  return createLocalCollabSession(channelId, { role, mode, modeRuleSet });
}

export function generateInviteLink(baseUrl: string, channelId: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('shared-dream', channelId);
  return url.toString();
}

export function parseInviteLink(url: string): string | null {
  try {
    return new URL(url).searchParams.get('shared-dream');
  } catch {
    return null;
  }
}

export function broadcastCursor(session: CollabSession, x: number, y: number): Promise<void> {
  return session.send({ type: 'cursor', peerId: session.peerId, data: { x, y } });
}

export function broadcastEdit(session: CollabSession, edit: unknown): Promise<void> {
  return session.send({ type: 'edit', peerId: session.peerId, data: edit });
}

export function broadcastPlayhead(session: CollabSession, positionSec: number): Promise<void> {
  return session.send({ type: 'playhead', peerId: session.peerId, data: { positionSec } });
}

export function broadcastStatePatch(session: CollabSession, patch: unknown): Promise<void> {
  return session.send({ type: 'state_patch', peerId: session.peerId, data: patch });
}

export function broadcastDataPacket(session: CollabSession, packet: unknown): Promise<void> {
  return session.send({ type: 'data_packet', peerId: session.peerId, data: packet });
}

export function broadcastMediaSync(
  session: CollabSession,
  command: MediaSyncData['command'],
  timeRefSec?: number,
  payload?: Record<string, unknown>,
): Promise<void> {
  return session.send({ type: 'media_sync', peerId: session.peerId, data: { command, timeRefSec, payload } satisfies MediaSyncData });
}

export function broadcastControlSignal(
  session: CollabSession,
  signal: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  return session.send({ type: 'control_signal', peerId: session.peerId, data: { signal, ...(payload ?? {}) } });
}

export function broadcastModeChange(session: CollabSession, mode: CollabMode, changedByRole: SessionRole = session.role): Promise<void> {
  return session.setMode(mode, changedByRole);
}

export function broadcastPresenceUpdate(session: CollabSession, presence: PresenceUpdateData): Promise<void> {
  return session.updatePresence(presence);
}
