'use client';

import { useState, useEffect } from 'react';

function Star({ top, left, delay, size }: { top: number; left: number; delay: number; size: number }) {
  return (
    <div
      className="absolute rounded-full bg-white animate-star-twinkle"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: size,
        height: size,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export function StarsBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate stars with fixed seed for SSR consistency
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    top: ((i * 17) % 100),
    left: ((i * 23) % 100),
    delay: (i % 3),
    size: (i % 2) + 1,
  }));

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}
    </div>
  );
}
