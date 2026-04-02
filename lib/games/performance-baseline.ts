export type GameRenderMode = 'webgpu' | 'babylon' | 'canvas' | 'dom';

export type RendererBackend = 'webgpu' | 'webgl2' | 'canvas2d' | 'dom';

export type PerformanceBaselineSource = 'shell' | 'runtime';

export interface FrameBaselineSample {
  fps: number;
  avgFps: number;
  frameMs: number;
  avgFrameMs: number;
  sampleCount: number;
}

export interface GamePerformanceBaseline extends FrameBaselineSample {
  gameId: string;
  renderMode: GameRenderMode;
  rendererBackend: RendererBackend;
  webgpuSupported: boolean;
  source: PerformanceBaselineSource;
}

export const DE_GAME_PERFORMANCE_BASELINE = 'de-game-performance-baseline';

export function resolveRendererBackend(
  renderMode: GameRenderMode,
  webgpuSupported: boolean,
): RendererBackend {
  switch (renderMode) {
    case 'webgpu':
    case 'babylon':
      return webgpuSupported ? 'webgpu' : 'webgl2';
    case 'canvas':
      return 'canvas2d';
    case 'dom':
    default:
      return 'dom';
  }
}

export function createPerformanceBaselineSampler(maxSamples = 90) {
  let hasFirstFrame = false;
  let lastTimestamp = 0;
  const frameHistory: number[] = [];

  return {
    pushFrame(timestamp: number): FrameBaselineSample | null {
      if (!hasFirstFrame) {
        hasFirstFrame = true;
        lastTimestamp = timestamp;
        return null;
      }

      const frameMs = Math.max(0.1, timestamp - lastTimestamp);
      lastTimestamp = timestamp;

      frameHistory.push(frameMs);
      if (frameHistory.length > maxSamples) frameHistory.shift();

      const avgFrameMs = frameHistory.reduce((sum, value) => sum + value, 0) / frameHistory.length;
      const fps = 1000 / frameMs;
      const avgFps = 1000 / avgFrameMs;

      return {
        fps: Math.round(fps),
        avgFps: Math.round(avgFps),
        frameMs: Math.round(frameMs * 10) / 10,
        avgFrameMs: Math.round(avgFrameMs * 10) / 10,
        sampleCount: frameHistory.length,
      };
    },
    reset() {
      hasFirstFrame = false;
      lastTimestamp = 0;
      frameHistory.length = 0;
    },
  };
}

export function publishGamePerformanceBaseline(detail: GamePerformanceBaseline): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<GamePerformanceBaseline>(DE_GAME_PERFORMANCE_BASELINE, { detail }));
}
