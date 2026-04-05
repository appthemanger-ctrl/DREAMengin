/**
 * motionCapture – BVH motion capture data model and parser.
 *
 * Inspired by Autodesk MotionBuilder's core data representation.
 * Supports the BVH (Biovision Hierarchy) file format, the universal
 * interchange format for motion-capture data.
 *
 * Features:
 *   - parseBVH        – parse a BVH string into a MocapClip
 *   - getFramePose    – extract joint transforms for a specific frame
 *   - retargetClip    – proportional bone-length retargeting
 *   - exportBVH       – round-trip back to BVH text
 *   - clipSummary     – human-readable clip metadata
 */

export interface Joint {
  name: string;
  /** Local offset from parent joint in rest pose (cm) */
  offset: [number, number, number];
  /** Channel order e.g. ['Xposition','Yposition','Zposition','Zrotation','Xrotation','Yrotation'] */
  channels: string[];
  children: Joint[];
}

export interface MocapClip {
  /** Root joint (skeleton hierarchy) */
  root: Joint;
  /** Total number of frames */
  frameCount: number;
  /** Duration of each frame in seconds */
  frameTime: number;
  /**
   * Motion data flat array.
   * Frame F, channel C is at: F * channelCount + channelOffsets[joint] + c
   */
  motion: number[];
  /** Total number of channels per frame */
  channelCount: number;
  /** Map from joint name → starting channel index within a single frame slice */
  channelOffsets: Map<string, number>;
}

export interface JointTransform {
  jointName: string;
  /** Translation (X, Y, Z) in cm */
  translation: [number, number, number];
  /** Euler rotation in degrees */
  rotation: [number, number, number];
}

export interface FramePose {
  frame: number;
  joints: JointTransform[];
}

export interface ClipSummary {
  frameCount: number;
  durationSeconds: number;
  fps: number;
  jointCount: number;
  channelCount: number;
  jointNames: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a BVH file string into a MocapClip.
 * Throws a descriptive error on malformed input.
 */
export function parseBVH(bvhText: string): MocapClip {
  const lines = bvhText.replace(/\r\n/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  let i = 0;

  function consume(keyword: string) {
    if (!lines[i]?.toUpperCase().startsWith(keyword.toUpperCase())) {
      throw new Error(`BVH parse: expected "${keyword}", got "${lines[i]}" at line ${i}`);
    }
    i++;
  }

  function parseJoint(isRoot: boolean): Joint {
    const nameParts = lines[i].split(/\s+/);
    const name = nameParts[1] ?? 'unknown';
    i++;
    consume('{');

    let offset: [number, number, number] = [0, 0, 0];
    let channels: string[] = [];
    const children: Joint[] = [];

    while (i < lines.length && !lines[i].startsWith('}')) {
      const upper = lines[i].toUpperCase();
      if (upper.startsWith('OFFSET')) {
        const p = lines[i].split(/\s+/);
        offset = [parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])];
        i++;
      } else if (upper.startsWith('CHANNELS')) {
        const p = lines[i].split(/\s+/);
        channels = p.slice(2, 2 + parseInt(p[1], 10));
        i++;
      } else if (upper.startsWith('JOINT')) {
        children.push(parseJoint(false));
      } else if (upper.startsWith('END')) {
        // "End Site" block
        i++;
        consume('{');
        while (i < lines.length && !lines[i].startsWith('}')) i++;
        i++; // consume '}'
      } else {
        i++;
      }
    }
    i++; // consume '}'

    return { name, offset, channels, children };
  }

  consume('HIERARCHY');
  if (!lines[i]?.toUpperCase().startsWith('ROOT')) {
    throw new Error('BVH parse: expected ROOT joint after HIERARCHY');
  }
  const root = parseJoint(true);

  consume('MOTION');
  const frameCount = parseInt(lines[i++].split(/\s+/)[1], 10);
  const frameTime = parseFloat(lines[i++].split(/\s+/)[2]);

  // Build channel offset map (joint name → index within a single frame)
  const channelOffsets = new Map<string, number>();
  let channelCount = 0;
  function indexJoint(j: Joint) {
    channelOffsets.set(j.name, channelCount);
    channelCount += j.channels.length;
    for (const child of j.children) indexJoint(child);
  }
  indexJoint(root);

  // Parse frame data
  const motion: number[] = [];
  for (let f = 0; f < frameCount && i < lines.length; f++, i++) {
    const values = lines[i].split(/\s+/).map(Number);
    motion.push(...values);
  }

  return { root, frameCount, frameTime, motion, channelCount, channelOffsets };
}

/**
 * Extract all joint transforms for a given frame index.
 */
export function getFramePose(clip: MocapClip, frame: number): FramePose {
  const f = Math.max(0, Math.min(frame, clip.frameCount - 1));
  const frameStart = f * clip.channelCount;
  const joints: JointTransform[] = [];

  function extract(j: Joint) {
    const off = clip.channelOffsets.get(j.name) ?? 0;
    let tx = 0, ty = 0, tz = 0, rx = 0, ry = 0, rz = 0;
    for (let c = 0; c < j.channels.length; c++) {
      const ch = j.channels[c].toLowerCase();
      const val = clip.motion[frameStart + off + c] ?? 0;
      if (ch === 'xposition') tx = val;
      else if (ch === 'yposition') ty = val;
      else if (ch === 'zposition') tz = val;
      else if (ch === 'xrotation') rx = val;
      else if (ch === 'yrotation') ry = val;
      else if (ch === 'zrotation') rz = val;
    }
    joints.push({ jointName: j.name, translation: [tx, ty, tz], rotation: [rx, ry, rz] });
    for (const child of j.children) extract(child);
  }
  extract(clip.root);
  return { frame: f, joints };
}

/**
 * Proportional retargeting: scale all positional channels by `scaleFactor`.
 *
 * Example: apply a 180 cm capture to a 90 cm character with scaleFactor = 0.5.
 */
export function retargetClip(clip: MocapClip, scaleFactor: number): MocapClip {
  const scaled = Float64Array.from(clip.motion);

  function scaleJoint(j: Joint) {
    const off = clip.channelOffsets.get(j.name) ?? 0;
    for (let f = 0; f < clip.frameCount; f++) {
      const base = f * clip.channelCount + off;
      for (let c = 0; c < j.channels.length; c++) {
        if (j.channels[c].toLowerCase().endsWith('position')) {
          scaled[base + c] *= scaleFactor;
        }
      }
    }
    for (const child of j.children) scaleJoint(child);
  }
  scaleJoint(clip.root);

  return { ...clip, motion: Array.from(scaled) };
}

/**
 * Re-export a MocapClip to BVH text (round-trip).
 */
export function exportBVH(clip: MocapClip): string {
  const out: string[] = ['HIERARCHY'];

  function writeJoint(j: Joint, depth: number, isRoot: boolean) {
    const p = '  '.repeat(depth);
    out.push(`${p}${isRoot ? 'ROOT' : 'JOINT'} ${j.name}`);
    out.push(`${p}{`);
    out.push(`${p}  OFFSET ${j.offset.join(' ')}`);
    if (j.channels.length > 0) {
      out.push(`${p}  CHANNELS ${j.channels.length} ${j.channels.join(' ')}`);
    }
    if (j.children.length === 0) {
      out.push(`${p}  End Site\n${p}  {\n${p}    OFFSET 0.00 0.00 0.00\n${p}  }`);
    } else {
      for (const child of j.children) writeJoint(child, depth + 1, false);
    }
    out.push(`${p}}`);
  }

  writeJoint(clip.root, 0, true);
  out.push('MOTION');
  out.push(`Frames: ${clip.frameCount}`);
  out.push(`Frame Time: ${clip.frameTime.toFixed(6)}`);

  for (let f = 0; f < clip.frameCount; f++) {
    const start = f * clip.channelCount;
    out.push(clip.motion.slice(start, start + clip.channelCount).join(' '));
  }

  return out.join('\n');
}

/**
 * Return a human-readable summary of the clip.
 */
export function clipSummary(clip: MocapClip): ClipSummary {
  const jointNames: string[] = [];
  function collect(j: Joint) { jointNames.push(j.name); j.children.forEach(collect); }
  collect(clip.root);
  return {
    frameCount: clip.frameCount,
    durationSeconds: +(clip.frameCount * clip.frameTime).toFixed(3),
    fps: +(1 / clip.frameTime).toFixed(2),
    jointCount: jointNames.length,
    channelCount: clip.channelCount,
    jointNames,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────────────

export function findJoint(root: Joint, name: string): Joint | null {
  if (root.name === name) return root;
  for (const child of root.children) {
    const found = findJoint(child, name);
    if (found) return found;
  }
  return null;
}
