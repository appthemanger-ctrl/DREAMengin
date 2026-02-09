
type Callback = (payload: any) => void;

class WidgetBus {
  private listeners: Record<string, Callback[]> = {};
  private memory: Record<string, unknown> = {};
  private children: Record<string, string[]> = {};

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

  // --- Shared memory ---

  setMemory(key: string, value: unknown) {
    this.memory[key] = value;
    this.emit(`memory:${key}`, value);
  }

  getMemory(key: string): unknown {
    return this.memory[key];
  }

  clearMemory(key: string) {
    delete this.memory[key];
  }

  // --- Trigger chains ---

  chain(channels: string[], payload: any) {
    for (const ch of channels) {
      this.emit(ch, payload);
    }
  }

  // --- Sub-widget spawning ---

  spawnChild(parentId: string, childId: string) {
    if (!this.children[parentId]) {
      this.children[parentId] = [];
    }
    if (!this.children[parentId].includes(childId)) {
      this.children[parentId].push(childId);
    }
    this.emit(`spawn:${parentId}`, childId);
  }

  getChildren(parentId: string): string[] {
    return this.children[parentId] ?? [];
  }

  removeChild(parentId: string, childId: string) {
    if (this.children[parentId]) {
      this.children[parentId] = this.children[parentId].filter((id) => id !== childId);
    }
    this.emit(`despawn:${parentId}`, childId);
  }
}

const widgetBus = new WidgetBus();
export default widgetBus;
