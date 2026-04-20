'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface StarFieldProps {
  className?: string;
  density?: 'sparse' | 'medium' | 'dense';
  speed?: 'slow' | 'medium' | 'fast';
  interactive?: boolean;
}

export function StarField({
  className,
  density = 'medium',
  speed = 'slow',
  interactive = false,
}: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Star properties
    const densityMap = { sparse: 50, medium: 100, dense: 200 };
    const speedMap = { slow: 0.2, medium: 0.5, fast: 1 };
    const numStars = densityMap[density];
    const baseSpeed = speedMap[speed];

    // Create stars
    const stars: {
      x: number;
      y: number;
      z: number;
      size: number;
      opacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }[] = [];

    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        z: Math.random() * 1000,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    let animationId: number;
    let time = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      time += 0.016; // ~60fps

      stars.forEach((star) => {
        // Calculate twinkle
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinklePhase) * 0.3 + 0.7;
        
        // Interactive parallax
        let offsetX = 0;
        let offsetY = 0;
        if (interactive) {
          const depth = star.z / 1000;
          offsetX = (mouseRef.current.x - rect.width / 2) * depth * 0.05;
          offsetY = (mouseRef.current.y - rect.height / 2) * depth * 0.05;
        }

        // Move stars slowly
        star.y += baseSpeed * (1 - star.z / 1000);
        if (star.y > rect.height) {
          star.y = 0;
          star.x = Math.random() * rect.width;
        }

        // Draw star
        const x = star.x + offsetX;
        const y = star.y + offsetY;
        const size = star.size * (1 - star.z / 2000);
        const opacity = star.opacity * twinkle;

        // Create gradient for glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        gradient.addColorStop(0, `hsla(210, 100%, 80%, ${opacity})`);
        gradient.addColorStop(0.5, `hsla(210, 100%, 70%, ${opacity * 0.3})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core of star
        ctx.fillStyle = `hsla(210, 100%, 95%, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Mouse tracking for parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [density, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('fixed inset-0 w-full h-full pointer-events-none', className)}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

export default StarField;
