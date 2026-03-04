// PointerEventCapture - Document-level pointer/touch event capture
// Mobile-optimized: handles both pointer and touch events

export interface PointerState {
  // Active pointer data (max 2 pointers)
  p0x: number;
  p0y: number;
  p0t: number;
  p1x: number;
  p1y: number;
  p1t: number;
  activeCount: number;
}

export type PointerEventCallback = (state: PointerState) => void;

/**
 * PointerEventCapture manages low-level pointer/touch events
 * - setPointerCapture on pointerdown
 * - preventDefault on all events
 * - max 2 active pointers
 */
export class PointerEventCapture {
  private state: PointerState;
  private activePointers: Map<number, number>; // pointerId -> index (0 or 1)
  private element: HTMLElement | Document;
  private onMove: PointerEventCallback | null;
  private onEnd: PointerEventCallback | null;
  
  constructor(element: HTMLElement | Document = document) {
    this.element = element;
    this.state = {
      p0x: 0,
      p0y: 0,
      p0t: 0,
      p1x: 0,
      p1y: 0,
      p1t: 0,
      activeCount: 0,
    };
    this.activePointers = new Map();
    this.onMove = null;
    this.onEnd = null;
    
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);
  }
  
  // Start capturing events
  start(onMove: PointerEventCallback, onEnd: PointerEventCallback): void {
    this.onMove = onMove;
    this.onEnd = onEnd;
    
    this.element.addEventListener('pointerdown', this.handlePointerDown);
    this.element.addEventListener('pointermove', this.handlePointerMove);
    this.element.addEventListener('pointerup', this.handlePointerUp);
    this.element.addEventListener('pointercancel', this.handlePointerCancel);
  }
  
  // Stop capturing events
  stop(): void {
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointercancel', this.handlePointerCancel);
    
    this.onMove = null;
    this.onEnd = null;
  }
  
  private handlePointerDown(e: PointerEvent): void {
    e.preventDefault();
    
    // Max 2 active pointers
    if (this.activePointers.size >= 2) {
      return;
    }
    
    // Set pointer capture for smooth tracking
    if ('setPointerCapture' in e.target!) {
      (e.target as Element).setPointerCapture(e.pointerId);
    }
    
    const now = performance.now();
    const index = this.activePointers.size;
    this.activePointers.set(e.pointerId, index);
    
    if (index === 0) {
      this.state.p0x = e.clientX;
      this.state.p0y = e.clientY;
      this.state.p0t = now;
    } else {
      this.state.p1x = e.clientX;
      this.state.p1y = e.clientY;
      this.state.p1t = now;
    }
    
    this.state.activeCount = this.activePointers.size;
  }
  
  private handlePointerMove(e: PointerEvent): void {
    e.preventDefault();
    
    const index = this.activePointers.get(e.pointerId);
    if (index === undefined) {
      return;
    }
    
    const now = performance.now();
    
    if (index === 0) {
      this.state.p0x = e.clientX;
      this.state.p0y = e.clientY;
      this.state.p0t = now;
    } else {
      this.state.p1x = e.clientX;
      this.state.p1y = e.clientY;
      this.state.p1t = now;
    }
    
    if (this.onMove) {
      this.onMove(this.state);
    }
  }
  
  private handlePointerUp(e: PointerEvent): void {
    e.preventDefault();
    this.removePointer(e.pointerId);
    
    if (this.onEnd) {
      this.onEnd(this.state);
    }
  }
  
  private handlePointerCancel(e: PointerEvent): void {
    e.preventDefault();
    this.removePointer(e.pointerId);
    
    if (this.onEnd) {
      this.onEnd(this.state);
    }
  }
  
  private removePointer(pointerId: number): void {
    const index = this.activePointers.get(pointerId);
    if (index === undefined) {
      return;
    }
    
    this.activePointers.delete(pointerId);
    
    // If we removed pointer 0 and pointer 1 exists, swap them
    if (index === 0 && this.activePointers.size === 1) {
      // Find the remaining pointer
      for (const [id, idx] of this.activePointers.entries()) {
        if (idx === 1) {
          this.activePointers.set(id, 0);
          this.state.p0x = this.state.p1x;
          this.state.p0y = this.state.p1y;
          this.state.p0t = this.state.p1t;
          break;
        }
      }
    }
    
    this.state.activeCount = this.activePointers.size;
  }
  
  // Get current pointer state
  getState(): PointerState {
    return { ...this.state };
  }
}
