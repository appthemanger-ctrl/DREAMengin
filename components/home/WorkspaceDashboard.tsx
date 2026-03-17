'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell, BarChart3, TrendingUp, Users,
  Music, ShoppingBag, Star, ChevronRight,
  Sparkles, Gamepad2, FlaskConical, Code2, Palette, Pen,
} from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';
import { useNotifications } from '@/lib/notifications/useNotifications';
import DreamWord from '@/components/ui/DreamWord';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';
import DrEamsSearchBar from '@/components/dreamengin/DrEamsSearchBar';

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
  isAdmin?: boolean;
}

// ── Mini sparkline ─────────────────────────────────────────────────────────────

function MiniLine({ data, color = '#c8981a' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const W = 52, H = 20;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / r) * (H - 3) - 1}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Activity feed card — full width ────────────────────────────────────────────

function ActivityCard({ post, index }: { post: Post; index: number }) {
  const name = post?.profiles?.display_name || post?.profiles?.handle || `User ${index + 1}`;
  const handle = post?.profiles?.handle || 'user';
  const initials = name[0]?.toUpperCase() || 'U';
  const avatarUrl = post?.profiles?.avatar_url;
  const content = post?.content || post?.body || 'Shared a new dream';
  const time = post?.created_at
    ? new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : `${index + 1}h ago`;

  const COLORS = ['#4A9ED6', '#c8981a', '#6366f1', '#22c55e', '#ec4899'];
  const color = COLORS[index % COLORS.length];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid rgba(180,185,200,0.14)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        overflow: 'hidden',
        background: avatarUrl ? undefined : color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 700, color: '#fff',
        boxShadow: `0 3px 10px ${color}44`,
      }}>
        {avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>
          @{handle} · {content.slice(0, 52)}{content.length > 52 ? '…' : ''}
        </div>
      </div>

      {/* Time + dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{time}</span>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      </div>
    </div>
  );
}

// ── Metric instrument widget — fills its grid cell ────────────────────────────

function MetricWidget({
  icon: Icon, label, value, sub, color, trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  trend?: number[];
}) {
  return (
    <div className="de-card-pressable" style={{
      background: 'rgba(255,255,255,0.80)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 18,
      padding: '14px 14px 12px',
      border: '1px solid rgba(255,255,255,0.9)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {React.createElement(Icon as any, { size: 15, style: { color } })}
        </div>
        {trend && <MiniLine data={trend} color={color} />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 3, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, marginTop: 2, fontWeight: 700 }}>{sub}</div>}
    </div>
  );
}

// ── Metrics status band ────────────────────────────────────────────────────────

function MetricBandCell({ value, label, color = 'var(--de-gold)', last = false }:
  { value: string; label: string; color?: string; last?: boolean }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '12px 6px',
      borderRight: last ? 'none' : '1px solid rgba(180,185,200,0.18)',
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 3, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

// ── Action button — full width row ─────────────────────────────────────────────

function ActionBtn({ icon: Icon, label, onClick, primary }: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="de-pressable"
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        padding: '14px 4px',
        borderRadius: 18,
        background: primary
          ? 'linear-gradient(135deg, #c8981a, #e0b830)'
          : 'rgba(255,255,255,0.75)',
        border: primary ? 'none' : '1px solid rgba(180,185,200,0.22)',
        boxShadow: primary ? '0 6px 18px rgba(200,152,26,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
        minHeight: 64,
      }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {React.createElement(Icon as any, { size: 20, style: { color: primary ? '#fff' : 'var(--de-accent)' } })}
      <span style={{ fontSize: 11, fontWeight: 700,
        color: primary ? '#fff' : 'var(--de-heading)', lineHeight: 1 }}>
        {label}
      </span>
    </button>
  );
}

// ── Window chrome ──────────────────────────────────────────────────────────────

function WindowChrome({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '14px 18px 12px',
      borderBottom: '1px solid rgba(180,185,200,0.14)',
    }}>
      <span style={{
        fontSize: 13, fontWeight: 700, color: 'var(--de-heading)',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </span>
    </div>
  );
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

export default function WorkspaceDashboard({ profile, posts, onOpenDrEams, onOpenDreamSpace, isAdmin = false }: WorkspaceDashboardProps) {
  const router = useRouter();
  const name = profile?.display_name || profile?.handle || 'Dreamer';
  const { enterCustomizeMode } = useCustomizeMode();

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

  const feedPosts = posts.length > 0 ? posts.slice(0, 5) : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Full-screen scrollable workspace ── */}
      <div
        data-scroll
        style={{
          minHeight: '100svh',
          width: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 140,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* ── Floating header — no background bar, just text over gradient ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          padding: '18px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          pointerEvents: 'auto',
        }}>
          {/* dreamengin wordmark — "dream" gets metallic gold, "engin" keeps cormorant italic */}
          <span style={{
            fontFamily: 'var(--font-cormorant, Georgia, serif)', fontStyle: 'italic',
            fontSize: 26, fontWeight: 400,
            letterSpacing: '-0.01em', flexShrink: 0,
            display: 'flex', alignItems: 'baseline',
          }}>
            <span className="de-dream-word">dream</span>
            <span style={{ color: '#a07828' }}>engin</span>
          </span>

          {/* Right side: notification bell + flip to profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Notification bell — wired to real /api/notifications */}
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
                  minWidth: 40, minHeight: 40,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'opacity 0.1s ease',
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: '#c8981a',
                      color: '#fff',
                      fontSize: 8, fontWeight: 800,
                      borderRadius: '50%',
                      minWidth: 14, height: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                      padding: '0 2px',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification panel */}
              {notifOpen && (
                <NotificationCenter
                  isOpen={notifOpen}
                  onClose={() => setNotifOpen(false)}
                />
              )}
              {/* Backdrop to close panel on outside click */}
              {notifOpen && (
                <div
                  aria-hidden="true"
                  style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                  onClick={() => setNotifOpen(false)}
                />
              )}
            </div>

            {/* Flip to Profile — clean text navigation */}
            <Link href="/edit-profiledream" style={{
              fontSize: 14, color: 'var(--de-text-dim)',
              textDecoration: 'none', fontWeight: 500,
              letterSpacing: '-0.01em', whiteSpace: 'nowrap',
              padding: '8px 0 8px 4px', minHeight: 40,
              display: 'flex', alignItems: 'center',
            }}>
              Flip to Profile &rsaquo;
            </Link>
          </div>
        </div>

        {/* ── Page body ── */}
        <div style={{ padding: '4px 16px 0' }}>

          {/* Greeting */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--de-text-dim)', fontWeight: 500, marginBottom: 4 }}>{greeting},</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
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
                <Link
                  key={item.label}
                  href={item.href}
                  className="de-pressable"
                  style={{
                    borderRadius: 999,
                    border: '1px solid rgba(180,185,200,0.30)',
                    background: 'rgba(255,255,255,0.65)',
                    color: 'var(--de-heading)',
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => onOpenDreamSpace?.()}
                className="de-pressable"
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(180,185,200,0.30)',
                  background: 'rgba(255,255,255,0.65)',
                  color: 'var(--de-heading)',
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Your Dreams
              </button>
              <button
                type="button"
                onClick={() => enterCustomizeMode('home')}
                className="de-pressable"
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(58,111,216,0.35)',
                  background: 'rgba(58,111,216,0.09)',
                  color: '#3a6fd8',
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Palette size={12} />
                Customize
              </button>
            </div>
          </div>

          {/* ── DreamSpace Portal — permanent swap link ── */}
          {onOpenDreamSpace && (
            <button
              type="button"
              onClick={onOpenDreamSpace}
              className="de-pressable"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                marginBottom: 16,
                background: 'linear-gradient(135deg, rgba(200,152,26,0.13) 0%, rgba(74,158,214,0.09) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 18,
                border: '1.5px solid rgba(200,152,26,0.32)',
                boxShadow: '0 4px 16px rgba(200,152,26,0.13)',
                cursor: 'pointer',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #c8981a, #d4a843)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 3px 10px rgba(200,152,26,0.32)',
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
              <ChevronRight size={16} style={{ color: '#c8981a', flexShrink: 0 }} />
            </button>
          )}

          {/* ── WORKSPACE WINDOW PANEL — full width, elevated ── */}
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
            {/* Window chrome — canonical surface name per docs/LAW.md §Route law */}
            <WindowChrome title="HomeDream" />

            {/* ── Activity feed — full width, temporal scanning ── */}
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

              {/* AI Triad agent cards — horizontal scroll */}
              <div
                data-scroll
                style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', marginBottom: 4, WebkitOverflowScrolling: 'touch' }}
              >
                {AI_AGENTS.map(agent => (
                  <AgentActivityCard key={agent.id} agent={agent} onOpenDrEams={onOpenDrEams} />
                ))}
              </div>

              {/* Feed area remains independently scrollable */}
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
                    No activity yet.{' '}
                    <Link href="/discover" style={{ color: 'var(--de-accent)' }}>Discover creators</Link>
                    {' '}or{' '}
                    <Link href="/daydream/create" style={{ color: 'var(--de-accent)' }}>create your first post</Link>.
                  </div>
                )}
              </div>

              <Link href="/discover" style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '10px 0',
                fontSize: 12, color: 'var(--de-accent)', fontWeight: 600,
                textDecoration: 'none',
              }}>
                View all activity <ChevronRight size={13} />
              </Link>
            </div>

            {/* ── Metric widgets — 2×2 grid, full width ── */}
            <div style={{ padding: '0 16px', marginBottom: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>
                  Telemetry
                </span>
                <Link href="/analytics" style={{ fontSize: 12, color: 'var(--de-accent)',
                  fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  Full stats <ChevronRight size={12} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <MetricWidget
                  icon={Users} label="Followers" value={formatCount(stats.followers)}
                  sub={stats.followers !== null ? 'real-time' : 'loading…'}
                  color="#c8981a" trend={[]} />
                <MetricWidget
                  icon={TrendingUp} label="Following" value={formatCount(stats.following)}
                  sub={stats.following !== null ? 'real-time' : 'loading…'}
                  color="#4A9ED6" trend={[]} />
                <MetricWidget
                  icon={Star} label="Posts" value={String(realPostCount)}
                  sub="public feed"
                  color="#6366f1" trend={[]} />
                <MetricWidget
                  icon={BarChart3} label="Activity" value={posts.length > 0 ? 'Active' : '—'}
                  sub={posts.length > 0 ? `${posts.length} recent` : 'No posts yet'}
                  color="#22c55e" trend={[]} />
              </div>
            </div>

            {/* ── Metrics status band — full width ── */}
            <div style={{
              display: 'flex',
              borderTop: '1px solid rgba(180,185,200,0.12)',
              borderBottom: '1px solid rgba(180,185,200,0.12)',
              background: 'rgba(255,255,255,0.38)',
            }}>
              <MetricBandCell value={String(realPostCount)} label="Posts"     color="var(--de-gold)" />
              <MetricBandCell value={formatCount(stats.followers)} label="Followers" color="#4A9ED6" />
              <MetricBandCell value={formatCount(stats.following)} label="Following" color="#6366f1" />
              <MetricBandCell value="—"    label="Reach"    color="#22c55e" last />
            </div>

            {/* ── Action controls ── */}
            <div style={{ padding: '14px 16px 16px', background: 'rgba(255,255,255,0.28)' }}>
              {/* Primary row — Dr. Eams + Shop */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <ActionBtn icon={Sparkles}    label="Dr. Eams" onClick={onOpenDrEams} primary />
                <ActionBtn icon={ShoppingBag} label="Shop"     onClick={() => router.push('/shop')} />
              </div>
              {/* Daydreams row 1 — Music · Games · Lab */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <ActionBtn icon={Music}        label="Music"  onClick={() => router.push('/daydream/music')} />
                <ActionBtn icon={Gamepad2}     label="Games"  onClick={() => router.push('/daydream/games')} />
                <ActionBtn icon={FlaskConical} label="Lab"    onClick={() => router.push('/daydream/lab')} />
              </div>
              {/* Daydreams row 2 — Code · Brand · Create */}
              <div style={{ display: 'flex', gap: 10 }}>
                <ActionBtn icon={Code2}   label="Code"   onClick={() => router.push('/daydream/code')} />
                <ActionBtn icon={Palette} label="Brand"  onClick={() => router.push('/daydream/brand')} />
                <ActionBtn icon={Pen}     label="Create" onClick={() => router.push('/daydream/create')} />
              </div>
            </div>
          </div>

          {/* ── Widget glass zone — Feed section ── */}
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
                <Link
                  key={`widget-slot-${i}`}
                  href="/connectors"
                  className="de-card-pressable"
                  style={{
                    minHeight: 92,
                    borderRadius: 18,
                    border: '1px solid rgba(180,185,200,0.20)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.15))',
                    boxShadow: 'inset 0 1px 8px rgba(255,255,255,0.30), 0 2px 10px rgba(0,0,0,0.04)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
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
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

    </>
  );
}
