/**
 * lib/gameengin/xr.ts
 *
 * NEXT-GEN — WebXR / spatial reality parity.
 *
 *  - WebXRSession         — Session lifecycle wrapper (immersive-vr / immersive-ar)
 *  - HandTrackingInput    — Hand tracking → unified input bridge
 *  - PassthroughComposite — Passthrough AR + spatial anchor composer
 *
 * SSR-safe: navigator.xr is feature-detected before any access.
 */

export type XRMode = 'immersive-vr' | 'immersive-ar' | 'inline';

interface XRSystemLike {
  isSessionSupported(mode: XRMode): Promise<boolean>;
  requestSession(mode: XRMode, init?: unknown): Promise<XRSessionLike>;
}

interface XRSessionLike {
  end(): Promise<void>;
  addEventListener(type: 'end', cb: () => void): void;
}

function getXRSystem(: XRSystemLike | null) {
  if (typeof navigator === 'undefined') return null;
  const xr = (navigator as Navigator & { xr?: XRSystemLike }).xr;
  return xr ?? null;
}

/**
 * Wraps an XRSession's lifecycle with safe creation, end, and 2D-fallback hooks.
 */
export class WebXRSession {
  private readonly mode: XRMode;
  private session: XRSessionLike | null = null;
  private fallbackInvoked = false;
  private onEnd: (() => void) | null = null;

  constructor(mode: XRMode = 'immersive-vr') {
    this.mode = mode;
  }

  /** Returns true when the requested mode is supported by the device. */
  async isSupported(): Promise<boolean> {
    const xr = getXRSystem();
    if (!xr) return false;
    try {
      return await xr.isSessionSupported(this.mode);
    } catch {
      return false;
    }
  }

  /** Begin the XR session. Returns false on failure (caller should fall back). */
  async begin(init?: unknown): Promise<boolean> {
    const xr = getXRSystem();
    if (!xr) { this.fallbackInvoked = true; return false; }
    try {
      this.session = await xr.requestSession(this.mode, init);
      this.session.addEventListener('end', () => {
        this.session = null;
        if (this.onEnd) this.onEnd();
      });
      return true;
    } catch {
      this.fallbackInvoked = true;
      return false;
    }
  }

  setOnEnd(cb: () => void): void { this.onEnd = cb; }

  async end(): Promise<void> {
    const s = this.session;
    if (!s) return;
    this.session = null;
    try { await s.end(); } catch { /* swallow — session may already be gone */ }
  }

  get isActive(): boolean { return this.session !== null; }
  get currentMode(): XRMode { return this.mode; }
  get didFallBack(): boolean { return this.fallbackInvoked; }
}

// ─────────────────────────────────────────────────────────────────────────────

export type HandJoint =
  | 'wrist'
  | 'thumb-tip' | 'index-tip' | 'middle-tip' | 'ring-tip' | 'pinky-tip';

export interface HandPose {
  side: 'left' | 'right';
  joints: Partial<Record<HandJoint, [number, number, number]>>;
  confidence: number;
}

export type UnifiedAction = 'select' | 'cancel' | 'menu' | 'pinch' | 'grab' | 'point';

/**
 * Maps hand-tracking poses to the same UnifiedAction set used by gamepad and
 * touch input, so gameplay code can treat all input modalities equivalently.
 */
export class HandTrackingInput {
  private subscribers: Array<(side: 'left' | 'right', action: UnifiedAction) => void> = [];
  private lastPinch = { left: false, right: false };

  onAction(cb: (side: 'left' | 'right', action: UnifiedAction) => void): () => void {
    this.subscribers.push(cb);
    return () => { this.subscribers = this.subscribers.filter((s: Record<string, unknown>) => s !== cb); };
  }

  /** Feed a pose snapshot; emits actions on rising edges. */
  ingest(pose: HandPose): void {
    const thumb = pose.joints['thumb-tip'];
    const index = pose.joints['index-tip'];
    if (!thumb || !index || pose.confidence < 0.4) return;
    const dx = thumb[0] - index[0];
    const dy = thumb[1] - index[1];
    const dz = thumb[2] - index[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const isPinching = dist < 0.025;
    const wasPinching = this.lastPinch[pose.side];
    this.lastPinch[pose.side] = isPinching;
    if (isPinching && !wasPinching) this.emit(pose.side, 'pinch');
    else if (isPinching && wasPinching) this.emit(pose.side, 'select');
  }

  private emit(side: 'left' | 'right', action: UnifiedAction): void {
    for (const sub of this.subscribers) sub(side, action);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export interface SpatialAnchor {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  /** Whether the anchor has been persisted across sessions. */
  persistent: boolean;
}

/**
 * Composes passthrough AR camera output with the engine's rendered overlay,
 * and tracks spatial anchors that persist across XR sessions.
 */
export class PassthroughComposite {
  private anchors = new Map<string, SpatialAnchor>();
  private passthroughEnabled = false;
  private overlayOpacity = 1;

  enablePassthrough(enabled: boolean): void { this.passthroughEnabled = enabled; }
  setOverlayOpacity(opacity: number): void {
    this.overlayOpacity = Math.min(1, Math.max(0, opacity));
  }

  addAnchor(anchor: SpatialAnchor): void { this.anchors.set(anchor.id, anchor); }
  removeAnchor(id: string): boolean { return this.anchors.delete(id); }
  listAnchors(): SpatialAnchor[] { return Array.from(this.anchors.values()); }
  getAnchor(id: string): SpatialAnchor | undefined { return this.anchors.get(id); }

  /** Compositing recipe consumed by the renderer. */
  compositeRecipe(): { passthrough: boolean; opacity: number; anchorCount: number } {
    return {
      passthrough: this.passthroughEnabled,
      opacity: this.overlayOpacity,
      anchorCount: this.anchors.size,
    };
  }
}
