'use client';
// components/widgets/WidgetShell.tsx
// Skeleton-loading widget shell (req 21-30)
//
// • Title + service icon rendered immediately (req 24)
// • Skeleton loading state shown until real data arrives (req 22-23, 25)
// • No layout shift when data loads — fixed reserved height (req 26)
// • Overflow menu "…" always present (req 25)
// • Graceful error: "Retry / Reconnect" — no raw error stacks (req 28-30)
// • Widget never crashes the space (req 29) — ErrorBoundary below
// • 3-state visibility tier: everyone / followers-only / hidden (req 72-73)
// • Full menu groups: [Configure, Source, Rename, Recolor] |
//                     [Pin, Duplicate, Move] |
//                     [Permissions, Visible to everyone, Followers only, Hidden, Remove]

import React, { Component, useEffect, useRef, useState } from 'react';
import type { WidgetShellVisibilityTier } from '@/types/widgets';

// ── Error Boundary (req 29-30) ─────────────────────────────────────────────
interface EBState { hasError: boolean; }
class WidgetErrorBoundary extends Component<{ children: React.ReactNode; title: string }, EBState> {
  constructor(props: { children: React.ReactNode; title: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      // req 30: never display raw error stacks
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

// ── Skeleton rows (req 22-23) ──────────────────────────────────────────────
function SkeletonRow({ width = '100%' }: { width?: string }) {
  return (
    <div style={{
      height: 12, borderRadius: 6, background: 'rgba(160,195,240,0.25)',
      width, marginBottom: 8, animation: 'de-pulse 1.4s ease-in-out infinite',
    }} />
  );
}

// ── Menu separator ─────────────────────────────────────────────────────────
function MenuSeparator() {
  return (
    <div style={{
      height: 1,
      background: 'rgba(160,195,240,0.35)',
      margin: '4px 6px',
    }} />
  );
}

// ── WidgetShell props ──────────────────────────────────────────────────────
export type WidgetDataState = 'loading' | 'ready' | 'error' | 'reconnect_required';

export interface WidgetShellProps {
  /** Stable widget type ID */
  widgetId: string;
  /** Display title (shown immediately — req 24) */
  title: string;
  /** Service/type icon (shown immediately — req 24) */
  icon: string;
  /** Current data state (req 22, 28) */
  dataState: WidgetDataState;
  /** Child content rendered when dataState === 'ready' (req 27) */
  children?: React.ReactNode;
  /** Called when user taps Retry (req 28) */
  onRetry?: () => void;
  /** Called when user taps Reconnect (req 28, 49) */
  onReconnect?: () => void;
  /**
   * @deprecated Prefer `onVisibilityChange` with the 3-state tier system.
   * Still supported as a "set hidden" shortcut for backward compat.
   */
  onHide?: () => void;
  /** Called when user taps Remove (req 74) */
  onRemove?: () => void;
  /** Called when user taps Configure */
  onConfigure?: () => void;
  /** Fixed content height reservation to prevent layout shift (req 26) */
  minContentHeight?: number;
  className?: string;
  style?: React.CSSProperties;

  // ── Visibility tier (3-state system) ──────────────────────────────────
  /**
   * Current visibility tier for this Dream.
   * Defaults to 'everyone' when not provided.
   */
  visibility?: WidgetShellVisibilityTier;
  /**
   * Called when the user selects a different visibility tier from the menu.
   * When provided, replaces the legacy `onHide` item with 3 radio options.
   */
  onVisibilityChange?: (tier: WidgetShellVisibilityTier) => void;

  // ── New menu actions ───────────────────────────────────────────────────
  /** Opens a rename flow for this Dream */
  onRename?: () => void;
  /** Opens a color/theme picker for this Dream */
  onRecolor?: () => void;
  /** Toggles pin / favorite status */
  onPin?: () => void;
  /** Whether this Dream is currently pinned (shows checkmark in menu) */
  isPinned?: boolean;
  /** Creates a duplicate of this Dream */
  onDuplicate?: () => void;
  /** Opens position/move controls for this Dream */
  onMove?: () => void;
  /** Opens source selector (data provider) for this Dream */
  onSourceSelect?: () => void;
  /** Opens permissions panel for this Dream */
  onPermissions?: () => void;
  /**
   * When true, all menu items are shown regardless of whether their callback
   * prop is provided (useful in edit mode where stubs are wired separately).
   */
  editMode?: boolean;
}

export default function WidgetShell({
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
  visibility = 'everyone',
  onVisibilityChange,
  onRename,
  onRecolor,
  onPin,
  isPinned = false,
  onDuplicate,
  onMove,
  onSourceSelect,
  onPermissions,
  editMode = false,
}: WidgetShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close overflow menu on outside click
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

  // ── Helpers ──────────────────────────────────────────────────────────────
  /** Show a menu item only when its callback exists OR we're in edit mode */
  const show = (fn: (() => void) | undefined) => !!fn || editMode;

  function menuBtn(
    label: string,
    fn: (() => void) | undefined,
    opts?: { danger?: boolean; checked?: boolean; disabled?: boolean },
  ) {
    return (
      <button
        key={label}
        type="button"
        disabled={opts?.disabled}
        onClick={() => { setMenuOpen(false); fn?.(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%', textAlign: 'left',
          padding: '9px 12px', borderRadius: 10,
          background: 'none', border: 'none',
          cursor: opts?.disabled ? 'default' : 'pointer',
          fontSize: 12, fontWeight: 600,
          color: opts?.danger ? '#dc4444'
               : opts?.disabled ? 'var(--de-text-dim)'
               : 'var(--de-text)',
          opacity: opts?.disabled ? 0.45 : 1,
        }}
      >
        {opts?.checked && (
          <span style={{ color: 'var(--de-gold)', fontWeight: 800, fontSize: 11 }}>✓</span>
        )}
        {!opts?.checked && <span style={{ width: 14, display: 'inline-block' }} />}
        {label}
      </button>
    );
  }

  // ── Visibility section ────────────────────────────────────────────────────
  // If onVisibilityChange is wired up, render 3-state radio items.
  // Otherwise fall back to the legacy single "Hide Dream" item (onHide).
  const hasVisibilityControl = !!onVisibilityChange || editMode;

  const visibilityItems = hasVisibilityControl ? (
    <>
      {menuBtn(
        '🌐  Visible to everyone',
        onVisibilityChange ? () => onVisibilityChange('everyone') : undefined,
        { checked: visibility === 'everyone', disabled: !onVisibilityChange && editMode },
      )}
      {menuBtn(
        '👥  Followers only',
        onVisibilityChange ? () => onVisibilityChange('followers-only') : undefined,
        { checked: visibility === 'followers-only', disabled: !onVisibilityChange && editMode },
      )}
      {menuBtn(
        '🙈  Hidden',
        onVisibilityChange ? () => onVisibilityChange('hidden') : undefined,
        { checked: visibility === 'hidden', disabled: !onVisibilityChange && editMode },
      )}
    </>
  ) : (
    show(onHide)
      ? menuBtn('👁  Hide Dream', onHide)
      : null
  );

  return (
    <div
      data-widget-id={widgetId}
      className={`de-widget${className ? ` ${className}` : ''}`}
      style={{ position: 'relative', ...style }}
    >
      {/* ── Header (title + icon rendered immediately — req 24) ── */}
      <div className="de-widget-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span className="de-widget-title">{title}</span>
          {isPinned && (
            <span title="Pinned" style={{ fontSize: 10, color: 'var(--de-gold)' }}>📌</span>
          )}
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

        {/* Overflow menu "…" (req 25) */}
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
              borderRadius: 14, padding: 6, minWidth: 190,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}>

              {/* ── Group 1: Configure · Source · Rename · Recolor ── */}
              {show(onConfigure) && menuBtn('⚙️  Configure', onConfigure)}
              {show(onSourceSelect) && menuBtn('🔌  Source', onSourceSelect)}
              {show(onRename) && menuBtn('✏️  Rename', onRename)}
              {show(onRecolor) && menuBtn('🎨  Recolor', onRecolor)}

              {/* separator before group 2 (only if group 1 AND group 2 have items) */}
              {(show(onConfigure) || show(onSourceSelect) || show(onRename) || show(onRecolor)) &&
               (show(onPin) || show(onDuplicate) || show(onMove)) && (
                <MenuSeparator />
              )}

              {/* ── Group 2: Pin · Duplicate · Move ── */}
              {show(onPin) && menuBtn(
                isPinned ? '📌  Unpin' : '📌  Pin / Favorite',
                onPin,
                { checked: isPinned },
              )}
              {show(onDuplicate) && menuBtn('⧉  Duplicate', onDuplicate)}
              {show(onMove) && menuBtn('↕  Move', onMove)}

              {/* separator before group 3 */}
              {(show(onPin) || show(onDuplicate) || show(onMove) ||
                show(onConfigure) || show(onSourceSelect) || show(onRename) || show(onRecolor)) &&
               (show(onPermissions) || hasVisibilityControl || show(onHide) || show(onRemove)) && (
                <MenuSeparator />
              )}

              {/* ── Group 3: Permissions · Visibility · Remove ── */}
              {show(onPermissions) && menuBtn('🔐  Permissions', onPermissions)}
              {visibilityItems}
              {show(onRemove) && menuBtn('🗑  Remove Dream', onRemove, { danger: true })}
            </div>
          )}
        </div>
      </div>

      {/* ── Body — fixed height prevents layout shift (req 26) ── */}
      <div
        className="de-widget-body"
        style={{ minHeight: minContentHeight, position: 'relative' }}
      >
        <WidgetErrorBoundary title={title}>
          {dataState === 'loading' && (
            // Skeleton (req 22-23) — mimics real widget layout (req 23)
            <div style={{ padding: '12px 4px' }}>
              <SkeletonRow width="60%" />
              <SkeletonRow width="90%" />
              <SkeletonRow width="75%" />
              <SkeletonRow width="50%" />
            </div>
          )}

          {dataState === 'ready' && children}

          {(dataState === 'error' || dataState === 'reconnect_required') && (
            // Graceful error — no raw stacks (req 28-30)
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
        </WidgetErrorBoundary>
      </div>

      {/* Pulse animation injected once */}
      <style>{`
        @keyframes de-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

