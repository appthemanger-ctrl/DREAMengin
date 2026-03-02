'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export type DayDreamFace = 'a' | 'b';

type Props = {
  dreamId: string;
  faceALabel: string;
  faceBLabel: string;
  faceAIcon: string;
  faceBIcon: string;
  faceA: React.ReactNode;
  faceB: React.ReactNode;
  accent?: string;
};

export default function DayDreamShell({
  dreamId: _dreamId,
  faceALabel,
  faceBLabel,
  faceAIcon,
  faceBIcon,
  faceA,
  faceB,
  accent = '#6366f1',
}: Props) {
  const [face, setFace] = useState<DayDreamFace>('a');

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg,#020818 0%,#040d2c 60%,#0a0525 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(2,8,24,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(100,150,255,0.1)',
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 52,
      }}>
        {/* Back to Home */}
        <Link href="/home" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(100,150,255,0.1)', border: '1px solid rgba(100,150,255,0.2)',
            fontSize: 14, color: 'rgba(160,185,255,0.7)',
          }}>⌂</div>
        </Link>

        {/* Face switcher — pill tabs, no animation, instant switch */}
        <div style={{
          flex: 1, display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            display: 'inline-flex', gap: 2, background: 'rgba(100,150,255,0.08)',
            border: '1px solid rgba(100,150,255,0.15)', borderRadius: 24, padding: 3,
          }}>
            {([['a', faceAIcon, faceALabel], ['b', faceBIcon, faceBLabel]] as [DayDreamFace, string, string][]).map(([id, icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFace(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
                  background: face === id ? `${accent}22` : 'transparent',
                  border: face === id ? `1px solid ${accent}55` : '1px solid transparent',
                  color: face === id ? 'rgba(220,235,255,0.95)' : 'rgba(160,185,255,0.45)',
                  fontSize: 12, fontWeight: 700,
                  transition: 'color 0.12s',
                }}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Face indicator dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: accent, boxShadow: `0 0 8px ${accent}99`,
          opacity: 0.8,
        }} />
      </header>

      {/* ── Content — NO transforms, plain conditional render ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {face === 'a' ? faceA : faceB}
      </div>
    </div>
  );
}

// ── Shared UI primitives used by all faces ────────────────────────────────────

export function DSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(160,185,255,0.45)' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

export function DCard({ children, accent, style }: { children: React.ReactNode; accent?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(5,15,45,0.65)', border: `1px solid ${accent ? `${accent}33` : 'rgba(100,150,255,0.12)'}`,
      borderRadius: 16, padding: '14px 16px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function DBtn({ label, icon, accent = '#6366f1', ghost, small, onClick }: {
  label: string; icon?: string; accent?: string; ghost?: boolean; small?: boolean; onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '6px 12px' : '9px 18px', borderRadius: 20, cursor: 'pointer',
      background: ghost ? 'transparent' : `${accent}22`,
      border: `1px solid ${ghost ? 'rgba(100,150,255,0.2)' : `${accent}55`}`,
      color: ghost ? 'rgba(160,185,255,0.6)' : 'rgba(220,235,255,0.92)',
      fontSize: small ? 11 : 12, fontWeight: 700, flexShrink: 0,
    }}>
      {icon && <span style={{ fontSize: small ? 13 : 15 }}>{icon}</span>}
      {label}
    </button>
  );
}

export function DEmptyState({ icon, message, action }: { icon: string; message: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 36, opacity: 0.3 }}>{icon}</span>
      <p style={{ fontSize: 13, color: 'rgba(160,185,255,0.4)', margin: 0 }}>{message}</p>
      {action}
    </div>
  );
}

export function DMetricCard({ label, value, delta, accent = '#6366f1', icon }: {
  label: string; value: string; delta?: string; accent?: string; icon?: string;
}) {
  return (
    <DCard accent={accent} style={{ textAlign: 'center' }}>
      {icon && <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>}
      <div style={{ fontSize: 22, fontWeight: 800, color: 'rgba(240,244,255,0.95)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(160,185,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      {delta && <div style={{ fontSize: 11, color: delta.startsWith('+') ? '#4ade80' : '#f87171', marginTop: 4, fontWeight: 700 }}>{delta}</div>}
    </DCard>
  );
}

export const FACE_WRAPPER = { maxWidth: 720, margin: '0 auto', padding: '16px 14px' };
