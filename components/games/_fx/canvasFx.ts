/**
 * Shared 2-D-canvas FX kit for the 9 DREAMengin fusion cartridges.
 *
 * Zero-dep, allocation-aware helpers for the look the user calls "PS1/PS2/
 * Dreamcast retro-modern + restrained bloom + dithered gradients":
 *
 *   - `ParticlePool`     — pooled radial particles with colour/lifespan.
 *   - `ScreenShake`      — exponential-decay screen-shake offsets.
 *   - `drawDitherFog`    — Bayer-style dot fog overlay across a band.
 *   - `ParallaxLayers`   — multi-speed scrolling background painter.
 *   - `prefersReducedMotion` — respect OS-level a11y preference.
 *   - `freezeFrame`      — N-frame hitstop helper.
 *   - `motionTrail`      — low-alpha previous-frame stamping helper.
 *
 * Designed to be tree-shake-friendly — every export is a free function or
 * tiny class so cartridges can pick the bits they need without dragging
 * the rest of the module along.
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;       // seconds remaining
  maxLife: number;
  size: number;
  color: string;
  drag: number;
  gravity: number;
}

export class ParticlePool {
  readonly particles: Particle[] = [];
  constructor(public readonly cap: number = 256) {}

  emit(p: Partial<Particle> & { x: number; y: number }) {
    if (this.particles.length >= this.cap) this.particles.shift();
    this.particles.push({
      x: p.x, y: p.y,
      vx: p.vx ?? 0, vy: p.vy ?? 0,
      life: p.life ?? p.maxLife ?? 0.6,
      maxLife: p.maxLife ?? p.life ?? 0.6,
      size: p.size ?? 2,
      color: p.color ?? '#fff',
      drag: p.drag ?? 0.92,
      gravity: p.gravity ?? 0,
    });
  }

  /** Emit a radial burst of N particles. */
  burst(x: number, y: number, count: number, opts: Partial<Particle> & { speed?: number } = {}) {
    const speed = opts.speed ?? 140;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const s = speed * (0.6 + Math.random() * 0.8);
      this.emit({ ...opts, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s });
    }
  }

  step(dt: number) {
    const arr = this.particles;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy = p.vy * Math.pow(p.drag, dt * 60) + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) arr.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() { this.particles.length = 0; }
}

/** Exponentially-decaying screen-shake. Call `kick()` on hit, `step()` per frame, then read `.x/.y`. */
export class ScreenShake {
  x = 0;
  y = 0;
  amp = 0;
  decay = 6;
  constructor(decay = 6) { this.decay = decay; }
  kick(amp: number) { this.amp = Math.max(this.amp, amp); }
  step(dt: number) {
    this.amp *= Math.exp(-this.decay * dt);
    if (this.amp < 0.05) { this.amp = 0; this.x = 0; this.y = 0; return; }
    const a = (Math.random() * 2 - 1) * this.amp;
    const b = (Math.random() * 2 - 1) * this.amp;
    this.x = a; this.y = b;
  }
  /** Apply offset to ctx (pair with ctx.save/restore externally). */
  apply(ctx: CanvasRenderingContext2D, scale = 1) { ctx.translate(this.x * scale, this.y * scale); }
}

/** Bayer-2x2 ordered dither, painted as a dot-overlay across the given band. */
export function drawDitherFog(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, density = 0.35, step = 4,
) {
  ctx.fillStyle = color;
  for (let py = y; py < y + h; py += step) {
    for (let px = x; px < x + w; px += step) {
      // 2x2 Bayer threshold pattern
      const bx = ((px / step) | 0) & 1;
      const by = ((py / step) | 0) & 1;
      const t = (bx + by * 2) / 4;
      if (t < density) ctx.fillRect(px, py, 1, 1);
    }
  }
}

export interface ParallaxLayer {
  /** pixels per second */ speed: number;
  draw: (ctx: CanvasRenderingContext2D, scrollX: number) => void;
}

export class ParallaxLayers {
  private scroll = 0;
  constructor(public layers: ParallaxLayer[]) {}
  step(dt: number) { this.scroll += dt; }
  /** Manual scroll override (pixels). */
  set(x: number) { this.scroll = x; }
  draw(ctx: CanvasRenderingContext2D) {
    for (const l of this.layers) l.draw(ctx, this.scroll * l.speed);
  }
}

/** Returns true when the user has opted into reduced motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

/** Tiny hit-stop helper — returns a multiplier you can apply to dt for N ms. */
export class HitStop {
  private until = 0;
  freeze(ms: number) { const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()); this.until = Math.max(this.until, now + ms); }
  /** Multiply your physics dt by this each frame (1 = normal, 0 = paused). */
  scale(now: number): number { return now < this.until ? 0 : 1; }
}

/** Stamp a translucent rect of the previous frame for cheap motion blur. */
export function motionTrail(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.22, color = '#000') {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

/** Linear interpolation easing. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
