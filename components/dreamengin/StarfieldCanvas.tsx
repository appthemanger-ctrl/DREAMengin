'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
  bright: number;
  vy: number;
}

/**
 * Dual-mode starfield/snowfield canvas.
 * Reads --starfield-style from CSS to decide between
 * soft snow sparkles (light) or twinkling stars (dark).
 */
export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    let particles: Particle[] = [];
    let t = 0;

    function getStyle(): 'light' | 'dark' {
      return getComputedStyle(document.documentElement).getPropertyValue('--starfield-style').trim() === 'light'
        ? 'light'
        : 'dark';
    }

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      const isLight = getStyle() === 'light';
      const count = isLight ? 120 : 220;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: isLight ? Math.random() * 2.0 + 0.5 : Math.random() * 1.3 + 0.2,
        speed: Math.random() * 0.5 + 0.1,
        phase: Math.random() * Math.PI * 2,
        bright: isLight ? Math.random() * 0.35 + 0.08 : Math.random() * 0.65 + 0.1,
        vy: isLight ? Math.random() * 0.15 + 0.02 : 0,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      t += 0.008;
      const isLight = getStyle() === 'light';

      for (const p of particles) {
        const a = p.bright * (0.5 + 0.5 * Math.sin(t * p.speed + p.phase));

        if (isLight) {
          // Soft sparkle / snow effect for Dream Ice
          p.y += p.vy;
          if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; }
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255,255,255,${(a * 1.2).toFixed(3)})`;
          ctx!.fill();
        } else {
          // Classic twinkling stars for dark themes
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(200,220,255,${a.toFixed(3)})`;
          ctx!.fill();
        }
      }
      frameRef.current = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);

    // Re-init when theme changes
    const observer = new MutationObserver(() => { initParticles(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
