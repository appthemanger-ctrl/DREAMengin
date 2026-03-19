// CrossWidgetPosting - Server-validated cross-widget posting system
// Implements POST_REQUEST validation and platform publishing

import { WidgetLinkGraph, type CapabilityMask } from './WidgetLinkGraph';
import { widgetEventBus, type WidgetMsg } from './WidgetEventBus';

// Message types
export const MSG_TYPE_POST_REQUEST = 1;
export const MSG_TYPE_POST_RESULT = 2;
export const MSG_TYPE_FOCUS_REQUEST = 3;
export const MSG_TYPE_SEND_TEXT = 4;
export const MSG_TYPE_SEND_MEDIA = 5;

// Widget capabilities
export interface WidgetCapabilityConfig {
  canSendPost: boolean;
  canReceivePost: boolean;
  canSendText: boolean;
  canSendMedia: boolean;
  canRequestFocus: boolean;
}

// Post request payload
export interface PostRequestPayload {
  text?: string;
  mediaIds?: string[];
  targetPlatform?: string;
  options?: Record<string, unknown>;
}

// Post result payload
export interface PostResultPayload {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * CrossWidgetPostingEngine validates and routes posting requests
 */
export class CrossWidgetPostingEngine {
  private linkGraph: WidgetLinkGraph;
  private widgetCapabilities: Map<string, WidgetCapabilityConfig>;
  
  constructor(linkGraph: WidgetLinkGraph) {
    this.linkGraph = linkGraph;
    this.widgetCapabilities = new Map();
  }
  
  /**
   * Register widget capabilities
   */
  registerWidget(widgetId: string, capabilities: WidgetCapabilityConfig): void {
    this.widgetCapabilities.set(widgetId, capabilities);
  }
  
  /**
   * Validate a POST_REQUEST message
   */
  validatePostRequest(
    sourceWidgetId: string,
    targetWidgetId: string
  ): { valid: boolean; reason?: string } {
    // Check if link exists
    if (!this.linkGraph.hasCapability(sourceWidgetId, targetWidgetId, 'CAN_SEND_POST')) {
      return {
        valid: false,
        reason: 'No POST link exists from source to target'
      };
    }
    
    // Check if target supports POST_SINK
    const targetCapabilities = this.widgetCapabilities.get(targetWidgetId);
    if (!targetCapabilities?.canReceivePost) {
      return {
        valid: false,
        reason: 'Target widget does not support receiving posts'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Handle a POST_REQUEST message
   */
  async handlePostRequest(msg: WidgetMsg): Promise<void> {
    const sourceWidgetId = msg.fromInstanceId;
    const targetWidgetId = msg.toWidgetId;
    const payload = msg.payload as PostRequestPayload;
    
    // Validate request
    const validation = this.validatePostRequest(sourceWidgetId, targetWidgetId);
    if (!validation.valid) {
      // Send failure result back
      this.sendPostResult(targetWidgetId, sourceWidgetId, {
        success: false,
        error: validation.reason
      });
      return;
    }
    
    // Call server-validated publish API — auth session, rate limits, and audit
    // logging are all enforced server-side in POST /api/posts.
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: payload.text ?? '',
          media_ids: payload.mediaIds ?? [],
          target_platform: payload.targetPlatform,
          source_widget: sourceWidgetId,
          target_widget: targetWidgetId,
          options: payload.options ?? {},
        }),
      });

      if (res.ok) {
        const data = await res.json() as { id?: string; post_id?: string };
        this.sendPostResult(targetWidgetId, sourceWidgetId, {
          success: true,
          postId: data.id ?? data.post_id,
        });
      } else {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        this.sendPostResult(targetWidgetId, sourceWidgetId, {
          success: false,
          error: err.error ?? `Post failed (HTTP ${res.status})`,
        });
      }
    } catch (networkErr) {
      this.sendPostResult(targetWidgetId, sourceWidgetId, {
        success: false,
        error: networkErr instanceof Error ? networkErr.message : 'Network error',
      });
    }
  }
  
  /**
   * Send POST_RESULT message
   */
  private sendPostResult(
    fromWidgetId: string,
    toWidgetId: string,
    result: PostResultPayload
  ): void {
    widgetEventBus.send(
      fromWidgetId,
      toWidgetId,
      MSG_TYPE_POST_RESULT,
      result
    );
  }
  
  /**
   * Handle incoming messages
   */
  handleMessage(msg: WidgetMsg): void {
    switch (msg.type) {
      case MSG_TYPE_POST_REQUEST:
        this.handlePostRequest(msg);
        break;
      
      case MSG_TYPE_SEND_TEXT:
        this.handleSendText(msg);
        break;
      
      case MSG_TYPE_SEND_MEDIA:
        this.handleSendMedia(msg);
        break;
      
      default:
        console.warn('Unknown message type:', msg.type);
    }
  }
  
  /**
   * Handle SEND_TEXT message
   */
  private handleSendText(msg: WidgetMsg): void {
    const sourceWidgetId = msg.fromInstanceId;
    const targetWidgetId = msg.toWidgetId;
    
    if (!this.linkGraph.hasCapability(sourceWidgetId, targetWidgetId, 'CAN_SEND_TEXT')) {
      console.warn('No CAN_SEND_TEXT capability');
      return;
    }
    
    console.log('SEND_TEXT:', {
      source: sourceWidgetId,
      target: targetWidgetId,
      payload: msg.payload
    });
  }
  
  /**
   * Handle SEND_MEDIA message
   */
  private handleSendMedia(msg: WidgetMsg): void {
    const sourceWidgetId = msg.fromInstanceId;
    const targetWidgetId = msg.toWidgetId;
    
    if (!this.linkGraph.hasCapability(sourceWidgetId, targetWidgetId, 'CAN_SEND_MEDIA')) {
      console.warn('No CAN_SEND_MEDIA capability');
      return;
    }
    
    console.log('SEND_MEDIA:', {
      source: sourceWidgetId,
      target: targetWidgetId,
      payload: msg.payload
    });
  }
  
  /**
   * Create a posting link between widgets
   */
  createPostingLink(
    sourceWidgetId: string,
    targetWidgetId: string,
    actionMap?: Record<string, string>
  ): string {
    return this.linkGraph.addLink(
      sourceWidgetId,
      targetWidgetId,
      ['CAN_SEND_POST', 'CAN_REQUEST_PUBLISH'],
      actionMap || {}
    );
  }
}
