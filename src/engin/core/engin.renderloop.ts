// engin.renderloop — primary rendering loop controller
// Frame scheduling. No game logic. No dream.* imports.

export interface RenderFrame {
  index: number;
  deltaMs: number;
  timestamp: number;
}

type FrameCallback = (frame: RenderFrame) => void;

export interface RenderLoop {
  start(): void;
  stop(): void;
  onFrame(cb: FrameCallback): () => void;
}

export function createRenderLoop(): RenderLoop {
  let running = false;
  let frameIndex = 0;
  let lastTimestamp = 0;
  let rafId = 0;
  const callbacks = new Set<FrameCallback>();

  function tick(timestamp: number): void {
    if (!running) return;
    const deltaMs = lastTimestamp === 0 ? 0 : timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    const frame: RenderFrame = { index: frameIndex++, deltaMs, timestamp };
    for (const cb of callbacks) {
      cb(frame);
    }
    rafId = requestAnimationFrame(tick);
  }

  function start(): void {
    if (running) return;
    running = true;
    lastTimestamp = 0;
    rafId = requestAnimationFrame(tick);
  }

  function stop(): void {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function onFrame(cb: FrameCallback): () => void {
    callbacks.add(cb);
    return () => {
      callbacks.delete(cb);
    };
  }

  return { start, stop, onFrame };
}
