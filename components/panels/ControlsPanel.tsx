'use client';

/**
 * ControlsPanel — Home button behavior settings rendered in Surface Space.
 * Same real localStorage-persisted logic as ControlsClient.
 * Back → openInSurface('settings'). No routing.
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Sliders, Check } from 'lucide-react';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import PositionIndicatorToggle from '@/app/settings/controls/PositionIndicatorToggle';

const STORAGE_KEY = 'de-controls-settings';

interface ControlsSettings {
  dragToLock: boolean; showLockHint: boolean;
  persistPositions: boolean; hapticFeedback: boolean;
}
const DEFAULT: ControlsSettings = {
  dragToLock: true, showLockHint: true, persistPositions: true, hapticFeedback: false,
};

function Toggle({ value, onToggle, label }: { value: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={onToggle}
      style={{ width: 44, height: 26, borderRadius: 13, background: value ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)', position: 'relative', cursor: 'pointer', border: 'none', flexShrink: 0, transition: 'background 0.15s' }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.15s' }} />
    </button>
  );
}

export default function ControlsPanel() {
  const { openInSurface } = useDreamSystem();
  const [settings, setSettings] = useState<ControlsSettings>(DEFAULT);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setSettings(p => ({ ...p, ...JSON.parse(raw) })); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback((key: keyof ControlsSettings) => {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }, []);

  const rows: Array<{ key: keyof ControlsSettings; label: string; desc: string }> = [
    { key: 'dragToLock',       label: 'Drag to lock buttons',     desc: 'Drag both buttons together to lock and access menus.' },
    { key: 'showLockHint',     label: 'Show lock hint once',      desc: 'Display the lock hint the first time you open the app.' },
    { key: 'persistPositions', label: 'Persist button positions', desc: 'Remember where you placed the buttons after each session.' },
    { key: 'hapticFeedback',   label: 'Haptic feedback',          desc: 'Vibrate on lock/unlock (mobile only).' },
  ];

  return (
    <div style={{ paddingBottom: 100 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(244,248,253,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(160,195,240,0.2)', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>
          <button type="button" onClick={() => openInSurface('settings')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} style={{ color: 'var(--de-heading)' }} />
          </button>
          <Sliders size={18} style={{ color: 'var(--de-accent)' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>Controls</span>
          {saved && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--de-accent)' }}><Check size={12} /> Saved</span>}
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Button Behavior</span></div>
          <div className="de-widget-body">
            {rows.map(({ key, label, desc }) => (
              <div key={key} className="de-row">
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</div><div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div></div>
                <Toggle value={settings[key]} onToggle={() => toggle(key)} label={label} />
              </div>
            ))}
          </div>
        </div>
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Position Indicator</span></div>
          <div className="de-widget-body"><PositionIndicatorToggle /></div>
        </div>
      </div>
    </div>
  );
}
