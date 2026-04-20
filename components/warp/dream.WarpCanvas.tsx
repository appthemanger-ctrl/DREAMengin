'use client';

/**
 * WarpCanvas — a full-viewport fixed canvas overlay that renders the
 * WarpEngine particle simulation as a subtle background effect on every
 * page of DREAMengin.
 *
 * It sits at z-index 0, behind all page content, with pointer-events:none
 * so it never intercepts clicks or touches.
 */

import React from 'react';
import { useWarp } from '@/lib/warp/useWarp';
import type { WarpEffect } from '@/lib/warp/warpEngine';

export interface WarpCanvasProps {
  /** Which visual effect to render. Default: 'flow'. */
  effect?: WarpEffect;
  /** Override the maximum particle count (default: 200). */
  maxParticles?: number;
  /** Override the spawn rate (default: 25). */
  spawnRate?: number;
  /** Overall canvas opacity (0–1). Default: 0.35. */
  opacity?: number;
}

export default function WarpCanvas({
  effect      = 'flow',
  maxParticles = 200,
  spawnRate    = 25,
  opacity      = 0.35,
}: WarpCanvasProps) {
  const { canvasRef } = useWarp({ effect, maxParticles, spawnRate, autoStart: true });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        zIndex:        0,
        pointerEvents: 'none',
        opacity,
        mixBlendMode:  'screen',
      }}
    />
  );
}
