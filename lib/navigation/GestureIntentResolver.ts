// GestureIntentResolver - Resolve gesture intent from frame data
// Mobile-optimized: numeric thresholds, priority-based resolution

import type { GestureFrame } from './GestureFrameComputer';

// Numeric thresholds (constants)
export const PINCH_IN_THRESHOLD = 12;
export const PINCH_OUT_THRESHOLD = -12;
export const SWIPE_THRESHOLD = 8;
export const HOLD_THRESHOLD_MS = 420;

// Intent enum (exactly one per frame)
export enum GestureIntent {
  NONE = 'NONE',
  ROTATE_X = 'ROTATE_X',
  ROTATE_Y = 'ROTATE_Y',
  ZOOM_IN = 'ZOOM_IN',
  ZOOM_OUT = 'ZOOM_OUT',
  HOLD = 'HOLD',
}

export interface ResolvedIntent {
  intent: GestureIntent;
  magnitude: number; // For rotation delta or zoom amount
}

/**
 * GestureIntentResolver resolves gesture intent from frame data
 * 
 * Resolution priority:
 * 1. ZOOM (pinch)
 * 2. ROTATE (swipe)
 * 3. HOLD (stationary)
 * 4. NONE
 */
export class GestureIntentResolver {
  private gestureStartTime: number;
  private isGestureActive: boolean;
  
  constructor() {
    this.gestureStartTime = 0;
    this.isGestureActive = false;
  }
  
  /**
   * Start tracking a gesture
   */
  startGesture(now: number): void {
    this.gestureStartTime = now;
    this.isGestureActive = true;
  }
  
  /**
   * End gesture tracking
   */
  endGesture(): void {
    this.isGestureActive = false;
    this.gestureStartTime = 0;
  }
  
  /**
   * Resolve intent from gesture frame
   */
  resolve(frame: GestureFrame, now: number): ResolvedIntent {
    if (!this.isGestureActive) {
      return { intent: GestureIntent.NONE, magnitude: 0 };
    }
    
    // Priority 1: ZOOM (pinch detection)
    if (Math.abs(frame.pinchDelta) > 0) {
      if (frame.pinchDelta > PINCH_IN_THRESHOLD) {
        return { intent: GestureIntent.ZOOM_IN, magnitude: frame.pinchDelta };
      }
      if (frame.pinchDelta < PINCH_OUT_THRESHOLD) {
        return { intent: GestureIntent.ZOOM_OUT, magnitude: Math.abs(frame.pinchDelta) };
      }
    }
    
    // Priority 2: ROTATE (swipe detection)
    const absX = Math.abs(frame.dx);
    const absY = Math.abs(frame.dy);
    
    if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
      // Determine primary axis
      if (absX > absY) {
        return { 
          intent: GestureIntent.ROTATE_X, 
          magnitude: frame.dx > 0 ? 1 : -1 
        };
      } else {
        return { 
          intent: GestureIntent.ROTATE_Y, 
          magnitude: frame.dy > 0 ? 1 : -1 
        };
      }
    }
    
    // Priority 3: HOLD (stationary long enough)
    const elapsed = now - this.gestureStartTime;
    if (elapsed > HOLD_THRESHOLD_MS && absX < 2 && absY < 2) {
      return { intent: GestureIntent.HOLD, magnitude: elapsed };
    }
    
    // Priority 4: NONE
    return { intent: GestureIntent.NONE, magnitude: 0 };
  }
  
  /**
   * Cancel active gesture
   */
  cancel(): void {
    this.isGestureActive = false;
    this.gestureStartTime = 0;
  }
}
