/**
 * lib/runtime/seamClipboard.ts
 *
 * Cross-Runtime Seam Clipboard
 *
 * When content is dragged through the DreamDM Bar seam, this module:
 *
 *   1. Inspects the payload mime type. If it is 'application/x-dream-artifact',
 *      it parses the JSON, extracts the source and target Engin keys, looks up
 *      all registered cross-engin workflows for that pair, and executes EVERY
 *      matching workflow via bridge.emitDurable — so the data actually DOES
 *      something meaningful in the target Engin.
 *
 *   2. Emits bridge.emitDurable('seam', 'drop', payload) as a fallback durable
 *      event so any Engin that was offline can replay the transfer on reconnect.
 *
 *   3. Fires dreamOSBus.emit('seam:drop', payload) for immediate typed delivery
 *      to React subscribers in either runtime region.
 *
 * No visual clipboard is rendered. The bus IS the clipboard.
 *
 * Usage (producer — runs in the drop handler):
 *   seamClipboard.set({ content, mimeType, sourceRegion, targetRegion });
 *
 * Usage (targeted producer — caller already knows the Engin pair):
 *   const firedIds = seamClipboard.setWithEngins('starmaker', 'lab', artifact);
 *
 * Usage (consumer — runs in a runtime region):
 *   const off = seamClipboard.subscribe(payload => { ... });
 *   return off; // cleanup
 *
 * Architecture: docs/ARCHITECTURE.md §1 (Runtime regions)
 * Circular import rule: this file imports enginWorkflowRegistry which imports
 * only bridge — there is no cycle.
 */

import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';
import type { RuntimeRegion } from '@/lib/identity/canonical-names';
import {
  ENGIN_KEYS,
  findWorkflows,
  type EnginKey,
} from '@/lib/runtime/enginWorkflowRegistry';

// ── Engin key normaliser ───────────────────────────────────────────────────────

/**
 * Maps the many ways an engin name might appear in a drag payload to the
 * canonical EnginKey used by the workflow registry.
 *
 * Accepts values like: 'starmaker', 'StarMakerEngin', 'gameEngin', 'branding',
 * 'create', 'ContentEngin', etc.
 */
const _ENGIN_ALIAS_MAP: Readonly<Record<string, EnginKey>> = {
  // canonical keys pass straight through
  starmaker: 'starmaker',
  game: 'game',
  code: 'code',
  lab: 'lab',
  brand: 'brand',
  content: 'content',
  forge: 'forge',
  // Engin-suffixed variants (lowercase)
  starmakerEngin: 'starmaker',
  gameEngin: 'game',
  codeEngin: 'code',
  labEngin: 'lab',
  brandingEngin: 'brand',
  contentEngin: 'content',
  forgeEngin: 'forge',
  // common aliases
  starmakerEngin_lc: 'starmaker', // handled via toLowerCase fallback below
  branding: 'brand',
  create: 'content',
  music: 'starmaker',
  games: 'game',
};

function _toEnginKey(value: unknown): EnginKey | null {
  if (typeof value !== 'string') return null;
  // Direct hit — exact case
  const direct = _ENGIN_ALIAS_MAP[value];
  if (direct !== undefined) return direct;
  // Case-insensitive hit
  const lc = value.toLowerCase();
  const lcHit = _ENGIN_ALIAS_MAP[lc];
  if (lcHit !== undefined) return lcHit;
  // If it is already a valid EnginKey (covers the const array exhaustively)
  if ((ENGIN_KEYS as readonly string[]).includes(lc)) return lc as EnginKey;
  // Strip trailing 'Engin' / 'engin' suffix and retry
  const stripped = lc.replace(/engin$/, '');
  if ((ENGIN_KEYS as readonly string[]).includes(stripped)) return stripped as EnginKey;
  const strippedHit = _ENGIN_ALIAS_MAP[stripped];
  if (strippedHit !== undefined) return strippedHit;
  return null;
}

// ── Payload type ──────────────────────────────────────────────────────────────

export type SeamClipboardMimeType = 'text/plain' | 'application/json' | 'application/x-dream-artifact';

export interface SeamClipboardPayload {
  /** Raw string content being transferred. JSON for structured types. */
  content: string;
  /** MIME type describing how to interpret content. */
  mimeType: SeamClipboardMimeType;
  /** Region the drag originated from ('Surface Space' or 'DreamSpace'). */
  sourceRegion: RuntimeRegion;
  /** Opposite region that should receive the payload. */
  targetRegion: RuntimeRegion;
  /** Monotonic timestamp (Date.now()) of the transfer. */
  timestamp: number;
}

// ── Subscriber type ───────────────────────────────────────────────────────────

type SeamClipboardListener = (payload: SeamClipboardPayload) => void;
type UnsubscribeFn = () => void;

// ── Improvement 37: payload size guard ───────────────────────────────────────
/** Maximum allowed payload content size in bytes (512 KB). */
const MAX_PAYLOAD_BYTES = 512 * 1024;

class SeamClipboard {
  private current: SeamClipboardPayload | null = null;
  private readonly listeners = new Set<SeamClipboardListener>();

  /**
   * Stash a payload, execute matching cross-engin workflows, and broadcast on
   * both the bridge and dreamOSBus.
   *
   * When mimeType is 'application/x-dream-artifact', the content JSON is
   * parsed for `engin` (source) and `targetEngin` fields. All workflows
   * registered for that Engin pair are executed via bridge.emitDurable BEFORE
   * the fallback seam:drop emission so subscribers receive targeted events
   * first.
   *
   * Calling set() again overwrites the previous value and fires a new event.
   */
  set(input: Omit<SeamClipboardPayload, 'timestamp'>): void {
    // ── Improvement 37: reject oversized payloads ─────────────────────────
    const byteLen = typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(input.content).length
      : input.content.length;
    if (byteLen > MAX_PAYLOAD_BYTES) {
      console.warn(
        `[SeamClipboard] Payload rejected: ${byteLen} bytes exceeds ${MAX_PAYLOAD_BYTES} byte limit`,
      );
      return;
    }

    const payload: SeamClipboardPayload = { ...input, timestamp: Date.now() };
    this.current = payload;

    // 1. Cross-engin workflow routing — only for structured artifact drops.
    if (input.mimeType === 'application/x-dream-artifact') {
      try {
        const parsed = JSON.parse(input.content) as Record<string, unknown>;
        const sourceEngin = _toEnginKey(parsed['engin']);
        const targetEngin = _toEnginKey(parsed['targetEngin']);
        if (sourceEngin !== null && targetEngin !== null) {
          const workflows = findWorkflows(sourceEngin, targetEngin);
          for (const workflow of workflows) {
            // ── Improvement 38: per-workflow try/catch ───────────────────
            try {
              workflow.execute({ ...parsed, _seamTimestamp: payload.timestamp });
            } catch (workflowErr) {
              console.error(`[SeamClipboard] Workflow ${workflow.id} failed`, workflowErr);
            }
          }
        }
      } catch (_err) {
        // Non-JSON content or missing engin fields — fall through to the
        // fallback seam:drop emission below.
      }
    }

    // 2. Durable bridge emission — survives Engin reconnects.
    bridge.emitDurable('seam', 'drop', payload as unknown as Record<string, unknown>);

    // 3. dreamOSBus custom event — immediate typed delivery to React subscribers.
    dreamOSBus.emit('seam:drop', payload);

    // 4. Notify direct subscribers (used in tests and hook integrations).
    this._notify(payload);
  }

  /** Clear the clipboard and notify subscribers. */
  clear(): void {
    this.current = null;
    dreamOSBus.emit('seam:clear', { timestamp: Date.now() });
  }

  /** Return the current stashed payload without consuming it. */
  get(): SeamClipboardPayload | null {
    return this.current;
  }

  /**
   * Targeted cross-engin dispatch for callers that already know the Engin pair.
   *
   * Finds every workflow registered for the from→to pair, executes them all
   * via bridge.emitDurable, and returns the list of workflow IDs that fired.
   * Does NOT emit a seam:drop — use set() when you want the full clipboard
   * broadcast alongside the workflow routing.
   *
   * @param from     Source Engin key (e.g. 'starmaker').
   * @param to       Target Engin key (e.g. 'lab').
   * @param artifact Serialisable artifact data merged into each workflow payload.
   * @returns        Array of workflow IDs that were executed (may be empty).
   */
  setWithEngins(from: EnginKey, to: EnginKey, artifact: Record<string, unknown>): string[] {
    const workflows = findWorkflows(from, to);
    const firedIds: string[] = [];
    for (const workflow of workflows) {
      // ── Improvement 38: per-workflow try/catch ───────────────────────────
      try {
        workflow.execute({ ...artifact, _seamTimestamp: Date.now() });
        firedIds.push(workflow.id);
      } catch (err) {
        console.error(`[SeamClipboard] Workflow ${workflow.id} failed`, err);
      }
    }
    return firedIds;
  }

  /**
   * Subscribe to seam drop events.
   * The handler is called each time set() is invoked (not on clear).
   * Returns an unsubscribe function.
   */
  subscribe(handler: SeamClipboardListener): UnsubscribeFn {
    this.listeners.add(handler);
    return () => { this.listeners.delete(handler); };
  }

  // ── Improvement 39: getSubscriberCount ───────────────────────────────────
  /** Return the number of active subscribers. Useful for debugging. */
  getSubscriberCount(): number {
    return this.listeners.size;
  }

  private _notify(payload: SeamClipboardPayload): void {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(payload);
      } catch (err) {
        console.error('[SeamClipboard] listener error', err);
      }
    }
  }
}

/** Singleton cross-runtime seam clipboard. */
export const seamClipboard = new SeamClipboard();
