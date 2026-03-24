'use client';

/**
 * ControlsClient — interactive home button behavior settings.
 * Persists to localStorage. Constitution Rule 6-7.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sliders, Check } from 'lucide-react';
import PositionIndicatorToggle from './PositionIndicatorToggle';

const STORAGE_KEY = 'de-controls-settings';

interface ControlsSettings {
  dragToLock: boolean;
  showLockHint: boolean;
  persistPositions: boolean;
  hapticFeedback: boolean;
}

const DEFAULT: ControlsSettings = {
  dragToLock: true,
  showLockHint: true,
  persistPositions: true,
  hapticFeedback: false,
};

function Toggle({ value, onToggle, label }: { value: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: value ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
        position: 'relative', cursor: 'pointer', border: 'none', flexShrink: 0,
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.15s',
      }} />
    </button>
  );
}

export default function ControlsClient() {
  const [settings, setSettings] = useState<ControlsSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return DEFAULT;
  });
  const [saved, setSaved] = useState(false);

  const toggle = useCallback((key: keyof ControlsSettings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, []);

  const rows: Array<{ key: keyof ControlsSettings; label: string; desc: string }> = [
    { key: 'dragToLock',       label: 'Drag to lock buttons',    desc: 'Drag both buttons together to lock and access menus.' },
    { key: 'showLockHint',     label: 'Show lock hint once',     desc: 'Display the lock hint the first time you open the app.' },
    { key: 'persistPositions', label: 'Persist button positions',desc: 'Remember where you placed the buttons after each session.' },
    { key: 'hapticFeedback',   label: 'Haptic feedback',         desc: 'Vibrate on lock/unlock (mobile only).' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Sliders className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Controls</h1>
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Home Button Behavior</span></div>
          <div className="de-widget-body">
            <p className="text-sm mb-4" style={{ color: 'var(--de-text-dim)' }}>
              The gold button is your system control. Single-tap to open menus, double-tap to go home, drag to adjust position.
            </p>
            {rows.map(({ key, label, desc }) => (
              <div key={key} className="de-row">
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{label}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <Toggle value={settings[key]} onToggle={() => toggle(key)} label={label} />
              </div>
            ))}
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Navigation Display</span></div>
          <div className="de-widget-body">
            <PositionIndicatorToggle />
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">How It Works</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { step: '1', text: 'Single-tap the gold button to open the Daydreams + System menus.' },
                { step: '2', text: 'Double-tap the gold button to return to your Home Dream.' },
                { step: '3', text: 'Drag the gold button to reposition it on screen.' },
                { step: '4', text: 'Drag the DreamDM bar upward to open the Dreams Space.' },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(42,138,184,0.15)', border: '1px solid rgba(42,138,184,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--de-accent)', flexShrink: 0 }}>
                    {step}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--de-text)', lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
