'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, ChevronRight,
  Music, ShoppingBag,
  Sparkles, Gamepad2, FlaskConical, Code2, Palette, Pen,
  Users, TrendingUp, Star, BarChart3,
} from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';
import { useNotifications } from '@/lib/notifications/useNotifications';
import DreamWord from '@/components/ui/DreamWord';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';
import DrEamsSearchBar from '@/components/dreamengin/DrEamsSearchBar';
import HomeFeed from '@/components/HomeFeed';

// -- AI Triad agent definitions -- only the user-facing agent is shown to all users --
// IDARi and TheBoogieMan are admin-only per IDARI_CONTRACT.md
const AI_AGENTS_USER = [
  { id: 'dr-eams', name: 'Dr. Eams', initial: '\u25c8', bg: '#4A90D9', iconColor: '#fff', time: '11:50 PM', sub: '03:40 PM' },
] as const;

const AI_AGENTS_ADMIN = [
  { id: 'dr-eams',   name: 'Dr. Eams',     initial: '\u25c8', bg: '#4A90D9', iconColor: '#fff',    time: '11:50 PM', sub: '03:40 PM' },
  { id: 'idari',     name: 'IDARi',        initial: '\u2b21', bg: '#1a1a1a', iconColor: '#c8981a', time: '1:50 PM',  sub: '02:30 PM' },
  { id: 'boogieman', name: 'TheBoogieMan', initial: '\U0001f441', bg: '#2d1a4a', iconColor: '#fff',    time: '1:30 PM',  sub: '1:30 PM'  },
] as const;

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
  /** Open a URL inside the current runtime region (no full-page navigation). */
  onOpenUrl?: (url: string, title?: string) => void;
  isAdmin?: boolean;
}

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
        {isDrEams ? 'Tap to chat \u25c8' : isIdari ? 'Admin only \u2b21' : 'Policy enforcer \U0001f441'}
      </div>
    </button>
  );
}

function WindowChrome({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '10px 16px',
      borderBottom: '1px solid rgba(180,185,200,0.14)',
      background: 'rgba(255,255,255,0.45)',
    }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
      </div>
      <span style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--de-heading)', letterSpacing: '-0.01em' }}>
        {title}
      </span>
    </div>
  );
}

function ActivityCard({ post, index }: { post: Post; index: number }) {
  const handle = post.profiles?.handle ?? post.handle ?? 'unknown';
  const content = post.content ?? post.text ?? '';
  const colors = ['#c8981a', '#4A9ED6', '#6366f1', '#22c55e', '#ec4899'];
  const color = colors[index % colors.length];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid rgba(180,185,200,0.10)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: color, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: '#fff', fontWeight: 700,
      }}>
        {handle[0]?.toUpperCase() ?? '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 2 }}>@{handle}</div>
        <div style={{ fontSize: 11, color: 'var(--de-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {content || '\u2014'}
        </div>
      </div>
    </div>
  );
}

function MetricWidget({ icon: Icon, label, value, sub, color }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: string;
  sub: string;
  color: string;
  trend?: number[];
}) {
  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid rgba(180,185,200,0.16)',
      background: 'rgba(255,255,255,0.55)',
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon size={13} style={{ color }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{sub}</div>
    </div>
  );
}

function MetricBandCell({ value, label, color, last }: { value: string; label: string; color: string; last?: boolean }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '10px 4px',
      borderRight: last ? 'none' : '1px solid rgba(180,185,200,0.12)',
    }}>
      <div style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, primary }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="de-pressable"
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        padding: '10px 6px',
        borderRadius: 14,
        background: primary
          ? 'linear-gradient(135deg, rgba(200,152,26,0.18), rgba(224,184,48,0.10))'
          : 'rgba(255,255,255,0.50)',
        border: primary
          ? '1px solid rgba(200,152,26,0.30)'
          : '1px solid rgba(180,185,200,0.22)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Icon size={16} style={{ color: primary ? '#c8981a' : 'var(--de-heading)' }} />
      <span style={{ fontSize: 10, fontWeight: 600, color: primary ? '#c8981a' : 'var(--de-heading)' }}>{label}</span>
    </button>
  );
}

export default function WorkspaceDashboard({ profile, posts, onOpenDrEams, onOpenDreamSpace, onOpenUrl, isAdmin = false }: WorkspaceDashboardProps) {
  const router = useRouter();
  const name = profile?.display_name || profile?.handle || 'Dreamer';
  const { enterCustomizeMode } = useCustomizeMode();

  const openPage = (url: string, title?: string) => {
    if (onOpenUrl) {
      onOpenUrl(url, title);
    } else {
      router.push(url);
    }
  };

  const AI_AGENTS = isAdmin ? AI_AGENTS_ADMIN : AI_AGENTS_USER;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

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
      .catch(() => {});
  }, [profile?.id]);

  const formatCount = (n: number | null) => {
    if (n === null) return '\u2014';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const realPostCount = posts.length;
  const feedPosts = posts.slice(0, 20);

  return (
    <>
      <div
        data-scroll
        style={{ minHeight: '100%', width: '100%', paddingBottom: 140 }}
      >
        {/* Floating header */}
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
          <span style={{
            fontFamily: 'var(--font-cormorant, Georgia, serif)', fontStyle: 'italic',
            fontSize: 24, fontWeight: 400,
            letterSpacing: '-0.01em', flexShrink: 0,
            display: 'flex', alignItems: 'baseline',
          }}>
            <span className="de-dream-word">dream</span>
            <span style={{ color: '#a07828' }}>engin</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                aria-label={`Notifications${unreadCount > 0 ? ` \u2014 ${unreadCount} unread` : ''}`}
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

        {/* Page body */}
        <div style={{ padding: '20px 16px 0' }}>

          {/* Hero greeting */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)', fontWeight: 500, marginBottom: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {greeting}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
              {name}
            </div>
            <div style={{ marginBottom: 14 }}>
              <DrEamsSearchBar onOpenDrEams={onOpenDrEams} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                    padding: '7px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
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

          {/* Stats band */}
          <div style={{
            display: 'flex', borderRadius: 18,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 24, overflow: 'hidden',
          }}>
            {[
              { value: String(realPostCount), label: 'Posts', color: 'var(--de-gold)' },
              { value: formatCount(stats.followers), label: 'Followers', color: '#4A9ED6' },
              { value: formatCount(stats.following), label: 'Following', color: '#6366f1' },
              { value: '\u2014', label: 'Reach', color: '#22c55e' },
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

          {/* DreamSpace Portal */}
          {onOpenDreamSpace && (
            <button
              type="button"
              onClick={onOpenDreamSpace}
              className="de-pressable"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', marginBottom: 20,
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
                <span style={{ fontSize: 15, color: '#fff' }}>\u2746</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.2, marginBottom: 2 }}>
                  Open <DreamWord />Space
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', fontWeight: 500 }}>
                  Daydreams, feeds &amp; dream windows
                </div>
              </div>
              <ChevronRight size={15} style={{ color: '#c8981a', flexShrink: 0 }} />
            </button>
          )}

          {/* WORKSPACE WINDOW PANEL */}
          <div style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.90)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 2px 12px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <WindowChrome title="HomeDream" />

            {/* Activity feed */}
            <div style={{ padding: '14px 18px 0' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>
                  Recent Activity
                </span>
                {feedPosts.length > 0 && (
                  <span
                    aria-label={`${feedPosts.length} new activities`}
                    style={{
                      background: 'rgba(200,152,26,0.12)', color: '#c8981a',
                      borderRadius: 100, fontSize: 11, fontWeight: 600, padding: '3px 10px',
                    }}
                  >
                    {feedPosts.length} new
                  </span>
                )}
              </div>
              <div
                data-scroll
                style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', marginBottom: 4, WebkitOverflowScrolling: 'touch' }}
              >
                {AI_AGENTS.map(agent => (
                  <AgentActivityCard key={agent.id} agent={agent} onOpenDrEams={onOpenDrEams} />
                ))}
              </div>
              <div
                data-scroll
                style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4, WebkitOverflowScrolling: 'touch' }}
              >
                {feedPosts.length > 0 ? (
                  feedPosts.slice(0, 8).map((post, i) => (
                    <ActivityCard key={post.id || i} post={post} index={i} />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--de-text-dim)', fontSize: 12 }}>
                    Your feed is live.{' '}
                    <button type="button" onClick={() => openPage('/daydream/create', 'Create')} style={{ color: 'var(--de-accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>Post something</button>
                    {' '}or{' '}
                    <button type="button" onClick={() => openPage('/discover', 'Discover')} style={{ color: 'var(--de-accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>Discover creators</button>{' '}
                    to fill it.
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => openPage('/discover', 'Discover')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '10px 0',
                  fontSize: 12, color: 'var(--de-accent)', fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                View all activity <ChevronRight size={13} />
              </button>
            </div>

            {/* Metric widgets 2x2 */}
            <div style={{ padding: '0 16px', marginBottom: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>Telemetry</span>
                <button
                  type="button"
                  onClick={() => openPage('/analytics', 'Analytics')}
                  style={{ fontSize: 12, color: 'var(--de-accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, WebkitTapHighlightColor: 'transparent' }}
                >
                  Full stats <ChevronRight size={12} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <MetricWidget icon={Users}     label="Followers" value={formatCount(stats.followers)} sub={stats.followers !== null ? 'real-time' : 'loading\u2026'} color="#c8981a" />
                <MetricWidget icon={TrendingUp} label="Following" value={formatCount(stats.following)} sub={stats.following !== null ? 'real-time' : 'loading\u2026'} color="#4A9ED6" />
                <MetricWidget icon={Star}      label="Posts"     value={String(realPostCount)} sub="public feed" color="#6366f1" />
                <MetricWidget icon={BarChart3} label="Activity"  value={posts.length > 0 ? 'Active' : '\u2014'} sub={posts.length > 0 ? `${posts.length} recent` : 'No posts yet'} color="#22c55e" />
              </div>
            </div>

            {/* Metrics status band */}
            <div style={{ display: 'flex', borderTop: '1px solid rgba(180,185,200,0.12)', borderBottom: '1px solid rgba(180,185,200,0.12)', background: 'rgba(255,255,255,0.38)' }}>
              <MetricBandCell value={String(realPostCount)} label="Posts"     color="var(--de-gold)" />
              <MetricBandCell value={formatCount(stats.followers)} label="Followers" color="#4A9ED6" />
              <MetricBandCell value={formatCount(stats.following)} label="Following" color="#6366f1" />
              <MetricBandCell value="\u2014" label="Reach" color="#22c55e" last />
            </div>

            {/* Action controls */}
            <div style={{ padding: '14px 16px 16px', background: 'rgba(255,255,255,0.28)' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <ActionBtn icon={Sparkles}    label="Dr. Eams" onClick={onOpenDrEams} primary />
                <ActionBtn icon={ShoppingBag} label="Shop"     onClick={() => openPage('/shop', 'Shop')} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <ActionBtn icon={Music}        label="Music"  onClick={() => openPage('/daydream/music', 'Music')} />
                <ActionBtn icon={Gamepad2}     label="Games"  onClick={() => openPage('/daydream/games', 'Games')} />
                <ActionBtn icon={FlaskConical} label="Lab"    onClick={() => openPage('/daydream/lab', 'Lab')} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <ActionBtn icon={Code2}   label="Code"   onClick={() => openPage('/daydream/code', 'Code')} />
                <ActionBtn icon={Palette} label="Brand"  onClick={() => openPage('/daydream/brand', 'Brand')} />
                <ActionBtn icon={Pen}     label="Create" onClick={() => openPage('/daydream/create', 'Create')} />
              </div>
            </div>
          </div>

          {/* Widget glass zone - Feed */}
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
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>Feed</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '12px 16px 16px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <button
                  key={`widget-slot-${i}`}
                  type="button"
                  onClick={() => openPage('/connectors', 'Connectors')}
                  className="de-card-pressable"
                  style={{
                    minHeight: 92, borderRadius: 18,
                    border: '1px solid rgba(180,185,200,0.20)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.15))',
                    boxShadow: 'inset 0 1px 8px rgba(255,255,255,0.30), 0 2px 10px rgba(0,0,0,0.04)',
                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 6,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px dashed rgba(180,185,200,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--de-text-dim)' }}>+</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)', fontWeight: 500 }}>Add widget</span>
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
