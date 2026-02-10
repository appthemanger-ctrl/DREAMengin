// NavStateBuffer - Ultra-low-level navigation state
// Stored outside React, no allocation per frame
// Mobile-optimized: numeric only, zero GC pressure

// Layer constants
export const LAYER_HOME = 0;
export const LAYER_CUBE = 1;
export const LAYER_PROFILE = 2;
export const LAYER_WIDGET = 3;
export const LAYER_DREAM = 4;

// Profile depth constant
export const PROFILE_DEPTH = 1;
export const FULLSCREEN_DEPTH = 2;

/**
 * NavStateBuffer layout (Int32Array[4]):
 * [0] layer   (0=HOME,1=CUBE,2=PROFILE,3=WIDGET,4=DREAM)
 * [1] face    (0–5)
 * [2] slot    (-1=null,0–7)
 * [3] depth   (>=0)
 */
export class NavStateBuffer {
  private buffer: Int32Array;
  
  constructor() {
    // Allocate once, never reallocate
    this.buffer = new Int32Array(4);
    this.reset();
  }
  
  reset(): void {
    this.buffer[0] = LAYER_HOME;
    this.buffer[1] = 0;
    this.buffer[2] = -1;
    this.buffer[3] = 0;
  }
  
  // Getters (no allocation)
  get layer(): number {
    return this.buffer[0];
  }
  
  get face(): number {
    return this.buffer[1];
  }
  
  get slot(): number {
    return this.buffer[2];
  }
  
  get depth(): number {
    return this.buffer[3];
  }
  
  // Setters (direct mutation)
  set layer(value: number) {
    this.buffer[0] = value;
  }
  
  set face(value: number) {
    this.buffer[1] = value;
  }
  
  set slot(value: number) {
    this.buffer[2] = value;
  }
  
  set depth(value: number) {
    this.buffer[3] = value;
  }
  
  // Atomic operations
  incrementDepth(): void {
    this.buffer[3] += 1;
  }
  
  decrementDepth(): boolean {
    if (this.buffer[3] > 0) {
      this.buffer[3] -= 1;
      return true;
    }
    return false;
  }
  
  rotateFace(delta: number): void {
    this.buffer[1] = (this.buffer[1] + delta + 6) % 6;
  }
  
  // Snapshot for ReturnStack (returns copy, not reference)
  snapshot(): Int32Array {
    return new Int32Array(this.buffer);
  }
  
  // Restore from snapshot
  restore(snapshot: Int32Array): void {
    this.buffer[0] = snapshot[0];
    this.buffer[1] = snapshot[1];
    this.buffer[2] = snapshot[2];
    this.buffer[3] = snapshot[3];
  }
  
  // Invariant checking
  isValid(): boolean {
    return (
      this.depth >= 0 &&
      this.face >= 0 && this.face <= 5 &&
      (this.slot === -1 || (this.slot >= 0 && this.slot <= 7))
    );
  }
  
  // Profile activation check
  isProfileActive(): boolean {
    return this.layer === LAYER_PROFILE && this.depth === PROFILE_DEPTH;
  }
  
  // Fullscreen check
  isFullscreen(): boolean {
    return this.depth >= FULLSCREEN_DEPTH;
  }
  
  // String representation for debugging
  toString(): string {
    const layerNames = ['HOME', 'CUBE', 'PROFILE', 'WIDGET', 'DREAM'];
    return `NavState{layer=${layerNames[this.layer] || this.layer}, face=${this.face}, slot=${this.slot}, depth=${this.depth}}`;
  }
}
