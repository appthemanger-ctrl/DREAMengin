"use client";

import { useEffect, useRef, useCallback } from "react";

export interface DreamLogoSceneOptions {
  /** Path to the gold "DREAM" transparent PNG */
  dreamSrc?: string;
  /** Path to the silver/blue "ENGIN" transparent PNG */
  enginSrc?: string;
  /** Target FPS when the canvas is actively visible (default 60) */
  activeFps?: number;
  /** Target FPS when idle/background (default 30) */
  idleFps?: number;
}

/**
 * Creates and manages a Babylon.js scene that animates the DREAMengin logo.
 *
 * Features
 * --------
 * - Two alpha-textured planes (DREAM gold + ENGIN silver) parented to a root
 *   TransformNode so the whole logo can be positioned as one unit.
 * - DREAM plane: slow y-float, ±1.5° rotation, soft emissive "shine" loop.
 * - ENGIN plane: subtle synced y-float at lower amplitude.
 * - Texture sampling set to NEAREST to avoid sub-pixel smear on crisp sprites.
 * - Battery-aware:
 *     • IntersectionObserver pauses rendering when canvas leaves viewport.
 *     • document visibilitychange pauses rendering when tab is hidden.
 *     • Drops to idleFps (30) when idle; runs at activeFps (60) when visible.
 */
export function useDreamLogoScene(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: DreamLogoSceneOptions = {}
) {
  const {
    dreamSrc = "/logo_DREAM_transparent.png",
    enginSrc = "/logo_ENGIN_transparent.png",
    activeFps = 60,
    idleFps = 30,
  } = options;

  const engineRef = useRef<import("@babylonjs/core").Engine | null>(null);
  const activeRef = useRef(true);

  const pauseRender = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.stopRenderLoop();
    activeRef.current = false;
  }, []);

  const resumeRender = useCallback((fps: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    const scene = (eng as unknown as { scenes: import("@babylonjs/core").Scene[] }).scenes[0];
    if (!scene) return;
    eng.stopRenderLoop();
    activeRef.current = true;
    let lastTime = performance.now();
    const interval = 1000 / fps;
    eng.runRenderLoop(() => {
      const now = performance.now();
      if (now - lastTime >= interval) {
        lastTime = now - ((now - lastTime) % interval);
        scene.render();
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    // Dynamically import Babylon to keep it out of the SSR bundle
    import("@babylonjs/core").then(
      ({
        Engine,
        Scene,
        ArcRotateCamera,
        Vector3,
        Color3,
        Color4,
        HemisphericLight,
        MeshBuilder,
        StandardMaterial,
        Texture,
        TransformNode,
        Animation,
        AnimationGroup,
        CubicEase,
        EasingFunction,
        SineEase,
      }) => {
        if (disposed) return;

        // ── Engine + Scene ────────────────────────────────────────────────────
        const engine = new Engine(canvas, true, {
          preserveDrawingBuffer: true,
          stencil: false,
          antialias: true,
          powerPreference: "low-power",
        });
        engineRef.current = engine;

        const scene = new Scene(engine);
        scene.clearColor = new Color4(0, 0, 0, 0); // fully transparent bg

        // ── Camera (orthographic-ish via large radius) ────────────────────────
        const camera = new ArcRotateCamera(
          "cam",
          -Math.PI / 2,
          Math.PI / 2,
          5,
          Vector3.Zero(),
          scene
        );
        camera.lowerRadiusLimit = 5;
        camera.upperRadiusLimit = 5;

        // ── Light ─────────────────────────────────────────────────────────────
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 1.0;
        light.diffuse = new Color3(1, 1, 1);

        // ── Root transform so callers can move the whole logo ─────────────────
        const logoRoot = new TransformNode("logoRoot", scene);

        // ── Helper: create an alpha plane ─────────────────────────────────────
        const makePlane = (
          name: string,
          src: string,
          offsetY: number,
          width: number,
          height: number
        ) => {
          const plane = MeshBuilder.CreatePlane(
            name,
            { width, height },
            scene
          );
          plane.parent = logoRoot;
          plane.position.y = offsetY;

          const mat = new StandardMaterial(`${name}_mat`, scene);

          const tex = new Texture(
            src,
            scene,
            false,   // noMipmap
            false,   // invertY
            Texture.NEAREST_SAMPLINGMODE // crisp, no bilinear smear
          );
          tex.hasAlpha = true;

          mat.diffuseTexture = tex;
          mat.useAlphaFromDiffuseTexture = true;
          mat.transparencyMode = 2; // ALPHABLEND
          mat.backFaceCulling = false;
          mat.disableLighting = false;
          mat.emissiveColor = new Color3(0, 0, 0);

          plane.material = mat;
          return { plane, mat };
        };

        // ── Planes ────────────────────────────────────────────────────────────
        // DREAM sits above ENGIN; aspect ratio approximated 4:1
        const { plane: dreamPlane, mat: dreamMat } = makePlane(
          "dream",
          dreamSrc,
          0.22,
          3.2,
          0.8
        );
        const { plane: enginPlane } = makePlane(
          "engin",
          enginSrc,
          -0.22,
          3.2,
          0.8
        );

        // ── Animations ────────────────────────────────────────────────────────
        const FPS = 60;
        const LOOP = Animation.ANIMATIONLOOPMODE_CYCLE;

        // Y-bob for DREAM (±0.06 units, 4-second cycle)
        const dreamYAnim = new Animation(
          "dreamYBob",
          "position.y",
          FPS,
          Animation.ANIMATIONTYPE_FLOAT,
          LOOP
        );
        const bobEase = new SineEase();
        bobEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        dreamYAnim.setEasingFunction(bobEase);
        dreamYAnim.setKeys([
          { frame: 0, value: 0.22 },
          { frame: 120, value: 0.28 }, // +0.06
          { frame: 240, value: 0.22 },
        ]);

        // Rotation Z for DREAM (±1.5°)
        const dreamRotAnim = new Animation(
          "dreamRotZ",
          "rotation.z",
          FPS,
          Animation.ANIMATIONTYPE_FLOAT,
          LOOP
        );
        const rotEase = new SineEase();
        rotEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        dreamRotAnim.setEasingFunction(rotEase);
        const DEG = Math.PI / 180;
        dreamRotAnim.setKeys([
          { frame: 0, value: 0 },
          { frame: 120, value: 1.5 * DEG },
          { frame: 240, value: -1.5 * DEG },
          { frame: 360, value: 0 },
        ]);

        // Emissive "shine" pulse on DREAM (gold highlight)
        const dreamShineAnim = new Animation(
          "dreamShine",
          "emissiveColor",
          FPS,
          Animation.ANIMATIONTYPE_COLOR3,
          LOOP
        );
        const shineEase = new CubicEase();
        shineEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        dreamShineAnim.setEasingFunction(shineEase);
        dreamShineAnim.setKeys([
          { frame: 0, value: new Color3(0, 0, 0) },
          { frame: 90, value: new Color3(0.35, 0.28, 0.05) }, // gold tint
          { frame: 180, value: new Color3(0, 0, 0) },
          { frame: 360, value: new Color3(0, 0, 0) },
        ]);

        // Micro-bob for ENGIN (lower amplitude, same phase so they feel linked)
        const enginYAnim = new Animation(
          "enginYBob",
          "position.y",
          FPS,
          Animation.ANIMATIONTYPE_FLOAT,
          LOOP
        );
        enginYAnim.setEasingFunction(bobEase);
        enginYAnim.setKeys([
          { frame: 0, value: -0.22 },
          { frame: 120, value: -0.19 }, // +0.03 (half DREAM amplitude)
          { frame: 240, value: -0.22 },
        ]);

        dreamPlane.animations = [dreamYAnim, dreamRotAnim];
        dreamMat.animations = [dreamShineAnim];
        enginPlane.animations = [enginYAnim];

        // ── AnimationGroup ────────────────────────────────────────────────────
        const group = new AnimationGroup("logoAnim", scene);
        group.addTargetedAnimation(dreamYAnim, dreamPlane);
        group.addTargetedAnimation(dreamRotAnim, dreamPlane);
        group.addTargetedAnimation(dreamShineAnim, dreamMat);
        group.addTargetedAnimation(enginYAnim, enginPlane);
        group.normalize(0, 360);
        group.play(true); // loop

        // ── Responsive resize ─────────────────────────────────────────────────
        const onResize = () => engine.resize();
        window.addEventListener("resize", onResize);

        // ── Battery-aware render loop ─────────────────────────────────────────
        let lastFrameTime = performance.now();
        let targetInterval = 1000 / activeFps;

        engine.stopRenderLoop();
        engine.runRenderLoop(() => {
          if (!activeRef.current) return;
          const now = performance.now();
          if (now - lastFrameTime >= targetInterval) {
            lastFrameTime = now;
            scene.render();
          }
        });

        // Pause when tab is hidden
        const onVisibility = () => {
          if (document.hidden) {
            targetInterval = 1000 / idleFps;
            activeRef.current = false;
          } else {
            targetInterval = 1000 / activeFps;
            activeRef.current = true;
          }
        };
        document.addEventListener("visibilitychange", onVisibility);

        // Pause when canvas scrolls out of view
        const observer = new IntersectionObserver(
          (entries) => {
            const visible = entries[0]?.isIntersecting ?? true;
            activeRef.current = visible;
            targetInterval = visible
              ? 1000 / activeFps
              : 1000 / idleFps;
          },
          { threshold: 0.1 }
        );
        observer.observe(canvas);

        // ── Cleanup ───────────────────────────────────────────────────────────
        return () => {
          disposed = true;
          observer.disconnect();
          document.removeEventListener("visibilitychange", onVisibility);
          window.removeEventListener("resize", onResize);
          engine.stopRenderLoop();
          scene.dispose();
          engine.dispose();
          engineRef.current = null;
        };
      }
    ).catch(console.error);

    return () => {
      disposed = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, dreamSrc, enginSrc, activeFps, idleFps]);

  return { pauseRender, resumeRender };
}
