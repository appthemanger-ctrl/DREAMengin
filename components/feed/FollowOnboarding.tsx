'use client';

import { useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';

export const FOLLOW_OPTIONS = [
  { id: 'all',       emoji: '📡', label: 'Everything',    desc: 'Every post, real time'               },
  { id: 'highlights',emoji: '✨', label: 'Highlights',    desc: 'Best posts, auto-selected'           },
  { id: 'daily',     emoji: '☀️', label: 'Once a Day',    desc: 'One digest per day'                  },
  { id: 'weekdays',  emoji: '💼', label: 'Weekdays',      desc: 'Monday through Friday only'          },
  { id: 'weekends',  emoji: '🌴', label: 'Weekends',      desc: 'Saturday and Sunday only'            },
  { id: 'releases',  emoji: '🔔', label: 'New Releases',  desc: 'Only when they drop something new'   },
  { id: 'groups',    emoji: '👥', label: 'Groups Only',   desc: 'Include in groups, not main feed'    },
  { id: 'silent',    emoji: '🔕', label: 'Silent',        desc: 'Follow but hide from all feeds'      },
] as const;

export type FollowFrequency = typeof FOLLOW_OPTIONS[number]['id'];

export type FollowSettings = {
  handle: string;
  displayName: string;
  frequency: FollowFrequency;
  savedAt: string;
};

function loadFollowSettings(): Record<string, FollowSettings> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('de-follow-settings') || '{}'); }
  catch { return {}; }
}

export function saveFollowSetting(handle: string, displayName: string, frequency: FollowFrequency) {
  const all = loadFollowSettings();
  all[handle] = { handle, displayName, frequency, savedAt: new Date().toISOString() };
  localStorage.setItem('de-follow-settings', JSON.stringify(all));
}

type Props = {
  handle: string;
  displayName: string;
  onConfirm: (frequency: FollowFrequency) => void;
  onClose: () => void;
};

export default function FollowOnboarding({ handle, displayName, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<FollowFrequency>('highlights');

  const confirm = useCallback(() => {
    saveFollowSetting(handle, displayName, selected);
    onConfirm(selected);
  }, [handle, displayName, selected, onConfirm]);

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,30,60,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Bottom sheet */}
      <div
        style={{
          width: '100%', maxWidth: 540,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(245,240,220,0.96) 100%)',
          borderRadius: '28px 28px 0 0',
          border: '1.5px solid rgba(255,255,255,0.8)',
          borderBottom: 'none',
          boxShadow: '0 -8px 48px rgba(42,138,184,0.18)',
          animation: 'de-flip-in 0.32s cubic-bezier(0,0.55,0.45,1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(160,195,240,0.5)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)' }}>
              Following {displayName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 2 }}>
              @{handle} · How do you want their content?
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: 8, borderRadius: '50%', background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex' }}
          >
            <X className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
          </button>
        </div>

        {/* Options grid */}
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {FOLLOW_OPTIONS.map(opt => {
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                style={{
                  borderRadius: 16, padding: '14px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: active
                    ? 'linear-gradient(135deg, rgba(42,138,184,0.12), rgba(200,152,26,0.10))'
                    : 'rgba(255,255,255,0.6)',
                  outline: active ? '2px solid var(--de-accent)' : '1.5px solid rgba(160,195,240,0.3)',
                  boxShadow: active ? '0 0 0 4px rgba(42,138,184,0.08)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
                aria-pressed={active}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                  {active && (
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--de-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.2 }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)', lineHeight: 1.3 }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Info note */}
        <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', padding: '0 20px 10px', lineHeight: 1.4 }}>
          You own this. Change anytime in <strong>Settings → Algorithm</strong>.
        </p>

        {/* Confirm */}
        <div style={{ padding: '0 16px 20px', display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} className="de-btn de-btn-ghost" style={{ flex: 1 }}>
            Cancel
          </button>
          <button type="button" onClick={confirm} className="de-btn de-btn-primary" style={{ flex: 2, fontWeight: 800, gap: 6 }}>
            <Check className="w-4 h-4" /> Follow
          </button>
        </div>
      </div>
    </div>
  );
}
