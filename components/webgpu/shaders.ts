/**
 * WGSL shader sources for the DREAMengin WebGPU renderer.
 *
 * Pipeline:
 *   1. Compute  — particle physics (attractor toward lemniscate, drag, respawn)
 *   2. Render   — scene to HDR rgba16float texture
 *                  a. Lemniscate ribbon (triangle-strip, thick stroke)
 *                  b. Particles (triangle quads, additive blend)
 *   3. Bright   — luminance threshold → bloom texture
 *   4. Blur H   — horizontal 9-tap Gaussian
 *   5. Blur V   — vertical   9-tap Gaussian
 *   6. Composite— scene + bloom, ACES tone-map, chromatic aberration, vignette, γ
 */

export const N_PARTICLES  = 2048;
export const N_LEMN_SEGS  = 512;
/** Vertices for closed triangle-strip ribbon: (N+1) pairs. */
export const N_LEMN_VERTS = (N_LEMN_SEGS + 1) * 2;
/** Vertices for particle quads: 6 verts each (2 triangles). */
export const N_PARTICLE_VERTS = N_PARTICLES * 6;

// ─── shared WGSL blocks ───────────────────────────────────────────────────────

const STRUCTS = /* wgsl */`
struct Uniforms {
  time   : f32,
  dt     : f32,
  width  : f32,
  height : f32,
}

struct Particle {
  pos     : vec2<f32>,   // 8 B
  vel     : vec2<f32>,   // 8 B
  life    : f32,         // 4 B
  maxLife : f32,         // 4 B
  seed    : f32,         // 4 B
  _pad    : f32,         // 4 B  (struct = 32 B total)
}
`;

const LEMN = /* wgsl */`
fn lemn(t: f32) -> vec2<f32> {
  let d = 1.0 + sin(t) * sin(t);
  return vec2<f32>(0.65 * cos(t) / d, 0.65 * sin(t) * cos(t) / d);
}
fn lemn_tan(t: f32) -> vec2<f32> {
  return normalize(lemn(t + 0.005) - lemn(t - 0.005));
}
`;

const HASH = /* wgsl */`
fn hash(n: f32) -> f32 { return fract(sin(n) * 43758.5453); }
`;

// ─── 1. Compute: particle physics ────────────────────────────────────────────

export const COMPUTE_WGSL = /* wgsl */`
${STRUCTS}
${LEMN}
${HASH}

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform>             u         : Uniforms;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let idx = gid.x;
  if (idx >= arrayLength(&particles)) { return; }

  var p = particles[idx];
  p.life -= u.dt;

  if (p.life <= 0.0) {
    // Respawn on the lemniscate with tangential velocity + small scatter
    let fi   = f32(idx);
    let t    = hash(fi + u.time * 0.07 + 1.3) * 6.28318530;
    let tang = lemn_tan(t);
    let perp = vec2<f32>(-tang.y, tang.x);
    let sc   = (hash(fi * 13.7 + u.time) - 0.5) * 0.022;
    p.pos     = lemn(t) + perp * sc;
    p.vel     = tang  * (0.055 + hash(fi * 7.31)  * 0.11)
              + perp  * (hash(fi * 3.17 + 0.5) - 0.5) * 0.03;
    p.maxLife = 0.55 + hash(fi * 11.1 + 2.7) * 1.9;
    p.life    = p.maxLife;
    p.seed    = hash(fi * 31.41 + u.time);
  } else {
    // Attract toward nearest lemniscate point (estimated)
    let t_e    = atan2(p.pos.y, p.pos.x) + length(p.pos) * 1.85 + u.time * 0.04;
    let target = lemn(t_e);
    let delta  = target - p.pos;
    let dsq    = dot(delta, delta) + 0.04;
    p.vel += normalize(delta) * (0.22 / dsq) * u.dt;
    p.vel *= 1.0 - 0.82 * u.dt;   // drag
    p.pos += p.vel * u.dt;
  }

  particles[idx] = p;
}
`;

// ─── 2a. Lemniscate ribbon vertex ─────────────────────────────────────────────

export const LEMN_VERT_WGSL = /* wgsl */`
${STRUCTS}
${LEMN}

@group(0) @binding(0) var<uniform> u : Uniforms;

struct VSOut {
  @builtin(position) clip   : vec4<f32>,
  @location(0)       t_norm : f32,
}

@vertex
fn vs_main(@builtin(vertex_index) vi : u32) -> VSOut {
  let N   = 512u;
  let seg = vi >> 1u;
  let sid = vi & 1u;

  // Wrap at close so segment N reuses segment 0 position
  let t  = f32(seg % N) / f32(N) * 6.28318530 + u.time * 0.25;
  let t2 = t + 6.28318530 / f32(N);

  let p1  = lemn(t);
  let p2  = lemn(t2);
  let tan = normalize(p2 - p1);
  let nor = vec2<f32>(-tan.y, tan.x);

  let hw  = 0.011;
  let sgn = select(-hw, hw, sid == 0u);
  let pos = p1 + nor * sgn;

  let asp  = u.width / u.height;
  var out  : VSOut;
  out.clip   = vec4<f32>(pos.x / asp, pos.y, 0.0, 1.0);
  out.t_norm = f32(seg) / f32(N);
  return out;
}
`;

export const LEMN_FRAG_WGSL = /* wgsl */`
struct VSOut {
  @builtin(position) clip   : vec4<f32>,
  @location(0)       t_norm : f32,
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  let gold  = vec3<f32>(0.910, 0.750, 0.250);
  let cyan  = vec3<f32>(0.365, 0.906, 1.000);
  let white = vec3<f32>(1.0, 1.0, 1.0);
  // left lobe (t≈0..0.5) → gold, right lobe (t≈0.5..1) → cyan, crossing → white
  let frac = fract(in.t_norm * 2.0);
  let hue  = abs(frac * 2.0 - 1.0);
  let base = mix(gold, cyan, frac);
  let col  = mix(white, base, 0.4 + hue * 0.6);
  return vec4<f32>(col * 3.8, 1.0);   // HDR: intentionally > 1
}
`;

// ─── 2b. Particle quads vertex ────────────────────────────────────────────────

export const PARTICLE_VERT_WGSL = /* wgsl */`
${STRUCTS}

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform>       u         : Uniforms;

struct VSOut {
  @builtin(position) clip : vec4<f32>,
  @location(0)       life : f32,
  @location(1)       spd  : f32,
  @location(2)       uv   : vec2<f32>,
}

// 2-triangle quad corners (CCW)
const QUAD = array<vec2<f32>, 6>(
  vec2<f32>(-1.0,  1.0),
  vec2<f32>( 1.0,  1.0),
  vec2<f32>(-1.0, -1.0),
  vec2<f32>( 1.0,  1.0),
  vec2<f32>( 1.0, -1.0),
  vec2<f32>(-1.0, -1.0),
);

@vertex
fn vs_main(@builtin(vertex_index) vi : u32) -> VSOut {
  let pidx   = vi / 6u;
  let corner = vi % 6u;
  let p      = particles[pidx];

  let life_n = clamp(p.life / p.maxLife, 0.0, 1.0);
  let spd    = length(p.vel);
  let sz     = (0.004 + spd * 0.010) * life_n;

  let asp = u.width / u.height;
  let off = QUAD[corner] * sz;
  // pos is in a ~[-0.65, 0.65] normalised space; map to NDC
  let px  = (p.pos.x + off.x) / asp;
  let py  =  p.pos.y + off.y * asp;

  var out : VSOut;
  out.clip = vec4<f32>(px, py, 0.0, 1.0);
  out.life = life_n;
  out.spd  = spd * 9.0;
  out.uv   = QUAD[corner];
  return out;
}
`;

export const PARTICLE_FRAG_WGSL = /* wgsl */`
struct VSOut {
  @builtin(position) clip : vec4<f32>,
  @location(0)       life : f32,
  @location(1)       spd  : f32,
  @location(2)       uv   : vec2<f32>,
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  let d = dot(in.uv, in.uv);
  if (d > 1.0) { discard; }
  let shape = 1.0 - smoothstep(0.25, 1.0, d);

  let gold = vec3<f32>(0.910, 0.750, 0.250);
  let cyan = vec3<f32>(0.365, 0.906, 1.000);
  let col  = mix(gold, cyan, clamp(in.spd, 0.0, 1.0));

  return vec4<f32>(col * 2.4, in.life * in.life * shape);
}
`;

// ─── shared full-screen triangle vertex ──────────────────────────────────────

export const FS_VERT_WGSL = /* wgsl */`
struct VSOut {
  @builtin(position) clip : vec4<f32>,
  @location(0)       uv  : vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vi : u32) -> VSOut {
  let x  = select(-1.0, 3.0, vi == 1u);
  let y  = select(-1.0, 3.0, vi == 2u);
  var out : VSOut;
  out.clip = vec4<f32>(x, y, 0.0, 1.0);
  out.uv   = vec2<f32>((x + 1.0) * 0.5, 1.0 - (y + 1.0) * 0.5);
  return out;
}
`;

// ─── 3. Bright pass ───────────────────────────────────────────────────────────

export const BRIGHT_FRAG_WGSL = /* wgsl */`
@group(0) @binding(0) var tex : texture_2d<f32>;
@group(0) @binding(1) var smp : sampler;

struct VSOut {
  @builtin(position) clip : vec4<f32>,
  @location(0)       uv  : vec2<f32>,
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  let c   = textureSample(tex, smp, in.uv);
  let lum = dot(c.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
  let k   = smoothstep(0.65, 2.2, lum);
  return vec4<f32>(c.rgb * k, 1.0);
}
`;

// ─── 4/5. Separable Gaussian blur ────────────────────────────────────────────

export const BLUR_FRAG_WGSL = /* wgsl */`
struct BlurDir { dir : vec2<f32>, _p : vec2<f32>, }

@group(0) @binding(0) var tex : texture_2d<f32>;
@group(0) @binding(1) var smp : sampler;
@group(0) @binding(2) var<uniform> bd : BlurDir;

struct VSOut {
  @builtin(position) clip : vec4<f32>,
  @location(0)       uv  : vec2<f32>,
}

// 9-tap Gaussian kernel
const W = array<f32, 9>(0.0625, 0.125, 0.0625, 0.125, 0.25, 0.125, 0.0625, 0.125, 0.0625);
const O = array<f32, 9>(-4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0);

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  let dims = vec2<f32>(textureDimensions(tex));
  let step_ = bd.dir / dims;
  var acc = vec4<f32>(0.0);
  for (var i : i32 = 0; i < 9; i++) {
    acc += textureSample(tex, smp, in.uv + step_ * O[i]) * W[i];
  }
  return acc;
}
`;

// ─── 6. Composite: tone-map + chromatic aberration + vignette + γ ────────────

export const COMPOSITE_FRAG_WGSL = /* wgsl */`
@group(0) @binding(0) var scene_tex : texture_2d<f32>;
@group(0) @binding(1) var bloom_tex : texture_2d<f32>;
@group(0) @binding(2) var smp       : sampler;

struct VSOut {
  @builtin(position) clip : vec4<f32>,
  @location(0)       uv  : vec2<f32>,
}

// ACES fitted tone-map (Narkowicz 2015)
fn aces(x: vec3<f32>) -> vec3<f32> {
  let a = 2.51; let b = 0.03; let c = 2.43; let d = 0.59; let e = 0.14;
  return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  // Chromatic aberration (radial, stronger at edges)
  let ca  = 0.0032;
  let off = (in.uv - 0.5) * ca;
  let r   = textureSample(scene_tex, smp, in.uv + off).r;
  let g   = textureSample(scene_tex, smp, in.uv     ).g;
  let b   = textureSample(scene_tex, smp, in.uv - off).b;
  let scene = vec3<f32>(r, g, b);

  let bloom = textureSample(bloom_tex, smp, in.uv).rgb;
  let hdr   = scene + bloom * 0.58;

  // ACES tone-map
  let ldr = aces(hdr);

  // Barrel vignette
  let uv2 = in.uv * 2.0 - 1.0;
  let vig = saturate(1.0 - dot(uv2 * 0.60, uv2 * 0.60));
  let out = ldr * vig;

  // sRGB gamma
  return vec4<f32>(pow(out, vec3<f32>(1.0 / 2.2)), 1.0);
}
`;
