/**
 * lib/gameengin/world-crdt.ts
 *
 * NEXT-GEN — Persistent, eventually-consistent shared world state via CRDTs
 * over WebTransport.
 *
 *  - WorldStateCRDT             — LWW-element-set CRDT for world entities
 *  - EventualConsistencyBridge  — WebTransport-style transport bridge with
 *                                  backpressure-safe partial replicas.
 */

export interface CRDTRecord<T> {
  id: string;
  value: T;
  /** Hybrid logical clock: (wall-clock ms, replica id, counter). */
  ts: { wallMs: number; replica: string; ctr: number };
  tombstone: boolean;
}

/**
 * Last-Writer-Wins element set CRDT, keyed by record id. Compares hybrid
 * logical timestamps to deterministically resolve concurrent writes.
 */
export class WorldStateCRDT<T> {
  private readonly replica: string;
  private counter = 0;
  private records = new Map<string, CRDTRecord<T>>();

  constructor(replica: string) {
    if (!replica) throw new Error('WorldStateCRDT: replica id required');
    this.replica = replica;
  }

  put(id: string, value: T): CRDTRecord<T> {
    const ts = this.nextTs();
    const rec: CRDTRecord<T> = { id, value, ts, tombstone: false };
    this.applyLocal(rec);
    return rec;
  }

  remove(id: string): CRDTRecord<T> | null {
    const existing = this.records.get(id);
    if (!existing) return null;
    const rec: CRDTRecord<T> = { ...existing, ts: this.nextTs(), tombstone: true };
    this.applyLocal(rec);
    return rec;
  }

  get(id: string): T | undefined {
    const rec = this.records.get(id);
    if (!rec || rec.tombstone) return undefined;
    return rec.value;
  }

  list(): Array<{ id: string; value: T }> {
    const out: Array<{ id: string; value: T }> = [];
    for (const rec of this.records.values()) {
      if (!rec.tombstone) out.push({ id: rec.id, value: rec.value });
    }
    return out;
  }

  /** Merge a remote record. Returns true when local state changed. */
  merge(remote: CRDTRecord<T>): boolean {
    const local = this.records.get(remote.id);
    if (!local || compareTs(remote.ts, local.ts) > 0) {
      this.records.set(remote.id, remote);
      return true;
    }
    return false;
  }

  /** Snapshot all records for transport. */
  snapshot(): CRDTRecord<T>[] {
    return Array.from(this.records.values());
  }

  /** Compact tombstones older than `maxAgeMs`. */
  compact(maxAgeMs: number, now = Date.now()): number {
    let removed = 0;
    for (const [id, rec] of this.records) {
      if (rec.tombstone && now - rec.ts.wallMs > maxAgeMs) {
        this.records.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  get size(): number { return this.records.size; }
  get replicaId(): string { return this.replica; }

  private applyLocal(rec: CRDTRecord<T>): void {
    const existing = this.records.get(rec.id);
    if (!existing || compareTs(rec.ts, existing.ts) > 0) {
      this.records.set(rec.id, rec);
    }
  }

  private nextTs(): CRDTRecord<T>['ts'] {
    this.counter += 1;
    return { wallMs: Date.now(), replica: this.replica, ctr: this.counter };
  }
}

function compareTs(a: CRDTRecord<unknown>['ts'], b: CRDTRecord<unknown>['ts']): number {
  if (a.wallMs !== b.wallMs) return a.wallMs - b.wallMs;
  if (a.ctr !== b.ctr) return a.ctr - b.ctr;
  return a.replica < b.replica ? -1 : a.replica > b.replica ? 1 : 0;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface BridgeTransport<T> {
  send(records: CRDTRecord<T>[]): Promise<void>;
  /** Caller invokes this when remote records arrive. */
  onReceive(cb: (records: CRDTRecord<T>[]) => void): () => void;
}

export interface BridgeConfig {
  /** Max in-flight bytes before we coalesce / drop low-priority updates. */
  maxInflightBytes?: number;
  /** Send batch every N ms. */
  flushIntervalMs?: number;
}

/**
 * Bridges a `WorldStateCRDT` over an arbitrary transport (WebTransport,
 * WebSocket, or postMessage). Batches sends, applies backpressure, and
 * supports partial replicas via an inclusion predicate.
 */
export class EventualConsistencyBridge<T> {
  private readonly crdt: WorldStateCRDT<T>;
  private readonly transport: BridgeTransport<T>;
  private readonly maxInflight: number;
  private readonly flushIntervalMs: number;
  private include: (rec: CRDTRecord<T>) => boolean = () => true;
  private outbox: CRDTRecord<T>[] = [];
  private inflightBytes = 0;
  private dropped = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(crdt: WorldStateCRDT<T>, transport: BridgeTransport<T>, config: BridgeConfig = {}) {
    this.crdt = crdt;
    this.transport = transport;
    this.maxInflight = Math.max(1024, config.maxInflightBytes ?? 64 * 1024);
    this.flushIntervalMs = Math.max(16, config.flushIntervalMs ?? 100);
  }

  setInclusionPredicate(pred: (rec: CRDTRecord<T>) => boolean): void { this.include = pred; }

  start(): void {
    if (this.timer) return;
    this.unsubscribe = this.transport.onReceive((records: Record<string, unknown>) => {
      for (const r of records) this.crdt.merge(r);
    });
    this.timer = setInterval(() => { void this.flush(); }, this.flushIntervalMs);
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }
  }

  enqueue(record: CRDTRecord<T>): void {
    if (!this.include(record)) return;
    const size = this.estimateBytes(record);
    if (this.inflightBytes + size > this.maxInflight) {
      this.dropped += 1;
      return;
    }
    this.outbox.push(record);
    this.inflightBytes += size;
  }

  async flush(): Promise<void> {
    if (this.outbox.length === 0) return;
    const batch = this.outbox;
    const bytes = this.inflightBytes;
    this.outbox = [];
    this.inflightBytes = 0;
    try {
      await this.transport.send(batch);
    } catch {
      // Re-queue on failure (best-effort).
      this.outbox.unshift(...batch);
      this.inflightBytes += bytes;
    }
  }

  private estimateBytes(rec: CRDTRecord<T>): number {
    try { return JSON.stringify(rec).length; }
    catch { return 256; }
  }

  get droppedCount(): number { return this.dropped; }
  get queuedCount(): number { return this.outbox.length; }
}
