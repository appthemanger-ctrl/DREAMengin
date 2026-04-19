'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Sparkles, Stars, Trail } from '@react-three/drei';
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
/*  OrbitalStar — a small glowing sphere that orbits the crystal       */
/*  using Drei's <Float> for a gentle hover and <Trail> for a comet    */
/*  tail effect.                                                        */
/* ------------------------------------------------------------------ */
interface OrbitalStarProps {
  radius: number;
  speed: number;
  offset: number;
  color: string;
}

function OrbitalStar({ radius, speed, offset, color }: OrbitalStarProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.y = Math.sin(t * 0.7) * 0.6;
    ref.current.position.z = Math.sin(t) * radius;
  });

  return (
    <Trail
      width={0.8}
      length={6}
      color={color}
      attenuation={(t) => t * t}
    >
      <mesh ref={ref}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </Trail>
  );
}

/* ------------------------------------------------------------------ */
/*  DreamScene                                                         */
/*                                                                    */
/*  A self-contained React Three Fiber canvas showcasing:              */
/*    • Neon glow shader                                               */
/*    • Lightning wing shader                                          */
/*    • Refractor shader (glass / crystal distortion)                  */
/*    • Starfield via drei Stars                                        */
/*    • Drei Float — gentle hover animation on the crystal              */
/*    • Drei Sparkles — ambient gold particle field                    */
/*    • Drei Trail + OrbitalStar — comet-tail orbiting spheres         */
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
          <pointLight position={[0, 3, 0]} intensity={0.3} color="#c8981a" />

          {/* Background stars */}
          <Stars radius={50} depth={40} count={1500} factor={3} fade speed={0.5} />

          {/* Ambient gold sparkle field — uses Drei Sparkles */}
          <Sparkles
            count={60}
            scale={[8, 5, 5]}
            size={0.8}
            speed={0.25}
            opacity={0.55}
            color="#c8981a"
          />
          {/* Cyan/blue secondary sparkles for depth */}
          <Sparkles
            count={40}
            scale={[6, 4, 4]}
            size={0.5}
            speed={0.18}
            opacity={0.35}
            color="#38bdf8"
          />

          {/* Orbital comet stars circling the crystal */}
          <OrbitalStar radius={2.2} speed={0.55} offset={0}            color="#c8981a" />
          <OrbitalStar radius={2.6} speed={0.38} offset={Math.PI}      color="#38bdf8" />
          <OrbitalStar radius={1.9} speed={0.72} offset={Math.PI / 2}  color="#a78bfa" />

          {/* Crystal group — wrapped in Float for organic hover */}
          <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.4}>
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
          </Float>

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
