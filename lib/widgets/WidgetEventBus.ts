// WidgetEventBus - In-memory pub/sub for widget-to-widget communication
// Zero allocations per frame, asynchronous dispatch outside gesture frames

export interface WidgetMsg {
  fromInstanceId: string;
  toWidgetId: string;
  type: number; // uint16 represented as number
  payload: unknown;
  timestamp: number;
}

export type WidgetMsgCallback = (msg: WidgetMsg) => void;

/**
 * WidgetEventBus handles widget-to-widget messaging
 * Messages are enqueued synchronously, processed asynchronously
 */
export class WidgetEventBus {
  private listeners: Map<string, WidgetMsgCallback[]>;
  private messageQueue: WidgetMsg[];
  private isProcessing: boolean;
  
  constructor() {
    this.listeners = new Map();
    this.messageQueue = [];
    this.isProcessing = false;
  }
  
  /**
   * Subscribe to messages for a specific widget
   */
  subscribe(widgetId: string, callback: WidgetMsgCallback): () => void {
    if (!this.listeners.has(widgetId)) {
      this.listeners.set(widgetId, []);
    }
    
    const callbacks = this.listeners.get(widgetId)!;
    callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Emit a message (synchronous enqueue, asynchronous processing)
   */
  emit(msg: WidgetMsg): void {
    this.messageQueue.push(msg);
    
    // Schedule processing outside gesture frames
    if (!this.isProcessing) {
      this.scheduleProcessing();
    }
  }
  
  /**
   * Send a message from one widget to another
   */
  send(
    fromInstanceId: string,
    toWidgetId: string,
    type: number,
    payload: unknown
  ): void {
    this.emit({
      fromInstanceId,
      toWidgetId,
      type,
      payload,
      timestamp: Date.now()
    });
  }
  
  /**
   * Schedule message processing outside gesture frames
   */
  private scheduleProcessing(): void {
    this.isProcessing = true;
    
    // Use queueMicrotask for next microtask or requestIdleCallback for idle
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => this.processMessages());
    } else if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.processMessages());
    } else {
      // Fallback to setTimeout
      setTimeout(() => this.processMessages(), 0);
    }
  }
  
  /**
   * Process queued messages
   */
  private processMessages(): void {
    // Process all queued messages
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      const callbacks = this.listeners.get(msg.toWidgetId);
      
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(msg);
          } catch (error) {
            console.error('Error processing widget message:', error);
          }
        });
      }
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Clear all listeners (for cleanup)
   */
  clear(): void {
    this.listeners.clear();
    this.messageQueue = [];
    this.isProcessing = false;
  }
  
  /**
   * Get queue size (for debugging)
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }
}

// Singleton instance
export const widgetEventBus = new WidgetEventBus();
