'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';

import NotificationCenter from '@/components/NotificationCenter';
import HomeFeed from '@/components/HomeFeed';
import BrandLogo from '@/components/BrandLogo';
import DaydreamPulseStrip from '@/components/home/DaydreamPulseStrip';
import { useNotifications } from '@/lib/notifications/useNotifications';
import { isCompactRuntimeViewport } from '@/lib/ui/runtimeViewport';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type Post = Record<string, any>;

const RUNTIME_SIGNALS = [
  {
    label: 'Runtime status',
    value: 'Dual surfaces live',
    detail: 'Surface Space and DreamSpace stay hot so switching feels instant.',
  },
  {
    label: 'Command access',
    value: 'Dr. Eams ready',
    detail: 'Profile, feed, and AI actions stay reachable without breaking flow.',
  },
  {
    label: 'System posture',
    value: 'Modern shell',
    detail: 'Glass depth, sticky controls, and focused actions keep the OS legible.',
  },
];

const WHIPREV_MANIFESTO = {
  badge: '⚡ WhipRev: The Human Media Manifesto',
  title: 'Dreamengin.com is where WhipRev lives inside the HomeDream.',
  detail:
    'Seen, not judged: the HomeDream feed stays grounded while human media moves through it.',
};

interface WorkspaceDashboardProps {
  profile: ProfileLike | null;
  posts: Post[];
  onOpenDrEams: () => void;
  onOpenDreamSpace?: () => void;
  onOpenInRegion?: (path: string) => void;
  onOpenUrl?: (url: string, title?: string) => void;
  isAdmin?: boolean;
  userId?: string;
}

function QuickLink({
  label,
  onClick,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={primary ? 'de-pressable-primary' : 'de-pressable'}
      style={{
        borderRadius: 999,
        border: primary
          ? '1.5px solid rgba(200,152,26,0.35)'
          : '1px solid rgba(180,185,200,0.22)',
        background: primary
          ? 'linear-gradient(135deg, rgba(200,152,26,0.16), rgba(200,152,26,0.07))'
          : 'rgba(255,255,255,0.72)',
        color: 'var(--de-heading)',
        padding: '8px 14px',
        fontSize: 12,
        fontWeight: primary ? 700 : 600,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: primary
          ? '0 2px 8px rgba(200,152,26,0.10)'
          : '0 1px 3px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.45)',
        transition: 'all 0.18s ease',
      }}
    >
      {label}
    </button>
  );
}

export default function WorkspaceDashboard({
  profile,
  posts,
  onOpenDrEams,
  onOpenDreamSpace,
  onOpenUrl,
}: WorkspaceDashboardProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const { unreadCount } = useNotifications();

  const name = profile?.display_name || profile?.handle || 'Dreamer';
  const isCompactViewport = isCompactRuntimeViewport(viewportWidth);

  const openPage = (url: string, title?: string) => {
    if (onOpenUrl) {
      onOpenUrl(url, title);
      return;
    }
    router.push(url);
  };

  useEffect(() => {
    const updateViewport = () => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      setViewportWidth(width);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
    };
  }, []);

  return (
    <div
      className="de-shell"
      data-scroll
      style={{
        minHeight: '100%',
        width: '100%',
        paddingBottom: isCompactViewport
          ? 'calc(env(safe-area-inset-bottom, 0px) + 168px)'
          : 'calc(env(safe-area-inset-bottom, 0px) + 132px)',
      }}
    >
      <div
        className="de-surface"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: isCompactViewport
            ? 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px'
            : '16px 20px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(248,251,255,0.92) 0%, rgba(236,244,252,0.80) 100%)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          borderBottom: '1px solid rgba(160,195,240,0.14)',
          boxShadow: '0 10px 30px rgba(15,30,52,0.08)',
          pointerEvents: 'auto',
          borderRadius: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <BrandLogo width={isCompactViewport ? 26 : 30} height={isCompactViewport ? 26 : 30} alt="DREAMengin" />
          <span
            style={{
              fontFamily: 'var(--font-cormorant, Georgia, serif)',
              fontStyle: 'italic',
              fontSize: isCompactViewport ? 22 : 24,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            <span className="de-dream-word">dream</span>
            <span style={{ color: '#a07828' }}>engin</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isCompactViewport ? 8 : 12 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
              onClick={() => setNotifOpen((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                color: 'var(--de-text-dim)',
                position: 'relative',
                minWidth: 40,
                minHeight: 40,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: '#c8981a',
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 800,
                    borderRadius: '50%',
                    minWidth: 14,
                    height: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    padding: '0 2px',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
            )}
            {notifOpen && (
              <div
                aria-hidden="true"
                style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                onClick={() => setNotifOpen(false)}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => openPage('/edit-profiledream', 'DreamProfile')}
            style={{
              fontSize: isCompactViewport ? 13 : 14,
              color: 'var(--de-text-dim)',
              background: 'none',
              border: 'none',
              fontWeight: isCompactViewport ? 600 : 500,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              padding: isCompactViewport ? '8px 0 8px 2px' : '8px 0 8px 4px',
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isCompactViewport ? 'Profile ›' : 'Edit ProfileDream ›'}
          </button>
        </div>
      </div>

      <div style={{ padding: isCompactViewport ? '16px 12px 0' : '20px 16px 0' }}>
        <div style={{ marginBottom: 14 }}>
          <div className="de-auth-hero de-surface" style={{ marginBottom: 12, padding: isCompactViewport ? 16 : 18 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="de-kicker" style={{ marginBottom: 10 }}>HomeDream</div>
              <div
                className="sicc-gradient-text"
                style={{
                  fontSize: isCompactViewport ? 26 : 30,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  marginBottom: 10,
                }}
              >
                {name}&rsquo;s feed
              </div>
              <div className="de-command-chip" style={{ marginBottom: 10 }}>
                {WHIPREV_MANIFESTO.badge}
              </div>
              <div style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.65, maxWidth: 680, marginBottom: 12 }}>
                {WHIPREV_MANIFESTO.title} {WHIPREV_MANIFESTO.detail}
              </div>
              <div className="de-toolbar">
                <QuickLink label="Edit ProfileDream" onClick={() => openPage('/edit-profiledream', 'Edit ProfileDream')} />
                <QuickLink label="View Profile" onClick={() => openPage('/view-profile', 'View Profile')} />
                {onOpenDreamSpace && (
                  <QuickLink label="Daydreams" onClick={onOpenDreamSpace} primary />
                )}
                <QuickLink label="Dr. Eams" onClick={onOpenDrEams} />
              </div>
            </div>
          </div>
        </div>

        <div
          className="sicc-glass-in"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            borderRadius: isCompactViewport ? 20 : 24,
            border: '1px solid rgba(255,255,255,0.92)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.60)',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: isCompactViewport ? '12px 14px 10px' : '14px 18px 12px',
              borderBottom: '1px solid rgba(180,185,200,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)' }}>
                HomeDream Feed
              </div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>
                WhipRev lives inside HomeDream — feed first, seen not judged.
              </div>
            </div>
            {onOpenDreamSpace && (
              <button
                type="button"
                onClick={onOpenDreamSpace}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 0',
                  fontSize: 12,
                  color: 'var(--de-accent)',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Daydreams <ChevronRight size={13} />
              </button>
            )}
          </div>

          <HomeFeed
            userId={profile?.id ?? ''}
            userHandle={profile?.handle ?? 'user'}
            userAvatar={profile?.avatar_url ?? null}
            userDisplayName={profile?.display_name || profile?.handle || 'Dreamer'}
            initialPosts={posts as Parameters<typeof HomeFeed>[0]['initialPosts']}
            embedded
          />
        </div>

        <div className="de-panel-grid" style={{ marginBottom: 14 }}>
          {RUNTIME_SIGNALS.map((signal) => (
            <div key={signal.label} className="de-signal-card">
              <span className="de-signal-label">{signal.label}</span>
              <span className="de-signal-value">{signal.value}</span>
              <span className="de-signal-detail">{signal.detail}</span>
            </div>
          ))}
        </div>

        <div className="de-surface" style={{ padding: isCompactViewport ? 12 : 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <div>
              <div className="de-signal-label" style={{ marginBottom: 4 }}>Fast travel</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--de-heading)', letterSpacing: '-0.02em' }}>
                Daydream launch strip
              </div>
            </div>
            <div className="de-command-chip">6 surfaces · 1 operating shell</div>
          </div>
          <DaydreamPulseStrip onOpenDaydream={(href, label) => openPage(href, `${label} Daydream`)} />
        </div>
      </div>
    </div>
  );
}
