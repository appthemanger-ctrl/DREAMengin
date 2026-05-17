/**
 * lib/gameengin/cloud-compute.ts
 *
 * NEXT-GEN — Hybrid local + edge compute. Heavy workloads can be routed to
 * trusted edge nodes when local budgets are exceeded, with verification + rollback.
 *
 *  - EdgeOffloadRouter    — Local-vs-edge workload routing (latency/cost SLO)
 *  - RemoteRenderHandoff  — Pixel-streamed remote-render handoff
 *  - ResultVerifier       — Edge result verification + rollback
 */

export interface OffloadDecision {
  destination: 'local' | 'edge';
  reason: string;
  estimatedLatencyMs: number;
}

export interface OffloadCandidate {
  /** Estimated cost on local device, in ms. */
  localCostMs: number;
  /** Estimated round-trip if offloaded, in ms. */
  edgeRoundTripMs: number;
  /** Whether the workload requires fresh per-frame output. */
  realtime: boolean;
}

export interface RouterConfig {
  /** Local frame budget in ms — anything over this prefers edge. */
  localBudgetMs?: number;
  /** Hard ceiling for edge round-trip; never offload above this. */
  maxEdgeLatencyMs?: number;
}

/** Routes workloads between local and edge based on cost/latency thresholds. */
export class EdgeOffloadRouter {
  private readonly localBudget: number;
  private readonly maxEdgeLatency: number;
  private edgeAvailable = true;

  constructor(config: RouterConfig = {}) {
    this.localBudget = Math.max(1, config.localBudgetMs ?? 16);
    this.maxEdgeLatency = Math.max(10, config.maxEdgeLatencyMs ?? 80);
  }

  setEdgeAvailable(available: boolean): void { this.edgeAvailable = available; }

  decide(candidate: OffloadCandidate): OffloadDecision {
    if (!this.edgeAvailable) {
      return { destination: 'local', reason: 'edge_unavailable', estimatedLatencyMs: candidate.localCostMs };
    }
    if (candidate.edgeRoundTripMs > this.maxEdgeLatency) {
      return { destination: 'local', reason: 'edge_too_slow', estimatedLatencyMs: candidate.localCostMs };
    }
    if (candidate.realtime && candidate.edgeRoundTripMs > this.localBudget) {
      return { destination: 'local', reason: 'realtime_local_pref', estimatedLatencyMs: candidate.localCostMs };
    }
    if (candidate.localCostMs > this.localBudget && candidate.edgeRoundTripMs < candidate.localCostMs) {
      return { destination: 'edge', reason: 'local_over_budget', estimatedLatencyMs: candidate.edgeRoundTripMs };
    }
    return { destination: 'local', reason: 'within_budget', estimatedLatencyMs: candidate.localCostMs };
  }
}

// -----------------------------------------------------------------------------

export interface RemoteRenderConfig {
  /** Target bitrate in kbps for the streamed video. */
  bitrateKbps?: number;
  /** Preferred codec; falls back to vp9 / h264 as available. */
  codec?: 'av1' | 'vp9' | 'h264';
}

/**
 * Pixel-streamed remote render handoff. Wraps a WebRTC/WebTransport channel
 * carrying H.264/VP9/AV1 frames + a back-channel for input. SSR-safe: the
 * actual MediaSource / RTCPeerConnection wiring is the caller's responsibility.
 */
export class RemoteRenderHandoff {
  private readonly bitrateKbps: number;
  private readonly codec: 'av1' | 'vp9' | 'h264';
  private active = false;
  private sentInputs = 0;
  private receivedFrames = 0;

  constructor(config: RemoteRenderConfig = {}) {
    this.bitrateKbps = Math.max(500, config.bitrateKbps ?? 8000);
    this.codec = config.codec ?? 'av1';
  }

  begin(): void { this.active = true; }
  end(): void   { this.active = false; }

  /** Caller invokes when a remote-rendered frame arrives. */
  notifyFrame(): void { if (this.active) this.receivedFrames += 1; }

  /** Caller invokes when an input packet is sent to the remote renderer. */
  notifyInput(): void { if (this.active) this.sentInputs += 1; }

  get isActive(): boolean { return this.active; }
  get framesReceived(): number { return this.receivedFrames; }
  get inputsSent(): number { return this.sentInputs; }
  get codecPreference(): 'av1' | 'vp9' | 'h264' { return this.codec; }
  get targetBitrateKbps(): number { return this.bitrateKbps; }
}

// -----------------------------------------------------------------------------

export interface VerificationResult {
  ok: boolean;
  rolled_back: boolean;
  reason?: string;
}

/**
 * Result verifier: takes a deterministic checksum of the inputs, compares
 * against the edge-reported checksum, and rolls back local state to a saved
 * snapshot when the edge result is rejected.
 */
export class ResultVerifier {
  private snapshots = new Map<string, ArrayBuffer>();
  private rollbacks = 0;

  /** Capture a rollback snapshot keyed by `id`. */
  capture(id: string, snapshot: ArrayBuffer): void {
    this.snapshots.set(id, snapshot.slice(0));
  }

  /** Verify an edge result by comparing checksums. Rolls back on mismatch. */
  verify(
    id: string,
    expectedChecksum: number,
    actualChecksum: number,
    apply: (snapshot: ArrayBuffer) => void,
  ): VerificationResult {
    if (expectedChecksum === actualChecksum) {
      this.snapshots.delete(id);
      return { ok: true, rolled_back: false };
    }
    const snap = this.snapshots.get(id);
    if (!snap) return { ok: false, rolled_back: false, reason: 'no_snapshot' };
    apply(snap);
    this.snapshots.delete(id);
    this.rollbacks += 1;
    return { ok: false, rolled_back: true, reason: 'checksum_mismatch' };
  }

  /** FNV-1a 32-bit checksum — stable across runs. */
  static checksum(bytes: Uint8Array): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  get pendingSnapshots(): number { return this.snapshots.size; }
  get rollbackCount(): number { return this.rollbacks; }
}
