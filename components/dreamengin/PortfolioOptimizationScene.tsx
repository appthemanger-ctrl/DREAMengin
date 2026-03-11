'use client';

/**
 * PortfolioOptimizationScene
 *
 * Canvas 2D background animation for the landing page.
 * Visualises a Markowitz / QUBO portfolio optimisation as an orbital
 * node-graph: a central QPO hub surrounded by labelled asset nodes on
 * elliptical orbits, connected by animated quantum-circuit traces and
 * flowing data-particles.
 *
 * Architecture justification: render-on-demand RAF loop, no setInterval,
 * cleanup on unmount — docs/ARCHITECTURE.md §10.
 * Performance impact: ~55 lightweight 2-D draw calls per frame, GPU-idle
 * between frames.  Freezes when tab is backgrounded (RAF auto-throttles).
 */

import { useEffect, useRef } from 'react';

// ── palette (matches DREAMengin design tokens) ─────────────────────────────
const BLUE    = '#2a8ab8';
const GOLD    = '#c8981a';
const PURPLE  = '#8b5cf6';
const GREEN   = '#22c55e';
const SKY     = '#0ea5e9';
const PINK    = '#ec4899';
const AMBER   = '#f59e0b';
const CYAN    = '#06b6d4';

const PALETTE = [BLUE, GOLD, PURPLE, GREEN, SKY, PINK, AMBER, CYAN, BLUE, GOLD];

// ── asset ticker labels ─────────────────────────────────────────────────────
const TICKERS = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA', 'BTC', 'ETH', 'GLD', 'SPY', 'BND'];

// ── types ───────────────────────────────────────────────────────────────────
interface AssetNode {
  orbitRadius: number;
  orbitSpeed:  number;
  orbitAngle:  number;
  tiltY:       number;   // y-compression for ellipse (0–1)
  color:       string;
  ticker:      string;
  pulsePhase:  number;
  nodeSize:    number;
  x:           number;
  y:           number;
}

interface DataParticle {
  from:     number;   // index into nodes[]  (or -1 = hub)
  to:       number;   // index into nodes[]  (or -1 = hub)
  progress: number;
  speed:    number;
  color:    string;
}

// ── helpers ─────────────────────────────────────────────────────────────────
function hex2rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function nodeXY(node: AssetNode, cx: number, cy: number): [number, number] {
  const x = cx + node.orbitRadius * Math.cos(node.orbitAngle);
  const y = cy + node.orbitRadius * Math.sin(node.orbitAngle) * node.tiltY;
  return [x, y];
}

export default function PortfolioOptimizationScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let time = 0;
    let cx = 0;
    let cy = 0;
    let nodes: AssetNode[] = [];
    let particles: DataParticle[] = [];

    // ── build scene geometry ─────────────────────────────────────────────
    function buildScene() {
      cx = canvas!.width  / 2;
      cy = canvas!.height / 2;
      const base = Math.min(cx, cy);

      nodes = TICKERS.map((ticker, i) => {
        const outer  = i < 6;
        const orbitR = base * (outer ? 0.44 : 0.26);
        const speed  = (outer ? 0.18 : 0.30) * (i % 2 === 0 ? 1 : -1);
        return {
          orbitRadius: orbitR,
          orbitSpeed:  speed,
          orbitAngle:  (i / (outer ? 6 : 4)) * Math.PI * 2,
          tiltY:       outer ? 0.40 : 0.50,
          color:       PALETTE[i],
          ticker,
          pulsePhase:  (i / TICKERS.length) * Math.PI * 2,
          nodeSize:    outer ? 10 : 8,
          x: 0,
          y: 0,
        };
      });

      particles = [];
      for (let i = 0; i < 24; i++) spawnParticle();
    }

    function spawnParticle() {
      const idx    = Math.floor(Math.random() * nodes.length);
      const toHub  = Math.random() > 0.5;
      particles.push({
        from:     toHub ? idx : -1,
        to:       toHub ? -1  : idx,
        progress: Math.random(),
        speed:    0.004 + Math.random() * 0.006,
        color:    PALETTE[Math.floor(Math.random() * PALETTE.length)],
      });
    }

    // ── resize ───────────────────────────────────────────────────────────
    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
      buildScene();
    }

    // ── drawing helpers ──────────────────────────────────────────────────
    function drawOrbitalRings() {
      const base  = Math.min(cx, cy);
      const rings = [0.44, 0.26];
      rings.forEach((r, ri) => {
        const radius = base * r;
        const alpha  = 0.07 + 0.03 * Math.sin(time * 0.4 + ri);
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * (ri === 0 ? 0.40 : 0.50), 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(42,138,184,${alpha})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
      });
    }

    function drawBackgroundRings() {
      const base  = Math.min(cx, cy);
      for (let r = 3; r >= 0; r--) {
        const radius = base * (0.62 + r * 0.08);
        const tilt   = 0.35 + 0.02 * Math.sin(time * 0.15 + r);
        const alpha  = 0.03 + 0.015 * Math.sin(time * 0.2 + r * 0.8);
        ctx.beginPath();
        ctx.ellipse(
          cx, cy,
          radius, radius * tilt,
          time * 0.025 + r * 0.4,
          0, Math.PI * 2,
        );
        ctx.strokeStyle = `rgba(42,138,184,${alpha})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }

      // Soft aurora centre glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.55);
      grd.addColorStop(0,   'rgba(42,138,184,0.06)');
      grd.addColorStop(0.5, 'rgba(139,92,246,0.04)');
      grd.addColorStop(1,   'rgba(42,138,184,0.00)');
      ctx.beginPath();
      ctx.arc(cx, cy, base * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    function drawHub() {
      const r  = 24 + 3 * Math.sin(time * 0.9);
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.8);
      grd.addColorStop(0,   hex2rgba(BLUE, 0.55));
      grd.addColorStop(0.4, hex2rgba(BLUE, 0.12));
      grd.addColorStop(1,   hex2rgba(BLUE, 0.00));
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // White disc
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle   = 'rgba(255,255,255,0.95)';
      ctx.fill();
      ctx.strokeStyle = hex2rgba(BLUE, 0.55);
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Labels
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = `bold ${Math.round(r * 0.46)}px system-ui,sans-serif`;
      ctx.fillStyle    = '#0f2a5c';
      ctx.fillText('QPO', cx, cy - 4);
      ctx.font         = `${Math.round(r * 0.34)}px system-ui,sans-serif`;
      ctx.fillStyle    = hex2rgba(BLUE, 0.75);
      ctx.fillText('QUBO', cx, cy + 5);
    }

    function updateNodes() {
      nodes.forEach(n => {
        n.orbitAngle += n.orbitSpeed * 0.010;
        [n.x, n.y] = nodeXY(n, cx, cy);
      });
    }

    function drawHubSpokes() {
      nodes.forEach(n => {
        const alpha = 0.10 + 0.06 * Math.sin(time * 0.6 + n.pulsePhase);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = hex2rgba(BLUE, alpha);
        ctx.lineWidth   = 0.7;
        ctx.setLineDash([4, 7]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    function drawNodeConnections() {
      const maxDist = Math.min(cx, cy) * 0.55;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(b.x - a.x, b.y - a.y);
          if (d > maxDist) continue;
          const alpha = (1 - d / maxDist) * 0.09;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = hex2rgba(BLUE, alpha);
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }
    }

    function drawParticles() {
      particles.forEach(p => {
        let ax: number, ay: number, bx: number, by: number;
        if (p.from === -1) {
          ax = cx; ay = cy;
        } else {
          ax = nodes[p.from].x; ay = nodes[p.from].y;
        }
        if (p.to === -1) {
          bx = cx; by = cy;
        } else {
          bx = nodes[p.to].x; by = nodes[p.to].y;
        }

        const px = ax + (bx - ax) * p.progress;
        const py = ay + (by - ay) * p.progress;

        const alpha = 0.55 + 0.45 * Math.sin(p.progress * Math.PI);
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = hex2rgba(p.color, alpha);
        ctx.fill();

        // Trailing glow
        const tgrd = ctx.createRadialGradient(px, py, 0, px, py, 5);
        tgrd.addColorStop(0,   hex2rgba(p.color, 0.25));
        tgrd.addColorStop(1,   hex2rgba(p.color, 0.00));
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = tgrd;
        ctx.fill();

        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          // Reverse direction
          const tmp = p.from;
          p.from = p.to;
          p.to   = tmp;
          if (p.from !== -1 && p.to !== -1) {
            let newTo = Math.floor(Math.random() * nodes.length);
            while (newTo === p.from) newTo = Math.floor(Math.random() * nodes.length);
            p.to = newTo;
          }
        }
      });
    }

    function drawNode(n: AssetNode) {
      const pulse  = 1 + 0.10 * Math.sin(time * 1.1 + n.pulsePhase);
      const r      = n.nodeSize * pulse;

      // Outer glow
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.2);
      grd.addColorStop(0,   hex2rgba(n.color, 0.45));
      grd.addColorStop(0.5, hex2rgba(n.color, 0.12));
      grd.addColorStop(1,   hex2rgba(n.color, 0.00));
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 3.2, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // White disc
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle   = 'rgba(255,255,255,0.95)';
      ctx.fill();
      ctx.strokeStyle = n.color;
      ctx.lineWidth   = 1.6;
      ctx.stroke();

      // Ticker
      const fs = Math.max(6, Math.round(r * 0.78));
      ctx.font         = `bold ${fs}px system-ui,sans-serif`;
      ctx.fillStyle    = n.color;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.ticker, n.x, n.y);
    }

    function drawCaption() {
      const y = cy + Math.min(cx, cy) * 0.72;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = `600 10px system-ui,sans-serif`;
      ctx.fillStyle    = hex2rgba(BLUE, 0.30);
      ctx.letterSpacing = '0.14em';
      ctx.fillText('PORTFOLIO OPTIMIZATION', cx, y);
      ctx.letterSpacing = '0em';
    }

    // ── main loop ────────────────────────────────────────────────────────
    function frame() {
      time += 0.016;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      drawBackgroundRings();
      drawOrbitalRings();
      updateNodes();
      drawNodeConnections();
      drawHubSpokes();
      drawParticles();
      nodes.forEach(drawNode);
      drawHub();
      drawCaption();

      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}
