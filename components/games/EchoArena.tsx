'use client';
/**
 * EchoArena — WebGPU-powered top-down arena shooter
 * Category: Shooter / Arcade
 *
 * High-performance WebGPU rendering with Babylon.js
 * DualSense controller support (Bluetooth mobile + USB desktop)
 * Gyroscope aiming for natural mobile gameplay
 * Haptic rumble feedback on shooting
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';
import { createClient } from '@/lib/supabase/client';
import * as BABYLON from '@babylonjs/core';
import { DualSenseManager } from '@/components/gameengin/input/DualSenseManager';

type Phase = 'menu' | 'playing' | 'gameover';

export default function EchoArena() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('Ready to battle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.WebGPUEngine | BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const dualSenseRef = useRef<DualSenseManager | null>(null);
  const scoreRef = useRef(0);
  const lastShotRef = useRef(0);
  const submitScore = useSubmitScore('echo-arena');
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    if (phase === 'gameover') submitScore(scoreRef.current);
  }, [phase, submitScore]);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    lastShotRef.current = 0;
    setScore(0);
    setPhase('playing');
  }, [setPhase]);

  useGameAutoStart(phase === 'menu' ? startGame : null);

  // Listen for game input events (GameRemote + keyboard)
  useEffect(() => {
    if (phase !== 'playing') return;

    const handler = (e: Event) => {
      const { action, active } = (e as CustomEvent).detail;
      // DualSense gyro + sticks handled directly in render loop
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
    let player: BABYLON.Mesh | null = null;
    let floor: BABYLON.Mesh | null = null;

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
        scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.15, 1);

        // Camera (top-down view)
        const camera = new BABYLON.ArcRotateCamera('cam', 0, 0.5, 40, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvasRef.current, true);

        // Lighting
        new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

        // Arena floor
        floor = BABYLON.MeshBuilder.CreateGround('arena', { width: 50, height: 50 }, scene);
        const floorMat = new BABYLON.StandardMaterial('floor', scene);
        floorMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.4);
        floor.material = floorMat;

        // Player
        player = BABYLON.MeshBuilder.CreateSphere('player', { diameter: 2.5 }, scene);
        player.position.y = 1.5;
        const playerMat = new BABYLON.StandardMaterial('playerMat', scene);
        playerMat.emissiveColor = new BABYLON.Color3(0.3, 1, 0.8);
        player.material = playerMat;

        // DualSense controller
        dualSense = new DualSenseManager(scene, engine, setStatus);
        dualSenseRef.current = dualSense;
        await dualSense.init();

        // Game loop
        scene.onBeforeRenderObservable.add(() => {
          if (phaseRef.current !== 'playing' || !player || !dualSense) return;

          const input = dualSense.getState();

          // Movement with left stick
          const moveSpeed = 0.15;
          player.position.x += input.leftStick.x * moveSpeed;
          player.position.z += input.leftStick.y * moveSpeed;

          // Keep player in bounds
          player.position.x = Math.max(-23, Math.min(23, player.position.x));
          player.position.z = Math.max(-23, Math.min(23, player.position.z));

          // Aim with right stick + gyro
          const aimX = input.rightStick.x + input.gyro.x;
          if (Math.abs(aimX) > 0.1) {
            player.rotation.y += aimX * 0.15;
          }

          // Shoot with R2 trigger (with cooldown)
          const now = Date.now();
          if (input.triggers.r2 > 0.6 && now - lastShotRef.current > 300) {
            dualSense.rumble(0.5, 40);
            lastShotRef.current = now;
            scoreRef.current += 10;
            setScore(scoreRef.current);
            // In full version: spawn projectile
          }

          // Demo: end after 1000 points
          if (scoreRef.current >= 1000) {
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
        console.error('EchoArena init error:', err);
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
          <div style={{ fontSize: '48px' }}>🎯</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#a78bfa' }}>ECHO ARENA</div>
          <div style={{ fontSize: '16px', color: '#888', maxWidth: '300px', textAlign: 'center' }}>
            Top-down arena shooter powered by WebGPU
          </div>
          <div style={{ fontSize: '14px', color: '#555', maxWidth: '320px', textAlign: 'center' }}>
            Controls: Left Stick to move, Right Stick/Gyro to aim, R2 to shoot
          </div>
          <div style={{ fontSize: '14px', color: '#a78bfa', marginTop: '20px' }}>
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
            color: '#a78bfa',
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
            Score: {score}
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
          <div style={{ fontSize: '48px' }}>🏆</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#a78bfa' }}>ARENA CLEARED</div>
          <div style={{ fontSize: '24px', color: '#fff' }}>
            Final Score: {scoreRef.current}
          </div>
          <div style={{ fontSize: '14px', color: '#a78bfa', marginTop: '20px' }}>
            Press PLAY to battle again ▶
          </div>
        </div>
      )}
    </div>
  );
}
