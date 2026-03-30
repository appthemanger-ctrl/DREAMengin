'use client';

/**
 * IdentityPanel — Brand identity editor for the Brand Engine app.
 *
 * Set brand name, tagline, accent colors, and logo emoji.
 * Lives at /engines/brand/identity.
 */

import { useState } from 'react';
import { Save, RefreshCw, Palette, Type, Hash } from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

const PRESET_PALETTES = [
  { name: 'Electric',  colors: ['#f472b6', '#a855f7', '#22d3ee'] },
  { name: 'Fire',      colors: ['#f97316', '#ef4444', '#fbbf24'] },
  { name: 'Ocean',     colors: ['#0891b2', '#0ea5e9', '#06b6d4'] },
  { name: 'Forest',    colors: ['#10b981', '#059669', '#a3e635'] },
  { name: 'Gold',      colors: ['#c8981a', '#d97706', '#fbbf24'] },
  { name: 'Midnight',  colors: ['#6366f1', '#8b5cf6', '#a78bfa'] },
];

const EMOJI_PALETTE = ['🔥', '⚡', '🌟', '💎', '🎯', '🚀', '👑', '🦋', '🌊', '🎪', '🔮', '🏆'];

interface BrandIdentity {
  name: string;
  tagline: string;
  logoEmoji: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export default function IdentityPanel() {
  const [identity, setIdentity] = useState<BrandIdentity>({
    name: '',
    tagline: '',
    logoEmoji: '🔮',
    primaryColor: '#f472b6',
    secondaryColor: '#a855f7',
    accentColor: '#22d3ee',
  });
  const [saved, setSaved] = useState(false);

  function applyPalette(palette: typeof PRESET_PALETTES[0]) {
    setIdentity((prev) => ({
      ...prev,
      primaryColor: palette.colors[0],
      secondaryColor: palette.colors[1],
      accentColor: palette.colors[2],
    }));
  }

  function save() {
    bridge.emit('brand', 'brand:asset-updated', { assetType: 'color-palette', assetId: identity.name || 'brand-identity' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Brand Identity</h1>
          <p className="text-sm text-white/50">Set your brand name, tagline, colors, and icon</p>
        </div>

        {/* Live preview */}
        <div
          className="rounded-2xl p-6 mb-6 flex items-center gap-4 border"
          style={{
            background: `linear-gradient(135deg, ${identity.primaryColor}22, ${identity.secondaryColor}11)`,
            borderColor: `${identity.primaryColor}44`,
          }}
        >
          <div
            className="text-4xl w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${identity.primaryColor}22` }}
          >
            {identity.logoEmoji}
          </div>
          <div>
            <div
              className="text-xl font-black"
              style={{ color: identity.primaryColor }}
            >
              {identity.name || 'Your Brand'}
            </div>
            <div className="text-sm text-white/50 mt-0.5">
              {identity.tagline || 'Your tagline here'}
            </div>
            <div className="flex gap-2 mt-2">
              {[identity.primaryColor, identity.secondaryColor, identity.accentColor].map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-black/20" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              <Type size={11} className="inline mr-1" />
              Brand Name
            </label>
            <input
              type="text"
              value={identity.name}
              onChange={(e) => setIdentity((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your brand name"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f472b6]/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              <Hash size={11} className="inline mr-1" />
              Tagline
            </label>
            <input
              type="text"
              value={identity.tagline}
              onChange={(e) => setIdentity((p) => ({ ...p, tagline: e.target.value }))}
              placeholder="Short brand tagline"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f472b6]/60"
            />
          </div>

          {/* Logo emoji */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Logo Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIdentity((p) => ({ ...p, logoEmoji: emoji }))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
                  style={
                    identity.logoEmoji === emoji
                      ? { background: '#f472b622', border: '1.5px solid #f472b6' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color palettes */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              <Palette size={11} className="inline mr-1" />
              Color Palette
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => applyPalette(palette)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all"
                >
                  <div className="flex gap-0.5">
                    {palette.colors.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/40">{palette.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={save}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f472b6] hover:bg-[#ec4899] text-black text-sm font-bold transition-colors"
        >
          <Save size={14} />
          {saved ? 'Saved ✓' : 'Save Identity'}
        </button>
      </div>
    </div>
  );
}
