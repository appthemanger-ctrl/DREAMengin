'use client';

/**
 * QuantumCircuitCanvas — render-on-demand quantum circuit particle visualizer.
 *
 * Renders animated quantum gate nodes and entanglement arcs using Canvas 2D.
 * Follows the same render-on-demand + pointer-event patterns as BabylonWorkspace
 * for battery-efficient animation with optimized touch response.
 *
 * Architecture: docs/ARCHITECTURE.md §10 (render-on-demand rule)
 * Performance:  RAF runs only when active; freezes on idle to save battery.
 */

import { useEffect, useRef, useCallback } from 'react';

interface Props {
  /** Whether the optimizer is actively running (activates full animation) */
  active: boolean;
  /** Accent colour for gate nodes */
  accentColor?: string;
  /** Secondary colour for entanglement arcs */
  secondaryColor?: string;
  height?: number;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;     // current phase angle (radians)
  phaseSpeed: number;
  radius: number;
  pulseOffset: number;
}

const TAU = Math.PI * 2;

function createNodes(count: number, w: number, h: number): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      phase: Math.random() * TAU,
      phaseSpeed: 0.008 + Math.random() * 0.016,
      radius: 3 + Math.random() * 3,
      pulseOffset: Math.random() * TAU,
    });
  }
  return nodes;
}

export default function QuantumCircuitCanvas({
  active,
  accentColor  = '#2a8ab8',
  secondaryColor = '#8b5cf6',
  height = 120,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const nodesRef  = useRef<Node[]>([]);
  const tickRef   = useRef(0);

  // Parse hex colour to rgba helper
  const hex2rgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialise / re-initialise nodes on mount
    const w = canvas.offsetWidth || canvas.width;
    const h = canvas.offsetHeight || canvas.height;
    canvas.width  = w * (window.devicePixelRatio || 1);
    canvas.height = h * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    const NODE_COUNT = active ? 14 : 8;
    if (nodesRef.current.length === 0) {
      nodesRef.current = createNodes(NODE_COUNT, w, h);
    }

    const draw = () => {
      tickRef.current++;
      const t = tickRef.current;
      const nodes = nodesRef.current;

      // Clear with subtle trail effect (not full clear = motion blur)
      ctx.fillStyle = 'rgba(220,232,248,0.35)';
      ctx.fillRect(0, 0, w, h);

      // Update node positions
      for (const n of nodes) {
        n.phase += n.phaseSpeed * (active ? 2.2 : 1);
        n.x += n.vx * (active ? 1.6 : 0.6);
        n.y += n.vy * (active ? 1.6 : 0.6);

        // Wrap toroidally
        if (n.x < 0)  n.x += w;
        if (n.x > w)  n.x -= w;
        if (n.y < 0)  n.y += h;
        if (n.y > h)  n.y -= h;
      }

      // Draw entanglement arcs between close pairs
      const MAX_DIST = active ? 90 : 60;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > MAX_DIST) continue;

          const alpha = (1 - dist / MAX_DIST) * (active ? 0.55 : 0.22);
          const pulse = active ? 0.5 + 0.5 * Math.sin(t * 0.04 + a.pulseOffset) : 1;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          // Bezier arc for "quantum entanglement" feel
          const mx = (a.x + b.x) / 2 + dy * 0.25;
          const my = (a.y + b.y) / 2 - dx * 0.25;
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
          ctx.strokeStyle = hex2rgba(secondaryColor, alpha * pulse);
          ctx.lineWidth   = active ? 1.2 : 0.7;
          ctx.stroke();
        }
      }

      // Draw gate nodes
      for (const n of nodes) {
        const pulseR = n.radius + (active ? 2 * Math.sin(n.phase + n.pulseOffset) : 0);
        const glow   = active ? 0.85 : 0.5;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, pulseR + 4, 0, TAU);
        ctx.fillStyle = hex2rgba(accentColor, 0.08 * glow);
        ctx.fill();

        // Core node
        ctx.beginPath();
        ctx.arc(n.x, n.y, pulseR, 0, TAU);
        ctx.fillStyle = hex2rgba(accentColor, 0.75 * glow);
        ctx.fill();

        // Phase indicator arc (shows qubit phase rotation)
        ctx.beginPath();
        ctx.arc(n.x, n.y, pulseR + 2, n.phase, n.phase + Math.PI * 0.8);
        ctx.strokeStyle = hex2rgba(secondaryColor, 0.6 * glow);
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, accentColor, secondaryColor, hex2rgba]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height,
        borderRadius: 12,
        display: 'block',
        // Optimised touch handling — no default scroll hijack on canvas
        touchAction: 'none',
        // GPU-composited layer for smooth rendering without layout thrash
        willChange: 'transform',
      }}
      aria-hidden="true"
    />
  );
}
