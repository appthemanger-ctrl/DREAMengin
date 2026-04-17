import { describe, expect, it } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers – minimal BVH fixture
// ─────────────────────────────────────────────────────────────────────────────

function makeBVH(frames = 3): string {
  // Root has 6 channels (3 pos + 3 rot), Spine has 3 channels (3 rot).
  // Total = 9 values per frame.
  const frameData = Array.from({ length: frames }, (_, f) =>
    `${f * 2} ${f} ${-f} ${f * 5} ${-f * 3} 0  ${f} ${-f} 0`
  ).join('\n');
  return `HIERARCHY
ROOT Hips
{
  OFFSET 0.00 0.00 0.00
  CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
  JOINT Spine
  {
    OFFSET 0.00 5.21 0.00
    CHANNELS 3 Zrotation Xrotation Yrotation
    End Site
    {
      OFFSET 0.00 10.00 0.00
    }
  }
}
MOTION
Frames: ${frames}
Frame Time: 0.033333
${frameData}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Motion Capture – parseBVH
// ─────────────────────────────────────────────────────────────────────────────
describe('motionCapture – parseBVH', () => {
  it('parses a valid BVH string into a MocapClip', async () => {
    const { parseBVH } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(3));
    expect(clip.root.name).toBe('Hips');
    expect(clip.frameCount).toBe(3);
    expect(clip.frameTime).toBeCloseTo(0.0333, 2);
    expect(clip.channelCount).toBe(9); // 6 root + 3 spine
    expect(clip.root.children).toHaveLength(1);
    expect(clip.root.children[0].name).toBe('Spine');
  });

  it('throws a descriptive error on invalid BVH', async () => {
    const { parseBVH } = await import('../lib/composite/motionCapture');
    expect(() => parseBVH('not a bvh file')).toThrow();
  });

  it('builds correct channelOffsets map', async () => {
    const { parseBVH } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(2));
    expect(clip.channelOffsets.get('Hips')).toBe(0);
    expect(clip.channelOffsets.get('Spine')).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Motion Capture – getFramePose
// ─────────────────────────────────────────────────────────────────────────────
describe('motionCapture – getFramePose', () => {
  it('extracts correct transforms for frame 0', async () => {
    const { parseBVH, getFramePose } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(3));
    const pose = getFramePose(clip, 0);
    expect(pose.frame).toBe(0);
    expect(pose.joints.find(j => j.jointName === 'Hips')?.translation).toEqual([0, 0, 0]);
  });

  it('extracts different translation for frame 2', async () => {
    const { parseBVH, getFramePose } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(3));
    const p0 = getFramePose(clip, 0);
    const p2 = getFramePose(clip, 2);
    const t0 = p0.joints.find(j => j.jointName === 'Hips')!.translation;
    const t2 = p2.joints.find(j => j.jointName === 'Hips')!.translation;
    // Frame 0: [0,0,0], Frame 2: [4,2,-2] — at least one axis must differ
    const differs = t0.some((v, i) => v !== t2[i]);
    expect(differs).toBe(true);
  });

  it('clamps out-of-bounds frames to valid range', async () => {
    const { parseBVH, getFramePose } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(3));
    expect(getFramePose(clip, -10).frame).toBe(0);
    expect(getFramePose(clip, 999).frame).toBe(2);
  });

  it('returns one joint transform per joint in the skeleton', async () => {
    const { parseBVH, getFramePose } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(2));
    const pose = getFramePose(clip, 0);
    expect(pose.joints).toHaveLength(2); // Hips + Spine
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Motion Capture – retargetClip + exportBVH + clipSummary
// ─────────────────────────────────────────────────────────────────────────────
describe('motionCapture – retargetClip', () => {
  it('scales positional channels proportionally', async () => {
    const { parseBVH, getFramePose, retargetClip } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(2));
    const orig = getFramePose(clip, 1).joints.find(j => j.jointName === 'Hips')!.translation;
    const scaled = retargetClip(clip, 2.0);
    const res = getFramePose(scaled, 1).joints.find(j => j.jointName === 'Hips')!.translation;
    if (orig[0] !== 0) expect(res[0]).toBeCloseTo(orig[0] * 2, 3);
    if (orig[1] !== 0) expect(res[1]).toBeCloseTo(orig[1] * 2, 3);
  });

  it('scale=1.0 produces identical motion data', async () => {
    const { parseBVH, retargetClip } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(2));
    const scaled = retargetClip(clip, 1.0);
    expect(scaled.motion).toEqual(clip.motion);
  });
});

describe('motionCapture – exportBVH', () => {
  it('produces a round-trip parseable BVH string', async () => {
    const { parseBVH, exportBVH } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(3));
    const exported = exportBVH(clip);
    const reparse = parseBVH(exported);
    expect(reparse.root.name).toBe('Hips');
    expect(reparse.frameCount).toBe(3);
    expect(reparse.channelCount).toBe(clip.channelCount);
  });

  it('contains HIERARCHY and MOTION sections', async () => {
    const { parseBVH, exportBVH } = await import('../lib/composite/motionCapture');
    const text = exportBVH(parseBVH(makeBVH(2)));
    expect(text).toContain('HIERARCHY');
    expect(text).toContain('MOTION');
    expect(text).toContain('Frame Time:');
  });
});

describe('motionCapture – clipSummary', () => {
  it('returns correct joint count and duration', async () => {
    const { parseBVH, clipSummary } = await import('../lib/composite/motionCapture');
    const clip = parseBVH(makeBVH(30));
    const s = clipSummary(clip);
    expect(s.jointCount).toBe(2);
    expect(s.frameCount).toBe(30);
    expect(s.durationSeconds).toBeCloseTo(30 * 0.0333, 0);
    expect(s.fps).toBeCloseTo(30, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Compositor – node graph
// ─────────────────────────────────────────────────────────────────────────────
describe('compositor – node graph', () => {
  it('creates a node with correct defaults', async () => {
    const { createNode } = await import('../lib/composite/compositor');
    const n = createNode('Over', 'My Over');
    expect(n.type).toBe('Over');
    expect(n.label).toBe('My Over');
    expect(n.enabled).toBe(true);
    expect(n.inputs).toHaveProperty('A');
    expect(n.inputs).toHaveProperty('B');
    expect(n.params.find(p => p.name === 'mix')?.value).toBe(1.0);
  });

  it('addNode appends to nodes array', async () => {
    const { createGraph, createNode, addNode } = await import('../lib/composite/compositor');
    let g = createGraph('Test');
    const n = createNode('MediaIn');
    g = addNode(g, n);
    expect(g.nodes).toHaveLength(1);
  });

  it('connectNodes wires input slot', async () => {
    const { createGraph, createNode, addNode, connectNodes } = await import('../lib/composite/compositor');
    let g = createGraph();
    const a = createNode('MediaIn', 'A');
    const b = createNode('MediaIn', 'B');
    const over = createNode('Over', 'Over');
    g = addNode(g, a); g = addNode(g, b); g = addNode(g, over);
    g = connectNodes(g, a.id, over.id, 'A');
    expect(g.nodes.find(n => n.id === over.id)?.inputs['A']).toBe(a.id);
  });

  it('disconnectInput removes connection', async () => {
    const { createGraph, createNode, addNode, connectNodes, disconnectInput } = await import('../lib/composite/compositor');
    let g = createGraph();
    const a = createNode('MediaIn');
    const over = createNode('Over');
    g = addNode(g, a); g = addNode(g, over);
    g = connectNodes(g, a.id, over.id, 'A');
    g = disconnectInput(g, over.id, 'A');
    expect(g.nodes.find(n => n.id === over.id)?.inputs['A']).toBeNull();
  });

  it('setParam updates parameter value', async () => {
    const { createGraph, createNode, addNode, setParam } = await import('../lib/composite/compositor');
    let g = createGraph();
    const n = createNode('ColorCorrect');
    g = addNode(g, n);
    g = setParam(g, n.id, 'saturation', 2.5);
    expect(g.nodes.find(x => x.id === n.id)?.params.find(p => p.name === 'saturation')?.value).toBe(2.5);
  });

  it('topologicalSort orders source before sink', async () => {
    const { createGraph, createNode, addNode, connectNodes, topologicalSort } = await import('../lib/composite/compositor');
    let g = createGraph();
    const src = createNode('MediaIn', 'Source');
    const out = createNode('Output', 'Output');
    g = addNode(g, src); g = addNode(g, out);
    g = connectNodes(g, src.id, out.id, 'input');
    const order = topologicalSort(g.nodes);
    expect(order.indexOf(src.id)).toBeLessThan(order.indexOf(out.id));
  });

  it('graphSummary returns a non-empty string', async () => {
    const { createGraph, createNode, addNode, graphSummary } = await import('../lib/composite/compositor');
    let g = createGraph('My Comp');
    g = addNode(g, createNode('MediaIn'));
    expect(graphSummary(g).length).toBeGreaterThan(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rotoscope
// ─────────────────────────────────────────────────────────────────────────────
describe('rotoscope', () => {
  it('createProject returns empty layer list', async () => {
    const { createProject } = await import('../lib/composite/rotoscope');
    const p = createProject('Test', 1920, 1080, 100, 24);
    expect(p.layers).toHaveLength(0);
    expect(p.frameCount).toBe(100);
  });

  it('addLayer appends a visible layer', async () => {
    const { createProject, addLayer } = await import('../lib/composite/rotoscope');
    const p = addLayer(createProject('Test', 1920, 1080, 50, 24), 'Actor A');
    expect(p.layers).toHaveLength(1);
    expect(p.layers[0].name).toBe('Actor A');
    expect(p.layers[0].visible).toBe(true);
  });

  it('setKeyframe stores shape on the correct frame', async () => {
    const { createProject, addLayer, setKeyframe } = await import('../lib/composite/rotoscope');
    let p = addLayer(createProject('T', 1920, 1080, 50, 24), 'Actor');
    const layerId = p.layers[0].id;
    const shape = { frame: 10, points: [], inverted: false, feather: 0 };
    p = setKeyframe(p, layerId, shape);
    expect(p.layers[0].keyframes).toHaveLength(1);
    expect(p.layers[0].keyframes[0].frame).toBe(10);
  });

  it('interpolateShape returns null when no keyframes exist', async () => {
    const { createProject, addLayer, interpolateShape } = await import('../lib/composite/rotoscope');
    const p = addLayer(createProject('T', 1920, 1080, 50, 24), 'Empty');
    expect(interpolateShape(p.layers[0], 5)).toBeNull();
  });

  it('interpolateShape returns exact keyframe points at a keyframe', async () => {
    const { createProject, addLayer, setKeyframe, interpolateShape } = await import('../lib/composite/rotoscope');
    let p = addLayer(createProject('T', 1920, 1080, 50, 24), 'Layer');
    const id = p.layers[0].id;
    const pts = [{ x: 0.3, y: 0.4, inTanX: 0, inTanY: 0, outTanX: 0, outTanY: 0 }];
    p = setKeyframe(p, id, { frame: 0, points: pts, inverted: false, feather: 0 });
    const interp = interpolateShape(p.layers[0], 0)!;
    expect(interp.points[0].x).toBeCloseTo(0.3);
  });

  it('interpolateShape tweens between two keyframes', async () => {
    const { createProject, addLayer, setKeyframe, interpolateShape } = await import('../lib/composite/rotoscope');
    let p = addLayer(createProject('T', 1920, 1080, 50, 24), 'L');
    const id = p.layers[0].id;
    const pt0 = { x: 0.0, y: 0.0, inTanX: 0, inTanY: 0, outTanX: 0, outTanY: 0 };
    const pt1 = { x: 1.0, y: 1.0, inTanX: 0, inTanY: 0, outTanX: 0, outTanY: 0 };
    p = setKeyframe(p, id, { frame: 0, points: [pt0], inverted: false, feather: 0 });
    p = setKeyframe(p, id, { frame: 10, points: [pt1], inverted: false, feather: 0 });
    const mid = interpolateShape(p.layers[0], 5)!;
    expect(mid.points[0].x).toBeCloseTo(0.5);
    expect(mid.points[0].y).toBeCloseTo(0.5);
  });

  it('removeKeyframe removes the keyframe from the layer', async () => {
    const { createProject, addLayer, setKeyframe, removeKeyframe } = await import('../lib/composite/rotoscope');
    let p = addLayer(createProject('T', 1920, 1080, 50, 24), 'L');
    const id = p.layers[0].id;
    p = setKeyframe(p, id, { frame: 5, points: [], inverted: false, feather: 0 });
    p = removeKeyframe(p, id, 5);
    expect(p.layers[0].keyframes).toHaveLength(0);
  });

  it('exportShapeSVG produces an SVG path string', async () => {
    const { exportShapeSVG } = await import('../lib/composite/rotoscope');
    const shape = {
      frame: 0, inverted: false, feather: 0,
      points: [
        { x: 0.5, y: 0.4, inTanX: -0.05, inTanY: 0, outTanX: 0.05, outTanY: 0 },
        { x: 0.6, y: 0.5, inTanX: 0, inTanY: -0.05, outTanX: 0, outTanY: 0.05 },
        { x: 0.5, y: 0.6, inTanX: 0.05, inTanY: 0, outTanX: -0.05, outTanY: 0 },
      ],
    };
    const svg = exportShapeSVG(shape, 1920, 1080);
    expect(svg).toContain('<path');
    expect(svg).toContain(' Z');
  });

  it('keyframeList returns sorted frame numbers', async () => {
    const { createProject, addLayer, setKeyframe, keyframeList } = await import('../lib/composite/rotoscope');
    let p = addLayer(createProject('T', 1920, 1080, 50, 24), 'L');
    const id = p.layers[0].id;
    p = setKeyframe(p, id, { frame: 20, points: [], inverted: false, feather: 0 });
    p = setKeyframe(p, id, { frame: 5, points: [], inverted: false, feather: 0 });
    expect(keyframeList(p.layers[0])).toEqual([5, 20]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FX Simulation
// ─────────────────────────────────────────────────────────────────────────────
describe('fxSimulation', () => {
  it('FX_PRESETS covers all 6 categories', async () => {
    const { allCategories, FX_PRESETS } = await import('../lib/composite/fxSimulation');
    const cats = allCategories();
    expect(cats).toContain('fire');
    expect(cats).toContain('water');
    expect(cats).toContain('destruction');
    expect(cats).toContain('smoke');
    expect(cats).toContain('particles');
    expect(cats).toContain('fabric');
    expect(FX_PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it('presetsByCategory returns only presets of that category', async () => {
    const { presetsByCategory } = await import('../lib/composite/fxSimulation');
    const fire = presetsByCategory('fire');
    expect(fire.every(p => p.category === 'fire')).toBe(true);
    expect(fire.length).toBeGreaterThanOrEqual(1);
  });

  it('createSimulation creates idle sim with correct presetId', async () => {
    const { createSimulation } = await import('../lib/composite/fxSimulation');
    const sim = createSimulation('fire_campfire', 'My Fire', 10, 30);
    expect(sim.state).toBe('idle');
    expect(sim.presetId).toBe('fire_campfire');
    expect(sim.durationSeconds).toBe(10);
    expect(sim.fps).toBe(30);
  });

  it('createSimulation throws for unknown preset id', async () => {
    const { createSimulation } = await import('../lib/composite/fxSimulation');
    expect(() => createSimulation('not_a_real_preset')).toThrow();
  });

  it('setSimParam overrides a parameter', async () => {
    const { createSimulation, setSimParam, getSimParam } = await import('../lib/composite/fxSimulation');
    const sim = createSimulation('fire_campfire');
    const updated = setSimParam(sim, 'intensity', 0.99);
    expect(getSimParam(updated, 'intensity')).toBe(0.99);
  });

  it('getSimParam returns preset default when not overridden', async () => {
    const { createSimulation, getSimParam } = await import('../lib/composite/fxSimulation');
    const sim = createSimulation('fire_campfire');
    expect(getSimParam(sim, 'intensity')).toBe(0.6);
  });

  it('resetSimParams clears all overrides', async () => {
    const { createSimulation, setSimParam, resetSimParams } = await import('../lib/composite/fxSimulation');
    let sim = createSimulation('fire_campfire');
    sim = setSimParam(sim, 'intensity', 0.99);
    const reset = resetSimParams(sim);
    expect(Object.keys(reset.overrides)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Matchmover
// ─────────────────────────────────────────────────────────────────────────────
describe('matchmover', () => {
  it('createTrack returns empty unsolved track', async () => {
    const { createTrack } = await import('../lib/composite/matchmover');
    const t = createTrack('Shot 001', 1920, 1080, 100, 24);
    expect(t.trackPoints).toHaveLength(0);
    expect(t.isSolved).toBe(false);
    expect(t.width).toBe(1920);
  });

  it('addTrackPoint appends a named point', async () => {
    const { createTrack, addTrackPoint } = await import('../lib/composite/matchmover');
    const t = addTrackPoint(createTrack('S', 1920, 1080, 100), 'Corner A');
    expect(t.trackPoints).toHaveLength(1);
    expect(t.trackPoints[0].name).toBe('Corner A');
    expect(t.trackPoints[0].samples).toHaveLength(0);
  });

  it('addSample appends and sorts samples by frame', async () => {
    const { createTrack, addTrackPoint, addSample } = await import('../lib/composite/matchmover');
    let t = addTrackPoint(createTrack('S', 1920, 1080, 100), 'Pt');
    const id = t.trackPoints[0].id;
    t = addSample(t, id, { frame: 10, x: 0.5, y: 0.3, confidence: 0.9 });
    t = addSample(t, id, { frame: 0, x: 0.4, y: 0.2, confidence: 0.95 });
    expect(t.trackPoints[0].samples[0].frame).toBe(0); // sorted
  });

  it('estimateCameraMotion returns motion estimates for tracked points', async () => {
    const { createTrack, addTrackPoint, addSample, estimateCameraMotion } = await import('../lib/composite/matchmover');
    let t = addTrackPoint(createTrack('S', 1920, 1080, 100), 'Pt');
    const id = t.trackPoints[0].id;
    t = addSample(t, id, { frame: 0, x: 0.1, y: 0.1, confidence: 1 });
    t = addSample(t, id, { frame: 1, x: 0.2, y: 0.15, confidence: 1 });
    t = addSample(t, id, { frame: 2, x: 0.35, y: 0.2, confidence: 1 });
    const estimates = estimateCameraMotion(t);
    expect(estimates.length).toBeGreaterThan(0);
    expect(estimates[0].speed).toBeGreaterThan(0);
  });

  it('exportTrackCSV contains header and sample rows', async () => {
    const { createTrack, addTrackPoint, addSample, exportTrackCSV } = await import('../lib/composite/matchmover');
    let t = addTrackPoint(createTrack('S', 1920, 1080, 100), 'Wall');
    const id = t.trackPoints[0].id;
    t = addSample(t, id, { frame: 0, x: 0.5, y: 0.5, confidence: 0.95 });
    const csv = exportTrackCSV(t);
    expect(csv).toContain('pointName,frame,x,y,confidence');
    expect(csv).toContain('Wall,0');
  });

  it('trackSummary returns a non-empty descriptive string', async () => {
    const { createTrack, trackSummary } = await import('../lib/composite/matchmover');
    const s = trackSummary(createTrack('Shot 001', 1920, 1080, 100, 24));
    expect(s).toContain('Shot 001');
    expect(s).toContain('Unsolved');
  });

  it('computeHomography returns a 9-element array', async () => {
    const { computeHomography } = await import('../lib/composite/matchmover');
    const src: [[number,number],[number,number],[number,number],[number,number]] = [
      [0, 0], [1, 0], [1, 1], [0, 1],
    ];
    const dst: [[number,number],[number,number],[number,number],[number,number]] = [
      [0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9],
    ];
    const H = computeHomography(src, dst);
    expect(H).toHaveLength(9);
    // Bottom-right element of a normalised homography is 1
    expect(H[8]).toBeCloseTo(1, 1);
  });
});
