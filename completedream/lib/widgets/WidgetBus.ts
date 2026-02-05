
type Callback = (payload: any) => void;

class WidgetBus {
  private listeners: Record<string, Callback[]> = {};

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
}

const widgetBus = new WidgetBus();
export default widgetBus;
