'use client';
/**
 * NeonDrift — WebGPU-powered cyberpunk endless racer
 * Category: Racing / Arcade
 *
 * High-performance WebGPU rendering with Babylon.js
 * DualSense controller support (Bluetooth mobile + USB desktop)
 * Gyroscope steering for natural mobile gameplay
 * Haptic rumble feedback on high speed
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';
import { createClient } from '@/lib/supabase/client';
import * as BABYLON from '@babylonjs/core';
import { DualSenseManager } from '@/components/gameengin/input/DualSenseManager';

type Phase = 'menu' | 'playing' | 'gameover';

export default function NeonDrift() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('Ready to race');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.WebGPUEngine | BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const dualSenseRef = useRef<DualSenseManager | null>(null);
  const scoreRef = useRef(0);
  const speedRef = useRef(0);
  const distanceRef = useRef(0);
  const submitScore = useSubmitScore('neon-drift');
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    if (phase === 'gameover') submitScore(Math.floor(distanceRef.current));
  }, [phase, submitScore]);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    speedRef.current = 0;
    distanceRef.current = 0;
    setScore(0);
    setPhase('playing');
  }, [setPhase]);

  useGameAutoStart(phase === 'menu' ? startGame : null);

  // Listen for game input events (GameRemote + keyboard)
  useEffect(() => {
    if (phase !== 'playing') return;

    const handler = (e: Event) => {
      const { action, active } = (e as CustomEvent).detail;
      // DualSense gyro + stick handled directly in render loop
      // This is for GameRemote/keyboard fallback
    };

    window.addEventListener('de-game-input', handler);
    return () => window.removeEventListener('de-game-input', handler);
  }, [phase]);

  // Initialize WebGPU/WebGL engine
  useEffect(() => {
    if (!canvasRef.current) return;

    let engine: BABYLON.WebGPUEngine | BABYLON.Engine | null = null;
    let scene: BABYLON.Scene | null = null;
    let dualSense: DualSenseManager | null = null;
    let car: BABYLON.Mesh | null = null;
    let ground: BABYLON.Mesh | null = null;
    let lastRumble = 0;

    const init = async () => {
      if (!canvasRef.current) return;

      try {
        // WebGPU-first with WebGL fallback
        const { WebGPUEngine, Engine } = await import('@babylonjs/core/Engines');

        let webGPUSupported = false;
        try {
          webGPUSupported = await WebGPUEngine.IsSupportedAsync;
        } catch {
          webGPUSupported = false;
        }

        if (webGPUSupported) {
          engine = new WebGPUEngine(canvasRef.current, {
            powerPreference: 'high-performance',
            antialias: true,
          });
          await (engine as BABYLON.WebGPUEngine).initAsync();

          // Snapshot rendering for optimal performance
          (engine as BABYLON.WebGPUEngine).snapshotRendering = true;
          (engine as BABYLON.WebGPUEngine).snapshotRenderingMode = BABYLON.Constants.SNAPSHOTRENDERING_FAST;

          setStatus('WebGPU active — Press PLAY to start');
        } else {
          engine = new Engine(canvasRef.current, true, {
            preserveDrawingBuffer: true,
            stencil: true,
          });
          setStatus('WebGL active — Press PLAY to start');
        }

        engineRef.current = engine;
        scene = new BABYLON.Scene(engine);
        sceneRef.current = scene;
        scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.04, 1);

        // Camera
        const camera = new BABYLON.ArcRotateCamera('cam', 0, Math.PI / 3, 30, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvasRef.current, true);

        // Lighting
        new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

        // Track
        ground = BABYLON.MeshBuilder.CreateGround('track', { width: 40, height: 300 }, scene);
        const mat = new BABYLON.StandardMaterial('neon', scene);
        mat.emissiveColor = new BABYLON.Color3(0, 0.9, 1);
        ground.material = mat;

        // Car
        car = BABYLON.MeshBuilder.CreateBox('car', { width: 3, height: 1.5, depth: 5 }, scene);
        car.position.y = 2;
        const carMat = new BABYLON.StandardMaterial('carMat', scene);
        carMat.emissiveColor = new BABYLON.Color3(1, 0.3, 0.8);
        car.material = carMat;

        // DualSense controller
        dualSense = new DualSenseManager(scene, engine, setStatus);
        dualSenseRef.current = dualSense;
        await dualSense.init();

        // Game loop
        scene.onBeforeRenderObservable.add(() => {
          if (phaseRef.current !== 'playing' || !car || !dualSense) return;

          const input = dualSense.getState();

          // Speed control with R2 trigger (or auto-accelerate)
          const accel = input.triggers.r2 > 0.1 ? input.triggers.r2 : 0.3;
          speedRef.current = Math.max(0, Math.min(25, speedRef.current + accel * 0.8 - 0.3));

          // Forward motion
          car.position.z += speedRef.current * 0.15;
          distanceRef.current += speedRef.current * 0.15;

          // Gyro + left stick steering (phone tilt feels natural)
          car.rotation.y = input.gyro.x * 1.2 + input.leftStick.x * 0.8;

          // High-speed rumble feedback (throttled)
          const now = Date.now();
          if (speedRef.current > 18 && now - lastRumble > 200) {
            dualSense.rumble(0.7, 60);
            lastRumble = now;
          }

          // Update score display
          scoreRef.current = Math.floor(distanceRef.current);
          if (scoreRef.current % 10 === 0) {
            setScore(scoreRef.current);
          }

          // Game over condition (demo: reach 10000 distance)
          if (distanceRef.current > 10000) {
            setPhase('gameover');
          }
        });

        // Render loop
        engine.runRenderLoop(() => scene?.render());

        // Responsive resize
        const parentElement = canvasRef.current.parentElement;
        if (parentElement) {
          const resizeObserver = new ResizeObserver(() => engine?.resize());
          resizeObserver.observe(parentElement);
          return () => resizeObserver.disconnect();
        }

      } catch (err: any) {
        console.error('NeonDrift init error:', err);
        setStatus('Error: ' + err.message);
      }
    };

    if (phase === 'playing') {
      init();
    }

    return () => {
      dualSense?.dispose();
      scene?.dispose();
      engine?.dispose();
    };
  }, [phase, phaseRef, setPhase]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      {phase === 'menu' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 100%)'
        }}>
          <div style={{ fontSize: '48px' }}>🏎️</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0ff' }}>NEON DRIFT</div>
          <div style={{ fontSize: '16px', color: '#888', maxWidth: '300px', textAlign: 'center' }}>
            Cyberpunk endless racer powered by WebGPU
          </div>
          <div style={{ fontSize: '14px', color: '#555', maxWidth: '320px', textAlign: 'center' }}>
            Controls: R2 to accelerate, Left Stick/Gyro to steer
          </div>
          <div style={{ fontSize: '14px', color: '#0ff', marginTop: '20px' }}>
            Press PLAY or tap game to start ▶
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: '#0ff',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}>
            {status}
          </div>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '4px',
            fontSize: '20px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
          }}>
            {score.toLocaleString()}m
          </div>
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: '#0ff',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}>
            Speed: {Math.floor(speedRef.current * 10)}
          </div>
        </>
      )}

      {phase === 'gameover' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          background: 'rgba(0,0,0,0.9)'
        }}>
          <div style={{ fontSize: '48px' }}>🏁</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0ff' }}>RACE COMPLETE</div>
          <div style={{ fontSize: '24px', color: '#fff' }}>
            Distance: {Math.floor(distanceRef.current).toLocaleString()}m
          </div>
          <div style={{ fontSize: '14px', color: '#0ff', marginTop: '20px' }}>
            Press PLAY to race again ▶
          </div>
        </div>
      )}
    </div>
  );
}
