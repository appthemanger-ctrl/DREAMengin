// components/dreamengin/BabylonGameScene.tsx
// Babylon.js v8 real-time 3D scene for the GameEngin.
// God Tier Engine integrated — hardware scaling, image processing, mesh policy.

'use client';

import { useEffect, useRef } from 'react';
import { createBabylonEngine } from '@/lib/babylon/createEngine';
import {
  DreamEngineGodTierSystem,
  applyGodTierToBabylon,
  defaultDeviceSignals,
  defaultRuntimeMetrics,
  defaultUXSignals,
  defaultRouteSignals,
} from '@/lib/god-tier/godTierEngine';

interface BabylonGameSceneProps {
  onGameSelect?: (gameId: string) => void;
}

export default function BabylonGameScene({ onGameSelect }: BabylonGameSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<import('@babylonjs/core').AbstractEngine | null>(null);
  // God Tier system instance — persists for this scene's lifetime
  const godTierRef = useRef(new DreamEngineGodTierSystem());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    // WebGPU-first engine creation with WebGL fallback, then dynamic import of scene helpers
    Promise.all([
      createBabylonEngine(canvas, { preserveDrawingBuffer: true, stencil: true, antialias: true }),
      import('@babylonjs/core'),
    ]).then(([{ engine }, {
      Scene,
      ArcRotateCamera,
      HemisphericLight,
      Vector3,
      MeshBuilder,
      StandardMaterial,
      Color3,
      Animation,
    }]) => {
      if (disposed || !canvas) { engine.dispose(); return; }

      engineRef.current = engine;
      const scene = new Scene(engine);
      scene.clearColor = new (scene.clearColor.constructor as new (r: number, g: number, b: number, a: number) => typeof scene.clearColor)(0.05, 0.07, 0.12, 1);

      // Apply God Tier hardware scaling on scene creation
      const initialState = godTierRef.current.update({
        device:  defaultDeviceSignals(),
        runtime: defaultRuntimeMetrics(),
        ux:      defaultUXSignals(),
        route:   defaultRouteSignals('/game-hub'),
        meshes: [],
        ui: [],
      });
      applyGodTierToBabylon(engine, { meshes: [] }, initialState, window.devicePixelRatio ?? 1);

      // Camera — orbiting the game hub
      const camera = new ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3.5, 18, Vector3.Zero(), scene);
      camera.attachControl(canvas, true);
      camera.lowerRadiusLimit = 6;
      camera.upperRadiusLimit = 30;
      camera.upperBetaLimit = Math.PI / 2.2;

      // Lighting
      const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
      light.intensity = 0.9;
      light.groundColor = new Color3(0.1, 0.1, 0.3);

      // Ground platform
      const ground = MeshBuilder.CreateCylinder('ground', { diameter: 16, height: 0.3, tessellation: 64 }, scene);
      const groundMat = new StandardMaterial('groundMat', scene);
      groundMat.diffuseColor = new Color3(0.08, 0.12, 0.22);
      groundMat.specularColor = new Color3(0.1, 0.2, 0.4);
      ground.material = groundMat;
      ground.isPickable = false;

      // Center hub sphere
      const hub = MeshBuilder.CreateSphere('hub', { diameter: 2.2, segments: 32 }, scene);
      const hubMat = new StandardMaterial('hubMat', scene);
      hubMat.diffuseColor = new Color3(0.16, 0.54, 0.72);
      hubMat.emissiveColor = new Color3(0.04, 0.12, 0.2);
      hub.material = hubMat;

      // Hub pulse animation
      const pulseAnim = new Animation('pulse', 'scaling', 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
      pulseAnim.setKeys([
        { frame: 0, value: new Vector3(1, 1, 1) },
        { frame: 30, value: new Vector3(1.06, 1.06, 1.06) },
        { frame: 60, value: new Vector3(1, 1, 1) },
      ]);
      hub.animations = [pulseAnim];
      scene.beginAnimation(hub, 0, 60, true);

      // Game orbs — 8 surrounding game icons in a ring
      const GAME_COLORS: [number, number, number][] = [
        [0.93, 0.26, 0.26], // Red — RTS
        [0.23, 0.72, 0.38], // Green — Tower Defense
        [0.37, 0.51, 0.95], // Blue — Space Shooter
        [0.93, 0.62, 0.13], // Orange — Match-3
        [0.55, 0.33, 0.95], // Purple — Tetris
        [0.93, 0.33, 0.60], // Pink — Rhythm
        [0.16, 0.74, 0.72], // Teal — Racing
        [0.92, 0.85, 0.26], // Gold — RPG
      ];

      const GAME_IDS = ['rts', 'tower-defense', 'space-shooter', 'match3', 'tetris', 'rhythm', 'racing', 'rpg'];

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 5.5;
        const orb = MeshBuilder.CreateSphere(`orb_${i}`, { diameter: 1.1, segments: 16 }, scene);
        orb.position = new Vector3(Math.cos(angle) * radius, 0.8, Math.sin(angle) * radius);
        const [r, g, b] = GAME_COLORS[i];
        const orbMat = new StandardMaterial(`orbMat_${i}`, scene);
        orbMat.diffuseColor = new Color3(r, g, b);
        orbMat.emissiveColor = new Color3(r * 0.3, g * 0.3, b * 0.3);
        orb.material = orbMat;
        orb.isPickable = true;
        orb.metadata = { gameId: GAME_IDS[i] };

        // Orbit animation
        const orbitAnim = new Animation(`orbit_${i}`, 'position.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        const phaseOffset = (i / 8) * 60;
        orbitAnim.setKeys([
          { frame: 0 + phaseOffset, value: 0.8 },
          { frame: 30 + phaseOffset, value: 1.3 },
          { frame: 60 + phaseOffset, value: 0.8 },
        ]);
        orb.animations = [orbitAnim];
        scene.beginAnimation(orb, 0, 60, true);
      }

      // Outer ring decoration
      const ring = MeshBuilder.CreateTorus('ring', { diameter: 13, thickness: 0.08, tessellation: 80 }, scene);
      ring.rotation.x = Math.PI / 2;
      const ringMat = new StandardMaterial('ringMat', scene);
      ringMat.diffuseColor = new Color3(0.16, 0.54, 0.72);
      ringMat.emissiveColor = new Color3(0.04, 0.18, 0.3);
      ring.material = ringMat;

      // Ring rotation
      scene.registerBeforeRender(() => {
        ring.rotation.z += 0.003;
        hub.rotation.y += 0.008;
      });

      // Click handler for game orbs
      scene.onPointerObservable.add((pointerInfo) => {
        // PointerEventTypes.POINTERTAP = 4 (from @babylonjs/core)
        if (pointerInfo.type === 4 && pointerInfo.pickInfo?.hit) {
          const mesh = pointerInfo.pickInfo.pickedMesh;
          if (mesh?.metadata?.gameId && onGameSelect) {
            onGameSelect(mesh.metadata.gameId);
          }
        }
      });

      // Render loop — God Tier drives hardware scaling each frame
      let lastGodTierMs = 0;
      engine.runRenderLoop(() => {
        scene.render();
        // Re-evaluate God Tier state ~every 500ms to react to frame pressure
        const now = performance.now();
        if (now - lastGodTierMs > 500) {
          lastGodTierMs = now;
          const perf = (engine as import('@babylonjs/core').Engine).performanceMonitor;
          const avgFrame = perf ? perf.averageFrameTime : 16.6;
          const gtState = godTierRef.current.update({
            device:  defaultDeviceSignals(),
            runtime: {
              frameMs: avgFrame,
              avgFrameMs: avgFrame,
              cpuMs: avgFrame * 0.4,
              gpuMs: avgFrame * 0.5,
              droppedFrameRatio: perf ? (perf.averageFrameTime > 20 ? 0.1 : 0) : 0,
              inputLatencyMs: 20,
              scrollVelocity: 0,
              pointerVelocity: 0,
              interactionBurst: 0,
            },
            ux:    defaultUXSignals(),
            route: defaultRouteSignals('/game-hub'),
            meshes: scene.meshes.map((m) => ({
              id: m.id,
              visible: m.isVisible,
              interactive: m.isPickable,
              nearPointer: false,
              distanceToCamera: m.getDistanceToCamera ? m.getDistanceToCamera(scene.activeCamera!) : 10,
              transformDelta: 0,
              materialChanged: false,
              screenCoverage: 0.1,
              semanticWeight: m.id.startsWith('orb') ? 1 : 0.3,
              motionWeight: m.id === 'hub' || m.id.startsWith('orb') ? 0.8 : 0.1,
              detailWeight: 0.5,
              heroWeight: m.id === 'hub' ? 1 : m.id.startsWith('orb') ? 0.7 : 0.2,
              occluded: false,
            })),
            ui: [],
          });
          applyGodTierToBabylon(engine, scene as unknown as import('@/lib/god-tier/godTierEngine').BabylonSceneLike, gtState, window.devicePixelRatio ?? 1);
        }
      });

      const onResize = () => engine.resize();
      window.addEventListener('resize', onResize);

      // Initial static mesh freeze — God Tier will manage ongoing policy
      ground.freezeWorldMatrix();
      ring.freezeWorldMatrix();
    }).catch(() => {
      // Babylon.js failed to load — graceful fallback handled by parent
    });

    return () => {
      disposed = true;
      if (engineRef.current) {
        engineRef.current.stopRenderLoop();
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [onGameSelect]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: 320,
        borderRadius: 12,
        border: '1.5px solid rgba(42,138,184,0.25)',
        display: 'block',
        background: 'linear-gradient(135deg, #0d1117, #0d1b2a)',
      }}
      aria-label="DREAMengin 3D Game Hub — click a sphere to launch a game"
    />
  );
}
