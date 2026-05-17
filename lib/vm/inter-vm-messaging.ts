/**
 * lib/vm/inter-vm-messaging.ts — SharedArrayBuffer-backed inter-VM message queue
 *
 * InterVMChannel: lock-free ring-buffer for passing VMEvent messages
 * between TOO_VM and BOTTOM_VM without allocating on the hot path.
 *
 * Falls back to a regular ArrayBuffer when SharedArrayBuffer is unavailable
 * (cross-origin isolated pages not required in single-threaded mode).
 */

// ─── VM Event Union ───────────────────────────────────────────────────────────

export type VMEvent =
  | { type: 'workload-submitted'; workloadId: string; region: 'top' | 'bottom'; timestamp: number }
  | { type: 'compute-complete';   workloadId: string; region: 'top' | 'bottom'; durationMs: number; timestamp: number }
  | { type: 'error';              workloadId?: string; region: 'top' | 'bottom'; error: string; timestamp: number }
  | { type: 'stats-update';       region: 'top' | 'bottom'; stats: Record<string, unknown>; timestamp: number }
  | { type: 'custom';             name: string; payload: unknown; timestamp: number };

// ─── Ring-buffer layout ───────────────────────────────────────────────────────
//
// [0..3]    producer index (Int32, atomic)
// [4..7]    consumer index (Int32, atomic)
// [8..]     N slots of SLOT_BYTES each
//            slot[0..3]      = payload length (uint32, LE)
//            slot[4..SLOT-1] = UTF-8 encoded JSON

const HEADER_BYTES   = 8;
const SLOT_BYTES     = 512;  // max JSON message size
const DEFAULT_SLOTS  = 64;

// ─── InterVMChannel ───────────────────────────────────────────────────────────

export class InterVMChannel {
  private readonly buf:          SharedArrayBuffer | ArrayBuffer;
  private readonly view:         DataView;
  private readonly producerIdx:  Int32Array;
  private readonly consumerIdx:  Int32Array;
  private readonly capacity:     number;
  private readonly encoder:      TextEncoder;
  private readonly decoder:      TextDecoder;
  private readonly subscribers = new Set<(msg: VMEvent) => void>();
  private _pollHandle:           ReturnType<typeof setInterval> | null = null;

  constructor(capacity = DEFAULT_SLOTS) {
    this.capacity = capacity;
    this.encoder  = new TextEncoder();
    this.decoder  = new TextDecoder();

    const totalBytes = HEADER_BYTES + capacity * SLOT_BYTES;

    if (typeof SharedArrayBuffer !== 'undefined') {
      this.buf = new SharedArrayBuffer(totalBytes);
    } else {
      this.buf = new ArrayBuffer(totalBytes);
    }

    this.view        = new DataView(this.buf);
    this.producerIdx = new Int32Array(this.buf, 0, 1);
    this.consumerIdx = new Int32Array(this.buf, 4, 1);
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  /**
   * Enqueue a VMEvent.
   * Returns false if the queue is full or the message is too large.
   */
  send(msg: VMEvent): boolean {
    const json    = JSON.stringify(msg);
    const encoded = this.encoder.encode(json);

    if (encoded.length + 4 > SLOT_BYTES) {
      console.warn('[InterVMChannel] Message too large to enqueue:', encoded.length);
      return false;
    }

    const prod = Atomics.load(this.producerIdx, 0);
    const cons = Atomics.load(this.consumerIdx, 0);
    const used = (prod - cons + this.capacity) % this.capacity;

    if (used >= this.capacity - 1) return false; // Full

    const slot   = prod % this.capacity;
    const offset = HEADER_BYTES + slot * SLOT_BYTES;

    this.view.setUint32(offset, encoded.length, true);
    new Uint8Array(this.buf, offset + 4, encoded.length).set(encoded);

    Atomics.add(this.producerIdx, 0, 1);

    // Notify subscribers asynchronously
    Promise.resolve().then(() => this._drain());

    return true;
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  /**
   * Dequeue one VMEvent. Returns null if the queue is empty.
   */
  recv(): VMEvent | null {
    const prod = Atomics.load(this.producerIdx, 0);
    const cons = Atomics.load(this.consumerIdx, 0);

    if (prod === cons) return null;

    const slot   = cons % this.capacity;
    const offset = HEADER_BYTES + slot * SLOT_BYTES;
    const len    = this.view.getUint32(offset, true);

    Atomics.add(this.consumerIdx, 0, 1);

    if (len === 0 || len + 4 > SLOT_BYTES) return null;

    const raw  = new Uint8Array(this.buf, offset + 4, len);
    const json = this.decoder.decode(raw);

    try {
      return JSON.parse(json) as VMEvent;
    } catch {
      return null;
    }
  }

  // ── Subscribe ──────────────────────────────────────────────────────────────

  /**
   * Register a callback to receive VMEvents as they arrive.
   * Returns an unsubscribe function.
   */
  subscribe(cb: (msg: VMEvent) => void): () => void {
    this.subscribers.add(cb);
    if (this.subscribers.size === 1) this._startPoll();
    return () => {
      this.subscribers.delete(cb);
      if (this.subscribers.size === 0) this._stopPoll();
    };
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  destroy(): void {
    this._stopPoll();
    this.subscribers.clear();
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private _startPoll(): void {
    if (this._pollHandle) return;
    this._pollHandle = setInterval(() => this._drain(), 16);
  }

  private _stopPoll(): void {
    if (this._pollHandle !== null) {
      clearInterval(this._pollHandle);
      this._pollHandle = null;
    }
  }

  private _drain(): void {
    let msg: VMEvent | null;
    while ((msg = this.recv()) !== null) {
      for (const cb of this.subscribers) {
        try { cb(msg); } catch { /* subscriber errors must not crash the channel */ }
      }
    }
  }
}
