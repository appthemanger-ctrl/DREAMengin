/**
 * DREAMengin Babylon Creative Optimizero Demo
 *
 * Demonstrates the Creative Optimizero algorithm applied to Babylon.js UI rendering.
 * Shows how different UI elements are scored, ranked, and selected based on the algorithm.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BabylonUIOptimizero,
  BabylonUIGenerator,
  type BabylonUICandidate,
} from '@/lib/optimizer/babylon-optimizero';
import { type OptimizeroResult } from '@/lib/optimizer/creative-optimizero';
import {
  DEFAULT_WEIGHTS,
  CHAOS_WEIGHTS,
  STABLE_WEIGHTS,
  type OptimizeroWeights,
} from '@/lib/optimizer/creative-optimizero';

type WeightPreset = 'default' | 'chaos' | 'stable' | 'custom';

interface BabylonOptimizeroSceneProps {
  onElementSelect?: (elementId: string) => void;
  initialPreset?: WeightPreset;
}

export default function BabylonOptimizeroScene({
  onElementSelect,
  initialPreset = 'default',
}: BabylonOptimizeroSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const [weightPreset, setWeightPreset] = useState<WeightPreset>(initialPreset);
  const [customWeights, setCustomWeights] = useState<OptimizeroWeights>(DEFAULT_WEIGHTS);
  const [optimizationResult, setOptimizationResult] = useState<OptimizeroResult<BabylonUICandidate> | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Generate candidate UI elements
  const generateCandidates = (): BabylonUICandidate[] => {
    const candidates: BabylonUICandidate[] = [];

    // Game orbs in a circle (like the original BabylonGameScene)
    const COLORS = [
      { r: 0.93, g: 0.26, b: 0.26 }, // Red
      { r: 0.23, g: 0.72, b: 0.38 }, // Green
      { r: 0.37, g: 0.51, b: 0.95 }, // Blue
      { r: 0.93, g: 0.62, b: 0.13 }, // Orange
      { r: 0.55, g: 0.33, b: 0.95 }, // Purple
      { r: 0.93, g: 0.33, b: 0.60 }, // Pink
    ];

    const GAME_IDS = ['game1', 'game2', 'game3', 'game4', 'game5', 'game6'];

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 5;
      candidates.push(
        BabylonUIGenerator.createGameOrb(
          `orb-${i}`,
          { x: Math.cos(angle) * radius, y: 1, z: Math.sin(angle) * radius },
          COLORS[i],
          GAME_IDS[i]
        )
      );
    }

    // Add some UI panels
    candidates.push(
      BabylonUIGenerator.createUIPanel('panel-1', { x: -8, y: 3, z: 0 }, { width: 3, height: 4 })
    );
    candidates.push(
      BabylonUIGenerator.createUIPanel('panel-2', { x: 8, y: 3, z: 0 }, { width: 3, height: 4 })
    );

    // Add holographic effects
    candidates.push(
      BabylonUIGenerator.createHolographicEffect('holo-1', { x: 0, y: 5, z: 0 })
    );

    // Add some "bad" candidates that should be rejected
    candidates.push({
      id: 'bad-nan',
      type: 'mesh',
      position: { x: NaN, y: 0, z: 0 },
      color: { r: 1, g: 0, b: 0 },
    });

    candidates.push({
      id: 'bad-toofar',
      type: 'mesh',
      position: { x: 2000, y: 0, z: 0 },
      color: { r: 0, g: 1, b: 0 },
    });

    return candidates;
  };

  // Run optimization
  const runOptimization = () => {
    const candidates = generateCandidates();

    let weights: OptimizeroWeights;
    switch (weightPreset) {
      case 'chaos':
        weights = CHAOS_WEIGHTS;
        break;
      case 'stable':
        weights = STABLE_WEIGHTS;
        break;
      case 'custom':
        weights = customWeights;
        break;
      default:
        weights = DEFAULT_WEIGHTS;
    }

    const optimizero = new BabylonUIOptimizero(weights);
    const result = optimizero.optimizeUILayout(candidates, { contextType: 'game-hub' });
    setOptimizationResult(result);

    return result;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    // Run initial optimization
    const result = runOptimization();

    // Dynamic import to avoid SSR issues
    import('@babylonjs/core').then(({
      Engine,
      Scene,
      ArcRotateCamera,
      HemisphericLight,
      Vector3,
      MeshBuilder,
      StandardMaterial,
      Color3,
      Color4,
      Animation,
    }) => {
      if (disposed || !canvas) return;

      const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      engineRef.current = engine;
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0.05, 0.07, 0.12, 1);

      // Camera
      const camera = new ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3, 20, Vector3.Zero(), scene);
      camera.attachControl(canvas, true);
      camera.lowerRadiusLimit = 8;
      camera.upperRadiusLimit = 40;

      // Lighting
      const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
      light.intensity = 0.9;
      light.groundColor = new Color3(0.1, 0.1, 0.3);

      // Ground
      const ground = MeshBuilder.CreateCylinder('ground', { diameter: 20, height: 0.3, tessellation: 64 }, scene);
      const groundMat = new StandardMaterial('groundMat', scene);
      groundMat.diffuseColor = new Color3(0.08, 0.12, 0.22);
      ground.material = groundMat;
      ground.isPickable = false;

      // Render only valid candidates from optimization result
      if (result.ranked_candidates.length > 0) {
        result.ranked_candidates.forEach((scoredCandidate, index) => {
          const candidate = scoredCandidate.data;

          if (candidate.type === 'mesh') {
            const mesh = MeshBuilder.CreateSphere(
              candidate.id,
              { diameter: 1.1, segments: 16 },
              scene
            );
            mesh.position = new Vector3(
              candidate.position.x,
              candidate.position.y,
              candidate.position.z
            );

            if (candidate.color) {
              const mat = new StandardMaterial(`${candidate.id}-mat`, scene);
              mat.diffuseColor = new Color3(
                candidate.color.r,
                candidate.color.g,
                candidate.color.b
              );
              mat.emissiveColor = new Color3(
                candidate.color.r * 0.3,
                candidate.color.g * 0.3,
                candidate.color.b * 0.3
              );
              mesh.material = mat;
            }

            // Add ranking indicator (smaller sphere on top)
            const rank = index + 1;
            const rankSphere = MeshBuilder.CreateSphere(
              `${candidate.id}-rank`,
              { diameter: 0.3, segments: 8 },
              scene
            );
            rankSphere.position = new Vector3(
              candidate.position.x,
              candidate.position.y + 1,
              candidate.position.z
            );
            const rankMat = new StandardMaterial(`${candidate.id}-rank-mat`, scene);
            rankMat.emissiveColor = new Color3(1, 1, 0);
            rankSphere.material = rankMat;

            // Animation
            if (candidate.animation?.type === 'float') {
              const floatAnim = new Animation(
                `${candidate.id}-float`,
                'position.y',
                30,
                Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CYCLE
              );
              floatAnim.setKeys([
                { frame: 0, value: candidate.position.y },
                { frame: 30, value: candidate.position.y + 0.5 },
                { frame: 60, value: candidate.position.y },
              ]);
              mesh.animations = [floatAnim];
              scene.beginAnimation(mesh, 0, 60, true);
            }

            mesh.isPickable = true;
            mesh.metadata = { candidateId: candidate.id };
          }
        });

        // Show rejected candidates as red X marks
        result.rejected_candidates.forEach((scoredCandidate) => {
          const candidate = scoredCandidate.data;
          // Only show if position is valid (not NaN or too far)
          const { x, y, z } = candidate.position;
          if (!isNaN(x) && !isNaN(y) && !isNaN(z) && Math.sqrt(x*x + y*y + z*z) < 100) {
            const xMesh = MeshBuilder.CreateBox(`${candidate.id}-rejected`, { size: 0.5 }, scene);
            xMesh.position = new Vector3(x, y || 0, z);
            const xMat = new StandardMaterial(`${candidate.id}-rejected-mat`, scene);
            xMat.diffuseColor = new Color3(1, 0, 0);
            xMat.alpha = 0.5;
            xMesh.material = xMat;
          }
        });
      }

      // Click handler
      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === 4 && pointerInfo.pickInfo?.hit) {
          const mesh = pointerInfo.pickInfo.pickedMesh;
          if (mesh?.metadata?.candidateId && onElementSelect) {
            onElementSelect(mesh.metadata.candidateId);
          }
        }
      });

      // Render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      const onResize = () => engine.resize();
      window.addEventListener('resize', onResize);
    }).catch(() => {
      // Babylon.js failed to load
    });

    return () => {
      disposed = true;
      if (engineRef.current) {
        engineRef.current.stopRenderLoop();
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [weightPreset, customWeights]);

  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <h3 className="text-lg font-medium">Creative Optimizero × Babylon.js</h3>
        <button
          onClick={() => setShowControls(!showControls)}
          className="de-btn de-btn-ghost text-xs"
        >
          {showControls ? 'Hide' : 'Show'} Controls
        </button>
      </div>

      <div className="de-widget-body space-y-4">
        {showControls && (
          <div className="space-y-3 p-3 rounded-lg bg-black/20">
            <div>
              <label className="block text-sm font-medium mb-2">Weight Preset</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setWeightPreset('default')}
                  className={`de-btn de-btn-ghost text-xs ${
                    weightPreset === 'default' ? 'de-btn-primary' : ''
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => setWeightPreset('chaos')}
                  className={`de-btn de-btn-ghost text-xs ${
                    weightPreset === 'chaos' ? 'de-btn-primary' : ''
                  }`}
                >
                  Chaos
                </button>
                <button
                  onClick={() => setWeightPreset('stable')}
                  className={`de-btn de-btn-ghost text-xs ${
                    weightPreset === 'stable' ? 'de-btn-primary' : ''
                  }`}
                >
                  Stable
                </button>
              </div>
            </div>

            {optimizationResult && (
              <div className="text-xs space-y-1 opacity-80">
                <div>Total Candidates: {optimizationResult.metadata.total_candidates}</div>
                <div>Valid: {optimizationResult.metadata.valid_candidates}</div>
                <div>Rejected: {optimizationResult.metadata.invalid_candidates}</div>
                {optimizationResult.best_candidate && (
                  <div className="mt-2 p-2 rounded bg-black/30">
                    <div className="font-medium">Best Candidate:</div>
                    <div>ID: {optimizationResult.best_candidate.id}</div>
                    <div>Score: {optimizationResult.best_candidate.final_score.toFixed(3)}</div>
                    <div>Novelty: {optimizationResult.best_candidate.novelty.toFixed(2)}</div>
                    <div>Usefulness: {optimizationResult.best_candidate.usefulness.toFixed(2)}</div>
                    <div>Delight: {optimizationResult.best_candidate.delight.toFixed(2)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 400,
            borderRadius: 12,
            border: '1.5px solid rgba(42,138,184,0.25)',
            display: 'block',
            background: 'linear-gradient(135deg, #0d1117, #0d1b2a)',
          }}
          aria-label="Creative Optimizero 3D Scene — optimized UI elements"
        />

        <div className="text-xs opacity-60">
          <strong>Legend:</strong> Colored spheres = valid candidates (ranked by score),
          Yellow markers = rank indicators, Red boxes = rejected candidates
        </div>
      </div>
    </div>
  );
}
