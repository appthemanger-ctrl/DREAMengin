'use client';
// components/dreams/DreamShell.tsx
// Canonical Layer 1 shell — the real implementation per docs/ARCHITECTURE.md §4.
// DreamShell is the source of truth; WidgetShell is the backward-compat shim.

import React, { Component, useEffect, useRef, useState } from 'react';

// ── Error Boundary ─────────────────────────────────────────────────────────
interface EBState { hasError: boolean; }
class DreamErrorBoundary extends Component<{ children: React.ReactNode; title: string }, EBState> {
  constructor(props: { children: React.ReactNode; title: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
            {this.props.title} could not load.
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: 10, padding: '6px 14px', borderRadius: 8,
              background: 'var(--de-accent)', border: 'none',
              color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Skeleton rows ──────────────────────────────────────────────────────────
function SkeletonRow({ width = '100%' }: { width?: string }) {
  return (
    <div style={{
      height: 12, borderRadius: 6, background: 'rgba(160,195,240,0.25)',
      width, marginBottom: 8, animation: 'de-pulse 1.4s ease-in-out infinite',
    }} />
  );
}

// ── DreamShell props ───────────────────────────────────────────────────────
export type DreamDataState = 'loading' | 'ready' | 'error' | 'reconnect_required';

export interface DreamShellProps {
  /** Stable Dream type ID */
  widgetId: string;
  /** Display title (shown immediately) */
  title: string;
  /** Service/type icon (shown immediately) */
  icon: string;
  /** Current data state */
  dataState: DreamDataState;
  /** Child content rendered when dataState === 'ready' */
  children?: React.ReactNode;
  /** Called when user taps Retry */
  onRetry?: () => void;
  /** Called when user taps Reconnect */
  onReconnect?: () => void;
  /** Called when user taps Hide */
  onHide?: () => void;
  /** Called when user taps Remove */
  onRemove?: () => void;
  /** Called when user taps Configure */
  onConfigure?: () => void;
  /** Fixed content height reservation to prevent layout shift */
  minContentHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function DreamShell({
  widgetId,
  title,
  icon,
  dataState,
  children,
  onRetry,
  onReconnect,
  onHide,
  onRemove,
  onConfigure,
  minContentHeight = 120,
  className = '',
  style,
}: DreamShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div
      data-dream-id={widgetId}
      className={`de-widget dream-shell-content${className ? ` ${className}` : ''}`}
      style={{ position: 'relative', containerType: 'inline-size', ...style }}
    >
      {/* ── Header ── */}
      <div className="de-widget-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span className="de-widget-title">{title}</span>
          {dataState === 'loading' && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--de-accent)',
              padding: '2px 6px', borderRadius: 6,
              background: 'rgba(42,138,184,0.1)',
              animation: 'de-pulse 1.4s ease-in-out infinite',
            }}>
              loading
            </span>
          )}
        </div>

        {/* Overflow menu "…" */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="Dream options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: '1px solid var(--de-border)',
              background: 'var(--de-mist)',
              cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--de-text-dim)',
            }}
          >
            ···
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 32, right: 0, zIndex: 20,
              background: 'rgba(245,250,255,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(160,195,240,0.5)',
              borderRadius: 14, padding: 6, minWidth: 160,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}>
              {[
                { label: '⚙️  Configure', fn: onConfigure },
                { label: '👁  Hide Dream', fn: onHide },
                { label: '🗑  Remove Dream', fn: onRemove, danger: true },
              ].map(({ label, fn, danger }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setMenuOpen(false); fn?.(); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '9px 12px', borderRadius: 10,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    color: danger ? '#dc4444' : 'var(--de-text)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div
        className="de-widget-body"
        style={{ minHeight: minContentHeight, position: 'relative' }}
      >
        <DreamErrorBoundary title={title}>
          {dataState === 'loading' && (
            <div style={{ padding: '12px 4px' }}>
              <SkeletonRow width="60%" />
              <SkeletonRow width="90%" />
              <SkeletonRow width="75%" />
              <SkeletonRow width="50%" />
            </div>
          )}

          {dataState === 'ready' && children}

          {(dataState === 'error' || dataState === 'reconnect_required') && (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>
                {dataState === 'reconnect_required' ? '🔗' : '⚠️'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
                {dataState === 'reconnect_required'
                  ? `${title} needs to be reconnected.`
                  : `${title} couldn't load right now.`}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {dataState === 'error' && onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      background: 'var(--de-accent)', border: 'none',
                      color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                )}
                {dataState === 'reconnect_required' && onReconnect && (
                  <button
                    type="button"
                    onClick={onReconnect}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      background: 'var(--de-accent)', border: 'none',
                      color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          )}
        </DreamErrorBoundary>
      </div>

      <style>{`
        @keyframes de-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
