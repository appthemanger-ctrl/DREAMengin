'use client';
import { EventEmitter } from 'events';

// The 6-Channel Virtual Bus for the Online Economy
class DualRuntimeBridge extends EventEmitter {
  private state: Record<string, any> = {};

  constructor() {
    super();
    this.setMaxListeners(20);
  }

  // Channel names: 'CODE', 'GAME', 'STAR', 'LAB', 'BRAND', 'CONTENT'
  emitToChannel(channel: string, data: any) {
    this.state[channel] = data;
    this.emit(`channel:${channel}`, data);
    this.emit('global_update', { channel, data });
    console.log(`[Bridge] ${channel} updated:`, data);
  }

  getChannelState(channel: string) {
    return this.state[channel] || null;
  }
}

export const enginBridge = new DualRuntimeBridge();
