/**
 * dreamenginOS: PRODUCTION HYBRID 3D OVERLAY
 * ARCHITECTURE: 47 Subsystems | Next.js 16 | Babylon.js 9.0
 * GOVERNANCE: χ-Load Generation Law (n=2.1)
 */

import * as BABYLON from "@babylonjs/core";

export const initHybridEngine = async (canvas: HTMLCanvasElement) => {
    // 1. ASYNC ENGINE INIT
    const engine = new BABYLON.WebGPUEngine(canvas);
    await engine.initAsync();
    
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); 

    // 2. CAMERA & LIGHTS
    const camera = new BABYLON.FreeCamera("ui_cam", new BABYLON.Vector3(0, 0, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());

    const light = new BABYLON.HemisphericLight("sky", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;
    light.specular = BABYLON.Color3.FromHexString("#88CCFF");

    // 3. RESIZE HANDLER (Prevents Stretching)
    const resizeHandler = () => engine.resize();
    window.addEventListener("resize", resizeHandler);

    // 4. UNIQUE BUTTON GENERATOR
    let btnId = 0;
    const create3DButton = (x: number, y: number) => {
        const name = `dream_btn_${btnId++}`;
        const button = BABYLON.MeshBuilder.CreateBox(name, {
            width: 2.2, 
            height: 0.9, 
            depth: 0.4
        }, scene);

        const mat = new BABYLON.PBRMaterial(`${name}_mat`, scene);
        mat.albedoColor = BABYLON.Color3.FromHexString("#0A0F1B");
        mat.metallic = 1.0;
        mat.roughness = 0.12;
        mat.emissiveColor = BABYLON.Color3.FromHexString("#D4AF37");
        mat.emissiveIntensity = 0.08;

        button.material = mat;
        button.position.set(x, y, 0);
        return button;
    };

    // 5. RENDER LOOP
    engine.runRenderLoop(() => scene.render());

    // 6. TEARDOWN (Next.js Component Cleanup)
    const dispose = () => {
        window.removeEventListener("resize", resizeHandler);
        engine.stopRenderLoop();
        scene.dispose();
        engine.dispose();
    };

    return { scene, create3DButton, dispose };
};

/**
 * χ-LOAD INTERACTION (Physics-Correct Scaling)
 */
export const onGrab = (mesh: BABYLON.Mesh) => {
    const n = 2.1; 
    const frameRate = 60;
    
    // We clone the current scaling to prevent mutation mid-animation
    const startScale = mesh.scaling.clone();
    
    // Target is 1.5x (Thumb Visibility)
    // The 'n' constant governs the easing speed relative to the mass
    const duration = Math.floor(20 * n); 

    BABYLON.Animation.CreateAndStartAnimation(
        "ch_load_pop", 
        mesh, 
        "scaling", 
        frameRate, 
        duration, 
        startScale, 
        new BABYLON.Vector3(1.5, 1.5, 1.5), 
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
};
