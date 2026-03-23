'use client';

import { useEffect, useRef } from 'react';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PointerEventTypes,
  Scene,
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

export default function DrEamsBabylonHero({
  width = 480,
  height = 480,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const godTierRef = useRef(new DreamEngineGodTierSystem());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new ArcRotateCamera(
      'cam',
      -Math.PI / 2,
      Math.PI / 2.15,
      6.2,
      new Vector3(0, 1.1, 0),
      scene,
    );
    camera.lowerRadiusLimit = 5.2;
    camera.upperRadiusLimit = 7.5;
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 0;
    camera.allowUpsideDown = false;
    camera.attachControl(canvas, true);

    // ── Lights ────────────────────────────────────────────────────────────────
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.9;
    hemi.groundColor = new Color3(0.02, 0.04, 0.07);
    hemi.diffuse = new Color3(0.65, 0.88, 1.0);

    const key = new DirectionalLight('key', new Vector3(-0.25, -0.85, 0.5), scene);
    key.position = new Vector3(3, 5, -3);
    key.intensity = 2.1;
    key.diffuse = new Color3(0.72, 0.91, 1.0);

    const fill = new DirectionalLight('fill', new Vector3(0.55, -0.3, -0.4), scene);
    fill.position = new Vector3(-3, 3, 2);
    fill.intensity = 1.05;
    fill.diffuse = new Color3(0.22, 0.72, 1.0);

    const rim = new DirectionalLight('rim', new Vector3(0, -0.2, -1), scene);
    rim.position = new Vector3(0, 2, 4);
    rim.intensity = 0.65;
    rim.diffuse = new Color3(0.1, 0.5, 0.9);

    // ── Glow ──────────────────────────────────────────────────────────────────
    const glow = new GlowLayer('glow', scene, { blurKernelSize: 64 });
    glow.intensity = 0.72;

    // ── Materials ─────────────────────────────────────────────────────────────

    // Lab coat (torso, upper legs) — clean white/off-white
    const coatMat = new PBRMaterial('coat', scene);
    coatMat.albedoColor = new Color3(0.91, 0.93, 0.96);
    coatMat.metallic = 0.0;
    coatMat.roughness = 0.82;
    coatMat.environmentIntensity = 0.7;

    // Helmet & head armour — near-black glossy dome (matches reference)
    const helmetMat = new PBRMaterial('helmet', scene);
    helmetMat.albedoColor = new Color3(0.05, 0.06, 0.08);
    helmetMat.metallic = 0.88;
    helmetMat.roughness = 0.16;
    helmetMat.environmentIntensity = 1.80;
    helmetMat.emissiveColor = new Color3(0.01, 0.04, 0.06);

    // Robot arms / shoulders / boots — brushed silver
    const metalMat = new PBRMaterial('metal', scene);
    metalMat.albedoColor = new Color3(0.70, 0.76, 0.82);
    metalMat.metallic = 0.90;
    metalMat.roughness = 0.20;
    metalMat.environmentIntensity = 1.50;

    // Visor / face screen — dark glass with cyan emissive
    const visorMat = new PBRMaterial('visor', scene);
    visorMat.albedoColor = new Color3(0.01, 0.05, 0.07);
    visorMat.alpha = 0.92;
    visorMat.metallic = 0.0;
    visorMat.roughness = 0.04;
    visorMat.environmentIntensity = 1.8;
    visorMat.emissiveColor = new Color3(0.22, 0.92, 1.0);
    visorMat.clearCoat.isEnabled = true;
    visorMat.clearCoat.intensity = 1.0;
    visorMat.clearCoat.roughness = 0.02;
    visorMat.backFaceCulling = false;

    // Screen inner glow layer
    const screenMat = new PBRMaterial('screen', scene);
    screenMat.albedoColor = new Color3(0.04, 0.35, 0.50);
    screenMat.emissiveColor = new Color3(0.22, 0.92, 1.0);
    screenMat.metallic = 0;
    screenMat.roughness = 1;

    // Boots — matte near-black
    const bootMat = new PBRMaterial('boot', scene);
    bootMat.albedoColor = new Color3(0.10, 0.12, 0.16);
    bootMat.metallic = 0.06;
    bootMat.roughness = 0.70;

    // Cyan accent joints / stripes — emissive
    const accentMat = new PBRMaterial('accent', scene);
    accentMat.albedoColor = new Color3(0.04, 0.28, 0.38);
    accentMat.emissiveColor = new Color3(0.10, 0.70, 0.90);
    accentMat.metallic = 0;
    accentMat.roughness = 0.85;

    // Yellow dot (left eye) — emissive gold
    const dotLMat = new PBRMaterial('dotL', scene);
    dotLMat.albedoColor = new Color3(1.0, 0.88, 0.08);
    dotLMat.emissiveColor = new Color3(1.0, 0.82, 0.0);
    dotLMat.metallic = 0;
    dotLMat.roughness = 1;

    // Cyan dot (right eye) — emissive cyan
    const dotRMat = new PBRMaterial('dotR', scene);
    dotRMat.albedoColor = new Color3(0.10, 0.90, 1.0);
    dotRMat.emissiveColor = new Color3(0.0, 0.88, 1.0);
    dotRMat.metallic = 0;
    dotRMat.roughness = 1;

    // ── Scene graph / robot hierarchy ─────────────────────────────────────────

    const root = new TransformNode('root', scene);
    root.position = new Vector3(0, 0, 0);

    // ----- TORSO -----
    const torso = MeshBuilder.CreateBox(
      'torso',
      { width: 0.72, height: 0.90, depth: 0.44 },
      scene,
    );
    torso.material = coatMat;
    torso.position.y = 1.20;
    torso.parent = root;

    // Coat button strip — thin white vertical line down center
    const buttonStrip = MeshBuilder.CreateBox(
      'buttonStrip',
      { width: 0.03, height: 0.72, depth: 0.46 },
      scene,
    );
    buttonStrip.material = coatMat;
    buttonStrip.position = new Vector3(0, 1.22, 0);
    buttonStrip.parent = root;

    // "Dr. Eams" name badge — small metallic plate on right chest
    const badgePlate = MeshBuilder.CreateBox(
      'badgePlate',
      { width: 0.19, height: 0.07, depth: 0.46 },
      scene,
    );
    badgePlate.material = metalMat;
    badgePlate.position = new Vector3(0.20, 1.34, 0);
    badgePlate.parent = root;

    // Collar / neck ring
    const collar = MeshBuilder.CreateCylinder(
      'collar',
      { height: 0.10, diameterTop: 0.24, diameterBottom: 0.26, tessellation: 16 },
      scene,
    );
    collar.material = metalMat;
    collar.position = new Vector3(0, 1.68, 0);
    collar.parent = root;

    // Neck cylinder
    const neck = MeshBuilder.CreateCylinder(
      'neck',
      { height: 0.20, diameter: 0.18, tessellation: 16 },
      scene,
    );
    neck.material = metalMat;
    neck.position = new Vector3(0, 1.80, 0);
    neck.parent = root;

    // ----- HEAD -----
    const headNode = new TransformNode('headNode', scene);
    headNode.position = new Vector3(0, 2.08, 0);
    headNode.parent = root;

    // Main head — spherical dome (matches reference rounded black dome)
    const head = MeshBuilder.CreateSphere(
      'head',
      { diameter: 0.72, segments: 20 },
      scene,
    );
    head.material = helmetMat;
    head.position.y = 0;
    head.parent = headNode;
    glow.addIncludedOnlyMesh(head as Mesh);

    // Helmet crown band — subtle metallic ring at top of dome
    const helmetTop = MeshBuilder.CreateCylinder(
      'helmetTop',
      { height: 0.06, diameterTop: 0.38, diameterBottom: 0.42, tessellation: 20 },
      scene,
    );
    helmetTop.material = metalMat;
    helmetTop.position.y = 0.30;
    helmetTop.parent = headNode;

    // Helmet chin guard — sits below sphere
    const helmetChin = MeshBuilder.CreateBox(
      'helmetChin',
      { width: 0.34, height: 0.09, depth: 0.38 },
      scene,
    );
    helmetChin.material = helmetMat;
    helmetChin.position = new Vector3(0, -0.34, 0.04);
    helmetChin.parent = headNode;

    // Left ear stud — small disc on side of sphere
    const earL = MeshBuilder.CreateCylinder(
      'earL',
      { height: 0.08, diameter: 0.20, tessellation: 16 },
      scene,
    );
    earL.material = metalMat;
    earL.rotation.z = Math.PI / 2;
    earL.position = new Vector3(-0.37, 0.02, 0);
    earL.parent = headNode;

    // Right ear stud
    const earR = MeshBuilder.CreateCylinder(
      'earR',
      { height: 0.08, diameter: 0.20, tessellation: 16 },
      scene,
    );
    earR.material = metalMat;
    earR.rotation.z = Math.PI / 2;
    earR.position = new Vector3(0.37, 0.02, 0);
    earR.parent = headNode;

    // Ear indicator dots — glowing
    const earDotL = MeshBuilder.CreateSphere(
      'earDotL',
      { diameter: 0.07, segments: 8 },
      scene,
    );
    earDotL.material = accentMat;
    earDotL.position = new Vector3(-0.42, 0.02, 0);
    earDotL.parent = headNode;
    glow.addIncludedOnlyMesh(earDotL as Mesh);

    const earDotR = MeshBuilder.CreateSphere(
      'earDotR',
      { diameter: 0.07, segments: 8 },
      scene,
    );
    earDotR.material = accentMat;
    earDotR.position = new Vector3(0.42, 0.02, 0);
    earDotR.parent = headNode;
    glow.addIncludedOnlyMesh(earDotR as Mesh);

    // Visor face screen (outer glass pane) — positioned at front of dome
    const visor = MeshBuilder.CreateBox(
      'visor',
      { width: 0.46, height: 0.28, depth: 0.06 },
      scene,
    );
    visor.material = visorMat;
    visor.position = new Vector3(0, 0.04, 0.30);
    visor.parent = headNode;
    glow.addIncludedOnlyMesh(visor as Mesh);

    // Screen inner glow surface (sits flush with visor front)
    const screenPlane = MeshBuilder.CreateBox(
      'screen',
      { width: 0.38, height: 0.20, depth: 0.02 },
      scene,
    );
    screenPlane.material = screenMat;
    screenPlane.position = new Vector3(0, 0.04, 0.33);
    screenPlane.parent = headNode;
    glow.addIncludedOnlyMesh(screenPlane as Mesh);

    // ∞ symbol — yellow left lobe (torus ring facing camera)
    const infL = MeshBuilder.CreateTorus(
      'infL',
      { diameter: 0.155, thickness: 0.030, tessellation: 32 },
      scene,
    );
    infL.material = dotLMat;
    infL.rotation.x = Math.PI / 2; // rotate torus normal from Y → Z so ring faces camera
    infL.position = new Vector3(-0.077, 0.04, 0.35);
    infL.parent = headNode;
    glow.addIncludedOnlyMesh(infL as Mesh);

    // ∞ symbol — cyan right lobe
    const infR = MeshBuilder.CreateTorus(
      'infR',
      { diameter: 0.155, thickness: 0.030, tessellation: 32 },
      scene,
    );
    infR.material = dotRMat;
    infR.rotation.x = Math.PI / 2;
    infR.position = new Vector3(0.077, 0.04, 0.35);
    infR.parent = headNode;
    glow.addIncludedOnlyMesh(infR as Mesh);

    // Top antenna (small cylinder + dot)
    const antenna = MeshBuilder.CreateCylinder(
      'antenna',
      { height: 0.22, diameter: 0.03, tessellation: 8 },
      scene,
    );
    antenna.material = metalMat;
    antenna.position = new Vector3(0.18, 0.54, 0);
    antenna.parent = headNode;

    const antennaTip = MeshBuilder.CreateSphere(
      'antennaTip',
      { diameter: 0.06, segments: 8 },
      scene,
    );
    antennaTip.material = accentMat;
    antennaTip.position = new Vector3(0.18, 0.67, 0);
    antennaTip.parent = headNode;
    glow.addIncludedOnlyMesh(antennaTip as Mesh);

    // ----- SHOULDERS -----
    const shoulderNodeL = new TransformNode('shoulderL', scene);
    shoulderNodeL.position = new Vector3(-0.44, 1.57, 0);
    shoulderNodeL.parent = root;

    const shoulderNodeR = new TransformNode('shoulderR', scene);
    shoulderNodeR.position = new Vector3(0.44, 1.57, 0);
    shoulderNodeR.parent = root;

    // Shoulder plates
    const shPlateL = MeshBuilder.CreateSphere(
      'shPlateL',
      { diameterX: 0.24, diameterY: 0.22, diameterZ: 0.24, segments: 12 },
      scene,
    );
    shPlateL.material = metalMat;
    shPlateL.position.copyFrom(Vector3.Zero());
    shPlateL.parent = shoulderNodeL;

    const shPlateR = MeshBuilder.CreateSphere(
      'shPlateR',
      { diameterX: 0.24, diameterY: 0.22, diameterZ: 0.24, segments: 12 },
      scene,
    );
    shPlateR.material = metalMat;
    shPlateR.position.copyFrom(Vector3.Zero());
    shPlateR.parent = shoulderNodeR;

    // ----- UPPER ARMS -----
    const upperArmL = MeshBuilder.CreateCylinder(
      'upperArmL',
      { height: 0.44, diameter: 0.15, tessellation: 16 },
      scene,
    );
    upperArmL.material = metalMat;
    upperArmL.position.y = -0.22;
    upperArmL.parent = shoulderNodeL;

    const upperArmR = MeshBuilder.CreateCylinder(
      'upperArmR',
      { height: 0.44, diameter: 0.15, tessellation: 16 },
      scene,
    );
    upperArmR.material = metalMat;
    upperArmR.position.y = -0.22;
    upperArmR.parent = shoulderNodeR;

    // ----- ELBOW PIVOT NODES -----
    const elbowNodeL = new TransformNode('elbowL', scene);
    elbowNodeL.position = new Vector3(0, -0.44, 0);
    elbowNodeL.parent = shoulderNodeL;

    const elbowNodeR = new TransformNode('elbowR', scene);
    elbowNodeR.position = new Vector3(0, -0.44, 0);
    elbowNodeR.parent = shoulderNodeR;

    // Elbow joint spheres
    const elbowJL = MeshBuilder.CreateSphere(
      'elbowJL',
      { diameter: 0.13, segments: 8 },
      scene,
    );
    elbowJL.material = accentMat;
    elbowJL.position.copyFrom(Vector3.Zero());
    elbowJL.parent = elbowNodeL;
    glow.addIncludedOnlyMesh(elbowJL as Mesh);

    const elbowJR = MeshBuilder.CreateSphere(
      'elbowJR',
      { diameter: 0.13, segments: 8 },
      scene,
    );
    elbowJR.material = accentMat;
    elbowJR.position.copyFrom(Vector3.Zero());
    elbowJR.parent = elbowNodeR;
    glow.addIncludedOnlyMesh(elbowJR as Mesh);

    // ----- FOREARMS -----
    const forearmL = MeshBuilder.CreateCylinder(
      'forearmL',
      { height: 0.40, diameter: 0.12, tessellation: 16 },
      scene,
    );
    forearmL.material = metalMat;
    forearmL.position.y = -0.20;
    forearmL.parent = elbowNodeL;

    const forearmR = MeshBuilder.CreateCylinder(
      'forearmR',
      { height: 0.40, diameter: 0.12, tessellation: 16 },
      scene,
    );
    forearmR.material = metalMat;
    forearmR.position.y = -0.20;
    forearmR.parent = elbowNodeR;

    // Wrist accent bands
    const wristBandL = MeshBuilder.CreateCylinder(
      'wristBandL',
      { height: 0.05, diameter: 0.145, tessellation: 16 },
      scene,
    );
    wristBandL.material = accentMat;
    wristBandL.position.y = -0.39;
    wristBandL.parent = elbowNodeL;
    glow.addIncludedOnlyMesh(wristBandL as Mesh);

    const wristBandR = MeshBuilder.CreateCylinder(
      'wristBandR',
      { height: 0.05, diameter: 0.145, tessellation: 16 },
      scene,
    );
    wristBandR.material = accentMat;
    wristBandR.position.y = -0.39;
    wristBandR.parent = elbowNodeR;
    glow.addIncludedOnlyMesh(wristBandR as Mesh);

    // ----- HANDS -----
    const handL = MeshBuilder.CreateSphere(
      'handL',
      { diameter: 0.17, segments: 10 },
      scene,
    );
    handL.material = metalMat;
    handL.position.y = -0.44;
    handL.parent = elbowNodeL;

    const handR = MeshBuilder.CreateSphere(
      'handR',
      { diameter: 0.17, segments: 10 },
      scene,
    );
    handR.material = metalMat;
    handR.position.y = -0.44;
    handR.parent = elbowNodeR;

    // ----- HIP BAND -----
    const hipBand = MeshBuilder.CreateBox(
      'hipBand',
      { width: 0.76, height: 0.09, depth: 0.44 },
      scene,
    );
    hipBand.material = metalMat;
    hipBand.position.y = 0.77;
    hipBand.parent = root;

    // ----- HIP PIVOT NODES -----
    const hipNodeL = new TransformNode('hipL', scene);
    hipNodeL.position = new Vector3(-0.20, 0.76, 0);
    hipNodeL.parent = root;

    const hipNodeR = new TransformNode('hipR', scene);
    hipNodeR.position = new Vector3(0.20, 0.76, 0);
    hipNodeR.parent = root;

    // ----- UPPER LEGS -----
    const upperLegL = MeshBuilder.CreateCylinder(
      'upperLegL',
      { height: 0.48, diameter: 0.20, tessellation: 16 },
      scene,
    );
    upperLegL.material = coatMat;
    upperLegL.position.y = -0.24;
    upperLegL.parent = hipNodeL;

    const upperLegR = MeshBuilder.CreateCylinder(
      'upperLegR',
      { height: 0.48, diameter: 0.20, tessellation: 16 },
      scene,
    );
    upperLegR.material = coatMat;
    upperLegR.position.y = -0.24;
    upperLegR.parent = hipNodeR;

    // ----- KNEE PIVOT NODES -----
    const kneeNodeL = new TransformNode('kneeL', scene);
    kneeNodeL.position = new Vector3(0, -0.48, 0);
    kneeNodeL.parent = hipNodeL;

    const kneeNodeR = new TransformNode('kneeR', scene);
    kneeNodeR.position = new Vector3(0, -0.48, 0);
    kneeNodeR.parent = hipNodeR;

    // Knee joint spheres
    const kneeJL = MeshBuilder.CreateSphere(
      'kneeJL',
      { diameter: 0.16, segments: 10 },
      scene,
    );
    kneeJL.material = metalMat;
    kneeJL.position.copyFrom(Vector3.Zero());
    kneeJL.parent = kneeNodeL;

    const kneeJR = MeshBuilder.CreateSphere(
      'kneeJR',
      { diameter: 0.16, segments: 10 },
      scene,
    );
    kneeJR.material = metalMat;
    kneeJR.position.copyFrom(Vector3.Zero());
    kneeJR.parent = kneeNodeR;

    // ----- LOWER LEGS -----
    const lowerLegL = MeshBuilder.CreateCylinder(
      'lowerLegL',
      { height: 0.42, diameter: 0.14, tessellation: 16 },
      scene,
    );
    lowerLegL.material = metalMat;
    lowerLegL.position.y = -0.21;
    lowerLegL.parent = kneeNodeL;

    const lowerLegR = MeshBuilder.CreateCylinder(
      'lowerLegR',
      { height: 0.42, diameter: 0.14, tessellation: 16 },
      scene,
    );
    lowerLegR.material = metalMat;
    lowerLegR.position.y = -0.21;
    lowerLegR.parent = kneeNodeR;

    // ----- BOOTS -----
    const bootL = MeshBuilder.CreateBox(
      'bootL',
      { width: 0.24, height: 0.20, depth: 0.40 },
      scene,
    );
    bootL.material = bootMat;
    bootL.position = new Vector3(0, -0.48, 0.05);
    bootL.parent = kneeNodeL;

    const bootR = MeshBuilder.CreateBox(
      'bootR',
      { width: 0.24, height: 0.20, depth: 0.40 },
      scene,
    );
    bootR.material = bootMat;
    bootR.position = new Vector3(0, -0.48, 0.05);
    bootR.parent = kneeNodeR;

    // Boot accent stripe — emissive rim
    const bootStripeL = MeshBuilder.CreateBox(
      'bootStripeL',
      { width: 0.25, height: 0.04, depth: 0.41 },
      scene,
    );
    bootStripeL.material = accentMat;
    bootStripeL.position = new Vector3(0, -0.40, 0.05);
    bootStripeL.parent = kneeNodeL;
    glow.addIncludedOnlyMesh(bootStripeL as Mesh);

    const bootStripeR = MeshBuilder.CreateBox(
      'bootStripeR',
      { width: 0.25, height: 0.04, depth: 0.41 },
      scene,
    );
    bootStripeR.material = accentMat;
    bootStripeR.position = new Vector3(0, -0.40, 0.05);
    bootStripeR.parent = kneeNodeR;
    glow.addIncludedOnlyMesh(bootStripeR as Mesh);

    // ----- GROUND SHADOW DISC -----
    const shadowDisc = MeshBuilder.CreateDisc(
      'shadow',
      { radius: 0.5, tessellation: 32 },
      scene,
    );
    const shadowMat = new PBRMaterial('shadowMat', scene);
    shadowMat.albedoColor = new Color3(0, 0, 0);
    shadowMat.alpha = 0.18;
    shadowMat.metallic = 0;
    shadowMat.roughness = 1;
    shadowDisc.material = shadowMat;
    shadowDisc.rotation.x = Math.PI / 2;
    shadowDisc.position = new Vector3(0, 0.02, 0);
    shadowDisc.parent = root;

    // ── Interaction state ──────────────────────────────────────────────────────
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

    // Blink state — TV-style
    let lastBlinkAt = -(9999);
    let blinkScheduledAt = performance.now() + 1800;
    let blinkDuration = 140;
    let blinkDouble = false;
    let blinkGapMs = 75;

    // ── Pointer events ─────────────────────────────────────────────────────────
    scene.onPointerObservable.add((pi) => {
      const evt = pi.event as PointerEvent;

      if (pi.type === PointerEventTypes.POINTERDOWN) {
        isDragging = true;
        pointerX = evt.clientX;
        pointerY = evt.clientY;
        touchPulse = 1.0;
        interactUntil = performance.now() + 2800;

        // Determine hit zone from normalised canvas Y position
        const rect = canvas.getBoundingClientRect();
        const ny = (evt.clientY - rect.top) / rect.height;
        if (ny < 0.26) {
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
          // Drag speeds tuned for a natural, weighty feel
          targetRotY += dx * 0.0026;
          targetRotX += -dy * 0.0013;
          pointerX = evt.clientX;
          pointerY = evt.clientY;
          interactUntil = performance.now() + 2800;
        }
      }
    });

    // ── Per-frame logic ────────────────────────────────────────────────────────
    scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      const t = now * 0.001;
      const active = now < interactUntil;
      const idle = makeIdleCursorTarget(t);

      const desiredY = active ? targetRotY : idle.x;
      const desiredX = active ? targetRotX : idle.y;

      // ── Root body bob + rotation ──
      const idleBodyBob = Math.sin(t * 1.1) * 0.055;
      const reactionBob =
        reactionZone !== 'none'
          ? Math.abs(Math.sin(((now - reactionStart) / REACT_MS) * Math.PI * 3)) *
            0.05 *
            Math.max(0, 1 - (now - reactionStart) / REACT_MS)
          : 0;
      root.position.y = idleBodyBob + reactionBob;

      const blend = active ? 0.13 : 0.048;
      const idleBodyY = Math.sin(t * 0.55) * 0.075;
      const idleBodyX = Math.cos(t * 0.8) * 0.018;
      root.rotation.y += (desiredY + idleBodyY - root.rotation.y) * blend;
      root.rotation.x += (desiredX * 0.32 + idleBodyX - root.rotation.x) * blend;

      // ── Head tracking (independent of body) ──
      const headAimY = desiredY * 0.62 + Math.sin(t * 0.42) * 0.055;
      const headAimX = desiredX * 0.42 + Math.cos(t * 0.31) * 0.022;
      headNode.rotation.y += (headAimY - headNode.rotation.y) * (active ? 0.17 : 0.062);
      headNode.rotation.x += (headAimX - headNode.rotation.x) * (active ? 0.14 : 0.055);

      // ── Reaction zone animations ──
      const reactionElapsed = now - reactionStart;
      const reactionProgress = Math.min(reactionElapsed / REACT_MS, 1);
      const reactionDecay = Math.max(0, 1 - reactionProgress);

      if (reactionZone === 'head') {
        headNode.rotation.z =
          Math.sin(reactionProgress * Math.PI * 12) * 0.38 * reactionDecay;
        // Shoulders bounce in sympathy
        shoulderNodeL.rotation.z =
          Math.sin(reactionProgress * Math.PI * 5) * 0.22 * reactionDecay;
        shoulderNodeR.rotation.z =
          -Math.sin(reactionProgress * Math.PI * 5) * 0.22 * reactionDecay;
      } else if (reactionZone === 'torso') {
        // Wide arm wave
        shoulderNodeL.rotation.z =
          Math.sin(reactionProgress * Math.PI * 7) * 0.95 * (1 - reactionProgress * 0.35);
        shoulderNodeR.rotation.z =
          -Math.sin(reactionProgress * Math.PI * 7) * 0.95 * (1 - reactionProgress * 0.35);
        elbowNodeL.rotation.z =
          Math.sin(reactionProgress * Math.PI * 7 + 0.6) * 0.65 * reactionDecay;
        elbowNodeR.rotation.z =
          -Math.sin(reactionProgress * Math.PI * 7 + 0.6) * 0.65 * reactionDecay;
      } else if (reactionZone === 'legs') {
        // Alternating leg kick
        hipNodeL.rotation.x =
          Math.sin(reactionProgress * Math.PI * 8) * 0.58 * reactionDecay;
        hipNodeR.rotation.x =
          -Math.sin(reactionProgress * Math.PI * 8 + Math.PI * 0.5) * 0.58 * reactionDecay;
        kneeNodeL.rotation.x =
          Math.abs(Math.sin(reactionProgress * Math.PI * 8)) * 0.45 * reactionDecay;
        kneeNodeR.rotation.x =
          Math.abs(Math.sin(reactionProgress * Math.PI * 8 + Math.PI * 0.5)) *
          0.45 *
          reactionDecay;
      }

      // Reset zone after animation finishes, blend back smoothly
      if (reactionProgress >= 1 && reactionZone !== 'none') {
        reactionZone = 'none';
      }

      // ── Idle swing (blended in when no reaction is active) ──
      if (reactionZone === 'none') {
        const idleArmSwing = Math.sin(t * 1.1) * 0.11;
        const idleForearmSwing = Math.sin(t * 1.1 + 0.4) * 0.04;
        shoulderNodeL.rotation.z = lerp(shoulderNodeL.rotation.z, idleArmSwing, 0.04);
        shoulderNodeR.rotation.z = lerp(shoulderNodeR.rotation.z, -idleArmSwing, 0.04);
        elbowNodeL.rotation.z = lerp(elbowNodeL.rotation.z, idleForearmSwing, 0.03);
        elbowNodeR.rotation.z = lerp(elbowNodeR.rotation.z, -idleForearmSwing, 0.03);
        hipNodeL.rotation.x = lerp(
          hipNodeL.rotation.x,
          Math.sin(t * 1.1 + Math.PI) * 0.055,
          0.05,
        );
        hipNodeR.rotation.x = lerp(hipNodeR.rotation.x, Math.sin(t * 1.1) * 0.055, 0.05);
        kneeNodeL.rotation.x = lerp(kneeNodeL.rotation.x, 0, 0.05);
        kneeNodeR.rotation.x = lerp(kneeNodeR.rotation.x, 0, 0.05);
        headNode.rotation.z = lerp(headNode.rotation.z, 0, 0.05);
      }

      // Antenna tip bob
      antennaTip.position.y = 0.67 + Math.sin(t * 2.2) * 0.018;

      // ── Blink scheduling ──
      if (now >= blinkScheduledAt) {
        lastBlinkAt = now;
        blinkDouble = Math.random() < 0.28;
        blinkDuration = 110 + Math.random() * 70;
        blinkGapMs = 55 + Math.random() * 55;
        blinkScheduledAt = now + 2400 + Math.random() * 2600;
      }

      // ── Blink strength calculation ──
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
      // Shift slightly toward center (CRT scanline shutoff effect)
      visor.position.y = 0.04 + (1 - visorCollapsed) * 0.012;
      screenPlane.position.y = visor.position.y;
      infL.position.y = visor.position.y;
      infR.position.y = visor.position.y;

      // ── Emissive gating on visor blink ──
      const emissiveGate = 1 - smoothstep(0.02, 0.72, blinkStrength);
      // Flash on re-open (adds realism)
      const reopenFlash = blinkStrength > 0.88 ? 0.50 : 0;
      const emissiveBoost = touchPulse * 0.30 + reopenFlash;

      visorMat.emissiveColor = new Color3(
        (0.22 + emissiveBoost * 0.28) * emissiveGate,
        (0.92 + emissiveBoost * 0.10) * emissiveGate,
        (1.00 + emissiveBoost * 0.04) * emissiveGate,
      );
      screenMat.emissiveColor = new Color3(
        (0.22 + emissiveBoost * 0.28) * emissiveGate,
        (0.92 + emissiveBoost * 0.10) * emissiveGate,
        (1.00 + emissiveBoost * 0.04) * emissiveGate,
      );
      helmetMat.emissiveColor = new Color3(
        (0.04 + emissiveBoost * 0.14) * emissiveGate,
        (0.18 + emissiveBoost * 0.09) * emissiveGate,
        (0.28 + emissiveBoost * 0.07) * emissiveGate,
      );
      accentMat.emissiveColor = new Color3(
        (0.10 + emissiveBoost * 0.10) * (0.68 + emissiveGate * 0.32),
        (0.70 + emissiveBoost * 0.12) * (0.68 + emissiveGate * 0.32),
        (0.90 + emissiveBoost * 0.05) * (0.68 + emissiveGate * 0.32),
      );
      dotLMat.emissiveColor = new Color3(
        (1.0 + emissiveBoost * 0.2) * (0.6 + emissiveGate * 0.4),
        (0.82 + emissiveBoost * 0.08) * (0.6 + emissiveGate * 0.4),
        0,
      );
      dotRMat.emissiveColor = new Color3(
        0,
        (0.88 + emissiveBoost * 0.08) * (0.6 + emissiveGate * 0.4),
        (1.0 + emissiveBoost * 0.05) * (0.6 + emissiveGate * 0.4),
      );

      glow.intensity = 0.50 + emissiveGate * 0.28 + touchPulse * 0.52 + reopenFlash * 0.38;
      touchPulse *= 0.91;
    });

    // Apply God Tier engine settings at scene start
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
    engine.runRenderLoop(() => {
      scene.render();
      const now = performance.now();
      if (now - lastGtMs > 1000) {
        lastGtMs = now;
        const perf = engine.performanceMonitor;
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
      }
    });

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // HTML attributes set the drawing-buffer pixel size; CSS styles set the display size.
      // Both must match so Babylon.js renders at full resolution without stretching.
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
