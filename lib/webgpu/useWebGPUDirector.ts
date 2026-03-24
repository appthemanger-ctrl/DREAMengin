'use client';

/**
 * useWebGPUDirector — React hook that drives the DREAM_ENGINE_WEBGPU_DIRECTOR.
 *
 * Reads real frame-time data from a Babylon.js engine's performance monitor
 * and feeds it to a `WebGPUDirector` instance every `tickMs` milliseconds.
 * Returns the latest `DirectorFrame` so components and scenes can consume
 * per-object quality decisions, pass configs, and temporal settings without
 * hand-rolling their own signal collection.
 *
 * Architecture justification: docs/ARCHITECTURE.md §10 — render-on-demand,
 * hardware scaling, performance-first.
 *
 * Usage:
 * ```tsx
 * const engineRef = useRef<AbstractEngine | null>(null);
 * const { frame } = useWebGPUDirector({ engineRef, cameraState: 'hero' });
 *
 * useEffect(() => {
 *   if (!frame) return;
 *   applyDirectorFrame(engineRef.current!, sceneRef.current!, frame, devicePixelRatio);
 * }, [frame]);
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WebGPUDirector,
  applyDirectorFrame,
  buildSceneObjects,
  defaultCameraSignals,
  defaultDirectorMetrics,
  type CameraSignals,
  type CameraState,
  type DirectorBabylonEngine,
  type DirectorBabylonMesh,
  type DirectorBabylonScene,
  type DirectorFrame,
  type MeshHints,
  type RuntimeMetrics,
} from './director';

// ─── Minimal Babylon types needed by the hook ────────────────────────────────
// We keep these as duck types so the hook does not hard-depend on @babylonjs/core.

type BabylonPerformanceMonitor = {
  averageFrameTime: number;
};

type BabylonEngineWithMonitor = DirectorBabylonEngine & {
  performanceMonitor?: BabylonPerformanceMonitor | null;
};

type BabylonSceneWithMeshes = DirectorBabylonScene & {
  meshes: DirectorBabylonMesh[];
};

// ─── Options ─────────────────────────────────────────────────────────────────

export interface UseWebGPUDirectorOptions {
  /** Ref to the live Babylon engine (may be null until the canvas is ready). */
  engineRef: React.RefObject<BabylonEngineWithMonitor | null>;

  /** Ref to the live Babylon scene (may be null until the scene is ready). */
  sceneRef?: React.RefObject<BabylonSceneWithMeshes | null>;

  /**
   * Logical camera state.  Typically driven by route or scene mode.
   * Defaults to `'browse'`.
   */
  cameraState?: CameraState;

  /**
   * Camera velocity in normalised units (0 = static, 1 = fast pan/cut).
   * Defaults to `0`.
   */
  cameraVelocity?: number;

  /**
   * Whether a camera cut just occurred.  Set to `true` for one frame after a
   * hard transition to discard TAA history and prevent ghosting.
   */
  cutActive?: boolean;

  /**
   * ID of the object currently in focus (for camera affinity bonus).
   */
  focusTargetId?: string;

  /**
   * Per-mesh hints resolver.  Called for every mesh in `scene.meshes` each
   * tick so the caller can supply semantic weights without manually building
   * the full SceneObject array.
   */
  hintsResolver?: (mesh: DirectorBabylonMesh) => MeshHints;

  /**
   * How often (ms) to re-run the Director.  Default: `500`.
   * Lower values react faster to pressure changes but add CPU overhead.
   */
  tickMs?: number;

  /**
   * When `true`, automatically calls `applyDirectorFrame` after each update
   * so hardware scaling and mesh decisions are applied without extra code in
   * the caller.  Default: `false`.
   */
  autoApply?: boolean;

  /** Device pixel ratio used by `applyDirectorFrame`. Defaults to `1`. */
  devicePixelRatio?: number;
}

// ─── Return value ─────────────────────────────────────────────────────────────

export interface UseWebGPUDirectorReturn {
  /** Latest DirectorFrame. `null` until the first tick completes. */
  frame: DirectorFrame | null;

  /**
   * Manually trigger an immediate Director update.
   * Useful when you know something significant changed (e.g. the user focused
   * on a hero object) and you don't want to wait for the next tick.
   */
  tick: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebGPUDirector(
  options: UseWebGPUDirectorOptions,
): UseWebGPUDirectorReturn {
  const {
    engineRef,
    sceneRef,
    cameraState     = 'browse',
    cameraVelocity  = 0,
    cutActive       = false,
    focusTargetId,
    hintsResolver,
    tickMs          = 500,
    autoApply       = false,
    devicePixelRatio = 1,
  } = options;

  const directorRef        = useRef(new WebGPUDirector());
  const lastVisibleSetRef  = useRef(new Set<string>());
  const [frame, setFrame]  = useState<DirectorFrame | null>(null);

  const runTick = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // Collect runtime metrics from the engine performance monitor
    const perf = (engine as BabylonEngineWithMonitor).performanceMonitor;
    const avgFrameMs = perf?.averageFrameTime ?? 16.6;

    const metrics: RuntimeMetrics = {
      frameMs:           avgFrameMs,
      avgFrameMs,
      gpuMs:             avgFrameMs * 0.55,
      cpuMs:             avgFrameMs * 0.30,
      droppedFrameRatio: avgFrameMs > 20 ? (avgFrameMs - 20) / 30 : 0,
      uploadMs:          avgFrameMs * 0.10,
    };

    // Camera signals
    const camera: CameraSignals = {
      state:         cameraState,
      velocity:      cameraVelocity,
      cutActive,
      focusTargetId,
    };

    // Scene objects — build from scene.meshes if a sceneRef was provided
    const scene  = sceneRef?.current;
    const meshes = scene?.meshes ?? [];

    const objects = buildSceneObjects(
      meshes,
      hintsResolver ?? (() => ({})),
      lastVisibleSetRef.current,
    );

    // Record which meshes are visible this tick so next tick has lastFrameVisible
    lastVisibleSetRef.current = new Set(
      meshes.filter((m) => m.isVisible).map((m) => m.id),
    );

    const newFrame = directorRef.current.update({ metrics, camera, objects });
    setFrame(newFrame);

    // Auto-apply Director decisions to Babylon if requested
    if (autoApply && scene) {
      applyDirectorFrame(engine, scene, newFrame, devicePixelRatio);
    }
  }, [
    engineRef, sceneRef,
    cameraState, cameraVelocity, cutActive, focusTargetId,
    hintsResolver, autoApply, devicePixelRatio,
  ]);

  // Periodic tick
  useEffect(() => {
    // Run immediately so we have a frame before the first interval fires
    runTick();

    const id = window.setInterval(runTick, tickMs);
    return () => window.clearInterval(id);
  }, [runTick, tickMs]);

  return { frame, tick: runTick };
}

// ─── Re-exports for callers that only import from this file ───────────────────

export {
  applyDirectorFrame,
  buildSceneObjects,
  babylonMeshToSceneObject,
  defaultCameraSignals,
  defaultDirectorMetrics,
  WebGPUDirector,
  type CameraSignals,
  type CameraState,
  type DirectorFrame,
  type MeshHints,
  type RuntimeMetrics,
} from './director';
