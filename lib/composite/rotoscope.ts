/**
 * rotoscope – Frame-by-frame roto path data model.
 *
 * Inspired by Clip Studio Paint's rotoscoping workflow and Nuke's Roto node.
 *
 * Rotoscoping = tracing over live-action actors frame-by-frame to produce
 * alpha mattes or 2D animation outlines that perfectly match the performance.
 *
 * Provides:
 *   - RotoShape / RotoPath – closed bezier path on one frame
 *   - RotoLayer   – named collection of shapes with playback interpolation
 *   - RotoProject – all layers for a shot
 *   - interpolateShape  – tween a shape between two keyframes
 *   - exportShapeSVG    – export a single shape as SVG path element
 *   - exportFrameSVG    – export all visible shapes on a frame as SVG
 *   - applyFeather      – expand/contract path outline for soft alpha
 */

/** A cubic bezier control point: anchor + two tangent handles. */
export interface BezierPoint {
  /** Anchor position (normalised 0–1 screen space) */
  x: number;
  y: number;
  /** Incoming tangent (relative to anchor) */
  inTanX: number;
  inTanY: number;
  /** Outgoing tangent (relative to anchor) */
  outTanX: number;
  outTanY: number;
}

/** A closed bezier path for one frame. */
export interface RotoShape {
  /** Frame this keyframe belongs to */
  frame: number;
  points: BezierPoint[];
  /** Whether to invert this shape (cutout) */
  inverted: boolean;
  /** Feather radius in normalised units (0 = hard edge) */
  feather: number;
}

/** A named roto layer containing keyframed shapes. */
export interface RotoLayer {
  id: string;
  name: string;
  /** Opacity 0–1 */
  opacity: number;
  /** Whether this layer is visible */
  visible: boolean;
  /** Blend mode for this matte layer */
  blendMode: 'add' | 'subtract' | 'intersect';
  /** Keyframed shapes, sorted by frame */
  keyframes: RotoShape[];
}

/** The full roto project for a shot. */
export interface RotoProject {
  id: string;
  name: string;
  width: number;
  height: number;
  frameCount: number;
  fps: number;
  layers: RotoLayer[];
}

/** Result of interpolating a shape at a non-keyframe time. */
export interface InterpolatedShape {
  frame: number;
  points: BezierPoint[];
  opacity: number;
  feather: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an empty RotoProject.
 */
export function createProject(
  name: string,
  width: number,
  height: number,
  frameCount: number,
  fps = 24
): RotoProject {
  return {
    id: `roto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name, width, height, frameCount, fps, layers: [],
  };
}

/**
 * Add a layer to a project (immutable).
 */
export function addLayer(project: RotoProject, name: string): RotoProject {
  const layer: RotoLayer = {
    id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name, opacity: 1, visible: true, blendMode: 'add', keyframes: [],
  };
  return { ...project, layers: [...project.layers, layer] };
}

/**
 * Add a keyframe shape to a layer (replaces existing keyframe at same frame).
 */
export function setKeyframe(
  project: RotoProject,
  layerId: string,
  shape: RotoShape
): RotoProject {
  const layers = project.layers.map(l => {
    if (l.id !== layerId) return l;
    const kfs = l.keyframes.filter(k => k.frame !== shape.frame);
    return { ...l, keyframes: [...kfs, shape].sort((a, b) => a.frame - b.frame) };
  });
  return { ...project, layers };
}

/**
 * Remove a keyframe from a layer.
 */
export function removeKeyframe(
  project: RotoProject,
  layerId: string,
  frame: number
): RotoProject {
  const layers = project.layers.map(l =>
    l.id !== layerId ? l : { ...l, keyframes: l.keyframes.filter(k => k.frame !== frame) }
  );
  return { ...project, layers };
}

/**
 * Interpolate a layer's shape at any frame using linear interpolation between
 * the nearest surrounding keyframes. Returns null if no keyframes exist.
 */
export function interpolateShape(layer: RotoLayer, frame: number): InterpolatedShape | null {
  if (layer.keyframes.length === 0) return null;

  const kfs = layer.keyframes;
  // Exact match
  const exact = kfs.find(k => k.frame === frame);
  if (exact) return { frame, points: exact.points, opacity: layer.opacity, feather: exact.feather };

  // Clamp to first/last keyframe
  if (frame <= kfs[0].frame) return { frame, points: kfs[0].points, opacity: layer.opacity, feather: kfs[0].feather };
  if (frame >= kfs[kfs.length - 1].frame) {
    const last = kfs[kfs.length - 1];
    return { frame, points: last.points, opacity: layer.opacity, feather: last.feather };
  }

  // Find surrounding keyframes
  let lo = kfs[0], hi = kfs[kfs.length - 1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (kfs[i].frame <= frame && kfs[i + 1].frame > frame) {
      lo = kfs[i]; hi = kfs[i + 1]; break;
    }
  }

  const t = (frame - lo.frame) / (hi.frame - lo.frame);

  // Interpolate point counts must match — if they don't, return lo shape
  if (lo.points.length !== hi.points.length) {
    return { frame, points: lo.points, opacity: layer.opacity, feather: lerp(lo.feather, hi.feather, t) };
  }

  const points = lo.points.map((lp, i) => {
    const hp = hi.points[i];
    return {
      x: lerp(lp.x, hp.x, t),
      y: lerp(lp.y, hp.y, t),
      inTanX: lerp(lp.inTanX, hp.inTanX, t),
      inTanY: lerp(lp.inTanY, hp.inTanY, t),
      outTanX: lerp(lp.outTanX, hp.outTanX, t),
      outTanY: lerp(lp.outTanY, hp.outTanY, t),
    };
  });

  return { frame, points, opacity: layer.opacity, feather: lerp(lo.feather, hi.feather, t) };
}

/**
 * Export a single RotoShape as an SVG `<path>` element string.
 *
 * @param shape    Shape to export.
 * @param w        Image width (pixels) — for converting normalised coords.
 * @param h        Image height (pixels).
 */
export function exportShapeSVG(shape: RotoShape, w: number, h: number): string {
  if (shape.points.length === 0) return '';

  function px(norm: number, dim: number): string {
    return (norm * dim).toFixed(2);
  }

  const pts = shape.points;
  const first = pts[0];
  let d = `M ${px(first.x, w)} ${px(first.y, h)}`;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % pts.length];
    const cp1x = (p.x + p.outTanX) * w;
    const cp1y = (p.y + p.outTanY) * h;
    const cp2x = (next.x + next.inTanX) * w;
    const cp2y = (next.y + next.inTanY) * h;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${px(next.x, w)} ${px(next.y, h)}`;
  }

  d += ' Z';

  const fill = shape.inverted ? 'black' : 'white';
  const filter = shape.feather > 0 ? ` filter="url(#feather_${shape.frame})"` : '';
  return `<path d="${d}" fill="${fill}" opacity="1"${filter} />`;
}

/**
 * Export all visible layers at a given frame as a complete SVG document.
 */
export function exportFrameSVG(project: RotoProject, frame: number): string {
  const { width: w, height: h } = project;
  const shapePaths: string[] = [];
  const filters: string[] = [];

  for (const layer of project.layers) {
    if (!layer.visible) continue;
    const interp = interpolateShape(layer, frame);
    if (!interp || interp.points.length === 0) continue;

    if (interp.feather > 0) {
      const blur = interp.feather * Math.max(w, h);
      filters.push(
        `<filter id="feather_${frame}" x="-50%" y="-50%" width="200%" height="200%">` +
        `<feGaussianBlur in="SourceGraphic" stdDeviation="${blur.toFixed(2)}" />` +
        `</filter>`
      );
    }

    const dummyShape: RotoShape = {
      frame,
      points: interp.points,
      inverted: false,
      feather: interp.feather,
    };
    shapePaths.push(exportShapeSVG(dummyShape, w, h));
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<defs>${filters.join('')}</defs>`,
    `<rect width="${w}" height="${h}" fill="black" />`,
    ...shapePaths,
    '</svg>',
  ].join('\n');
}

/**
 * List the keyframe frames for a layer.
 */
export function keyframeList(layer: RotoLayer): number[] {
  return layer.keyframes.map(k => k.frame);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
