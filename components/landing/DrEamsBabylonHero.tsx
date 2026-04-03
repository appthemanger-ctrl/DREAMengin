'use client';

import { useEffect, useRef } from 'react';
import { createBabylonEngine } from '@/lib/babylon/createEngine';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  CubeTexture,
  DirectionalLight,
  FresnelParameters,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import {
  DreamEngineGodTierSystem,
  applyGodTierToBabylon,
  defaultDeviceSignals,
  defaultRuntimeMetrics,
  defaultUXSignals,
  defaultRouteSignals,
  type BabylonSceneLike,
} from '@/lib/god-tier/godTierEngine';
import {
  WebGPUDirector,
  applyDirectorFrame,
  buildSceneObjects,
  defaultCameraSignals,
  type DirectorBabylonEngine,
  type DirectorBabylonMesh,
  type DirectorBabylonScene,
} from '@/lib/webgpu/director';

// ── Helpers ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function makeIdleCursorTarget(t: number) {
  return {
    x: Math.sin(t * 0.55) * 0.22 + Math.sin(t * 1.3) * 0.05,
    y: Math.cos(t * 0.38) * 0.10 + Math.sin(t * 0.8) * 0.03,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  width?: number;
  height?: number;
  className?: string;
};

/**
 * DrEamsBabylonHero — C+++ grade procedural 3D robot matching the Dr. Eams
 * reference design: large glossy dark helmet, oversized glowing ring-eyes
 * (gold left / cyan right), structured white lab coat over dark mechanical
 * body, segmented articulated hands, chunky dark boots.
 *
 * Built entirely with Babylon.js 9.1 procedural geometry + PBR materials.
 */
export default function DrEamsBabylonHero({
  width = 480,
  height = 480,
  className = '',
}: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const godTierRef  = useRef(new DreamEngineGodTierSystem());
  const directorRef = useRef(new WebGPUDirector());
  const engineRef   = useRef<import('@babylonjs/core').AbstractEngine | null>(null);
  const sceneRef    = useRef<Scene | null>(null);
  const onResizeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    createBabylonEngine(canvas, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    }).then(({ engine }) => {
      if (disposed) { engine.dispose(); return; }
      engineRef.current = engine;

      const scene = new Scene(engine);
      sceneRef.current = scene;
      scene.clearColor = new Color4(0, 0, 0, 0);

      // ── Camera ────────────────────────────────────────────────────────────
      const camera = new ArcRotateCamera(
        'cam',
        -Math.PI / 2,
        Math.PI / 2.08,
        5.8,
        new Vector3(0, 1.25, 0),
        scene,
      );
      camera.lowerRadiusLimit = 4.2;
      camera.upperRadiusLimit = 8.0;
      camera.wheelDeltaPercentage = 0.01;
      camera.panningSensibility = 0;
      camera.allowUpsideDown = false;
      camera.attachControl(canvas, true);

      // ── Lights ──────────────────────────────────────────────────────────────
      const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
      hemi.intensity = 1.0;
      hemi.groundColor = new Color3(0.03, 0.04, 0.08);
      hemi.diffuse = new Color3(0.70, 0.90, 1.0);

      const key = new DirectionalLight('key', new Vector3(-0.3, -0.8, 0.5), scene);
      key.position = new Vector3(3, 6, -4);
      key.intensity = 2.4;
      key.diffuse = new Color3(0.85, 0.92, 1.0);

      const fill = new DirectionalLight('fill', new Vector3(0.6, -0.25, -0.5), scene);
      fill.position = new Vector3(-4, 3, 2);
      fill.intensity = 1.2;
      fill.diffuse = new Color3(0.40, 0.75, 1.0);

      const rim = new DirectionalLight('rim', new Vector3(0, -0.15, -1), scene);
      rim.position = new Vector3(0, 3, 5);
      rim.intensity = 0.8;
      rim.diffuse = new Color3(0.20, 0.60, 1.0);

      // ── Glow ────────────────────────────────────────────────────────────────
      const glow = new GlowLayer('glow', scene, { blurKernelSize: 24 });
      glow.intensity = 0.65;

      // ── Environment (IBL) ───────────────────────────────────────────────────
      scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(
        'https://assets.babylonjs.com/environments/Studio.env',
        scene,
      );
      scene.environmentIntensity = 1.4;

      // ══════════════════════════════════════════════════════════════════════════
      // ── MATERIALS — Premium PBR matching reference screenshot ──────────────
      // ══════════════════════════════════════════════════════════════════════════

      // Dark glossy helmet — near-black with high metallic sheen
      const helmetMat = new PBRMaterial('helmet', scene);
      helmetMat.albedoColor = new Color3(0.04, 0.04, 0.06);
      helmetMat.metallic = 0.95;
      helmetMat.roughness = 0.12;
      helmetMat.environmentIntensity = 2.2;
      helmetMat.clearCoat.isEnabled = true;
      helmetMat.clearCoat.intensity = 0.9;
      helmetMat.clearCoat.roughness = 0.06;
      helmetMat.emissiveColor = new Color3(0.01, 0.02, 0.03);

      // Dark mechanical body metal — glossy near-black for arms, legs, body
      const darkMetalMat = new PBRMaterial('darkMetal', scene);
      darkMetalMat.albedoColor = new Color3(0.06, 0.06, 0.08);
      darkMetalMat.metallic = 0.92;
      darkMetalMat.roughness = 0.15;
      darkMetalMat.environmentIntensity = 1.8;
      darkMetalMat.clearCoat.isEnabled = true;
      darkMetalMat.clearCoat.intensity = 0.7;
      darkMetalMat.clearCoat.roughness = 0.10;

      // Joint/segment accent — slightly lighter dark metal for visible seams
      const jointMat = new PBRMaterial('joint', scene);
      jointMat.albedoColor = new Color3(0.10, 0.10, 0.12);
      jointMat.metallic = 0.85;
      jointMat.roughness = 0.25;
      jointMat.environmentIntensity = 1.4;

      // White lab coat — clean medical white with fabric feel
      const coatMat = new PBRMaterial('coat', scene);
      coatMat.albedoColor = new Color3(0.92, 0.92, 0.94);
      coatMat.metallic = 0.0;
      coatMat.roughness = 0.55;
      coatMat.environmentIntensity = 0.5;

      // Blue undershirt (V-neck visible beneath coat)
      const shirtMat = new PBRMaterial('shirt', scene);
      shirtMat.albedoColor = new Color3(0.25, 0.45, 0.65);
      shirtMat.metallic = 0.0;
      shirtMat.roughness = 0.60;
      shirtMat.environmentIntensity = 0.4;

      // Visor / face screen — dark glass with deep internal glow
      const visorMat = new PBRMaterial('visor', scene);
      visorMat.albedoColor = new Color3(0.02, 0.04, 0.06);
      visorMat.alpha = 0.88;
      visorMat.metallic = 0.0;
      visorMat.roughness = 0.02;
      visorMat.environmentIntensity = 2.0;
      visorMat.emissiveColor = new Color3(0.08, 0.30, 0.40);
      visorMat.clearCoat.isEnabled = true;
      visorMat.clearCoat.intensity = 1.0;
      visorMat.clearCoat.roughness = 0.01;
      visorMat.backFaceCulling = false;

      // Screen inner glow
      const screenMat = new PBRMaterial('screen', scene);
      screenMat.albedoColor = new Color3(0.02, 0.15, 0.22);
      screenMat.emissiveColor = new Color3(0.10, 0.55, 0.70);
      screenMat.metallic = 0;
      screenMat.roughness = 1;

      // Gold eye (left) — warm amber/gold ring glow
      const eyeGoldMat = new PBRMaterial('eyeGold', scene);
      eyeGoldMat.albedoColor = new Color3(1.0, 0.75, 0.10);
      eyeGoldMat.emissiveColor = new Color3(1.0, 0.72, 0.0);
      eyeGoldMat.metallic = 0;
      eyeGoldMat.roughness = 1;

      // Cyan eye (right) — cool blue ring glow
      const eyeCyanMat = new PBRMaterial('eyeCyan', scene);
      eyeCyanMat.albedoColor = new Color3(0.10, 0.78, 1.0);
      eyeCyanMat.emissiveColor = new Color3(0.0, 0.80, 1.0);
      eyeCyanMat.metallic = 0;
      eyeCyanMat.roughness = 1;

      // Boot material — chunky dark glossy
      const bootMat = new PBRMaterial('boot', scene);
      bootMat.albedoColor = new Color3(0.05, 0.05, 0.07);
      bootMat.metallic = 0.88;
      bootMat.roughness = 0.18;
      bootMat.environmentIntensity = 1.6;
      bootMat.clearCoat.isEnabled = true;
      bootMat.clearCoat.intensity = 0.8;
      bootMat.clearCoat.roughness = 0.08;

      // Badge plate — silver metallic
      const badgeMat = new PBRMaterial('badge', scene);
      badgeMat.albedoColor = new Color3(0.80, 0.82, 0.85);
      badgeMat.metallic = 0.9;
      badgeMat.roughness = 0.2;
      badgeMat.environmentIntensity = 1.2;

      // Chest emblem — subtle dark circle
      const emblemMat = new PBRMaterial('emblem', scene);
      emblemMat.albedoColor = new Color3(0.20, 0.35, 0.50);
      emblemMat.metallic = 0.5;
      emblemMat.roughness = 0.3;

      // Gold orbit material
      const goldMat = new PBRMaterial('gold', scene);
      goldMat.albedoColor = new Color3(0.83, 0.68, 0.21);
      goldMat.metallic = 1.0;
      goldMat.roughness = 0.3;
      goldMat.environmentIntensity = 1.6;
      goldMat.emissiveColor = new Color3(0.18, 0.13, 0.02);

      // Fresnel ghost rim
      const ghostRimMat = new StandardMaterial('ghostRim', scene);
      ghostRimMat.emissiveColor = new Color3(0.83, 0.68, 0.21);
      ghostRimMat.alpha = 0.22;
      const fresnelParams = new FresnelParameters();
      fresnelParams.leftColor = new Color3(0.83, 0.68, 0.21);
      fresnelParams.rightColor = Color3.Black();
      fresnelParams.power = 2.5;
      fresnelParams.bias = 0.08;
      ghostRimMat.emissiveFresnelParameters = fresnelParams;
      ghostRimMat.wireframe = false;
      ghostRimMat.backFaceCulling = false;

      // ══════════════════════════════════════════════════════════════════════════
      // ── ROBOT HIERARCHY — C+++ grade Dr. Eams matching reference ───────────
      // ══════════════════════════════════════════════════════════════════════════

      const root = new TransformNode('root', scene);
      root.position = new Vector3(0, 0, 0);

      // ─── TORSO (dark mechanical core under lab coat) ───────────────────────

      // Inner dark body core
      const bodyCore = MeshBuilder.CreateCylinder(
        'bodyCore',
        { height: 1.05, diameterTop: 0.72, diameterBottom: 0.58, tessellation: 32 },
        scene,
      );
      bodyCore.material = darkMetalMat;
      bodyCore.position.y = 1.15;
      bodyCore.parent = root;

      // Lab coat shell — slightly larger, wrapping the body
      const coatMain = MeshBuilder.CreateCylinder(
        'coatMain',
        { height: 1.10, diameterTop: 0.82, diameterBottom: 0.64, tessellation: 32 },
        scene,
      );
      coatMain.material = coatMat;
      coatMain.position.y = 1.12;
      coatMain.parent = root;

      // Coat front panel — adds 3D depth to the front
      const coatFront = MeshBuilder.CreateCylinder(
        'coatFront',
        { height: 1.0, diameterTop: 0.74, diameterBottom: 0.58, tessellation: 32 },
        scene,
      );
      coatFront.material = coatMat;
      coatFront.position = new Vector3(0, 1.14, 0.12);
      coatFront.scaling.z = 0.5;
      coatFront.parent = root;

      // Blue V-neck undershirt visible at collar
      const vNeck = MeshBuilder.CreateCylinder(
        'vNeck',
        { height: 0.22, diameterTop: 0.30, diameterBottom: 0.18, tessellation: 16 },
        scene,
      );
      vNeck.material = shirtMat;
      vNeck.position = new Vector3(0, 1.60, 0.18);
      vNeck.scaling.z = 0.4;
      vNeck.parent = root;

      // V-neck triangle cutout shape
      const vNeckTriL = MeshBuilder.CreateBox(
        'vNeckTriL',
        { width: 0.12, height: 0.20, depth: 0.02 },
        scene,
      );
      vNeckTriL.material = shirtMat;
      vNeckTriL.rotation.z = 0.22;
      vNeckTriL.position = new Vector3(-0.08, 1.52, 0.30);
      vNeckTriL.parent = root;

      const vNeckTriR = MeshBuilder.CreateBox(
        'vNeckTriR',
        { width: 0.12, height: 0.20, depth: 0.02 },
        scene,
      );
      vNeckTriR.material = shirtMat;
      vNeckTriR.rotation.z = -0.22;
      vNeckTriR.position = new Vector3(0.08, 1.52, 0.30);
      vNeckTriR.parent = root;

      // Coat collar — raised lapels
      const collarL = MeshBuilder.CreateBox(
        'collarL',
        { width: 0.22, height: 0.16, depth: 0.06 },
        scene,
      );
      collarL.material = coatMat;
      collarL.rotation.z = 0.18;
      collarL.position = new Vector3(-0.18, 1.66, 0.26);
      collarL.parent = root;

      const collarR = MeshBuilder.CreateBox(
        'collarR',
        { width: 0.22, height: 0.16, depth: 0.06 },
        scene,
      );
      collarR.material = coatMat;
      collarR.rotation.z = -0.18;
      collarR.position = new Vector3(0.18, 1.66, 0.26);
      collarR.parent = root;

      // Chest emblem — small circle on upper chest
      const chestEmblem = MeshBuilder.CreateCylinder(
        'chestEmblem',
        { height: 0.02, diameter: 0.10, tessellation: 20 },
        scene,
      );
      chestEmblem.material = emblemMat;
      chestEmblem.rotation.x = Math.PI / 2;
      chestEmblem.position = new Vector3(0, 1.48, 0.36);
      chestEmblem.parent = root;

      // Center button line
      const buttonLine = MeshBuilder.CreateCylinder(
        'buttonLine',
        { height: 0.75, diameter: 0.02, tessellation: 8 },
        scene,
      );
      buttonLine.material = badgeMat;
      buttonLine.position = new Vector3(0, 1.12, 0.34);
      buttonLine.parent = root;

      // Individual buttons (3)
      for (let bi = 0; bi < 3; bi++) {
        const btn = MeshBuilder.CreateCylinder(
          `button${bi}`,
          { height: 0.015, diameter: 0.045, tessellation: 12 },
          scene,
        );
        btn.material = badgeMat;
        btn.rotation.x = Math.PI / 2;
        btn.position = new Vector3(0, 1.35 - bi * 0.18, 0.35);
        btn.parent = root;
      }

      // "Dr. Eams" name badge — rectangular plate on left breast
      const badgePlate = MeshBuilder.CreateBox(
        'badgePlate',
        { width: 0.22, height: 0.10, depth: 0.015 },
        scene,
      );
      badgePlate.material = badgeMat;
      badgePlate.position = new Vector3(0.22, 1.42, 0.33);
      badgePlate.parent = root;

      // Badge clip
      const badgeClip = MeshBuilder.CreateBox(
        'badgeClip',
        { width: 0.04, height: 0.06, depth: 0.02 },
        scene,
      );
      badgeClip.material = darkMetalMat;
      badgeClip.position = new Vector3(0.30, 1.47, 0.33);
      badgeClip.parent = root;

      // Coat pockets (2)
      const pocketL = MeshBuilder.CreateBox(
        'pocketL',
        { width: 0.18, height: 0.14, depth: 0.02 },
        scene,
      );
      pocketL.material = coatMat;
      pocketL.position = new Vector3(-0.16, 0.88, 0.32);
      pocketL.parent = root;

      // Pocket L flap
      const pocketFlapL = MeshBuilder.CreateBox(
        'pocketFlapL',
        { width: 0.19, height: 0.02, depth: 0.025 },
        scene,
      );
      pocketFlapL.material = coatMat;
      pocketFlapL.position = new Vector3(-0.16, 0.96, 0.33);
      pocketFlapL.parent = root;

      const pocketR = MeshBuilder.CreateBox(
        'pocketR',
        { width: 0.18, height: 0.14, depth: 0.02 },
        scene,
      );
      pocketR.material = coatMat;
      pocketR.position = new Vector3(0.16, 0.88, 0.32);
      pocketR.parent = root;

      const pocketFlapR = MeshBuilder.CreateBox(
        'pocketFlapR',
        { width: 0.19, height: 0.02, depth: 0.025 },
        scene,
      );
      pocketFlapR.material = coatMat;
      pocketFlapR.position = new Vector3(0.16, 0.96, 0.33);
      pocketFlapR.parent = root;

      // ─── NECK ─────────────────────────────────────────────────────────────

      const neckJoint = MeshBuilder.CreateCylinder(
        'neckJoint',
        { height: 0.14, diameterTop: 0.20, diameterBottom: 0.24, tessellation: 20 },
        scene,
      );
      neckJoint.material = darkMetalMat;
      neckJoint.position = new Vector3(0, 1.76, 0);
      neckJoint.parent = root;

      // Neck ring accent
      const neckRing = MeshBuilder.CreateTorus(
        'neckRing',
        { diameter: 0.24, thickness: 0.025, tessellation: 24 },
        scene,
      );
      neckRing.material = jointMat;
      neckRing.position = new Vector3(0, 1.72, 0);
      neckRing.parent = root;

      // ─── HEAD ─────────────────────────────────────────────────────────────

      const headNode = new TransformNode('headNode', scene);
      headNode.position = new Vector3(0, 2.02, 0);
      headNode.parent = root;

      // Main head — large ovoid dome (proportionally bigger than body)
      const head = MeshBuilder.CreateSphere(
        'head',
        { diameterX: 0.98, diameterY: 0.88, diameterZ: 0.90, segments: 48 },
        scene,
      );
      head.material = helmetMat;
      head.position.y = 0.08;
      head.parent = headNode;
      glow.addIncludedOnlyMesh(head as Mesh);

      // Helmet lower extension — chin area curves down
      const helmetChin = MeshBuilder.CreateSphere(
        'helmetChin',
        { diameterX: 0.76, diameterY: 0.40, diameterZ: 0.72, segments: 32 },
        scene,
      );
      helmetChin.material = helmetMat;
      helmetChin.position = new Vector3(0, -0.22, 0.02);
      helmetChin.parent = headNode;

      // ─── EAR PADS (headphone-style) ───────────────────────────────────────

      // Left ear pad — cylindrical disc
      const earPadL = MeshBuilder.CreateCylinder(
        'earPadL',
        { height: 0.12, diameter: 0.24, tessellation: 24 },
        scene,
      );
      earPadL.material = darkMetalMat;
      earPadL.rotation.z = Math.PI / 2;
      earPadL.position = new Vector3(-0.50, 0.04, 0);
      earPadL.parent = headNode;

      // Left ear pad inner ring
      const earRingL = MeshBuilder.CreateTorus(
        'earRingL',
        { diameter: 0.20, thickness: 0.02, tessellation: 20 },
        scene,
      );
      earRingL.material = jointMat;
      earRingL.rotation.z = Math.PI / 2;
      earRingL.position = new Vector3(-0.56, 0.04, 0);
      earRingL.parent = headNode;

      // Right ear pad
      const earPadR = MeshBuilder.CreateCylinder(
        'earPadR',
        { height: 0.12, diameter: 0.24, tessellation: 24 },
        scene,
      );
      earPadR.material = darkMetalMat;
      earPadR.rotation.z = Math.PI / 2;
      earPadR.position = new Vector3(0.50, 0.04, 0);
      earPadR.parent = headNode;

      const earRingR = MeshBuilder.CreateTorus(
        'earRingR',
        { diameter: 0.20, thickness: 0.02, tessellation: 20 },
        scene,
      );
      earRingR.material = jointMat;
      earRingR.rotation.z = Math.PI / 2;
      earRingR.position = new Vector3(0.56, 0.04, 0);
      earRingR.parent = headNode;

      // ─── VISOR / FACE ─────────────────────────────────────────────────────

      // Large curved visor covering front of head
      const visor = MeshBuilder.CreateSphere(
        'visor',
        { diameterX: 0.82, diameterY: 0.62, diameterZ: 0.30, segments: 32 },
        scene,
      );
      visor.material = visorMat;
      visor.position = new Vector3(0, 0.06, 0.32);
      visor.parent = headNode;
      glow.addIncludedOnlyMesh(visor as Mesh);

      // Screen inner glow surface
      const screenPlane = MeshBuilder.CreateSphere(
        'screen',
        { diameterX: 0.72, diameterY: 0.50, diameterZ: 0.10, segments: 24 },
        scene,
      );
      screenPlane.material = screenMat;
      screenPlane.position = new Vector3(0, 0.06, 0.34);
      screenPlane.parent = headNode;
      glow.addIncludedOnlyMesh(screenPlane as Mesh);

      // ─── EYES — Large glowing rings (infinity symbol) ─────────────────────

      // Gold left eye ring — LARGE and prominent
      const infL = MeshBuilder.CreateTorus(
        'infL',
        { diameter: 0.22, thickness: 0.038, tessellation: 48 },
        scene,
      );
      infL.material = eyeGoldMat;
      infL.rotation.x = Math.PI / 2;
      infL.position = new Vector3(-0.12, 0.08, 0.42);
      infL.parent = headNode;
      glow.addIncludedOnlyMesh(infL as Mesh);

      // Gold eye inner glow disc
      const eyeDiscL = MeshBuilder.CreateDisc(
        'eyeDiscL',
        { radius: 0.075, tessellation: 24 },
        scene,
      );
      eyeDiscL.material = eyeGoldMat;
      eyeDiscL.position = new Vector3(-0.12, 0.08, 0.43);
      eyeDiscL.parent = headNode;
      glow.addIncludedOnlyMesh(eyeDiscL as Mesh);

      // Cyan right eye ring — LARGE and prominent
      const infR = MeshBuilder.CreateTorus(
        'infR',
        { diameter: 0.22, thickness: 0.038, tessellation: 48 },
        scene,
      );
      infR.material = eyeCyanMat;
      infR.rotation.x = Math.PI / 2;
      infR.position = new Vector3(0.12, 0.08, 0.42);
      infR.parent = headNode;
      glow.addIncludedOnlyMesh(infR as Mesh);

      // Cyan eye inner glow disc
      const eyeDiscR = MeshBuilder.CreateDisc(
        'eyeDiscR',
        { radius: 0.075, tessellation: 24 },
        scene,
      );
      eyeDiscR.material = eyeCyanMat;
      eyeDiscR.position = new Vector3(0.12, 0.08, 0.43);
      eyeDiscR.parent = headNode;
      glow.addIncludedOnlyMesh(eyeDiscR as Mesh);

      // ─── SHOULDERS ────────────────────────────────────────────────────────

      const shoulderNodeL = new TransformNode('shoulderL', scene);
      shoulderNodeL.position = new Vector3(-0.50, 1.55, 0);
      shoulderNodeL.parent = root;

      const shoulderNodeR = new TransformNode('shoulderR', scene);
      shoulderNodeR.position = new Vector3(0.50, 1.55, 0);
      shoulderNodeR.parent = root;

      // Shoulder ball joints — large dark spheres
      const shBallL = MeshBuilder.CreateSphere(
        'shBallL',
        { diameter: 0.22, segments: 20 },
        scene,
      );
      shBallL.material = darkMetalMat;
      shBallL.position.copyFrom(Vector3.Zero());
      shBallL.parent = shoulderNodeL;

      const shBallR = MeshBuilder.CreateSphere(
        'shBallR',
        { diameter: 0.22, segments: 20 },
        scene,
      );
      shBallR.material = darkMetalMat;
      shBallR.position.copyFrom(Vector3.Zero());
      shBallR.parent = shoulderNodeR;

      // Shoulder plate covers (wider, armor-like)
      const shPlateL = MeshBuilder.CreateSphere(
        'shPlateL',
        { diameterX: 0.30, diameterY: 0.18, diameterZ: 0.26, segments: 16 },
        scene,
      );
      shPlateL.material = darkMetalMat;
      shPlateL.position = new Vector3(-0.02, 0.04, 0);
      shPlateL.parent = shoulderNodeL;

      const shPlateR = MeshBuilder.CreateSphere(
        'shPlateR',
        { diameterX: 0.30, diameterY: 0.18, diameterZ: 0.26, segments: 16 },
        scene,
      );
      shPlateR.material = darkMetalMat;
      shPlateR.position = new Vector3(0.02, 0.04, 0);
      shPlateR.parent = shoulderNodeR;

      // ─── UPPER ARMS ──────────────────────────────────────────────────────

      const upperArmL = MeshBuilder.CreateCylinder(
        'upperArmL',
        { height: 0.38, diameterTop: 0.16, diameterBottom: 0.13, tessellation: 20 },
        scene,
      );
      upperArmL.material = darkMetalMat;
      upperArmL.position.y = -0.24;
      upperArmL.parent = shoulderNodeL;

      const upperArmR = MeshBuilder.CreateCylinder(
        'upperArmR',
        { height: 0.38, diameterTop: 0.16, diameterBottom: 0.13, tessellation: 20 },
        scene,
      );
      upperArmR.material = darkMetalMat;
      upperArmR.position.y = -0.24;
      upperArmR.parent = shoulderNodeR;

      // Arm segment rings
      const armRingL = MeshBuilder.CreateTorus(
        'armRingL',
        { diameter: 0.16, thickness: 0.015, tessellation: 16 },
        scene,
      );
      armRingL.material = jointMat;
      armRingL.position.y = -0.16;
      armRingL.parent = shoulderNodeL;

      const armRingR = MeshBuilder.CreateTorus(
        'armRingR',
        { diameter: 0.16, thickness: 0.015, tessellation: 16 },
        scene,
      );
      armRingR.material = jointMat;
      armRingR.position.y = -0.16;
      armRingR.parent = shoulderNodeR;

      // ─── ELBOWS ───────────────────────────────────────────────────────────

      const elbowNodeL = new TransformNode('elbowL', scene);
      elbowNodeL.position = new Vector3(0, -0.44, 0);
      elbowNodeL.parent = shoulderNodeL;

      const elbowNodeR = new TransformNode('elbowR', scene);
      elbowNodeR.position = new Vector3(0, -0.44, 0);
      elbowNodeR.parent = shoulderNodeR;

      // Elbow joint spheres
      const elbowJL = MeshBuilder.CreateSphere(
        'elbowJL',
        { diameter: 0.12, segments: 12 },
        scene,
      );
      elbowJL.material = jointMat;
      elbowJL.parent = elbowNodeL;

      const elbowJR = MeshBuilder.CreateSphere(
        'elbowJR',
        { diameter: 0.12, segments: 12 },
        scene,
      );
      elbowJR.material = jointMat;
      elbowJR.parent = elbowNodeR;

      // ─── FOREARMS ─────────────────────────────────────────────────────────

      const forearmL = MeshBuilder.CreateCylinder(
        'forearmL',
        { height: 0.36, diameterTop: 0.12, diameterBottom: 0.10, tessellation: 20 },
        scene,
      );
      forearmL.material = darkMetalMat;
      forearmL.position.y = -0.22;
      forearmL.parent = elbowNodeL;

      const forearmR = MeshBuilder.CreateCylinder(
        'forearmR',
        { height: 0.36, diameterTop: 0.12, diameterBottom: 0.10, tessellation: 20 },
        scene,
      );
      forearmR.material = darkMetalMat;
      forearmR.position.y = -0.22;
      forearmR.parent = elbowNodeR;

      // Forearm segment rings
      const foreRingL = MeshBuilder.CreateTorus(
        'foreRingL',
        { diameter: 0.12, thickness: 0.012, tessellation: 16 },
        scene,
      );
      foreRingL.material = jointMat;
      foreRingL.position.y = -0.28;
      foreRingL.parent = elbowNodeL;

      const foreRingR = MeshBuilder.CreateTorus(
        'foreRingR',
        { diameter: 0.12, thickness: 0.012, tessellation: 16 },
        scene,
      );
      foreRingR.material = jointMat;
      foreRingR.position.y = -0.28;
      foreRingR.parent = elbowNodeR;

      // Wrist joints
      const wristL = MeshBuilder.CreateSphere(
        'wristL',
        { diameter: 0.09, segments: 10 },
        scene,
      );
      wristL.material = jointMat;
      wristL.position.y = -0.42;
      wristL.parent = elbowNodeL;

      const wristR = MeshBuilder.CreateSphere(
        'wristR',
        { diameter: 0.09, segments: 10 },
        scene,
      );
      wristR.material = jointMat;
      wristR.position.y = -0.42;
      wristR.parent = elbowNodeR;

      // ─── HANDS (detailed mechanical with segmented fingers) ───────────────

      // Helper: build a mechanical hand with palm + 4 fingers (3 segments each) + thumb
      // Build a detailed mechanical hand — symmetric in local space, mirrored by parent node
      function buildHand(side: 'L' | 'R', parentNode: TransformNode) {

        // Palm — rounded box
        const palm = MeshBuilder.CreateBox(
          `palm${side}`,
          { width: 0.14, height: 0.07, depth: 0.10 },
          scene,
        );
        palm.material = darkMetalMat;
        palm.position = new Vector3(0, -0.48, 0);
        palm.parent = parentNode;

        // Palm back plate
        const palmBack = MeshBuilder.CreateBox(
          `palmBack${side}`,
          { width: 0.13, height: 0.03, depth: 0.09 },
          scene,
        );
        palmBack.material = darkMetalMat;
        palmBack.position = new Vector3(0, -0.455, -0.02);
        palmBack.parent = parentNode;

        // Knuckle ridge
        const knuckleRidge = MeshBuilder.CreateBox(
          `knuckleRidge${side}`,
          { width: 0.14, height: 0.025, depth: 0.04 },
          scene,
        );
        knuckleRidge.material = jointMat;
        knuckleRidge.position = new Vector3(0, -0.515, 0.02);
        knuckleRidge.parent = parentNode;

        // 4 fingers — each with 3 segments + joints
        const fingerXPositions = [-0.048, -0.016, 0.016, 0.048];
        const fingerSegLengths = [
          [0.036, 0.032, 0.028], // index
          [0.040, 0.036, 0.030], // middle (longest)
          [0.038, 0.034, 0.028], // ring
          [0.030, 0.026, 0.022], // pinky (shortest)
        ];

        fingerXPositions.forEach((xOff, fi) => {
          const segs = fingerSegLengths[fi];
          let yPos = -0.535;

          segs.forEach((segLen, si) => {
            // Joint ball between segments
            const joint = MeshBuilder.CreateSphere(
              `fJoint${side}${fi}_${si}`,
              { diameter: 0.022, segments: 6 },
              scene,
            );
            joint.material = jointMat;
            joint.position = new Vector3(xOff, yPos, 0.02);
            joint.parent = parentNode;

            // Finger segment
            const seg = MeshBuilder.CreateCylinder(
              `fSeg${side}${fi}_${si}`,
              { height: segLen, diameter: 0.020, tessellation: 8 },
              scene,
            );
            seg.material = darkMetalMat;
            seg.position = new Vector3(xOff, yPos - segLen * 0.5, 0.02);
            seg.parent = parentNode;

            yPos -= segLen;
          });

          // Fingertip — rounded cap
          const tip = MeshBuilder.CreateSphere(
            `fTip${side}${fi}`,
            { diameter: 0.022, segments: 6 },
            scene,
          );
          tip.material = darkMetalMat;
          tip.position = new Vector3(xOff, yPos, 0.02);
          tip.parent = parentNode;
        });

        // Thumb — 2 segments, angled outward
        const thumbBase = MeshBuilder.CreateSphere(
          `thumbBase${side}`,
          { diameter: 0.024, segments: 6 },
          scene,
        );
        thumbBase.material = jointMat;
        thumbBase.position = new Vector3(
          side === 'L' ? -0.075 : 0.075,
          -0.49, 0.03,
        );
        thumbBase.parent = parentNode;

        const thumbSeg1 = MeshBuilder.CreateCylinder(
          `thumbSeg1${side}`,
          { height: 0.04, diameter: 0.022, tessellation: 8 },
          scene,
        );
        thumbSeg1.material = darkMetalMat;
        thumbSeg1.rotation.z = side === 'L' ? -0.6 : 0.6;
        thumbSeg1.position = new Vector3(
          side === 'L' ? -0.090 : 0.090,
          -0.505, 0.03,
        );
        thumbSeg1.parent = parentNode;

        const thumbJoint = MeshBuilder.CreateSphere(
          `thumbJoint${side}`,
          { diameter: 0.020, segments: 6 },
          scene,
        );
        thumbJoint.material = jointMat;
        thumbJoint.position = new Vector3(
          side === 'L' ? -0.105 : 0.105,
          -0.52, 0.03,
        );
        thumbJoint.parent = parentNode;

        const thumbSeg2 = MeshBuilder.CreateCylinder(
          `thumbSeg2${side}`,
          { height: 0.035, diameter: 0.020, tessellation: 8 },
          scene,
        );
        thumbSeg2.material = darkMetalMat;
        thumbSeg2.rotation.z = side === 'L' ? -0.4 : 0.4;
        thumbSeg2.position = new Vector3(
          side === 'L' ? -0.115 : 0.115,
          -0.535, 0.03,
        );
        thumbSeg2.parent = parentNode;

        const thumbTip = MeshBuilder.CreateSphere(
          `thumbTip${side}`,
          { diameter: 0.020, segments: 6 },
          scene,
        );
        thumbTip.material = darkMetalMat;
        thumbTip.position = new Vector3(
          side === 'L' ? -0.122 : 0.122,
          -0.548, 0.03,
        );
        thumbTip.parent = parentNode;
      }

      buildHand('L', elbowNodeL);
      buildHand('R', elbowNodeR);

      // ─── HIP / WAIST ─────────────────────────────────────────────────────

      const hipBand = MeshBuilder.CreateCylinder(
        'hipBand',
        { height: 0.12, diameterTop: 0.62, diameterBottom: 0.58, tessellation: 24 },
        scene,
      );
      hipBand.material = darkMetalMat;
      hipBand.position.y = 0.68;
      hipBand.parent = root;

      // Coat hem — extends below waist
      const coatHem = MeshBuilder.CreateCylinder(
        'coatHem',
        { height: 0.10, diameterTop: 0.66, diameterBottom: 0.72, tessellation: 24 },
        scene,
      );
      coatHem.material = coatMat;
      coatHem.position.y = 0.72;
      coatHem.parent = root;

      // ─── HIP PIVOT NODES ──────────────────────────────────────────────────

      const hipNodeL = new TransformNode('hipL', scene);
      hipNodeL.position = new Vector3(-0.16, 0.66, 0);
      hipNodeL.parent = root;

      const hipNodeR = new TransformNode('hipR', scene);
      hipNodeR.position = new Vector3(0.16, 0.66, 0);
      hipNodeR.parent = root;

      // Hip joint spheres
      const hipJointL = MeshBuilder.CreateSphere(
        'hipJointL',
        { diameter: 0.14, segments: 12 },
        scene,
      );
      hipJointL.material = jointMat;
      hipJointL.parent = hipNodeL;

      const hipJointR = MeshBuilder.CreateSphere(
        'hipJointR',
        { diameter: 0.14, segments: 12 },
        scene,
      );
      hipJointR.material = jointMat;
      hipJointR.parent = hipNodeR;

      // ─── UPPER LEGS ───────────────────────────────────────────────────────

      const upperLegL = MeshBuilder.CreateCylinder(
        'upperLegL',
        { height: 0.34, diameterTop: 0.14, diameterBottom: 0.12, tessellation: 20 },
        scene,
      );
      upperLegL.material = darkMetalMat;
      upperLegL.position.y = -0.22;
      upperLegL.parent = hipNodeL;

      const upperLegR = MeshBuilder.CreateCylinder(
        'upperLegR',
        { height: 0.34, diameterTop: 0.14, diameterBottom: 0.12, tessellation: 20 },
        scene,
      );
      upperLegR.material = darkMetalMat;
      upperLegR.position.y = -0.22;
      upperLegR.parent = hipNodeR;

      // ─── KNEE PIVOT NODES ─────────────────────────────────────────────────

      const kneeNodeL = new TransformNode('kneeL', scene);
      kneeNodeL.position = new Vector3(0, -0.40, 0);
      kneeNodeL.parent = hipNodeL;

      const kneeNodeR = new TransformNode('kneeR', scene);
      kneeNodeR.position = new Vector3(0, -0.40, 0);
      kneeNodeR.parent = hipNodeR;

      // Knee joint spheres
      const kneeJL = MeshBuilder.CreateSphere(
        'kneeJL',
        { diameter: 0.12, segments: 12 },
        scene,
      );
      kneeJL.material = jointMat;
      kneeJL.parent = kneeNodeL;

      const kneeJR = MeshBuilder.CreateSphere(
        'kneeJR',
        { diameter: 0.12, segments: 12 },
        scene,
      );
      kneeJR.material = jointMat;
      kneeJR.parent = kneeNodeR;

      // ─── LOWER LEGS ───────────────────────────────────────────────────────

      const lowerLegL = MeshBuilder.CreateCylinder(
        'lowerLegL',
        { height: 0.30, diameterTop: 0.11, diameterBottom: 0.10, tessellation: 20 },
        scene,
      );
      lowerLegL.material = darkMetalMat;
      lowerLegL.position.y = -0.18;
      lowerLegL.parent = kneeNodeL;

      const lowerLegR = MeshBuilder.CreateCylinder(
        'lowerLegR',
        { height: 0.30, diameterTop: 0.11, diameterBottom: 0.10, tessellation: 20 },
        scene,
      );
      lowerLegR.material = darkMetalMat;
      lowerLegR.position.y = -0.18;
      lowerLegR.parent = kneeNodeR;

      // Leg segment ring accents
      const legRingL = MeshBuilder.CreateTorus(
        'legRingL',
        { diameter: 0.12, thickness: 0.012, tessellation: 16 },
        scene,
      );
      legRingL.material = jointMat;
      legRingL.position.y = -0.10;
      legRingL.parent = kneeNodeL;

      const legRingR = MeshBuilder.CreateTorus(
        'legRingR',
        { diameter: 0.12, thickness: 0.012, tessellation: 16 },
        scene,
      );
      legRingR.material = jointMat;
      legRingR.position.y = -0.10;
      legRingR.parent = kneeNodeR;

      // ─── BOOTS (chunky, rounded, dark glossy) ─────────────────────────────

      // Ankle joint
      const ankleL = MeshBuilder.CreateSphere(
        'ankleL',
        { diameter: 0.10, segments: 10 },
        scene,
      );
      ankleL.material = jointMat;
      ankleL.position = new Vector3(0, -0.36, 0);
      ankleL.parent = kneeNodeL;

      const ankleR = MeshBuilder.CreateSphere(
        'ankleR',
        { diameter: 0.10, segments: 10 },
        scene,
      );
      ankleR.material = jointMat;
      ankleR.position = new Vector3(0, -0.36, 0);
      ankleR.parent = kneeNodeR;

      // Boot body — chunky rounded form
      const bootBodyL = MeshBuilder.CreateSphere(
        'bootBodyL',
        { diameterX: 0.26, diameterY: 0.22, diameterZ: 0.34, segments: 20 },
        scene,
      );
      bootBodyL.material = bootMat;
      bootBodyL.position = new Vector3(0, -0.42, 0.04);
      bootBodyL.parent = kneeNodeL;

      const bootBodyR = MeshBuilder.CreateSphere(
        'bootBodyR',
        { diameterX: 0.26, diameterY: 0.22, diameterZ: 0.34, segments: 20 },
        scene,
      );
      bootBodyR.material = bootMat;
      bootBodyR.position = new Vector3(0, -0.42, 0.04);
      bootBodyR.parent = kneeNodeR;

      // Boot sole — flat bottom
      const bootSoleL = MeshBuilder.CreateCylinder(
        'bootSoleL',
        { height: 0.04, diameterTop: 0.24, diameterBottom: 0.26, tessellation: 20 },
        scene,
      );
      bootSoleL.material = bootMat;
      bootSoleL.position = new Vector3(0, -0.52, 0.04);
      bootSoleL.parent = kneeNodeL;

      const bootSoleR = MeshBuilder.CreateCylinder(
        'bootSoleR',
        { height: 0.04, diameterTop: 0.24, diameterBottom: 0.26, tessellation: 20 },
        scene,
      );
      bootSoleR.material = bootMat;
      bootSoleR.position = new Vector3(0, -0.52, 0.04);
      bootSoleR.parent = kneeNodeR;

      // Boot toe cap — rounded front
      const bootToeL = MeshBuilder.CreateSphere(
        'bootToeL',
        { diameterX: 0.22, diameterY: 0.18, diameterZ: 0.14, segments: 14 },
        scene,
      );
      bootToeL.material = bootMat;
      bootToeL.position = new Vector3(0, -0.44, 0.18);
      bootToeL.parent = kneeNodeL;

      const bootToeR = MeshBuilder.CreateSphere(
        'bootToeR',
        { diameterX: 0.22, diameterY: 0.18, diameterZ: 0.14, segments: 14 },
        scene,
      );
      bootToeR.material = bootMat;
      bootToeR.position = new Vector3(0, -0.44, 0.18);
      bootToeR.parent = kneeNodeR;

      // ─── GROUND SHADOW ────────────────────────────────────────────────────

      const shadowDisc = MeshBuilder.CreateDisc(
        'shadow',
        { radius: 0.6, tessellation: 32 },
        scene,
      );
      const shadowMat = new PBRMaterial('shadowMat', scene);
      shadowMat.albedoColor = new Color3(0, 0, 0);
      shadowMat.alpha = 0.22;
      shadowMat.metallic = 0;
      shadowMat.roughness = 1;
      shadowDisc.material = shadowMat;
      shadowDisc.rotation.x = Math.PI / 2;
      shadowDisc.position = new Vector3(0, -0.05, 0);
      shadowDisc.parent = root;

      // ─── GILDED GHOST ORBIT ───────────────────────────────────────────────

      const orbitTorus = MeshBuilder.CreateTorus(
        'orbitTorus',
        { diameter: 3.8, thickness: 0.028, tessellation: 64 },
        scene,
      );
      orbitTorus.material = goldMat;
      orbitTorus.position = new Vector3(0, 1.2, 0);
      orbitTorus.rotation.x = Math.PI / 3.5;

      const orbitTorus2 = MeshBuilder.CreateTorus(
        'orbitTorus2',
        { diameter: 3.2, thickness: 0.020, tessellation: 52 },
        scene,
      );
      orbitTorus2.material = goldMat;
      orbitTorus2.position = new Vector3(0, 1.2, 0);
      orbitTorus2.rotation.x = -Math.PI / 4;
      orbitTorus2.rotation.z = Math.PI / 5;

      // Ghost rim overlay
      const ghostRimSphere = MeshBuilder.CreateSphere(
        'ghostRim',
        { diameter: 1.8, segments: 20 },
        scene,
      );
      ghostRimSphere.material = ghostRimMat;
      ghostRimSphere.position = new Vector3(0, 1.30, 0);
      ghostRimSphere.parent = root;

      // ══════════════════════════════════════════════════════════════════════════
      // ── INTERACTION + ANIMATION ────────────────────────────────────────────
      // ══════════════════════════════════════════════════════════════════════════

      let isDragging = false;
      let pointerX = 0;
      let pointerY = 0;
      let targetRotY = 0;
      let targetRotX = 0;
      let touchPulse = 0;
      let interactUntil = 0;
      type ReactionZone = 'none' | 'head' | 'torso' | 'legs';
      let reactionZone: ReactionZone = 'none';
      let reactionStart = 0;
      const REACT_MS = 2200;

      // Blink state
      let lastBlinkAt = -(9999);
      let blinkScheduledAt = performance.now() + 1800;
      let blinkDuration = 140;
      let blinkDouble = false;
      let blinkGapMs = 75;

      // ── Pointer events ──────────────────────────────────────────────────────
      scene.onPointerObservable.add((pi) => {
        const evt = pi.event as PointerEvent;

        if (pi.type === PointerEventTypes.POINTERDOWN) {
          isDragging = true;
          pointerX = evt.clientX;
          pointerY = evt.clientY;
          touchPulse = 1.0;
          interactUntil = performance.now() + 2800;

          const rect = canvas.getBoundingClientRect();
          const ny = (evt.clientY - rect.top) / rect.height;
          if (ny < 0.30) {
            reactionZone = 'head';
          } else if (ny < 0.62) {
            reactionZone = 'torso';
          } else {
            reactionZone = 'legs';
          }
          reactionStart = performance.now();
        }

        if (pi.type === PointerEventTypes.POINTERUP) {
          isDragging = false;
        }

        if (pi.type === PointerEventTypes.POINTERMOVE) {
          const rect = canvas.getBoundingClientRect();
          const nx = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
          const ny = ((evt.clientY - rect.top) / rect.height) * 2 - 1;
          targetRotY = nx * 0.44;
          targetRotX = -ny * 0.18;

          if (isDragging) {
            const dx = evt.clientX - pointerX;
            const dy = evt.clientY - pointerY;
            targetRotY += dx * 0.0026;
            targetRotX += -dy * 0.0013;
            pointerX = evt.clientX;
            pointerY = evt.clientY;
            interactUntil = performance.now() + 2800;
          }
        }
      });

      // ── Per-frame render loop logic ─────────────────────────────────────────
      scene.onBeforeRenderObservable.add(() => {
        const now = performance.now();
        const t = now * 0.001;
        const active = now < interactUntil;
        const idle = makeIdleCursorTarget(t);

        // Orbit torus rotation
        orbitTorus.rotation.y  = t * 0.38;
        orbitTorus2.rotation.y = -t * 0.26;
        orbitTorus2.rotation.x = -Math.PI / 4 + Math.sin(t * 0.18) * 0.12;

        const desiredY = active ? targetRotY : idle.x;
        const desiredX = active ? targetRotX : idle.y;

        // Root body bob + rotation
        const idleBodyBob = Math.sin(t * 1.1) * 0.045;
        const reactionBob =
          reactionZone !== 'none'
            ? Math.abs(Math.sin(((now - reactionStart) / REACT_MS) * Math.PI * 3)) *
              0.04 *
              Math.max(0, 1 - (now - reactionStart) / REACT_MS)
            : 0;
        root.position.y = idleBodyBob + reactionBob;

        const blend = active ? 0.13 : 0.048;
        const idleBodyY = Math.sin(t * 0.55) * 0.065;
        const idleBodyX = Math.cos(t * 0.8) * 0.015;
        root.rotation.y += (desiredY + idleBodyY - root.rotation.y) * blend;
        root.rotation.x += (desiredX * 0.32 + idleBodyX - root.rotation.x) * blend;

        // Head tracking
        const headAimY = desiredY * 0.62 + Math.sin(t * 0.42) * 0.045;
        const headAimX = desiredX * 0.42 + Math.cos(t * 0.31) * 0.018;
        headNode.rotation.y += (headAimY - headNode.rotation.y) * (active ? 0.17 : 0.062);
        headNode.rotation.x += (headAimX - headNode.rotation.x) * (active ? 0.14 : 0.055);

        // Reaction zone animations
        const reactionElapsed = now - reactionStart;
        const reactionProgress = Math.min(reactionElapsed / REACT_MS, 1);
        const reactionDecay = Math.max(0, 1 - reactionProgress);

        if (reactionZone === 'head') {
          headNode.rotation.z =
            Math.sin(reactionProgress * Math.PI * 12) * 0.32 * reactionDecay;
          shoulderNodeL.rotation.z =
            Math.sin(reactionProgress * Math.PI * 5) * 0.20 * reactionDecay;
          shoulderNodeR.rotation.z =
            -Math.sin(reactionProgress * Math.PI * 5) * 0.20 * reactionDecay;
        } else if (reactionZone === 'torso') {
          shoulderNodeL.rotation.z =
            Math.sin(reactionProgress * Math.PI * 7) * 0.85 * (1 - reactionProgress * 0.35);
          shoulderNodeR.rotation.z =
            -Math.sin(reactionProgress * Math.PI * 7) * 0.85 * (1 - reactionProgress * 0.35);
          elbowNodeL.rotation.z =
            Math.sin(reactionProgress * Math.PI * 7 + 0.6) * 0.55 * reactionDecay;
          elbowNodeR.rotation.z =
            -Math.sin(reactionProgress * Math.PI * 7 + 0.6) * 0.55 * reactionDecay;
        } else if (reactionZone === 'legs') {
          hipNodeL.rotation.x =
            Math.sin(reactionProgress * Math.PI * 8) * 0.50 * reactionDecay;
          hipNodeR.rotation.x =
            -Math.sin(reactionProgress * Math.PI * 8 + Math.PI * 0.5) * 0.50 * reactionDecay;
          kneeNodeL.rotation.x =
            Math.abs(Math.sin(reactionProgress * Math.PI * 8)) * 0.40 * reactionDecay;
          kneeNodeR.rotation.x =
            Math.abs(Math.sin(reactionProgress * Math.PI * 8 + Math.PI * 0.5)) *
            0.40 *
            reactionDecay;
        }

        if (reactionProgress >= 1 && reactionZone !== 'none') {
          reactionZone = 'none';
        }

        // Idle swing
        if (reactionZone === 'none') {
          const idleArmSwing = Math.sin(t * 1.1) * 0.09;
          const idleForearmSwing = Math.sin(t * 1.1 + 0.4) * 0.035;
          shoulderNodeL.rotation.z = lerp(shoulderNodeL.rotation.z, idleArmSwing, 0.04);
          shoulderNodeR.rotation.z = lerp(shoulderNodeR.rotation.z, -idleArmSwing, 0.04);
          elbowNodeL.rotation.z = lerp(elbowNodeL.rotation.z, idleForearmSwing, 0.03);
          elbowNodeR.rotation.z = lerp(elbowNodeR.rotation.z, -idleForearmSwing, 0.03);
          hipNodeL.rotation.x = lerp(
            hipNodeL.rotation.x,
            Math.sin(t * 1.1 + Math.PI) * 0.045,
            0.05,
          );
          hipNodeR.rotation.x = lerp(hipNodeR.rotation.x, Math.sin(t * 1.1) * 0.045, 0.05);
          kneeNodeL.rotation.x = lerp(kneeNodeL.rotation.x, 0, 0.05);
          kneeNodeR.rotation.x = lerp(kneeNodeR.rotation.x, 0, 0.05);
          headNode.rotation.z = lerp(headNode.rotation.z, 0, 0.05);
        }

        // ── Blink scheduling ──
        if (now >= blinkScheduledAt) {
          lastBlinkAt = now;
          blinkDouble = Math.random() < 0.28;
          blinkDuration = 110 + Math.random() * 70;
          blinkGapMs = 55 + Math.random() * 55;
          blinkScheduledAt = now + 2400 + Math.random() * 2600;
        }

        // Blink strength
        let blinkStrength = 0;
        const blinkElapsed = now - lastBlinkAt;
        if (blinkElapsed >= 0 && blinkElapsed <= blinkDuration) {
          blinkStrength = Math.sin((blinkElapsed / blinkDuration) * Math.PI);
        } else if (blinkDouble) {
          const secondBlink = blinkElapsed - (blinkDuration + blinkGapMs);
          if (secondBlink >= 0 && secondBlink <= blinkDuration * 0.85) {
            blinkStrength = Math.max(
              blinkStrength,
              Math.sin((secondBlink / (blinkDuration * 0.85)) * Math.PI),
            );
          }
        }

        // CRT-style visor collapse during blink
        const visorCollapsed = 1 - smoothstep(0.08, 0.9, blinkStrength) * 0.985;
        const visorScaleY = Math.max(visorCollapsed, 0.012);
        visor.scaling.y = visorScaleY;
        screenPlane.scaling.y = visorScaleY;
        infL.scaling.y = visorScaleY;
        infR.scaling.y = visorScaleY;
        eyeDiscL.scaling.y = visorScaleY;
        eyeDiscR.scaling.y = visorScaleY;

        visor.position.y = 0.06 + (1 - visorCollapsed) * 0.010;
        screenPlane.position.y = visor.position.y;
        infL.position.y = 0.08 + (1 - visorCollapsed) * 0.010;
        infR.position.y = infL.position.y;
        eyeDiscL.position.y = infL.position.y;
        eyeDiscR.position.y = infR.position.y;

        // Emissive gating on visor blink
        const emissiveGate = 1 - smoothstep(0.02, 0.72, blinkStrength);
        const reopenFlash = blinkStrength > 0.88 ? 0.50 : 0;
        const emissiveBoost = touchPulse * 0.30 + reopenFlash;

        visorMat.emissiveColor = new Color3(
          (0.08 + emissiveBoost * 0.20) * emissiveGate,
          (0.30 + emissiveBoost * 0.15) * emissiveGate,
          (0.40 + emissiveBoost * 0.10) * emissiveGate,
        );
        screenMat.emissiveColor = new Color3(
          (0.10 + emissiveBoost * 0.20) * emissiveGate,
          (0.55 + emissiveBoost * 0.12) * emissiveGate,
          (0.70 + emissiveBoost * 0.08) * emissiveGate,
        );
        helmetMat.emissiveColor = new Color3(
          (0.01 + emissiveBoost * 0.08) * emissiveGate,
          (0.02 + emissiveBoost * 0.06) * emissiveGate,
          (0.03 + emissiveBoost * 0.05) * emissiveGate,
        );
        eyeGoldMat.emissiveColor = new Color3(
          (1.0 + emissiveBoost * 0.2) * (0.6 + emissiveGate * 0.4),
          (0.72 + emissiveBoost * 0.08) * (0.6 + emissiveGate * 0.4),
          0,
        );
        eyeCyanMat.emissiveColor = new Color3(
          0,
          (0.80 + emissiveBoost * 0.08) * (0.6 + emissiveGate * 0.4),
          (1.0 + emissiveBoost * 0.05) * (0.6 + emissiveGate * 0.4),
        );

        glow.intensity = 0.55 + emissiveGate * 0.30 + touchPulse * 0.45 + reopenFlash * 0.35;
        touchPulse *= 0.91;
      });

      // ── God Tier / Director integration ─────────────────────────────────────
      const gtInitial = godTierRef.current.update({
        device:  defaultDeviceSignals(),
        runtime: defaultRuntimeMetrics(),
        ux:      defaultUXSignals(),
        route:   defaultRouteSignals('/'),
        meshes: [],
        ui: [],
      });
      applyGodTierToBabylon(engine, scene as unknown as BabylonSceneLike, gtInitial, window.devicePixelRatio ?? 1);

      let lastGtMs = 0;
      let lastVisibleIds = new Set<string>(scene.meshes.map((m) => m.id));

      engine.runRenderLoop(() => {
        scene.render();
        const now = performance.now();
        if (now - lastGtMs > 5000) {
          lastGtMs = now;
          const perf = (engine as import('@babylonjs/core').Engine).performanceMonitor;
          const avgFrame = perf ? perf.averageFrameTime : 16.6;

          const gt = godTierRef.current.update({
            device:  defaultDeviceSignals(),
            runtime: { frameMs: avgFrame, avgFrameMs: avgFrame, cpuMs: avgFrame * 0.4, gpuMs: avgFrame * 0.5, droppedFrameRatio: 0, inputLatencyMs: 20, scrollVelocity: 0, pointerVelocity: 0, interactionBurst: 0 },
            ux:      defaultUXSignals(),
            route:   defaultRouteSignals('/'),
            meshes:  scene.meshes.map((m) => ({ id: m.id, visible: m.isVisible, interactive: m.isPickable, nearPointer: false, distanceToCamera: 5, transformDelta: 0, materialChanged: false, screenCoverage: 0.1, semanticWeight: 0.8, motionWeight: 0.6, detailWeight: 0.8, heroWeight: 1.0, occluded: false })),
            ui: [],
          });
          applyGodTierToBabylon(engine, scene as unknown as BabylonSceneLike, gt, window.devicePixelRatio ?? 1);

          const dirObjects = buildSceneObjects(
            scene.meshes as unknown as DirectorBabylonMesh[],
            (m) => ({
              heroWeight:    (m as unknown as Mesh).name?.startsWith('dr-eams') ? 1 : 0,
              semanticWeight: 0.8,
              motionWeight:  (m as unknown as Mesh).animations?.length ? 0.7 : 0,
              screenCoverage: 0.15,
              distance:      5,
              materialCost:  0.5,
            }),
            lastVisibleIds,
          );

          const dirFrame = directorRef.current.update({
            metrics: {
              frameMs: avgFrame, avgFrameMs: avgFrame,
              gpuMs: avgFrame * 0.55, cpuMs: avgFrame * 0.30,
              droppedFrameRatio: avgFrame > 20 ? (avgFrame - 20) / 30 : 0,
              uploadMs: avgFrame * 0.10,
            },
            camera:  defaultCameraSignals('hero'),
            objects: dirObjects,
          });
          applyDirectorFrame(
            engine as unknown as DirectorBabylonEngine,
            scene  as unknown as DirectorBabylonScene,
            dirFrame,
            window.devicePixelRatio ?? 1,
          );

          lastVisibleIds = new Set(scene.meshes.filter((m) => m.isVisible).map((m) => m.id));
        }
      });

      const onResize = () => engine.resize();
      onResizeRef.current = onResize;
      window.addEventListener('resize', onResize);
    }).catch(() => {
      // Engine creation failed — hero stays blank; no crash.
    });

    return () => {
      disposed = true;
      if (onResizeRef.current) window.removeEventListener('resize', onResizeRef.current);
      sceneRef.current?.dispose();
      engineRef.current?.dispose();
      sceneRef.current  = null;
      engineRef.current = null;
      onResizeRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        width,
        height,
        display: 'block',
        touchAction: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-label="Dr. Eams — tap or drag to interact"
      role="img"
    />
  );
}
