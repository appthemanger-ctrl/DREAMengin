/**
 * WebGPURenderer — raw WebGPU multi-pass renderer for DREAMengin.
 *
 * Pipeline order per frame:
 *   1. Compute pass  — particle attractor physics (2048 particles, GPU-only)
 *   2. Scene pass    — lemniscate ribbon + particle quads → HDR rgba16float
 *   3. Bright pass   — luminance threshold extract → bloomTex0
 *   4. Blur H pass   — horizontal Gaussian → bloomTex1
 *   5. Blur V pass   — vertical   Gaussian → bloomTex0
 *   6. Composite     — scene + bloom, ACES tone-map, chrom-ab, vignette → canvas
 *
 * The blur direction buffers are written ONCE at init (constant), avoiding
 * any per-frame CPU→GPU overhead beyond the 16-byte uniform update.
 */

import {
  COMPUTE_WGSL,
  LEMN_VERT_WGSL, LEMN_FRAG_WGSL,
  PARTICLE_VERT_WGSL, PARTICLE_FRAG_WGSL,
  FS_VERT_WGSL,
  BRIGHT_FRAG_WGSL,
  BLUR_FRAG_WGSL,
  COMPOSITE_FRAG_WGSL,
  N_PARTICLES,
  N_LEMN_VERTS,
  N_PARTICLE_VERTS,
} from './shaders';

const HDR_FMT: GPUTextureFormat = 'rgba16float';
const PARTICLE_STRIDE = 32; // 8 × f32

type NavWithGPU = Navigator & { readonly gpu: GPU };

// ─── Public API ───────────────────────────────────────────────────────────────

export class WebGPURenderer {
  // core
  private dev!: GPUDevice;
  private ctx!: GPUCanvasContext;
  private fmt!: GPUTextureFormat;

  // buffers
  private uBuf!: GPUBuffer;       // uniform  (time, dt, w, h)
  private pBuf!: GPUBuffer;       // particle storage
  private blurHBuf!: GPUBuffer;   // blur dir (1,0) — constant
  private blurVBuf!: GPUBuffer;   // blur dir (0,1) — constant

  // pipelines
  private cpPipe!: GPUComputePipeline;
  private lemnPipe!: GPURenderPipeline;
  private partPipe!: GPURenderPipeline;
  private brightPipe!: GPURenderPipeline;
  private blurPipe!: GPURenderPipeline;
  private compPipe!: GPURenderPipeline;

  // textures
  private hdrTex!: GPUTexture;
  private bloomTex0!: GPUTexture;
  private bloomTex1!: GPUTexture;
  private sampler!: GPUSampler;

  // bind groups (rebuilt on resize)
  private cpBG!: GPUBindGroup;
  private lemnBG!: GPUBindGroup;
  private partBG!: GPUBindGroup;
  private brightBG!: GPUBindGroup;
  private blurHBG!: GPUBindGroup;
  private blurVBG!: GPUBindGroup;
  private compBG!: GPUBindGroup;

  private w = 1;
  private h = 1;
  public time = 0;

  // ── Factory ───────────────────────────────────────────────────────────────

  private constructor() {}

  static async create(canvas: HTMLCanvasElement): Promise<WebGPURenderer> {
    const r = new WebGPURenderer();
    await r._init(canvas);
    return r;
  }

  // ── Initialisation ────────────────────────────────────────────────────────

  private async _init(canvas: HTMLCanvasElement) {
    const gpu = (navigator as NavWithGPU).gpu;
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) throw new Error('no WebGPU adapter');

    this.dev = await adapter.requestDevice();

    this.ctx = canvas.getContext('webgpu') as GPUCanvasContext;
    this.fmt = gpu.getPreferredCanvasFormat();
    this.ctx.configure({ device: this.dev, format: this.fmt, alphaMode: 'opaque' });

    this._mkBuffers();
    this._mkPipelines();
    this._seedParticles();
  }

  // ── Buffer creation ───────────────────────────────────────────────────────

  private _mkBuffers() {
    const d = this.dev;

    this.uBuf = d.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.pBuf = d.createBuffer({
      size: N_PARTICLES * PARTICLE_STRIDE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Blur direction buffers — written once, never changed
    const mkDirBuf = (x: number, y: number) => {
      const buf = d.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      d.queue.writeBuffer(buf, 0, new Float32Array([x, y, 0, 0]));
      return buf;
    };
    this.blurHBuf = mkDirBuf(1, 0);
    this.blurVBuf = mkDirBuf(0, 1);

    this.sampler = d.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
  }

  // ── Pipeline creation ─────────────────────────────────────────────────────

  private _mkPipelines() {
    const d = this.dev;

    // 1. Compute
    this.cpPipe = d.createComputePipeline({
      layout: 'auto',
      compute: { module: d.createShaderModule({ code: COMPUTE_WGSL }), entryPoint: 'main' },
    });

    const additive: GPUBlendState = {
      color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
      alpha: { srcFactor: 'one',       dstFactor: 'one', operation: 'add' },
    };
    const additiveOpaque: GPUBlendState = {
      color: { srcFactor: 'one',       dstFactor: 'one', operation: 'add' },
      alpha: { srcFactor: 'one',       dstFactor: 'one', operation: 'add' },
    };

    // 2. Lemniscate ribbon
    this.lemnPipe = d.createRenderPipeline({
      layout: 'auto',
      vertex:   { module: d.createShaderModule({ code: LEMN_VERT_WGSL }),     entryPoint: 'vs_main' },
      fragment: {
        module:  d.createShaderModule({ code: LEMN_FRAG_WGSL }),
        entryPoint: 'fs_main',
        targets: [{ format: HDR_FMT, blend: additiveOpaque }],
      },
      primitive: { topology: 'triangle-strip' },
    });

    // 3. Particle quads
    this.partPipe = d.createRenderPipeline({
      layout: 'auto',
      vertex:   { module: d.createShaderModule({ code: PARTICLE_VERT_WGSL }), entryPoint: 'vs_main' },
      fragment: {
        module:  d.createShaderModule({ code: PARTICLE_FRAG_WGSL }),
        entryPoint: 'fs_main',
        targets: [{ format: HDR_FMT, blend: additive }],
      },
      primitive: { topology: 'triangle-list' },
    });

    const fsVert = d.createShaderModule({ code: FS_VERT_WGSL });

    // 4. Bright pass
    this.brightPipe = d.createRenderPipeline({
      layout: 'auto',
      vertex:   { module: fsVert, entryPoint: 'vs_main' },
      fragment: {
        module:  d.createShaderModule({ code: BRIGHT_FRAG_WGSL }),
        entryPoint: 'fs_main',
        targets: [{ format: HDR_FMT }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // 5. Blur (reused for H and V passes, different bind groups)
    this.blurPipe = d.createRenderPipeline({
      layout: 'auto',
      vertex:   { module: fsVert, entryPoint: 'vs_main' },
      fragment: {
        module:  d.createShaderModule({ code: BLUR_FRAG_WGSL }),
        entryPoint: 'fs_main',
        targets: [{ format: HDR_FMT }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // 6. Composite → canvas
    this.compPipe = d.createRenderPipeline({
      layout: 'auto',
      vertex:   { module: fsVert, entryPoint: 'vs_main' },
      fragment: {
        module:  d.createShaderModule({ code: COMPOSITE_FRAG_WGSL }),
        entryPoint: 'fs_main',
        targets: [{ format: this.fmt }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  // ── Particle seed ─────────────────────────────────────────────────────────

  private _seedParticles() {
    const data = new Float32Array(N_PARTICLES * 8);
    for (let i = 0; i < N_PARTICLES; i++) {
      const b = i * 8;
      const t = (i / N_PARTICLES) * Math.PI * 2;
      const d = 1 + Math.sin(t) ** 2;
      data[b]     = 0.65 * Math.cos(t) / d;
      data[b + 1] = 0.65 * Math.sin(t) * Math.cos(t) / d;
      data[b + 2] = 0;
      data[b + 3] = 0;
      data[b + 4] = Math.random() * 2.0;
      data[b + 5] = data[b + 4];
      data[b + 6] = Math.random();
      data[b + 7] = 0;
    }
    this.dev.queue.writeBuffer(this.pBuf, 0, data);
  }

  // ── Resize ────────────────────────────────────────────────────────────────

  resize(w: number, h: number) {
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;

    this.hdrTex?.destroy();
    this.bloomTex0?.destroy();
    this.bloomTex1?.destroy();

    const mkTex = (label: string) => this.dev.createTexture({
      label,
      size: [w, h],
      format: HDR_FMT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.hdrTex    = mkTex('hdr');
    this.bloomTex0 = mkTex('bloom0');
    this.bloomTex1 = mkTex('bloom1');

    this._rebuildBGs();
  }

  // ── Bind groups ───────────────────────────────────────────────────────────

  private _rebuildBGs() {
    const d = this.dev;
    const bg = (pipe: GPUComputePipeline | GPURenderPipeline, entries: GPUBindGroupEntry[]) =>
      d.createBindGroup({ layout: (pipe as GPURenderPipeline).getBindGroupLayout(0), entries });

    this.cpBG = bg(this.cpPipe, [
      { binding: 0, resource: { buffer: this.pBuf } },
      { binding: 1, resource: { buffer: this.uBuf } },
    ]);

    this.lemnBG = bg(this.lemnPipe, [
      { binding: 0, resource: { buffer: this.uBuf } },
    ]);

    this.partBG = bg(this.partPipe, [
      { binding: 0, resource: { buffer: this.pBuf } },
      { binding: 1, resource: { buffer: this.uBuf } },
    ]);

    this.brightBG = bg(this.brightPipe, [
      { binding: 0, resource: this.hdrTex.createView() },
      { binding: 1, resource: this.sampler },
    ]);

    // blur H: reads bloom0 → writes bloom1
    this.blurHBG = bg(this.blurPipe, [
      { binding: 0, resource: this.bloomTex0.createView() },
      { binding: 1, resource: this.sampler },
      { binding: 2, resource: { buffer: this.blurHBuf } },
    ]);

    // blur V: reads bloom1 → writes bloom0
    this.blurVBG = bg(this.blurPipe, [
      { binding: 0, resource: this.bloomTex1.createView() },
      { binding: 1, resource: this.sampler },
      { binding: 2, resource: { buffer: this.blurVBuf } },
    ]);

    // composite: scene (hdr) + bloom (bloom0)
    this.compBG = bg(this.compPipe, [
      { binding: 0, resource: this.hdrTex.createView() },
      { binding: 1, resource: this.bloomTex0.createView() },
      { binding: 2, resource: this.sampler },
    ]);
  }

  // ── Frame ─────────────────────────────────────────────────────────────────

  frame(dt: number) {
    this.time += dt;
    const d = this.dev;

    // Update per-frame uniform (16 bytes)
    d.queue.writeBuffer(this.uBuf, 0, new Float32Array([this.time, dt, this.w, this.h]));

    const enc = d.createCommandEncoder({ label: 'frame' });

    // ── 1. Compute: particle physics ─────────────────────────────────────
    {
      const cp = enc.beginComputePass();
      cp.setPipeline(this.cpPipe);
      cp.setBindGroup(0, this.cpBG);
      cp.dispatchWorkgroups(Math.ceil(N_PARTICLES / 64));
      cp.end();
    }

    // ── 2. Scene: lemniscate + particles → HDR ───────────────────────────
    {
      const rp = enc.beginRenderPass({
        colorAttachments: [{
          view:       this.hdrTex.createView(),
          clearValue: { r: 0.014, g: 0.028, b: 0.055, a: 1.0 },
          loadOp:  'clear',
          storeOp: 'store',
        }],
      });
      rp.setPipeline(this.lemnPipe);
      rp.setBindGroup(0, this.lemnBG);
      rp.draw(N_LEMN_VERTS);

      rp.setPipeline(this.partPipe);
      rp.setBindGroup(0, this.partBG);
      rp.draw(N_PARTICLE_VERTS);
      rp.end();
    }

    // ── 3. Bright pass: hdr → bloom0 ─────────────────────────────────────
    {
      const rp = enc.beginRenderPass({
        colorAttachments: [{
          view: this.bloomTex0.createView(), loadOp: 'clear',
          clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store',
        }],
      });
      rp.setPipeline(this.brightPipe);
      rp.setBindGroup(0, this.brightBG);
      rp.draw(3);
      rp.end();
    }

    // ── 4. Blur H: bloom0 → bloom1 ───────────────────────────────────────
    {
      const rp = enc.beginRenderPass({
        colorAttachments: [{
          view: this.bloomTex1.createView(), loadOp: 'clear',
          clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store',
        }],
      });
      rp.setPipeline(this.blurPipe);
      rp.setBindGroup(0, this.blurHBG);
      rp.draw(3);
      rp.end();
    }

    // ── 5. Blur V: bloom1 → bloom0 ───────────────────────────────────────
    {
      const rp = enc.beginRenderPass({
        colorAttachments: [{
          view: this.bloomTex0.createView(), loadOp: 'clear',
          clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store',
        }],
      });
      rp.setPipeline(this.blurPipe);
      rp.setBindGroup(0, this.blurVBG);
      rp.draw(3);
      rp.end();
    }

    // ── 6. Composite → canvas ─────────────────────────────────────────────
    {
      const rp = enc.beginRenderPass({
        colorAttachments: [{
          view: this.ctx.getCurrentTexture().createView(),
          loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store',
        }],
      });
      rp.setPipeline(this.compPipe);
      rp.setBindGroup(0, this.compBG);
      rp.draw(3);
      rp.end();
    }

    d.queue.submit([enc.finish()]);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy() {
    this.hdrTex?.destroy();
    this.bloomTex0?.destroy();
    this.bloomTex1?.destroy();
    this.uBuf?.destroy();
    this.pBuf?.destroy();
    this.blurHBuf?.destroy();
    this.blurVBuf?.destroy();
    this.dev?.destroy();
  }
}
