'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { NeonGlow } from '@/components/shaders/NeonGlow';
import { LightningWing } from '@/components/shaders/LightningWing';
import { Refractor } from '@/components/shaders/Refractor';

/* ------------------------------------------------------------------ */
/*  Slowly rotating group used as a scene container                    */
/* ------------------------------------------------------------------ */
function RotatingGroup({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
    }
  });

  return <group ref={group}>{children}</group>;
}

/* ------------------------------------------------------------------ */
/*  DreamScene                                                         */
/*                                                                    */
/*  A self-contained React Three Fiber canvas showcasing:              */
/*    • Neon glow shader                                               */
/*    • Lightning wing shader                                          */
/*    • Refractor shader (glass / crystal distortion)                  */
/*    • Starfield via drei                                             */
/* ------------------------------------------------------------------ */

export interface DreamSceneProps {
  className?: string;
}

export function DreamScene({ className }: DreamSceneProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: 400 }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Ambient + point lights */}
          <ambientLight intensity={0.2} />
          <pointLight position={[5, 5, 5]} intensity={0.8} color="#88ccff" />
          <pointLight position={[-5, -3, 3]} intensity={0.4} color="#ff44aa" />

          {/* Background stars */}
          <Stars radius={50} depth={40} count={1500} factor={3} fade speed={0.5} />

          <RotatingGroup>
            {/* Central refractor crystal */}
            <Refractor
              position={[0, 0, 0]}
              scale={1.2}
              geometry="icosahedron"
              color="#88ccff"
              refractionStrength={0.15}
              fresnelPower={2.5}
            />

            {/* Neon glow behind the crystal */}
            <NeonGlow
              position={[0, 0, -0.5]}
              color="#00ffff"
              intensity={1.5}
              pulseSpeed={2.0}
              scale={3}
            />

            {/* Right lightning wing */}
            <LightningWing
              position={[2.2, 0, 0]}
              scale={[2.5, 1.2, 1]}
              color="#4488ff"
              intensity={1.0}
              branchCount={5}
            />

            {/* Left lightning wing (mirrored) */}
            <LightningWing
              position={[-2.2, 0, 0]}
              scale={[2.5, 1.2, 1]}
              rotation={[0, Math.PI, 0]}
              color="#aa44ff"
              intensity={1.0}
              branchCount={5}
            />
          </RotatingGroup>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default DreamScene;
