'use client';

import { useEffect, useRef } from 'react';
import {
  AbstractMesh,
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PointerEventTypes,
  Scene,
  SceneLoader,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { createBabylonEngine } from '@/lib/babylon/createEngine';
import '@babylonjs/loaders/glTF';
import {
  DreamEngineGodTierSystem,
  applyGodTierToBabylon,
  defaultDeviceSignals,
  defaultRuntimeMetrics,
  defaultUXSignals,
  defaultRouteSignals,
  type BabylonSceneLike,
} from '@/lib/god-tier/godTierEngine';

type RuntimeState = {
  idleTime: number;
  targetYaw: number;
  targetPitch: number;
  reaction: number;
};

const DR_EAMS_HEIGHT = 0.9144; // 3 feet

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getBounds(meshes: AbstractMesh[]) {
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);

  for (const mesh of meshes) {
    const info = mesh.getBoundingInfo();
    min = Vector3.Minimize(min, info.boundingBox.minimumWorld);
    max = Vector3.Maximize(max, info.boundingBox.maximumWorld);
  }

  return { min, max };
}

function createBlackMetal(scene: Scene) {
  const mat = new PBRMaterial('drEamsBlackMetal', scene);
  mat.albedoColor = new Color3(0.02, 0.02, 0.025);
  mat.metallic = 1.0;
  mat.roughness = 0.2;
  mat.environmentIntensity = 1.25;

  mat.clearCoat.isEnabled = true;
  mat.clearCoat.intensity = 1.0;
  mat.clearCoat.roughness = 0.1;

  return mat;
}

function createWhiteCoat(scene: Scene) {
  const mat = new PBRMaterial('drEamsWhiteCoat', scene);
  mat.albedoColor = new Color3(0.95, 0.96, 0.98);
  mat.metallic = 0.02;
  mat.roughness = 0.9;
  return mat;
}

function createDarkVisor(scene: Scene) {
  const mat = new PBRMaterial('drEamsDarkVisor', scene);
  mat.albedoColor = new Color3(0.03, 0.04, 0.06);
  mat.metallic = 0.08;
  mat.roughness = 0.08;
  mat.alpha = 0.88;

  mat.clearCoat.isEnabled = true;
  mat.clearCoat.intensity = 1.0;
  mat.clearCoat.roughness = 0.04;

  return mat;
}

function createFakeVisorGlow(root: TransformNode, scene: Scene) {
  const glow = MeshBuilder.CreatePlane(
    'drEamsFakeGlow',
    { width: 0.22, height: 0.11 },
    scene
  );

  glow.parent = root;
  glow.position = new Vector3(0, 0.63, 0.19);

  const mat = new StandardMaterial('drEamsFakeGlowMat', scene);
  mat.disableLighting = true;
  mat.emissiveColor = new Color3(0.45, 0.9, 1);
  mat.alpha = 0.85;
  mat.backFaceCulling = false;
  glow.material = mat;

  return glow;
}

function maybeFixBoots(meshes: AbstractMesh[]) {
  for (const mesh of meshes) {
    const n = mesh.name.toLowerCase();
    if (!n.includes('boot')) continue;

    mesh.rotation.x = Math.PI;
  }
}

function applyMaterials(meshes: AbstractMesh[], scene: Scene) {
  const blackMetal = createBlackMetal(scene);
  const whiteCoat = createWhiteCoat(scene);
  const darkVisor = createDarkVisor(scene);

  for (const mesh of meshes) {
    const n = mesh.name.toLowerCase();

    if (
      n.includes('visor') ||
      n.includes('glass') ||
      n.includes('face') ||
      n.includes('screen')
    ) {
      mesh.material = darkVisor;
      continue;
    }

    if (
      n.includes('coat') ||
      n.includes('robe') ||
      n.includes('lab') ||
      n.includes('shirt') ||
      n.includes('white')
    ) {
      mesh.material = whiteCoat;
      continue;
    }

    mesh.material = blackMetal;
  }
}

async function buildDrEams(scene: Scene, canvas: HTMLCanvasElement) {
  const result = await SceneLoader.ImportMeshAsync('', '/models/', 'dr-eams.glb', scene);

  const meshes = result.meshes.filter(
    (m): m is AbstractMesh => m instanceof AbstractMesh && m.name !== '__root__'
  );

  const root = new TransformNode('drEamsRoot', scene);

  for (const mesh of meshes) {
    if (!mesh.parent) mesh.parent = root;
    mesh.receiveShadows = true;
    mesh.isPickable = false;
  }

  maybeFixBoots(meshes);
  applyMaterials(meshes, scene);

  const initialBounds = getBounds(meshes);
  const currentHeight = Math.max(initialBounds.max.y - initialBounds.min.y, 0.0001);
  const scale = DR_EAMS_HEIGHT / currentHeight;

  root.scaling = new Vector3(scale, scale, scale);

  const scaledBounds = getBounds(meshes);
  root.position.y -= scaledBounds.min.y;

  // Cache the floor Y offset so getBounds is not called every frame.
  const floorYOffset = root.position.y;

  const fakeGlow = createFakeVisorGlow(root, scene);

  const state: RuntimeState = {
    idleTime: 0,
    targetYaw: 0,
    targetPitch: 0,
    reaction: 0,
  };

  const pointerObserver = scene.onPointerObservable.add((info) => {
    if (
      info.type === PointerEventTypes.POINTERMOVE &&
      info.event instanceof PointerEvent
    ) {
      const rect = canvas.getBoundingClientRect();
      const x = ((info.event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((info.event.clientY - rect.top) / rect.height) * 2 - 1;

      state.targetYaw = clamp(x * 0.28, -0.28, 0.28);
      state.targetPitch = clamp(-y * 0.08, -0.08, 0.08);
    }

    if (
      info.type === PointerEventTypes.POINTERDOWN &&
      info.event instanceof PointerEvent
    ) {
      state.reaction = 1;
    }
  });

  const beforeRender = scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000;
    state.idleTime += dt;

    const idleYaw = Math.sin(state.idleTime * 0.55) * 0.18;
    const idlePitch = Math.sin(state.idleTime * 0.8) * 0.018;
    const bodyBob = Math.sin(state.idleTime * 1.7) * 0.012;
    const bodyRoll = Math.sin(state.idleTime * 0.75) * 0.02;

    const reactionKick = state.reaction * 0.18;

    root.rotation.y += ((idleYaw + state.targetYaw + reactionKick) - root.rotation.y) * Math.min(1, dt * 4.5);
    root.rotation.x += ((idlePitch + state.targetPitch) - root.rotation.x) * Math.min(1, dt * 3.5);
    root.rotation.z += (bodyRoll - root.rotation.z) * Math.min(1, dt * 3.5);

    // Use the pre-computed floor offset instead of recalculating bounds every frame.
    root.position.y = floorYOffset + bodyBob;

    if (state.reaction > 0) {
      state.reaction = Math.max(0, state.reaction - dt * 1.8);
    }

    if (fakeGlow.material instanceof StandardMaterial) {
      const blink = Math.sin(state.idleTime * 3.1) * 0.08 + 0.82;
      const pulse = 1 + state.reaction * 0.5;

      fakeGlow.material.alpha = clamp(blink * pulse, 0.55, 1);
      fakeGlow.scaling.y = 1 + Math.sin(state.idleTime * 0.9) * 0.03;
    }
  });

  const triggerReaction = () => {
    state.reaction = 1;
  };

  const dispose = () => {
    if (pointerObserver) scene.onPointerObservable.remove(pointerObserver);
    if (beforeRender) scene.onBeforeRenderObservable.remove(beforeRender);
    fakeGlow.dispose();
    root.dispose();

    for (const mesh of meshes) {
      if (!mesh.isDisposed()) mesh.dispose();
    }
  };

  return { dispose, triggerReaction };
}

export default function DrEamsScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const triggerReactionRef = useRef<(() => void) | null>(null);
  const godTierRef = useRef(new DreamEngineGodTierSystem());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerReactionRef.current?.();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let engineInst: import('@babylonjs/core').AbstractEngine | null = null;
    let sceneInst: Scene | null = null;
    let disposeActor: (() => void) | null = null;

    const handleResize = () => engineInst?.resize();
    window.addEventListener('resize', handleResize);

    createBabylonEngine(canvas, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    }).then(({ engine }) => {
      if (disposed) { engine.dispose(); return; }
      engineInst = engine;

      const scene = new Scene(engine);
      sceneInst = scene;
      scene.clearColor.set(0, 0, 0, 0);

      const camera = new ArcRotateCamera(
        'camera',
        -Math.PI / 2,
        Math.PI / 2.2,
        1.85,
        new Vector3(0, 0.42, 0),
        scene
      );

      camera.lowerRadiusLimit = 1.5;
      camera.upperRadiusLimit = 2.4;
      camera.wheelDeltaPercentage = 0.01;
      camera.useAutoRotationBehavior = false;
      camera.attachControl(canvas, true);

      const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
      hemi.intensity = 1.05;

      const key = new DirectionalLight('key', new Vector3(-0.25, -1, 0.35), scene);
      key.position = new Vector3(2, 4, -2);
      key.intensity = 1.7;

      const rim = new DirectionalLight('rim', new Vector3(0.6, -0.4, -1), scene);
      rim.position = new Vector3(-1, 2, 3);
      rim.intensity = 0.85;

      buildDrEams(scene, canvas)
        .then(({ dispose, triggerReaction }) => {
          disposeActor = dispose;
          triggerReactionRef.current = triggerReaction;
        })
        .catch((error) => {
          console.error('Failed to load Dr. Eams GLB:', error);
        });

      // Apply God Tier settings once scene is ready
      const gtInit = godTierRef.current.update({
        device:  defaultDeviceSignals(),
        runtime: defaultRuntimeMetrics(),
        ux:      defaultUXSignals(),
        route:   defaultRouteSignals('/dr-eams'),
        meshes: [],
        ui: [],
      });
      applyGodTierToBabylon(engine, scene as unknown as BabylonSceneLike, gtInit, window.devicePixelRatio ?? 1);

      let lastGtMs = 0;
      engine.runRenderLoop(() => {
        scene.render();
        const now = performance.now();
        if (now - lastGtMs > 800) {
          lastGtMs = now;
          const perf = (engine as import('@babylonjs/core').Engine).performanceMonitor;
          const avgFrame = perf ? perf.averageFrameTime : 16.6;
          const gt = godTierRef.current.update({
            device:  defaultDeviceSignals(),
            runtime: { frameMs: avgFrame, avgFrameMs: avgFrame, cpuMs: avgFrame * 0.4, gpuMs: avgFrame * 0.5, droppedFrameRatio: 0, inputLatencyMs: 20, scrollVelocity: 0, pointerVelocity: 0, interactionBurst: 0 },
            ux:      defaultUXSignals(),
            route:   defaultRouteSignals('/dr-eams'),
            meshes:  scene.meshes.map((m) => ({ id: m.id, visible: m.isVisible, interactive: m.isPickable, nearPointer: false, distanceToCamera: 4, transformDelta: 0, materialChanged: false, screenCoverage: 0.25, semanticWeight: 1.0, motionWeight: 0.9, detailWeight: 1.0, heroWeight: 1.0, occluded: false })),
            ui: [],
          });
          applyGodTierToBabylon(engine, scene as unknown as BabylonSceneLike, gt, window.devicePixelRatio ?? 1);
        }
      });
    }).catch(() => {
      // Engine creation failed — canvas stays blank; no crash.
    });

    return () => {
      disposed = true;
      triggerReactionRef.current = null;
      window.removeEventListener('resize', handleResize);
      if (disposeActor) disposeActor();
      sceneInst?.dispose();
      engineInst?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-label="Dr. Eams — interactive 3D mascot. Press Enter or Space to interact."
      role="img"
    />
  );
}
