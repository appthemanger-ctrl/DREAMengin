// AnchorStateBuffer - Ultra-low-level anchor widget state
// Stored outside React, no allocation per frame
// Mobile-optimized: numeric only, zero GC pressure

// Mode constants
export const MODE_HOME = 0;
export const MODE_PROFILE = 1;
export const MODE_SHRUNK = 2;

// Hold latch states
export const HOLD_IDLE = 0;
export const HOLD_HOLDING = 1;
export const HOLD_FIRED = 2;

/**
 * AnchorStateBuffer layout (Int32Array[4]):
 * [0] mode         (0=HOME, 1=PROFILE, 2=SHRUNK)
 * [1] isOpen       (0=closed, 1=open)
 * [2] holdLatch    (0=idle, 1=holding, 2=fired)
 * [3] prevMode     (0=HOME, 1=PROFILE) -- last non-shrunk mode for restore
 */
export class AnchorStateBuffer {
  private buffer: Int32Array;
  
  constructor() {
    // Allocate once, never reallocate
    this.buffer = new Int32Array(4);
    this.reset();
  }
  
  reset(): void {
    this.buffer[0] = MODE_HOME;
    this.buffer[1] = 0; // closed
    this.buffer[2] = HOLD_IDLE;
    this.buffer[3] = MODE_HOME;
  }
  
  // Getters (no allocation)
  get mode(): number {
    return this.buffer[0];
  }
  
  get isOpen(): boolean {
    return this.buffer[1] === 1;
  }
  
  get holdLatch(): number {
    return this.buffer[2];
  }
  
  get prevMode(): number {
    return this.buffer[3];
  }
  
  // Setters (direct mutation)
  set mode(value: number) {
    // Save previous mode if transitioning from non-shrunk mode
    if (this.buffer[0] !== MODE_SHRUNK && value === MODE_SHRUNK) {
      this.buffer[3] = this.buffer[0];
    }
    this.buffer[0] = value;
  }
  
  set isOpen(value: boolean) {
    this.buffer[1] = value ? 1 : 0;
  }
  
  set holdLatch(value: number) {
    this.buffer[2] = value;
  }
  
  set prevMode(value: number) {
    this.buffer[3] = value;
  }
  
  // Atomic operations
  open(): void {
    this.buffer[1] = 1;
  }
  
  close(): void {
    this.buffer[1] = 0;
  }
  
  toggleOpen(): void {
    this.buffer[1] = this.buffer[1] === 1 ? 0 : 1;
  }
  
  // Mode transitions
  switchToHome(): void {
    this.buffer[3] = this.buffer[0]; // Save current as prev
    this.buffer[0] = MODE_HOME;
  }
  
  switchToProfile(): void {
    this.buffer[3] = this.buffer[0]; // Save current as prev
    this.buffer[0] = MODE_PROFILE;
  }
  
  switchToShrunk(): void {
    // Only save prevMode if currently not shrunk
    if (this.buffer[0] !== MODE_SHRUNK) {
      this.buffer[3] = this.buffer[0];
    }
    this.buffer[0] = MODE_SHRUNK;
  }
  
  restoreFromShrunk(): void {
    if (this.buffer[0] === MODE_SHRUNK) {
      this.buffer[0] = this.buffer[3]; // Restore previous mode
    }
  }
  
  // Snapshot for persistence
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
      (this.buffer[0] === MODE_HOME || 
       this.buffer[0] === MODE_PROFILE || 
       this.buffer[0] === MODE_SHRUNK) &&
      (this.buffer[1] === 0 || this.buffer[1] === 1) &&
      (this.buffer[2] === HOLD_IDLE || 
       this.buffer[2] === HOLD_HOLDING || 
       this.buffer[2] === HOLD_FIRED) &&
      (this.buffer[3] === MODE_HOME || this.buffer[3] === MODE_PROFILE)
    );
  }
  
  // String representation for debugging
  toString(): string {
    const modeNames = ['HOME', 'PROFILE', 'SHRUNK'];
    const holdNames = ['IDLE', 'HOLDING', 'FIRED'];
    return `AnchorState{mode=${modeNames[this.buffer[0]]}, isOpen=${this.buffer[1] === 1}, holdLatch=${holdNames[this.buffer[2]]}, prevMode=${modeNames[this.buffer[3]]}}`;
  }
}
