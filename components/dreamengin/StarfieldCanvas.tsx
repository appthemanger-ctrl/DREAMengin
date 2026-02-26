'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  drift: number;
}

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      particles = [];
      const count = Math.min(55, Math.floor((window.innerWidth * window.innerHeight) / 18000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x:       Math.random() * window.innerWidth,
          y:       Math.random() * window.innerHeight,
          size:    Math.random() * 1.8 + 0.4,
          speed:   Math.random() * 0.12 + 0.04, // ultra-slow
          opacity: Math.random() * 0.22 + 0.06,
          drift:   (Math.random() - 0.5) * 0.06,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${p.opacity})`;
        ctx.fill();

        // ultra-slow drift
        p.y += p.speed;
        p.x += p.drift;

        // wrap
        if (p.y > canvas.height + 4)  p.y = -4;
        if (p.x > canvas.width + 4)   p.x = -4;
        if (p.x < -4)                  p.x = canvas.width + 4;
      }
      animId = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    const handleResize = () => { resize(); init(); };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="de-snow-canvas"
      aria-hidden="true"
    />
  );
}
