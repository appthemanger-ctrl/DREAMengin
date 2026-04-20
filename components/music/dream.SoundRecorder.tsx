'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Pause, Trash2, Download, Zap } from 'lucide-react';

type RecorderState = 'idle' | 'recording' | 'recorded';

interface Recording {
  url: string;
  name: string;
  durationMs: number;
  blob: Blob;
  mimeType: string;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function formatSeconds(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Detect the best supported MIME type — handles Safari (mp4/aac) and other browsers. */
function getBestMimeType(): string {
  const preferred = [
    'audio/mp4;codecs=aac',
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/ogg',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  return preferred.find(t => {
    try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
  }) ?? '';
}

/** Guess extension from mime type */
function extFromMime(mime: string) {
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

export default function SoundRecorder() {
  const [state, setState]           = useState<RecorderState>('idle');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [elapsed, setElapsed]       = useState(0);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [playPosition, setPlayPosition] = useState<Record<number, number>>({});
  const [playError, setPlayError]   = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const chunksRef    = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElsRef  = useRef<Map<number, HTMLAudioElement>>(new Map());
  const playRafRef   = useRef<number>(0);

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
    setPlayError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = getBestMimeType();
      const options = mimeType ? { mimeType } : undefined;
      let mr: MediaRecorder;
      try {
        mr = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      } catch {
        mr = new MediaRecorder(stream);
      }
      const usedMime = mr.mimeType || mimeType || 'audio/webm';

      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: usedMime });
        const url = URL.createObjectURL(blob);
        const durationMs = Date.now() - startTimeRef.current;
        setRecordings((prev) => [...prev, { url, name: `Take ${prev.length + 1}`, durationMs, blob, mimeType: usedMime }]);
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
        setError('Microphone access denied. Tap "Allow" in your browser and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError('No microphone found. Connect a mic or use headphones with a mic.');
      } else {
        setError(`Recording failed: ${msg}`);
      }
    }
  }, [drawWave]);

  /* stop recording */
  const stopRecording = useCallback(() => {
    mediaRecRef.current?.stop();
  }, []);

  /* animate playback position */
  const animatePlayback = useCallback((idx: number) => {
    const el = audioElsRef.current.get(idx);
    if (!el) return;
    const tick = () => {
      if (!el.paused && !el.ended && el.duration) {
        setPlayPosition(prev => ({ ...prev, [idx]: el.currentTime / el.duration }));
        playRafRef.current = requestAnimationFrame(tick);
      }
    };
    playRafRef.current = requestAnimationFrame(tick);
  }, []);

  /* play / pause */
  const togglePlay = useCallback((idx: number, rec: Recording) => {
    setPlayError(null);
    if (playingIdx === idx) {
      audioElsRef.current.get(idx)?.pause();
      setPlayingIdx(null);
      cancelAnimationFrame(playRafRef.current);
      return;
    }
    // Pause any currently playing
    audioElsRef.current.forEach((el) => el.pause());
    cancelAnimationFrame(playRafRef.current);
    setPlayingIdx(null);

    let el = audioElsRef.current.get(idx);
    if (!el) {
      el = new Audio(rec.url);
      el.preload = 'auto';
      el.onended = () => {
        setPlayingIdx(null);
        setPlayPosition(prev => ({ ...prev, [idx]: 0 }));
        cancelAnimationFrame(playRafRef.current);
      };
      el.onerror = () => {
        setPlayingIdx(null);
        setPlayError(`Can't play "${rec.name}" — format may not be supported by this browser. Try downloading it.`);
      };
      audioElsRef.current.set(idx, el);
    }
    el.currentTime = 0;
    setPlayingIdx(idx);
    setPlayPosition(prev => ({ ...prev, [idx]: 0 }));

    el.play().then(() => {
      animatePlayback(idx);
    }).catch((err: Error) => {
      setPlayingIdx(null);
      const msg = err?.message ?? '';
      if (msg.includes('NotAllowedError') || msg.includes('user') || msg.includes('autoplay')) {
        setPlayError('Tap the play button once more — browser requires a direct tap to start audio.');
      } else {
        setPlayError(`Playback error: ${msg || 'Unknown — try downloading the file instead.'}`);
      }
    });
  }, [playingIdx, animatePlayback]);

  /* seek by clicking on progress bar */
  const handleSeek = useCallback((idx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioElsRef.current.get(idx);
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * el.duration;
    setPlayPosition(prev => ({ ...prev, [idx]: pct }));
  }, []);

  /* delete */
  const deleteRecording = useCallback((idx: number) => {
    setRecordings((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].url);
      next.splice(idx, 1);
      return next;
    });
    if (playingIdx === idx) { setPlayingIdx(null); cancelAnimationFrame(playRafRef.current); }
    audioElsRef.current.get(idx)?.pause();
    audioElsRef.current.delete(idx);
    setPlayPosition(prev => { const n = { ...prev }; delete n[idx]; return n; });
  }, [playingIdx]);

  /* download */
  const download = useCallback((rec: Recording) => {
    const a = document.createElement('a');
    a.href = rec.url;
    const ext = extFromMime(rec.mimeType);
    a.download = `${rec.name.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
    a.click();
  }, []);

  /* send to StarMakerEngin DAW Editor via CustomEvent */
  const sendToEditor = useCallback((rec: Recording) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('starmaker:load-recording', {
      detail: { blob: rec.blob, name: rec.name, mimeType: rec.mimeType },
    }));
    // Brief visual confirm — show as toast or just rely on Side B UI changing
  }, []);

  /* cleanup on unmount */
  useEffect(() => {
    // Capture current recordings in closure for cleanup
    const urlsToRevoke = recordings.map(r => r.url);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      cancelAnimationFrame(playRafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordings]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Record / Stop button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {state === 'recording' ? (
          <button type="button" onClick={stopRecording}
            className="de-btn"
            style={{
              width: 72, height: 72, borderRadius: '50%', padding: 0,
              background: '#dc4444', color: '#fff',
              boxShadow: '0 0 0 8px rgba(220,68,68,0.15), 0 4px 16px rgba(220,68,68,0.3)',
            }}
            aria-label="Stop recording">
            <Square className="w-6 h-6 fill-current" />
          </button>
        ) : (
          <button type="button" onClick={startRecording}
            className="de-btn de-btn-primary"
            style={{ width: 72, height: 72, borderRadius: '50%', padding: 0 }}
            aria-label="Start recording">
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
      <canvas ref={canvasRef} width={320} height={48} style={{
        width: '100%', height: 48,
        background: 'rgba(160,195,240,0.07)', borderRadius: 10,
        border: '1px solid rgba(160,195,240,0.2)', display: 'block',
      }} />

      {/* Recording error */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          background: 'rgba(220,68,68,0.08)', border: '1px solid rgba(220,68,68,0.25)',
          color: '#dc4444', lineHeight: 1.5,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Playback error */}
      {playError && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          color: '#f59e0b', lineHeight: 1.5,
        }}>
          ⚠️ {playError}
        </div>
      )}

      {/* Recordings list */}
      {recordings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>Recordings ({recordings.length})</span>
            <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.6, textTransform: 'none' }}>
              Tap ⚡ to send to DAW Editor
            </span>
          </div>

          {recordings.map((rec, idx) => {
            const isPlaying = playingIdx === idx;
            const pos = playPosition[idx] ?? 0;
            return (
              <div key={idx} style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                padding: '10px 12px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${isPlaying ? 'rgba(42,138,184,0.5)' : 'rgba(160,195,240,0.2)'}`,
                transition: 'border-color 0.2s',
              }}>
                {/* Top row: play + info + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Play/Pause button */}
                  <button type="button" onClick={() => togglePlay(idx, rec)}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: isPlaying ? '#ef4444' : 'var(--de-accent)',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
                    }}
                    aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying
                      ? <Pause className="w-4 h-4 fill-current" />
                      : <Play className="w-4 h-4 fill-current" style={{ marginLeft: 2 }} />
                    }
                  </button>

                  {/* Name + duration */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{rec.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)', display: 'flex', gap: 8 }}>
                      <span>{formatTime(rec.durationMs)}</span>
                      {isPlaying && (
                        <span style={{ color: 'var(--de-accent)', fontWeight: 700 }}>
                          {formatSeconds(pos * (rec.durationMs / 1000))} ▶
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Send to Editor */}
                  <button type="button" onClick={() => sendToEditor(rec)}
                    title="Send to DAW Editor (Side B)"
                    style={{
                      background: 'rgba(0,208,240,0.1)', border: '1px solid rgba(0,208,240,0.3)',
                      borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
                      color: '#00d0f0', display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 700,
                    }}>
                    <Zap className="w-3 h-3" /> DAW
                  </button>

                  {/* Download */}
                  <button type="button" onClick={() => download(rec)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
                    aria-label="Download recording">
                    <Download className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  </button>

                  {/* Delete */}
                  <button type="button" onClick={() => deleteRecording(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
                    aria-label="Delete recording">
                    <Trash2 className="w-4 h-4" style={{ color: '#dc4444' }} />
                  </button>
                </div>

                {/* Scrubable progress bar */}
                <div
                  role="slider"
                  aria-label={`Playback position for ${rec.name}`}
                  aria-valuenow={Math.round(pos * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  tabIndex={0}
                  onClick={(e) => handleSeek(idx, e)}
                  style={{
                    height: 6, borderRadius: 999, cursor: 'pointer',
                    background: 'rgba(160,195,240,0.15)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${pos * 100}%`,
                    background: isPlaying ? 'var(--de-accent)' : 'rgba(42,138,184,0.4)',
                    borderRadius: 999, transition: isPlaying ? 'none' : 'width 0.2s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
