'use client';

/**
 * NotificationCenter — wired to the real /api/notifications backend.
 *
 * Architecture justification:
 *   - docs/AXIOMS.md: every visible action must do something real.
 *     This component previously showed five hardcoded demo notifications.
 *     It now renders live data from lib/notifications/useNotifications.ts.
 *   - docs/ARCHITECTURE.md §8: Gold / light-blue design system; badge uses
 *     the canonical gold accent to signal an actionable live state.
 *   - docs/LAW.md §3: every visible action must do something real.
 *
 * Can be used standalone (renders its own trigger bell) or in controlled
 * mode when `isOpen` + `onClose` are provided by a parent (e.g.
 * WorkspaceDashboard, which controls its own Bell button and badge).
 *
 * Performance: render-on-demand; no render loops. The hook polls every 30 s.
 */

import {
  Bell,
  Check,
  DollarSign,
  GitBranch,
  Heart,
  Loader2,
  MessageCircle,
  MessageSquare,
  TrendingUp,
  UserPlus,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useNotifications } from '@/lib/notifications/useNotifications';
import type { UiNotification, UiNotificationType } from '@/lib/notifications/notificationHelpers';

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

function NotifIcon({ type }: { type: UiNotificationType }) {
  switch (type) {
    case 'like':     return <Heart    size={14} style={{ color: '#ef4444', flexShrink: 0 }} />;
    case 'comment':  return <MessageSquare size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />;
    case 'follow':   return <UserPlus size={14} style={{ color: '#22c55e', flexShrink: 0 }} />;
    case 'trending': return <TrendingUp size={14} style={{ color: '#f97316', flexShrink: 0 }} />;
    case 'revenue':  return <DollarSign size={14} style={{ color: '#10b981', flexShrink: 0 }} />;
    case 'message':  return <MessageCircle size={14} style={{ color: '#4A90D9', flexShrink: 0 }} />;
    case 'remix':    return <GitBranch size={14} style={{ color: '#c8981a', flexShrink: 0 }} />;
    default:         return <Bell size={14} style={{ color: 'var(--de-text-dim)', flexShrink: 0 }} />;
  }
}

// ---------------------------------------------------------------------------
// Timestamp formatter
// ---------------------------------------------------------------------------

function formatTs(ts: Date): string {
  const diff = Date.now() - ts.getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ---------------------------------------------------------------------------
// Single notification row
// ---------------------------------------------------------------------------

interface NotifRowProps {
  n: UiNotification;
  onRead:   (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function NotifRow({ n, onRead, onDelete }: NotifRowProps) {
  const router = useRouter();

  const handleClick = async () => {
    if (!n.read) await onRead(n.id);
    if (n.actionUrl) router.push(n.actionUrl);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => void handleClick()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') void handleClick(); }}
      className={`notif-card${!n.read ? ' unread' : ''}`}
      data-type={n.type}
    >
      {/* Type icon container */}
      <div className="notif-icon" data-type={n.type} style={{ marginTop: 1 }}>
        <NotifIcon type={n.type} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          marginBottom: 2,
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--de-heading)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {n.title}
          </span>
          {/* Unread dot */}
          {!n.read && (
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--de-accent)', flexShrink: 0,
              boxShadow: '0 0 6px rgba(56,189,248,0.6)',
            }} />
          )}
        </div>
        <p style={{
          fontSize: 12,
          color: 'var(--de-text-dim)',
          margin: 0,
          lineHeight: 1.45,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {n.message}
        </p>
        <span style={{ fontSize: 10, color: 'var(--de-text-dim)', opacity: 0.6, marginTop: 3, display: 'block', letterSpacing: '0.01em' }}>
          {formatTs(n.timestamp)}
        </span>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => { e.stopPropagation(); void onDelete(n.id); }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: 0,
          color: 'var(--de-text-dim)',
          borderRadius: 6,
          transition: 'opacity 0.15s, background 0.12s',
        }}
        className="notif-dismiss-btn"
      >
        <X size={11} />
      </button>

      <style>{`
        .notif-card:hover .notif-dismiss-btn { opacity: 0.55 !important; }
        .notif-dismiss-btn:hover { opacity: 1 !important; background: rgba(160,195,240,0.14) !important; }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotificationCenterProps {
  /**
   * Controlled mode: when provided, the component renders only the panel
   * (no trigger bell). The parent is responsible for showing/hiding.
   */
  isOpen?: boolean;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NotificationCenter({ isOpen: controlledOpen, onClose }: NotificationCenterProps) {
  // Self-contained open/close when not controlled externally
  const [selfOpen, setSelfOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open         = isControlled ? controlledOpen : selfOpen;
  const close        = isControlled ? (onClose ?? (() => {})) : () => setSelfOpen(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const panelRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const panel = open && (
    <>
      {/* Backdrop (only in uncontrolled / standalone mode) */}
      {!isControlled && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={close}
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        style={{
          position: isControlled ? 'fixed' : 'absolute',
          ...(isControlled
            ? { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
            : { top: '100%', right: 0, marginTop: 8 }),
          width: 'min(24rem, 96vw)',
          maxHeight: '72vh',
          background: 'rgba(250,252,255,0.96)',
          backdropFilter: 'blur(36px) saturate(180%)',
          WebkitBackdropFilter: 'blur(36px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.85)',
          borderRadius: 22,
          boxShadow: '0 4px 8px rgba(0,0,0,0.04), 0 16px 56px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(160,195,240,0.35)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'de-notif-in 0.26s cubic-bezier(0.34,1.22,0.64,1)',
        }}
      >
        <style>{`
          @keyframes de-notif-in {
            from { opacity: 0; transform: translateY(-10px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px 12px',
          borderBottom: '1px solid rgba(160,195,240,0.18)',
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.90) 0%, rgba(248,250,255,0.80) 100%)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(200,152,26,0.12))',
            border: '1px solid rgba(160,195,240,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bell size={13} style={{ color: 'var(--de-heading)' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--de-heading)', flex: 1, letterSpacing: '-0.01em' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800,
              background: 'rgba(56,189,248,0.12)',
              color: 'var(--de-accent)',
              padding: '3px 8px', borderRadius: 99,
              border: '1px solid rgba(56,189,248,0.22)',
              letterSpacing: '0.02em',
            }}>
              {unreadCount} new
            </span>
          )}
          <button
            type="button"
            aria-label="Close notifications"
            onClick={close}
            style={{
              background: 'rgba(160,195,240,0.10)',
              border: '1px solid rgba(160,195,240,0.18)',
              borderRadius: 8,
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--de-text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.12s',
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* ── Mark all as read ── */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(160,195,240,0.12)',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--de-accent)',
              flexShrink: 0,
              letterSpacing: '0.02em',
            }}
          >
            <Check size={11} />
            Mark all as read
          </button>
        )}

        {/* ── List ── */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <Loader2 size={20} style={{ color: '#4A90D9', animation: 'de-spin 0.8s linear infinite' }} />
              <style>{`@keyframes de-spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!isLoading && error && (
            <div style={{ padding: 16, fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!isLoading && !error && notifications.length === 0 && (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--de-text-dim)',
            }}>
              <Bell size={28} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
              <p style={{ fontSize: 13, margin: 0 }}>You're all caught up 🎉</p>
              <p style={{ fontSize: 11, margin: '4px 0 0', opacity: 0.6 }}>No new notifications</p>
            </div>
          )}

          {!isLoading && !error && notifications.map((n) => (
            <NotifRow
              key={n.id}
              n={n}
              onRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      </div>
    </>
  );

  // Standalone mode: render trigger bell + panel
  if (!isControlled) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
          onClick={() => setSelfOpen((v) => !v)}
          style={{
            position: 'relative',
            padding: 8,
            borderRadius: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            color: 'var(--de-text-dim)',
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              background: '#c8981a',
              color: '#fff',
              fontSize: 9, fontWeight: 800,
              borderRadius: '50%',
              width: 14, height: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid rgba(220,232,248,0.9)',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {panel}
      </div>
    );
  }

  // Controlled mode: parent renders the trigger; we just render the panel
  return <>{panel}</>;
}
