/**
 * lib/gestures/touchGestures.ts
 *
 * Phase 9 §6: Touch gesture library — built-in support for pinch-to-zoom,
 * two-finger rotate, and three-finger swipe, integrated with the dual runtime.
 *
 * Pure, framework-agnostic gesture recognition engine. The React hook
 * (useTouchGestures) wraps this for component usage.
 *
 * Architecture justification:
 *   - docs/ARCHITECTURE.md §10: render-on-demand. Gesture handlers only
 *     fire callbacks — they never start render loops.
 *   - Pure logic module — no React, no DOM globals in the core recogniser.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

export type GestureType =
  | 'pinch'
  | 'rotate'
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'
  | 'pan'
  | 'tap'
  | 'long-press';

export interface GestureEvent {
  type: GestureType;
  /** Number of fingers involved */
  fingers: number;
  /** Center point of the gesture (viewport coords) */
  center: Vec2;
  /** For pinch: scale factor (1.0 = no change) */
  scale?: number;
  /** For rotate: rotation angle in radians */
  rotation?: number;
  /** For swipe: velocity in px/ms */
  velocity?: Vec2;
  /** For pan: delta from start */
  delta?: Vec2;
  /** Raw timestamp */
  timestamp: number;
}

export interface GestureCallbacks {
  onPinch?: (e: GestureEvent) => void;
  onRotate?: (e: GestureEvent) => void;
  onSwipe?: (e: GestureEvent) => void;
  onPan?: (e: GestureEvent) => void;
  onTap?: (e: GestureEvent) => void;
  onLongPress?: (e: GestureEvent) => void;
}

export interface GestureConfig {
  /** Minimum distance (px) to recognise a swipe */
  swipeThreshold?: number;
  /** Minimum velocity (px/ms) to recognise a swipe */
  swipeVelocity?: number;
  /** Long-press duration (ms) */
  longPressMs?: number;
  /** Minimum pinch delta to fire (prevents jitter) */
  pinchThreshold?: number;
  /** Minimum rotation angle (radians) to fire */
  rotateThreshold?: number;
  /** Maximum single-finger drift before a tap/long-press is cancelled */
  tapMaxMovement?: number;
  /** Minimum single-finger movement before pan starts */
  panThreshold?: number;
}

const DEFAULT_CONFIG: Required<GestureConfig> = {
  swipeThreshold: 50,
  swipeVelocity: 0.3,
  longPressMs: 500,
  pinchThreshold: 0.02,
  rotateThreshold: 0.05,
  tapMaxMovement: 10,
  panThreshold: 4,
};

// ─── Utility functions ────────────────────────────────────────────────────────

function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function angle(a: Vec2, b: Vec2): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function angleDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function touchToVec2(touch: Touch): Vec2 {
  return { x: touch.clientX, y: touch.clientY };
}

interface TrackedTouch {
  id: number;
  point: Vec2;
}

function touchIdentifier(touch: Touch): number {
  return typeof touch.identifier === 'number' ? touch.identifier : 0;
}

function trackTouches(touches: Touch[]): TrackedTouch[] {
  return touches.map((touch) => ({
    id: touchIdentifier(touch),
    point: touchToVec2(touch),
  }));
}

function centroid(touches: Touch[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const t of touches) {
    x += t.clientX;
    y += t.clientY;
  }
  return { x: x / touches.length, y: y / touches.length };
}

// ─── Gesture Recogniser ───────────────────────────────────────────────────────

export class GestureRecogniser {
  private callbacks: GestureCallbacks;
  private config: Required<GestureConfig>;
  private element: HTMLElement | null = null;

  // Touch tracking state
  private startTouches: TrackedTouch[] = [];
  private startTime = 0;
  private lastCenter: Vec2 = { x: 0, y: 0 };
  private lastDist = 0;
  private lastAngle = 0;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private gestureStarted = false;

  constructor(callbacks: GestureCallbacks, config?: GestureConfig) {
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Attach to a DOM element. Returns a detach function. */
  attach(el: HTMLElement): () => void {
    this.element = el;

    const onStart = this.handleTouchStart.bind(this);
    const onMove = this.handleTouchMove.bind(this);
    const onEnd = this.handleTouchEnd.bind(this);
    const onCancel = this.handleTouchCancel.bind(this);

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
      this.clearLongPress();
      this.element = null;
      this.resetGestureState();
    };
  }

  private clearLongPress() {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTouchStart(e: TouchEvent) {
    const touches = Array.from(e.touches);
    this.startTouches = trackTouches(touches);
    this.startTime = Date.now();
    this.gestureStarted = false;

    if (touches.length === 1) {
      // Potential tap or long-press
      this.clearLongPress();
      const center = touchToVec2(touches[0]);
      this.longPressTimer = setTimeout(() => {
        this.callbacks.onLongPress?.({
          type: 'long-press',
          fingers: 1,
          center,
          timestamp: Date.now(),
        });
        this.gestureStarted = true;
      }, this.config.longPressMs);
    }

    if (touches.length === 2) {
      this.clearLongPress();
      const a = touchToVec2(touches[0]);
      const b = touchToVec2(touches[1]);
      this.lastDist = distance(a, b);
      this.lastAngle = angle(a, b);
      this.lastCenter = midpoint(a, b);
      e.preventDefault();
    }

    if (touches.length >= 3) {
      this.clearLongPress();
      this.lastCenter = centroid(touches);
      e.preventDefault();
    }
  }

  private handleTouchMove(e: TouchEvent) {
    const touches = Array.from(e.touches);
    if (touches.length !== 1) {
      this.clearLongPress();
    }

    if (touches.length === 1) {
      const pos = touchToVec2(touches[0]);
      const start = this.startTouches[0]?.point;
      if (start) {
        const delta = { x: pos.x - start.x, y: pos.y - start.y };
        const deltaDistance = distance(pos, start);
        if (deltaDistance > this.config.tapMaxMovement) {
          this.clearLongPress();
        }
        if (!this.callbacks.onPan) {
          return;
        }
        if (
          !this.gestureStarted &&
          deltaDistance < this.config.panThreshold
        ) {
          return;
        }
        this.gestureStarted = true;
        this.callbacks.onPan({
          type: 'pan',
          fingers: 1,
          center: pos,
          delta,
          timestamp: Date.now(),
        });
      }
      return;
    }

    if (touches.length === 2) {
      e.preventDefault();
      const a = touchToVec2(touches[0]);
      const b = touchToVec2(touches[1]);
      const dist = distance(a, b);
      const ang = angle(a, b);
      const center = midpoint(a, b);

      // Pinch
      if (this.lastDist > 0) {
        const scale = dist / this.lastDist;
        if (Math.abs(scale - 1.0) > this.config.pinchThreshold) {
          this.gestureStarted = true;
          this.callbacks.onPinch?.({
            type: 'pinch',
            fingers: 2,
            center,
            scale,
            timestamp: Date.now(),
          });
        }
      }

      // Rotate
      const dAngle = angleDelta(this.lastAngle, ang);
      if (Math.abs(dAngle) > this.config.rotateThreshold) {
        this.gestureStarted = true;
        this.callbacks.onRotate?.({
          type: 'rotate',
          fingers: 2,
          center,
          rotation: dAngle,
          timestamp: Date.now(),
        });
      }

      this.lastDist = dist;
      this.lastAngle = ang;
      this.lastCenter = center;
    }

    if (touches.length >= 3) {
      e.preventDefault();
      // Three-finger movement tracked for swipe detection on end
      this.lastCenter = centroid(touches);
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    this.clearLongPress();
    const now = Date.now();
    const dt = now - this.startTime;

    // Single-finger tap detection
    if (
      !this.gestureStarted &&
      e.touches.length === 0 &&
      this.startTouches.length === 1 &&
      dt < 300
    ) {
      const start = this.startTouches[0]?.point;
      if (!start) {
        this.resetGestureState();
        return;
      }
      const endTouch = e.changedTouches?.[0];
      if (endTouch && distance(start, touchToVec2(endTouch)) > this.config.tapMaxMovement) {
        this.resetGestureState();
        return;
      }
      this.callbacks.onTap?.({
        type: 'tap',
        fingers: 1,
        center: start,
        timestamp: now,
      });
      return;
    }

    // Three-finger swipe detection
    if (
      this.startTouches.length >= 3 &&
      e.touches.length === 0 &&
      dt > 0
    ) {
      const startCenter = centroid(
        this.startTouches.map(({ point }) => ({
          clientX: point.x,
          clientY: point.y,
        }) as unknown as Touch),
      );
      const dx = this.lastCenter.x - startCenter.x;
      const dy = this.lastCenter.y - startCenter.y;
      const dist_val = Math.sqrt(dx * dx + dy * dy);
      const vel = dist_val / dt;

      if (
        dist_val >= this.config.swipeThreshold &&
        vel >= this.config.swipeVelocity
      ) {
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        let type: GestureType;
        if (isHorizontal) {
          type = dx > 0 ? 'swipe-right' : 'swipe-left';
        } else {
          type = dy > 0 ? 'swipe-down' : 'swipe-up';
        }

        this.callbacks.onSwipe?.({
          type,
          fingers: this.startTouches.length,
          center: this.lastCenter,
          velocity: { x: dx / dt, y: dy / dt },
          timestamp: now,
        });
      }
    }

    // Reset state when all fingers lifted
    if (e.touches.length === 0) {
      this.resetGestureState();
    }
  }

  private handleTouchCancel(_e: TouchEvent) {
    this.clearLongPress();
    this.resetGestureState();
  }

  private resetGestureState() {
    this.startTouches = [];
    this.startTime = 0;
    this.lastCenter = { x: 0, y: 0 };
    this.lastDist = 0;
    this.lastAngle = 0;
    this.gestureStarted = false;
  }
}
