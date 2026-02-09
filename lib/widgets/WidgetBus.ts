import type { WidgetChainStep } from '@/types/widgets';

type Callback = (payload: any) => void;

// =============================================================================
// WidgetBus — Inter-widget communication, shared memory, chain triggering,
// and sub-widget spawning (§11 Widget Architecture).
// =============================================================================

class WidgetBus {
  private listeners: Record<string, Callback[]> = {};

  // ---- Shared memory (§11): widgets share state via a key/value store ----
  private sharedMemory: Map<string, unknown> = new Map();

  // ---- Sub-widget registry (§11): parentId → child ids ----
  private subWidgets: Map<string, Set<string>> = new Map();

  // ==================== Event Pub/Sub ====================

  emit(channel: string, payload: any) {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach((cb) => cb(payload));
    }
  }

  on(channel: string, callback: Callback) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(callback);
  }

  off(channel: string, callback: Callback) {
    if (this.listeners[channel]) {
      this.listeners[channel] = this.listeners[channel].filter((cb) => cb !== callback);
    }
  }

  // ==================== Shared Memory (§11) ====================

  setMemory(key: string, value: unknown): void {
    this.sharedMemory.set(key, value);
    this.emit(`memory:${key}`, value);
  }

  getMemory<T = unknown>(key: string): T | undefined {
    return this.sharedMemory.get(key) as T | undefined;
  }

  clearMemory(key: string): void {
    this.sharedMemory.delete(key);
    this.emit(`memory:${key}`, undefined);
  }

  // ==================== Chain Triggering (§11) ====================

  triggerChain(steps: WidgetChainStep[]): void {
    for (const step of steps) {
      this.emit(`chain:${step.widgetId}`, {
        action: step.action,
        payload: step.payload,
      });
    }
  }

  // ==================== Sub-Widget Spawning (§11) ====================

  spawnSubWidget(parentId: string, childId: string): void {
    if (!this.subWidgets.has(parentId)) {
      this.subWidgets.set(parentId, new Set());
    }
    this.subWidgets.get(parentId)!.add(childId);
    this.emit(`spawn:${parentId}`, { childId });
  }

  removeSubWidget(parentId: string, childId: string): void {
    this.subWidgets.get(parentId)?.delete(childId);
    this.emit(`despawn:${parentId}`, { childId });
  }

  getSubWidgets(parentId: string): string[] {
    return Array.from(this.subWidgets.get(parentId) ?? []);
  }
}

const widgetBus = new WidgetBus();
export default widgetBus;
