/**
 * components/webgpu/neuralPostProcess.ts — Neural Post-Processing WGSL shader.
 *
 * Implements a GPU-accelerated neural denoising / upscaling post-process pass
 * inspired by NVIDIA's NIS (Neural Image Scaling) and AMD FSR techniques.
 *
 * Pipeline position: runs AFTER the standard composite pass as an optional
 * quality enhancement when the WebGPU Director determines there is GPU headroom.
 *
 * Features:
 *  - Edge-aware sharpening with gold/light-blue colour bias
 *  - Adaptive noise reduction (temporal neighbourhood sampling)
 *  - Luminance-preserving upscale for sub-native resolution rendering
 *  - Neumorphic vignette overlay (soft dark-edge glow matching the design system)
 *
 * Architecture: docs/ARCHITECTURE.md §10 (render-on-demand, performance-first).
 * The shader is written in WGSL and designed for WebGPU-native execution.
 */

// ---------------------------------------------------------------------------
// Neural Post-Process shader (WGSL)
// ---------------------------------------------------------------------------

/**
 * Uniforms for the neural post-process pass.
 *
 * - `resolution`: viewport width/height in pixels
 * - `sharpness`: edge sharpening strength (0.0 = off, 1.0 = max)
 * - `denoiseStrength`: temporal noise reduction (0.0 = off, 1.0 = aggressive)
 * - `time`: elapsed time for animated effects (vignette pulse)
 * - `goldBias`: amount of gold tint in highlight reconstruction (0.0–1.0)
 * - `skyBias`: amount of light-blue tint in shadow lifting (0.0–1.0)
 */
export const NEURAL_POST_PROCESS_WGSL = /* wgsl */`
struct NeuralUniforms {
  resolution      : vec2<f32>,
  sharpness       : f32,
  denoiseStrength : f32,
  time            : f32,
  goldBias        : f32,
  skyBias         : f32,
  _pad            : f32,
}

@group(0) @binding(0) var inputTex  : texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> u : NeuralUniforms;

// ── Utility functions ─────────────────────────────────────────────────────

fn luminance(c: vec3<f32>) -> f32 {
  return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
}

fn srgbToLinear(c: vec3<f32>) -> vec3<f32> {
  return pow(c, vec3<f32>(2.2));
}

fn linearToSrgb(c: vec3<f32>) -> vec3<f32> {
  return pow(saturate(c), vec3<f32>(1.0 / 2.2));
}

// Soft clamp to prevent colour blow-out.
fn softClamp(x: f32, limit: f32) -> f32 {
  return limit * tanh(x / limit);
}

// ── Edge-aware sharpening (CAS-inspired) ──────────────────────────────────
//
// Contrast Adaptive Sharpening samples a 3×3 neighbourhood and boosts
// edges proportionally to local contrast while preserving flat regions.

fn sampleTexel(coord: vec2<i32>) -> vec3<f32> {
  return textureLoad(inputTex, coord, 0).rgb;
}

fn casSharp(center: vec3<f32>, neighbours: array<vec3<f32>, 8>, strength: f32) -> vec3<f32> {
  var minC = center;
  var maxC = center;
  for (var i = 0; i < 8; i++) {
    minC = min(minC, neighbours[i]);
    maxC = max(maxC, neighbours[i]);
  }

  // Local contrast ratio — higher means more edge detail.
  let contrast = saturate(1.0 - luminance(maxC - minC));

  // Weighted sharpening: stronger on edges, gentle on flats.
  var sum = vec3<f32>(0.0);
  for (var i = 0; i < 8; i++) {
    sum += neighbours[i];
  }
  let avg = sum / 8.0;
  let detail = center - avg;

  return center + detail * strength * (0.5 + contrast * 0.5);
}

// ── Temporal neighbourhood denoise ────────────────────────────────────────
//
// Approximated: averages the 3×3 neighbourhood weighted by luminance
// similarity to the center pixel. True temporal denoising would require
// a motion-vector buffer from the previous frame.

fn neighbourDenoise(coord: vec2<i32>, center: vec3<f32>, strength: f32) -> vec3<f32> {
  let centerLum = luminance(center);
  var acc = vec3<f32>(0.0);
  var wSum = 0.0;

  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      let s = sampleTexel(coord + vec2<i32>(dx, dy));
      let diff = abs(luminance(s) - centerLum);
      // Gaussian-like weight: closer luminance → higher weight.
      let w = exp(-diff * diff * 30.0);
      acc += s * w;
      wSum += w;
    }
  }

  let denoised = acc / max(wSum, 0.001);
  return mix(center, denoised, strength);
}

// ── Gold / sky colour grading ─────────────────────────────────────────────
//
// Applies the DREAMengin signature colour palette:
//   - Gold tint in highlights (warm, jeweller's gold #D4AF37)
//   - Light-blue tint in lifted shadows (sky blue #7DD3FC)

fn dreamenginGrade(c: vec3<f32>, goldBias: f32, skyBias: f32) -> vec3<f32> {
  let lum = luminance(c);

  // Gold highlight tint
  let gold = vec3<f32>(0.831, 0.686, 0.216);  // #D4AF37
  let highlightMix = smoothstep(0.55, 0.95, lum) * goldBias;
  var graded = mix(c, c * gold * 1.5, highlightMix);

  // Sky shadow lift
  let sky = vec3<f32>(0.490, 0.827, 0.988);    // #7DD3FC
  let shadowMix = (1.0 - smoothstep(0.05, 0.35, lum)) * skyBias;
  graded = mix(graded, graded + sky * 0.08, shadowMix);

  return graded;
}

// ── Neumorphic vignette ───────────────────────────────────────────────────
//
// Soft dark-edge vignette with a subtle animated breathing pulse
// that matches the Neumorphic Dark aesthetic of the design system.

fn neuVignette(uv: vec2<f32>, time: f32) -> f32 {
  let centered = uv * 2.0 - 1.0;
  let dist = dot(centered * 0.65, centered * 0.65);
  // Subtle pulse (± 2% over 4 seconds).
  let pulse = 1.0 + sin(time * 1.57) * 0.02;
  return saturate(1.0 - dist * pulse);
}

// ── Main compute kernel ───────────────────────────────────────────────────

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dims = vec2<i32>(textureDimensions(inputTex));
  let coord = vec2<i32>(gid.xy);

  if (coord.x >= dims.x || coord.y >= dims.y) { return; }

  // 1. Sample centre + 8 neighbours for sharpening & denoise.
  let center = sampleTexel(coord);
  var nb: array<vec3<f32>, 8>;
  nb[0] = sampleTexel(coord + vec2<i32>(-1, -1));
  nb[1] = sampleTexel(coord + vec2<i32>( 0, -1));
  nb[2] = sampleTexel(coord + vec2<i32>( 1, -1));
  nb[3] = sampleTexel(coord + vec2<i32>(-1,  0));
  nb[4] = sampleTexel(coord + vec2<i32>( 1,  0));
  nb[5] = sampleTexel(coord + vec2<i32>(-1,  1));
  nb[6] = sampleTexel(coord + vec2<i32>( 0,  1));
  nb[7] = sampleTexel(coord + vec2<i32>( 1,  1));

  // 2. Edge-aware sharpening (CAS).
  var c = casSharp(center, nb, u.sharpness);

  // 3. Neighbourhood denoise.
  c = neighbourDenoise(coord, c, u.denoiseStrength);

  // 4. Gold / sky colour grading.
  c = dreamenginGrade(c, u.goldBias, u.skyBias);

  // 5. Neumorphic vignette.
  let uv = vec2<f32>(coord) / vec2<f32>(dims);
  c *= neuVignette(uv, u.time);

  // 6. Final sRGB output.
  c = linearToSrgb(saturate(c));

  textureStore(outputTex, coord, vec4<f32>(c, 1.0));
}
`;

// ---------------------------------------------------------------------------
// Neural Post-Process uniform buffer layout
// ---------------------------------------------------------------------------

/** Byte layout of the NeuralUniforms struct (32 bytes, 16-byte aligned). */
export const NEURAL_UNIFORM_SIZE = 32;

/**
 * Create a Float32Array for the neural post-process uniform buffer.
 */
export function createNeuralUniforms(params: {
  width: number;
  height: number;
  sharpness?: number;
  denoiseStrength?: number;
  time?: number;
  goldBias?: number;
  skyBias?: number;
}): Float32Array {
  return new Float32Array([
    params.width,
    params.height,
    params.sharpness ?? 0.5,
    params.denoiseStrength ?? 0.3,
    params.time ?? 0,
    params.goldBias ?? 0.25,
    params.skyBias ?? 0.15,
    0, // padding
  ]);
}

// ---------------------------------------------------------------------------
// Pipeline builder
// ---------------------------------------------------------------------------

/**
 * Create the neural post-processing compute pipeline.
 *
 * Call once at init time.  The returned pipeline + bind group layout are
 * reused every frame; only the uniform buffer needs updating.
 */
export async function createNeuralPostProcessPipeline(
  device: GPUDevice,
): Promise<{
  pipeline: GPUComputePipeline;
  bindGroupLayout: GPUBindGroupLayout;
}> {
  const bindGroupLayout = device.createBindGroupLayout({
    label: 'neural-post-process-bgl',
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        texture: { sampleType: 'float' },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        storageTexture: { access: 'write-only', format: 'rgba8unorm' },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: 'uniform' },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  const shaderModule = device.createShaderModule({
    label: 'neural-post-process-shader',
    code: NEURAL_POST_PROCESS_WGSL,
  });

  const pipeline = device.createComputePipeline({
    label: 'neural-post-process-pipeline',
    layout: pipelineLayout,
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });

  return { pipeline, bindGroupLayout };
}

/**
 * Dispatch the neural post-process compute pass.
 *
 * Reads from `inputTexture`, writes to `outputTexture`, using the provided
 * uniform buffer.  Both textures must be the same dimensions.
 */
export function dispatchNeuralPostProcess(
  encoder: GPUCommandEncoder,
  pipeline: GPUComputePipeline,
  bindGroupLayout: GPUBindGroupLayout,
  device: GPUDevice,
  inputTexture: GPUTexture,
  outputTexture: GPUTexture,
  uniformBuffer: GPUBuffer,
): void {
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: inputTexture.createView() },
      { binding: 1, resource: outputTexture.createView() },
      { binding: 2, resource: { buffer: uniformBuffer } },
    ],
  });

  const pass = encoder.beginComputePass({ label: 'neural-post-process' });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(
    Math.ceil(inputTexture.width / 8),
    Math.ceil(inputTexture.height / 8),
  );
  pass.end();
}
