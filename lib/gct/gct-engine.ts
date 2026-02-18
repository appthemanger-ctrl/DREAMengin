export interface GCTConfig {
  /** Use WebGPU if available (falls back to CPU). */
  preferGPU?: boolean;
  /** Block size for GPU kernels (default 256). */
  blockSize?: number;
  /** Number of parallel templates to search. */
  numTemplates?: number;
}

export interface Template {
  id: string;
  /** Flattened vector values. */
  data: Float32Array;
  metadata?: Record<string, unknown>;
}

export interface GCTMatch {
  templateId: string;
  /** Index in data where match was found. */
  position: number;
  /** Similarity score in [0..1]. */
  correlation: number;
}

type PreparedInput = {
  templates: Template[];
  templateLength: number;
  threshold: number;
};

/**
 * GPU-accelerated Global Correlation Transform (GCT) engine for Web apps.
 */
export class GCTEngine {
  private config: Required<GCTConfig>;
  private gpuAvailable = false;
  private device: GPUDevice | null = null;

  constructor(config: GCTConfig = {}) {
    this.config = {
      preferGPU: true,
      blockSize: 256,
      numTemplates: 1000,
      ...config,
    };
  }

  /** Detect and initialize WebGPU, if available. */
  async init(): Promise<void> {
    if (!this.config.preferGPU || typeof navigator === 'undefined' || !("gpu" in navigator)) {
      this.gpuAvailable = false;
      this.device = null;
      return;
    }

    try {
      const adapter = await (navigator as Navigator & { gpu: GPU }).gpu.requestAdapter();
      if (!adapter) {
        this.gpuAvailable = false;
        return;
      }

      this.device = await adapter.requestDevice();
      this.device.lost.then(() => {
        this.gpuAvailable = false;
        this.device = null;
      }).catch(() => {
        this.gpuAvailable = false;
        this.device = null;
      });
      this.gpuAvailable = true;
    } catch {
      this.gpuAvailable = false;
      this.device = null;
    }
  }

  /**
   * Search data for template matches with normalized cross-correlation.
   */
  async search(data: Float32Array, templates: Template[], threshold = 0.8): Promise<GCTMatch[]> {
    const prepared = this.prepareInputs(data, templates, threshold);
    if (!prepared) return [];

    if (this.gpuAvailable && this.device) {
      try {
        return await this.searchGPU(data, prepared.templates, prepared.templateLength, prepared.threshold);
      } catch {
        // Transparent fallback if WebGPU path fails at runtime.
        return this.searchCPU(data, prepared.templates, prepared.templateLength, prepared.threshold);
      }
    }

    return this.searchCPU(data, prepared.templates, prepared.templateLength, prepared.threshold);
  }

  private prepareInputs(data: Float32Array, templates: Template[], threshold: number): PreparedInput | null {
    if (data.length === 0 || templates.length === 0) return null;

    const normalizedThreshold = Math.max(0, Math.min(1, threshold));
    const cappedTemplates = templates.slice(0, this.config.numTemplates);

    const templateLength = cappedTemplates[0]?.data.length ?? 0;
    if (templateLength <= 0 || data.length < templateLength) return null;

    for (const template of cappedTemplates) {
      if (template.data.length !== templateLength) {
        throw new Error('All templates must have the same data length');
      }
    }

    return {
      templates: cappedTemplates,
      templateLength,
      threshold: normalizedThreshold,
    };
  }

  private async searchGPU(
    data: Float32Array,
    templates: Template[],
    templateLength: number,
    threshold: number
  ): Promise<GCTMatch[]> {
    const device = this.device;
    if (!device) throw new Error('GPU device is not initialized');

    const dataLength = data.length;
    const numTemplates = templates.length;

    const flatTemplates = new Float32Array(numTemplates * templateLength);
    for (let i = 0; i < numTemplates; i++) {
      flatTemplates.set(templates[i].data, i * templateLength);
    }

    const dataBuffer = device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(dataBuffer.getMappedRange()).set(data);
    dataBuffer.unmap();

    const templateBuffer = device.createBuffer({
      size: flatTemplates.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(templateBuffer.getMappedRange()).set(flatTemplates);
    templateBuffer.unmap();

    const resultBuffer = device.createBuffer({
      size: numTemplates * 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const paramsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const paramsView = new DataView(new ArrayBuffer(16));
    paramsView.setUint32(0, dataLength, true);
    paramsView.setUint32(4, templateLength, true);
    paramsView.setUint32(8, numTemplates, true);
    paramsView.setFloat32(12, threshold, true);
    device.queue.writeBuffer(paramsBuffer, 0, paramsView.buffer);

    const shaderCode = `
      struct Params {
        dataLen: u32,
        templateLen: u32,
        numTemplates: u32,
        threshold: f32,
      };

      @group(0) @binding(0) var<storage, read> data: array<f32>;
      @group(0) @binding(1) var<storage, read> templates: array<f32>;
      @group(0) @binding(2) var<storage, read_write> results: array<f32>;
      @group(0) @binding(3) var<uniform> params: Params;

      @compute @workgroup_size(${this.config.blockSize})
      fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
        let templateIdx = gid.x;
        if (templateIdx >= params.numTemplates) {
          return;
        }

        let templateLen = params.templateLen;
        if (params.dataLen < templateLen) {
          results[templateIdx * 2u] = -1.0;
          results[templateIdx * 2u + 1u] = 0.0;
          return;
        }

        let maxPos = params.dataLen - templateLen;
        var bestPos: i32 = -1;
        var bestCorr: f32 = 0.0;

        for (var pos: u32 = 0u; pos <= maxPos; pos = pos + 1u) {
          var sumXY: f32 = 0.0;
          var sumX2: f32 = 0.0;
          var sumY2: f32 = 0.0;

          for (var k: u32 = 0u; k < templateLen; k = k + 1u) {
            let x = data[pos + k];
            let y = templates[templateIdx * templateLen + k];
            sumXY = sumXY + (x * y);
            sumX2 = sumX2 + (x * x);
            sumY2 = sumY2 + (y * y);
          }

          let corr = sumXY / (sqrt(sumX2) * sqrt(sumY2) + 1e-8);
          if (corr > bestCorr) {
            bestCorr = corr;
            bestPos = i32(pos);
          }
        }

        if (bestCorr >= params.threshold && bestPos >= 0) {
          results[templateIdx * 2u] = f32(bestPos);
          results[templateIdx * 2u + 1u] = bestCorr;
        } else {
          results[templateIdx * 2u] = -1.0;
          results[templateIdx * 2u + 1u] = bestCorr;
        }
      }
    `;

    const shaderModule = device.createShaderModule({ code: shaderCode });
    const pipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: dataBuffer } },
        { binding: 1, resource: { buffer: templateBuffer } },
        { binding: 2, resource: { buffer: resultBuffer } },
        { binding: 3, resource: { buffer: paramsBuffer } },
      ],
    });

    let encoder = device.createCommandEncoder();
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(pipeline);
    computePass.setBindGroup(0, bindGroup);
    const workgroups = Math.ceil(numTemplates / this.config.blockSize);
    computePass.dispatchWorkgroups(workgroups);
    computePass.end();
    device.queue.submit([encoder.finish()]);

    const readBuffer = device.createBuffer({
      size: numTemplates * 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(resultBuffer, 0, readBuffer, 0, numTemplates * 2 * Float32Array.BYTES_PER_ELEMENT);
    device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const raw = new Float32Array(readBuffer.getMappedRange());
    const matches: GCTMatch[] = [];

    for (let i = 0; i < numTemplates; i++) {
      const position = raw[i * 2];
      const correlation = raw[i * 2 + 1];
      if (position >= 0 && correlation >= threshold) {
        matches.push({
          templateId: templates[i].id,
          position: Math.round(position),
          correlation,
        });
      }
    }

    readBuffer.unmap();

    dataBuffer.destroy();
    templateBuffer.destroy();
    resultBuffer.destroy();
    paramsBuffer.destroy();
    readBuffer.destroy();

    return matches;
  }

  private searchCPU(
    data: Float32Array,
    templates: Template[],
    templateLength: number,
    threshold: number
  ): GCTMatch[] {
    const matches: GCTMatch[] = [];
    const maxPos = data.length - templateLength;

    for (const template of templates) {
      let bestPos = -1;
      let bestCorr = 0;

      for (let pos = 0; pos <= maxPos; pos++) {
        let sumXY = 0;
        let sumX2 = 0;
        let sumY2 = 0;

        for (let k = 0; k < templateLength; k++) {
          const x = data[pos + k];
          const y = template.data[k];
          sumXY += x * y;
          sumX2 += x * x;
          sumY2 += y * y;
        }

        const corr = sumXY / (Math.sqrt(sumX2) * Math.sqrt(sumY2) + 1e-8);
        if (corr > bestCorr) {
          bestCorr = corr;
          bestPos = pos;
        }
      }

      if (bestPos >= 0 && bestCorr >= threshold) {
        matches.push({
          templateId: template.id,
          position: bestPos,
          correlation: bestCorr,
        });
      }
    }

    return matches;
  }
}
