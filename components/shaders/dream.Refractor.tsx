'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Refractor Shader                                                   */
/*                                                                    */
/*  A GPU-driven refraction / distortion post-effect that bends and    */
/*  warps the scene behind it, simulating glass or crystal refractive  */
/*  surfaces.  Uses GLSL noise for animated chromatic distortion.      */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uRefractionStrength;
  uniform float uChromaticAberration;
  uniform float uFresnelPower;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

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

  void main() {
    vec2 uv = vUv;

    /* Animated distortion */
    float n = noise(uv * 4.0 + uTime * 0.3);
    float n2 = noise(uv * 8.0 - uTime * 0.5);
    vec2 distortion = vec2(n - 0.5, n2 - 0.5) * uRefractionStrength;

    /* Chromatic aberration: offset R, G, B channels slightly */
    float r = noise((uv + distortion + vec2( uChromaticAberration, 0.0)) * 3.0 + uTime * 0.2);
    float g = noise((uv + distortion) * 3.0 + uTime * 0.2);
    float b = noise((uv + distortion + vec2(-uChromaticAberration, 0.0)) * 3.0 + uTime * 0.2);

    /* Fresnel-like rim lighting */
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), uFresnelPower);

    vec3 refracted = vec3(r, g, b) * uColor;
    vec3 col = mix(refracted * 0.3, uColor, fresnel * 0.6);
    col += fresnel * uColor * 0.4;

    float alpha = 0.4 + fresnel * 0.5;
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface RefractorProps {
  color?: string;
  refractionStrength?: number;
  chromaticAberration?: number;
  fresnelPower?: number;
  position?: [number, number, number];
  scale?: number;
  geometry?: 'sphere' | 'torus' | 'icosahedron';
}

export function Refractor({
  color = '#88ccff',
  refractionStrength = 0.15,
  chromaticAberration = 0.02,
  fresnelPower = 2.5,
  position = [0, 0, 0],
  scale = 1,
  geometry = 'icosahedron',
}: RefractorProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uRefractionStrength: { value: refractionStrength },
      uChromaticAberration: { value: chromaticAberration },
      uFresnelPower: { value: fresnelPower },
    }),
    [color, refractionStrength, chromaticAberration, fresnelPower],
  );

  useFrame((_state, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh position={position} scale={scale}>
      {geometry === 'sphere' && <sphereGeometry args={[1, 64, 64]} />}
      {geometry === 'torus' && <torusGeometry args={[1, 0.4, 32, 64]} />}
      {geometry === 'icosahedron' && <icosahedronGeometry args={[1, 4]} />}
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default Refractor;
