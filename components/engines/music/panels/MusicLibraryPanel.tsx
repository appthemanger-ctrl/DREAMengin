'use client';

/**
 * MusicLibraryPanel — Preset & sample library for the Music Engine app.
 *
 * Browse genre presets, instrument kits, and project templates.
 * Lives at /engines/music/library.
 */

import { useState } from 'react';
import { Music2, Drum, FolderOpen, Sparkles, ChevronRight } from 'lucide-react';

interface LibraryItem {
  id: string;
  name: string;
  meta: string;
  tags: string[];
  accent: string;
}

const BEAT_PRESETS: LibraryItem[] = [
  { id: 'trap',       name: 'Trap 808',         meta: '140 BPM · Heavy Bass',       tags: ['hip-hop', 'trap'],    accent: '#c8981a' },
  { id: 'house',      name: 'Deep House',        meta: '124 BPM · 4-on-the-floor',  tags: ['electronic', 'house'],accent: '#a855f7' },
  { id: 'dnb',        name: 'Drum & Bass',       meta: '174 BPM · Complex Grid',    tags: ['dnb', 'electronic'],  accent: '#0891b2' },
  { id: 'lofi',       name: 'Lo-Fi Hip Hop',     meta: '84 BPM · Chill Vibes',      tags: ['hip-hop', 'chill'],   accent: '#10b981' },
  { id: 'afrobeats',  name: 'Afrobeats Groove',  meta: '100 BPM · Polyrhythm',      tags: ['afro', 'world'],      accent: '#f59e0b' },
  { id: 'drill',      name: 'UK Drill',          meta: '140 BPM · Off-beat Hi-hat', tags: ['drill', 'hip-hop'],   accent: '#ef4444' },
];

const INSTRUMENT_PRESETS: LibraryItem[] = [
  { id: 'bass808',   name: '808 Bass',          meta: 'Deep sub synth',         tags: ['bass', 'synth'],     accent: '#c8981a' },
  { id: 'supersaw',  name: 'Supersaw Lead',     meta: '7-voice detuned saw',    tags: ['lead', 'synth'],     accent: '#a855f7' },
  { id: 'piano',     name: 'Grand Piano',       meta: 'Sampled · 88 keys',      tags: ['keys', 'acoustic'],  accent: '#6366f1' },
  { id: 'Rhodes',    name: 'Rhodes EP',         meta: 'Vintage electric piano', tags: ['keys', 'vintage'],   accent: '#d97706' },
  { id: 'brasskit',  name: 'Brass Section',     meta: '4-voice ensemble',       tags: ['brass', 'ensemble'], accent: '#ef4444' },
];

const TEMPLATES: LibraryItem[] = [
  { id: 'pop',        name: 'Pop Banger',        meta: '8 tracks · 128 BPM',    tags: ['pop'],               accent: '#a855f7' },
  { id: 'hiphop',     name: 'Hip-Hop Cypher',    meta: '6 tracks · 93 BPM',     tags: ['hip-hop'],           accent: '#c8981a' },
  { id: 'electronic', name: 'Electronic EP',     meta: '10 tracks · 138 BPM',   tags: ['electronic'],        accent: '#0891b2' },
  { id: 'rnb',        name: 'R&B Smooth',        meta: '7 tracks · 72 BPM',     tags: ['r&b', 'smooth'],     accent: '#10b981' },
  { id: 'cinematic',  name: 'Cinematic Score',   meta: '12 tracks · 80 BPM',    tags: ['film', 'cinematic'], accent: '#6366f1' },
];

type Tab = 'beats' | 'instruments' | 'templates';

const TABS: { id: Tab; label: string; icon: typeof Music2 }[] = [
  { id: 'beats',       label: 'Beat Presets',   icon: Drum      },
  { id: 'instruments', label: 'Instruments',    icon: Music2    },
  { id: 'templates',   label: 'Templates',      icon: FolderOpen },
];

export default function MusicLibraryPanel() {
  const [tab, setTab] = useState<Tab>('beats');

  const items = tab === 'beats' ? BEAT_PRESETS : tab === 'instruments' ? INSTRUMENT_PRESETS : TEMPLATES;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Preset Library</h1>
          <p className="text-sm text-white/50">Beats · instruments · project templates</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
              style={
                tab === id
                  ? { background: '#a855f722', color: '#a855f7' }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#a855f7]/40 hover:bg-white/[0.07] transition-all text-left"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('starmaker:load-preset', { detail: item }));
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.accent}22` }}
              >
                <Sparkles size={15} style={{ color: item.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                <div className="text-xs text-white/40">{item.meta}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {item.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
