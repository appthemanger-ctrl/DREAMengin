'use client';

/**
 * DREAMfield — The Living Creative Cosmos
 *
 * A full-screen Babylon.js 3D scene that represents the entire DREAMengin
 * ecosystem as a living solar system.  The user's central Dream Star glows
 * with an intensity driven by their Forge Momentum score.  Six Engin Planets
 * orbit at unique radii, each clickable to warp to its Daydream surface.
 *
 * Features:
 *   • WebGPU-first via createBabylonEngine (WebGL2 fallback)
 *   • PBR materials with glow layer, bloom, chromatic aberration
 *   • Corona particle system around the star (audio-reactive when enabled)
 *   • Ambient starfield particles filling the void
 *   • Two ringed planets (Code, Create) styled after Saturn
 *   • Forge Momentum HUD (level, score, streak, active engines)
 *   • Planet legend sidebar — click any entry to warp instantly
 *   • "/" command palette for keyboard warp navigation
 *   • Procedural Web Audio ambient drone that morphs with momentum level
 *   • Warp flash overlay on planet pick
 *
 * Architecture:
 *   - Pure client component; no Supabase calls
 *   - computeMomentum() reads localStorage (same as ForgeEngin)
 *   - Babylon.js scene launched after momentum snapshot is ready
 *   - All state setters used inside Babylon callbacks are stable
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Command, Star, Zap } from 'lucide-react';
import type { AbstractEngine } from '@babylonjs/core';
import { createBabylonEngine } from '@/lib/babylon/createEngine';
import {
  computeMomentum,
  getLevelColor,
  getLevelEmoji,
  type MomentumLevel,
  type MomentumSnapshot,
} from '@/lib/forge/forgeMomentum';

// ── Planet configuration ───────────────────────────────────────────────────────

export interface PlanetConfig {
  enginId: string;
  name: string;
  emoji: string;
  label: string;
  accent: string;
  /** Babylon Color3 components, 0–1 */
  r: number;
  g: number;
  b: number;
  orbitRadius: number;
  /** Radians per second */
  orbitSpeed: number;
  /** Starting angle offset (radians) */
  orbitPhase: number;
  /** Sphere radius in Babylon units */
  size: number;
  /** Render a Saturn-style torus ring */
  ringPlanet: boolean;
  href: string;
}

export const PLANET_CONFIGS: PlanetConfig[] = [
  {
    enginId: 'games',
    name: 'GameEngin',
    emoji: '🎮',
    label: 'Games',
    accent: '#c8981a',
    r: 0.78, g: 0.60, b: 0.10,
    orbitRadius: 7,
    orbitSpeed: 0.40,
    orbitPhase: 0,
    size: 1.0,
    ringPlanet: false,
    href: '/daydream/games',
  },
  {
    enginId: 'music',
    name: 'StarMakerEngin',
    emoji: '🎵',
    label: 'Music',
    accent: '#a855f7',
    r: 0.66, g: 0.33, b: 0.97,
    orbitRadius: 10,
    orbitSpeed: 0.28,
    orbitPhase: Math.PI / 3,
    size: 0.85,
    ringPlanet: false,
    href: '/daydream/music',
  },
  {
    enginId: 'code',
    name: 'CodeEngin',
    emoji: '💻',
    label: 'Code',
    accent: '#3b82f6',
    r: 0.23, g: 0.51, b: 0.97,
    orbitRadius: 13,
    orbitSpeed: 0.20,
    orbitPhase: (2 * Math.PI) / 3,
    size: 0.80,
    ringPlanet: true,
    href: '/daydream/code',
  },
  {
    enginId: 'lab',
    name: 'LabEngin',
    emoji: '⚗️',
    label: 'Lab',
    accent: '#06b6d4',
    r: 0.02, g: 0.71, b: 0.83,
    orbitRadius: 16,
    orbitSpeed: 0.15,
    orbitPhase: Math.PI,
    size: 0.75,
    ringPlanet: false,
    href: '/daydream/lab',
  },
  {
    enginId: 'brand',
    name: 'BrandingEngin',
    emoji: '🎨',
    label: 'Brand',
    accent: '#f97316',
    r: 0.98, g: 0.45, b: 0.09,
    orbitRadius: 19,
    orbitSpeed: 0.11,
    orbitPhase: (4 * Math.PI) / 3,
    size: 0.80,
    ringPlanet: false,
    href: '/daydream/brand',
  },
  {
    enginId: 'create',
    name: 'ContentEngin',
    emoji: '✍️',
    label: 'Create',
    accent: '#ec4899',
    r: 0.93, g: 0.28, b: 0.60,
    orbitRadius: 22,
    orbitSpeed: 0.08,
    orbitPhase: (5 * Math.PI) / 3,
    size: 0.70,
    ringPlanet: true,
    href: '/daydream/create',
  },
];

// ── Procedural ambient audio ───────────────────────────────────────────────────

/**
 * Creates a procedural ambient drone that morphs in timbre and richness as the
 * momentum level rises.  Returns a cleanup function and an optional AnalyserNode
 * that the Babylon scene can read for audio-reactive visuals.
 */
export function createAmbientAudio(level: MomentumLevel): {
  cleanup: () => void;
  analyser: AnalyserNode | null;
} {
  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContext();
  } catch {
    return { cleanup: () => {}, analyser: null };
  }

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 3);

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  const baseFreq =
    level === 'TRANSCENDENT' ? 3200
    : level === 'BLAZING'    ? 2200
    : level === 'FLOWING'    ? 1500
    : level === 'WARMING'    ? 1000
    : 650;
  filter.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  filter.Q.setValueAtTime(1.5, ctx.currentTime);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-18, ctx.currentTime);
  compressor.knee.setValueAtTime(10, ctx.currentTime);
  compressor.ratio.setValueAtTime(4, ctx.currentTime);
  compressor.release.setValueAtTime(0.3, ctx.currentTime);

  // Chain: oscillators → compressor → filter → analyser → masterGain → out
  compressor.connect(filter);
  filter.connect(analyser);
  analyser.connect(masterGain);
  masterGain.connect(ctx.destination);

  // Drone frequencies — A minor pentatonic spread across 3 octaves
  const baseDrones = [55, 82.5, 110, 165, 220];
  const extrasByLevel: Record<MomentumLevel, number[]> = {
    DORMANT:      [],
    WARMING:      [330],
    FLOWING:      [330, 440],
    BLAZING:      [330, 440, 550, 660],
    TRANSCENDENT: [330, 440, 550, 660, 880, 1100],
  };
  const freqs = [...baseDrones, ...extrasByLevel[level]];

  const oscTypes: OscillatorType[] = ['sine', 'triangle', 'sawtooth'];
  const oscillators: OscillatorNode[] = freqs.map((freq, i) => {
    const osc = ctx!.createOscillator();
    osc.type = oscTypes[i % oscTypes.length];
    osc.frequency.setValueAtTime(freq, ctx!.currentTime);
    // Slight random detune for warmth
    osc.detune.setValueAtTime((Math.random() - 0.5) * 14, ctx!.currentTime);

    const oscGain = ctx!.createGain();
    oscGain.gain.setValueAtTime(0.28 / freqs.length, ctx!.currentTime);
    osc.connect(oscGain);
    oscGain.connect(compressor);
    osc.start();
    return osc;
  });

  // Slow organic filter sweep
  let sweepTimer: ReturnType<typeof setTimeout> | null = null;
  const sweep = () => {
    if (!ctx || ctx.state === 'closed') return;
    const target = baseFreq * (0.65 + Math.random() * 0.7);
    filter.frequency.linearRampToValueAtTime(target, ctx.currentTime + 14);
    sweepTimer = setTimeout(sweep, 14_000);
  };
  sweepTimer = setTimeout(sweep, 3000);

  const cleanup = () => {
    if (sweepTimer !== null) clearTimeout(sweepTimer);
    oscillators.forEach(o => {
      try { o.stop(); o.disconnect(); } catch { /* already stopped */ }
    });
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx!.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, ctx!.currentTime + 1.2);
    setTimeout(() => {
      try { ctx!.close(); } catch { /* ignore */ }
    }, 1500);
  };

  return { cleanup, analyser };
}

// ── Tiny white square texture as a data URL (for particles in test envs) ──────
const WHITE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAE0lEQVQI12P4' +
  'z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==';

// ── Component ──────────────────────────────────────────────────────────────────

export default function DREAMfield() {
  const router = useRouter();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const engineRef  = useRef<AbstractEngine | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);

  const [momentum, setMomentum]         = useState<MomentumSnapshot | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetConfig | null>(null);
  const [warpTo, setWarpTo]             = useState<string | null>(null);
  const [cmdOpen, setCmdOpen]           = useState(false);
  const [cmdValue, setCmdValue]         = useState('');
  const [audioStarted, setAudioStarted] = useState(false);
  const [renderInfo, setRenderInfo]     = useState('');

  // ── Command palette keyboard shortcut ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !cmdOpen && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setCmdOpen(true);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setCmdValue('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdOpen]);

  // ── Command submit ────────────────────────────────────────────────────────────
  const handleCmd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = cmdValue.trim().toLowerCase();
    const match = PLANET_CONFIGS.find(p =>
      p.enginId.includes(val) || p.label.toLowerCase().includes(val)
    );
    if (match) {
      doWarp(match.href);
    }
    setCmdOpen(false);
    setCmdValue('');
  };

  const doWarp = useCallback((href: string) => {
    setWarpTo(href);
    audioCleanupRef.current?.();
    setTimeout(() => router.push(href), 700);
  }, [router]);

  // ── Ambient audio toggle ──────────────────────────────────────────────────────
  const startAudio = useCallback(() => {
    if (audioStarted) return;
    setAudioStarted(true);
    const level = (momentum?.level ?? 'DORMANT') as MomentumLevel;
    const { cleanup, analyser } = createAmbientAudio(level);
    audioCleanupRef.current = cleanup;
    analyserRef.current = analyser;
  }, [audioStarted, momentum]);

  // ── Babylon.js scene ──────────────────────────────────────────────────────────
  const launchScene = useCallback(async (canvas: HTMLCanvasElement) => {
    // Compute momentum synchronously; also push to React state for the HUD
    const mom = computeMomentum();
    setMomentum(mom);

    const { engine, isWebGPU } = await createBabylonEngine(canvas, {
      antialias: true,
      preserveDrawingBuffer: false,
      stencil: true,
    });
    engineRef.current = engine;
    setRenderInfo(isWebGPU ? 'WebGPU' : 'WebGL2');

    const {
      Scene,
      Vector3,
      Color3,
      Color4,
      ArcRotateCamera,
      HemisphericLight,
      PointLight,
      MeshBuilder,
      PBRMaterial,
      GlowLayer,
      ParticleSystem,
      Texture,
      DefaultRenderingPipeline,
      ActionManager,
      ExecuteCodeAction,
    } = await import('@babylonjs/core');

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.01, 0.01, 0.04, 1);

    // ── Camera ───────────────────────────────────────────────────────────────
    const camera = new ArcRotateCamera(
      'cosmos_cam',
      -Math.PI / 2,
      Math.PI / 3.2,
      32,
      new Vector3(0, 0, 0),
      scene,
    );
    camera.lowerRadiusLimit = 14;
    camera.upperRadiusLimit = 65;
    camera.lowerBetaLimit   = 0.25;
    camera.upperBetaLimit   = Math.PI / 2;
    camera.attachControl(canvas, true);

    // ── Ambient light ────────────────────────────────────────────────────────
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
    ambient.intensity   = 0.12;
    ambient.diffuse     = new Color3(0.18, 0.28, 0.55);
    ambient.groundColor = new Color3(0.04, 0.04, 0.10);

    // ── Star parameters from momentum ────────────────────────────────────────
    const composite = mom.composite;
    const level     = mom.level;
    const starScale = 0.9 + (composite / 100) * 1.3;

    const starR =
      level === 'TRANSCENDENT' ? 1.00
      : level === 'BLAZING'    ? 1.00
      : level === 'FLOWING'    ? 0.95
      : level === 'WARMING'    ? 0.85
      : 0.65;
    const starG =
      level === 'TRANSCENDENT' ? 0.90
      : level === 'BLAZING'    ? 0.75
      : level === 'FLOWING'    ? 0.60
      : level === 'WARMING'    ? 0.48
      : 0.42;
    const starB =
      level === 'TRANSCENDENT' ? 0.55
      : level === 'BLAZING'    ? 0.18
      : 0.08;

    // ── Central Dream Star ───────────────────────────────────────────────────
    const star = MeshBuilder.CreateSphere('star', { diameter: starScale * 2, segments: 32 }, scene);
    const starMat = new PBRMaterial('starMat', scene);
    starMat.albedoColor  = new Color3(starR * 0.25, starG * 0.25, starB * 0.25);
    starMat.emissiveColor = new Color3(starR, starG, starB);
    starMat.metallic  = 0.0;
    starMat.roughness = 0.55;
    star.material = starMat;

    // Star point light illuminating all planets
    const starLight = new PointLight('starLight', new Vector3(0, 0, 0), scene);
    starLight.diffuse   = new Color3(starR, starG, starB);
    starLight.specular  = new Color3(starR, starG * 0.6, starB * 0.3);
    starLight.intensity = 2.5 + (composite / 100) * 9;
    starLight.range     = 55;

    // ── Glow layer ───────────────────────────────────────────────────────────
    const glow = new GlowLayer('cosmos_glow', scene);
    glow.intensity = 0.55 + (composite / 100) * 1.1;
    glow.addIncludedOnlyMesh(star);

    // ── Orbiting planets ─────────────────────────────────────────────────────
    const planetAngles: Record<string, number> = {};
    const planetMeshes = new Map<string, ReturnType<typeof MeshBuilder.CreateSphere>>();

    for (const cfg of PLANET_CONFIGS) {
      planetAngles[cfg.enginId] = cfg.orbitPhase;

      const px = cfg.orbitRadius * Math.cos(cfg.orbitPhase);
      const pz = cfg.orbitRadius * Math.sin(cfg.orbitPhase);
      const py = Math.sin(cfg.orbitPhase * 1.6) * 2.0;

      const planet = MeshBuilder.CreateSphere(
        `planet_${cfg.enginId}`,
        { diameter: cfg.size * 2, segments: 24 },
        scene,
      );
      planet.position.set(px, py, pz);

      const mat = new PBRMaterial(`mat_${cfg.enginId}`, scene);
      mat.albedoColor   = new Color3(cfg.r * 0.4, cfg.g * 0.4, cfg.b * 0.4);
      mat.emissiveColor = new Color3(cfg.r * 0.28, cfg.g * 0.28, cfg.b * 0.28);
      mat.metallic  = 0.55;
      mat.roughness = 0.42;
      planet.material = mat;
      glow.addIncludedOnlyMesh(planet);

      // Saturn-style ring for Code and Create
      if (cfg.ringPlanet) {
        const ring = MeshBuilder.CreateTorus(
          `ring_${cfg.enginId}`,
          { diameter: cfg.size * 3.8, thickness: 0.13, tessellation: 56 },
          scene,
        );
        ring.parent   = planet;
        ring.rotation.x = Math.PI / 3.5;

        const ringMat = new PBRMaterial(`ringMat_${cfg.enginId}`, scene);
        ringMat.albedoColor   = new Color3(cfg.r * 0.55, cfg.g * 0.55, cfg.b * 0.55);
        ringMat.emissiveColor = new Color3(cfg.r * 0.18, cfg.g * 0.18, cfg.b * 0.18);
        ringMat.metallic  = 0.85;
        ringMat.roughness = 0.28;
        ring.material = ringMat;
        glow.addIncludedOnlyMesh(ring);
      }

      // ActionManager for hover + pick
      planet.actionManager = new ActionManager(scene);

      planet.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
          setHoveredPlanet(cfg);
        }),
      );
      planet.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
          setHoveredPlanet(prev => (prev?.enginId === cfg.enginId ? null : prev));
        }),
      );
      planet.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          doWarp(cfg.href);
        }),
      );

      planetMeshes.set(cfg.enginId, planet);
    }

    // ── Orbital animation render loop ────────────────────────────────────────
    let t = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() * 0.001; // seconds
      t += dt;

      // Pulse star emissive
      const pulse = Math.sin(t * 1.35) * 0.09;
      starMat.emissiveColor = new Color3(
        starR * (0.9 + pulse),
        starG * (0.9 + pulse),
        starB * (0.9 + pulse),
      );
      starLight.intensity = (2.5 + (composite / 100) * 9) * (0.92 + pulse * 0.35);

      // Audio-reactive glow
      const analyser = analyserRef.current;
      if (analyser) {
        const buf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buf);
        const bass = buf[2] / 255;
        glow.intensity = (0.55 + (composite / 100) * 1.1) + bass * 0.9;
        starLight.intensity *= 1 + bass * 0.4;
      }

      // Orbit planets
      for (const cfg of PLANET_CONFIGS) {
        const mesh = planetMeshes.get(cfg.enginId);
        if (!mesh) continue;
        planetAngles[cfg.enginId] += cfg.orbitSpeed * dt;
        const angle = planetAngles[cfg.enginId];
        mesh.position.x = cfg.orbitRadius * Math.cos(angle);
        mesh.position.z = cfg.orbitRadius * Math.sin(angle);
        mesh.position.y = Math.sin(angle * 1.6) * 2.0;
        mesh.rotation.y += 0.006 * dt * 60;
      }
    });

    // ── Star corona particle system ──────────────────────────────────────────
    const coronaPS = new ParticleSystem('corona', 220, scene);
    coronaPS.particleTexture = new Texture(WHITE_PIXEL_PNG, scene);
    coronaPS.emitter = star;
    coronaPS.minEmitBox = new Vector3(-0.6, -0.6, -0.6);
    coronaPS.maxEmitBox = new Vector3(0.6, 0.6, 0.6);
    coronaPS.color1   = new Color4(starR, starG * 0.85, starB * 0.3, 1);
    coronaPS.color2   = new Color4(1.0, 0.92, 0.35, 0.55);
    coronaPS.colorDead = new Color4(0, 0, 0, 0);
    coronaPS.minSize  = 0.06;
    coronaPS.maxSize  = 0.30;
    coronaPS.minLifeTime = 0.4;
    coronaPS.maxLifeTime = 1.4;
    coronaPS.emitRate = 90;
    coronaPS.minEmitPower = 0.4;
    coronaPS.maxEmitPower = 1.6 + (composite / 100) * 3.5;
    coronaPS.updateSpeed  = 0.015;
    coronaPS.start();

    // ── Deep-space starfield ─────────────────────────────────────────────────
    const starsPS = new ParticleSystem('stars', 650, scene);
    starsPS.particleTexture = new Texture(WHITE_PIXEL_PNG, scene);
    starsPS.emitter = new Vector3(0, 0, 0);
    starsPS.minEmitBox = new Vector3(-65, -35, -65);
    starsPS.maxEmitBox = new Vector3(65, 35, 65);
    starsPS.color1    = new Color4(0.80, 0.88, 1.00, 0.75);
    starsPS.color2    = new Color4(0.60, 0.70, 0.92, 0.30);
    starsPS.colorDead  = new Color4(0, 0, 0, 0);
    starsPS.minSize   = 0.04;
    starsPS.maxSize   = 0.14;
    starsPS.minLifeTime = 50;
    starsPS.maxLifeTime = 100;
    starsPS.emitRate   = 8;
    starsPS.minEmitPower = 0;
    starsPS.maxEmitPower = 0.015;
    starsPS.updateSpeed  = 0.001;
    starsPS.start();

    // ── Post-processing pipeline ─────────────────────────────────────────────
    const pipe = new DefaultRenderingPipeline('cosmos_pipe', true, scene, [camera]);
    pipe.bloomEnabled    = true;
    pipe.bloomThreshold  = 0.18;
    pipe.bloomWeight     = 0.55 + (composite / 100) * 0.65;
    pipe.bloomScale      = 0.5;
    pipe.chromaticAberrationEnabled = true;
    pipe.chromaticAberration.aberrationAmount = 18;
    pipe.fxaaEnabled = true;

    // ── Render loop ──────────────────────────────────────────────────────────
    engine.runRenderLoop(() => {
      scene.render();
    });
  }, [doWarp]);

  // ── Mount / unmount ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    launchScene(canvas);

    const handleResize = () => engineRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [launchScene]);

  // ── Cleanup audio on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => { audioCleanupRef.current?.(); };
  }, []);

  // ── Derived display values ────────────────────────────────────────────────────
  const composite  = momentum?.composite ?? 0;
  const level      = momentum?.level ?? 'DORMANT';
  const levelColor = getLevelColor(level as MomentumLevel);
  const levelEmoji = getLevelEmoji(level as MomentumLevel);

  return (
    <div
      style={{
        position:   'fixed',
        inset:       0,
        background: 'radial-gradient(ellipse at center, #060d22 0%, #010408 100%)',
        overflow:   'hidden',
      }}
    >
      {/* ── 3D canvas ── */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-label="DREAMfield — 3D creative cosmos"
      />

      {/* ── Top bar ── */}
      <div
        style={{
          position:        'absolute',
          top: 0, left: 0, right: 0,
          zIndex:           20,
          display:          'flex',
          alignItems:       'center',
          gap:               12,
          padding:          '14px 20px',
          background:       'rgba(1, 4, 12, 0.62)',
          backdropFilter:   'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom:     '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Link
          href="/homedream"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:             6,
            color:          'rgba(160,195,240,0.72)',
            textDecoration: 'none',
            fontSize:        13,
            fontWeight:      600,
            padding:         '6px 12px',
            borderRadius:    20,
            background:      'rgba(255,255,255,0.05)',
            border:          '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <ArrowLeft size={14} />
          Home
        </Link>

        <Star size={15} style={{ color: levelColor }} />

        <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: 16 }}>
          DREAMfield
        </span>
        <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>
          Your Creative Cosmos
        </span>

        <div style={{ flex: 1 }} />

        {!audioStarted && (
          <button
            onClick={startAudio}
            style={{
              fontSize:   11,
              color:      'rgba(255,255,255,0.42)',
              background: 'rgba(255,255,255,0.04)',
              border:     '1px solid rgba(255,255,255,0.08)',
              padding:    '4px 11px',
              borderRadius: 12,
              cursor:     'pointer',
            }}
          >
            ♪ Ambient
          </button>
        )}

        <button
          onClick={() => setCmdOpen(true)}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:           5,
            fontSize:      12,
            color:         'rgba(255,255,255,0.48)',
            background:    'rgba(255,255,255,0.04)',
            border:        '1px solid rgba(255,255,255,0.08)',
            padding:       '5px 13px',
            borderRadius:   14,
            cursor:         'pointer',
          }}
        >
          <Command size={11} />
          <span style={{ fontFamily: 'monospace' }}>/</span>
          Jump
        </button>

        {renderInfo && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.05em' }}>
            {renderInfo}
          </span>
        )}
      </div>

      {/* ── Planet legend (sidebar) ── */}
      <div
        style={{
          position:      'absolute',
          top:            80,
          right:          20,
          zIndex:         15,
          display:        'flex',
          flexDirection:  'column',
          gap:             7,
        }}
      >
        {PLANET_CONFIGS.map(p => (
          <button
            key={p.enginId}
            onClick={() => doWarp(p.href)}
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:          8,
              padding:     '5px 12px',
              background:  `${p.accent}14`,
              border:      `1px solid ${p.accent}30`,
              borderRadius: 10,
              cursor:       'pointer',
              textAlign:   'left',
            }}
          >
            <span style={{
              width:        8,
              height:       8,
              borderRadius: '50%',
              background:   p.accent,
              boxShadow:   `0 0 6px ${p.accent}`,
              flexShrink:   0,
              display:      'block',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, whiteSpace: 'nowrap' }}>
              {p.emoji} {p.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Forge Momentum HUD ── */}
      <div
        style={{
          position:        'absolute',
          bottom:           32,
          left:             24,
          zIndex:           20,
          background:       'rgba(1,4,14,0.72)',
          border:          `1px solid ${levelColor}28`,
          borderRadius:     18,
          padding:         '16px 20px',
          backdropFilter:   'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          minWidth:         204,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Zap size={13} style={{ color: levelColor }} />
          <span style={{ color: levelColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
            FORGE MOMENTUM
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
            {composite}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.36)' }}>/100</span>
        </div>

        <div style={{
          background:   'rgba(255,255,255,0.07)',
          borderRadius:  4,
          height:        4,
          marginBottom:  10,
          overflow:      'hidden',
        }}>
          <div style={{
            width:      `${composite}%`,
            height:     '100%',
            background: `linear-gradient(90deg, ${levelColor}70, ${levelColor})`,
            borderRadius: 4,
          }} />
        </div>

        <div style={{ fontSize: 12, color: levelColor, fontWeight: 600 }}>
          {levelEmoji} {level}
        </div>

        {momentum?.streakDays != null && momentum.streakDays > 0 && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 5 }}>
            🔥 {momentum.streakDays}d streak
          </div>
        )}

        {momentum?.enginesUsedToday && momentum.enginesUsedToday.length > 0 && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>
            Active: {momentum.enginesUsedToday.slice(0, 3).join(', ')}
          </div>
        )}
      </div>

      {/* ── Hovered planet tooltip ── */}
      {hoveredPlanet && !warpTo && (
        <div
          style={{
            position:        'absolute',
            bottom:           32,
            right:            24,
            zIndex:           20,
            background:       'rgba(1,4,14,0.78)',
            border:          `1px solid ${hoveredPlanet.accent}38`,
            borderRadius:     16,
            padding:         '14px 18px',
            backdropFilter:   'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            maxWidth:         210,
            pointerEvents:   'none',
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 6 }}>{hoveredPlanet.emoji}</div>
          <div style={{ color: hoveredPlanet.accent, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            {hoveredPlanet.name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12 }}>
            Click to warp ↗
          </div>
        </div>
      )}

      {/* ── Warp flash overlay ── */}
      {warpTo && (
        <div
          style={{
            position:        'absolute',
            inset:            0,
            zIndex:           50,
            display:          'flex',
            alignItems:       'center',
            justifyContent:  'center',
            background:       'radial-gradient(ellipse at center, rgba(255,220,80,0.22) 0%, rgba(0,0,0,0.94) 70%)',
            animation:        'dreamfield-warp 0.7s ease forwards',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🌟</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '0.18em' }}>
              WARPING
            </div>
          </div>
        </div>
      )}

      {/* ── Command palette ── */}
      {cmdOpen && (
        <div
          style={{
            position:        'absolute',
            inset:            0,
            zIndex:           100,
            display:          'flex',
            alignItems:       'flex-start',
            justifyContent:  'center',
            paddingTop:      '20vh',
            background:      'rgba(0,0,0,0.72)',
            backdropFilter:   'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
          onClick={() => { setCmdOpen(false); setCmdValue(''); }}
        >
          <div
            style={{
              background:   'rgba(4, 10, 28, 0.98)',
              border:       '1px solid rgba(255,255,255,0.14)',
              borderRadius:  22,
              padding:      '20px 24px',
              width:        '90%',
              maxWidth:      500,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              color:          'rgba(255,255,255,0.42)',
              fontSize:        11,
              marginBottom:    10,
              letterSpacing:  '0.12em',
              textTransform:  'uppercase',
            }}>
              Jump to Engin
            </div>

            <form onSubmit={handleCmd}>
              <input
                autoFocus
                value={cmdValue}
                onChange={e => setCmdValue(e.target.value)}
                placeholder="games, music, code, lab, brand, create…"
                style={{
                  width:       '100%',
                  background:  'transparent',
                  border:      'none',
                  outline:     'none',
                  color:       '#fff',
                  fontSize:     18,
                  fontWeight:   500,
                  boxSizing:   'border-box',
                }}
              />
            </form>

            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PLANET_CONFIGS.map(p => (
                <button
                  key={p.enginId}
                  onClick={() => { doWarp(p.href); setCmdOpen(false); }}
                  style={{
                    background:   `${p.accent}1a`,
                    border:       `1px solid ${p.accent}38`,
                    borderRadius:  10,
                    padding:      '5px 13px',
                    color:         p.accent,
                    fontSize:      12,
                    cursor:        'pointer',
                    fontWeight:    600,
                  }}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes dreamfield-warp {
          0%   { opacity: 0; }
          40%  { opacity: 1; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
