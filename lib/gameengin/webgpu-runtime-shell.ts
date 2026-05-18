import type { DreamrCartridgeArchive } from '@/lib/gameengin/dreamr-loader';

export interface WebGPURuntimeShellPlan {
  cartridgeId: string;
  renderMode: 'webgpu' | 'webgl' | 'canvas2d';
  entry: string;
  memoryBudgetMb: number;
  targetFrameRate: 30 | 60 | 120;
  canUseWebGPU: boolean;
  handoff: 'webgpu' | 'webgl-fallback' | 'canvas-fallback';
}

export function canUseWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export function planRuntimeShellHandoff(archive: DreamrCartridgeArchive): WebGPURuntimeShellPlan {
  const wantsWebGPU = archive.manifest.render_mode === 'webgpu';
  const gpuAvailable = canUseWebGPU();
  const handoff = wantsWebGPU
    ? (gpuAvailable ? 'webgpu' : 'webgl-fallback')
    : archive.manifest.render_mode === 'webgl'
      ? 'webgl-fallback'
      : 'canvas-fallback';

  return {
    cartridgeId: archive.manifest.cartridge_id,
    renderMode: archive.manifest.render_mode,
    entry: archive.manifest.entry,
    memoryBudgetMb: archive.manifest.memory_budget_mb,
    targetFrameRate: archive.manifest.target_frame_rate,
    canUseWebGPU: gpuAvailable,
    handoff,
  };
}