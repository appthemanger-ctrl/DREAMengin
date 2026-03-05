'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Pause, Trash2, Download } from 'lucide-react';

type RecorderState = 'idle' | 'recording' | 'recorded';

interface Recording {
  url: string;
  name: string;
  durationMs: number;
  blob: Blob;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function SoundRecorder() {
  const [state, setState]           = useState<RecorderState>('idle');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [elapsed, setElapsed]       = useState(0);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const chunksRef    = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElsRef  = useRef<Map<number, HTMLAudioElement>>(new Map());

  /* draw live waveform */
  const drawWave = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(buf);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(220,68,68,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceW = canvas.width / buf.length;
    let x = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i] / 128 - 1;
      const y = (v * canvas.height) / 2 + canvas.height / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceW;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    animFrameRef.current = requestAnimationFrame(drawWave);
  }, []);

  /* start recording */
  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const durationMs = Date.now() - startTimeRef.current;
        setRecordings((prev) => [...prev, { url, name: `Take ${prev.length + 1}`, durationMs, blob }]);
        setState('recorded');
        if (timerRef.current) clearInterval(timerRef.current);
        cancelAnimationFrame(animFrameRef.current);

        // draw idle flat line
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(42,138,184,0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
          }
        }
      };

      mr.start(100);
      mediaRecRef.current = mr;
      startTimeRef.current = Date.now();
      setState('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 200);
      drawWave();
    } catch {
      setError('Microphone access denied. Please allow mic access and try again.');
    }
  }, [drawWave]);

  /* stop recording */
  const stopRecording = useCallback(() => {
    mediaRecRef.current?.stop();
  }, []);

  /* play / pause */
  const togglePlay = useCallback((idx: number, url: string) => {
    if (playingIdx === idx) {
      audioElsRef.current.get(idx)?.pause();
      setPlayingIdx(null);
    } else {
      audioElsRef.current.forEach((el) => el.pause());
      let el = audioElsRef.current.get(idx);
      if (!el) {
        el = new Audio(url);
        el.onended = () => setPlayingIdx(null);
        audioElsRef.current.set(idx, el);
      }
      el.currentTime = 0;
      el.play().catch(() => {});
      setPlayingIdx(idx);
    }
  }, [playingIdx]);

  /* delete */
  const deleteRecording = useCallback((idx: number) => {
    setRecordings((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].url);
      next.splice(idx, 1);
      return next;
    });
    if (playingIdx === idx) setPlayingIdx(null);
    audioElsRef.current.get(idx)?.pause();
    audioElsRef.current.delete(idx);
  }, [playingIdx]);

  /* download */
  const download = useCallback((rec: Recording) => {
    const a = document.createElement('a');
    a.href = rec.url;
    a.download = `${rec.name.replace(/\s+/g, '-').toLowerCase()}.webm`;
    a.click();
  }, []);

  /* cleanup */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      recordings.forEach((r) => URL.revokeObjectURL(r.url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Record / Stop button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {state === 'recording' ? (
          <button
            type="button"
            onClick={stopRecording}
            className="de-btn"
            style={{
              width: 72, height: 72, borderRadius: '50%', padding: 0,
              background: '#dc4444', color: '#fff',
              boxShadow: '0 0 0 8px rgba(220,68,68,0.15), 0 4px 16px rgba(220,68,68,0.3)',
            }}
            aria-label="Stop recording"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="de-btn de-btn-primary"
            style={{ width: 72, height: 72, borderRadius: '50%', padding: 0 }}
            aria-label="Start recording"
          >
            <Mic className="w-7 h-7" />
          </button>
        )}
        <p style={{
          fontSize: 12, fontWeight: state === 'recording' ? 700 : 400,
          color: state === 'recording' ? '#dc4444' : 'var(--de-text-dim)',
        }}>
          {state === 'recording' ? `● REC  ${formatTime(elapsed)}` : 'Tap to record'}
        </p>
      </div>

      {/* Live waveform canvas */}
      <canvas
        ref={canvasRef}
        width={320}
        height={48}
        style={{
          width: '100%', height: 48,
          background: 'rgba(160,195,240,0.07)',
          borderRadius: 10,
          border: '1px solid rgba(160,195,240,0.2)',
          display: 'block',
        }}
      />

      {error && (
        <div className="de-notice" style={{ background: 'rgba(220,68,68,0.08)', borderColor: 'rgba(220,68,68,0.25)', color: '#dc4444' }}>
          {error}
        </div>
      )}

      {/* Recordings list */}
      {recordings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Recordings
          </div>
          {recordings.map((rec, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 12,
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(160,195,240,0.35)',
            }}>
              <button
                type="button"
                onClick={() => togglePlay(idx, rec.url)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: 'none', background: 'var(--de-accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}
                aria-label={playingIdx === idx ? 'Pause' : 'Play'}
              >
                {playingIdx === idx
                  ? <Pause className="w-4 h-4 fill-current" />
                  : <Play  className="w-4 h-4 fill-current" style={{ marginLeft: 2 }} />
                }
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{rec.name}</div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{formatTime(rec.durationMs)}</div>
              </div>
              <button type="button" onClick={() => download(rec)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
                aria-label="Download recording">
                <Download className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
              </button>
              <button type="button" onClick={() => deleteRecording(idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
                aria-label="Delete recording">
                <Trash2 className="w-4 h-4" style={{ color: '#dc4444' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
