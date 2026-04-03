'use client';

/**
 * DREAMenginOS — WebGPU-first Babylon.js 9.0 OS-level scene.
 *
 * Features:
 *   • WebGPU engine via createBabylonEngine (WebGL fallback)
 *   • Havok V2 physics (optional — gracefully skipped if WASM fails to load)
 *   • Audio-reactive glow, bloom, chromatic aberration post-pipeline
 *   • Physics impulse on high-bass audio events
 *   • Status HUD overlay with pulse indicator
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Scene as BabylonScene, AbstractEngine } from '@babylonjs/core';
import { createBabylonEngine } from '@/lib/babylon/createEngine';

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface DREAMenginOSProps {
  /** Optional Web Audio AnalyserNode for audio-reactive visuals */
  audioSource?: AnalyserNode;
  /** Called once the Babylon scene is fully ready */
  onReady?: (scene: BabylonScene) => void;
}

type SystemStatus =
  | 'OFFLINE'
  | 'BOOTING_CORE_V9'
  | 'SYNCING_HAVOK_V2'
  | 'DREAM_V9_ACTIVE';

/* ── Component ────────────────────────────────────────────────────────────── */

export default function DREAMenginOS({ audioSource, onReady }: DREAMenginOSProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AbstractEngine | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('OFFLINE');
  const [pulseIntensity, setPulseIntensity] = useState(0);

  /* Stable ref so the render-loop closure always reads the latest analyser */
  const audioRef = useRef(audioSource);
  useEffect(() => {
    audioRef.current = audioSource;
  }, [audioSource]);

  const launchOS = useCallback(async (canvas: HTMLCanvasElement) => {
    setSystemStatus('BOOTING_CORE_V9');

    /* ── 1. Engine (WebGPU-first, WebGL fallback) ───────────────────────── */
    const { engine } = await createBabylonEngine(canvas, {
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    /* Dynamic import keeps bundle-split clean */
    const {
      Scene,
      Vector3,
      Color4,
      DefaultRenderingPipeline,
      GlowLayer,
      HavokPlugin,
    } = await import('@babylonjs/core');

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.01, 0.01, 0.03, 1);

    /* ── 2. Havok V2 Physics (optional) ─────────────────────────────────── */
    setSystemStatus('SYNCING_HAVOK_V2');
    try {
      const HavokPhysics = (await import('@babylonjs/havok')).default;
      const havokWasm = await HavokPhysics();
      const physics = new HavokPlugin(true, havokWasm);
      scene.enablePhysics(new Vector3(0, -9.81, 0), physics);
    } catch {
      // Havok WASM may fail in SSR tests or unsupported environments — continue
      // without physics so the visual pipeline still works.
      console.warn('[DREAMenginOS] Havok physics unavailable — continuing without physics');
    }

    /* ── 3. Post-processing pipeline ────────────────────────────────────── */
    const pipeline = new DefaultRenderingPipeline('DREAM_PIPE', true, scene);
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.2;
    pipeline.bloomWeight = 0.5;
    pipeline.chromaticAberrationEnabled = true;
    pipeline.chromaticAberration.aberrationAmount = 25;

    const glow = new GlowLayer('OS_GLOW', scene);
    glow.intensity = 0.5;

    /* ── 4. Audio-reactive render loop ──────────────────────────────────── */
    scene.onBeforeRenderObservable.add(() => {
      const analyser = audioRef.current;
      if (!analyser) return;

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);

      const bass = freqData[2] / 255;
      setPulseIntensity(bass);
      glow.intensity = 0.3 + bass * 1.5;

      // High-bass impulse on physics bodies
      if (bass > 0.8) {
        for (const m of scene.meshes) {
          if (m.physicsBody) {
            m.physicsBody.applyImpulse(
              new Vector3(0, bass * 0.15, 0),
              m.getAbsolutePosition(),
            );
          }
        }
      }
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    setSystemStatus('DREAM_V9_ACTIVE');
    onReady?.(scene);
  }, [onReady]);

  /* ── Lifecycle ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    launchOS(canvas);

    const handleResize = () => engineRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [launchOS]);

  /* ── Render ─────────────────────────────────────────────────────────────── */

  const statusColor =
    systemStatus === 'DREAM_V9_ACTIVE'
      ? '#5de8ff'
      : systemStatus === 'OFFLINE'
        ? '#ff4444'
        : '#e8c040';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Status HUD */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'monospace',
          fontSize: 11,
          color: statusColor,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {/* Pulse dot */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColor,
            opacity: 0.6 + pulseIntensity * 0.4,
            boxShadow: `0 0 ${4 + pulseIntensity * 8}px ${statusColor}`,
          }}
        />
        {systemStatus}
      </div>
    </div>
  );
}
