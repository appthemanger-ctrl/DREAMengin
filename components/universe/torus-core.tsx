'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TorusCoreProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  glowIntensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  rings?: number;
  speed?: 'slow' | 'medium' | 'fast';
}

const sizeMap = {
  sm: { container: 'w-24 h-24', ring: 'w-20 h-20' },
  md: { container: 'w-40 h-40', ring: 'w-32 h-32' },
  lg: { container: 'w-56 h-56', ring: 'w-48 h-48' },
  xl: { container: 'w-72 h-72', ring: 'w-64 h-64' },
};

export function TorusCore({
  className,
  size = 'md',
  animated = true,
  glowIntensity = 'medium',
  interactive = true,
  rings = 1,
  speed = 'medium',
}: TorusCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!interactive || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePos({ x, y });
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  const glowStyles = {
    low: 'opacity-30',
    medium: 'opacity-50',
    high: 'opacity-70',
  };

  const rotateX = interactive ? (mousePos.y - 0.5) * 30 : 0;
  const rotateY = interactive ? (mousePos.x - 0.5) * 30 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center perspective-1000',
        sizeMap[size].container,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ perspective: '1000px' }}
    >
      {/* Outer glow */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-700',
          glowStyles[glowIntensity],
          isHovered && 'scale-110'
        )}
        style={{
          background: 'radial-gradient(circle, hsl(var(--glow-primary) / 0.4) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Main torus ring */}
      <div
        className={cn(
          'relative rounded-full border-4 transition-all duration-300',
          sizeMap[size].ring,
          animated && 'animate-torus',
          isHovered && 'border-primary'
        )}
        style={{
          borderColor: 'hsl(var(--primary) / 0.6)',
          transform: `rotateX(${60 + rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
          boxShadow: `
            0 0 20px hsl(var(--glow-primary) / 0.3),
            inset 0 0 20px hsl(var(--glow-primary) / 0.1)
          `,
        }}
      >
        {/* Inner ring detail */}
        <div
          className="absolute inset-4 rounded-full border-2"
          style={{
            borderColor: 'hsl(var(--primary) / 0.3)',
          }}
        />
        
        {/* Center orb */}
        <div
          className={cn(
            'absolute inset-8 rounded-full transition-all duration-500',
            isHovered && 'scale-110'
          )}
          style={{
            background: `radial-gradient(circle at 30% 30%, 
              hsl(var(--primary) / 0.8) 0%, 
              hsl(var(--primary) / 0.4) 50%, 
              hsl(var(--primary) / 0.1) 100%)`,
            boxShadow: '0 0 30px hsl(var(--glow-primary) / 0.5)',
          }}
        />
      </div>

      {/* Orbital particles */}
      {animated && (
        <>
          <div
            className="absolute w-2 h-2 rounded-full bg-accent animate-orbit"
            style={{ animationDelay: '0s', animationDuration: '10s' }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-primary animate-orbit"
            style={{ animationDelay: '-3s', animationDuration: '15s' }}
          />
          <div
            className="absolute w-1 h-1 rounded-full bg-accent/60 animate-orbit"
            style={{ animationDelay: '-7s', animationDuration: '20s' }}
          />
        </>
      )}
    </div>
  );
}

export default TorusCore;
