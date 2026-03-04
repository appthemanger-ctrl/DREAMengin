/**
 * WebGPU detection and renderer utilities.
 *
 * WebGPU is the next-generation graphics API for the web.  When supported
 * by the browser it allows Three.js to leverage a more modern GPU backend
 * instead of the legacy WebGL path.
 */

export async function isWebGPUAvailable(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if (!('gpu' in navigator)) return false;

  try {
    const adapter = await (navigator as Navigator & { gpu: GPU }).gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Return a label describing the best available GPU backend so UI can
 * surface it to the user.
 */
export async function getRendererBackend(): Promise<'webgpu' | 'webgl2' | 'webgl'> {
  if (await isWebGPUAvailable()) return 'webgpu';

  if (typeof document === 'undefined') return 'webgl2';

  const canvas = document.createElement('canvas');
  if (canvas.getContext('webgl2')) return 'webgl2';
  return 'webgl';
}
