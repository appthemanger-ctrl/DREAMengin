'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Neon Glow Shader Material                                         */
/*                                                                    */
/*  A custom ShaderMaterial that produces a pulsating neon glow        */
/*  entirely on the GPU via GLSL.  It renders a radial gradient with   */
/*  configurable colour, intensity and pulse speed.                    */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uIntensity;
  uniform float uPulseSpeed;

  varying vec2 vUv;

  void main() {
    /* Distance from centre of the quad */
    float dist = length(vUv - 0.5) * 2.0;

    /* Pulsating intensity */
    float pulse = 0.5 + 0.5 * sin(uTime * uPulseSpeed);

    /* Radial glow falloff */
    float glow = uIntensity * pulse * smoothstep(1.0, 0.0, dist);

    /* Bloom halo */
    float halo = 0.3 * uIntensity * smoothstep(1.2, 0.2, dist);

    vec3 col = uColor * (glow + halo);

    gl_FragColor = vec4(col, glow + halo * 0.5);
  }
`;

export interface NeonGlowProps {
  color?: string;
  intensity?: number;
  pulseSpeed?: number;
  scale?: number;
  position?: [number, number, number];
}

export function NeonGlow({
  color = '#00ffff',
  intensity = 1.5,
  pulseSpeed = 2.0,
  scale = 2,
  position = [0, 0, 0],
}: NeonGlowProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uPulseSpeed: { value: pulseSpeed },
    }),
    [color, intensity, pulseSpeed],
  );

  useFrame((_state, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default NeonGlow;
