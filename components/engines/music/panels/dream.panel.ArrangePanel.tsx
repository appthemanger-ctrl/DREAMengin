'use client';

/**
 * ArrangePanel — Arrangement overview for the Music Engine app.
 *
 * Shows a visual timeline of the current project's clips, tempo map,
 * and structure sections. Lives at /engines/music/arrange.
 */

import { useState } from 'react';
import { Play, Pause, SkipBack, Plus, Minus, Layers } from 'lucide-react';

interface Section {
  id: string;
  label: string;
  color: string;
  startBar: number;
  lengthBars: number;
}

const DEFAULT_SECTIONS: Section[] = [
  { id: 'intro',   label: 'Intro',   color: '#6366f1', startBar: 1,  lengthBars: 4  },
  { id: 'verse',   label: 'Verse',   color: '#0891b2', startBar: 5,  lengthBars: 8  },
  { id: 'chorus',  label: 'Chorus',  color: '#a855f7', startBar: 13, lengthBars: 8  },
  { id: 'bridge',  label: 'Bridge',  color: '#d97706', startBar: 21, lengthBars: 4  },
  { id: 'outro',   label: 'Outro',   color: '#6b7280', startBar: 25, lengthBars: 4  },
];

const TRACKS = [
  { id: 'drums',  label: 'Drums',       emoji: '🥁' },
  { id: 'bass',   label: 'Bass',        emoji: '🎸' },
  { id: 'synth',  label: 'Synth Lead',  emoji: '🎹' },
  { id: 'fx',     label: 'FX Layer',    emoji: '✨' },
  { id: 'vocals', label: 'Vocals',      emoji: '🎤' },
];

const TOTAL_BARS = 32;

export default function ArrangePanel() {
  const [bpm, setBpm] = useState(128);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(1);
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);

  function addSection() {
    const lastBar = Math.max(...sections.map((s) => s.startBar + s.lengthBars), 1);
    setSections((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        label: `Section ${prev.length + 1}`,
        color: '#10b981',
        startBar: lastBar,
        lengthBars: 4,
      },
    ]);
  }

  const barWidth = 100 / TOTAL_BARS; // percent

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Arrangement</h1>
            <p className="text-sm text-white/50">Structure your project · {TOTAL_BARS} bars</p>
          </div>

          {/* Transport */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setPlayhead(1)}
              className="text-white/50 hover:text-white transition-colors"
              title="Return to start"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
              style={{ background: isPlaying ? '#a855f7' : 'rgba(255,255,255,0.1)' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <button onClick={() => setBpm((b) => Math.max(60, b - 1))} className="hover:text-white transition-colors">
                <Minus size={12} />
              </button>
              <span className="tabular-nums w-10 text-center font-mono text-[#a855f7]">{bpm}</span>
              <button onClick={() => setBpm((b) => Math.min(300, b + 1))} className="hover:text-white transition-colors">
                <Plus size={12} />
              </button>
              <span className="text-xs text-white/30">BPM</span>
            </div>
          </div>
        </div>

        {/* Section map */}
        <div className="mb-4 rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={12} />
              Structure
            </span>
            <button
              onClick={addSection}
              className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#c084fc] transition-colors"
            >
              <Plus size={12} />
              Add section
            </button>
          </div>
          <div className="p-3">
            <div className="relative w-full h-10 bg-black/30 rounded-lg overflow-hidden">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="absolute top-0 h-full flex items-center justify-center text-xs font-bold text-white/90 rounded"
                  style={{
                    left: `${((sec.startBar - 1) / TOTAL_BARS) * 100}%`,
                    width: `${(sec.lengthBars / TOTAL_BARS) * 100}%`,
                    background: `${sec.color}88`,
                    border: `1px solid ${sec.color}`,
                  }}
                >
                  {sec.label}
                </div>
              ))}
              {/* Playhead */}
              <div
                className="absolute top-0 h-full w-0.5 bg-white/80"
                style={{ left: `${((playhead - 1) / TOTAL_BARS) * 100}%` }}
              />
            </div>
            {/* Bar ruler */}
            <div className="relative w-full h-5 mt-1">
              {Array.from({ length: TOTAL_BARS + 1 }, (_, i) => i + 1)
                .filter((b) => b % 4 === 1)
                .map((bar) => (
                  <span
                    key={bar}
                    className="absolute text-[10px] text-white/25 transform -translate-x-1/2"
                    style={{ left: `${((bar - 1) / TOTAL_BARS) * 100}%` }}
                  >
                    {bar}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* Track lanes */}
        <div className="space-y-2">
          {TRACKS.map((track) => (
            <div key={track.id} className="flex items-center gap-3">
              <div className="w-28 flex-shrink-0 flex items-center gap-2 px-2 py-2 rounded-lg bg-white/[0.04] border border-white/10">
                <span className="text-base">{track.emoji}</span>
                <span className="text-xs text-white/60 font-medium truncate">{track.label}</span>
              </div>
              <div className="flex-1 relative h-9 bg-black/20 rounded-lg border border-white/[0.06] overflow-hidden">
                {sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="absolute top-1 h-7 rounded opacity-60"
                    style={{
                      left: `${((sec.startBar - 1) / TOTAL_BARS) * 100}%`,
                      width: `calc(${(sec.lengthBars / TOTAL_BARS) * 100}% - 4px)`,
                      background: `linear-gradient(90deg, ${sec.color}55, ${sec.color}22)`,
                      border: `1px solid ${sec.color}44`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
