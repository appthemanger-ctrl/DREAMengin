// DrEamsAnimator.ts
// Battery-aware sprite animator + interaction zones (head/stomach/feet)
// Works with a 24-frame sprite sheet arranged in a grid (cols x rows).
// Use in Next.js (App Router) with a <canvas>.

export type DrEamsAction = "idle" | "scan" | "fall" | "jump";

type SpriteSheet = {
  image: HTMLImageElement;
  frameW: number;
  frameH: number;
  cols: number;
  rows: number;
  totalFrames: number; // e.g. 24
};

type ActionDef = {
  name: DrEamsAction;
  frames: number[];      // ordered indices into the sheet (0..totalFrames-1)
  fps: number;           // target fps for this action
  loop: boolean;
  // optional easing between frames (micro-hold) for character feel:
  holdLastFrameMs?: number;
};

type AnimatorOptions = {
  canvas: HTMLCanvasElement;
  // ideal on iOS: render on demand, avoid continuous RAF when idle.
  renderOnlyWhenDirty?: boolean;
  // scale: 1 = native pixel size; set 2 for retina if needed (but battery cost)
  devicePixelRatio?: number;
};

export class DrEamsAnimator {
  private ctx: CanvasRenderingContext2D;
  private sheet: SpriteSheet;

  private actions: Record<DrEamsAction, ActionDef>;
  private current: ActionDef;
  private frameIdx = 0;

  private playing = false;
  private rafId: number | null = null;
  private lastTs = 0;
  private acc = 0;

  private dirty = true;
  private dpr: number;
  private renderOnlyWhenDirty: boolean;

  // Optional: "passive 30fps / active 60fps" policy
  private activeUntilTs = 0;

  constructor(sheet: SpriteSheet, actions: Record<DrEamsAction, ActionDef>, opts: AnimatorOptions) {
    this.sheet = sheet;
    this.actions = actions;
    this.current = actions.idle;

    const ctx = opts.canvas.getContext("2d", { alpha: true })!;
    this.ctx = ctx;

    this.renderOnlyWhenDirty = opts.renderOnlyWhenDirty ?? true;
    this.dpr = opts.devicePixelRatio ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);

    this.configureCanvas(opts.canvas);
    this.draw(); // initial
  }

  private configureCanvas(canvas: HTMLCanvasElement) {
    // keep canvas CSS size as-is; set internal bitmap size for crispness
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * this.dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.dirty = true;
  }

  // Call on resize/orientation change
  public resize() {
    this.configureCanvas(this.ctx.canvas);
    this.requestDraw();
  }

  public setAction(name: DrEamsAction) {
    const next = this.actions[name];
    if (!next) return;

    // If already in that action and looping, ignore
    if (this.current.name === name && this.current.loop) return;

    this.current = next;
    this.frameIdx = 0;
    this.acc = 0;
    this.lastTs = 0;
    this.markActive();
    this.play();
  }

  public play() {
    if (this.playing) return;
    this.playing = true;
    this.lastTs = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  public stop() {
    this.playing = false;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private markActive() {
    // treat input as "active interaction" for ~1.2s => 60fps
    this.activeUntilTs = performance.now() + 1200;
  }

  private getTargetFps() {
    const now = performance.now();
    // Active interactions at full fps; passive falls back to 30
    return now < this.activeUntilTs ? 60 : 30;
  }

  private tick = (ts: number) => {
    if (!this.playing) return;

    if (this.lastTs === 0) this.lastTs = ts;
    const dt = ts - this.lastTs;
    this.lastTs = ts;

    // throttle animation time to policy fps (helps battery)
    // We still RAF, but we only advance frames when enough time passes.
    const policyFps = this.getTargetFps();
    const dtCap = 1000 / policyFps;

    this.acc += dt;
    while (this.acc >= dtCap) {
      this.acc -= dtCap;
      this.step(dtCap);
    }

    if (!this.renderOnlyWhenDirty || this.dirty) {
      this.draw();
      this.dirty = false;
    }

    // If idle and renderOnlyWhenDirty, we can stop RAF after a frame
    if (this.renderOnlyWhenDirty && this.current.name === "idle") {
      // keep a tiny micro-loop if idle wants it, otherwise stop after drawn once
      if (!this.current.loop) this.stop();
    } else {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  private step(_dtMs: number) {
    const { frames, fps, loop, holdLastFrameMs } = this.current;

    const frameTime = 1000 / fps;

    // advance one frame per step, but you can also do time-based stepping.
    // Here we do controlled stepping via dtCap, so just increment by 1.
    const atLast = this.frameIdx >= frames.length - 1;

    if (atLast) {
      if (holdLastFrameMs && holdLastFrameMs > 0) {
        // crude hold: use accumulator debt by not advancing for a bit
        // (Good enough for sprite “settle” moments)
        this.acc -= Math.min(this.acc, holdLastFrameMs);
      }

      if (loop) {
        this.frameIdx = 0;
        this.requestDraw();
      } else {
        // finish action -> return to idle
        if (this.current.name !== "idle") {
          this.setAction("idle");
        } else {
          this.requestDraw();
        }
      }
      return;
    }

    // only advance if enough time would pass at action fps
    // (dtCap already policy-throttled; this is extra for per-action fps)
    // We use a simple fractional gate by comparing dtCap to frameTime:
    // If action fps is lower, we skip some steps.
    const gate = frameTime / (1000 / this.getTargetFps());
    // gate ~ 2 means "advance every 2 policy steps"
    // We'll approximate using modulo logic:
    const stepNumber = Math.floor(performance.now() / (1000 / this.getTargetFps()));
    const shouldAdvance = gate <= 1 ? true : (stepNumber % Math.round(gate) === 0);

    if (shouldAdvance) {
      this.frameIdx++;
      this.requestDraw();
    }
  }

  private requestDraw() {
    this.dirty = true;
    if (this.renderOnlyWhenDirty && !this.playing) this.play();
  }

  private draw() {
    const canvas = this.ctx.canvas;
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    this.ctx.clearRect(0, 0, w, h);

    const frame = this.current.frames[this.frameIdx] ?? 0;
    const sx = (frame % this.sheet.cols) * this.sheet.frameW;
    const sy = Math.floor(frame / this.sheet.cols) * this.sheet.frameH;

    // Fit sprite centered, preserving aspect
    const scale = Math.min(w / this.sheet.frameW, h / this.sheet.frameH);
    const dw = this.sheet.frameW * scale;
    const dh = this.sheet.frameH * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.drawImage(
      this.sheet.image,
      sx, sy, this.sheet.frameW, this.sheet.frameH,
      dx, dy, dw, dh
    );
  }

  // --- Interaction hit zones (normalized 0..1 in sprite space) ---
  // You can tune these numbers to match your character.
  public handlePointer(xPx: number, yPx: number) {
    this.markActive();

    const rect = this.ctx.canvas.getBoundingClientRect();
    const x = (xPx - rect.left) / rect.width;
    const y = (yPx - rect.top) / rect.height;

    // Zones: head (top 0.00-0.35), stomach (0.35-0.70), feet (0.70-1.00)
    if (y < 0.35) {
      this.setAction("scan");
      return;
    }
    if (y < 0.70) {
      this.setAction("fall");
      return;
    }
    this.setAction("jump");
  }
}