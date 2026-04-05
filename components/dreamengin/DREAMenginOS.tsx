'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Scene as BabylonScene, AbstractEngine } from '@babylonjs/core';
import { createBabylonEngine } from '@/lib/babylon/createEngine';

export interface DREAMenginOSSubsystems {
  nexusOpen?: boolean;
  outdreamOpen?: boolean;
  drEamsOpen?: boolean;
  importedAssets?: number;
  lastImportCategory?: string | null;
  route?: string;
}

export interface DREAMenginOSProps {
  audioSource?: AnalyserNode;
  onReady?: (scene: BabylonScene) => void;
  subsystems?: DREAMenginOSSubsystems;
}

type SystemStatus = 'OFFLINE' | 'BOOTING_CORE_V9' | 'SYNCING_HAVOK_V2' | 'DREAM_V9_ACTIVE';

type NeuralBus = {
  color: string;
  isEmergency: boolean;
  alpha: number;
  velocity: number;
};

type OsStatusPayload = {
  isFix?: boolean;
};

export default function DREAMenginOS({ audioSource, onReady, subsystems }: DREAMenginOSProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AbstractEngine | null>(null);
  const neuralRef = useRef<NeuralBus>({
    color: '#5de8ff',
    isEmergency: false,
    alpha: 0.8,
    velocity: 0,
  });
  const audioRef = useRef(audioSource);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('OFFLINE');
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [hudColor, setHudColor] = useState(neuralRef.current.color);
  const [hudMode, setHudMode] = useState<'STABLE' | 'EMERGENCY_SYNC'>('STABLE');
  const hudTickRef = useRef(0);

  useEffect(() => {
    audioRef.current = audioSource;
  }, [audioSource]);

  const syncHud = useCallback((intensity: number) => {
    const now = performance.now();
    if (now - hudTickRef.current < 80) return;
    hudTickRef.current = now;
    setPulseIntensity(Math.min(1.4, intensity * 0.2));
    setHudColor(neuralRef.current.color);
    setHudMode(neuralRef.current.isEmergency ? 'EMERGENCY_SYNC' : 'STABLE');
  }, []);

  const syncNeuralBus = useCallback(async () => {
    try {
      const res = await fetch('/api/dreamengin/os-status', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as OsStatusPayload;
      neuralRef.current.isEmergency = Boolean(data.isFix);
      neuralRef.current.color = data.isFix ? '#FFD700' : '#5de8ff';
    } catch {
      console.warn('[DREAMenginOS] Neural Bus disconnected - Using local defaults');
    }
  }, []);

  useEffect(() => {
    const overlaysOpen = Number(Boolean(subsystems?.nexusOpen))
      + Number(Boolean(subsystems?.outdreamOpen))
      + Number(Boolean(subsystems?.drEamsOpen));
    const importedAssets = subsystems?.importedAssets ?? 0;
    const activeCategory = subsystems?.lastImportCategory;
    neuralRef.current.alpha = Math.min(1, 0.72 + overlaysOpen * 0.08 + Math.min(importedAssets, 5) * 0.02);
    if (subsystems?.drEamsOpen) {
      neuralRef.current.color = '#8cc8ff';
      neuralRef.current.velocity = Math.max(neuralRef.current.velocity, 4);
    } else if (activeCategory === 'audio') {
      neuralRef.current.color = '#f472b6';
    } else if (activeCategory === '3d') {
      neuralRef.current.color = '#a78bfa';
    } else if (activeCategory === 'image') {
      neuralRef.current.color = '#5de8ff';
    }
    if (subsystems?.nexusOpen && subsystems?.outdreamOpen) {
      neuralRef.current.color = '#FFD700';
    }
    if (!subsystems?.nexusOpen && !subsystems?.outdreamOpen && !subsystems?.drEamsOpen && !neuralRef.current.isEmergency) {
      neuralRef.current.color = activeCategory ? neuralRef.current.color : '#5de8ff';
    }
    setHudColor(neuralRef.current.color);
  }, [subsystems]);

  const launchOS = useCallback(async (canvas: HTMLCanvasElement) => {
    setSystemStatus('BOOTING_CORE_V9');

    const { engine } = await createBabylonEngine(canvas, { antialias: true });
    engineRef.current = engine;

    const {
      Scene,
      Vector3,
      ArcRotateCamera,
      Color4,
      PBRMaterial,
      Color3,
      DefaultRenderingPipeline,
      GlowLayer,
      HavokPlugin,
      PointerEventTypes,
      Scalar,
      MeshBuilder,
      HemisphericLight,
    } = await import('@babylonjs/core');

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.01, 0.01, 0.03, 1);

    const camera = new ArcRotateCamera('DREAM_CAMERA', -Math.PI / 2, Math.PI / 2.5, 11, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 30;
    camera.lowerRadiusLimit = 7;
    camera.upperRadiusLimit = 16;

    const light = new HemisphericLight('DREAM_LIGHT', new Vector3(0, 1, 0), scene);
    light.intensity = 1.2;

    const core = MeshBuilder.CreateSphere('OS_CORE', { diameter: 2.1, segments: 32 }, scene);
    const ring = MeshBuilder.CreateTorus('Dream_Ring', { diameter: 4.3, thickness: 0.16, tessellation: 96 }, scene);
    ring.rotation.x = Math.PI / 2;
    const leftNode = MeshBuilder.CreateBox('Dream_Left_Node', { size: 0.8 }, scene);
    leftNode.position.x = -3;
    const rightNode = MeshBuilder.CreateBox('Dream_Right_Node', { size: 0.8 }, scene);
    rightNode.position.x = 3;
    const ground = MeshBuilder.CreateGround('OS_FLOOR', { width: 20, height: 20 }, scene);
    ground.position.y = -2.4;

    setSystemStatus('SYNCING_HAVOK_V2');
    try {
      const HavokPhysics = (await import('@babylonjs/havok')).default;
      const havokWasm = await HavokPhysics();
      const physics = new HavokPlugin(true, havokWasm);
      scene.enablePhysics(new Vector3(0, -9.81, 0), physics);
    } catch {
      console.warn('[DREAMenginOS] Havok unavailable');
    }

    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        const evt = pointerInfo.event as PointerEvent;
        neuralRef.current.alpha = Scalar.Clamp(evt.clientX / Math.max(window.innerWidth, 1), 0.2, 1);
        neuralRef.current.velocity = Math.min(
          36,
          Math.abs(evt.movementX || 0) + Math.abs(evt.movementY || 0),
        );
      }
    });

    const pipeline = new DefaultRenderingPipeline('DREAM_PIPE', true, scene);
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.15;
    pipeline.bloomWeight = 0.4;
    pipeline.chromaticAberrationEnabled = true;
    pipeline.chromaticAberration.aberrationAmount = 18;

    const glow = new GlowLayer('OS_GLOW', scene);

    const glass = new PBRMaterial('midnight_glass', scene);
    glass.metallic = 1;
    glass.roughness = 0.05;
    glass.alpha = 0.82;
    glass.albedoColor = new Color3(0.04, 0.06, 0.12);
    glass.emissiveColor = Color3.FromHexString(neuralRef.current.color);

    const floorMaterial = new PBRMaterial('midnight_floor', scene);
    floorMaterial.metallic = 0.7;
    floorMaterial.roughness = 0.4;
    floorMaterial.alpha = 0.95;
    floorMaterial.albedoColor = new Color3(0.02, 0.03, 0.08);
    floorMaterial.emissiveColor = new Color3(0.03, 0.08, 0.12);
    ground.material = floorMaterial;

    scene.meshes.forEach((mesh) => {
      if (mesh.name.includes('OS') || mesh.name.includes('Dream')) {
        mesh.material = glass;
      }
    });

    scene.onBeforeRenderObservable.add(() => {
      const neural = neuralRef.current;
      const analyser = audioRef.current;

      let bass = 0;
      if (analyser) {
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
        bass = freqData[2] / 255;
      }

      const targetColor = Color3.FromHexString(neural.color);
      glass.emissiveColor = Color3.Lerp(glass.emissiveColor, targetColor, 0.05);
      glass.alpha = Scalar.Lerp(glass.alpha, neural.alpha, 0.08);

      ring.rotation.z += 0.004 + bass * 0.03;
      ring.rotation.y += 0.003 + neural.velocity * 0.0005;
      core.scaling.setAll(1 + bass * 0.16);
      leftNode.rotation.y += 0.01;
      rightNode.rotation.x += 0.012;
      leftNode.position.y = Math.sin(performance.now() * 0.0012) * 0.4;
      rightNode.position.y = Math.cos(performance.now() * 0.0014) * 0.4;

      const intensity = (neural.isEmergency ? 2 : 0.55) + bass * 1.5 + neural.velocity * 0.05;
      glow.intensity = intensity;
      light.intensity = 1 + intensity * 0.16;
      syncHud(intensity);

      if (intensity > 1.8) {
        scene.meshes.forEach((mesh) => {
          if (mesh.physicsBody) {
            mesh.physicsBody.applyImpulse(
              new Vector3(0, intensity * 0.1, 0),
              mesh.getAbsolutePosition(),
            );
          }
        });
      }

      neural.velocity *= 0.95;
    });

    engine.runRenderLoop(() => scene.render());

    await syncNeuralBus();
    setSystemStatus('DREAM_V9_ACTIVE');
    onReady?.(scene);
  }, [onReady, syncHud, syncNeuralBus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void launchOS(canvas);
    const handleResize = () => engineRef.current?.resize();
    const statusInterval = window.setInterval(() => {
      void syncNeuralBus();
    }, 15000);
    window.addEventListener('resize', handleResize);
    return () => {
      window.clearInterval(statusInterval);
      window.removeEventListener('resize', handleResize);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [launchOS, syncNeuralBus]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
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
          color: hudColor,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: hudColor,
            boxShadow: `0 0 ${4 + pulseIntensity * 10}px ${hudColor}`,
            opacity: 0.6 + pulseIntensity,
          }}
        />
        {systemStatus} // {hudMode}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          maxWidth: 'min(28rem, 88vw)',
          pointerEvents: 'none',
        }}
      >
        {[
          subsystems?.nexusOpen ? 'NEXUS' : null,
          subsystems?.outdreamOpen ? 'OUTDREAM' : null,
          subsystems?.drEamsOpen ? 'DR.EAMS' : null,
          subsystems?.importedAssets ? `IMPORTS:${subsystems.importedAssets}` : null,
          subsystems?.route ? `ROUTE:${subsystems.route}` : null,
        ]
          .filter(Boolean)
          .map((label) => (
            <span
              key={label}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(7,11,26,0.56)',
                padding: '6px 10px',
                color: '#d8ecff',
                fontSize: 10,
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
              }}
            >
              {label}
            </span>
          ))}
      </div>
    </div>
  );
}
