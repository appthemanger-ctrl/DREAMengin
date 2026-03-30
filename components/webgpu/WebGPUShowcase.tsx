'use client';

/**
 * WebGPUShowcase — top-line GPU experience page.
 *
 * WebGPU path (Chrome 113+, Safari 18+):
 *   • GPU compute shaders  — 2048-particle lemniscate attractor system
 *   • Multi-pass HDR pipeline — scene → bright → blur H → blur V → composite
 *   • ACES tone-mapping, chromatic aberration, barrel vignette
 *   • All animation runs entirely on the GPU, zero JS per pixel
 *
 * Canvas2D fallback (all other browsers):
 *   • Software-rasterised animated lemniscate with particles
 *
 * Quick-launch cards: Games, Daydreams, Engines, Messaging
 * iPhone-optimised: safe-area insets, DPR clamped to 2, GPU-composited layers
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { isWebGPUAvailable, getRendererBackend } from '@/lib/webgpu';
import { WebGPURenderer } from './renderer';

// ── Constants ────────────────────────────────────────────────────────────────

const GOLD   = '#e8c040';
const CYAN   = '#5de8ff';
const DARK   = '#04080f';
const GLASS  = 'rgba(255,255,255,0.08)';
const BORDER = 'rgba(255,255,255,0.11)';

const SECTIONS = [
  {
    id:    'games',
    emoji: '🎮',
    label: 'Games',
    desc:  'WebGPU-rendered Neon Drift, Echo Arena & 23 more.',
    color: '#7c3aed',
    href:  '/daydream/games',
  },
  {
    id:    'daydreams',
    emoji: '✨',
    label: 'Daydreams',
    desc:  'Music, Code, Brand, Lab — all GPU-accelerated.',
    color: '#2a8ab8',
    href:  '/homedream',
  },
  {
    id:    'engines',
    emoji: '⚙️',
    label: 'Engines',
    desc:  'GameEngin, LabEngin, ContentEngin & more.',
    color: '#e8c040',
    href:  '/daydream/games',
  },
  {
    id:    'messaging',
    emoji: '💬',
    label: 'Messaging',
    desc:  'DreamDM — GPU-composited, zero-jank bar.',
    color: '#22c55e',
    href:  '/messages',
  },
];

// ── GPU canvas (WebGPU-first, Canvas2D fallback) ──────────────────────────────

function useGPUCanvas(
  canvasRef:    React.RefObject<HTMLCanvasElement | null>,
  setFps:       (fps: number) => void,
  setGpuActive: (v: boolean) => void,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let destroyed = false;
    let raf = 0;
    let webgpuRenderer: WebGPURenderer | null = null;

    // ── WebGPU path ────────────────────────────────────────────────────────
    const tryWebGPU = async () => {
      try {
        const r = await WebGPURenderer.create(canvas);
        if (destroyed) { r.destroy(); return; }
        webgpuRenderer = r;
        setGpuActive(true);

        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
          const w = Math.round(canvas.offsetWidth  * dpr);
          const h = Math.round(canvas.offsetHeight * dpr);
          canvas.width  = w;
          canvas.height = h;
          r.resize(w, h);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        let last = 0, frames = 0, fpsTs = 0;
        const loop = (ts: number) => {
          if (destroyed) return;
          raf = requestAnimationFrame(loop);
          const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
          last = ts;
          frames++;
          if (ts - fpsTs >= 500) {
            setFps(Math.round(frames / ((ts - fpsTs) / 1000)));
            frames = 0; fpsTs = ts;
          }
          r.frame(dt);
        };
        raf = requestAnimationFrame(loop);

        return () => ro.disconnect();
      } catch {
        startCanvas2D();
      }
    };

    // ── Canvas2D fallback ──────────────────────────────────────────────────
    const startCanvas2D = () => {
      if (destroyed) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        canvas.width  = Math.round(canvas.offsetWidth  * dpr);
        canvas.height = Math.round(canvas.offsetHeight * dpr);
        ctx.scale(dpr, dpr);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      let t = 0, last2 = 0, frames2 = 0, fpsTs2 = 0;
      const draw = (ts: number) => {
        raf = requestAnimationFrame(draw);
        const dt = last2 ? Math.min((ts - last2) / 1000, 0.05) : 0.016;
        last2 = ts; t += dt;
        frames2++;
        if (ts - fpsTs2 >= 500) {
          setFps(Math.round(frames2 / ((ts - fpsTs2) / 1000)));
          frames2 = 0; fpsTs2 = ts;
        }

        const w = canvas.offsetWidth, h = canvas.offsetHeight;
        ctx.clearRect(0, 0, w, h);

        const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.75);
        bg.addColorStop(0, 'rgba(42,138,184,0.18)');
        bg.addColorStop(1, 'rgba(4,8,15,0)');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        const cx = w/2, cy = h/2, a = Math.min(w, h) * 0.28, b = a * 0.48;
        const N = 200;

        for (let pass = 0; pass < 3; pass++) {
          const lw = 14 - pass * 4, alpha = 0.10 + pass * 0.08;
          ctx.save(); ctx.beginPath();
          for (let i = 0; i <= N; i++) {
            const u = (i/N)*Math.PI*2, den = 1 + Math.sin(u)**2;
            const x = cx + (a*Math.cos(u))/den, y = cy + (b*Math.sin(u)*Math.cos(u))/den;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = pass===2 ? `rgba(93,232,255,${alpha})` : `rgba(232,192,64,${alpha})`;
          ctx.lineWidth = lw; ctx.stroke(); ctx.restore();
        }

        ctx.save(); ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const u = (i/N)*Math.PI*2 + t*0.4, den = 1 + Math.sin(u)**2;
          const x = cx + (a*Math.cos(u))/den, y = cy + (b*Math.sin(u)*Math.cos(u))/den;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        const lg = ctx.createLinearGradient(cx-a, cy, cx+a, cy);
        lg.addColorStop(0, '#e8c040'); lg.addColorStop(0.5, '#5de8ff'); lg.addColorStop(1, '#e8c040');
        ctx.strokeStyle = lg; ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore();

        const pu = t*0.8, pden = 1+Math.sin(pu)**2;
        const px = cx+(a*Math.cos(pu))/pden, py = cy+(b*Math.sin(pu)*Math.cos(pu))/pden;
        const pg = ctx.createRadialGradient(px,py,0,px,py,10);
        pg.addColorStop(0,'rgba(93,232,255,0.95)'); pg.addColorStop(1,'rgba(93,232,255,0)');
        ctx.beginPath(); ctx.arc(px,py,10,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill();
        ctx.beginPath(); ctx.arc(px,py,3.5,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
      };
      raf = requestAnimationFrame(draw);
      return () => ro.disconnect();
    };

    const nav = navigator as Navigator & { gpu?: GPU };
    if (nav.gpu) {
      tryWebGPU();
    } else {
      startCanvas2D();
    }

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      webgpuRenderer?.destroy();
    };
  }, [canvasRef, setFps, setGpuActive]);
}

// ── Backend badge ─────────────────────────────────────────────────────────────

function BackendBadge({ backend }: { backend: string | null }) {
  if (!backend) {
    return (
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
        detecting…
      </span>
    );
  }

  const isGPU  = backend === 'webgpu';
  const color  = isGPU ? CYAN : '#f59e0b';
  const label  = backend.toUpperCase();
  const dot    = isGPU ? '✓' : '~';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color,
      background: `${color}18`,
      border: `1px solid ${color}44`,
      borderRadius: 99,
      padding: '3px 10px 3px 8px',
    }}>
      <span style={{ fontSize: 9 }}>{dot}</span>
      {label}
    </span>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({
  emoji, label, desc, color, href,
}: { emoji: string; label: string; desc: string; color: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: GLASS,
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: '20px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          cursor: 'pointer',
          minHeight: 88,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          transition: 'background 0.14s, transform 0.1s',
          willChange: 'transform',
        }}
        onPointerDown={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${color}18`; (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.974)'; }}
        onPointerUp={(e) => { (e.currentTarget as HTMLDivElement).style.background = GLASS; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
        onPointerLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = GLASS; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
      >
        <span style={{
          fontSize: 24,
          width: 46,
          height: 46,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 13,
          background: `${color}22`,
          border: `1px solid ${color}33`,
          flexShrink: 0,
        }}>
          {emoji}
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.52)', lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WebGPUShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps,       setFps]       = useState<number>(0);
  const [backend,   setBackend]   = useState<string | null>(null);
  const [gpuFlag,   setGpuFlag]   = useState<boolean | null>(null);
  const [gpuActive, setGpuActive] = useState(false);

  const handleFps      = useCallback((f: number)  => setFps(f),      []);
  const handleGpuActive = useCallback((v: boolean) => setGpuActive(v), []);
  useGPUCanvas(canvasRef, handleFps, handleGpuActive);

  useEffect(() => {
    getRendererBackend().then(setBackend);
    isWebGPUAvailable().then(setGpuFlag);
  }, []);

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: DARK,
        color: '#fff',
        fontFamily: 'var(--font-space-grotesk, system-ui, sans-serif)',
        overflowX: 'hidden',
        // iPhone safe-area support
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: `${DARK}cc`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <Link href="/homedream" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="11" viewBox="0 0 80 36" aria-hidden>
            <path d="M12 18c8-10 18-10 28 0s20 10 28 0" fill="none" stroke={GOLD} strokeWidth="6" strokeLinecap="round" />
            <path d="M12 18c8 10 18 10 28 0s20-10 28 0" fill="none" stroke={CYAN} strokeWidth="6" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.01em' }}>
            DREAMengin
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackendBadge backend={backend} />
          {fps > 0 && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: fps >= 55 ? '#4ade80' : fps >= 30 ? '#f59e0b' : '#ef4444',
              letterSpacing: '0.05em',
              minWidth: 44,
              textAlign: 'right',
            }}>
              {fps} fps
            </span>
          )}
        </div>
      </div>

      {/* ── Hero canvas ───────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'clamp(220px, 38vw, 340px)', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            // GPU-composited layer — forces own layer on iOS Safari
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        />

        {/* Hero text overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          gap: 6,
          padding: '0 20px',
        }}>
          <h1 style={{
            fontSize: 'clamp(26px, 6vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: `linear-gradient(135deg, ${GOLD} 0%, #fff 50%, ${CYAN} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.1,
          }}>
            WebGPU
          </h1>
          <p style={{
            fontSize: 'clamp(12px, 2.8vw, 15px)',
            color: 'rgba(255,255,255,0.52)',
            textAlign: 'center',
            margin: 0,
            maxWidth: 260,
            lineHeight: 1.5,
          }}>
            Top-line GPU performance — games, engines, messaging
          </p>

          {(gpuFlag !== null || gpuActive) && (
            <div style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: gpuActive ? CYAN : gpuFlag ? CYAN : '#f59e0b',
              fontWeight: 600,
            }}>
              <span style={{ fontSize: 14 }}>{gpuActive || gpuFlag ? '⚡' : '⚠️'}</span>
              {gpuActive
                ? 'WebGPU compute + 6-pass HDR pipeline running'
                : gpuFlag
                  ? 'WebGPU initialising…'
                  : 'WebGL2 fallback — upgrade Chrome 113+ or Safari 18+'}
            </div>
          )}
        </div>
      </div>

      {/* ── Section cards ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '24px 16px',
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <h2 style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          margin: '0 0 4px 4px',
        }}>
          GPU-accelerated
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {SECTIONS.map((s) => (
            <SectionCard key={s.id} {...s} />
          ))}
        </div>

        {/* ── Performance specs ─────────────────────────────────────────── */}
        <div style={{
          marginTop: 8,
          background: GLASS,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.72)', margin: 0, letterSpacing: '-0.01em' }}>
            Performance stack
          </h3>
          {[
            { label: 'Renderer',           value: gpuActive ? 'Raw WebGPU API · WGSL shaders' : 'Canvas2D fallback' },
            { label: 'Particles',           value: `${gpuActive ? '2 048' : '1'} GPU-driven (compute shaders)` },
            { label: 'Post-processing',    value: 'HDR → bright → blur H → blur V → composite' },
            { label: 'Tone-mapping',       value: 'ACES filmic (Narkowicz 2015)' },
            { label: 'Chromatic aberration', value: 'Radial, GPU fragment shader' },
            { label: 'Babylon.js layer',   value: 'WebGPU-first · director pass-based' },
            { label: 'Target framerate',   value: '60 fps · graceful 30 fallback' },
            { label: 'Mobile',             value: 'safe-area · DPR≤2 · GPU-composited' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.78)', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <Link href="/daydream/games" style={{ textDecoration: 'none' }}>
          <div style={{
            marginTop: 4,
            background: `linear-gradient(135deg, rgba(232,192,64,0.18) 0%, rgba(93,232,255,0.14) 100%)`,
            border: `1px solid rgba(232,192,64,0.28)`,
            borderRadius: 20,
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: GOLD, marginBottom: 2 }}>Play Now</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Neon Drift, Echo Arena & 23 more</div>
            </div>
            <span style={{ fontSize: 22 }}>🎮</span>
          </div>
        </Link>
      </div>

      {/* ── Global keyframes ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes de-webgpu-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
