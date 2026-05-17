'use client';

/**
 * AnalyticsDaydreamDashboard — Side A interactive dashboard for the Analytics Daydream.
 *
 * Features:
 *  1. Activity Profile   — AQS, tier badge, points, views, real shit rate
 *  2. Activity Tier Map  — visual tier ladder with user's current position
 *  3. Metrics Explainer  — what AQS means and how to improve it
 *  4. Quick Actions      — links to post, profile, settings
 *
 * Data: live from /api/metrics/user/[userId] (ActivityProfile component).
 * Architecture justification: docs/ARCHITECTURE.md §1 Daydream pairs,
 * docs/AXIOMS.md Axiom 3 — every visible element does real work.
 */

import Link from 'next/link';
import { BarChart2, TrendingUp, Eye, Zap, Star, ChevronRight } from 'lucide-react';
import { ActivityProfile } from '@/components/activity/dream.ActivityProfile';
import OpenDaydreamSideBButton from '@/components/daydream/dream.OpenDaydreamSideBButton';

const ACCENT = '#6366f1';

// Activity tier definitions — matches ACTIVITY_FIRST_PROTOCOL.md §II
const TIERS = [
  { tier: 6, name: 'Never Done Before',    emoji: '🏆', color: '#f59e0b', desc: 'A trick never landed, original invention' },
  { tier: 5, name: 'On-Platform Innovation', emoji: '💡', color: '#ec4899', desc: 'Discovering new physics, novel methods' },
  { tier: 4, name: 'Real-World Action',    emoji: '🌍', color: '#f97316', desc: 'Performing live, skating a spot' },
  { tier: 3, name: 'On-Platform Creation', emoji: '🛠️', color: '#8b5cf6', desc: 'Building a game, composing music here' },
  { tier: 2, name: 'Skill Development',   emoji: '📈', color: '#22c55e', desc: 'Documenting practice over time' },
  { tier: 1, name: 'Reflection',          emoji: '📖', color: '#38bdf8', desc: 'Sharing about your day thoughtfully' },
  { tier: 0, name: 'Passive',             emoji: '👀', color: '#64748b', desc: 'Posting a photo with no context' },
];

interface Props {
  userId: string;
}

export default function AnalyticsDaydream({ userId }: Props) {
  return (
    <div className="de-auth-content space-y-4">
      {/* ── Intro ────────────────────────────────────────────────────────── */}
      <div
        className="de-auth-hero"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(56,189,248,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '3px 10px', borderRadius: 9999, background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(56,189,248,0.12) 100%)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>Analytics 2026 · Activity-First Protocol · AQS · Real Shit Rate</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 6 }}>
            Your Activity Dashboard
          </h2>
          <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
            DREAMengin runs on the <strong>Activity-First Protocol</strong> — you get seen based on what you
            actually do, not how many likes you collect. Your AQS (Activity Quality Score) is calculated
            from your activity tier, verified content, and how many people watch it. Flip to <strong>Side B</strong> for deeper insights.
          </p>
          <div style={{ marginTop: 12 }}>
            <OpenDaydreamSideBButton label="Open AnalyticsEngin →" />
          </div>
        </div>
      </div>

      {/* ── Live Activity Metrics ─────────────────────────────────────────── */}
      <div className="de-widget" style={{ borderColor: 'rgba(99,102,241,0.25)' }}>
        <div className="de-widget-header">
          <BarChart2 className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="de-widget-title ml-2">Your Metrics</span>
          <Link href="/api/metrics/user" className="text-xs font-semibold ml-auto" style={{ color: ACCENT, textDecoration: 'none' }}>
            Raw API →
          </Link>
        </div>
        <div className="de-widget-body">
          <ActivityProfile userId={userId} showFullStats />
        </div>
      </div>

      {/* ── Activity Tier Ladder ──────────────────────────────────────────── */}
      <div className="de-widget" style={{ borderColor: 'rgba(99,102,241,0.18)' }}>
        <div className="de-widget-header">
          <Star className="w-4 h-4" style={{ color: '#f59e0b' }} />
          <span className="de-widget-title ml-2">Activity Tier Ladder</span>
        </div>
        <div className="de-widget-body">
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
            Higher tiers multiply your visibility score. Verified evidence (video &gt; audio &gt; photo &gt; text) boosts strength.
          </p>
          <div className="space-y-2">
            {TIERS.map((t: Record<string, unknown>) => (
              <div
                key={t.tier}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: `rgba(${hexToRgb(t.color)}, 0.07)`,
                  border: `1px solid rgba(${hexToRgb(t.color)}, 0.18)`,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{t.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>
                    Tier {t.tier}: {t.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{t.desc}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.color, flexShrink: 0 }}>
                  ×{[1, 2, 4, 8, 8, 16, 16][t.tier]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AQS Formula Explainer ─────────────────────────────────────────── */}
      <div className="de-widget" style={{ borderColor: 'rgba(99,102,241,0.18)' }}>
        <div className="de-widget-header">
          <TrendingUp className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="de-widget-title ml-2">How AQS Works</span>
        </div>
        <div className="de-widget-body">
          <div style={{ fontFamily: 'monospace', fontSize: 13, background: 'rgba(99,102,241,0.06)', borderRadius: 10, padding: '12px 16px', marginBottom: 12, color: 'var(--de-heading)', textAlign: 'center', fontWeight: 700, letterSpacing: '0.02em' }}>
            AQS = (Activity Points × Views per Post) ÷ Days Active
          </div>
          <div className="space-y-2">
            {[
              { icon: '⭐', label: 'Activity Points', desc: 'Earned by creating at higher tiers with verified evidence. Decay over 30 days.' },
              { icon: '👁️', label: 'Views per Post',  desc: 'Verified human views only — bots and duplicates excluded by TheBoogieMan.Ai.' },
              { icon: '📅', label: 'Days Active',      desc: 'Days in the last 30 where you posted or verified activity.' },
            ].map((row: Record<string, unknown>) => (
              <div key={row.label} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{row.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Verified Views Explainer ──────────────────────────────────────── */}
      <div className="de-widget" style={{ borderColor: 'rgba(56,189,248,0.18)' }}>
        <div className="de-widget-header">
          <Eye className="w-4 h-4" style={{ color: '#38bdf8' }} />
          <span className="de-widget-title ml-2">Verified Views</span>
        </div>
        <div className="de-widget-body">
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 8 }}>
            Only verified human views count toward your metrics. A view is verified when:
          </p>
          <ul style={{ fontSize: 11, color: 'var(--de-text-dim)', paddingLeft: 16, lineHeight: 2 }}>
            <li>The viewer spent meaningful time on the content</li>
            <li>The viewer is not flagged as a bot by TheBoogieMan.Ai</li>
            <li>The view is not a duplicate from the same session</li>
            <li>CPV tier is set based on the viewer&apos;s own AQS (Standard / Premium / Super)</li>
          </ul>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="de-widget" style={{ borderColor: 'rgba(99,102,241,0.18)' }}>
        <div className="de-widget-header">
          <Zap className="w-4 h-4" style={{ color: '#f59e0b' }} />
          <span className="de-widget-title ml-2">Boost Your Score</span>
        </div>
        <div className="de-widget-body">
          <div className="grid grid-cols-1 gap-2">
            {[
              { href: '/daydream/create',    emoji: '✍️', label: 'Post Content',         desc: 'Create verified content to earn activity points' },
              { href: '/daydream/games',     emoji: '🎮', label: 'Play & Build Games',   desc: 'On-platform creation earns Tier 3 points automatically' },
              { href: '/daydream/music',     emoji: '🎵', label: 'Compose Music',        desc: 'Music creation on StarMakerEngin earns Tier 3 points' },
              { href: '/connectors',         emoji: '🔌', label: 'Connect Services',     desc: 'Surface your real-world activity in the feed' },
              { href: '/edit-profiledream',  emoji: '👤', label: 'Update Your Profile',  desc: 'Publish more of your Dream Windows publicly' },
            ].map((action: Record<string, unknown>) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(99,102,241,0.12)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{action.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{action.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{action.desc}</div>
                </div>
                <ChevronRight className="w-3 h-3" style={{ color: 'var(--de-text-dim)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── AnalyticsEngin info strip ─────────────────────────────────────── */}
      <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>AnalyticsEngin — Side B</div>
        <p style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5, margin: 0 }}>
          Full platform health metrics · Cross-engin activity sync · AQS trends · Revenue split breakdown ·
          Skip credit balance · Verified view report · Bot detection summary.
        </p>
      </div>
    </div>
  );
}

/** Converts a CSS hex color like #6366f1 to "99,102,241" for use in rgba(). */
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
