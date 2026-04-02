'use client';
/**
 * NeonDrift — Elite WebGPU cyberpunk endless racer — 2026 Edition
 * Category: Racing / Arcade
 *
 * Powered by the DREAMengin Elite Game Engine core:
 *  • WebGPU-first Babylon.js rendering with auto WebGL2 fallback
 *  • Post-processing pipeline: neon bloom, glow layer, chromatic aberration
 *  • AI Director: adaptive difficulty via TensorFlow.js (in-browser, privacy-first)
 *  • Procedural neon track with dynamic lane obstacles and boost gates
 *  • Particle trail system tied to speed and drifting
 *  • Adaptive quality scaling (ultra → low) based on real frame telemetry
 *  • DualSense controller support (Bluetooth mobile + USB desktop)
 *  • Gyroscope steering for natural mobile gameplay
 *  • Haptic rumble feedback on crash/boost/speed
 *  • Score multiplier chains and distance bonuses
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';
import { publishGamePerformanceBaseline } from '@/lib/games/performance-baseline';
import * as BABYLON from '@babylonjs/core';
import { DualSenseManager } from '@/components/gameengin/input/DualSenseManager';
import { EliteGameEngine } from '@/lib/gameengin';
import { AIDirector } from '@/lib/gameengin/ai-director';
import { PostFXManager } from '@/lib/gameengin/post-fx';

type Phase = 'menu' | 'playing' | 'gameover';

// ─── Track constants ──────────────────────────────────────────────────────────
const LANE_COUNT    = 5;          // five lanes
const LANE_WIDTH    = 3.0;        // Babylon units per lane
const TRACK_WIDTH   = LANE_COUNT * LANE_WIDTH; // 15 BU wide
const OBS_POOL_SIZE = 40;         // recycled obstacle meshes
const BOOST_POOL    = 8;          // boost gate meshes
const TILE_LENGTH   = 30;         // BU per track tile
const TILE_COUNT    = 12;         // tiles in the ring buffer
const TOTAL_TILES   = TILE_COUNT * TILE_LENGTH;

// Obstacle types
const OBS_BARRIER = 0; // red barrier block
const OBS_PILLAR  = 1; // tall neon pillar
const OBS_RAMP    = 2; // low ramp (passable at speed)

interface ObstacleState {
  mesh: BABYLON.Mesh;
  lane: number;
  type: number;
  active: boolean;
  z: number;
}

interface BoostGateState {
  meshL: BABYLON.Mesh;
  meshR: BABYLON.Mesh;
  active: boolean;
  z: number;
}

// Lane X positions (centre of each lane)
function laneX(lane: number): number {
  return (lane - Math.floor(LANE_COUNT / 2)) * LANE_WIDTH;
}

export default function NeonDrift() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [directorLabel, setDirectorLabel] = useState('');
  const [renderInfo, setRenderInfo] = useState('');
  const [status, setStatus] = useState('Ready to race');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eliteEngineRef = useRef<EliteGameEngine | null>(null);
  const engineRef = useRef<BABYLON.AbstractEngine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const dualSenseRef = useRef<DualSenseManager | null>(null);
  const postFxRef = useRef<PostFXManager | null>(null);
  const directorRef = useRef<AIDirector>(new AIDirector());
  const telemetryEntityRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const speedRef = useRef(0);
  const distanceRef = useRef(0);
  const carLaneRef = useRef(2); // start in middle lane (0-indexed)
  const carXRef = useRef(laneX(2));
  const deathsRef = useRef(0);
  const comboRef = useRef(1);
  const invincibleRef = useRef(0); // invincibility frames after crash
  const submitScore = useSubmitScore('neon-drift');

  useEffect(() => {
    if (phase === 'gameover') submitScore(Math.floor(distanceRef.current));
  }, [phase, submitScore]);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    speedRef.current = 0;
    distanceRef.current = 0;
    carLaneRef.current = 2;
    carXRef.current = laneX(2);
    deathsRef.current = 0;
    comboRef.current = 1;
    invincibleRef.current = 0;
    setScore(0);
    setMultiplier(1);
    setDirectorLabel('');
    setPhase('playing');
  }, [setPhase]);

  useGameAutoStart(phase === 'menu' ? startGame : null);

  // Lane switching from keyboard / GameRemote
  useEffect(() => {
    if (phase !== 'playing') return;

    const handler = (e: Event) => {
      const { action, active } = (e as CustomEvent).detail as { action: string; active: boolean };
      if (!active) return;
      if (action === 'left')  carLaneRef.current = Math.max(0, carLaneRef.current - 1);
      if (action === 'right') carLaneRef.current = Math.min(LANE_COUNT - 1, carLaneRef.current + 1);
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  carLaneRef.current = Math.max(0, carLaneRef.current - 1);
      if (e.key === 'ArrowRight') carLaneRef.current = Math.min(LANE_COUNT - 1, carLaneRef.current + 1);
    };

    window.addEventListener('de-game-input', handler);
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('de-game-input', handler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [phase]);

  // ── Elite engine initialization ──────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || phase !== 'playing') return;

    let elite: EliteGameEngine | null = null;
    let engine: BABYLON.AbstractEngine | null = null;
    let scene: BABYLON.Scene | null = null;
    let dualSense: DualSenseManager | null = null;
    let postFx: PostFXManager | null = null;
    let car: BABYLON.Mesh | null = null;
    let trailPS: BABYLON.ParticleSystem | null = null;
    let renderObserver: BABYLON.Observer<BABYLON.Scene> | null = null;
    const obstacles: ObstacleState[] = [];
    const boostGates: BoostGateState[] = [];
    const trackTiles: BABYLON.Mesh[] = [];
    let lastRumble = 0;
    let frameTick = 0;
    let nextObstacleZ = -40;  // spawn obstacles behind camera
    let nextBoostZ = -80;

    const init = async () => {
      if (!canvasRef.current) return;

      // ── Engine (WebGPU-first) ──────────────────────────────────────────────
      try {
        elite = new EliteGameEngine(canvasRef.current);
        await elite.init();
        eliteEngineRef.current = elite;
        engine = elite.babylonEngine;
        scene = elite.babylonScene;
        if (!engine || !scene) {
          throw new Error('Elite Game Engine failed to create Babylon scene');
        }
        engineRef.current = engine;
        sceneRef.current = scene;
        scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.05, 1);
        setRenderInfo(elite.isUsingWebGPU ? 'WebGPU · elite engine' : 'WebGL2 · elite engine');

        // ── Camera ───────────────────────────────────────────────────────────
        const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3.5, 28,
          new BABYLON.Vector3(0, 0, -5), scene);

        // ── Lighting ─────────────────────────────────────────────────────────
        const ambientLight = new BABYLON.HemisphericLight('ambient',
          new BABYLON.Vector3(0, 1, 0), scene);
        ambientLight.intensity = 0.3;
        ambientLight.diffuse = new BABYLON.Color3(0.3, 0.5, 1.0);

        // Point light inside the car trail area
        const raceLight = new BABYLON.PointLight('raceLight',
          new BABYLON.Vector3(0, 3, -8), scene);
        raceLight.diffuse = new BABYLON.Color3(0, 0.9, 1);
        raceLight.intensity = 2;
        raceLight.range = 30;

        // ── Track tiles (ring buffer) ─────────────────────────────────────────
        const trackMat = new BABYLON.StandardMaterial('track', scene);
        trackMat.emissiveColor = new BABYLON.Color3(0.02, 0.1, 0.15);
        trackMat.diffuseColor = new BABYLON.Color3(0.02, 0.1, 0.15);

        const lineMat = new BABYLON.StandardMaterial('lane', scene);
        lineMat.emissiveColor = new BABYLON.Color3(0, 0.9, 1);

        for (let i = 0; i < TILE_COUNT; i++) {
          const tile = BABYLON.MeshBuilder.CreateGround('tile' + i, {
            width: TRACK_WIDTH, height: TILE_LENGTH,
          }, scene);
          tile.position.z = i * TILE_LENGTH - TILE_LENGTH / 2;
          tile.material = trackMat;
          trackTiles.push(tile);

          // Lane dividers
          for (let l = 1; l < LANE_COUNT; l++) {
            const line = BABYLON.MeshBuilder.CreateBox('line' + i + '_' + l,
              { width: 0.08, height: 0.06, depth: TILE_LENGTH * 0.9 }, scene);
            line.position.x = laneX(l) - LANE_WIDTH / 2;
            line.position.z = i * TILE_LENGTH;
            line.position.y = 0.04;
            line.material = lineMat;
          }
        }

        // Edge barriers
        const edgeMat = new BABYLON.StandardMaterial('edge', scene);
        edgeMat.emissiveColor = new BABYLON.Color3(1, 0.1, 0.4);
        const edgeH = 1.5, edgeD = TOTAL_TILES;
        const edgeL = BABYLON.MeshBuilder.CreateBox('edgeL',
          { width: 0.3, height: edgeH, depth: edgeD }, scene);
        edgeL.position.x = -(TRACK_WIDTH / 2 + 0.15);
        edgeL.position.y = edgeH / 2;
        edgeL.material = edgeMat;
        const edgeR = BABYLON.MeshBuilder.CreateBox('edgeR',
          { width: 0.3, height: edgeH, depth: edgeD }, scene);
        edgeR.position.x = TRACK_WIDTH / 2 + 0.15;
        edgeR.position.y = edgeH / 2;
        edgeR.material = edgeMat;

        // ── Car ───────────────────────────────────────────────────────────────
        car = BABYLON.MeshBuilder.CreateBox('car', { width: 1.8, height: 0.7, depth: 3.2 }, scene);
        car.position.y = 0.5;
        const carMat = new BABYLON.StandardMaterial('carMat', scene);
        carMat.emissiveColor = new BABYLON.Color3(1, 0.3, 0.9);
        carMat.diffuseColor = new BABYLON.Color3(0.6, 0.1, 0.5);
        car.material = carMat;

        // Car cabin
        const cabin = BABYLON.MeshBuilder.CreateBox('cabin',
          { width: 1.2, height: 0.5, depth: 1.8 }, scene);
        cabin.position.y = 1.1;
        cabin.parent = car;
        const cabinMat = new BABYLON.StandardMaterial('cabinMat', scene);
        cabinMat.emissiveColor = new BABYLON.Color3(0, 0.8, 1);
        cabinMat.alpha = 0.7;
        cabin.material = cabinMat;

        // Wheels
        const wheelMat = new BABYLON.StandardMaterial('wheelMat', scene);
        wheelMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        for (const [wx, wz] of [[-1.1, 1.0], [1.1, 1.0], [-1.1, -1.0], [1.1, -1.0]]) {
          const w = BABYLON.MeshBuilder.CreateCylinder('wheel',
            { diameter: 0.6, height: 0.3, tessellation: 12 }, scene);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, -0.2, wz);
          w.parent = car;
          w.material = wheelMat;
        }

        // ── Particle trail ────────────────────────────────────────────────────
        trailPS = new BABYLON.ParticleSystem('trail', 300, scene);
        trailPS.emitter = car;
        trailPS.minEmitBox = new BABYLON.Vector3(-0.6, -0.3, -1.6);
        trailPS.maxEmitBox = new BABYLON.Vector3(0.6, 0, -1.6);
        trailPS.color1 = new BABYLON.Color4(0, 0.9, 1, 0.9);
        trailPS.color2 = new BABYLON.Color4(1, 0.2, 0.8, 0.6);
        trailPS.colorDead = new BABYLON.Color4(0.05, 0.05, 0.15, 0);
        trailPS.minSize = 0.05;
        trailPS.maxSize = 0.25;
        trailPS.minLifeTime = 0.25;
        trailPS.maxLifeTime = 0.5;
        trailPS.emitRate = 0; // controlled dynamically by speed
        trailPS.minEmitPower = 1;
        trailPS.maxEmitPower = 4;
        trailPS.direction1 = new BABYLON.Vector3(-0.5, 0.2, -1);
        trailPS.direction2 = new BABYLON.Vector3(0.5, 0.8, -3);
        trailPS.gravity = new BABYLON.Vector3(0, -2, -3);
        trailPS.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        trailPS.start();

        // ── Obstacle pool ─────────────────────────────────────────────────────
        const obsMat = [
          (() => { const m = new BABYLON.StandardMaterial('obs0', scene!);
            m.emissiveColor = new BABYLON.Color3(1, 0.1, 0.1);
            m.diffuseColor = new BABYLON.Color3(0.8, 0.0, 0.0); return m; })(),
          (() => { const m = new BABYLON.StandardMaterial('obs1', scene!);
            m.emissiveColor = new BABYLON.Color3(1, 0.6, 0);
            m.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0); return m; })(),
          (() => { const m = new BABYLON.StandardMaterial('obs2', scene!);
            m.emissiveColor = new BABYLON.Color3(0.3, 1, 0.3);
            m.diffuseColor = new BABYLON.Color3(0.1, 0.8, 0.1); return m; })(),
        ];

        for (let i = 0; i < OBS_POOL_SIZE; i++) {
          const type = i % 3;
          const dims = type === OBS_BARRIER
            ? { width: LANE_WIDTH * 0.85, height: 1.2, depth: 0.8 }
            : type === OBS_PILLAR
            ? { width: 0.7, height: 3.0, depth: 0.7 }
            : { width: LANE_WIDTH * 0.8, height: 0.4, depth: 1.8 };
          const mesh = BABYLON.MeshBuilder.CreateBox('obs' + i, dims, scene);
          mesh.position.y = dims.height / 2;
          mesh.material = obsMat[type];
          mesh.setEnabled(false);
          obstacles.push({ mesh, lane: 0, type, active: false, z: 0 });
        }

        // ── Boost gate pool ───────────────────────────────────────────────────
        const boostMat = new BABYLON.StandardMaterial('boost', scene);
        boostMat.emissiveColor = new BABYLON.Color3(0.2, 1, 0.5);
        boostMat.alpha = 0.7;

        for (let i = 0; i < BOOST_POOL; i++) {
          const mL = BABYLON.MeshBuilder.CreateBox('boostL' + i,
            { width: 0.2, height: 4, depth: 0.5 }, scene);
          mL.material = boostMat;
          mL.setEnabled(false);
          const mR = BABYLON.MeshBuilder.CreateBox('boostR' + i,
            { width: 0.2, height: 4, depth: 0.5 }, scene);
          mR.material = boostMat;
          mR.setEnabled(false);
          boostGates.push({ meshL: mL, meshR: mR, active: false, z: 0 });
        }

        // ── Post-processing ───────────────────────────────────────────────────
        try {
          postFx = new PostFXManager(scene, camera as unknown as BABYLON.Camera);
          postFxRef.current = postFx;
          await postFx.init();
          await postFx.enableGlow(0.6, 32);
          postFx.applyBudget(elite.budget);
        } catch { /* post-fx optional */ }

        // ── AI Director ───────────────────────────────────────────────────────
        await directorRef.current.init();

        // ── DualSense ─────────────────────────────────────────────────────────
        dualSense = new DualSenseManager(scene, engine!, setStatus);
        dualSenseRef.current = dualSense;
        await dualSense.init();

        setStatus(elite.isUsingWebGPU ? 'Elite WebGPU runtime active' : 'Elite compatibility runtime active');

        const telemetryEntity = elite.world.createEntity();
        telemetryEntityRef.current = telemetryEntity;
        elite.world.addComponent(telemetryEntity, {
          type: 'transform',
          x: carXRef.current,
          y: 0,
          z: distanceRef.current,
        });

        let lastTelemetryHud = 0;
        elite.onFrame((_dt, telemetry) => {
          if (performance.now() - lastTelemetryHud < 250) return;
          lastTelemetryHud = performance.now();
          setRenderInfo(
            `${telemetry.isWebGPU ? 'WebGPU' : 'WebGL2'} · ${telemetry.avgFps}fps · ${telemetry.qualityTier} tier`
          );
          publishGamePerformanceBaseline({
            gameId: 'neon-drift',
            renderMode: 'webgpu',
            rendererBackend: telemetry.isWebGPU ? 'webgpu' : 'webgl2',
            webgpuSupported: telemetry.isWebGPU,
            fps: telemetry.fps,
            avgFps: telemetry.avgFps,
            frameMs: telemetry.frameMs,
            avgFrameMs: telemetry.avgFrameMs,
            sampleCount: 90,
            source: 'runtime',
          });
        });
        elite.onQualityChange((budget) => {
          postFx?.applyBudget(budget);
        });

        // ── Game loop ─────────────────────────────────────────────────────────
        renderObserver = scene.onBeforeRenderObservable.add(() => {
          if (phaseRef.current !== 'playing' || !car || !engine) return;
          frameTick++;

          const input = dualSense?.getState();

          // ── Speed control ─────────────────────────────────────────────────
          const dirLevel = directorRef.current.level;
          const baseAccel = 0.18 + dirLevel * 0.22; // harder = faster base
          const r2 = input?.triggers.r2 ?? 0.6;
          const accel = r2 > 0.1 ? r2 * baseAccel : baseAccel * 0.4;
          speedRef.current = Math.max(0, Math.min(30 + dirLevel * 15, speedRef.current + accel - 0.12));

          // ── Car position ──────────────────────────────────────────────────
          const targetX = laneX(carLaneRef.current);

          // DualSense gyro/stick lane switch
          if (input) {
            const gyroX = input.gyro.x;
            const stickX = input.leftStick.x;
            const combined = gyroX * 1.5 + stickX;
            if (combined < -0.6) carLaneRef.current = Math.max(0, carLaneRef.current - 1);
            else if (combined > 0.6) carLaneRef.current = Math.min(LANE_COUNT - 1, carLaneRef.current + 1);
          }
          carXRef.current += (targetX - carXRef.current) * 0.18;
          car.position.x = carXRef.current;

          // ── Forward movement ──────────────────────────────────────────────
          const forwardDelta = speedRef.current * 0.06;
          distanceRef.current += forwardDelta;

          // ── Camera tracks car ─────────────────────────────────────────────
          camera.target.x = carXRef.current * 0.6;
          camera.target.z = car.position.z - 5;
          raceLight.position.x = carXRef.current;
          raceLight.position.z = car.position.z + 5;

          // ── Track ring-buffer scroll ──────────────────────────────────────
          const tileZ = distanceRef.current;
          for (const tile of trackTiles) {
            // Reset tiles behind player to ahead
            while (tile.position.z < tileZ - TILE_LENGTH) {
              tile.position.z += TOTAL_TILES;
            }
          }

          // ── Obstacle spawning ─────────────────────────────────────────────
          if (distanceRef.current > nextObstacleZ) {
            const spawnZ = distanceRef.current + 80 + Math.random() * 20;
            nextObstacleZ = distanceRef.current + 15 + (1 - dirLevel) * 20;

            const pool = obstacles.filter(o => !o.active);
            if (pool.length > 0) {
              const obs = pool[Math.floor(Math.random() * pool.length)];
              const lane = Math.floor(Math.random() * LANE_COUNT);
              obs.lane = lane;
              obs.z = spawnZ;
              obs.mesh.position.x = laneX(lane);
              obs.mesh.position.z = spawnZ;
              obs.mesh.setEnabled(true);
              obs.active = true;
            }
          }

          // ── Boost gate spawning ───────────────────────────────────────────
          if (distanceRef.current > nextBoostZ) {
            nextBoostZ = distanceRef.current + 60 + Math.random() * 40;
            const pool = boostGates.filter(b => !b.active);
            if (pool.length > 0) {
              const gate = pool[0];
              const gateZ = distanceRef.current + 100 + Math.random() * 30;
              const gateLane = Math.floor(Math.random() * LANE_COUNT);
              const gx = laneX(gateLane);
              gate.meshL.position.set(gx - LANE_WIDTH * 0.45, 2, gateZ);
              gate.meshR.position.set(gx + LANE_WIDTH * 0.45, 2, gateZ);
              gate.meshL.setEnabled(true);
              gate.meshR.setEnabled(true);
              gate.active = true;
              gate.z = gateZ;
            }
          }

          // ── Collision detection ───────────────────────────────────────────
          if (invincibleRef.current > 0) {
            invincibleRef.current--;
            // Flicker car during invincibility
            car.setEnabled(frameTick % 6 < 4);
          } else {
            car.setEnabled(true);
            for (const obs of obstacles) {
              if (!obs.active) continue;
              // Recycle if behind player
              if (obs.z < distanceRef.current - 10) {
                obs.active = false;
                obs.mesh.setEnabled(false);
                continue;
              }
              // Hit check (simple AABB in lane + distance)
              const dz = Math.abs(obs.z - distanceRef.current);
              const dx = Math.abs(carXRef.current - laneX(obs.lane));
              if (dz < 2.0 && dx < LANE_WIDTH * 0.45) {
                // CRASH!
                obs.active = false;
                obs.mesh.setEnabled(false);
                deathsRef.current++;
                comboRef.current = 1;
                speedRef.current = Math.max(5, speedRef.current * 0.4);
                invincibleRef.current = 90;
                setMultiplier(1);
                // Haptic rumble
                const now = Date.now();
                if (now - lastRumble > 300) {
                  dualSense?.rumble(1.0, 200);
                  lastRumble = now;
                }
              }
            }

            // Boost gate check
            for (const gate of boostGates) {
              if (!gate.active) continue;
              if (gate.z < distanceRef.current - 5) {
                gate.active = false;
                gate.meshL.setEnabled(false);
                gate.meshR.setEnabled(false);
                continue;
              }
              const dz = Math.abs(gate.z - distanceRef.current);
              const gx = gate.meshL.position.x + LANE_WIDTH * 0.45;
              const dx = Math.abs(carXRef.current - gx);
              if (dz < 2.5 && dx < LANE_WIDTH * 0.55) {
                // Boost collected!
                gate.active = false;
                gate.meshL.setEnabled(false);
                gate.meshR.setEnabled(false);
                speedRef.current = Math.min(45, speedRef.current + 8);
                comboRef.current = Math.min(8, comboRef.current + 1);
                dualSense?.rumble(0.6, 100);
                setMultiplier(comboRef.current);
              }
            }
          }

          // ── Score ─────────────────────────────────────────────────────────
          if (frameTick % 4 === 0) {
            scoreRef.current += Math.floor(speedRef.current * comboRef.current);
            setScore(scoreRef.current);
          }

          // ── Particle trail intensity tied to speed ────────────────────────
          if (trailPS) {
            trailPS.emitRate = Math.floor(speedRef.current * 6);
            trailPS.minEmitPower = speedRef.current * 0.2;
            trailPS.maxEmitPower = speedRef.current * 0.5;
          }

          // ── High-speed haptic feedback ────────────────────────────────────
          const now = Date.now();
          if (speedRef.current > 20 && now - lastRumble > 400) {
            dualSense?.rumble(speedRef.current / 50, 60);
            lastRumble = now;
          }

          // ── AI Director update ────────────────────────────────────────────
          if (frameTick % 30 === 0) {
            const ds = directorRef.current.update({
              deaths: deathsRef.current,
              score: scoreRef.current,
              combo: comboRef.current,
              avgSpeed: speedRef.current / 45,
              elapsed: distanceRef.current / 60,
            });
            setDirectorLabel(ds.label);
          }

          // ── Car lean during lane change ───────────────────────────────────
          const leanTarget = (targetX - carXRef.current) * 0.15;
          car.rotation.z = car.rotation.z + (leanTarget - car.rotation.z) * 0.15;

          if (telemetryEntityRef.current === null) return;
          const transform = elite?.world.getComponent<{ type: string; x: number; y: number; z: number }>(
            telemetryEntityRef.current,
            'transform',
          );
          if (transform) {
            transform.x = carXRef.current;
            transform.z = distanceRef.current;
          }
        });

        const resizeObserver = new ResizeObserver(() => engine?.resize());
        resizeObserver.observe(canvasRef.current!.parentElement ?? document.body);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('NeonDrift init error:', msg);
        setStatus('Error: ' + msg);
      }
    };

    init();

    return () => {
      if (renderObserver && scene) {
        scene.onBeforeRenderObservable.remove(renderObserver);
      }
      dualSense?.dispose();
      postFx?.dispose();
      postFxRef.current = null;
      elite?.dispose();
      eliteEngineRef.current = null;
      telemetryEntityRef.current = null;
      engineRef.current = null;
      sceneRef.current = null;
    };
  }, [phase, phaseRef, setPhase]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      {phase === 'menu' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px',
          background: 'linear-gradient(180deg, #020210 0%, #130822 50%, #040818 100%)',
        }}>
          <div style={{ fontSize: '52px' }}>🏎️</div>
          <div style={{ fontSize: '34px', fontWeight: '900', color: '#0ff',
            textShadow: '0 0 20px #0ff, 0 0 40px #0af', letterSpacing: '4px' }}>
            NEON DRIFT
          </div>
          <div style={{ fontSize: '13px', color: '#666', letterSpacing: '2px',
            textTransform: 'uppercase' }}>
            Elite WebGPU Racer · 2026
          </div>
          <div style={{ fontSize: '12px', color: '#444', maxWidth: '320px',
            textAlign: 'center', lineHeight: '1.6', marginTop: '8px' }}>
            ← → arrow keys or left stick to change lanes
            <br />R2 trigger for boost · Collect green gates for combo
            <br />AI Director adapts difficulty to your skill
          </div>
          <div style={{ fontSize: '14px', color: '#0ff', marginTop: '12px',
            animation: 'pulse 2s ease-in-out infinite' }}>
            Press PLAY ▶ to race
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          {/* Top-left: render info + director */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.75)', color: '#0ff',
              padding: '4px 10px', borderRadius: 4,
              fontSize: 11, fontFamily: 'monospace',
              border: '1px solid rgba(0,255,255,0.2)',
            }}>
              {renderInfo} · {status}
            </div>
            {directorLabel && (
              <div style={{
                background: 'rgba(0,0,0,0.65)', color: '#ff9',
                padding: '3px 8px', borderRadius: 4,
                fontSize: 11, fontFamily: 'monospace',
              }}>
                {directorLabel}
              </div>
            )}
          </div>
          {/* Top-right: score + multiplier */}
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.75)', padding: '10px 14px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.12)',
            textAlign: 'right', fontFamily: 'monospace',
          }}>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>
              {score.toLocaleString()}
            </div>
            {multiplier > 1 && (
              <div style={{ fontSize: 13, color: '#4f4', marginTop: 2 }}>
                ×{multiplier} combo
              </div>
            )}
          </div>
          {/* Bottom: speed bar */}
          <div style={{
            position: 'absolute', bottom: 10, left: '50%',
            transform: 'translateX(-50%)',
            width: '180px', height: 6,
            background: 'rgba(255,255,255,0.1)', borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${Math.min(100, (speedRef.current / 45) * 100)}%`,
              background: `linear-gradient(90deg, #0ff, #f0f)`,
              transition: 'width 0.1s ease',
            }} />
          </div>
        </>
      )}

      {phase === 'gameover' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px',
          background: 'rgba(0,0,0,0.92)',
        }}>
          <div style={{ fontSize: '48px' }}>🏁</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0ff',
            textShadow: '0 0 20px #0ff' }}>
            RACE OVER
          </div>
          <div style={{ fontSize: '22px', color: '#fff' }}>
            {score.toLocaleString()} pts
          </div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            {Math.floor(distanceRef.current).toLocaleString()}m · ×{multiplier} best combo
          </div>
          <div style={{ fontSize: '13px', color: '#0ff', marginTop: '16px' }}>
            Press PLAY to race again ▶
          </div>
        </div>
      )}
    </div>
  );
}
