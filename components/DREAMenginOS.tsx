'use client';

import React, { useRef, useEffect, useState } from 'react';
import { 
  Engine, Scene, Vector3, Color4, 
  DefaultRenderingPipeline,
  GlowLayer
} from '@babylonjs/core';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics from '@babylonjs/havok';

export default function DREAMenginOS({ 
  audioSource, 
  onReady 
}: { 
  audioSource?: AnalyserNode, 
  onReady?: (scene: Scene) => void 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [systemStatus, setSystemStatus] = useState("OFFLINE");
  const [pulseIntensity, setPulseIntensity] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    let engine: Engine;
    let scene: Scene;
    let renderLoop: (() => void) | null = null;

    const launchOS = async () => {
      setSystemStatus("BOOTING_CORE");

      engine = new Engine(canvasRef.current, true, { 
        preserveDrawingBuffer: true, 
        stencil: true 
      });
      scene = new Scene(engine);
      scene.clearColor = new Color4(0.01, 0.01, 0.03, 1);

      // 1. HAVOK PHYSICS HANDSHAKE
      setSystemStatus("SYNCING_PHYSICS");
      const havokWasm = await HavokPhysics();
      const physics = new HavokPlugin(true, havokWasm);
      scene.enablePhysics(new Vector3(0, -9.81, 0), physics);

      // 2. DREAM PIPELINE (Gold/Blue/White Aesthetic)
      const pipeline = new DefaultRenderingPipeline("DREAM_PIPE", true, scene);
      pipeline.bloomEnabled = true;
      pipeline.bloomThreshold = 0.2;
      pipeline.bloomWeight = 0.5;
      pipeline.chromaticAberrationEnabled = true;
      pipeline.chromaticAberration.aberrationAmount = 25; 
      
      const glow = new GlowLayer("OS_GLOW", scene);
      glow.intensity = 0.5;

      // 3. STABLE RENDER LOOP & WHIPREV PULSE
      renderLoop = () => {
        if (audioSource) {
          const freqData = new Uint8Array(audioSource.frequencyBinCount);
          audioSource.getByteFrequencyData(freqData);
          
          const bass = freqData[2] / 255;
          
          // Triggering React state for the UI Flux meter
          setPulseIntensity(bass);
          glow.intensity = 0.3 + (bass * 1.5);
          
          // Physics Interaction using Impostors
          scene.meshes.forEach(m => {
            if (m.physicsImpostor && bass > 0.8) {
              m.physicsImpostor.applyImpulse(
                new Vector3(0, bass * 0.15, 0), 
                m.getAbsolutePosition()
              );
            }
          });
        }
        scene.render();
      };

      engine.runRenderLoop(renderLoop);
      setSystemStatus("DREAM_ACTIVE");
      if (onReady) onReady(scene);
    };

    launchOS();

    const handleResize = () => engine?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (engine && renderLoop) {
        engine.stopRenderLoop(renderLoop);
      }
      engine?.dispose();
    };
  }, [audioSource]);

  return (
    <div className="relative w-full h-full min-h-screen bg-black">
      {/* Babylon.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ outline: 'none' }}
      />

      {/* System Status HUD */}
      <div className="absolute top-4 left-4 z-10 font-mono text-xs tracking-widest">
        <div className={`px-3 py-1.5 rounded border ${
          systemStatus === 'DREAM_ACTIVE'
            ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
            : systemStatus === 'OFFLINE'
            ? 'border-gray-600/50 bg-gray-800/50 text-gray-500'
            : 'border-blue-500/50 bg-blue-500/10 text-blue-400 animate-pulse'
        }`}>
          ◈ {systemStatus}
        </div>
      </div>

      {/* Pulse Intensity Meter */}
      <div className="absolute bottom-4 left-4 z-10 font-mono text-xs">
        <div className="flex items-center gap-2 text-gray-500">
          <span>PULSE</span>
          <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-yellow-400 to-white rounded-full transition-all duration-75"
              style={{ width: `${pulseIntensity * 100}%` }}
            />
          </div>
          <span className="text-yellow-400 w-10 text-right">
            {(pulseIntensity * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
