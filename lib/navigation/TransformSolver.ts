// TransformSolver - Compute surface transforms from NavState
// Mobile-optimized: GPU-friendly transforms, single DOM write

import type { NavStateBuffer } from './NavStateBuffer';

export interface TransformOutput {
  tx: number;
  ty: number;
  scale: number;
  opacity: number;
}

export interface ViewportMetrics {
  width: number;
  height: number;
}

/**
 * TransformSolver computes CSS transforms from navigation state
 * Outputs GPU-accelerated transform values for mobile compositors
 */
export class TransformSolver {
  /**
   * Solve transform for a surface element
   */
  solve(
    navState: NavStateBuffer,
    viewport: ViewportMetrics
  ): TransformOutput {
    const { layer, face, depth } = navState;
    
    // Base transform
    let tx = 0;
    let ty = 0;
    let scale = 1;
    let opacity = 1;
    
    // Face-based horizontal offset (cube rotation)
    tx = face * viewport.width;
    
    // Depth-based scaling
    if (depth === 0) {
      scale = 1;
    } else if (depth === 1) {
      scale = 1.1;
    } else {
      scale = 1.2;
    }
    
    // Layer-based opacity
    if (layer === 0) { // HOME
      opacity = 1;
    } else if (layer === 2) { // PROFILE
      opacity = depth === 1 ? 1 : 0.95;
    }
    
    return { tx, ty, scale, opacity };
  }
  
  /**
   * Apply transform to element (single DOM write)
   */
  apply(element: HTMLElement, transform: TransformOutput): void {
    // GPU-accelerated transform
    element.style.transform = `translate3d(${transform.tx}px, ${transform.ty}px, 0) scale(${transform.scale})`;
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
