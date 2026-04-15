'use client';
// Hybrid logic for WebGPU/Babylon 9.0 integration
export const initializeHybridEngine = async (canvas: HTMLCanvasElement) => {
  if (!canvas) return null;
  
  // Future-proof WebGPU check
  const gpuSupported = !!(navigator as any).gpu;
  
  return {
    engineType: gpuSupported ? 'WebGPU' : 'WebGL2',
    status: 'active',
    timestamp: new Date().toISOString(),
    canvasId: canvas.id
  };
};

export const midnightGlassTheme = {
  background: 'rgba(10, 20, 40, 0.7)',
  blur: '20px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  accent: '#FFD700', // Gold
  primary: '#E0F7FA' // Light Blue
};
