// Manifold Smoothing Module
// Section 4: Manifold Smoothing
// Creates seamless "round cube" projection

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SphericalCoords {
  theta: number; // θ ∈ [0, π]
  phi: number;   // φ ∈ [0, 2π]
}

/**
 * Section 4.1: Cubic → Spherical Projection
 * 
 * Raw cube vector c ∈ [-1,1]³
 * Map to sphere: s = c / ||c||
 * Then interpolate: p = lerp(c, s, λ)
 * 
 * λ ∈ [0,1]
 * λ → 1 when zoomed out (more spherical)
 * λ → 0 when zoomed in (more cubic)
 * 
 * Creates "round cube" effect
 */
export function projectCubicToSphere(
  cubePos: Vector3,
  lambda: number
): Vector3 {
  // Clamp lambda to [0, 1]
  lambda = Math.max(0, Math.min(1, lambda));
  
  // Calculate sphere position: s = c / ||c||
  const magnitude = Math.sqrt(
    cubePos.x * cubePos.x +
    cubePos.y * cubePos.y +
    cubePos.z * cubePos.z
  );
  
  // Handle zero vector
  if (magnitude < 1e-10) {
    return { x: 0, y: 0, z: 0 };
  }
  
  const spherePos: Vector3 = {
    x: cubePos.x / magnitude,
    y: cubePos.y / magnitude,
    z: cubePos.z / magnitude,
  };
  
  // Linear interpolation: p = lerp(c, s, λ)
  return {
    x: cubePos.x + lambda * (spherePos.x - cubePos.x),
    y: cubePos.y + lambda * (spherePos.y - cubePos.y),
    z: cubePos.z + lambda * (spherePos.z - cubePos.z),
  };
}

/**
 * Compute dynamic lambda based on zoom depth
 * λ → 1 when zoomed out
 * λ → 0 when zoomed in
 */
export function computeLambda(depth: number, maxDepth: number = 5): number {
  // Normalize depth to [0, 1]
  const normalizedDepth = Math.min(depth / maxDepth, 1);
  
  // Invert: higher depth = more zoomed out = higher lambda
  return normalizedDepth;
}

/**
 * Section 2.2: Face Parameterization
 * Map to spherical coordinates
 * 
 * θ ∈ [0, π]
 * φ ∈ [0, 2π]
 * 
 * Mapping:
 * x = sin(θ) cos(φ)
 * y = sin(θ) sin(φ)
 * z = cos(θ)
 */
export function cartesianToSpherical(v: Vector3): SphericalCoords {
  const r = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  
  if (r < 1e-10) {
    return { theta: 0, phi: 0 };
  }
  
  // θ = arccos(z / r)
  const theta = Math.acos(Math.max(-1, Math.min(1, v.z / r)));
  
  // φ = atan2(y, x)
  const phi = Math.atan2(v.y, v.x);
  
  // Normalize phi to [0, 2π]
  const normalizedPhi = phi < 0 ? phi + 2 * Math.PI : phi;
  
  return { theta, phi: normalizedPhi };
}

/**
 * Convert spherical coordinates to Cartesian
 */
export function sphericalToCartesian(coords: SphericalCoords, radius: number = 1): Vector3 {
  return {
    x: radius * Math.sin(coords.theta) * Math.cos(coords.phi),
    y: radius * Math.sin(coords.theta) * Math.sin(coords.phi),
    z: radius * Math.cos(coords.theta),
  };
}

/**
 * Section 4.2: Edge Blending
 * At face borders, blend smoothly between faces
 * 
 * blendWidth = ε
 * weight = smoothstep(0, ε, distToEdge)
 * position = mix(faceA, faceB, weight)
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  // Clamp x to [edge0, edge1]
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  
  // Smooth interpolation: 3t² - 2t³
  return t * t * (3 - 2 * t);
}

/**
 * Calculate distance to nearest edge of a face
 * Assumes normalized face coordinates in [-1, 1]²
 */
export function distanceToEdge(u: number, v: number): number {
  // Distance to each edge
  const distLeft = u + 1;    // Distance to left edge (-1)
  const distRight = 1 - u;   // Distance to right edge (1)
  const distBottom = v + 1;  // Distance to bottom edge (-1)
  const distTop = 1 - v;     // Distance to top edge (1)
  
  // Return minimum distance
  return Math.min(distLeft, distRight, distBottom, distTop);
}

/**
 * Blend between two face positions at edge
 */
export function blendFaceEdge(
  faceA: Vector3,
  faceB: Vector3,
  edgeDistance: number,
  blendWidth: number = 0.1
): Vector3 {
  // Compute blend weight using smoothstep
  const weight = smoothstep(0, blendWidth, edgeDistance);
  
  // Linear blend: result = faceA * (1 - weight) + faceB * weight
  return {
    x: faceA.x + weight * (faceB.x - faceA.x),
    y: faceA.y + weight * (faceB.y - faceA.y),
    z: faceA.z + weight * (faceB.z - faceA.z),
  };
}

/**
 * Section 2.3: Slot Position in Polar Layout
 * 
 * For each face f, slot i ∈ {0..7}
 * 
 * Polar layout:
 * r = baseRadius
 * α = i * (2π / 8)
 * 
 * slotPosition: s_i = r * (cos α, sin α, 0)
 */
export function computeSlotPosition(
  slotIndex: number,
  baseRadius: number = 0.6,
  totalSlots: number = 8
): { x: number; y: number } {
  // Ensure slot index is in valid range
  const slot = ((slotIndex % totalSlots) + totalSlots) % totalSlots;
  
  // Compute angle: α = i * (2π / 8)
  const alpha = slot * (2 * Math.PI / totalSlots);
  
  // Compute position in polar coordinates
  return {
    x: baseRadius * Math.cos(alpha),
    y: baseRadius * Math.sin(alpha),
  };
}

/**
 * Section 11: Widget Mount Geometry
 * Each widget rendered on curved quad
 * 
 * Surface: z = κ(x² + y²)
 * κ = curvature constant
 * 
 * Gives lens effect
 */
export function computeWidgetCurvature(
  x: number,
  y: number,
  curvatureConstant: number = 0.1
): number {
  return curvatureConstant * (x * x + y * y);
}

/**
 * Normalize vector to unit length
 */
export function normalizeVector(v: Vector3): Vector3 {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  
  if (length < 1e-10) {
    return { x: 0, y: 0, z: 0 };
  }
  
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length,
  };
}

/**
 * Compute vector magnitude
 */
export function vectorMagnitude(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Vector dot product
 */
export function dotProduct(v1: Vector3, v2: Vector3): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

/**
 * Vector cross product
 */
export function crossProduct(v1: Vector3, v2: Vector3): Vector3 {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
}
