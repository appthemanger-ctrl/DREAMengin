'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home, User, MessageCircle, Compass, Settings,
  Bell, BarChart3, TrendingUp, Users, Zap,
  Music, ShoppingBag, Plus, Star, ChevronRight,
  Search, Sparkles,
} from 'lucide-react';

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
}

// ── Mini sparkline ─────────────────────────────────────────────────────────────

function MiniLine({ data, color = '#c8981a' }: { data: number[]; color?: string }) {
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
      borderBottom: '1px solid rgba(160,195,240,0.12)',
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
    <div style={{
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
      borderRight: last ? 'none' : '1px solid rgba(160,195,240,0.18)',
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
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      padding: '12px 4px',
      borderRadius: 16,
      background: primary
        ? 'linear-gradient(135deg, #c8981a, #e0b830)'
        : 'rgba(255,255,255,0.75)',
      border: primary ? 'none' : '1px solid rgba(160,195,240,0.25)',
      cursor: 'pointer',
      boxShadow: primary ? '0 6px 18px rgba(200,152,26,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'transform 0.12s',
    }}
      onPointerDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.94)'; }}
      onPointerUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {React.createElement(Icon as any, { size: 18, style: { color: primary ? '#fff' : 'var(--de-accent)' } })}
      <span style={{ fontSize: 10, fontWeight: 700,
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
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px 10px',
      borderBottom: '1px solid rgba(160,195,240,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)',
        letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {title}
      </span>
      <div style={{ width: 60 }} />
    </div>
  );
}

// ── Bottom tab bar ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'home',     icon: Home,          label: 'Home',     href: '/home' },
  { id: 'discover', icon: Compass,       label: 'Discover', href: '/discover' },
  { id: 'create',   icon: Plus,          label: 'Create',   href: '/create' },
  { id: 'messages', icon: MessageCircle, label: 'Messages', href: '/messages' },
  { id: 'profile',  icon: User,          label: 'Profile',  href: '/edit-profile' },
];

function BottomTabBar({ active = 'home' }: { active?: string }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
      background: 'rgba(220,232,248,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(160,195,240,0.35)',
      display: 'flex', alignItems: 'stretch',
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
    }}>
      {TABS.map(({ id, icon: Icon, label, href }) => {
        const isActive = id === active;
        const isCreate = id === 'create';
        return (
          <Link key={id} href={href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3, padding: '10px 4px 6px',
            textDecoration: 'none', position: 'relative',
          }}>
            {isCreate ? (
              <div style={{
                width: 42, height: 42, borderRadius: 14,
                background: 'linear-gradient(135deg, #c8981a, #e0b830)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(200,152,26,0.40)',
                marginTop: -8,
              }}>
                {React.createElement(Icon as React.ElementType<{ size: number; style: React.CSSProperties }>, { size: 20, style: { color: '#fff' } })}
              </div>
            ) : (
              React.createElement(Icon as React.ElementType<{ size: number; style: React.CSSProperties }>, {
                size: 20, style: { color: isActive ? '#c8981a' : 'var(--de-text-dim)' },
              })
            )}
            {!isCreate && (
              <span style={{
                fontSize: 9, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#c8981a' : 'var(--de-text-dim)',
                letterSpacing: '0.02em',
              }}>
                {label}
              </span>
            )}
            {isActive && !isCreate && (
              <div style={{
                position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                width: 18, height: 2.5, borderRadius: 99, background: '#c8981a',
              }} />
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ── Main WorkspaceDashboard ────────────────────────────────────────────────────

export default function WorkspaceDashboard({ profile, posts, onOpenDrEams }: WorkspaceDashboardProps) {
  const [searchVal, setSearchVal] = useState('');
  const name = profile?.display_name || profile?.handle || 'Dreamer';
  const initials = name[0]?.toUpperCase() || 'D';
  const avatarUrl = profile?.avatar_url;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const feedPosts = posts.length > 0 ? posts.slice(0, 5) : Array.from({ length: 5 }).map((_, i) => ({
    id: `mock-${i}`,
    content: ['Dropped a new beat 🎵', 'Launched a new project ✨', 'Hit a milestone 🏆', 'Going live tonight 🔴', 'New collab dropping soon 🤝'][i],
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    profiles: {
      handle: ['dreamer', 'creator', 'builder', 'artist', 'maker'][i],
      display_name: ['Dreamer', 'Creator', 'Builder', 'Artist', 'Maker'][i],
      avatar_url: null,
    },
  }));

  return (
    <>
      {/* ── Full-screen scrollable workspace ── */}
      <div style={{
        minHeight: '100svh',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: 100,
      }}>
        {/* ── Sticky top header — full width glass ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(220,232,248,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(160,195,240,0.25)',
          padding: '14px 16px 12px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* dreamengin wordmark */}
          <span style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: 22, fontWeight: 400, color: '#c8981a',
            letterSpacing: '-0.01em', flexShrink: 0,
          }}>
            dreamengin
          </span>

          {/* Search pill — expands to fill remaining space */}
          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.75)',
            borderRadius: 100, padding: '9px 14px',
            border: '1px solid rgba(160,195,240,0.30)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          }}>
            <Search size={13} style={{ color: 'var(--de-text-dim)', flexShrink: 0 }} />
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search everything…"
              style={{ background: 'none', border: 'none', outline: 'none',
                fontSize: 13, color: 'var(--de-heading)', width: '100%' }}
            />
          </div>

          {/* Notification bell */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Bell size={20} style={{ color: 'var(--de-text-dim)' }} />
            <div style={{
              position: 'absolute', top: -1, right: -1,
              width: 8, height: 8, borderRadius: '50%',
              background: '#c8981a', border: '1.5px solid rgba(220,232,248,0.9)',
            }} />
          </div>

          {/* Avatar */}
          <Link href="/edit-profile" style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            overflow: 'hidden',
            background: avatarUrl ? undefined : 'linear-gradient(135deg, #c8981a, #4A9ED6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            {avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </Link>
        </div>

        {/* ── Page body ── */}
        <div style={{ padding: '16px 14px 0' }}>

          {/* Greeting */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)', fontWeight: 600 }}>{greeting},</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>
              {name} 👋
            </div>
          </div>

          {/* ── WORKSPACE WINDOW PANEL — full width, elevated ── */}
          <div style={{
            background: 'rgba(255,255,255,0.68)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.07)',
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            {/* Window chrome */}
            <WindowChrome title="Workspace" />

            {/* ── Activity feed — full width, temporal scanning ── */}
            <div style={{ padding: '14px 16px 0' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 4,
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)' }}>
                  Recent Activity
                </span>
                <span style={{
                  background: 'rgba(200,152,26,0.14)', color: '#c8981a',
                  borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '3px 10px',
                }}>
                  {feedPosts.length} new
                </span>
              </div>

              {/* Full-width feed cards */}
              {feedPosts.slice(0, 4).map((post, i) => (
                <ActivityCard key={post.id || i} post={post} index={i} />
              ))}

              <Link href="/discover" style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '10px 0',
                fontSize: 12, color: 'var(--de-accent)', fontWeight: 700,
                textDecoration: 'none',
              }}>
                View all activity <ChevronRight size={13} />
              </Link>
            </div>

            {/* ── Metric widgets — 2×2 grid, full width ── */}
            <div style={{ padding: '0 14px', marginBottom: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)' }}>
                  Telemetry
                </span>
                <Link href="/analytics" style={{ fontSize: 11, color: 'var(--de-accent)',
                  fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  Full stats <ChevronRight size={12} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <MetricWidget
                  icon={Users} label="Followers" value="1.6K" sub="+12 this week"
                  color="#c8981a" trend={[100, 110, 105, 120, 130, 128, 140]} />
                <MetricWidget
                  icon={TrendingUp} label="Reach" value="8.4K" sub="+5% today"
                  color="#4A9ED6" trend={[60, 70, 65, 80, 90, 88, 100]} />
                <MetricWidget
                  icon={Star} label="Engagement" value="4.2%" sub="Above avg"
                  color="#6366f1" trend={[3, 4, 3.5, 4.5, 4, 4.2, 4.8]} />
                <MetricWidget
                  icon={BarChart3} label="Posts" value="47" sub="12 this week"
                  color="#22c55e" trend={[30, 32, 35, 38, 40, 44, 47]} />
              </div>
            </div>

            {/* ── Metrics status band — full width ── */}
            <div style={{
              display: 'flex',
              borderTop: '1px solid rgba(160,195,240,0.15)',
              borderBottom: '1px solid rgba(160,195,240,0.15)',
              background: 'rgba(255,255,255,0.45)',
            }}>
              <MetricBandCell value="47"   label="Posts"     color="var(--de-gold)" />
              <MetricBandCell value="1.6K" label="Followers" color="#4A9ED6" />
              <MetricBandCell value="524"  label="Following" color="#6366f1" />
              <MetricBandCell value="98%"  label="Health"    color="#22c55e" last />
            </div>

            {/* ── Action controls — full width row, observe→understand→act ── */}
            <div style={{
              display: 'flex', gap: 10, padding: '14px 14px 16px',
              background: 'rgba(255,255,255,0.35)',
            }}>
              <ActionBtn icon={Sparkles}    label="Dr. Eams"  onClick={onOpenDrEams} primary />
              <ActionBtn icon={Music}       label="Music"     onClick={() => { window.location.href = '/daydream/music'; }} />
              <ActionBtn icon={ShoppingBag} label="Shop"      onClick={() => { window.location.href = '/shop'; }} />
              <ActionBtn icon={Zap}         label="Create"    onClick={() => { window.location.href = '/create'; }} />
            </div>
          </div>

          {/* ── Second panel: Quick-nav modules — 2×2 full width ── */}
          <div style={{
            background: 'rgba(255,255,255,0.60)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.09)',
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <div style={{ padding: '14px 16px 6px' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)' }}>
                Modules
              </span>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12, padding: '6px 14px 16px',
            }}>
              {[
                { icon: Compass,     label: 'Discover',   sub: 'Explore the feed',   href: '/discover',       color: '#4A9ED6' },
                { icon: BarChart3,   label: 'Analytics',  sub: 'View your stats',    href: '/analytics',      color: '#c8981a' },
                { icon: Music,       label: 'Music',      sub: 'Your releases',      href: '/daydream/music', color: '#6366f1' },
                { icon: ShoppingBag, label: 'Shop',       sub: 'Manage listings',    href: '/shop',           color: '#22c55e' },
                { icon: MessageCircle, label: 'Messages', sub: 'Your conversations', href: '/messages',       color: '#ec4899' },
                { icon: Settings,    label: 'Settings',   sub: 'Preferences',        href: '/settings',       color: '#94a3b8' },
              ].map(({ icon: Icon, label, sub, href, color }) => (
                <Link key={label} href={href} style={{
                  background: 'rgba(255,255,255,0.80)',
                  borderRadius: 18, padding: '14px',
                  border: '1px solid rgba(160,195,240,0.18)',
                  boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
                  textDecoration: 'none',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  transition: 'transform 0.12s',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {React.createElement(Icon as React.ElementType<{ size: number; style: React.CSSProperties }>, { size: 17, style: { color } })}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 1 }}>{sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Fixed bottom tab bar — iOS-style ── */}
      <BottomTabBar active="home" />
    </>
  );
}

