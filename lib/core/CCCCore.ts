// lib/core/CCCCore.ts
// Connected Chaos Core (§14 — CCC Metaphor)
//
// System mirrors CCC Physics:
//   - Information flows
//   - Memory persists
//   - No loss / No breaks
//   - Only transformations
//
// UI behaves like nested cubes / nested fields / nested realities.
// Like spacetime navigation.

import widgetBus from '@/lib/widgets/WidgetBus';

// =============================================================================
// TYPES
// =============================================================================

export interface CCCTransformation {
  id: string;
  sourceWidgetId?: string;
  kind: string;
  inputSnapshot: unknown;
  outputSnapshot: unknown;
  timestamp: number;
}

export interface CCCFieldNode {
  id: string;
  parentId?: string;
  depth: number;
  label?: string;
  widgetId?: string;
}

// =============================================================================
// CCC CORE — Persistent information flow with no loss
// =============================================================================

class CCCCore {
  // Transformation log — information is never lost, only transformed (§14)
  private transformations: CCCTransformation[] = [];

  // Nested field graph — nested cubes / realities (§14)
  private fields: Map<string, CCCFieldNode> = new Map();

  // ==================== Information Flow ====================

  /** Record a transformation. Information is never lost. */
  recordTransformation(
    kind: string,
    inputSnapshot: unknown,
    outputSnapshot: unknown,
    sourceWidgetId?: string,
  ): CCCTransformation {
    const t: CCCTransformation = {
      id: `ccc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceWidgetId,
      kind,
      inputSnapshot,
      outputSnapshot,
      timestamp: Date.now(),
    };
    this.transformations.push(t);

    // Broadcast through the widget bus so any listener can react
    widgetBus.emit('ccc:transformation', t);
    return t;
  }

  getTransformations(limit?: number): CCCTransformation[] {
    if (limit) return this.transformations.slice(-limit);
    return [...this.transformations];
  }

  // ==================== Persistent Memory (§14) ====================

  /** Store a value in shared widget memory (delegates to WidgetBus). */
  persist(key: string, value: unknown): void {
    widgetBus.setMemory(key, value);
  }

  /** Retrieve a persisted value. */
  recall<T = unknown>(key: string): T | undefined {
    return widgetBus.getMemory<T>(key);
  }

  // ==================== Nested Fields (§14) ====================

  addField(node: CCCFieldNode): void {
    this.fields.set(node.id, node);
    widgetBus.emit('ccc:field_added', node);
  }

  removeField(id: string): void {
    this.fields.delete(id);
    widgetBus.emit('ccc:field_removed', { id });
  }

  getField(id: string): CCCFieldNode | undefined {
    return this.fields.get(id);
  }

  getChildFields(parentId: string): CCCFieldNode[] {
    return Array.from(this.fields.values()).filter((f) => f.parentId === parentId);
  }

  getRootFields(): CCCFieldNode[] {
    return Array.from(this.fields.values()).filter((f) => !f.parentId);
  }

  getFieldDepth(id: string): number {
    return this.fields.get(id)?.depth ?? 0;
  }
}

const cccCore = new CCCCore();
export default cccCore;
