"use client";

import { useRef } from "react";
import { useDreamLogoScene, type DreamLogoSceneOptions } from "@/lib/babylon/useDreamLogoScene";

interface DreamEnginLogoProps extends DreamLogoSceneOptions {
  /** Canvas width in CSS pixels (default 320) */
  width?: number;
  /** Canvas height in CSS pixels (default 160) */
  height?: number;
  className?: string;
}

/**
 * DreamEnginLogo
 * ──────────────
 * Renders the animated DREAMengin logo inside a Babylon.js WebGL canvas.
 *
 * Usage
 * -----
 * ```tsx
 * import { DreamEnginLogo } from "@/components/DreamEnginLogo";
 *
 * export default function LandingPage() {
 *   return (
 *     <main>
 *       <DreamEnginLogo width={480} height={240} />
 *     </main>
 *   );
 * }
 * ```
 *
 * Texture notes
 * -------------
 * Textures are loaded with NEAREST sampling so crisp pixel art / vector
 * exports stay sharp at any canvas size. Babylon does NOT apply bilinear
 * blur when this mode is set.
 */
export function DreamEnginLogo({
  width = 320,
  height = 160,
  className,
}: DreamEnginLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useDreamLogoScene();

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: "block", background: "transparent" }}
      aria-label="DREAMengin animated logo"
    />
  );
}
