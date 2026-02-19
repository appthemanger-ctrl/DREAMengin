// GestureFrameComputer - Per-frame gesture computation
// Mobile-optimized: scalar values only, zero allocation

import type { PointerState } from './PointerEventCapture';

export interface GestureFrame {
  centroidX: number;
  centroidY: number;
  dx: number;
  dy: number;
  dt: number;
  pinchDelta: number;
  distance: number;
}

/**
 * GestureFrameComputer computes gesture metrics every animation frame
 * - Centroid tracking
 * - Delta computation
 * - Pinch detection
 */
export class GestureFrameComputer {
  private lastCentroidX: number;
  private lastCentroidY: number;
  private lastDist: number;
  private lastFrameTime: number;
  
  constructor() {
    this.lastCentroidX = 0;
    this.lastCentroidY = 0;
    this.lastDist = 0;
    this.lastFrameTime = 0;
  }
  
  /**
   * Compute gesture frame from pointer state
   */
  compute(state: PointerState, now: number): GestureFrame {
    // Centroid computation
    let centroidX: number;
    let centroidY: number;
    
    if (state.activeCount === 0) {
      centroidX = 0;
      centroidY = 0;
    } else if (state.activeCount === 1) {
      centroidX = state.p0x;
      centroidY = state.p0y;
    } else {
      centroidX = (state.p0x + state.p1x) / 2;
      centroidY = (state.p0y + state.p1y) / 2;
    }
    
    // Delta computation
    const dx = centroidX - this.lastCentroidX;
    const dy = centroidY - this.lastCentroidY;
    const dt = now - this.lastFrameTime;
    
    // Pinch distance (only if 2 active pointers)
    let distance = 0;
    let pinchDelta = 0;
    
    if (state.activeCount === 2) {
      const deltaX = state.p1x - state.p0x;
      const deltaY = state.p1y - state.p0y;
      distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      pinchDelta = distance - this.lastDist;
      this.lastDist = distance;
    } else {
      this.lastDist = 0;
    }
    
    // Update last values for next frame
    this.lastCentroidX = centroidX;
    this.lastCentroidY = centroidY;
    this.lastFrameTime = now;
    
    return {
      centroidX,
      centroidY,
      dx,
      dy,
      dt,
      pinchDelta,
      distance,
    };
  }
  
  /**
   * Reset state (call when gesture ends)
   */
  reset(): void {
    this.lastCentroidX = 0;
    this.lastCentroidY = 0;
    this.lastDist = 0;
    this.lastFrameTime = 0;
  }
}
