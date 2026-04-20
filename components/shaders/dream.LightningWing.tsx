'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Lightning Wing Shader                                              */
/*                                                                    */
/*  Generates animated electric / lightning arcs that form a wing-like */
/*  shape.  Everything runs in GLSL on the GPU – no video files.       */
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
  uniform float uBranchCount;

  varying vec2 vUv;

  /* Simple pseudo-random hash */
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  /* Value noise */
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  /* Fractal Brownian motion */
  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      val += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return val;
  }

  void main() {
    vec2 uv = vUv;

    /* Wing shape mask – wider on the right, tapering left */
    float wingShape = smoothstep(0.0, 0.5, uv.x) * smoothstep(1.0, 0.5, uv.x);
    wingShape *= smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.3, uv.y);

    /* Animated noise field for lightning branches */
    float t = uTime * 1.5;
    float n = fbm(uv * uBranchCount + vec2(t, t * 0.7));
    float n2 = fbm(uv * uBranchCount * 1.5 + vec2(-t * 0.8, t * 1.2));

    /* Lightning intensity from noise peaks */
    float lightning = pow(n, 3.0) * 4.0;
    float branches = pow(n2, 4.0) * 3.0;

    /* Core bolt running roughly horizontally */
    float coreY = 0.5 + 0.15 * sin(uv.x * 6.0 + t * 3.0);
    float core = smoothstep(0.08, 0.0, abs(uv.y - coreY)) * smoothstep(0.0, 0.3, uv.x);

    float total = (lightning + branches + core * 2.0) * wingShape * uIntensity;

    vec3 col = uColor * total;
    /* Slight white-hot core highlight */
    col += vec3(1.0) * core * wingShape * 0.5 * uIntensity;

    gl_FragColor = vec4(col, total * 0.9);
  }
`;

export interface LightningWingProps {
  color?: string;
  intensity?: number;
  branchCount?: number;
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export function LightningWing({
  color = '#4488ff',
  intensity = 1.0,
  branchCount = 5.0,
  scale = [3, 1.5, 1],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: LightningWingProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uBranchCount: { value: branchCount },
    }),
    [color, intensity, branchCount],
  );

  useFrame((_state, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default LightningWing;
