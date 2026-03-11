'use client';

/**
 * GamesHub — Side A content layer for the Games Daydream.
 *
 * This component is the canonical "Games Daydream" — the aggregated hub where
 * all live games are surfaced for the authenticated user.  It replaces the
 * previous inline content in app/daydream/games/page.tsx and is the formal
 * counterpart to GameEngin (Side B).
 *
 * Games registered:
 *   - Dr. Eams Platformer  (/game)
 *   - Word Sprint           (components/games/WordSprint)
 *   - Memory Grid           (components/games/MemoryGrid)
 *   - Speed Tap             (components/games/SpeedTap)
 *
 * Wiring:
 *   GamesHub (Side A) ←→ GameEngin (Side B) via DaydreamShell
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 Daydream pairs.
 * Every game component imported here is registered in GameEngin's Quick Launch.
 */

import Link from 'next/link';
import { ArrowLeft, Gamepad2, Play, Star, Trophy, Zap } from 'lucide-react';
import WordSprint from '@/components/games/WordSprint';
import MemoryGrid from '@/components/games/MemoryGrid';
import SpeedTap from '@/components/games/SpeedTap';
import Leaderboard from '@/components/games/Leaderboard';

const ACCENT = '#2a8ab8';

export default function GamesHub() {
  return (
    <div className="de-sky-bg min-h-screen">
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/homedream"
            className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(160,195,240,0.15)' }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10, color: 'var(--de-text-dim)', letterSpacing: '0.06em',
                textTransform: 'uppercase', fontWeight: 600, lineHeight: 1,
              }}
            >
              DREAMengin
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
              <Gamepad2 className="w-4 h-4" style={{ color: ACCENT }} />
              <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)' }}>
                Games
              </h1>
            </div>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{
              background: `${ACCENT}1a`, color: ACCENT,
              border: `1px solid ${ACCENT}33`,
            }}
          >
            GamesHub
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* ── Dr. Eams Platformer hero ── */}
        <div
          className="de-widget"
          style={{
            background: 'linear-gradient(135deg, rgba(42,138,184,0.12), rgba(200,152,26,0.10))',
            borderColor: `${ACCENT}4d`,
          }}
        >
          <div
            className="de-widget-header"
            style={{ borderBottomColor: `${ACCENT}33` }}
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
              <span className="de-widget-title">Dr. Eams Platformer</span>
            </div>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(200,152,26,0.15)', color: 'var(--de-gold)',
                border: '1px solid rgba(200,152,26,0.3)',
              }}
            >
              ✦ Live
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(42,138,184,0.2), rgba(200,152,26,0.18))',
                  border: `1.5px solid ${ACCENT}59`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                }}
              >
                ∞
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>
                  Run. Jump. Dream.
                </div>
                <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
                  3 levels, enemies, coins, and a star. Touch, keyboard, or PS5 — works right now.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {['3 Levels', 'Touch', 'PS5 Ready', 'Double Jump'].map(t => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                        background: `${ACCENT}1a`, color: ACCENT, border: `1px solid ${ACCENT}33`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/game" className="de-btn de-btn-primary" style={{ gap: 8 }}>
              <Play className="w-4 h-4 fill-current" /> Play Now
            </Link>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)', marginLeft: 'auto' }}>
              <Zap className="w-3 h-3 inline mr-1" style={{ color: 'var(--de-gold)' }} />
              3 levels · dual joystick
            </span>
          </div>
        </div>

        {/* ── Word Sprint ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span style={{ fontSize: 16, marginRight: 8 }}>📝</span>
            <span className="de-widget-title">Word Sprint</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${ACCENT}1a`, color: ACCENT, border: `1px solid ${ACCENT}33` }}
            >
              Live
            </span>
          </div>
          <div className="de-widget-body">
            <WordSprint />
          </div>
        </div>

        {/* ── Memory Grid ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span style={{ fontSize: 16, marginRight: 8 }}>🧩</span>
            <span className="de-widget-title">Memory Grid</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${ACCENT}1a`, color: ACCENT, border: `1px solid ${ACCENT}33` }}
            >
              Live
            </span>
          </div>
          <div className="de-widget-body">
            <MemoryGrid />
          </div>
        </div>

        {/* ── Speed Tap ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span style={{ fontSize: 16, marginRight: 8 }}>⚡</span>
            <span className="de-widget-title">Speed Tap</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${ACCENT}1a`, color: ACCENT, border: `1px solid ${ACCENT}33` }}
            >
              Live
            </span>
          </div>
          <div className="de-widget-body">
            <SpeedTap />
          </div>
        </div>

        {/* ── Leaderboards ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Trophy className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title ml-2">Leaderboards</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(200,152,26,0.12)', color: 'var(--de-gold)',
                border: '1px solid rgba(200,152,26,0.25)',
              }}
            >
              Top 10
            </span>
          </div>
          <div className="de-widget-body space-y-5">
            {[
              { key: 'platformer',  emoji: '∞',  label: 'Dr. Eams Platformer' },
              { key: 'word-sprint', emoji: '📝', label: 'Word Sprint' },
              { key: 'memory-grid', emoji: '🧩', label: 'Memory Grid' },
              { key: 'speed-tap',   emoji: '⚡', label: 'Speed Tap' },
            ].map((game, idx) => (
              <section key={game.key}>
                {idx > 0 && (
                  <div style={{ height: 1, background: 'rgba(160,195,240,0.18)', marginBottom: 20 }} />
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 14 }}>{game.emoji}</span>
                  <h3
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'var(--de-text-dim)' }}
                  >
                    {game.label}
                  </h3>
                </div>
                <Leaderboard game={game.key} />
              </section>
            ))}
          </div>
          <div className="de-widget-actions">
            <Link href="/game" className="de-btn de-btn-ghost text-xs">
              <Play className="w-3 h-3 fill-current" /> Play to rank up
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
