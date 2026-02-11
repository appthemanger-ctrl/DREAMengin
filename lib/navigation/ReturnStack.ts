// ReturnStack - Fixed-size ring buffer for navigation history
// No objects, no GC, mobile-optimized

const STACK_SIZE = 32;

/**
 * ReturnStack stores NavState snapshots in a fixed-size ring buffer
 * Each snapshot is Int32Array[4], stored as flat array for zero allocation
 */
export class ReturnStack {
  private buffer: Int32Array;
  private head: number;
  private count: number;
  
  constructor() {
    // Pre-allocate: STACK_SIZE snapshots * 4 values per snapshot
    this.buffer = new Int32Array(STACK_SIZE * 4);
    this.head = 0;
    this.count = 0;
  }
  
  // Push a snapshot onto the stack
  push(snapshot: Int32Array): void {
    if (this.count < STACK_SIZE) {
      this.count++;
    }
    
    const offset = this.head * 4;
    this.buffer[offset] = snapshot[0];     // layer
    this.buffer[offset + 1] = snapshot[1]; // face
    this.buffer[offset + 2] = snapshot[2]; // slot
    this.buffer[offset + 3] = snapshot[3]; // depth
    
    this.head = (this.head + 1) % STACK_SIZE;
  }
  
  // Pop a snapshot from the stack
  pop(): Int32Array | null {
    if (this.count === 0) {
      return null;
    }
    
    this.head = (this.head - 1 + STACK_SIZE) % STACK_SIZE;
    this.count--;
    
    const offset = this.head * 4;
    const snapshot = new Int32Array(4);
    snapshot[0] = this.buffer[offset];
    snapshot[1] = this.buffer[offset + 1];
    snapshot[2] = this.buffer[offset + 2];
    snapshot[3] = this.buffer[offset + 3];
    
    return snapshot;
  }
  
  // Peek at top without popping
  peek(): Int32Array | null {
    if (this.count === 0) {
      return null;
    }
    
    const peekIndex = (this.head - 1 + STACK_SIZE) % STACK_SIZE;
    const offset = peekIndex * 4;
    const snapshot = new Int32Array(4);
    snapshot[0] = this.buffer[offset];
    snapshot[1] = this.buffer[offset + 1];
    snapshot[2] = this.buffer[offset + 2];
    snapshot[3] = this.buffer[offset + 3];
    
    return snapshot;
  }
  
  // Check if stack is empty
  isEmpty(): boolean {
    return this.count === 0;
  }
  
  // Get stack size
  size(): number {
    return this.count;
  }
  
  // Clear the stack
  clear(): void {
    this.head = 0;
    this.count = 0;
  }
  
  // Pop until layer equals target (for HOME anchor interrupt)
  popUntilLayer(targetLayer: number): Int32Array | null {
    let lastSnapshot: Int32Array | null = null;
    
    while (this.count > 0) {
      const snapshot = this.peek();
      if (snapshot && snapshot[0] === targetLayer) {
        return this.pop();
      }
      lastSnapshot = this.pop();
    }
    
    return lastSnapshot;
  }
}
