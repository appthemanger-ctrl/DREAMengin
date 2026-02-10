// TransformSolver - Compute surface transforms from NavState
// Mobile-optimized: GPU-friendly transforms, single DOM write
// Enhanced with quaternion rotations and manifold smoothing

import type { NavStateBuffer } from './NavStateBuffer';
import type { Quaternion } from './quaternion';
import { identityQuaternion, toRotationMatrix } from './quaternion';
import { projectCubicToSphere, computeLambda, computeSlotPosition } from './manifold';

export interface TransformOutput {
  tx: number;
  ty: number;
  tz: number;
  scale: number;
  opacity: number;
  rotation?: Quaternion;
  rotationMatrix?: number[][];
}

export interface ViewportMetrics {
  width: number;
  height: number;
}

/**
 * TransformSolver computes CSS transforms from navigation state
 * Outputs GPU-accelerated transform values for mobile compositors
 * 
 * Enhanced with:
 * - Quaternion-based rotations (Section 3)
 * - Manifold smoothing (Section 4)
 * - Dynamic lambda based on zoom depth
 */
export class TransformSolver {
  private currentOrientation: Quaternion;
  
  constructor() {
    this.currentOrientation = identityQuaternion();
  }
  
  /**
   * Set current orientation (for quaternion tracking)
   */
  setOrientation(q: Quaternion): void {
    this.currentOrientation = q;
  }
  
  /**
   * Get current orientation
   */
  getOrientation(): Quaternion {
    return this.currentOrientation;
  }
  
  /**
   * Solve transform for a surface element
   * Enhanced with quaternion rotations and manifold smoothing
   */
  solve(
    navState: NavStateBuffer,
    viewport: ViewportMetrics
  ): TransformOutput {
    const { layer, face, depth, slot } = navState;
    
    // Base transform
    let tx = 0;
    let ty = 0;
    let tz = 0;
    let scale = 1;
    let opacity = 1;
    
    // Section 4.1: Compute dynamic lambda for manifold smoothing
    const lambda = computeLambda(depth, 5);
    
    // Face-based position with manifold smoothing
    // Raw cube position
    const cubeX = -face;
    const cubeY = 0;
    const cubeZ = depth;
    
    // Apply manifold projection
    const projectedPos = projectCubicToSphere(
      { x: cubeX, y: cubeY, z: cubeZ },
      lambda
    );
    
    // Convert to screen space
    tx = projectedPos.x * viewport.width;
    ty = projectedPos.y * viewport.height;
    tz = projectedPos.z * 100; // Scale for depth perception
    
    // Section 2.3: Slot position (polar layout)
    if (slot >= 0 && slot <= 7) {
      const slotPos = computeSlotPosition(slot);
      tx += slotPos.x * viewport.width * 0.3;
      ty += slotPos.y * viewport.height * 0.3;
    }
    
    // Section 7: Zoom as dimension change (not just scale)
    // FOV(d) = FOV0 / (1 + αd)
    const fovAlpha = 0.2;
    const fovScale = 1 / (1 + fovAlpha * depth);
    scale = fovScale;
    
    // Additional depth-based scaling for widget appearance
    if (depth === 0) {
      scale *= 1.0;
    } else if (depth === 1) {
      scale *= 1.1;
    } else {
      scale *= 1.2;
    }
    
    // Layer-based opacity
    if (layer === 0) { // HOME
      opacity = 1;
    } else if (layer === 2) { // PROFILE
      opacity = depth === 1 ? 1 : 0.95;
    }
    
    // Include rotation matrix for 3D transforms
    const rotationMatrix = toRotationMatrix(this.currentOrientation);
    
    return { 
      tx, 
      ty, 
      tz,
      scale, 
      opacity,
      rotation: this.currentOrientation,
      rotationMatrix,
    };
  }
  
  /**
   * Apply transform to element (single DOM write)
   * Enhanced with 3D transforms and rotation matrix
   */
  apply(element: HTMLElement, transform: TransformOutput): void {
    // Build 3D transform string
    let transformStr = `translate3d(${transform.tx}px, ${transform.ty}px, ${transform.tz}px)`;
    
    // Add rotation matrix if available (for 3D rotation)
    if (transform.rotationMatrix) {
      const m = transform.rotationMatrix;
      // CSS matrix3d takes 16 values (4x4 matrix)
      // We have a 3x3 rotation matrix, convert to 4x4
      const matrix3d = [
        m[0][0], m[0][1], m[0][2], 0,
        m[1][0], m[1][1], m[1][2], 0,
        m[2][0], m[2][1], m[2][2], 0,
        0, 0, 0, 1
      ].join(',');
      transformStr += ` matrix3d(${matrix3d})`;
    }
    
    // Add scale
    transformStr += ` scale(${transform.scale})`;
    
    // GPU-accelerated transform
    element.style.transform = transformStr;
    element.style.opacity = transform.opacity.toString();
  }
  
  /**
   * Prepare element for GPU acceleration
   */
  static prepareElement(element: HTMLElement): void {
    element.style.willChange = 'transform';
    element.style.contain = 'paint layout';
  }
}
