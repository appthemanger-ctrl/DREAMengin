'use client';

/**
 * AudioVisualizer3D — Babylon.js 3D audio visualiser
 *
 * - FFT bars rendered as 3D cylinders in Babylon.js scene
 * - Real-time update from Web Audio AnalyserNode
 * - Tap a bar → apply BiquadFilterNode (bandpass) on that frequency
 * - Optional MediaRecorder capture of filtered output
 * - Hotspot overlay from peak map fingerprint data
 * - Tap hotspot → matchFingerprint + extractAudioChunks → emit stem event
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { PeakMap, Fingerprint, MatchResult } from '../lib/audioFingerprint';
import {
  recordReferenceFingerprint,
  matchFingerprint,
  extractAudioChunks,
} from '../lib/audioFingerprint';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AudioVisualizer3DProps {
  /** Connected AnalyserNode for real-time FFT data. */
  analyser: AnalyserNode;
  /** Optional peak map for hotspot overlays. */
  peakMap?: PeakMap;
  /** Called when a stem has been extracted from a hotspot tap. */
  onStemExtracted?: (stem: AudioBuffer, matches: MatchResult[]) => void;
  /** Source AudioBuffer for stem extraction (needed for extractAudioChunks). */
  sourceBuffer?: AudioBuffer;
  /** Number of FFT bars to display (default 64). */
  barCount?: number;
  className?: string;
}

interface Hotspot {
  frequencyHz: number;
  binIndex: number;
  timeSlice: number;
  x: number;   // canvas % position
  y: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AudioVisualizer3D({
  analyser,
  peakMap,
  onStemExtracted,
  sourceBuffer,
  barCount = 64,
  className = '',
}: AudioVisualizer3DProps) {
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const babylonRef       = useRef<{
    engine: import('@babylonjs/core').Engine | null;
    scene: import('@babylonjs/core').Scene | null;
    bars: import('@babylonjs/core').Mesh[];
    filterNode: BiquadFilterNode | null;
    mediaRecorder: MediaRecorder | null;
  }>({ engine: null, scene: null, bars: [], filterNode: null, mediaRecorder: null });

  const [isRecording, setIsRecording]         = useState(false);
  const [activeBin,   setActiveBin]           = useState<number | null>(null);
  const [hotspots,    setHotspots]            = useState<Hotspot[]>([]);
  const animFrameRef = useRef<number>(0);

  // ── Build hotspots from peak map ──
  useEffect(() => {
    if (!peakMap) { setHotspots([]); return; }
    // Show top-20 peaks as hotspots
    const sorted = [...peakMap.peaks].sort((a, b) => b.magnitude - a.magnitude).slice(0, 20);
    const spots: Hotspot[] = sorted.map((p) => ({
      frequencyHz: p.frequencyHz,
      binIndex:    p.binIndex,
      timeSlice:   p.timeSlice,
      x:           (p.binIndex / (peakMap.fftSize / 2)) * 100,
      y:           100 - (p.timeSlice / Math.max(peakMap.totalSlices, 1)) * 100,
    }));
    setHotspots(spots);
  }, [peakMap]);

  // ── Babylon init ──
  useEffect(() => {
    let mounted = true;

    async function initBabylon() {
      const canvas = canvasRef.current;
      if (!canvas || !mounted) return;

      // Dynamic import to keep initial bundle lean
      const { Engine, Scene, HemisphericLight, Vector3, MeshBuilder,
              StandardMaterial, Color3, ArcRotateCamera } =
        await import('@babylonjs/core');

      const engine = new Engine(canvas, true, { preserveDrawingBuffer: true });
      const scene  = new Scene(engine);
      scene.clearColor = { r: 0.05, g: 0.05, b: 0.1, a: 1 } as unknown as import('@babylonjs/core').Color4;

      // Camera
      const camera = new ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3, 30, Vector3.Zero(), scene);
      camera.lowerRadiusLimit = 10;
      camera.upperRadiusLimit = 80;
      camera.attachControl(canvas, true);

      // Light
      new HemisphericLight('light', new Vector3(0, 1, 0), scene);

      // Build bars
      const bars: import('@babylonjs/core').Mesh[] = [];
      const spacing = 0.6;
      const totalW  = barCount * spacing;

      for (let i = 0; i < barCount; i++) {
        const bar = MeshBuilder.CreateCylinder(
          `bar_${i}`,
          { diameter: 0.4, height: 1, tessellation: 8 },
          scene
        );
        bar.position.x = i * spacing - totalW / 2;
        bar.position.y = 0.5;

        const mat        = new StandardMaterial(`mat_${i}`, scene);
        const hue        = (i / barCount) * 360;
        mat.diffuseColor = Color3.FromHSV(hue, 0.9, 0.95);
        bar.material     = mat;

        // Tap to filter
        bar.actionManager = null; // Pointer events handled via canvas click below
        bars.push(bar);
      }

      babylonRef.current.engine = engine;
      babylonRef.current.scene  = scene;
      babylonRef.current.bars   = bars;

      if (!mounted) { engine.dispose(); return; }

      engine.runRenderLoop(() => scene.render());
      window.addEventListener('resize', () => engine.resize());
    }

    initBabylon();
    return () => {
      mounted = false;
      cancelAnimationFrame(animFrameRef.current);
      babylonRef.current.engine?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barCount]);

  // ── Real-time FFT update loop ──
  useEffect(() => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);
    const step         = Math.floor(bufferLength / barCount);

    function update() {
      animFrameRef.current = requestAnimationFrame(update);
      analyser.getByteFrequencyData(dataArray);

      const { bars } = babylonRef.current;
      for (let i = 0; i < barCount; i++) {
        const value  = dataArray[i * step] / 255;
        const height = Math.max(0.1, value * 20);
        const bar    = bars[i];
        if (!bar) continue;
        bar.scaling.y     = height;
        bar.position.y    = height / 2;
      }
    }

    animFrameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [analyser, barCount]);

  // ── Bar tap → BiquadFilter ──
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect    = canvas.getBoundingClientRect();
      const relX    = (e.clientX - rect.left) / rect.width;
      const binIdx  = Math.floor(relX * barCount);
      setActiveBin(binIdx);

      const nyquist  = analyser.context.sampleRate / 2;
      const freqHz   = (binIdx / barCount) * nyquist;

      // Create / update BiquadFilterNode
      const ctx      = analyser.context;
      const oldFilter = babylonRef.current.filterNode;
      if (oldFilter) oldFilter.disconnect();

      const filter       = ctx.createBiquadFilter();
      filter.type        = 'bandpass';
      filter.frequency.value = freqHz;
      filter.Q.value     = 5;
      analyser.connect(filter);
      filter.connect(ctx.destination);
      babylonRef.current.filterNode = filter;
    },
    [analyser, barCount]
  );

  // ── Recording toggle ──
  const toggleRecording = useCallback(() => {
    const { filterNode } = babylonRef.current;
    if (!filterNode) return;

    if (isRecording) {
      babylonRef.current.mediaRecorder?.stop();
      setIsRecording(false);
      return;
    }

    const dest   = filterNode.context.createMediaStreamDestination();
    filterNode.connect(dest);
    const rec    = new MediaRecorder(dest.stream);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'filtered_stem.webm';
      a.click();
    };
    rec.start();
    babylonRef.current.mediaRecorder = rec;
    setIsRecording(true);
  }, [isRecording]);

  // ── Hotspot tap → fingerprint match + stem extract ──
  const handleHotspotTap = useCallback(
    async (hotspot: Hotspot) => {
      if (!peakMap || !sourceBuffer) return;
      const startTime  = hotspot.timeSlice * peakMap.sliceDurationSec;
      const endTime    = startTime + 2; // 2-second window
      const fingerprint: Fingerprint = recordReferenceFingerprint(peakMap, startTime, endTime);
      const matches    = matchFingerprint(fingerprint, peakMap, 0.75);
      const stem       = extractAudioChunks(sourceBuffer, matches);
      onStemExtracted?.(stem, matches);
    },
    [peakMap, sourceBuffer, onStemExtracted]
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: 320 }}>
      {/* Babylon canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onClick={handleCanvasClick}
        style={{ background: '#0d0d1a', borderRadius: 12 }}
      />

      {/* Hotspot overlay */}
      {hotspots.map((hs, i) => (
        <button
          key={i}
          onClick={() => handleHotspotTap(hs)}
          title={`${Math.round(hs.frequencyHz)} Hz — tap to extract stem`}
          style={{
            position: 'absolute',
            left:     `${hs.x}%`,
            top:      `${hs.y}%`,
            transform: 'translate(-50%,-50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#fbbf24',
            border: '2px solid #fff',
            cursor: 'pointer',
            opacity: 0.85,
            zIndex: 10,
          }}
        />
      ))}

      {/* Controls bar */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-3 px-3 py-2 rounded-lg"
           style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
        <span className="text-xs text-white/70 flex-1">
          {activeBin !== null
            ? `Filtering bin #${activeBin} (~${Math.round((activeBin / barCount) * (analyser.context.sampleRate / 2))} Hz)`
            : 'Tap a bar to isolate frequency'}
        </span>
        <button
          onClick={toggleRecording}
          className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
            isRecording
              ? 'bg-red-500 text-white'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          {isRecording ? '⏹ Stop' : '⏺ Record'}
        </button>
      </div>
    </div>
  );
}

export default AudioVisualizer3D;
