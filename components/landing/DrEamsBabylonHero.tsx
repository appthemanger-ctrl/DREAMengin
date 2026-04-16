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
      hemi.intensity = 1.08;
      hemi.groundColor = new Color3(0.04, 0.05, 0.09);
      hemi.diffuse = new Color3(0.74, 0.92, 1.0);

      const key = new DirectionalLight('key', new Vector3(-0.3, -0.8, 0.5), scene);
      key.position = new Vector3(3, 6, -4);
      key.intensity = 2.7;
      key.diffuse = new Color3(0.92, 0.96, 1.0);

      const fill = new DirectionalLight('fill', new Vector3(0.6, -0.25, -0.5), scene);
      fill.position = new Vector3(-4, 3, 2);
      fill.intensity = 1.45;
      fill.diffuse = new Color3(0.44, 0.80, 1.0);

      const rim = new DirectionalLight('rim', new Vector3(0, -0.15, -1), scene);
      rim.position = new Vector3(0, 3, 5);
      rim.intensity = 1.05;
      rim.diffuse = new Color3(0.28, 0.70, 1.0);

      // ── Glow ────────────────────────────────────────────────────────────────
      const glow = new GlowLayer('glow', scene, { blurKernelSize: 24 });
      glow.intensity = 0.72;

      // ── Environment (IBL) ───────────────────────────────────────────────────
      scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(
        'https://assets.babylonjs.com/environments/Studio.env',
        scene,
      );
      scene.environmentIntensity = 1.55;

      // ══════════════════════════════════════════════════════════════════════════
      // ── MATERIALS — Spec-accurate PBR for Dr. Eams 111-line robot ────────────
      // Scale reference: 1cm ≈ 0.022 Babylon units; apex = 121cm = 2.66u from sole
      // ══════════════════════════════════════════════════════════════════════════

      // [105-111] HELMET: Charcoal-grey metallic sphere — matte with metallic flake
      const helmetMat = new PBRMaterial('helmet', scene);
      helmetMat.albedoColor = new Color3(0.22, 0.23, 0.27);
      helmetMat.metallic = 0.70;
      helmetMat.roughness = 0.30;
      helmetMat.environmentIntensity = 2.05;
      helmetMat.clearCoat.isEnabled = true;
      helmetMat.clearCoat.intensity = 0.88;
      helmetMat.clearCoat.roughness = 0.04;
      helmetMat.emissiveColor = new Color3(0.010, 0.010, 0.014);

      // Dark glossy mechanical metal — arms, legs, mechanical body
      const darkMetalMat = new PBRMaterial('darkMetal', scene);
      darkMetalMat.albedoColor = new Color3(0.10, 0.12, 0.16);
      darkMetalMat.metallic = 0.80;
      darkMetalMat.roughness = 0.20;
      darkMetalMat.environmentIntensity = 2.10;
      darkMetalMat.clearCoat.isEnabled = true;
      darkMetalMat.clearCoat.intensity = 0.62;
      darkMetalMat.clearCoat.roughness = 0.10;

      // Joint / segment accent — slightly lighter for seams and rings
      const jointMat = new PBRMaterial('joint', scene);
      jointMat.albedoColor = new Color3(0.19, 0.21, 0.27);
      jointMat.metallic = 0.82;
      jointMat.roughness = 0.30;
      jointMat.environmentIntensity = 1.60;

      // [023-074] COAT: Clean medical white with soft fabric PBR
      const coatMat = new PBRMaterial('coat', scene);
      coatMat.albedoColor = new Color3(0.95, 0.97, 1.00);
      coatMat.metallic = 0.04;
      coatMat.roughness = 0.24;
      coatMat.environmentIntensity = 1.18;
      coatMat.clearCoat.isEnabled = true;
      coatMat.clearCoat.intensity = 0.52;
      coatMat.clearCoat.roughness = 0.18;
      coatMat.emissiveColor = new Color3(0.007, 0.011, 0.017);

      // Blue undershirt visible at collar V-neck
      const shirtMat = new PBRMaterial('shirt', scene);
      shirtMat.albedoColor = new Color3(0.13, 0.28, 0.58);
      shirtMat.metallic = 0.0;
      shirtMat.roughness = 0.42;
      shirtMat.environmentIntensity = 0.58;

      // [084-104] VISOR: Dark purple/black tinted curved glass
      const visorMat = new PBRMaterial('visor', scene);
      visorMat.albedoColor = new Color3(0.03, 0.04, 0.09);
      visorMat.alpha = 0.84;
      visorMat.metallic = 0.0;
      visorMat.roughness = 0.01;
      visorMat.environmentIntensity = 2.85;
      visorMat.emissiveColor = new Color3(0.10, 0.28, 0.44);
      visorMat.clearCoat.isEnabled = true;
      visorMat.clearCoat.intensity = 1.0;
      visorMat.clearCoat.roughness = 0.01;
      visorMat.backFaceCulling = false;

      // [092-093] VISOR: Internal OLED/LED active display plane
      const screenMat = new PBRMaterial('screen', scene);
      screenMat.albedoColor = new Color3(0.02, 0.12, 0.24);
      screenMat.emissiveColor = new Color3(0.08, 0.52, 0.74);
      screenMat.metallic = 0;
      screenMat.roughness = 1;

      // [095] LEFT eye — orange lemniscate loop (per spec)
      const eyeGoldMat = new PBRMaterial('eyeGold', scene);
      eyeGoldMat.albedoColor = new Color3(1.0, 0.48, 0.0);
      eyeGoldMat.emissiveColor = new Color3(1.0, 0.48, 0.0);
      eyeGoldMat.metallic = 0;
      eyeGoldMat.roughness = 1;

      // [095] RIGHT eye — blue lemniscate loop (per spec)
      const eyeCyanMat = new PBRMaterial('eyeCyan', scene);
      eyeCyanMat.albedoColor = new Color3(0.05, 0.44, 1.0);
      eyeCyanMat.emissiveColor = new Color3(0.0, 0.44, 1.0);
      eyeCyanMat.metallic = 0;
      eyeCyanMat.roughness = 1;

      // [004-010] BOOT: Matte charcoal-grey composite — per spec "matte finish"
      const bootMat = new PBRMaterial('boot', scene);
      bootMat.albedoColor = new Color3(0.20, 0.21, 0.24);
      bootMat.metallic = 0.06;
      bootMat.roughness = 0.76;
      bootMat.environmentIntensity = 0.85;

      // [001-003] SOLE: Matte black high-friction rubber polymer
      const soleMat = new PBRMaterial('sole', scene);
      soleMat.albedoColor = new Color3(0.04, 0.04, 0.05);
      soleMat.metallic = 0.0;
      soleMat.roughness = 0.94;
      soleMat.environmentIntensity = 0.38;

      // [067-069] BADGE: Silver metallic name-tag plate
      const badgeMat = new PBRMaterial('badge', scene);
      badgeMat.albedoColor = new Color3(0.82, 0.84, 0.90);
      badgeMat.metallic = 0.94;
      badgeMat.roughness = 0.12;
      badgeMat.environmentIntensity = 1.52;

      // Chest halo / arc reactor emblem
      const emblemMat = new PBRMaterial('emblem', scene);
      emblemMat.albedoColor = new Color3(0.15, 0.38, 0.56);
      emblemMat.metallic = 0.44;
      emblemMat.roughness = 0.22;

      // Gold orbit rings
      const goldMat = new PBRMaterial('gold', scene);
      goldMat.albedoColor = new Color3(0.88, 0.72, 0.24);
      goldMat.metallic = 1.0;
      goldMat.roughness = 0.18;
      goldMat.environmentIntensity = 1.85;
      goldMat.emissiveColor = new Color3(0.22, 0.16, 0.03);

      // [078-079] NECK: Dark blue high-density polymer strut
      const neckMat = new PBRMaterial('neck', scene);
      neckMat.albedoColor = new Color3(0.04, 0.08, 0.34);
      neckMat.metallic = 0.44;
      neckMat.roughness = 0.28;
      neckMat.environmentIntensity = 1.24;
      neckMat.clearCoat.isEnabled = true;
      neckMat.clearCoat.intensity = 0.72;
      neckMat.clearCoat.roughness = 0.09;

      // Fresnel ghost rim overlay
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
      // ── ROBOT HIERARCHY — Dr. Eams 111-line spec reconstruction ──────────────
      // ══════════════════════════════════════════════════════════════════════════

      const root = new TransformNode('root', scene);
      root.position = new Vector3(0, 0, 0);

      // ── Pivot nodes (kept at established positions to preserve all animation) ─

      const hipNodeL = new TransformNode('hipL', scene);
      hipNodeL.position = new Vector3(-0.148, 0.660, 0);
      hipNodeL.parent = root;

      const hipNodeR = new TransformNode('hipR', scene);
      hipNodeR.position = new Vector3(0.148, 0.660, 0);
      hipNodeR.parent = root;

      const kneeNodeL = new TransformNode('kneeL', scene);
      kneeNodeL.position = new Vector3(0, -0.400, 0);
      kneeNodeL.parent = hipNodeL;

      const kneeNodeR = new TransformNode('kneeR', scene);
      kneeNodeR.position = new Vector3(0, -0.400, 0);
      kneeNodeR.parent = hipNodeR;

      const shoulderNodeL = new TransformNode('shoulderL', scene);
      shoulderNodeL.position = new Vector3(-0.480, 1.520, 0);
      shoulderNodeL.parent = root;

      const shoulderNodeR = new TransformNode('shoulderR', scene);
      shoulderNodeR.position = new Vector3(0.480, 1.520, 0);
      shoulderNodeR.parent = root;

      const elbowNodeL = new TransformNode('elbowL', scene);
      elbowNodeL.position = new Vector3(0, -0.440, 0);
      elbowNodeL.parent = shoulderNodeL;

      const elbowNodeR = new TransformNode('elbowR', scene);
      elbowNodeR.position = new Vector3(0, -0.440, 0);
      elbowNodeR.parent = shoulderNodeR;

      const headNode = new TransformNode('headNode', scene);
      headNode.position = new Vector3(0, 2.020, 0);
      headNode.parent = root;

      // ══════════════════════════════════════════════════════════════════════════
      // ── [001-022] BOOTS · CUFFS · SHIN · KNEE · THIGH ────────────────────────
      // ══════════════════════════════════════════════════════════════════════════

      function buildLeg(side: 'L' | 'R', kneeNode: TransformNode) {
        // [001] BASE: Dual rectangular rubber contact footprints
        const basePad = MeshBuilder.CreateBox(`basePad${side}`, {
          width: 0.388, height: 0.018, depth: 0.530,
        }, scene);
        basePad.material = soleMat;
        basePad.position = new Vector3(0, -0.562, 0.050);
        basePad.parent = kneeNode;

        // [002] SOLE: Horizontal tread plate — matte black polymer (16.2cm wide)
        const sole = MeshBuilder.CreateBox(`sole${side}`, {
          width: 0.374, height: 0.022, depth: 0.514,
        }, scene);
        sole.material = soleMat;
        sole.position = new Vector3(0, -0.542, 0.050);
        sole.parent = kneeNode;

        // Tread ridge detail — 5 raised ribs along the sole
        for (let tr = 0; tr < 5; tr++) {
          const tread = MeshBuilder.CreateBox(`tread${side}_${tr}`, {
            width: 0.374, height: 0.007, depth: 0.014,
          }, scene);
          tread.material = soleMat;
          tread.position = new Vector3(0, -0.532, -0.175 + tr * 0.095);
          tread.parent = kneeNode;
        }

        // [003] SOLE: Beveled edge — rising transition strip
        const soleBevel = MeshBuilder.CreateCylinder(`soleBevel${side}`, {
          height: 0.028, diameterTop: 0.370, diameterBottom: 0.390,
          tessellation: 22,
        }, scene);
        soleBevel.material = soleMat;
        soleBevel.position = new Vector3(0, -0.524, 0.050);
        soleBevel.parent = kneeNode;

        // [004-008] BOOT: Main chassis block — matte charcoal composite
        const bootMain = MeshBuilder.CreateBox(`bootMain${side}`, {
          width: 0.372, height: 0.182, depth: 0.434,
        }, scene);
        bootMain.material = bootMat;
        bootMain.position = new Vector3(0, -0.416, 0.032);
        bootMain.parent = kneeNode;

        // [004] BOOT: Front toe-cap curvature — hemispherical arc (r≈8.1cm = 0.178u)
        const bootToe = MeshBuilder.CreateSphere(`bootToe${side}`, {
          diameterX: 0.380, diameterY: 0.210, diameterZ: 0.236,
          segments: 22,
        }, scene);
        bootToe.material = bootMat;
        bootToe.position = new Vector3(0, -0.445, 0.255);
        bootToe.parent = kneeNode;

        // [005] BOOT: Toe-box expansion — additional width volume
        const bootToeBox = MeshBuilder.CreateBox(`bootToeBox${side}`, {
          width: 0.360, height: 0.148, depth: 0.100,
        }, scene);
        bootToeBox.material = bootMat;
        bootToeBox.position = new Vector3(0, -0.454, 0.210);
        bootToeBox.parent = kneeNode;

        // [007] BOOT: Mid-foot arch — slight lateral taper
        const bootArch = MeshBuilder.CreateBox(`bootArch${side}`, {
          width: 0.330, height: 0.132, depth: 0.118,
        }, scene);
        bootArch.material = bootMat;
        bootArch.position = new Vector3(0, -0.452, 0.012);
        bootArch.parent = kneeNode;

        // [008] BOOT: Lower shell top face
        const bootTopFace = MeshBuilder.CreateBox(`bootTopFace${side}`, {
          width: 0.364, height: 0.022, depth: 0.412,
        }, scene);
        bootTopFace.material = bootMat;
        bootTopFace.position = new Vector3(0, -0.326, 0.032);
        bootTopFace.parent = kneeNode;

        // [009] BOOT: Flex-conduit entry / ankle-joint shielding
        const ankleShield = MeshBuilder.CreateCylinder(`ankleShield${side}`, {
          height: 0.060, diameterTop: 0.192, diameterBottom: 0.222,
          tessellation: 20,
        }, scene);
        ankleShield.material = bootMat;
        ankleShield.position = new Vector3(0, -0.308, 0);
        ankleShield.parent = kneeNode;

        // [010] BOOT: Heel counter — vertical stabilizer fins (internal geometry)
        for (const hx of [-0.152, 0.152]) {
          const heelFin = MeshBuilder.CreateBox(`heelFin${side}_${hx > 0 ? 'R' : 'L'}`, {
            width: 0.011, height: 0.115, depth: 0.078,
          }, scene);
          heelFin.material = darkMetalMat;
          heelFin.position = new Vector3(hx, -0.392, -0.200);
          heelFin.parent = kneeNode;
        }

        // [011-013] CUFF: Three concentric ribbing rings (d=11.2cm = 0.246u)
        for (let ci = 0; ci < 3; ci++) {
          const cuffRing = MeshBuilder.CreateTorus(`cuff${side}_${ci}`, {
            diameter: 0.246 + ci * 0.014,
            thickness: 0.024,
            tessellation: 30,
          }, scene);
          cuffRing.material = ci === 1 ? jointMat : darkMetalMat;
          cuffRing.position = new Vector3(0, -0.268 + ci * 0.038, 0);
          cuffRing.parent = kneeNode;
        }

        // [014-016] LEG: Primary shin strut — accordion-style conduit (d=9.4cm = 0.207u)
        const shinConduit = MeshBuilder.CreateCylinder(`shinConduit${side}`, {
          height: 0.275, diameter: 0.192, tessellation: 22,
        }, scene);
        shinConduit.material = darkMetalMat;
        shinConduit.position = new Vector3(0, -0.147, 0);
        shinConduit.parent = kneeNode;

        // Accordion ridges — 8 torus ribs for conduit texture
        for (let ri = 0; ri < 8; ri++) {
          const rib = MeshBuilder.CreateTorus(`shinRib${side}_${ri}`, {
            diameter: 0.218, thickness: 0.016, tessellation: 24,
          }, scene);
          rib.material = jointMat;
          rib.position = new Vector3(0, -0.042 - ri * 0.036, 0);
          rib.parent = kneeNode;
        }

        // [015] LEG: Shin front panel — high-tensile mesh look
        const shinPanel = MeshBuilder.CreateBox(`shinPanel${side}`, {
          width: 0.122, height: 0.188, depth: 0.030,
        }, scene);
        shinPanel.material = badgeMat;
        shinPanel.position = new Vector3(0, -0.148, 0.098);
        shinPanel.rotation.x = 0.08;
        shinPanel.parent = kneeNode;

        // [017] KNEE: Internal hinge housing — armored spherical joint
        const kneeJoint = MeshBuilder.CreateSphere(`kneeJ${side}`, {
          diameter: 0.172, segments: 16,
        }, scene);
        kneeJoint.material = jointMat;
        kneeJoint.parent = kneeNode;

        // Knee side armor caps
        for (const kx of [-0.088, 0.088]) {
          const kCap = MeshBuilder.CreateSphere(`kCap${side}_${kx > 0 ? 'R' : 'L'}`, {
            diameterX: 0.078, diameterY: 0.068, diameterZ: 0.076,
            segments: 10,
          }, scene);
          kCap.material = darkMetalMat;
          kCap.position = new Vector3(kx, 0, 0.020);
          kCap.parent = kneeNode;
        }
      }

      buildLeg('L', kneeNodeL);
      buildLeg('R', kneeNodeR);

      // ── [018-020] THIGH ──────────────────────────────────────────────────────

      function buildThigh(side: 'L' | 'R', hipNode: TransformNode) {
        const thigh = MeshBuilder.CreateCylinder(`thigh${side}`, {
          height: 0.338, diameterTop: 0.158, diameterBottom: 0.136,
          tessellation: 22,
        }, scene);
        thigh.material = darkMetalMat;
        thigh.position.y = -0.169;
        thigh.parent = hipNode;

        for (let ti = 0; ti < 2; ti++) {
          const thighRing = MeshBuilder.CreateTorus(`thighRing${side}_${ti}`, {
            diameter: 0.162, thickness: 0.013, tessellation: 20,
          }, scene);
          thighRing.material = jointMat;
          thighRing.position.y = -0.076 - ti * 0.118;
          thighRing.parent = hipNode;
        }

        const hipBall = MeshBuilder.CreateSphere(`hipBall${side}`, {
          diameter: 0.128, segments: 12,
        }, scene);
        hipBall.material = jointMat;
        hipBall.parent = hipNode;
      }

      buildThigh('L', hipNodeL);
      buildThigh('R', hipNodeR);

      // ── Hip band & pelvis ────────────────────────────────────────────────────

      const hipBand = MeshBuilder.CreateCylinder('hipBand', {
        height: 0.122, diameterTop: 0.598, diameterBottom: 0.562,
        tessellation: 28,
      }, scene);
      hipBand.material = darkMetalMat;
      hipBand.position.y = 0.660;
      hipBand.parent = root;

      // ══════════════════════════════════════════════════════════════════════════
      // ── [023-074] COAT: Lab coat — hem · skirt · body · chest · lapels ────────
      // ══════════════════════════════════════════════════════════════════════════

      // [023-025] COAT: Lower hem — conical frustum (d=44.2cm = 0.972u at base)
      const coatHem = MeshBuilder.CreateCylinder('coatHem', {
        height: 0.082, diameterTop: 0.800, diameterBottom: 0.960,
        tessellation: 40,
      }, scene);
      coatHem.material = coatMat;
      coatHem.position.y = 0.748;
      coatHem.parent = root;

      // [024] COAT: Hem stitching torus — reinforced seam
      const hemBand = MeshBuilder.CreateTorus('hemBand', {
        diameter: 0.882, thickness: 0.020, tessellation: 52,
      }, scene);
      hemBand.material = coatMat;
      hemBand.position.y = 0.784;
      hemBand.parent = root;

      // [025-029] COAT: Skirt — conical frustum body
      const coatSkirt = MeshBuilder.CreateCylinder('coatSkirt', {
        height: 0.340, diameterTop: 0.650, diameterBottom: 0.800,
        tessellation: 40,
      }, scene);
      coatSkirt.material = coatMat;
      coatSkirt.position.y = 0.960;
      coatSkirt.parent = root;

      // Body core under skirt
      const bodySkirtCore = MeshBuilder.CreateCylinder('bodySkirtCore', {
        height: 0.340, diameterTop: 0.548, diameterBottom: 0.634,
        tessellation: 30,
      }, scene);
      bodySkirtCore.material = darkMetalMat;
      bodySkirtCore.position.y = 0.960;
      bodySkirtCore.parent = root;

      // [029] Front center opening seam line
      const frontSeam = MeshBuilder.CreateBox('frontSeam', {
        width: 0.010, height: 0.730, depth: 0.006,
      }, scene);
      frontSeam.material = coatMat;
      frontSeam.position = new Vector3(0, 1.108, 0.328);
      frontSeam.parent = root;

      // [030-036] POCKETS: Twin rectangular pockets (w=10.2cm=0.224u, h=12.1cm=0.266u)
      function buildPocket(side: 'L' | 'R') {
        const xs = side === 'L' ? -1 : 1;
        const px = xs * 0.180;

        const pocketFace = MeshBuilder.CreateBox(`pocket${side}`, {
          width: 0.224, height: 0.266, depth: 0.018,
        }, scene);
        pocketFace.material = coatMat;
        pocketFace.position = new Vector3(px, 0.908, 0.315);
        pocketFace.parent = root;

        const pocketSideSeam = MeshBuilder.CreateBox(`pocketSeam${side}`, {
          width: 0.005, height: 0.266, depth: 0.018,
        }, scene);
        pocketSideSeam.material = badgeMat;
        pocketSideSeam.position = new Vector3(px + xs * 0.115, 0.908, 0.316);
        pocketSideSeam.parent = root;

        // [036] Top opening flap
        const flap = MeshBuilder.CreateBox(`pocketFlap${side}`, {
          width: 0.228, height: 0.024, depth: 0.022,
        }, scene);
        flap.material = coatMat;
        flap.position = new Vector3(px, 1.046, 0.322);
        flap.parent = root;

        const flapSeam = MeshBuilder.CreateBox(`flapSeam${side}`, {
          width: 0.222, height: 0.006, depth: 0.005,
        }, scene);
        flapSeam.material = badgeMat;
        flapSeam.position = new Vector3(px, 1.036, 0.329);
        flapSeam.parent = root;
      }

      buildPocket('L');
      buildPocket('R');

      // [037-039] COAT: Waist taper
      const coatWaist = MeshBuilder.CreateCylinder('coatWaist', {
        height: 0.118, diameterTop: 0.745, diameterBottom: 0.650,
        tessellation: 36,
      }, scene);
      coatWaist.material = coatMat;
      coatWaist.position.y = 1.189;
      coatWaist.parent = root;

      // [039-056] COAT: Main body panels — torso
      const coatBody = MeshBuilder.CreateCylinder('coatBody', {
        height: 0.360, diameterTop: 0.810, diameterBottom: 0.745,
        tessellation: 36,
      }, scene);
      coatBody.material = coatMat;
      coatBody.position.y = 1.408;
      coatBody.parent = root;

      const bodyUpper = MeshBuilder.CreateCylinder('bodyUpper', {
        height: 0.360, diameterTop: 0.668, diameterBottom: 0.610,
        tessellation: 30,
      }, scene);
      bodyUpper.material = darkMetalMat;
      bodyUpper.position.y = 1.408;
      bodyUpper.parent = root;

      // [044-046] BUTTON 1: Circular white plastic (d=2.5cm=0.055u)
      const button1 = MeshBuilder.CreateCylinder('button1', {
        height: 0.012, diameter: 0.056, tessellation: 14,
      }, scene);
      button1.material = badgeMat;
      button1.rotation.x = Math.PI / 2;
      button1.position = new Vector3(0, 1.058, 0.334);
      button1.parent = root;

      // [064-066] BUTTON 2: 22cm gap above Button 1 (22cm=0.484u)
      const button2 = MeshBuilder.CreateCylinder('button2', {
        height: 0.012, diameter: 0.056, tessellation: 14,
      }, scene);
      button2.material = badgeMat;
      button2.rotation.x = Math.PI / 2;
      button2.position = new Vector3(0, 1.298, 0.334);
      button2.parent = root;

      // [054-056] COAT: Chest panel — widening to shoulder frame
      const coatChest = MeshBuilder.CreateCylinder('coatChest', {
        height: 0.215, diameterTop: 0.860, diameterBottom: 0.810,
        tessellation: 36,
      }, scene);
      coatChest.material = coatMat;
      coatChest.position.y = 1.545;
      coatChest.parent = root;

      const chestCore2 = MeshBuilder.CreateCylinder('chestCore2', {
        height: 0.215, diameterTop: 0.710, diameterBottom: 0.668,
        tessellation: 30,
      }, scene);
      chestCore2.material = darkMetalMat;
      chestCore2.position.y = 1.545;
      chestCore2.parent = root;

      // [070-072] LAPELS: Diagonal fold shapes
      function buildLapel(side: 'L' | 'R') {
        const xs = side === 'L' ? -1 : 1;
        const lapel = MeshBuilder.CreateBox(`lapel${side}`, {
          width: 0.190, height: 0.265, depth: 0.038,
        }, scene);
        lapel.material = coatMat;
        lapel.rotation.z = xs * 0.220;
        lapel.position = new Vector3(xs * 0.162, 1.598, 0.280);
        lapel.parent = root;

        const lapelFront = MeshBuilder.CreateBox(`lapelFront${side}`, {
          width: 0.175, height: 0.238, depth: 0.016,
        }, scene);
        lapelFront.material = coatMat;
        lapelFront.rotation.z = xs * 0.220;
        lapelFront.position = new Vector3(xs * 0.166, 1.606, 0.298);
        lapelFront.parent = root;
      }

      buildLapel('L');
      buildLapel('R');

      // V-neck undershirt collar
      const vNeck = MeshBuilder.CreateCylinder('vNeck', {
        height: 0.188, diameterTop: 0.274, diameterBottom: 0.186,
        tessellation: 18,
      }, scene);
      vNeck.material = shirtMat;
      vNeck.position = new Vector3(0, 1.618, 0.168);
      vNeck.scaling.z = 0.34;
      vNeck.parent = root;

      // [067-069] NAME TAG: "Dr. Eams" on left breast (8cm×3.2cm = 0.176u×0.070u)
      const badgeBacking = MeshBuilder.CreateBox('badgeBacking', {
        width: 0.214, height: 0.094, depth: 0.010,
      }, scene);
      badgeBacking.material = darkMetalMat;
      badgeBacking.position = new Vector3(0.196, 1.454, 0.336);
      badgeBacking.parent = root;

      const badgePlate = MeshBuilder.CreateBox('badgePlate', {
        width: 0.198, height: 0.078, depth: 0.012,
      }, scene);
      badgePlate.material = badgeMat;
      badgePlate.position = new Vector3(0.196, 1.454, 0.342);
      badgePlate.parent = root;

      const badgePin = MeshBuilder.CreateBox('badgePin', {
        width: 0.036, height: 0.048, depth: 0.016,
      }, scene);
      badgePin.material = darkMetalMat;
      badgePin.position = new Vector3(0.288, 1.492, 0.338);
      badgePin.parent = root;

      // Chest arc-reactor halo (referenced in animation)
      const chestHalo = MeshBuilder.CreateTorus('chestHalo', {
        diameter: 0.196, thickness: 0.015, tessellation: 28,
      }, scene);
      chestHalo.material = eyeCyanMat;
      chestHalo.rotation.x = Math.PI / 2;
      chestHalo.position = new Vector3(0, 1.454, 0.352);
      chestHalo.parent = root;
      glow.addIncludedOnlyMesh(chestHalo as Mesh);

      const chestCore = MeshBuilder.CreateSphere('chestCore', {
        diameter: 0.050, segments: 16,
      }, scene);
      chestCore.material = eyeGoldMat;
      chestCore.position = new Vector3(0, 1.454, 0.358);
      chestCore.parent = root;
      glow.addIncludedOnlyMesh(chestCore as Mesh);

      // ── [073-074] SHOULDERS ──────────────────────────────────────────────────

      function buildShoulder(side: 'L' | 'R', shNode: TransformNode) {
        const xs = side === 'L' ? -1 : 1;

        const shBall = MeshBuilder.CreateSphere(`shBall${side}`, {
          diameter: 0.190, segments: 18,
        }, scene);
        shBall.material = darkMetalMat;
        shBall.parent = shNode;

        const shPlate = MeshBuilder.CreateSphere(`shPlate${side}`, {
          diameterX: 0.272, diameterY: 0.158, diameterZ: 0.244,
          segments: 14,
        }, scene);
        shPlate.material = darkMetalMat;
        shPlate.position = new Vector3(xs * 0.016, 0.034, 0);
        shPlate.parent = shNode;

        // Coat drape over shoulder
        const shCoat = MeshBuilder.CreateSphere(`shCoat${side}`, {
          diameterX: 0.254, diameterY: 0.136, diameterZ: 0.216,
          segments: 12,
        }, scene);
        shCoat.material = coatMat;
        shCoat.position = new Vector3(xs * 0.008, 0.022, 0.018);
        shCoat.parent = shNode;
      }

      buildShoulder('L', shoulderNodeL);
      buildShoulder('R', shoulderNodeR);

      // ── [058-059] UPPER ARM / BICEP ──────────────────────────────────────────

      function buildUpperArm(side: 'L' | 'R', shNode: TransformNode) {
        const upperArm = MeshBuilder.CreateCylinder(`upperArm${side}`, {
          height: 0.355, diameterTop: 0.145, diameterBottom: 0.118,
          tessellation: 20,
        }, scene);
        upperArm.material = darkMetalMat;
        upperArm.position.y = -0.226;
        upperArm.parent = shNode;

        const armRing = MeshBuilder.CreateTorus(`armRing${side}`, {
          diameter: 0.148, thickness: 0.013, tessellation: 18,
        }, scene);
        armRing.material = jointMat;
        armRing.position.y = -0.150;
        armRing.parent = shNode;
      }

      buildUpperArm('L', shoulderNodeL);
      buildUpperArm('R', shoulderNodeR);

      // ── [060-063] SLEEVE: White lab coat sleeve ──────────────────────────────

      function buildSleeve(side: 'L' | 'R', shNode: TransformNode) {
        const sleeve = MeshBuilder.CreateCylinder(`sleeve${side}`, {
          height: 0.332, diameterTop: 0.195, diameterBottom: 0.220,
          tessellation: 22,
        }, scene);
        sleeve.material = coatMat;
        sleeve.position.y = -0.218;
        sleeve.parent = shNode;

        // [060] Sleeve cuff fold (1.2cm = 0.026u)
        const cuff = MeshBuilder.CreateTorus(`sleeveCuff${side}`, {
          diameter: 0.204, thickness: 0.028, tessellation: 22,
        }, scene);
        cuff.material = coatMat;
        cuff.position.y = -0.412;
        cuff.parent = shNode;
      }

      buildSleeve('L', shoulderNodeL);
      buildSleeve('R', shoulderNodeR);

      // ── [057] ELBOW: Armored spherical hinge ────────────────────────────────

      function buildElbow(side: 'L' | 'R', elbowNode: TransformNode) {
        const cap = MeshBuilder.CreateSphere(`elbowCap${side}`, {
          diameter: 0.126, segments: 14,
        }, scene);
        cap.material = jointMat;
        cap.parent = elbowNode;

        const armor = MeshBuilder.CreateSphere(`elbowArmor${side}`, {
          diameterX: 0.148, diameterY: 0.100, diameterZ: 0.126,
          segments: 10,
        }, scene);
        armor.material = darkMetalMat;
        armor.position = new Vector3(0, 0, 0.036);
        armor.parent = elbowNode;
      }

      buildElbow('L', elbowNodeL);
      buildElbow('R', elbowNodeR);

      // ── [051-053] FOREARM: Ribbed black conduit armor ────────────────────────

      function buildForearm(side: 'L' | 'R', elbowNode: TransformNode) {
        // [053] Upper forearm max width 10.4cm = 0.229u
        const forearm = MeshBuilder.CreateCylinder(`forearm${side}`, {
          height: 0.340, diameterTop: 0.126, diameterBottom: 0.104,
          tessellation: 20,
        }, scene);
        forearm.material = darkMetalMat;
        forearm.position.y = -0.212;
        forearm.parent = elbowNode;

        // [051] Ribbed conduit armor — 4 rings
        for (let fi = 0; fi < 4; fi++) {
          const foreRib = MeshBuilder.CreateTorus(`foreRib${side}_${fi}`, {
            diameter: 0.128, thickness: 0.013, tessellation: 18,
          }, scene);
          foreRib.material = jointMat;
          foreRib.position.y = -0.100 - fi * 0.070;
          foreRib.parent = elbowNode;
        }

        // [050] WRIST: Flexible gasket (d=8.2cm = 0.180u)
        const wristGasket = MeshBuilder.CreateTorus(`wristGasket${side}`, {
          diameter: 0.182, thickness: 0.026, tessellation: 22,
        }, scene);
        wristGasket.material = jointMat;
        wristGasket.position.y = -0.412;
        wristGasket.parent = elbowNode;

        const wristBall = MeshBuilder.CreateSphere(`wristBall${side}`, {
          diameter: 0.082, segments: 10,
        }, scene);
        wristBall.material = jointMat;
        wristBall.position.y = -0.426;
        wristBall.parent = elbowNode;
      }

      buildForearm('L', elbowNodeL);
      buildForearm('R', elbowNodeR);

      // ── [047-049] HANDS: Palm + segmented fingers + thumb ────────────────────

      function buildHand(side: 'L' | 'R', elbowNode: TransformNode) {
        // [047] HANDS: Palm base (width=9.1cm = 0.200u)
        const palm = MeshBuilder.CreateBox(`palm${side}`, {
          width: 0.200, height: 0.064, depth: 0.104,
        }, scene);
        palm.material = darkMetalMat;
        palm.position = new Vector3(0, -0.472, 0);
        palm.parent = elbowNode;

        const palmBack = MeshBuilder.CreateBox(`palmBack${side}`, {
          width: 0.188, height: 0.026, depth: 0.096,
        }, scene);
        palmBack.material = darkMetalMat;
        palmBack.position = new Vector3(0, -0.450, -0.020);
        palmBack.parent = elbowNode;

        const knuckle = MeshBuilder.CreateBox(`knuckle${side}`, {
          width: 0.200, height: 0.020, depth: 0.040,
        }, scene);
        knuckle.material = jointMat;
        knuckle.position = new Vector3(0, -0.506, 0.020);
        knuckle.parent = elbowNode;

        // [041-043] FINGERS: 4 fingers — 3-segment cylindrical joints
        const fxPos = [-0.070, -0.023, 0.024, 0.070];
        const fLens = [
          [0.037, 0.032, 0.027],
          [0.040, 0.035, 0.029],
          [0.038, 0.033, 0.027],
          [0.030, 0.025, 0.021],
        ];

        fxPos.forEach((xOff, fi) => {
          let yOff = -0.520;
          fLens[fi].forEach((sLen, si) => {
            const jt = MeshBuilder.CreateSphere(`fJt${side}${fi}_${si}`, {
              diameter: 0.023, segments: 6,
            }, scene);
            jt.material = jointMat;
            jt.position = new Vector3(xOff, yOff, 0.020);
            jt.parent = elbowNode;

            const seg = MeshBuilder.CreateCylinder(`fSeg${side}${fi}_${si}`, {
              height: sLen, diameter: 0.021, tessellation: 8,
            }, scene);
            seg.material = darkMetalMat;
            seg.position = new Vector3(xOff, yOff - sLen * 0.5, 0.020);
            seg.parent = elbowNode;
            yOff -= sLen;
          });

          const tip = MeshBuilder.CreateSphere(`fTip${side}${fi}`, {
            diameter: 0.023, segments: 6,
          }, scene);
          tip.material = darkMetalMat;
          tip.position = new Vector3(xOff, yOff, 0.020);
          tip.parent = elbowNode;
        });

        // [048] HANDS: Thumb — angled outward, 2-segment
        const ts = side === 'L' ? -1 : 1;

        const thumbBase = MeshBuilder.CreateSphere(`thumbBase${side}`, {
          diameter: 0.025, segments: 6,
        }, scene);
        thumbBase.material = jointMat;
        thumbBase.position = new Vector3(ts * 0.104, -0.482, 0.028);
        thumbBase.parent = elbowNode;

        const thumbS1 = MeshBuilder.CreateCylinder(`thumbSeg1${side}`, {
          height: 0.040, diameter: 0.023, tessellation: 8,
        }, scene);
        thumbS1.material = darkMetalMat;
        thumbS1.rotation.z = ts * -0.52;
        thumbS1.position = new Vector3(ts * 0.120, -0.499, 0.028);
        thumbS1.parent = elbowNode;

        const thumbJt = MeshBuilder.CreateSphere(`thumbJt${side}`, {
          diameter: 0.021, segments: 6,
        }, scene);
        thumbJt.material = jointMat;
        thumbJt.position = new Vector3(ts * 0.136, -0.516, 0.028);
        thumbJt.parent = elbowNode;

        const thumbS2 = MeshBuilder.CreateCylinder(`thumbSeg2${side}`, {
          height: 0.034, diameter: 0.021, tessellation: 8,
        }, scene);
        thumbS2.material = darkMetalMat;
        thumbS2.rotation.z = ts * -0.34;
        thumbS2.position = new Vector3(ts * 0.146, -0.530, 0.028);
        thumbS2.parent = elbowNode;

        const thumbTip = MeshBuilder.CreateSphere(`thumbTip${side}`, {
          diameter: 0.019, segments: 6,
        }, scene);
        thumbTip.material = darkMetalMat;
        thumbTip.position = new Vector3(ts * 0.153, -0.543, 0.028);
        thumbTip.parent = elbowNode;
      }

      buildHand('L', elbowNodeL);
      buildHand('R', elbowNodeR);

      // ══════════════════════════════════════════════════════════════════════════
      // ── [075-079] COLLAR + NECK ───────────────────────────────────────────────
      // ══════════════════════════════════════════════════════════════════════════

      // [075] COLLAR: Circular neck-band base
      const collarBase = MeshBuilder.CreateCylinder('collarBase', {
        height: 0.022, diameterTop: 0.352, diameterBottom: 0.388,
        tessellation: 30,
      }, scene);
      collarBase.material = coatMat;
      collarBase.position.y = 1.686;
      collarBase.parent = root;

      // [076] COLLAR: Vertical stiffened wall (h=4.1cm = 0.090u)
      const collarWall = MeshBuilder.CreateCylinder('collarWall', {
        height: 0.090, diameterTop: 0.330, diameterBottom: 0.350,
        tessellation: 30,
      }, scene);
      collarWall.material = coatMat;
      collarWall.position.y = 1.742;
      collarWall.parent = root;

      // [077] COLLAR: Upper rim framing neck joint
      const collarRim = MeshBuilder.CreateTorus('collarRim', {
        diameter: 0.340, thickness: 0.020, tessellation: 30,
      }, scene);
      collarRim.material = coatMat;
      collarRim.position.y = 1.790;
      collarRim.parent = root;

      // [078-079] NECK: Dark blue high-density polymer strut (d=15cm = 0.330u)
      const neckStrut = MeshBuilder.CreateCylinder('neckStrut', {
        height: 0.145, diameterTop: 0.282, diameterBottom: 0.326,
        tessellation: 28,
      }, scene);
      neckStrut.material = neckMat;
      neckStrut.position.y = 1.890;
      neckStrut.parent = root;

      const neckRing = MeshBuilder.CreateTorus('neckRing', {
        diameter: 0.305, thickness: 0.023, tessellation: 26,
      }, scene);
      neckRing.material = jointMat;
      neckRing.position.y = 1.835;
      neckRing.parent = root;

      // ══════════════════════════════════════════════════════════════════════════
      // ── [080-111] HEAD: Charcoal metallic helmet + visor + eyes ──────────────
      // ══════════════════════════════════════════════════════════════════════════

      // [080-082] HELMET: Lower chin curvature — large charcoal-grey metallic sphere
      // [106] Forehead d=41.8cm = 0.920u
      const head = MeshBuilder.CreateSphere('head', {
        diameterX: 0.976, diameterY: 0.884, diameterZ: 0.936,
        segments: 56,
      }, scene);
      head.material = helmetMat;
      head.position.y = 0.076;
      head.parent = headNode;
      glow.addIncludedOnlyMesh(head as Mesh);

      // Chin extension
      const helmetChin = MeshBuilder.CreateSphere('helmetChin', {
        diameterX: 0.755, diameterY: 0.388, diameterZ: 0.714,
        segments: 32,
      }, scene);
      helmetChin.material = helmetMat;
      helmetChin.position = new Vector3(0, -0.208, 0.020);
      helmetChin.parent = headNode;

      // [105] Brow ridge
      const visorBrow = MeshBuilder.CreateBox('visorBrow', {
        width: 0.636, height: 0.072, depth: 0.125,
      }, scene);
      visorBrow.material = helmetMat;
      visorBrow.position = new Vector3(0, 0.275, 0.208);
      visorBrow.rotation.x = -0.068;
      visorBrow.parent = headNode;

      // Jaw panel
      const jawPanel = MeshBuilder.CreateBox('jawPanel', {
        width: 0.456, height: 0.112, depth: 0.112,
      }, scene);
      jawPanel.material = helmetMat;
      jawPanel.position = new Vector3(0, -0.176, 0.246);
      jawPanel.rotation.x = 0.108;
      jawPanel.parent = headNode;

      // [107-111] Head crest / crown piece
      const headCrest = MeshBuilder.CreateBox('headCrest', {
        width: 0.110, height: 0.158, depth: 0.378,
      }, scene);
      headCrest.material = helmetMat;
      headCrest.position = new Vector3(0, 0.442, -0.022);
      headCrest.rotation.x = -0.098;
      headCrest.parent = headNode;

      // [088-091] EAR-PODS: Horizontal cylinder side-mounts (d=7cm=0.154u, protrusion=4.2cm=0.092u)
      function buildEarPod(side: 'L' | 'R') {
        const xs = side === 'L' ? -1 : 1;
        const xPos = xs * 0.494;

        // Main ear-pod cylinder
        const earPod = MeshBuilder.CreateCylinder(`earPod${side}`, {
          height: 0.094, diameter: 0.154, tessellation: 28,
        }, scene);
        earPod.material = helmetMat;
        earPod.rotation.z = Math.PI / 2;
        earPod.position = new Vector3(xPos, 0.036, 0.010);
        earPod.parent = headNode;

        // [089] 3 Concentric ring grooves on ear-pod outer face
        for (let ei = 0; ei < 3; ei++) {
          const groove = MeshBuilder.CreateTorus(`earGroove${side}_${ei}`, {
            diameter: 0.114 - ei * 0.034, thickness: 0.007, tessellation: 24,
          }, scene);
          groove.material = jointMat;
          groove.rotation.z = Math.PI / 2;
          groove.position = new Vector3(xPos + xs * 0.050, 0.036, 0.010);
          groove.parent = headNode;
        }

        // Ear-pod base mounting ring
        const earBase = MeshBuilder.CreateTorus(`earBase${side}`, {
          diameter: 0.163, thickness: 0.016, tessellation: 24,
        }, scene);
        earBase.material = jointMat;
        earBase.rotation.z = Math.PI / 2;
        earBase.position = new Vector3(xs * 0.452, 0.036, 0.010);
        earBase.parent = headNode;
      }

      buildEarPod('L');
      buildEarPod('R');

      // [084-087] VISOR: Dark purple/black curved glass ellipse
      // [085] Convex radius ≈ 24.1cm = 0.530u — large prominent window
      const visor = MeshBuilder.CreateSphere('visor', {
        diameterX: 0.840, diameterY: 0.634, diameterZ: 0.275,
        segments: 40,
      }, scene);
      visor.material = visorMat;
      visor.position = new Vector3(0, 0.054, 0.330);
      visor.parent = headNode;
      glow.addIncludedOnlyMesh(visor as Mesh);

      // Visor rubber gasket seals — top and bottom black rubberized interface
      for (const [vy, ry] of [[-0.268, 0.10], [0.295, -0.10]] as [number, number][]) {
        const gasket = MeshBuilder.CreateTorus(`visorGasket${vy > 0 ? 'T' : 'B'}`, {
          diameter: 0.770 - Math.abs(vy) * 0.18,
          thickness: 0.016,
          tessellation: 38,
        }, scene);
        gasket.material = jointMat;
        gasket.position = new Vector3(0, 0.054 + vy * 0.58, 0.296);
        gasket.rotation.x = ry * 0.14;
        gasket.parent = headNode;
      }

      // [092-093] VISOR: Internal OLED active display screen
      const screenPlane = MeshBuilder.CreateSphere('screen', {
        diameterX: 0.732, diameterY: 0.524, diameterZ: 0.090,
        segments: 30,
      }, scene);
      screenPlane.material = screenMat;
      screenPlane.position = new Vector3(0, 0.054, 0.336);
      screenPlane.parent = headNode;
      glow.addIncludedOnlyMesh(screenPlane as Mesh);

      // [094-101] EYES: Glowing Lemniscate / Infinity Symbol (∞)
      // [095] Left loop = ORANGE · Right loop = BLUE
      // [097] Combined span 18.4cm = 0.405u → each center at ±0.108u
      // Loops use scale.y < 1 to create authentic ∞ elliptical shape

      // Left eye — orange loop
      const infL = MeshBuilder.CreateTorus('infL', {
        diameter: 0.232, thickness: 0.040, tessellation: 56,
      }, scene);
      infL.material = eyeGoldMat;
      infL.rotation.x = Math.PI / 2;
      infL.scaling.y = 0.74;
      infL.position = new Vector3(-0.108, 0.066, 0.422);
      infL.parent = headNode;
      glow.addIncludedOnlyMesh(infL as Mesh);

      const eyeDiscL = MeshBuilder.CreateDisc('eyeDiscL', {
        radius: 0.073, tessellation: 28,
      }, scene);
      eyeDiscL.material = eyeGoldMat;
      eyeDiscL.scaling.y = 0.74;
      eyeDiscL.position = new Vector3(-0.108, 0.066, 0.428);
      eyeDiscL.parent = headNode;
      glow.addIncludedOnlyMesh(eyeDiscL as Mesh);

      // Right eye — blue loop
      const infR = MeshBuilder.CreateTorus('infR', {
        diameter: 0.232, thickness: 0.040, tessellation: 56,
      }, scene);
      infR.material = eyeCyanMat;
      infR.rotation.x = Math.PI / 2;
      infR.scaling.y = 0.74;
      infR.position = new Vector3(0.108, 0.066, 0.422);
      infR.parent = headNode;
      glow.addIncludedOnlyMesh(infR as Mesh);

      const eyeDiscR = MeshBuilder.CreateDisc('eyeDiscR', {
        radius: 0.073, tessellation: 28,
      }, scene);
      eyeDiscR.material = eyeCyanMat;
      eyeDiscR.scaling.y = 0.74;
      eyeDiscR.position = new Vector3(0.108, 0.066, 0.428);
      eyeDiscR.parent = headNode;
      glow.addIncludedOnlyMesh(eyeDiscR as Mesh);

      // [098] EYES: Crossover point of ∞ — warm white convergence glow
      const eyeCenterMat = new PBRMaterial('eyeCenter', scene);
      eyeCenterMat.albedoColor = new Color3(1.0, 0.95, 0.84);
      eyeCenterMat.emissiveColor = new Color3(1.0, 0.88, 0.65);
      eyeCenterMat.metallic = 0;
      eyeCenterMat.roughness = 1;

      const infCenter = MeshBuilder.CreateSphere('infCenter', {
        diameter: 0.038, segments: 10,
      }, scene);
      infCenter.material = eyeCenterMat;
      infCenter.position = new Vector3(0, 0.066, 0.426);
      infCenter.parent = headNode;
      glow.addIncludedOnlyMesh(infCenter as Mesh);

      // ─── GROUND SHADOW ────────────────────────────────────────────────────

      const shadowDisc = MeshBuilder.CreateDisc('shadow', {
        radius: 0.640, tessellation: 36,
      }, scene);
      const shadowMat = new PBRMaterial('shadowMat', scene);
      shadowMat.albedoColor = new Color3(0, 0, 0);
      shadowMat.alpha = 0.20;
      shadowMat.metallic = 0;
      shadowMat.roughness = 1;
      shadowDisc.material = shadowMat;
      shadowDisc.rotation.x = Math.PI / 2;
      shadowDisc.position = new Vector3(0, -0.285, 0);
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
        orbitTorus.position.y = 1.2 + Math.sin(t * 0.52) * 0.05;
        orbitTorus2.rotation.y = -t * 0.26;
        orbitTorus2.rotation.x = -Math.PI / 4 + Math.sin(t * 0.18) * 0.12;
        orbitTorus2.position.y = 1.2 - Math.sin(t * 0.44) * 0.04;

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
        root.position.z = Math.sin(t * 0.72) * 0.035;

        const blend = active ? 0.13 : 0.048;
        const idleBodyY = Math.sin(t * 0.55) * 0.065;
        const idleBodyX = Math.cos(t * 0.8) * 0.015;
        const idleBodyZ = Math.sin(t * 0.64) * 0.05;
        root.rotation.y += (desiredY + idleBodyY - root.rotation.y) * blend;
        root.rotation.x += (desiredX * 0.32 + idleBodyX - root.rotation.x) * blend;
        root.rotation.z += (idleBodyZ - root.rotation.z) * (active ? 0.11 : 0.04);

        // Head tracking
        const headAimY = desiredY * 0.62 + Math.sin(t * 0.42) * 0.045;
        const headAimX = desiredX * 0.42 + Math.cos(t * 0.31) * 0.018;
        headNode.rotation.y += (headAimY - headNode.rotation.y) * (active ? 0.17 : 0.062);
        headNode.rotation.x += (headAimX - headNode.rotation.x) * (active ? 0.14 : 0.055);

        const reactorPulse = 1 + Math.sin(t * 2.2 + touchPulse * 2.8) * 0.08;
        chestHalo.rotation.z = t * 0.95;
        chestCore.scaling.setAll(reactorPulse + touchPulse * 0.12);
        chestHalo.scaling.setAll(reactorPulse * 0.98 + 0.02);

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
        // [095] Left eye = orange, Right eye = blue (per spec)
        eyeGoldMat.emissiveColor = new Color3(
          (1.0 + emissiveBoost * 0.15) * (0.6 + emissiveGate * 0.4),
          (0.48 + emissiveBoost * 0.05) * (0.6 + emissiveGate * 0.4),
          0,
        );
        eyeCyanMat.emissiveColor = new Color3(
          0.05 * (0.6 + emissiveGate * 0.4),
          (0.44 + emissiveBoost * 0.05) * (0.6 + emissiveGate * 0.4),
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
