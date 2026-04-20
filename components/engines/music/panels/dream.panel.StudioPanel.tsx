'use client';

/**
 * StudioPanel — Recording studio panel for the Music Engine app.
 *
 * Provides a clean UI for recording audio, viewing waveform previews,
 * and loading recordings into the DAW. Lives at /engines/music/studio.
 */

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Square, Play, Upload, Loader2, AlertCircle } from 'lucide-react';

type RecordState = 'idle' | 'recording' | 'stopped';

interface Recording {
  id: string;
  name: string;
  url: string;
  duration: number;
  createdAt: Date;
}

function getBestMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

export default function StudioPanel() {
  const [state, setState] = useState<RecordState>('idle');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { timerRef.current && clearInterval(timerRef.current); }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getBestMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const rec: Recording = {
          id: Date.now().toString(),
          name: `Take ${Date.now().toString().slice(-4)}`,
          url,
          duration: elapsed,
          createdAt: new Date(),
        };
        setRecordings((prev) => [rec, ...prev]);
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current!);
        setState('stopped');
      };
      mr.start(200);
      mediaRef.current = mr;
      setState('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
  }

  function playRecording(rec: Recording) {
    audioRef.current?.pause();
    const audio = new Audio(rec.url);
    audioRef.current = audio;
    setPlaying(rec.id);
    audio.play();
    audio.onended = () => setPlaying(null);
  }

  function loadToDAW(rec: Recording) {
    window.dispatchEvent(new CustomEvent('starmaker:load-recording', { detail: { url: rec.url, name: rec.name } }));
  }

  function formatDuration(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Recording Studio</h1>
          <p className="text-sm text-white/50">Capture takes · load directly into the DAW</p>
        </div>

        {/* Record control */}
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/[0.04] border border-white/10 mb-6">
          {state === 'recording' && (
            <div className="text-3xl font-mono font-bold tabular-nums" style={{ color: '#a855f7' }}>
              {formatDuration(elapsed)}
            </div>
          )}

          <div className="flex items-center gap-3">
            {state !== 'recording' ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-sm font-bold transition-colors"
              >
                <Mic size={16} />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors animate-pulse"
              >
                <Square size={16} />
                Stop
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Recordings list */}
        {recordings.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Takes</h2>
            <div className="space-y-2">
              {recordings.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{rec.name}</div>
                    <div className="text-xs text-white/40">{formatDuration(rec.duration)}</div>
                  </div>
                  <button
                    onClick={() => playRecording(rec)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-[#a855f7]/20 text-white/50 hover:text-[#a855f7] transition-all"
                    title="Preview"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={() => loadToDAW(rec)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#a855f7] text-xs font-medium transition-all"
                    title="Load into DAW"
                  >
                    <Upload size={12} />
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {recordings.length === 0 && state === 'idle' && (
          <p className="text-center text-white/30 text-sm py-8">
            Hit Record to capture your first take.
          </p>
        )}
      </div>
    </div>
  );
}
