"use client";

import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

export interface PixiPhysicsLayerProps {
  worldWidth: number;
  worldHeight: number;
  onTransform: (t: { x: number; y: number; scale: number }) => void;
}

export default function PixiPhysicsLayer({ worldWidth, worldHeight, onTransform }: PixiPhysicsLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const tapRef = useRef<{ x: number; y: number; t: number; moved: boolean } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const app = new PIXI.Application();
    appRef.current = app;

    let destroyed = false;

    const init = async () => {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 2,
      });

      if (destroyed) return;

      container.appendChild(app.canvas);

      const viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth,
        worldHeight,
        events: app.renderer.events,
      });

      viewportRef.current = viewport;

      app.stage.addChild(viewport);

      viewport.drag({ wheel: false }).pinch().decelerate({ friction: 0.92, minSpeed: 0.05 });

      const canvas = app.canvas as unknown as HTMLCanvasElement;

      const onPointerDown = (e: PointerEvent) => {
        tapRef.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
      };

      const onPointerMove = (e: PointerEvent) => {
        const tap = tapRef.current;
        if (!tap) return;
        const dx = Math.abs(e.clientX - tap.x);
        const dy = Math.abs(e.clientY - tap.y);
        if (dx > 6 || dy > 6) tap.moved = true;
      };

      const onPointerUp = (e: PointerEvent) => {
        const tap = tapRef.current;
        tapRef.current = null;
        if (!tap) return;

        const dt = performance.now() - tap.t;
        if (tap.moved) return;
        if (dt > 260) return;

        canvas.style.pointerEvents = "none";
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (target) target.click();
        requestAnimationFrame(() => {
          canvas.style.pointerEvents = "auto";
        });
      };

      canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerup", onPointerUp, { passive: true });
      canvas.addEventListener("pointercancel", onPointerUp, { passive: true });

      app.ticker.add(() => {
        if (!viewportRef.current) return;
        const vp = viewportRef.current;

        if (vp.x < -worldWidth) vp.x = 0;
        if (vp.x > 0) vp.x = -worldWidth;

        if (vp.y < -worldHeight) vp.y = 0;
        if (vp.y > 0) vp.y = -worldHeight;

        onTransform({ x: vp.x, y: vp.y, scale: vp.scale.x });
      });

      const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        app.renderer.resize(w, h);
        viewport.resize(w, h, worldWidth, worldHeight);
      };

      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
      };
    };

    let cleanup: (() => void) | null = null;

    init().then((c) => {
      if (typeof c === "function") cleanup = c;
    });

    return () => {
      destroyed = true;
      if (cleanup) cleanup();
      try {
        app.destroy(true, { children: true, texture: true });
      } catch {
        // ignore
      }
    };
  }, [worldWidth, worldHeight, onTransform]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40"
      style={{ touchAction: "none" }}
      aria-hidden="true"
    />
  );
}
