'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { DrEamsAnimator, type DrEamsAction } from '@/lib/dreamengin/DrEamsAnimator';

/**
 * DrEamsCanvas -- renders the Dr. Eams mascot as an animated sprite canvas.
 * Uses the idle sprite sheet (4 cols x 4 rows = 16 frames) by default.
 * Tap zones: head = scan, stomach = fall, feet = jump.
 */

type Props = {
  width?: number;
  height?: number;
  className?: string;
  initialAction?: DrEamsAction;
};

export default function DrEamsCanvas({
  width = 160,
  height = 200,
  className = '',
  initialAction = 'idle',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatorRef = useRef<DrEamsAnimator | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/sprites/dr-eams-idle-16.jpg';

    img.onload = () => {
      const sheet = {
        image: img,
        frameW: Math.floor(img.naturalWidth / 4),
        frameH: Math.floor(img.naturalHeight / 4),
        cols: 4,
        rows: 4,
        totalFrames: 16,
      };

      const actions: Record<DrEamsAction, {
        name: DrEamsAction;
        frames: number[];
        fps: number;
        loop: boolean;
        holdLastFrameMs?: number;
      }> = {
        idle: {
          name: 'idle',
          frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          fps: 8,
          loop: true,
        },
        scan: {
          name: 'scan',
          frames: [4, 5, 6, 7],
          fps: 10,
          loop: false,
          holdLastFrameMs: 400,
        },
        jump: {
          name: 'jump',
          frames: [0, 1, 2, 3],
          fps: 14,
          loop: false,
        },
        fall: {
          name: 'fall',
          frames: [8, 9, 10, 11],
          fps: 12,
          loop: false,
          holdLastFrameMs: 300,
        },
      };

      const animator = new DrEamsAnimator(sheet, actions, {
        canvas,
        renderOnlyWhenDirty: false,
        devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      });

      animator.setAction(initialAction);
      animator.play();
      animatorRef.current = animator;
    };

    return () => {
      animatorRef.current?.stop();
      animatorRef.current = null;
    };
  }, [initialAction]);

  const handlePointer = useCallback((e: React.PointerEvent) => {
    animatorRef.current?.handlePointer(e.clientX, e.clientY);
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => animatorRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width,
        height,
        cursor: 'pointer',
        touchAction: 'none',
      }}
      onPointerDown={handlePointer}
      aria-label="Dr. Eams - Interactive mascot. Tap head, body, or feet for different reactions."
      role="img"
    />
  );
}
