// Pure TypeScript — no React. No 'use client' needed.
/**
 * Dual Runtime Bridge — cross-Engin event bus.
 *
 * Allows any Daydream/Engin to publish and subscribe to events
 * from any other Daydream/Engin at runtime.
 *
 * Example: CodeEngin emits 'code:deploy-to-game' → GameEngin receives it
 *          CreateEngin emits 'create:export-asset' → BrandingEngin receives it
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 (Daydream pair system).
 * All six canonical pairs are represented as typed channels.
 * Singleton pattern ensures one bus per runtime context.
 *
 * Privacy note: events must never carry raw user data across Engins without
 * explicit user intent — see docs/AXIOMS.md and docs/ARCHITECTURE.md §5.
 */

// ─── Channel names ────────────────────────────────────────────────────────────

/**
 * All six canonical Daydream/Engin channels.
 * Maps to: docs/ARCHITECTURE.md §1 — Daydream pair system.
 */
export type DualRuntimeChannel =
  | 'music'   // Music Daydream / StarMakerEngin
  | 'games'   // Games Daydream / GameEngin
  | 'lab'     // Lab Daydream   / LabEngin
  | 'code'    // Code Daydream  / CodeEngin
  | 'brand'   // Brand Daydream / BrandingEngin
  | 'create'; // Create Daydream / ContentEngin

/**
 * Shape of all six channels with their event maps.
 */
export interface DualRuntimeChannels {
  music:  MusicChannelEvents;
  games:  GamesChannelEvents;
  lab:    LabChannelEvents;
  code:   CodeChannelEvents;
  brand:  BrandChannelEvents;
  create: CreateChannelEvents;
}

// ─── Per-channel event maps ───────────────────────────────────────────────────

/** Events emitted by Music Daydream / StarMakerEngin */
export interface MusicChannelEvents {
  /** A track was released and is now available to other Engins */
  'music:track-released': { trackId: string; title: string; artistId: string };
  /** BPM changed — useful for syncing visual rhythm in GameEngin etc. */
  'music:bpm-changed': { bpm: number; trackId: string };
  /** A stem was isolated — other Engins can consume it */
  'music:stem-ready': { stemType: 'vocals' | 'drums' | 'bass' | 'other'; url: string };
  /** Upload completed — notify Create/Brand Engins */
  'music:upload-complete': { fileId: string; mimeType: string; durationMs: number };
}

/** Events emitted by Games Daydream / GameEngin */
export interface GamesChannelEvents {
  /** A score was submitted — Brand Daydream may display leaderboard */
  'games:score-submitted': { gameId: string; score: number; userId: string };
  /** Play session started — useful for cross-Engin live presence */
  'games:session-started': { gameId: string; gameTitle: string };
  /** Play session ended */
  'games:session-ended': { gameId: string; durationMs: number; finalScore?: number };
  /** Achievement unlocked — Create Daydream can auto-post */
  'games:achievement-unlocked': { achievementId: string; title: string; gameId: string };
  /** Asset exported from world builder — Brand or Create Engins can use it */
  'games:asset-exported': { assetId: string; assetType: 'sprite' | 'level' | 'audio'; url: string };
}

/** Events emitted by Lab Daydream / LabEngin */
export interface LabChannelEvents {
  /** Experiment result ready — Code Engin may render it */
  'lab:result-ready': { experimentId: string; resultType: string; data: unknown };
  /** Simulation started */
  'lab:simulation-started': { simulationId: string; label: string };
  /** Simulation completed */
  'lab:simulation-complete': { simulationId: string; success: boolean; durationMs: number };
  /** Quantum circuit measured — results available */
  'lab:quantum-measured': { circuitId: string; qubits: number; results: Record<string, number> };
  /** Data exported from lab — Create Engin can publish it */
  'lab:data-exported': { exportId: string; format: 'csv' | 'json' | 'pdf'; url: string };
  /** User triggered a lab script run — LabEngin preview listens to render */
  'lab:run': { language: string; code: string; simId: string };
  /** Lab script output ready — preview panel receives streamed lines */
  'lab:result': { lines: string[]; status: 'done' | 'error' };
}

/** Events emitted by Code Daydream / CodeEngin */
export interface CodeChannelEvents {
  /** A cell was executed — Lab can consume the output */
  'code:cell-executed': { cellId: string; language: string; outputType: 'text' | 'chart' | 'error' };
  /** Deployment triggered — Brand Engin can show live status */
  'code:deploy-to-game': { projectId: string; targetEnv: string; commitSha: string };
  /** Build succeeded */
  'code:build-success': { projectId: string; buildId: string; durationMs: number };
  /** Build failed */
  'code:build-failed': { projectId: string; buildId: string; error: string };
  /** Notebook exported — Create Engin can publish it */
  'code:notebook-exported': { notebookId: string; format: 'html' | 'pdf' | 'ipynb'; url: string };
  /** User triggered a code run — CodeEngin preview listens to render */
  'code:run': { language: string; code: string; engine: string };
  /** Code execution output ready — preview panel receives streamed lines */
  'code:output': { lines: string[]; status: 'done' | 'error' };
}

/** Events emitted by Brand Daydream / BrandingEngin */
export interface BrandChannelEvents {
  /** Campaign launched */
  'brand:campaign-launched': { campaignId: string; title: string; targetAudience: string };
  /** Campaign paused */
  'brand:campaign-paused': { campaignId: string; reason?: string };
  /** Brand asset updated — other Engins should refresh */
  'brand:asset-updated': { assetType: 'logo' | 'color-palette' | 'font' | 'banner'; assetId: string };
  /** Analytics snapshot ready — Create Engin can include in reports */
  'brand:analytics-snapshot': { snapshotId: string; period: string; impressions: number; engagement: number };
  /** Audience segment created */
  'brand:segment-created': { segmentId: string; name: string; size: number };
}

/** Events emitted by Create Daydream / ContentEngin */
export interface CreateChannelEvents {
  /** Draft saved */
  'create:draft-saved': { draftId: string; contentType: 'video' | 'image' | 'audio' | 'text'; title: string };
  /** Content published */
  'create:published': { contentId: string; platform: string; url?: string };
  /** Asset exported — Brand or Games Engins can use it */
  'create:export-asset': { assetId: string; assetType: string; url: string };
  /** Publish queue updated */
  'create:queue-updated': { queueLength: number; nextScheduledAt?: string };
  /** Calendar event scheduled */
  'create:calendar-event': { eventId: string; scheduledAt: string; contentType: string };
}

// ─── Typed event lookup helpers ───────────────────────────────────────────────

/** Union of all event keys for a given channel */
export type ChannelEventKey<C extends DualRuntimeChannel> =
  keyof DualRuntimeChannels[C] & string;

/** Payload type for a given channel + event key */
export type ChannelEventPayload<
  C extends DualRuntimeChannel,
  K extends ChannelEventKey<C>
> = DualRuntimeChannels[C][K];

// ─── Handler types ────────────────────────────────────────────────────────────

export type BridgeEventHandler<P = unknown> = (payload: P) => void;

export type UnsubscribeFn = () => void;

// ─── Peer activity tracking ───────────────────────────────────────────────────

/** Represents the activity state of a single channel/Engin */
export interface PeerState {
  channel: DualRuntimeChannel;
  /** Number of active subscribers on this channel */
  subscriberCount: number;
  /** Timestamp (ms) of the last event emitted on this channel */
  lastActivityAt: number | null;
}

// ─── Singleton event bus ──────────────────────────────────────────────────────

/**
 * Internal listener registry.
 * Shape: Map<channel, Map<event, Set<handler>>>
 */
type ListenerMap = Map<string, Map<string, Set<BridgeEventHandler>>>;

/**
 * DualRuntimeBridge — singleton cross-Engin event bus.
 *
 * Use the exported `bridge` singleton directly, or access it via
 * `useDualRuntime(channel)` hook in React components.
 */
class DualRuntimeBridgeImpl {
  private readonly listeners: ListenerMap = new Map();
  private readonly peerActivity: Map<DualRuntimeChannel, PeerState>;

  constructor() {
    const channels: DualRuntimeChannel[] = [
      'music', 'games', 'lab', 'code', 'brand', 'create',
    ];
    this.peerActivity = new Map(
      channels.map((ch) => [
        ch,
        { channel: ch, subscriberCount: 0, lastActivityAt: null },
      ]),
    );
  }

  /**
   * Emit an event on a channel.
   *
   * @param channel  - One of the 6 canonical Daydream/Engin channels
   * @param event    - Typed event key for that channel
   * @param payload  - Typed payload for that event
   *
   * @example
   * bridge.emit('music', 'music:bpm-changed', { bpm: 128, trackId: 'abc' });
   */
  emit<
    C extends DualRuntimeChannel,
    K extends ChannelEventKey<C>
  >(
    channel: C,
    event: K,
    payload: ChannelEventPayload<C, K>,
  ): void {
    // Update peer activity
    const peer = this.peerActivity.get(channel);
    if (peer) {
      peer.lastActivityAt = Date.now();
    }

    const channelListeners = this.listeners.get(channel);
    if (!channelListeners) return;

    const handlers = channelListeners.get(event as string);
    if (!handlers || handlers.size === 0) return;

    // Call all handlers (safe iterate with snapshot to avoid mutation issues)
    const snapshot = Array.from(handlers);
    for (const handler of snapshot) {
      try {
        handler(payload as unknown);
      } catch (err) {
        // Isolate handler errors so one bad subscriber cannot break others
        console.error(
          `[DualRuntimeBridge] Handler error on ${channel}:${String(event)}`,
          err,
        );
      }
    }
  }

  /**
   * Subscribe to an event on a channel.
   *
   * @returns An unsubscribe function — call it in cleanup (e.g. useEffect return).
   *
   * @example
   * const unsub = bridge.subscribe('games', 'games:score-submitted', (payload) => {
   *   console.log('New score:', payload.score);
   * });
   * // later:
   * unsub();
   */
  subscribe<
    C extends DualRuntimeChannel,
    K extends ChannelEventKey<C>
  >(
    channel: C,
    event: K,
    handler: BridgeEventHandler<ChannelEventPayload<C, K>>,
  ): UnsubscribeFn {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Map());
    }
    const channelListeners = this.listeners.get(channel)!;

    if (!channelListeners.has(event as string)) {
      channelListeners.set(event as string, new Set());
    }
    const handlers = channelListeners.get(event as string)!;

    // Cast: internal storage is BridgeEventHandler<unknown>
    const castHandler = handler as BridgeEventHandler;
    handlers.add(castHandler);

    // Track subscriber count for peer activity
    const peer = this.peerActivity.get(channel);
    if (peer) {
      peer.subscriberCount += 1;
    }

    // Return unsubscribe
    return () => {
      handlers.delete(castHandler);
      const peerOnUnsub = this.peerActivity.get(channel);
      if (peerOnUnsub) {
        peerOnUnsub.subscriberCount = Math.max(0, peerOnUnsub.subscriberCount - 1);
      }
    };
  }

  /**
   * Get the current peer activity states for all six channels.
   * Useful for showing which Engins are "live" in the UI.
   */
  getPeers(): readonly PeerState[] {
    return Array.from(this.peerActivity.values());
  }

  /**
   * Get the peer state for a single channel.
   */
  getPeer(channel: DualRuntimeChannel): PeerState | undefined {
    return this.peerActivity.get(channel);
  }

  /**
   * Remove all listeners for a given channel.
   * Use only for full teardown/testing.
   */
  clearChannel(channel: DualRuntimeChannel): void {
    this.listeners.delete(channel);
    const peer = this.peerActivity.get(channel);
    if (peer) {
      peer.subscriberCount = 0;
    }
  }

  /**
   * Remove all listeners from all channels.
   * Use only for full teardown/testing.
   */
  clearAll(): void {
    this.listeners.clear();
    for (const peer of this.peerActivity.values()) {
      peer.subscriberCount = 0;
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

/**
 * The singleton Dual Runtime Bridge instance.
 *
 * Import and use this directly in server-safe modules or Engin logic.
 * In React components, prefer `useDualRuntime(channel)` hook instead.
 *
 * @example
 * import { bridge } from '@/lib/runtime/dualRuntimeBridge';
 *
 * // Emit from ContentEngin:
 * bridge.emit('create', 'create:published', { contentId: 'xyz', platform: 'instagram' });
 *
 * // Subscribe in BrandingEngin:
 * const unsub = bridge.subscribe('create', 'create:published', ({ contentId }) => {
 *   refreshBrandAnalytics(contentId);
 * });
 */
export const bridge = new DualRuntimeBridgeImpl();

// ─── Re-export class type for advanced usage ──────────────────────────────────

export type DualRuntimeBridge = InstanceType<typeof DualRuntimeBridgeImpl>;
