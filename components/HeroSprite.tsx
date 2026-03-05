'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * HeroSprite – Dr. Eams assembled from real body-part assets, always animating.
 *
 * Parts loaded from /public/:
 *   head_transparent.png  (702 × 560 natural px)
 *   coat_transparent.png  (622 × 741 natural px)  — torso
 *   arm1_transparent.png  (245 × 683 natural px)  — back arm
 *   arm2_transparent.png  (374 × 529 natural px)  — front arm
 *   shoe1_transparent.png (295 × 362 natural px)  — back leg/shoe
 *   shoe2_transparent.png (295 × 416 natural px)  — front leg/shoe
 *
 * Touch / pointer zones (based on y position relative to canvas height):
 *   head  → top 30%     → head wobbles / bounces
 *   torso → mid 38%     → arms wave
 *   legs  → bottom 32%  → legs kick
 *
 * The animation never stops — idle loop runs between reactions.
 * After a reaction the loop returns to idle automatically.
 */

// ── Natural pixel dimensions of each asset ────────────────────────────────────
const NAT = {
  head:  { w: 702, h: 560 },
  coat:  { w: 622, h: 741 },
  arm1:  { w: 245, h: 683 },
  arm2:  { w: 374, h: 529 },
  shoe1: { w: 295, h: 362 },
  shoe2: { w: 295, h: 416 },
} as const;

// Draw scale — character total visual height ≈ 208 px inside a 288 px canvas
const S = 0.13;

const DIM = {
  head:  { w: Math.round(NAT.head.w  * S), h: Math.round(NAT.head.h  * S) }, // 91 × 73
  coat:  { w: Math.round(NAT.coat.w  * S), h: Math.round(NAT.coat.h  * S) }, // 81 × 96
  arm1:  { w: Math.round(NAT.arm1.w  * S), h: Math.round(NAT.arm1.h  * S) }, // 32 × 89
  arm2:  { w: Math.round(NAT.arm2.w  * S), h: Math.round(NAT.arm2.h  * S) }, // 49 × 69
  shoe1: { w: Math.round(NAT.shoe1.w * S), h: Math.round(NAT.shoe1.h * S) }, // 38 × 47
  shoe2: { w: Math.round(NAT.shoe2.w * S), h: Math.round(NAT.shoe2.h * S) }, // 38 × 54
} as const;

// ── Interaction zones ─────────────────────────────────────────────────────────
type Zone = 'idle' | 'head' | 'torso' | 'legs';

const REACT_MS = 1600; // ms before returning to idle

const ZONE_LABEL: Record<Zone, string> = {
  idle:  '',
  head:  '🧠 head!',
  torso: '👋 arms!',
  legs:  '🦵 legs!',
};

/** Exported for unit tests */
export function hitZone(offsetY: number, displayH: number): Zone {
  const rel = offsetY / displayH;
  if (rel < 0.30) return 'head';
  if (rel < 0.68) return 'torso';
  return 'legs';
}

// ── Image loading ─────────────────────────────────────────────────────────────
type Images = {
  head:  HTMLImageElement | null;
  coat:  HTMLImageElement | null;
  arm1:  HTMLImageElement | null;
  arm2:  HTMLImageElement | null;
  shoe1: HTMLImageElement | null;
  shoe2: HTMLImageElement | null;
};

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(img); // guard: null-check before drawImage
    img.src = src;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
type Props = {
  width?: number;
  height?: number;
  className?: string;
};

export default function HeroSprite({
  width  = 224,
  height = 224,
  className = '',
}: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const zoneRef    = useRef<Zone>('idle');
  const reactUntil = useRef<number>(0);
  const imgsRef    = useRef<Images>({
    head: null, coat: null, arm1: null, arm2: null, shoe1: null, shoe2: null,
  });

  const [hint, setHint] = useState<{ label: string; key: number } | null>(null);

  // Load body-part images once on mount
  useEffect(() => {
    Promise.all([
      loadImg('/head_transparent.png'),
      loadImg('/coat_transparent.png'),
      loadImg('/arm1_transparent.png'),
      loadImg('/arm2_transparent.png'),
      loadImg('/shoe1_transparent.png'),
      loadImg('/shoe2_transparent.png'),
    ]).then(([head, coat, arm1, arm2, shoe1, shoe2]) => {
      imgsRef.current = { head, coat, arm1, arm2, shoe1, shoe2 };
    });
  }, []);

  const triggerZone = useCallback((zone: Zone) => {
    if (zone === 'idle') return;
    zoneRef.current    = zone;
    reactUntil.current = performance.now() + REACT_MS;
    setHint({ label: ZONE_LABEL[zone], key: Date.now() });
    setTimeout(() => setHint(null), REACT_MS - 100);
  }, []);

  const handlePointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    triggerZone(hitZone(e.clientY - rect.top, rect.height));
  }, [triggerZone]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') triggerZone('head');
    if (e.key === ' ')     triggerZone('torso');
    if (e.key === 'ArrowDown') triggerZone('legs');
  }, [triggerZone]);

  // rAF draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext('2d');
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let rafId   = 0;
    let stopped = false;
    const startTime = performance.now();

    /** Draw one body part with pivot + rotation, optionally flipped. */
    function drawPart(
      img: HTMLImageElement | null,
      pw: number, ph: number,
      dx: number, dy: number,
      pivotX: number, pivotY: number,
      angle: number,
    ) {
      if (!img?.complete || !img.naturalWidth) return;
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(angle);
      ctx.drawImage(img, dx - pivotX, dy - pivotY, pw, ph);
      ctx.restore();
    }

    // Pause on hidden tab (ARCHITECTURE.md §17.3 — battery-aware)
    function onVisibility() {
      if (!document.hidden) rafId = requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', onVisibility);

    function tick(now: number) {
      if (stopped) return;

      // Skip draw while tab is hidden — rAF won't fire anyway, but guard is cheap
      if (document.hidden) { rafId = requestAnimationFrame(tick); return; }

      // Expire reaction → return to idle
      if (zoneRef.current !== 'idle' && now >= reactUntil.current) {
        zoneRef.current = 'idle';
      }

      const zone = zoneRef.current;
      const t    = (now - startTime) / 1000; // elapsed seconds
      const imgs = imgsRef.current;

      ctx.clearRect(0, 0, width, height);

      // ── Idle animation base ──────────────────────────────────────────────
      const idleBob   = Math.sin(t * 1.6) * 3;          // gentle vertical float
      const idleArm   = Math.sin(t * 1.6) * 0.10;       // subtle arm sway
      const idleLeg   = Math.sin(t * 1.6) * 0.06;       // subtle leg sway
      const idleHead  = Math.sin(t * 0.9) * 0.04;       // gentle head tilt

      // ── Per-zone reaction overrides ──────────────────────────────────────
      let headAngle  = idleHead;
      let headBounce = 0;
      let armAngle   = idleArm;
      let legAngle   = idleLeg;
      let bodyBob    = idleBob;

      if (zone !== 'idle') {
        // progress 0 → 1 over the reaction window
        const elapsed  = now - (reactUntil.current - REACT_MS);
        const progress = Math.min(elapsed / REACT_MS, 1);

        if (zone === 'head') {
          // Head wobbles rapidly left-right, bounces up
          headAngle  = Math.sin(progress * Math.PI * 10) * 0.45 * (1 - progress);
          headBounce = Math.sin(progress * Math.PI * 5)  * -12  * (1 - progress);
        } else if (zone === 'torso') {
          // Arms wave in large arcs
          armAngle = Math.sin(progress * Math.PI * 7) * 0.75 * (1 - progress * 0.4);
          bodyBob  = Math.sin(progress * Math.PI * 4) * 5;
        } else if (zone === 'legs') {
          // Legs kick, body hops
          legAngle = Math.sin(progress * Math.PI * 8) * 0.65 * (1 - progress * 0.3);
          bodyBob  = Math.abs(Math.sin(progress * Math.PI * 3)) * -10 * (1 - progress);
        }
      }

      // ── Layout (bottom-up from feetY) ────────────────────────────────────
      const cx        = width / 2;
      const feetY     = height - 22 + bodyBob;
      const shoeTopY  = feetY  - DIM.shoe1.h;
      const coatBotY  = feetY  - DIM.shoe1.h + 4;   // coat overlaps shoe top
      const coatTopY  = coatBotY - DIM.coat.h;
      const headTopY  = coatTopY - DIM.head.h + 8 + headBounce; // head overlaps coat top
      const shoulderY = coatTopY + 6;                // arm pivot near coat top

      // Shadow underfoot
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.beginPath();
      ctx.ellipse(cx, feetY + 5, 24, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 1. Back arm (behind torso) — swings opposite to front arm
      drawPart(
        imgs.arm1, DIM.arm1.w, DIM.arm1.h,
        cx - DIM.arm1.w / 2 - 8, shoulderY,
        cx - 8, shoulderY,
        -armAngle,
      );

      // 2. Back shoe / leg
      drawPart(
        imgs.shoe1, DIM.shoe1.w, DIM.shoe1.h,
        cx - DIM.shoe1.w / 2 - 5, shoeTopY,
        cx - 5, shoeTopY,
        -legAngle,
      );

      // 3. Coat / torso — always upright
      if (imgs.coat?.complete && imgs.coat.naturalWidth) {
        ctx.drawImage(imgs.coat, cx - DIM.coat.w / 2, coatTopY, DIM.coat.w, DIM.coat.h);
      }

      // 4. Front shoe / leg
      drawPart(
        imgs.shoe2, DIM.shoe2.w, DIM.shoe2.h,
        cx - DIM.shoe2.w / 2 + 5, shoeTopY,
        cx + 5, shoeTopY,
        legAngle,
      );

      // 5. Head — pivots around its vertical centre
      if (imgs.head?.complete && imgs.head.naturalWidth) {
        ctx.save();
        ctx.translate(cx, headTopY + DIM.head.h / 2);
        ctx.rotate(headAngle);
        ctx.drawImage(imgs.head, -DIM.head.w / 2, -DIM.head.h / 2, DIM.head.w, DIM.head.h);
        ctx.restore();
      }

      // 6. Front arm (in front of torso)
      drawPart(
        imgs.arm2, DIM.arm2.w, DIM.arm2.h,
        cx - DIM.arm2.w / 2 + 8, shoulderY,
        cx + 8, shoulderY,
        armAngle,
      );

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [width, height]);

  return (
    <div style={{ position: 'relative', display: 'inline-block', width, height }}>
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          width,
          height,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none',
          display: 'block',
        }}
        aria-label="Dr. Eams — tap head, torso, or legs to interact"
        role="img"
        tabIndex={0}
        onPointerDown={handlePointer}
        onKeyDown={handleKey}
      />
      {hint && (
        <div
          key={hint.key}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -120%)',
            pointerEvents: 'none',
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            background: 'rgba(10,30,80,0.72)',
            border: '1px solid rgba(90,200,250,0.4)',
            borderRadius: 999,
            padding: '3px 10px',
            whiteSpace: 'nowrap',
            animation: 'de-fade-up 0.25s ease forwards',
          }}
        >
          {hint.label}
        </div>
      )}
    </div>
  );
}
