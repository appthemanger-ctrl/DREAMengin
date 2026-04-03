'use client';

/**
 * DreamConstellationMap
 *
 * A full-screen interactive 2-D node-link graph showing all 7 Daydream
 * surfaces connected by animated arcs.  Hovering a node brightens it and
 * its edges.  Clicking navigates directly to that surface.
 *
 * Rendering: canvas 2-D API + requestAnimationFrame.
 * No external deps beyond framer-motion (already in bundle).
 * Battery-safe: pauses when tab is hidden.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Node definitions ─────────────────────────────────────────────────────────
const NODES = [
  { id: 'music',     emoji: '🎵', label: 'Music',     href: '/daydream/music',     r: 200, g:  88, b: 212, cx: 0.20, cy: 0.32 },
  { id: 'games',     emoji: '🎮', label: 'Games',     href: '/daydream/games',     r:  34, g: 197, b:  94, cx: 0.50, cy: 0.15 },
  { id: 'lab',       emoji: '⚗️', label: 'Lab',       href: '/daydream/lab',       r:   6, g: 182, b: 212, cx: 0.80, cy: 0.30 },
  { id: 'code',      emoji: '💻', label: 'Code',      href: '/daydream/code',      r:  59, g: 130, b: 246, cx: 0.82, cy: 0.62 },
  { id: 'brand',     emoji: '🎨', label: 'Brand',     href: '/daydream/brand',     r: 249, g: 115, b:  22, cx: 0.50, cy: 0.78 },
  { id: 'create',    emoji: '✍️', label: 'Create',    href: '/daydream/create',    r: 236, g:  72, b: 153, cx: 0.20, cy: 0.68 },
  { id: 'analytics', emoji: '📊', label: 'Analytics', href: '/daydream/analytics', r:  99, g: 102, b: 241, cx: 0.50, cy: 0.50 },
  { id: 'forge',     emoji: '🔥', label: 'Forge',     href: '/daydream/forge',     r: 239, g:  68, b:  68, cx: 0.50, cy: 0.95 },
] as const;

type NodeId = typeof NODES[number]['id'];

// ── Edges (fully-connected constellation through analytics hub) ──────────────
const EDGES: [NodeId, NodeId][] = [
  ['analytics', 'music'],
  ['analytics', 'games'],
  ['analytics', 'lab'],
  ['analytics', 'code'],
  ['analytics', 'brand'],
  ['analytics', 'create'],
  ['analytics', 'forge'],
  ['music',  'games'],
  ['games',  'lab'],
  ['lab',    'code'],
  ['code',   'brand'],
  ['brand',  'create'],
  ['create', 'music'],
  ['forge',  'music'],
  ['forge',  'games'],
];

// ── Ambient particle layer ────────────────────────────────────────────────────
interface Mote { x: number; y: number; vx: number; vy: number; r: number; g: number; b: number; a: number; life: number; }

function makeMote(w: number, h: number): Mote {
  const col = NODES[Math.floor(Math.random() * NODES.length)];
  return {
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14,
    r: col.r, g: col.g, b: col.b,
    a: Math.random() * 0.35 + 0.08,
    life: Math.random(),
  };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function DreamConstellationMap() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef<{ raf: number; t: number; last: number; hovered: NodeId | null; motes: Mote[] } | null>(null);
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const router = useRouter();

  const getNodePos = useCallback((n: typeof NODES[number], w: number, h: number) => ({
    x: n.cx * w,
    y: n.cy * h,
  }), []);

  const hitTest = useCallback((mx: number, my: number, w: number, h: number): NodeId | null => {
    for (const n of NODES) {
      const { x, y } = { x: n.cx * w, y: n.cy * h };
      const d = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (d < 48) return n.id;
    }
    return null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    const MOTE_COUNT = 40;
    stateRef.current = {
      raf: 0, t: 0, last: performance.now(), hovered: null,
      motes: Array.from({ length: MOTE_COUNT }, () => makeMote(window.innerWidth, window.innerHeight)),
    };

    function render(ts: number) {
      const s = stateRef.current!;
      const dt = Math.min((ts - s.last) / 1000, 0.05);
      s.last = ts;
      s.t   += dt;

      const ctx = canvas!.getContext('2d')!;
      const W = window.innerWidth;
      const H = window.innerHeight;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // ── Background gradient ──────────────────────────────────────────────
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
      bg.addColorStop(0,   'rgba(8,16,38,0.96)');
      bg.addColorStop(0.5, 'rgba(5,12,28,0.98)');
      bg.addColorStop(1,   'rgba(2,6,14,1.00)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Ambient motes ────────────────────────────────────────────────────
      for (const m of s.motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.vx *= 1 - dt * 0.4;
        m.vy *= 1 - dt * 0.4;
        if (m.x < 0) m.x = W; if (m.x > W) m.x = 0;
        if (m.y < 0) m.y = H; if (m.y > H) m.y = 0;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${m.r},${m.g},${m.b},${m.a})`;
        ctx.fill();
      }

      // ── Edges ────────────────────────────────────────────────────────────
      for (const [aid, bid] of EDGES) {
        const a  = NODES.find((n) => n.id === aid)!;
        const b  = NODES.find((n) => n.id === bid)!;
        const pa = getNodePos(a, W, H);
        const pb = getNodePos(b, W, H);

        const isHot = s.hovered === aid || s.hovered === bid;
        const pulse = 0.28 + 0.18 * Math.sin(s.t * 1.4);
        const alpha = isHot ? 0.70 : pulse;

        // Animated arc offset
        const mx = (pa.x + pb.x) / 2 + Math.sin(s.t * 0.7 + a.cx * 5) * 22;
        const my = (pa.y + pb.y) / 2 + Math.cos(s.t * 0.9 + b.cy * 5) * 18;

        const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
        grad.addColorStop(0, `rgba(${a.r},${a.g},${a.b},${alpha})`);
        grad.addColorStop(1, `rgba(${b.r},${b.g},${b.b},${alpha})`);

        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = isHot ? 2.2 : 1.1;
        ctx.stroke();

        // Traveling spark on each edge
        const progress = ((s.t * 0.5 + EDGES.indexOf([aid, bid] as [NodeId, NodeId])) % 1 + 1) % 1;
        const tParam = progress;
        const sx = (1 - tParam) * (1 - tParam) * pa.x + 2 * (1 - tParam) * tParam * mx + tParam * tParam * pb.x;
        const sy = (1 - tParam) * (1 - tParam) * pa.y + 2 * (1 - tParam) * tParam * my + tParam * tParam * pb.y;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
        ctx.fill();
      }

      // ── Nodes ────────────────────────────────────────────────────────────
      for (const n of NODES) {
        const { x, y } = getNodePos(n, W, H);
        const isHot    = s.hovered === n.id;
        const breathe  = 1 + 0.15 * Math.sin(s.t * 1.2 + n.cx * 7);
        const size     = (isHot ? 42 : 34) * breathe;

        // Glow halo
        const halo = ctx.createRadialGradient(x, y, 0, x, y, size * 3.5);
        halo.addColorStop(0,   `rgba(${n.r},${n.g},${n.b},${isHot ? 0.35 : 0.18})`);
        halo.addColorStop(0.5, `rgba(${n.r},${n.g},${n.b},${isHot ? 0.12 : 0.05})`);
        halo.addColorStop(1,   `rgba(${n.r},${n.g},${n.b},0)`);
        ctx.beginPath();
        ctx.arc(x, y, size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // Node disc
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.r},${n.g},${n.b},${isHot ? 0.30 : 0.14})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${n.r},${n.g},${n.b},${isHot ? 0.85 : 0.50})`;
        ctx.lineWidth   = isHot ? 2.5 : 1.5;
        ctx.stroke();

        // Specular ring
        ctx.beginPath();
        ctx.arc(x, y, size * 0.65, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${isHot ? 0.28 : 0.10})`;
        ctx.lineWidth   = 1;
        ctx.stroke();

        // Emoji + label via DOM (avoids measureText complexity)
        ctx.font        = `${isHot ? 26 : 22}px serif`;
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.emoji, x, y - 2);

        ctx.font         = `600 ${isHot ? 13 : 11}px var(--font-space-grotesk, sans-serif)`;
        ctx.fillStyle    = `rgba(255,255,255,${isHot ? 0.95 : 0.65})`;
        ctx.letterSpacing = '0.04em';
        ctx.fillText(n.label, x, y + size + 14);
      }

      ctx.restore();
      s.raf = requestAnimationFrame(render);
    }

    stateRef.current.raf = requestAnimationFrame(render);

    // Mouse / touch interaction
    const onMove = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s) return;
      const hit = hitTest(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
      s.hovered = hit;
      setHovered(hit);
      canvas.style.cursor = hit ? 'pointer' : 'default';
    };
    const onClick = (e: MouseEvent) => {
      const hit = hitTest(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
      if (hit) {
        const node = NODES.find((n) => n.id === hit)!;
        router.push(node.href);
      }
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('click',     onClick);

    const onHidden = () => {
      const s = stateRef.current;
      if (!s) return;
      if (document.hidden) cancelAnimationFrame(s.raf);
      else { s.last = performance.now(); s.raf = requestAnimationFrame(render); }
    };
    document.addEventListener('visibilitychange', onHidden);

    return () => {
      if (stateRef.current) cancelAnimationFrame(stateRef.current.raf);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('click',     onClick);
      window.removeEventListener('resize',    resize);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [getNodePos, hitTest, router]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Hover tooltip */}
      {hovered && (() => {
        const n = NODES.find((x) => x.id === hovered)!;
        return (
          <div
            style={{
              position:    'fixed',
              bottom:       80,
              left:        '50%',
              transform:   'translateX(-50%)',
              zIndex:       50,
              pointerEvents: 'none',
              background:  `rgba(${n.r},${n.g},${n.b},0.15)`,
              border:      `1px solid rgba(${n.r},${n.g},${n.b},0.40)`,
              backdropFilter: 'blur(16px)',
              borderRadius: 32,
              padding:     '8px 20px',
              color:       `rgba(${n.r},${n.g},${n.b},1)`,
              fontSize:    13,
              fontWeight:  700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {n.emoji} Open {n.label} Daydream →
          </div>
        );
      })()}
    </div>
  );
}
