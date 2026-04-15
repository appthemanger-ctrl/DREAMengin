// SpatialNavigationEngine - Main engine coordinating all subsystems
// Mobile-optimized: 60fps target, zero allocations per frame

import { NavStateBuffer, LAYER_HOME } from './NavStateBuffer';
import { ReturnStack } from './ReturnStack';
import { PointerEventCapture } from './PointerEventCapture';
import { GestureFrameComputer } from './GestureFrameComputer';
import { GestureIntentResolver, GestureIntent } from './GestureIntentResolver';
import { TransformSolver, type ViewportMetrics } from './TransformSolver';
import { WidgetInstanceMemory } from './WidgetInstanceMemory';

export interface EngineConfig {
  element?: HTMLElement | Document;
  enablePersistence?: boolean;
}

export type EngineEventType = 'navchange' | 'gesture' | 'error';
export type EngineEventCallback = (data: unknown) => void;

/**
 * SpatialNavigationEngine - Main coordination engine
 * 
 * RUNTIME EXECUTION ORDER (FIXED):
 * 1. Pointer event capture
 * 2. Gesture frame construction
 * 3. Gesture intent resolution
 * 4. Navigation state mutation
 * 5. Transform solving
 * 6. Single DOM write batch
 * 7. Compositor handoff
 */
export class SpatialNavigationEngine {
  // Core runtime objects
  private navState: NavStateBuffer;
  private returnStack: ReturnStack;
  private pointerCapture: PointerEventCapture;
  private frameComputer: GestureFrameComputer;
  private intentResolver: GestureIntentResolver;
  private transformSolver: TransformSolver;
  private widgetMemory: WidgetInstanceMemory;
  
  // Secondary home anchor
  private secondaryHomeSnapshot: Int32Array | null;

  // Animation loop
  private rafId: number | null;
  private isRunning: boolean;
  
  // Event listeners
  private listeners: Map<EngineEventType, Set<EngineEventCallback>>;
  
  // Config
  private config: EngineConfig;
  
  constructor(config: EngineConfig = {}) {
    this.config = config;
    this.secondaryHomeSnapshot = null;
    
    // Initialize subsystems
    this.navState = new NavStateBuffer();
    this.returnStack = new ReturnStack();
    this.pointerCapture = new PointerEventCapture(config.element);
    this.frameComputer = new GestureFrameComputer();
    this.intentResolver = new GestureIntentResolver();
    this.transformSolver = new TransformSolver();
    this.widgetMemory = new WidgetInstanceMemory();
    
    this.rafId = null;
    this.isRunning = false;
    this.listeners = new Map();
    
    // Bind methods
    this.tick = this.tick.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerEnd = this.handlePointerEnd.bind(this);
  }
  
  /**
   * Start the engine
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.pointerCapture.start(this.handlePointerMove, this.handlePointerEnd);
    this.rafId = requestAnimationFrame(this.tick);
  }
  
  /**
   * Stop the engine
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.pointerCapture.stop();
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  /**
   * Main tick - runs every animation frame
   */
  private tick(now: number): void {
    if (!this.isRunning) return;
    
    // Schedule next frame
    this.rafId = requestAnimationFrame(this.tick);
    
    // Sync quaternion state between intent resolver and transform solver
    const currentQuat = this.intentResolver.getOrientation();
    this.transformSolver.setOrientation(currentQuat);
    
    // Invariant enforcement
    if (!this.navState.isValid()) {
      this.forceReturn();
      this.emit('error', { type: 'invariant_violation', state: this.navState.toString() });
    }
    
    // Persist state during idle (if enabled)
    if (this.config.enablePersistence) {
      this.schedulePersistence();
    }
  }
  
  /**
   * Handle pointer move
   */
  private handlePointerMove(state: any): void {
    const now = performance.now();
    
    // Start gesture if not already active
    if (!this.intentResolver.isActive()) {
      this.intentResolver.startGesture(now);
    }
    
    // Compute gesture frame
    const frame = this.frameComputer.compute(state, now);
    
    // Resolve intent
    const resolved = this.intentResolver.resolve(frame, now);
    
    // Execute navigation mutation
    this.executeIntent(resolved.intent, resolved.magnitude);
    
    // Emit gesture event
    this.emit('gesture', { intent: resolved.intent, magnitude: resolved.magnitude });
  }
  
  /**
   * Handle pointer end
   */
  private handlePointerEnd(): void {
    this.intentResolver.endGesture();
    this.frameComputer.reset();
  }
  
  /**
   * Execute navigation intent (atomic mutation)
   */
  private executeIntent(intent: GestureIntent, magnitude: number): void {
    const prevSnapshot = this.navState.snapshot();
    let mutated = false;
    
    switch (intent) {
      case GestureIntent.ZOOM_IN:
        this.returnStack.push(prevSnapshot);
        this.navState.incrementDepth();
        mutated = true;
        break;
        
      case GestureIntent.ZOOM_OUT:
        if (!this.navState.decrementDepth()) {
          // Depth is 0, pop return stack
          const snapshot = this.returnStack.pop();
          if (snapshot) {
            this.navState.restore(snapshot);
            mutated = true;
          }
        } else {
          mutated = true;
        }
        break;
        
      case GestureIntent.ROTATE_X:
        this.returnStack.push(prevSnapshot);
        this.navState.rotateFace(magnitude > 0 ? 1 : -1);
        mutated = true;
        break;
        
      case GestureIntent.ROTATE_Y:
        this.returnStack.push(prevSnapshot);
        this.navState.rotateFace(magnitude > 0 ? 1 : -1);
        mutated = true;
        break;
    }
    
    if (mutated) {
      this.emit('navchange', { state: this.navState.snapshot() });
    }
  }
  
  /**
   * Force return to safe state
   */
  private forceReturn(): void {
    const snapshot = this.returnStack.pop();
    if (snapshot) {
      this.navState.restore(snapshot);
    } else {
      this.navState.reset();
    }
  }
  
  /**
   * HOME anchor interrupt
   */
  homeAnchorInterrupt(): void {
    this.intentResolver.cancel();
    
    const homeSnapshot = this.returnStack.popUntilLayer(LAYER_HOME);
    if (homeSnapshot) {
      this.navState.restore(homeSnapshot);
    }
    
    this.navState.depth = 0;
    this.emit('navchange', { state: this.navState.snapshot() });
  }

  /**
   * Secondary Home Anchor
   * Behavior:
   * - First press: stores current state as secondary anchor and returns HOME
   * - Second press: returns to stored secondary anchor
   */
  homeAnchorSecondary(): void {
    this.intentResolver.cancel();

    if (this.secondaryHomeSnapshot) {
      this.navState.restore(this.secondaryHomeSnapshot);
      this.secondaryHomeSnapshot = null;
      this.emit("navchange", { state: this.navState.snapshot() });
      return;
    }

    this.secondaryHomeSnapshot = this.navState.snapshot();
    const homeSnapshot = this.returnStack.popUntilLayer(LAYER_HOME);
    if (homeSnapshot) {
      this.navState.restore(homeSnapshot);
    }

    this.navState.depth = 0;
    this.emit("navchange", { state: this.navState.snapshot() });
  }

  
  /**
   * Schedule persistence during idle
   */
  private schedulePersistence(): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.persist();
      });
    }
  }
  
  /**
   * Persist navigation state
   */
  private persist(): void {
    try {
      const stateData = {
        navState: Array.from(this.navState.snapshot()),
        returnStackTop: this.returnStack.peek() ? Array.from(this.returnStack.peek()!) : null,
      };
      localStorage.setItem('nav_state', JSON.stringify(stateData));
    } catch (e) {
      // Ignore persistence errors
    }
  }
  
  /**
   * Restore persisted state
   */
  restore(): void {
    try {
      const data = localStorage.getItem('nav_state');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.navState) {
          this.navState.restore(new Int32Array(parsed.navState));
        }
      }
    } catch (e) {
      // Ignore restoration errors
    }
  }
  
  /**
   * Get current navigation state
   */
  getNavState(): NavStateBuffer {
    return this.navState;
  }
  
  /**
   * Get widget memory
   */
  getWidgetMemory(): WidgetInstanceMemory {
    return this.widgetMemory;
  }
  
  /**
   * Compute transform for current state
   */
  computeTransform(viewport: ViewportMetrics) {
    return this.transformSolver.solve(this.navState, viewport);
  }
  
  /**
   * Apply transform to element
   */
  applyTransform(element: HTMLElement, viewport: ViewportMetrics): void {
    const transform = this.computeTransform(viewport);
    this.transformSolver.apply(element, transform);
  }
  
  /**
   * Event emitter
   */
  on(event: EngineEventType, callback: EngineEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  off(event: EngineEventType, callback: EngineEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }
  
  private emit(event: EngineEventType, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}
