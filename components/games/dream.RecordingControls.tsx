'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCapture, type CaptureResult } from '@/lib/h265-encoder';

interface Props {
  /** The overlay container — canvas is queried from this element on record start. */
  containerRef: React.RefObject<HTMLElement | null>;
}

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function RecordingControls({ containerRef }: Props) {
  const capture = useRef(new GameCapture());
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastResult, setLastResult] = useState<CaptureResult | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    return containerRef.current?.querySelector('canvas') ?? null;
  }, [containerRef]);

  const startRec = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    try {
      capture.current.start(canvas);
      setRecording(true);
      setLastResult(null);
      setElapsed(0);
      tickRef.current = setInterval(() => {
        setElapsed(capture.current.elapsedMs);
      }, 500);
    } catch {
      // canvas.captureStream not available — silently skip
    }
  }, [getCanvas]);

  const stopRec = useCallback(async () => {
    const canvas = getCanvas();
    if (!canvas) return;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    try {
      const result = await capture.current.stop(canvas);
      setRecording(false);
      setLastResult(result);
      GameCapture.download(result);
    } catch {
      setRecording(false);
    }
  }, [getCanvas]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const btnBase: React.CSSProperties = {
    background: 'rgba(3,7,18,0.72)',
    border: '1px solid rgba(160,195,240,0.20)',
    borderRadius: 999,
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    color: 'rgba(220,235,255,0.92)',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  } as React.CSSProperties;

  if (recording) {
    return (
      <>
        <span style={{ ...btnBase, color: '#f87171', borderColor: 'rgba(248,113,113,0.30)', cursor: 'default', gap: 5 }}>
          ● {fmtTime(elapsed)}
        </span>
        <button type="button" onClick={() => { void stopRec(); }} style={{ ...btnBase, borderColor: 'rgba(248,113,113,0.30)', color: '#f87171' }}>
          ■ Stop
        </button>
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={startRec} style={{ ...btnBase, borderColor: 'rgba(248,113,113,0.22)', color: 'rgba(248,113,113,0.80)' }} title="Record gameplay clip">
        ● Rec
      </button>
      {lastResult && (
        <button
          type="button"
          onClick={() => GameCapture.download(lastResult)}
          style={{ ...btnBase, borderColor: 'rgba(74,222,128,0.24)', color: '#4ade80' }}
          title={`${lastResult.codec} · ${(lastResult.blob.size / 1024 / 1024).toFixed(1)} MB`}
        >
          ↓ Clip
        </button>
      )}
    </>
  );
}
