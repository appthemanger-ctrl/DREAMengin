'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, ChevronRight,
  Music, ShoppingBag,
  Sparkles, Gamepad2, FlaskConical, Code2, Palette, Pen,
} from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';
import { useNotifications } from '@/lib/notifications/useNotifications';
import DreamWord from '@/components/ui/DreamWord';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';
import DrEamsSearchBar from '@/components/dreamengin/DrEamsSearchBar';
import HomeFeed from '@/components/HomeFeed';

// ── AI Triad agent definitions ─────────────────────────────────────────────────

// ── AI Triad agent definitions — only the user-facing agent is shown to all users ──
// IDARi and TheBoogieMan are admin-only per IDARI_CONTRACT.md
const AI_AGENTS_USER = [
  { id: 'dr-eams', name: 'Dr. Eams', initial: '◈', bg: '#4A90D9', iconColor: '#fff', time: '11:50 PM', sub: '03:40 PM' },
] as const;

const AI_AGENTS_ADMIN = [
  { id: 'dr-eams',   name: 'Dr. Eams',     initial: '◈', bg: '#4A90D9', iconColor: '#fff',    time: '11:50 PM', sub: '03:40 PM' },
  { id: 'idari',     name: 'IDARi',        initial: '⬡', bg: '#1a1a1a', iconColor: '#c8981a', time: '1:50 PM',  sub: '02:30 PM' },
  { id: 'boogieman', name: 'TheBoogieMan', initial: '👁', bg: '#2d1a4a', iconColor: '#fff',    time: '1:30 PM',  sub: '1:30 PM'  },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Post = Record<string, any>;

interface WorkspaceDashboardProps {
  profile: ProfileLike | null;
  posts: Post[];
  onOpenDrEams: () => void;
  onOpenDreamSpace?: () => void;
  /** Open a path contained inside this runtime region (iframe) */
  onOpenInRegion?: (path: string) => void;
  /** Open a URL inside the current runtime region (no full-page navigation). */
  onOpenUrl?: (url: string, title?: string) => void;
  isAdmin?: boolean;
}

// ── AI Agent activity card ─────────────────────────────────────────────────────

type AgentType = typeof AI_AGENTS_USER[number] | typeof AI_AGENTS_ADMIN[number];

function AgentActivityCard({ agent, onOpenDrEams }: { agent: AgentType; onOpenDrEams?: () => void }) {
  const isDrEams = agent.id === 'dr-eams';
  const isIdari  = agent.id === 'idari';

  const handleClick = isDrEams ? onOpenDrEams : undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={handleClick ? 'de-pressable' : undefined}
      style={{
        minWidth: 152, flexShrink: 0,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 18,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: `1px solid ${isDrEams ? 'rgba(200,152,26,0.20)' : 'rgba(180,185,200,0.18)'}`,
        cursor: handleClick ? 'pointer' : 'default',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: agent.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: agent.iconColor, flexShrink: 0,
        }}>
          {agent.initial}
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--de-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 88 }}>
          {agent.name}
        </span>
      </div>
      <div style={{ fontSize: 11, color: isDrEams ? 'var(--de-accent)' : 'var(--de-text-dim)', fontWeight: isDrEams ? 600 : 400 }}>
        {isDrEams ? 'Tap to chat ◈' : isIdari ? 'Admin only ⬡' : 'Policy enforcer 👁'}
      </div>
    </button>
  );
}

// ── Main WorkspaceDashboard ────────────────────────────────────────────────────

export default function WorkspaceDashboard({ profile, posts, onOpenDrEams, onOpenDreamSpace, onOpenInRegion, onOpenUrl, isAdmin = false }: WorkspaceDashboardProps) {
  const router = useRouter();
  const name = profile?.display_name || profile?.handle || 'Dreamer';
  const { enterCustomizeMode } = useCustomizeMode();

  /** Navigate inside the runtime region when possible, else use router. */
  const openPage = (url: string, title?: string) => {
    if (onOpenUrl) {
      onOpenUrl(url, title);
    } else {
      router.push(url);
    }
  };

  // Use admin or user agent list based on role
  const AI_AGENTS = isAdmin ? AI_AGENTS_ADMIN : AI_AGENTS_USER;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Live notification state ────────────────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  // ── Real profile stats — fetched from API on mount ────────────────────────
  const [stats, setStats] = useState<{ followers: number | null; following: number | null }>({
    followers: null,
    following: null,
  });

  useEffect(() => {
    if (!profile?.id) return;
    fetch(`/api/profile?user_id=${encodeURIComponent(profile.id)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.followers_count !== undefined) {
          setStats({ followers: data.followers_count ?? 0, following: data.following_count ?? 0 });
        }
      })
      .catch(() => { /* non-critical — leave as null */ });
  }, [profile?.id]);

  const formatCount = (n: number | null) => {
    if (n === null) return '—';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const realPostCount = posts.length;

  // Contained navigation helper — opens path in the runtime region, never full-page.
  // Falls back to router.push when used outside a runtime region.
  const openPath = (path: string) => {
    if (onOpenInRegion) {
      onOpenInRegion(path);
    } else {
      router.push(path);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Full-screen scrollable workspace ── */}
      <div
        data-scroll
        style={{
          minHeight: '100%',
          width: '100%',
          paddingBottom: 140,
        }}
      >
        {/* ── Floating header ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          padding: '16px 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(var(--de-bg-start-rgb, 2,8,24),0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          pointerEvents: 'auto',
        }}>
          {/* dreamengin wordmark */}
          <span style={{
            fontFamily: 'var(--font-cormorant, Georgia, serif)', fontStyle: 'italic',
            fontSize: 24, fontWeight: 400,
            letterSpacing: '-0.01em', flexShrink: 0,
            display: 'flex', alignItems: 'baseline',
          }}>
            <span className="de-dream-word">dream</span>
            <span style={{ color: '#a07828' }}>engin</span>
          </span>

          {/* Right side: notification bell + profile link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
                onClick={() => setNotifOpen((v) => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 10, color: 'var(--de-text-dim)', position: 'relative',
                  minWidth: 40, minHeight: 40,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span aria-hidden="true" style={{
                    position: 'absolute', top: 4, right: 4,
                    background: '#c8981a', color: '#fff',
                    fontSize: 8, fontWeight: 800, borderRadius: '50%',
                    minWidth: 14, height: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1, padding: '0 2px',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
              )}
              {notifOpen && (
                <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                  onClick={() => setNotifOpen(false)} />
              )}
            </div>

            {/* Flip to Profile — clean text navigation */}
            <button
              type="button"
              onClick={() => openPage('/edit-profiledream', 'DreamProfile')}
              style={{
                fontSize: 14, color: 'var(--de-text-dim)',
                background: 'none', border: 'none',
                fontWeight: 500,
                letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                padding: '8px 0 8px 4px', minHeight: 40,
                display: 'flex', alignItems: 'center',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Flip to Profile &rsaquo;
            </button>
          </div>
        </div>

        {/* ── Page body ── */}
        <div style={{ padding: '20px 16px 0' }}>

          {/* ── Hero greeting ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)', fontWeight: 500, marginBottom: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {greeting}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
              {name}
            </div>

            {/* ── Dr. Eams search bar — Phase 6: HomeDream search with send-to-DreamDM routing ── */}
            <div style={{ marginTop: 16, marginBottom: 4 }}>
              <DrEamsSearchBar onOpenDrEams={onOpenDrEams} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { href: '/edit-profiledream', label: 'DreamProfile' },
                { href: '/discover', label: 'Feed' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => openPage(item.href, item.label)}
                  className="de-pressable"
                  style={{
                    borderRadius: 999,
                    border: '1px solid rgba(180,185,200,0.30)',
                    background: 'rgba(255,255,255,0.65)',
                    color: 'var(--de-heading)',
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onOpenDreamSpace?.()}
                className="de-pressable"
                style={{
                  borderRadius: 999, border: '1px solid rgba(180,185,200,0.26)',
                  background: 'rgba(255,255,255,0.06)', color: 'var(--de-heading)',
                  padding: '7px 14px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                Dream Space
              </button>
              <button
                type="button"
                onClick={() => enterCustomizeMode('home')}
                className="de-pressable"
                style={{
                  borderRadius: 999, border: '1px solid rgba(58,111,216,0.30)',
                  background: 'rgba(58,111,216,0.07)', color: '#3a6fd8',
                  padding: '7px 14px', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 5,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Palette size={12} />
                Customize
              </button>
            </div>
          </div>

          {/* ── Stats band ── */}
          <div style={{
            display: 'flex', borderRadius: 18,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 24,
            overflow: 'hidden',
          }}>
            {[
              { value: String(realPostCount), label: 'Posts', color: 'var(--de-gold)' },
              { value: formatCount(stats.followers), label: 'Followers', color: '#4A9ED6' },
              { value: formatCount(stats.following), label: 'Following', color: '#6366f1' },
              { value: '—', label: 'Reach', color: '#22c55e' },
            ].map((cell, i, arr) => (
              <div key={cell.label} style={{
                flex: 1, textAlign: 'center', padding: '13px 4px',
                borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: cell.color, lineHeight: 1 }}>{cell.value}</div>
                <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cell.label}</div>
              </div>
            ))}
          </div>

          {/* ── AI Agent strip ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              AI Assistants
            </div>
            <div data-scroll style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              {AI_AGENTS.map(agent => (
                <AgentActivityCard key={agent.id} agent={agent} onOpenDrEams={onOpenDrEams} />
              ))}
            </div>
          </div>

          {/* ── Quick Launch — Daydream apps ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              Quick Launch
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
              {[
                { Icon: Music,        label: 'Music',  path: '/daydream/music' },
                { Icon: Gamepad2,     label: 'Games',  path: '/daydream/games' },
                { Icon: FlaskConical, label: 'Lab',    path: '/daydream/lab' },
                { Icon: Code2,        label: 'Code',   path: '/daydream/code' },
              ].map(({ Icon, label, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => openPath(path)}
                  className="de-pressable"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '14px 4px',
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                    cursor: 'pointer', minHeight: 72,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {React.createElement(Icon as any, { size: 20, style: { color: '#c8981a' } })}
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)', lineHeight: 1 }}>{label}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { Icon: Palette,     label: 'Brand',    gold: false, action: () => openPath('/daydream/brand') },
                { Icon: Pen,         label: 'Create',   gold: false, action: () => openPath('/daydream/create') },
                { Icon: ShoppingBag, label: 'Shop',     gold: false, action: () => openPath('/shop') },
                { Icon: Sparkles,    label: 'Dr. Eams', gold: true,  action: () => onOpenDrEams() },
              ].map(({ Icon, label, gold, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="de-pressable"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '14px 4px',
                    borderRadius: 18,
                    background: gold
                      ? 'linear-gradient(135deg, rgba(200,152,26,0.22), rgba(224,184,48,0.14))'
                      : 'rgba(255,255,255,0.06)',
                    border: gold
                      ? '1px solid rgba(200,152,26,0.35)'
                      : '1px solid rgba(255,255,255,0.09)',
                    boxShadow: gold
                      ? '0 4px 16px rgba(200,152,26,0.20)'
                      : '0 2px 12px rgba(0,0,0,0.18)',
                    cursor: 'pointer', minHeight: 72,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {React.createElement(Icon as any, { size: 20, style: { color: gold ? '#e0b830' : '#c8981a' } })}
                  <span style={{ fontSize: 11, fontWeight: 600, color: gold ? '#e0b830' : 'var(--de-heading)', lineHeight: 1 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── DreamSpace Portal ── */}
          {onOpenDreamSpace && (
            <button
              type="button"
              onClick={onOpenDreamSpace}
              className="de-pressable"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', marginBottom: 28,
                background: 'linear-gradient(135deg, rgba(200,152,26,0.10) 0%, rgba(74,158,214,0.07) 100%)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 20, border: '1px solid rgba(200,152,26,0.24)',
                boxShadow: '0 4px 20px rgba(200,152,26,0.10)',
                cursor: 'pointer', textAlign: 'left', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #c8981a, #d4a843)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 3px 10px rgba(200,152,26,0.28)',
              }}>
                <span style={{ fontSize: 15, color: '#fff' }}>✦</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.2, marginBottom: 2 }}>
                  Open <DreamWord />Space
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', fontWeight: 500 }}>
                  Daydreams, feeds & dream windows
                </div>
              </div>
              <ChevronRight size={15} style={{ color: '#c8981a', flexShrink: 0 }} />
            </button>
          )}

          {/* ── Feed section ── */}
          <div style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.90)',
            boxShadow: '0 6px 28px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(180,185,200,0.12)' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>
                Feed
              </span>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12, padding: '12px 16px 16px',
            }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <button
                  key={`widget-slot-${i}`}
                  type="button"
                  onClick={() => openPage('/connectors', 'Connectors')}
                  className="de-card-pressable"
                  style={{
                    minHeight: 92,
                    borderRadius: 18,
                    border: '1px solid rgba(180,185,200,0.20)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.15))',
                    boxShadow: 'inset 0 1px 8px rgba(255,255,255,0.30), 0 2px 10px rgba(0,0,0,0.04)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: '1.5px dashed rgba(180,185,200,0.40)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 14, color: 'var(--de-text-dim)' }}>+</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)', fontWeight: 500 }}>
                    Add widget
                  </span>
                </button>
              ))}
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

        </div>
      </div>

    </>
  );
}
