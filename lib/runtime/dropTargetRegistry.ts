/**
 * lib/runtime/dropTargetRegistry.ts — Pass 6
 *
 * Drop Target Registry
 *
 * Tracks all active drop targets across runtime regions so the drag surface
 * can route a DreamDrop to the right handler without knowing the DOM layout.
 *
 * Each drop target registers itself with a unique id, the runtime region it
 * belongs to, and the DreamDropTypes it accepts. When a drop arrives, the
 * registry finds the best match and fires its handler.
 *
 * Architecture: docs/ARCHITECTURE.md §6 (Pass 6 — Universal drag/drop).
 */

import type { DreamDrop, DreamDropType } from '@/lib/runtime/coercionTable';
import type { RuntimeId } from '@/types/module-manifest';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DropTarget {
  /** Unique identifier for this target. */
  id: string;
  /** Runtime region this target lives in. */
  region: RuntimeId;
  /**
   * Drop types this target accepts.
   * An empty array means the target accepts ALL types.
   */
  accepts: DreamDropType[];
  /** Priority — higher values win when multiple targets match the same drop. */
  priority: number;
  /** Called when a matching drop is routed to this target. */
  onDrop: (drop: DreamDrop) => void;
}

// ── Registry ──────────────────────────────────────────────────────────────────

class DropTargetRegistry {
  private readonly _targets = new Map<string, DropTarget>();

  /**
   * Register a drop target.
   * Re-registering the same id updates the entry in-place.
   */
  register(target: DropTarget): void {
    this._targets.set(target.id, target);
  }

  /**
   * Unregister a drop target by id.
   */
  unregister(id: string): void {
    this._targets.delete(id);
  }

  /**
   * Route a DreamDrop to the best matching target in the given region.
   *
   * Matching rules:
   *   1. Target must be in `region`.
   *   2. Target must accept `drop.type` (or have an empty `accepts` array).
   *   3. Among matches, the highest `priority` wins.
   *
   * Returns true when a handler was found and called; false otherwise.
   */
  route(drop: DreamDrop, region: RuntimeId): boolean {
    let best: DropTarget | null = null;
    for (const target of this._targets.values()) {
      if (target.region !== region) continue;
      const accepts =
        target.accepts.length === 0 || target.accepts.includes(drop.type);
      if (!accepts) continue;
      if (!best || target.priority > best.priority) {
        best = target;
      }
    }
    if (!best) return false;
    best.onDrop(drop);
    return true;
  }

  /**
   * Return all registered targets in a given region (for diagnostics).
   */
  getTargetsForRegion(region: RuntimeId): DropTarget[] {
    return Array.from(this._targets.values()).filter((t: Record<string, unknown>) => t.region === region);
  }

  /** Total number of registered targets. */
  get size(): number {
    return this._targets.size;
  }
}

/** Singleton registry for the entire DREAMengin session. */
export const dropTargetRegistry = new DropTargetRegistry();
