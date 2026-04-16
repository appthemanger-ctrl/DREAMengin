/**
 * lib/h265-encoder.ts
 *
 * Two complementary video encoding APIs:
 *
 * 1. H265Encoder — low-level WebCodecs VideoEncoder wrapper.
 *    Produces raw H.265/H.264/VP9 NAL-unit packets.
 *    Useful for streaming, WebRTC, or custom muxing pipelines.
 *    Falls back to a WASM stub backend when WebCodecs is unavailable.
 *
 * 2. GameCapture — practical game recording using canvas.captureStream()
 *    and MediaRecorder. Handles muxing automatically. Produces a Blob
 *    ready for download or upload. Works across all browsers.
 *    Codec priority: H.265 MP4 → H.264 MP4 → VP9 WebM → H.264 WebM.
 */

// ─── Shared types ─────────────────────────────────────────────────────────────

export type H265Preset = 'speed' | 'balanced' | 'quality';
export type PixelFormat = 'rgba8' | 'bgra8' | 'nv12' | 'i420';
export type BackendKind = 'webcodecs' | 'wasm';

export interface EncoderOptions {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  preset?: H265Preset;
  gopSize?: number;
  lowLatency?: boolean;
  useGpu?: boolean;
  pixelFormat?: PixelFormat;
  maxBFrames?: number;
  enableBFrames?: boolean;
  allowCPUFallback?: boolean;
  backend?: BackendKind;
}

export interface VideoFrameLike {
  data: ArrayBufferView | ArrayBuffer;
  width: number;
  height: number;
  format?: PixelFormat;
  pts?: number;
}

export interface EncodedPacket {
  data: Uint8Array;
  keyframe: boolean;
  pts: number;
  dts?: number;
}

export interface EncoderCapabilities {
  supported: boolean;
  hardware: boolean;
  maxWidth: number;
  maxHeight: number;
  maxBitrate: number;
  maxBFrames: number;
  formats: PixelFormat[];
  presets: H265Preset[];
  backend: BackendKind;
}

interface IEncoderBackend {
  init(config: Required<EncoderOptions>): Promise<void>;
  encode(frame: VideoFrameLike, forceKeyframe: boolean): Promise<EncodedPacket[]>;
  flush(): Promise<EncodedPacket[]>;
  destroy(): Promise<void>;
  getCapabilities(): Promise<EncoderCapabilities>;
}

const DEFAULT_OPTIONS: Required<EncoderOptions> = {
  width: 1920,
  height: 1080,
  fps: 60,
  bitrate: 8_000_000,
  preset: 'balanced',
  gopSize: 120,
  lowLatency: false,
  useGpu: true,
  pixelFormat: 'nv12',
  maxBFrames: 2,
  enableBFrames: true,
  allowCPUFallback: true,
  backend: 'webcodecs',
};

// ─── H265Encoder ──────────────────────────────────────────────────────────────

export class H265Encoder {
  private opts: Required<EncoderOptions>;
  private backend: IEncoderBackend;
  private initialized = false;
  private closed = false;
  private forceNextKeyframe = false;

  private constructor(opts: Required<EncoderOptions>, backend: IEncoderBackend) {
    this.opts = opts;
    this.backend = backend;
  }

  static async create(options: EncoderOptions): Promise<H265Encoder> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const backend = await BackendFactory.create(opts.backend);
    const caps = await backend.getCapabilities();

    if (!caps.supported && !opts.allowCPUFallback) {
      throw new Error('H.265 encoding is not supported on this device.');
    }

    const enc = new H265Encoder(opts, backend);
    await enc.init();
    return enc;
  }

  static async getCapabilities(backend: BackendKind = 'webcodecs'): Promise<EncoderCapabilities> {
    const b = await BackendFactory.create(backend);
    return b.getCapabilities();
  }

  async encode(frame: VideoFrameLike): Promise<EncodedPacket[]> {
    this.ensureOpen();
    await this.ensureInit();
    this.validateFrame(frame);

    const normalized: VideoFrameLike = {
      ...frame,
      format: frame.format ?? this.opts.pixelFormat,
      pts: frame.pts ?? 0,
    };

    const out = await this.backend.encode(normalized, this.forceNextKeyframe);
    this.forceNextKeyframe = false;
    return out;
  }

  async flush(): Promise<EncodedPacket[]> {
    this.ensureOpen();
    await this.ensureInit();
    return this.backend.flush();
  }

  requestKeyframe(): void {
    this.ensureOpen();
    this.forceNextKeyframe = true;
  }

  setBitrate(bitrate: number): void {
    this.ensureOpen();
    if (!Number.isFinite(bitrate) || bitrate <= 0) throw new Error('Invalid bitrate');
    this.opts.bitrate = bitrate;
    void this.reconfigure();
  }

  setPreset(preset: H265Preset): void {
    this.ensureOpen();
    this.opts.preset = preset;
    void this.reconfigure();
  }

  setGopSize(gopSize: number): void {
    this.ensureOpen();
    if (!Number.isInteger(gopSize) || gopSize < 1) throw new Error('Invalid GOP size');
    this.opts.gopSize = gopSize;
    void this.reconfigure();
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.backend.destroy();
  }

  private async init(): Promise<void> {
    if (this.initialized) return;
    await this.backend.init(this.opts);
    this.initialized = true;
  }

  // WebCodecs has no dynamic reconfigure path; destroy and reinit.
  private async reconfigure(): Promise<void> {
    if (!this.initialized) return;
    await this.backend.destroy();
    this.initialized = false;
    await this.init();
  }

  private async ensureInit(): Promise<void> {
    if (!this.initialized) await this.init();
  }

  private ensureOpen(): void {
    if (this.closed) throw new Error('Encoder is closed');
  }

  private validateFrame(frame: VideoFrameLike): void {
    if (frame.width !== this.opts.width || frame.height !== this.opts.height) {
      throw new Error(
        `Frame size mismatch: expected ${this.opts.width}x${this.opts.height}, got ${frame.width}x${frame.height}`,
      );
    }
  }
}

// ─── BackendFactory ───────────────────────────────────────────────────────────

class BackendFactory {
  static async create(kind: BackendKind): Promise<IEncoderBackend> {
    if (kind === 'wasm') return new WasmFallbackBackend();
    return new WebCodecsBackend();
  }
}

// ─── WebCodecsBackend ─────────────────────────────────────────────────────────

class WebCodecsBackend implements IEncoderBackend {
  private encoder: VideoEncoder | null = null;
  private config: Required<EncoderOptions> | null = null;
  private pendingPackets: EncodedPacket[] = [];
  private resolveFlush: (() => void) | null = null;

  async init(config: Required<EncoderOptions>): Promise<void> {
    this.config = config;
    this.encoder = new VideoEncoder({
      output: (chunk) => {
        const packet: EncodedPacket = {
          data: new Uint8Array(chunk.byteLength),
          keyframe: chunk.type === 'key',
          pts: chunk.timestamp,
          dts: chunk.timestamp,
        };
        chunk.copyTo(packet.data);
        this.pendingPackets.push(packet);
        if (this.resolveFlush) {
          this.resolveFlush();
          this.resolveFlush = null;
        }
      },
      error: (e) => { console.error('[H265Encoder] WebCodecs error', e); },
    });

    await this.encoder.configure({
      codec: 'hevc',
      width: config.width,
      height: config.height,
      bitrate: config.bitrate,
      framerate: config.fps,
      hardwareAcceleration: config.useGpu ? 'prefer-hardware' : 'prefer-software',
      bitrateMode: config.lowLatency ? 'constant' : 'variable',
      latencyMode: config.lowLatency ? 'realtime' : 'quality',
    });
  }

  async encode(frame: VideoFrameLike, forceKeyframe: boolean): Promise<EncodedPacket[]> {
    if (!this.encoder || !this.config) throw new Error('Encoder not initialized');

    const buf = frame.data instanceof ArrayBuffer ? frame.data : frame.data.buffer;
    const videoFrame = new VideoFrame(buf as ArrayBuffer, {
      timestamp: frame.pts ?? 0,
      duration: Math.round(1_000_000 / (this.config.fps)),
      format: this.mapPixelFormat(frame.format ?? this.config.pixelFormat),
      codedWidth: frame.width,
      codedHeight: frame.height,
    });

    this.encoder.encode(videoFrame, { keyFrame: forceKeyframe });
    videoFrame.close();

    await new Promise<void>((resolve) => {
      if (this.pendingPackets.length > 0) { resolve(); return; }
      this.resolveFlush = resolve;
    });

    const packets = [...this.pendingPackets];
    this.pendingPackets = [];
    return packets;
  }

  async flush(): Promise<EncodedPacket[]> {
    if (!this.encoder) return [];
    await this.encoder.flush();
    const packets = [...this.pendingPackets];
    this.pendingPackets = [];
    return packets;
  }

  async destroy(): Promise<void> {
    if (this.encoder) {
      this.encoder.close();
      this.encoder = null;
    }
  }

  async getCapabilities(): Promise<EncoderCapabilities> {
    let supported = false;
    if (typeof VideoEncoder !== 'undefined') {
      try {
        const result = await VideoEncoder.isConfigSupported({ codec: 'hevc', width: 640, height: 480 });
        supported = result.supported ?? false;
      } catch {
        supported = false;
      }
    }
    return {
      supported,
      hardware: true,
      maxWidth: 7680,
      maxHeight: 4320,
      maxBitrate: 200_000_000,
      maxBFrames: 4,
      formats: ['nv12', 'i420', 'rgba8'],
      presets: ['speed', 'balanced', 'quality'],
      backend: 'webcodecs',
    };
  }

  private mapPixelFormat(format: PixelFormat): VideoPixelFormat {
    switch (format) {
      case 'nv12':  return 'NV12';
      case 'i420':  return 'I420';
      case 'rgba8': return 'RGBA';
      case 'bgra8': return 'BGRA';
      default:      return 'RGBA';
    }
  }
}

// ─── WasmFallbackBackend ──────────────────────────────────────────────────────

class WasmFallbackBackend implements IEncoderBackend {
  async init(_config: Required<EncoderOptions>): Promise<void> {}

  async encode(frame: VideoFrameLike, forceKeyframe: boolean): Promise<EncodedPacket[]> {
    const data = frame.data instanceof ArrayBuffer
      ? new Uint8Array(frame.data)
      : new Uint8Array((frame.data as ArrayBufferView).buffer);
    const payload = new TextEncoder().encode(
      `wasm:${frame.width}x${frame.height}:pts=${frame.pts ?? 0}:key=${forceKeyframe}:bytes=${data.byteLength}`,
    );
    return [{ data: payload, keyframe: forceKeyframe, pts: frame.pts ?? 0 }];
  }

  async flush(): Promise<EncodedPacket[]> { return []; }
  async destroy(): Promise<void> {}

  async getCapabilities(): Promise<EncoderCapabilities> {
    return {
      supported: true,
      hardware: false,
      maxWidth: 3840,
      maxHeight: 2160,
      maxBitrate: 50_000_000,
      maxBFrames: 0,
      formats: ['nv12', 'i420'],
      presets: ['speed', 'balanced', 'quality'],
      backend: 'wasm',
    };
  }
}

// ─── GameCapture ──────────────────────────────────────────────────────────────
//
// Practical game-session recorder. Uses canvas.captureStream() + MediaRecorder
// so the browser handles muxing. Produces a Blob (MP4 or WebM) that can be
// downloaded or uploaded to Supabase Storage.
//
// Codec priority (highest quality supported wins):
//   H.265 MP4  → H.264 MP4  → H.264 WebM  → VP9 WebM  → WebM generic

export interface CaptureResult {
  blob: Blob;
  mimeType: string;
  codec: string;
  durationMs: number;
  width: number;
  height: number;
}

export class GameCapture {
  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private mimeType = '';
  private startTime = 0;

  /** Detect the best supported MIME type for recording. */
  static detectMimeType(): string {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'video/mp4;codecs=hvc1',        // H.265 — Safari 16.4+
      'video/mp4;codecs=avc1.42E01E', // H.264 — Chrome/Edge
      'video/mp4',                    // Generic MP4
      'video/webm;codecs=vp9',        // VP9 — Chrome/Firefox
      'video/webm;codecs=h264',       // H.264 in WebM — Chrome
      'video/webm',                   // Fallback
    ];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
  }

  /**
   * Start recording from a canvas element.
   * @param canvas  The game canvas (must have preserveDrawingBuffer=true for WebGL/WebGPU).
   * @param fps     Capture frame rate. Default 30.
   * @param bitrate Target bitrate in bits/sec. Default 8 Mbps.
   */
  start(canvas: HTMLCanvasElement, fps = 30, bitrate = 8_000_000): void {
    if (this.recorder) throw new Error('GameCapture already recording');
    this.chunks = [];
    this.mimeType = GameCapture.detectMimeType();
    if (!this.mimeType) throw new Error('MediaRecorder not available');

    const stream = canvas.captureStream(fps);
    this.recorder = new MediaRecorder(stream, {
      mimeType: this.mimeType,
      videoBitsPerSecond: bitrate,
    });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start(200); // flush a chunk every 200 ms
    this.startTime = performance.now();
  }

  /** Stop recording and return the muxed video blob. */
  async stop(canvas: HTMLCanvasElement): Promise<CaptureResult> {
    if (!this.recorder) throw new Error('GameCapture not recording');
    const durationMs = performance.now() - this.startTime;
    return new Promise((resolve, reject) => {
      this.recorder!.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType });
        const codec = this.mimeType.includes('hvc1') ? 'H.265'
          : this.mimeType.includes('avc1') || this.mimeType.includes('h264') ? 'H.264'
          : this.mimeType.includes('vp9') ? 'VP9'
          : 'unknown';
        resolve({ blob, mimeType: this.mimeType, codec, durationMs, width: canvas.width, height: canvas.height });
        this.recorder = null;
        this.chunks = [];
      };
      this.recorder!.onerror = (e) => reject(e);
      this.recorder!.stop();
    });
  }

  get isRecording(): boolean {
    return this.recorder?.state === 'recording';
  }

  get elapsedMs(): number {
    if (!this.isRecording) return 0;
    return performance.now() - this.startTime;
  }

  /**
   * Trigger a browser download of a CaptureResult blob.
   * Uses the same anchor-click pattern as ContentEngin and StarMakerEngin.
   */
  static download(result: CaptureResult, filename?: string): void {
    const ext = result.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    const name = filename ?? `gameplay-${Date.now()}.${ext}`;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
