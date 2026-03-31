'use client';

/**
 * BabylonSideScroller — MADMAXI · Babylon.js 3-D side-scrolling platformer.
 *
 * MADMAXI is the DREAMengin robot hero (inspired by the landing-page Dr. Eams
 * character: gold metallic body, cyan visor, animated arms & legs).
 *
 * Mechanics:
 *  • Collect 9 SILVER coins + 1 GOLD coin (the Dream Star) to clear each level.
 *  • When the 9th silver coin is collected the camera zooms toward the Gold Star.
 *  • Stomp enemies (or boss) to earn combo multipliers.
 *  • Double-jump, coyote-time, dash with i-frames.
 *
 * Level structure:
 *  • The first two levels of every 10-level zone band are authored set-pieces.
 *  • The remaining non-boss levels in that band resume procedural generation.
 *  • Every 10th level is a boss arena (15 unique bosses, 15 themed zones).
 *  • Session-seeded RNG — unique each run, same layout on level retry.
 *
 * Tech:
 *  • Babylon.js @babylonjs/core v8 — glow, PBR, shadows, bloom post-process.
 *  • Shared GameRemote CustomEvent bridge (de-game-input).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';
import { useImmersiveGameLayout } from '@/lib/games/useImmersiveGameLayout';
import { createBabylonEngine } from '@/lib/babylon/createEngine';
import {
  DreamEngineGodTierSystem,
  applyGodTierToBabylon,
  defaultDeviceSignals,
  defaultUXSignals,
  defaultRouteSignals,
  type BabylonSceneLike,
} from '@/lib/god-tier/godTierEngine';
import {
  BOSS_ENRAGE_MULTIPLIER,
  BOSS_ENRAGE_THRESHOLD,
  MADMAXI_SUPER_SECONDS,
  MADMAXI_SUPER_STREAK,
  STAR_SEED_OFFSET,
  STAR_SEED_PRIME,
  TOTAL_LEVELS,
  ZONES,
  getBossForLevel,
  getZoneIdx,
  isBossLevel,
  seededRng,
} from './config';
import { getMadmaxiLevelDefinition } from './levels';
import { MadmaxiAudioController } from './audio';
import type { CoinDef, EnemyDef, HazardDef, MadmaxiEnemyKind, MadmaxiPowerUpKind, PlatDef, PowerUpDef } from './types';

// ─── Game constants ──────────────────────────────────────────────────────────
const GW = 800; // logical canvas width
const GH = 480; // logical canvas height
const GRAV       = 0.048;   // units / frame²
const MAX_FALL   = 0.95;    // terminal velocity (positive = down in BJS Y-up is handled)
const JUMP_VY    = 0.68;    // initial jump Y velocity
const WALK_SPD   = 0.115;   // horizontal speed
const COYOTE_MS  = 8;       // extra frames to jump after leaving ledge
const JBUF_MS    = 6;       // frames to buffer a jump before landing
const DASH_SPD   = 0.42;    // player dash speed (≈ 3.7× walk)
const DASH_DUR   = 10;      // dash duration in frames
const DASH_COOL  = 45;      // frames between dashes
const PROJ_SPD   = 4.5;     // boss projectile speed (px/frame)
const PROJ_LIFE  = 120;     // frames before projectile despawns
const COMBO_WIN  = 1500;    // ms window to chain a combo kill
const SHIELD_DURATION_FRAMES    = 8 * 60;
const HIGH_JUMP_DURATION_FRAMES = 8 * 60;
const LASER_DURATION_FRAMES     = 8 * 60;
const GIANT_DURATION_FRAMES     = 4 * 60;

// Babylon render-unit scale:  1 BU ≈ 40 logical px
const PX_PER_BU  = 40;

const SESSION_SEED: number =
  typeof window !== 'undefined' ? (Math.floor(Math.random() * 2147483647) || 1) : 1;

// ─── Component ───────────────────────────────────────────────────────────────
export default function BabylonSideScroller() {
  const immersive = useImmersiveGameLayout();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gameRef    = useRef<GameCore | null>(null);
  const [status, setStatus]   = useState<'title'|'playing'|'dead'|'complete'|'win'>('title');
  const [level,  setLevel]    = useState(1);
  const [score,  setScore]    = useState(0);
  const [lives,  setLives]    = useState(3);
  const vpadRef  = useRef({ left: false, right: false, jump: false, dash: false, shoot: false });
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem('madmaxi_best') ?? '0', 10); }
    catch { return 0; }
  });
  // Ref mirrors bestScore so callbacks can read the latest value without stale closures
  const bestScoreRef = useRef((() => {
    try { return parseInt(localStorage.getItem('madmaxi_best') ?? '0', 10); }
    catch { return 0; }
  })());
  const [progress, setProgress] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // Coin counter — 9 silver + 1 gold per level
  const [coinCount,    setCoinCount]    = useState(0);
  const [coinTotal,    setCoinTotal]    = useState(9); // total regular coins in current level

  // Session seed — module-level so it's set once per page load (not per render).
  // Every playthrough gets a unique seed; retrying a level uses the same one.
  const sessionSeedRef = useRef(SESSION_SEED);

  // Boss state
  const [bossHp,    setBossHp]    = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);
  const [bossName,  setBossName]  = useState('');

  // Combat feedback
  const [comboCount, setComboCount] = useState(0);
  const [dashReady,  setDashReady]  = useState(true);
  const [noDeathStreak, setNoDeathStreak] = useState(0);
  const [superSeconds, setSuperSeconds] = useState(0);
  const [runtimeBoosts, setRuntimeBoosts] = useState({
    shield: 0,
    'high-jump': 0,
    laser: 0,
    giant: 0,
  });

  // Zone / story
  const [zoneName,   setZoneName]   = useState('');
  const [zoneStory,  setZoneStory]  = useState('');
  const [encounterName, setEncounterName] = useState('');
  const [audioTheme, setAudioTheme] = useState('');
  const [vfxTheme, setVfxTheme] = useState('');
  const [isAuthoredStage, setIsAuthoredStage] = useState(false);
  const [wasABoss,   setWasABoss]   = useState(false); // was the level we just finished a boss?

  // Submit final score when game truly ends (win = all 150 levels, or dead with 0 lives)
  const submitScore = useSubmitScore('platformer');
  useEffect(() => {
    if (status === 'win') submitScore(score, level - 1);
    if (status === 'dead' && lives === 0) submitScore(score, level);
  }, [status, lives, score, level, submitScore]);

  // ── Start / restart ────────────────────────────────────────────────────────
  const startGame = useCallback((lv: number, sc: number, li: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gameRef.current?.destroy();

    // Derive zone/boss/authored metadata for this level
    const zIdx = getZoneIdx(lv);
    const levelDef = getMadmaxiLevelDefinition(lv, sessionSeedRef.current);
    const isBoss = isBossLevel(lv);
    const bossEntry = isBoss ? getBossForLevel(lv) : null;
    setZoneName(levelDef.zoneName ?? ZONES[zIdx].name);
    setEncounterName(levelDef.encounterName ?? (bossEntry ? bossEntry.name : ''));
    setAudioTheme(levelDef.audioTheme ?? ZONES[zIdx].audioTheme);
    setVfxTheme(levelDef.vfxTheme ?? ZONES[zIdx].vfxTheme);
    setIsAuthoredStage(Boolean(levelDef.isAuthored));
    setBossHp(bossEntry ? bossEntry.hp : 0);
    setBossMaxHp(bossEntry ? bossEntry.hp : 0);
    setBossName(bossEntry ? bossEntry.name : '');
    setWasABoss(false);
    setCoinCount(0);
    setCoinTotal(levelDef.coins.filter((coin) => !coin.isGoal).length);

    const core = new GameCore(canvas, lv, sc, li, {
      onScore:    (s)  => {
        setScore(s);
        if (s > bestScoreRef.current) {
          bestScoreRef.current = s;
          setBestScore(s);
          setIsNewBest(true);
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('madmaxi_best', String(s)); } catch { /* quota/private */ }
          }
        }
      },
      onDie:      (li) => {
        setLives(li);
        setStatus('dead');
        setNoDeathStreak(0);
        setSuperSeconds(0);
        setRuntimeBoosts({ shield: 0, 'high-jump': 0, laser: 0, giant: 0 });
      },
      onComplete: (lv) => {
        const nextLevelDef = getMadmaxiLevelDefinition(lv, sessionSeedRef.current);
        const nextIsBoss = isBossLevel(lv);
        let story = nextLevelDef.zoneStory ?? '';
        if (nextLevelDef.encounterName && !nextIsBoss) {
          story += (story ? '\n\n' : '') + `⚡ NEXT ENCOUNTER: ${nextLevelDef.encounterName}`;
        }
        if (!story && (nextLevelDef.audioTheme || nextLevelDef.vfxTheme)) {
          story = `🎵 ${nextLevelDef.audioTheme ?? ''} · ✨ ${nextLevelDef.vfxTheme ?? ''}`.trim();
        }
        setZoneStory(story);
        setWasABoss(isBossLevel(lv - 1));
        setLevel(lv);
        setNoDeathStreak((prev) => {
          const next = prev + 1;
          if (next >= MADMAXI_SUPER_STREAK) setSuperSeconds(MADMAXI_SUPER_SECONDS);
          return next;
        });
        setStatus(lv > TOTAL_LEVELS ? 'win' : 'complete');
      },
      onProgress:   (pct) => setProgress(pct),
      onBossHp:     (hp) => setBossHp(hp),
      onCombo:      (c)  => setComboCount(c),
      onDash:       ()   => { setDashReady(false); setTimeout(() => setDashReady(true), DASH_COOL * 16); },
      onCoinCount:  (collected, total) => { setCoinCount(collected); setCoinTotal(total); },
      onRuntime:    (runtime) => {
        setSuperSeconds(runtime.superSeconds);
        setRuntimeBoosts(runtime.boosts);
      },
    }, {
      sessionSeed: sessionSeedRef.current,
      superSeconds,
    });
    gameRef.current = core;
    setProgress(0);
    setIsNewBest(false);
    setStatus('playing');
  }, [superSeconds]);
  useGameAutoStart(status === 'title' ? () => startGame(1, 0, 3) : null);

  // ── Key events ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const keysDown = new Set<string>();
    const down = (e: KeyboardEvent) => {
      keysDown.add(e.code);
      gameRef.current?.setKeys(keysDown);
      if ((e.code === 'Space' || e.code === 'Enter') && status === 'title') {
        startGame(1, 0, 3);
      }
      // Arrow keys / space — prevent page scroll only when game is running
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'KeyJ' || e.code === 'KeyX') {
        const vp = { ...vpadRef.current, shoot: true };
        vpadRef.current = vp;
        gameRef.current?.setVpad(vp);
      }
      // Shift = dash
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        const vp = { ...vpadRef.current, dash: true };
        vpadRef.current = vp;
        gameRef.current?.setVpad(vp);
      }
    };
    const up = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      gameRef.current?.setKeys(keysDown);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        const vp = { ...vpadRef.current, dash: false };
        vpadRef.current = vp;
        gameRef.current?.setVpad(vp);
      }
      if (e.code === 'KeyJ' || e.code === 'KeyX') {
        const vp = { ...vpadRef.current, shoot: false };
        vpadRef.current = vp;
        gameRef.current?.setVpad(vp);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, [status, startGame]);

  // ── GameRemote bridge ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { action, active } = (e as CustomEvent<{ action: string; active: boolean }>).detail;
      const vp = { ...vpadRef.current };
      if (action === 'move-left' || action === 'move-up-left' || action === 'move-down-left')
        vp.left  = active;
      if (action === 'move-right' || action === 'move-up-right' || action === 'move-down-right')
        vp.right = active;
      if (action === 'move-stop') { vp.left = false; vp.right = false; }
      if (action === 'jump' || action === 'jump-spin' || action === 'jump-shoot' || action === 'r3')
        vp.jump = active;
      if (action === 'dash' || action === 'r1')
        vp.dash = active;
      if (action === 'attack' || action === 'shoot' || action === 'jump-shoot')
        vp.shoot = active;
      vpadRef.current = vp;
      gameRef.current?.setVpad(vp);
    };
    window.addEventListener('de-game-input', handler);
    return () => window.removeEventListener('de-game-input', handler);
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => { gameRef.current?.destroy(); }, []);

  // ── Button shared style ────────────────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 800, fontSize: 14, userSelect: 'none',
    transition: 'opacity 0.1s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: immersive ? 0 : 8, alignItems: 'center', width: '100%', height: immersive ? '100%' : undefined }}>
      {/* ── Canvas ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: immersive ? 'none' : GW, height: immersive ? '100%' : undefined }}>
        <canvas
          ref={canvasRef}
          width={GW}
          height={GH}
          style={{ width: '100%', height: immersive ? '100%' : undefined, borderRadius: immersive ? 0 : 12, display: 'block',
                   background: '#0a0a1a', cursor: 'default' }}
          onClick={() => { if (status === 'title') startGame(1, 0, 3); }}
        />

        {/* ── Overlay: title ── */}
        {status === 'title' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,rgba(4,8,28,0.90),rgba(8,4,22,0.95))',
            borderRadius: 12,
          }}>
            {/* Robot silhouette decoration */}
            <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 4, filter: 'drop-shadow(0 0 18px #0af) drop-shadow(0 0 6px #c8981a)' }}>🤖</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0af', letterSpacing: '0.22em',
                          textTransform: 'uppercase', marginBottom: 6 }}>
              DREAMengin · Babylon.js · 3-D Platformer
            </div>
            <div style={{ fontSize: 50, fontWeight: 900, color: '#fff',
                          textShadow: '0 0 36px #c8981a,0 0 14px #c8981a,0 0 4px #f80',
                          lineHeight: 1.0, marginBottom: 4, letterSpacing: '-0.02em' }}>
              MADMAXI
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0af', letterSpacing: '0.12em',
                          textTransform: 'uppercase', marginBottom: 16 }}>
              ⚙ DREAMengin&apos;s Robot Hero
            </div>
            <div style={{ fontSize: 12, color: 'rgba(200,220,255,0.65)', marginBottom: 6, textAlign: 'center', lineHeight: 1.6 }}>
              Collect <span style={{ color: '#aaa', fontWeight: 700 }}>9 silver coins</span>{' '}
              + <span style={{ color: '#fa0', fontWeight: 700 }}>1 gold Dream Star</span> to clear each level
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginBottom: 22, textAlign: 'center' }}>
              150 levels · 15 zones · 2 authored openers per zone · boss every 10
            </div>
            <button
              style={{ ...btnBase, background: 'linear-gradient(135deg,#c8981a,#f7c44a)',
                       color: '#000', padding: '12px 40px', fontSize: 16, fontWeight: 900,
                       boxShadow: '0 0 24px #c8981a88, 0 0 8px #fa08' }}
              onClick={() => startGame(1, 0, 3)}
            >
              ▶ Run MAXI
            </button>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 14 }}>
              ← → / A D move &nbsp;·&nbsp; ↑ / W / Space jump (double-jump) &nbsp;·&nbsp; Shift = dash
            </div>
          </div>
        )}

        {/* ── Overlay: dead ── */}
        {status === 'dead' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(20,5,5,0.88)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#f55',
                          textShadow: '0 0 16px #f55', marginBottom: 8 }}>Dream Lost</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              Level {level} · Score {score}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
              {lives} {lives === 1 ? 'life' : 'lives'} remaining
            </div>
            {lives > 0 ? (
              <button
                style={{ ...btnBase, background: 'linear-gradient(135deg,#b82a2a,#f74a4a)',
                         color: '#fff', padding: '10px 30px' }}
                onClick={() => startGame(level, score, lives)}
              >Retry Level {level}</button>
            ) : (
              <button
                style={{ ...btnBase, background: 'linear-gradient(135deg,#2a8ab8,#4a6cf7)',
                         color: '#fff', padding: '10px 30px' }}
                onClick={() => startGame(1, 0, 3)}
              >New Game</button>
            )}
          </div>
        )}

        {/* ── Overlay: level complete ── */}
        {status === 'complete' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '0 24px',
            background: wasABoss ? 'rgba(20,10,5,0.92)' : 'rgba(5,20,10,0.92)', borderRadius: 12,
          }}>
            {wasABoss ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fa0', letterSpacing: '0.15em',
                              textTransform: 'uppercase', marginBottom: 6 }}>Boss Defeated!</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fa0',
                              textShadow: '0 0 16px #fa0', marginBottom: 6 }}>⚔ {bossName}</div>
              </>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 900, color: '#4f8',
                            textShadow: '0 0 16px #4f8', marginBottom: 6 }}>Dream Complete!</div>
            )}
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>
              Level {level - 1} · Score {score}
            </div>
            {zoneStory ? (
              <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.7)', textAlign: 'center',
                            lineHeight: 1.6, marginBottom: 18, maxWidth: 380,
                            whiteSpace: 'pre-line', borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingTop: 10 }}>
                {zoneStory}
              </div>
            ) : <div style={{ marginBottom: 18 }} />}
            <button
              style={{ ...btnBase, background: isBossLevel(level)
                ? 'linear-gradient(135deg,#8a2a2a,#f74a1a)'
                : 'linear-gradient(135deg,#1a8a3a,#4af74a)',
                color: '#fff', padding: '10px 30px' }}
              onClick={() => startGame(level, score, lives)}
            >{isBossLevel(level) ? `⚔ Fight ${getBossForLevel(level).name}` : `Level ${level} →`}</button>
          </div>
        )}

        {/* ── Overlay: victory ── */}
        {status === 'win' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,rgba(5,10,30,0.92),rgba(10,5,30,0.92))',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fa0',
                          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              All 150 Dreams Conquered
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fff',
                          textShadow: '0 0 28px #fa0,0 0 8px #fa0', lineHeight: 1.1, marginBottom: 8 }}>
              YOU WIN!
            </div>
            <div style={{ fontSize: 22, color: '#fa0', fontWeight: 800, marginBottom: 4 }}>
              Final Score: {score}
            </div>
            {isNewBest && (
              <div style={{ fontSize: 13, color: '#4af', fontWeight: 700, marginBottom: 4 }}>
                ✦ New Best Score!
              </div>
            )}
            {bestScore > 0 && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
                Best: {bestScore}
              </div>
            )}
            <button
              style={{ ...btnBase, background: 'linear-gradient(135deg,#c8981a,#f7c44a)',
                       color: '#000', padding: '12px 36px', fontSize: 16, marginTop: 4 }}
              onClick={() => startGame(1, 0, 3)}
            >Play Again</button>
          </div>
        )}

        {/* ── HUD ── */}
        {status === 'playing' && (
          <>
            <div style={{ position: 'absolute', top: 10, left: 12, right: 12,
                          display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                            textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                            borderRadius: 6, padding: '3px 10px' }}>
                ⭐ {score}
              </div>
              {bestScore > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fa0',
                              textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                              borderRadius: 6, padding: '3px 8px' }}>
                  🏆 {bestScore}
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4af',
                            textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                            borderRadius: 6, padding: '3px 8px', maxWidth: 110,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {zoneName || ZONES[getZoneIdx(level)].name}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                            textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                            borderRadius: 6, padding: '3px 10px' }}>
                LVL {level}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                            textShadow: '0 1px 6px #000', background: 'rgba(0,0,0,0.35)',
                            borderRadius: 6, padding: '3px 10px' }}>
                {'❤️'.repeat(Math.max(0, lives))}
              </div>
            </div>
            <div style={{ position: 'absolute', top: bossMaxHp > 0 ? 80 : 42, left: 12, display: 'flex', gap: 6, pointerEvents: 'none', flexWrap: 'wrap', maxWidth: 360 }}>
              {encounterName && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#dbeafe', background: 'rgba(15,23,42,0.58)', border: '1px solid rgba(125,211,252,0.3)', borderRadius: 999, padding: '2px 8px' }}>
                  {isAuthoredStage ? '✍' : '∞'} {encounterName}
                </div>
              )}
              {audioTheme && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#fde68a', background: 'rgba(32,18,4,0.62)', border: '1px solid rgba(250,204,21,0.34)', borderRadius: 999, padding: '2px 8px' }}>
                  🎵 {audioTheme}
                </div>
              )}
              {vfxTheme && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#bfdbfe', background: 'rgba(8,20,40,0.62)', border: '1px solid rgba(96,165,250,0.34)', borderRadius: 999, padding: '2px 8px' }}>
                  ✨ {vfxTheme}
                </div>
              )}
            </div>

            {/* ── Coin counter HUD (9 silver + 1 gold Dream Star) ── */}
            {bossMaxHp === 0 && (
              <div style={{
                position: 'absolute', top: encounterName || audioTheme || vfxTheme ? (bossMaxHp > 0 ? 116 : 78) : 42, left: 12, pointerEvents: 'none',
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(0,0,0,0.42)', borderRadius: 6, padding: '3px 9px',
              }}>
                {Array.from({ length: coinTotal }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12,
                      filter: i < coinCount
                        ? (i === coinTotal - 1 ? 'drop-shadow(0 0 4px #fa0)' : 'drop-shadow(0 0 3px #aaa)')
                        : 'grayscale(1) opacity(0.35)',
                      transition: 'filter 0.15s',
                    }}
                  >
                    {/* last coin is gold Dream Star */}
                    {i === coinTotal - 1 ? '⭐' : '🪙'}
                  </span>
                ))}
                <span style={{ fontSize: 10, fontWeight: 700, color: coinCount >= coinTotal ? '#fa0' : '#ccc', marginLeft: 4 }}>
                  {coinCount}/{coinTotal}
                </span>
              </div>
            )}

            {/* Boss health bar */}
            {bossMaxHp > 0 && (
              <div style={{ position: 'absolute', top: 42, left: 12, right: 12, pointerEvents: 'none' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#fa0', textAlign: 'center',
                              marginBottom: 3, textShadow: '0 1px 4px #000' }}>
                  ⚔ {bossName} — {bossHp} / {bossMaxHp}
                </div>
                <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 4, height: 7 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%`,
                    background: bossHp / bossMaxHp > 0.5
                      ? 'linear-gradient(90deg,#f80,#fa0)'
                      : 'linear-gradient(90deg,#f22,#f55)',
                    transition: 'width 0.2s',
                  }} />
                </div>
              </div>
            )}

            {/* Combo + Dash indicators */}
            <div style={{
              position: 'absolute', top: encounterName || audioTheme || vfxTheme ? (bossMaxHp > 0 ? 154 : 116) : (bossMaxHp > 0 ? 80 : 42),
              right: 12, pointerEvents: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
            }}>
              <div style={{
                background: noDeathStreak >= MADMAXI_SUPER_STREAK
                  ? 'rgba(255,215,0,0.18)'
                  : 'rgba(0,0,0,0.28)',
                border: `1px solid ${noDeathStreak >= MADMAXI_SUPER_STREAK ? '#ffd700' : 'rgba(255,255,255,0.16)'}`,
                borderRadius: 4, padding: '2px 8px',
                fontSize: 10, fontWeight: 700,
                color: noDeathStreak >= MADMAXI_SUPER_STREAK ? '#ffd700' : '#d1d5db',
              }}>
                STREAK {noDeathStreak}/{MADMAXI_SUPER_STREAK}
              </div>
              {superSeconds > 0 && (
                <div style={{
                  background: 'rgba(255,215,0,0.18)', border: '1px solid #ffd700',
                  borderRadius: 4, padding: '2px 8px',
                  fontSize: 11, fontWeight: 800, color: '#fff3b0',
                  textShadow: '0 0 10px #ffd700',
                }}>
                  ✦ SUPER MADMAXI {superSeconds}s
                </div>
              )}
              {comboCount > 1 && (
                <div style={{
                  background: 'rgba(255,180,0,0.2)', border: '1px solid #fa0',
                  borderRadius: 4, padding: '2px 8px',
                  fontSize: 11, fontWeight: 700, color: '#ffd700',
                  textShadow: '0 0 8px #fa0',
                }}>
                  ×{comboCount} COMBO
                </div>
              )}
              <div style={{
                background: dashReady ? 'rgba(0,200,255,0.15)' : 'rgba(100,100,100,0.15)',
                border: `1px solid ${dashReady ? '#0cf' : '#444'}`,
                borderRadius: 4, padding: '2px 8px',
                fontSize: 10, color: dashReady ? '#0cf' : '#666',
              }}>
                {dashReady ? '⚡ DASH' : '· dash ·'}
              </div>
              {(runtimeBoosts.shield > 0 || runtimeBoosts['high-jump'] > 0 || runtimeBoosts.laser > 0 || runtimeBoosts.giant > 0) && (
                <div style={{
                  background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(125,211,252,0.35)',
                  borderRadius: 6, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2,
                  fontSize: 10, color: '#dbeafe', minWidth: 128,
                }}>
                  {runtimeBoosts.shield > 0 && <span>🛡 Shield {runtimeBoosts.shield}s</span>}
                  {runtimeBoosts['high-jump'] > 0 && <span>⤴ High Jump {runtimeBoosts['high-jump']}s</span>}
                  {runtimeBoosts.laser > 0 && <span>◎ Eye Laser {runtimeBoosts.laser}s</span>}
                  {runtimeBoosts.giant > 0 && <span>⬛ Giant {runtimeBoosts.giant}s</span>}
                </div>
              )}
            </div>

            {/* Progress bar (hidden during boss fights — no scrolling world) */}
            {bossMaxHp === 0 && (
              <div style={{ position: 'absolute', bottom: 8, left: 12, right: 12,
                            background: 'rgba(0,0,0,0.35)', borderRadius: 4, height: 5,
                            pointerEvents: 'none' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${progress}%`,
                              background: 'linear-gradient(90deg,#4af,#4af7a0)',
                              transition: 'width 0.25s' }} />
              </div>
            )}
          </>
        )}
      </div>

      <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', maxWidth: 500 }}>
        Use the shared PS-style GameRemote or keyboard: ← → / A D move &nbsp;·&nbsp; ↑ / W / Space jump (double-jump) &nbsp;·&nbsp;
        <strong>Shift</strong> to dash &nbsp;·&nbsp; <strong>J / X</strong> to fire laser when powered &nbsp;·&nbsp; Dodge boss projectiles!
      </p>
    </div>
  );
}

// ─── GameCore — owns the Babylon.js engine lifecycle ─────────────────────────
interface GameCallbacks {
  onScore:      (s: number) => void;
  onDie:        (livesLeft: number) => void;
  onComplete:   (nextLevel: number) => void;
  onProgress?:  (pct: number) => void;
  onBossHp?:    (current: number) => void;
  onCombo?:     (count: number) => void;
  onDash?:      () => void;
  /** Reports coin collection: collected regular coins, total regular coins. */
  onCoinCount?: (collected: number, total: number) => void;
  onRuntime?:   (runtime: {
    superSeconds: number;
    boosts: Record<MadmaxiPowerUpKind, number>;
  }) => void;
}

type VPad = { left: boolean; right: boolean; jump: boolean; dash: boolean; shoot: boolean };

type RuntimeCarry = {
  sessionSeed: number;
  superSeconds: number;
};

class GameCore {
  private disposed = false;
  private keys: Set<string> = new Set();
  private vpad: VPad = { left: false, right: false, jump: false, dash: false, shoot: false };
  private godTier = new DreamEngineGodTierSystem();

  // physics state (logical pixels, Y-down)
  private px   = 60; // player x (left edge)
  private py   = 350; // player y (top edge)
  private pvx  = 0;
  private pvy  = 0;
  private onGround   = false;
  private jumpCount  = 0; // 0 = no jump used, 1 = single, 2 = double
  private coyoteFr   = 0; // coyote-time frames remaining
  private jBufFr     = 0; // jump-buffer frames remaining
  private prevJump   = false;
  private facingR    = true;
  private invincible = 0; // frames

  // ── Dash system ────────────────────────────────────────────────────────
  private dashFrames = 0;   // frames of active dash remaining
  private dashCool   = 0;   // cooldown frames remaining
  private dashDir    = 1;   // direction (+1 or -1)

  // ── Combo system ───────────────────────────────────────────────────────
  private comboCount     = 0;       // consecutive kills in window
  private comboTimestamp = 0;       // ms timestamp of last kill

  // ── Boss projectiles ───────────────────────────────────────────────────
  private projectiles: {
    x: number; y: number;
    vx: number; vy: number;
    life: number;
    friendly?: boolean;
    mesh: import('@babylonjs/core').Mesh | null;
  }[] = [];

  private score: number;
  private lives: number;
  private level: number;
  private cbs: GameCallbacks;

  private platforms: (PlatDef & { curX: number; moveDir: number })[] = [];
  private coins: (CoinDef & { collected: boolean })[] = [];
  private enemies: (EnemyDef & { alive: boolean; curX: number; curY: number; hitsLeft: number; state: number })[] = [];
  private hazards: (HazardDef & { curX: number; curY: number; moveDir: number; active: boolean; fallVy: number })[] = [];
  private powerUps: (PowerUpDef & { collected: boolean })[] = [];

  private camX   = 0;
  private worldW = 2400;
  private isBossLevel = false;
  private bossHitsMax = 0;
  private sessionSeed: number;
  private audio = new MadmaxiAudioController();

  // Babylon
  private engine: import('@babylonjs/core').AbstractEngine | null = null;
  private scene:  import('@babylonjs/core').Scene  | null = null;
  // Cached BJS module reference (set once in initBabylon)
  private bjs: typeof import('@babylonjs/core') | null = null;

  // Babylon mesh refs
  private playerMesh:  import('@babylonjs/core').Mesh | null = null; // robot body
  private playerHead:  import('@babylonjs/core').Mesh | null = null; // robot head box
  private playerVisor: import('@babylonjs/core').Mesh | null = null; // cyan visor stripe
  private playerArmL:  import('@babylonjs/core').Mesh | null = null; // left arm
  private playerArmR:  import('@babylonjs/core').Mesh | null = null; // right arm
  private playerLegL:  import('@babylonjs/core').Mesh | null = null; // left leg
  private playerLegR:  import('@babylonjs/core').Mesh | null = null; // right leg
  private platMeshes:  import('@babylonjs/core').Mesh[] = [];
  private coinMeshes:  (import('@babylonjs/core').Mesh | null)[] = [];
  private enemyMeshes: (import('@babylonjs/core').Mesh | null)[] = [];
  private bgPlane:     import('@babylonjs/core').Mesh | null = null;

  // Goal star meshes
  private goalMesh:    import('@babylonjs/core').Mesh | null = null;
  private goalRing:    import('@babylonjs/core').Mesh | null = null;
  private goalIdx:     number = -1;
  private hazardMeshes: (import('@babylonjs/core').Mesh | null)[] = [];
  private powerUpMeshes: (import('@babylonjs/core').Mesh | null)[] = [];

  // ── Coin collection tracking ────────────────────────────────────────────
  private totalRegularCoins  = 0;   // number of non-goal coins in this level
  private collectedRegularCoins = 0; // coins picked up so far
  // Camera zoom toward goal after 9th coin
  private coinFlashFrames    = 0;   // countdown for zoom-out animation
  private coinFlashDir       = 1;   // +1 = goal is to the right, -1 = to the left
  private camZoomOffset      = 0;   // extra cam height during coin zoom
  private shootCool          = 0;
  private shieldFrames       = 0;
  private highJumpFrames     = 0;
  private laserFrames        = 0;
  private giantFrames        = 0;
  private superFrames        = 0;

  // Parallax background stars
  private bgStars: { mesh: import('@babylonjs/core').Mesh; baseX: number; parallax: number }[] = [];
  private skylineBands: { mesh: import('@babylonjs/core').Mesh; baseX: number; parallax: number; pulseOffset: number }[] = [];
  private shadowGen: import('@babylonjs/core').ShadowGenerator | null = null;

  // camera ref
  private camMesh: import('@babylonjs/core').FreeCamera | null = null;

  // particles
  private dustPS: import('@babylonjs/core').ParticleSystem | null = null;

  // anim
  private animTick = 0;

  // guard: prevent multiple onDie calls before React re-renders
  private dying = false;

  constructor(
    canvas: HTMLCanvasElement,
    level: number,
    score: number,
    lives: number,
    cbs: GameCallbacks,
    runtimeCarry: RuntimeCarry,
  ) {
    this.level = level;
    this.score = score;
    this.lives = lives;
    this.cbs   = cbs;
    this.sessionSeed = runtimeCarry.sessionSeed;
    this.superFrames = Math.round(runtimeCarry.superSeconds * 60);
    this.initLevel(level);
    this.initBabylon(canvas);
  }

  private initLevel(n: number) {
    const def = getMadmaxiLevelDefinition(n, this.sessionSeed);
    this.worldW      = def.worldW;
    this.isBossLevel = def.isBossLevel ?? false;
    this.audio.setTheme(def.audioTheme);
    this.audio.playCue('zone-start');
    this.platforms   = def.platforms.map(p => ({ ...p, curX: p.x, moveDir: 1 }));
    this.coins       = def.coins.map(c => ({ ...c, collected: false }));
    this.enemies     = def.enemies.map(e => ({
      ...e, alive: true, curX: e.x, curY: e.y,
      hitsLeft: e.hitsLeft ?? 1,
      state: 0,
    }));
    this.hazards = (def.hazards ?? []).map((h) => ({
      ...h,
      curX: h.x,
      curY: h.y,
      moveDir: 1,
      active: true,
      fallVy: 0,
    }));
    this.powerUps = (def.powerUps ?? []).map((p) => ({ ...p, collected: false }));
    // Count regular (non-goal) coins for HUD
    this.totalRegularCoins      = def.coins.filter(c => !c.isGoal).length;
    this.collectedRegularCoins  = 0;
    this.coinFlashFrames        = 0;
    this.camZoomOffset          = 0;
    // Track max boss HP for health-bar percentage calculations
    const bossEnemy = def.enemies.find(e => e.boss);
    this.bossHitsMax = bossEnemy?.hitsLeft ?? 0;
    this.px    = 60;
    this.py    = 350;
    this.pvx   = 0;
    this.pvy   = 0;
    this.camX  = 0;
    this.onGround  = false;
    this.jumpCount = 0;
    this.coyoteFr  = 0;
    this.jBufFr    = 0;
    this.prevJump  = false;
    this.invincible = 0;
    this.dying  = false;
    this.goalIdx = -1;
    // Reset combat state
    this.dashFrames = 0;
    this.dashCool   = 0;
    this.comboCount = 0;
    this.comboTimestamp = 0;
    this.shootCool = 0;
    // Dispose any live projectiles
    for (const p of this.projectiles) p.mesh?.dispose();
    this.projectiles = [];
    this.cbs.onRuntime?.({
      superSeconds: Math.ceil(this.superFrames / 60),
      boosts: {
        shield: Math.ceil(this.shieldFrames / 60),
        'high-jump': Math.ceil(this.highJumpFrames / 60),
        laser: Math.ceil(this.laserFrames / 60),
        giant: Math.ceil(this.giantFrames / 60),
      },
    });
  }

  private async initBabylon(canvas: HTMLCanvasElement) {
    const [{ engine: engineInst }, BJS] = await Promise.all([
      createBabylonEngine(canvas, { preserveDrawingBuffer: true, stencil: true, antialias: true }),
      import('@babylonjs/core'),
    ]);
    if (this.disposed) { engineInst.dispose(); return; }

    const engine = engineInst;
    const scene  = new BJS.Scene(engine);
    this.engine  = engine;
    this.scene   = scene;
    this.bjs     = BJS;

    // Sky gradient — zone-themed
    const zone = ZONES[getZoneIdx(this.level)];
    scene.clearColor = new BJS.Color4(zone.sky[0], zone.sky[1], zone.sky[2], 1);

    // ── Camera (FreeCamera, side-view looking in +Z direction) ──────────────
    const cam = new BJS.FreeCamera('cam', new BJS.Vector3(0, 5.25, -22), scene);
    cam.setTarget(new BJS.Vector3(0, 4.8, 0));
    this.camMesh = cam;

    // ── Lighting ─────────────────────────────────────────────────────────────
    const ambient = new BJS.HemisphericLight('amb', new BJS.Vector3(0, 1, 0), scene);
    ambient.intensity  = 0.82;
    ambient.diffuse    = new BJS.Color3(0.85, 0.90, 1.0);
    ambient.groundColor= new BJS.Color3(0.1, 0.1, 0.25);

    const sun = new BJS.DirectionalLight('sun', new BJS.Vector3(0.35, -1, 0.45), scene);
    sun.intensity = 0.95;
    sun.diffuse   = new BJS.Color3(1.0, 0.95, 0.8);
    sun.shadowMinZ = 1;
    sun.shadowMaxZ = 70;
    const shadowGen = new BJS.ShadowGenerator(2048, sun);
    shadowGen.usePercentageCloserFiltering = true;
    shadowGen.filteringQuality = BJS.ShadowGenerator.QUALITY_HIGH;
    shadowGen.bias = 0.0008;
    this.shadowGen = shadowGen;

    // ── Glow layer ───────────────────────────────────────────────────────────
    const glow = new BJS.GlowLayer('glow', scene);
    glow.intensity = 0.9;

    // MADMAXI graphics upgrade: lightweight post-processing for clearer highlights
    // and smoother edges without changing gameplay physics.
    const pipeline = new BJS.DefaultRenderingPipeline('madmaxi-pipeline', true, scene, [cam]);
    pipeline.samples = 2;
    pipeline.fxaaEnabled = true;
    pipeline.imageProcessingEnabled = true;
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.72;
    pipeline.bloomWeight = 0.34;
    pipeline.bloomKernel = 62;
    pipeline.bloomScale = 0.76;

    // ── Background plane (starfield / gradient) ──────────────────────────────
    const bg = BJS.MeshBuilder.CreatePlane('bg', { width: 120, height: 40 }, scene);
    bg.position = new BJS.Vector3(0, 8, 10);
    const bgMat = new BJS.StandardMaterial('bgMat', scene);
    bgMat.diffuseColor  = new BJS.Color3(0.04, 0.06, 0.16);
    bgMat.emissiveColor = new BJS.Color3(0.06, 0.09, 0.25);
    bgMat.backFaceCulling = false;
    bg.material = bgMat;
    this.bgPlane = bg;

    // Aurora skyline bands — animated, layered backdrop for MADMAXI visual upgrade.
    const skylineLayers: [number, number, number, number][] = [
      [0.05, 12, 0.17, 0.24],
      [0.09, 10, 0.22, 0.20],
      [0.14, 8, 0.29, 0.16],
    ];
    skylineLayers.forEach(([parallax, depth, sat, alpha], idx) => {
      const band = BJS.MeshBuilder.CreatePlane(`skyline_band_${idx}`, { width: 140, height: 18 }, scene);
      const mat = new BJS.StandardMaterial(`skyline_mat_${idx}`, scene);
      mat.disableLighting = true;
      mat.alpha = alpha;
      mat.backFaceCulling = false;
      mat.diffuseColor = new BJS.Color3(zone.sky[0] + sat, zone.sky[1] + sat * 0.7, zone.sky[2] + sat * 1.05);
      mat.emissiveColor = new BJS.Color3(zone.sky[0] + sat * 0.6, zone.sky[1] + sat * 0.45, zone.sky[2] + sat);
      band.material = mat;
      band.position.set(0, 10 + idx * 2.4, depth);
      this.skylineBands.push({ mesh: band, baseX: 0, parallax, pulseOffset: idx * 1.8 });
    });

    // ── Parallax star layers (3 depths, scrolling at different rates) ────────
    const rng = seededRng(this.level * STAR_SEED_PRIME + STAR_SEED_OFFSET);
    // layer config: [parallaxFactor, z-depth, count, size-range]
    const starLayers: [number, number, number, number][] = [
      [0.04, 14, 26, 0.07],   // distant — slowest parallax, deep z
      [0.09,  9, 18, 0.09],   // mid
      [0.16,  5, 12, 0.11],   // near — fastest parallax, shallow z
    ];
    for (const [parallax, depth, count, size] of starLayers) {
      for (let s = 0; s < count; s++) {
        const star = BJS.MeshBuilder.CreateSphere(`bgs_l${depth}_${s}`,
          { diameter: size + rng() * size, segments: 6 }, scene);
        const mat = new BJS.StandardMaterial(`bgsm_${depth}_${s}`, scene);
        const b = 0.55 + rng() * 0.45;
        mat.emissiveColor = new BJS.Color3(b * 0.90, b * 0.93, b);
        mat.disableLighting = true;
        star.material = mat;
        const baseX = (rng() - 0.5) * 54;
        star.position.set(baseX, rng() * 13 + 0.5, depth);
        this.bgStars.push({ mesh: star, baseX, parallax });
      }
    }

    // ── Platform meshes ───────────────────────────────────────────────────────
    for (const p of this.platforms) {
      const bw = p.w / PX_PER_BU;
      const bh = p.h / PX_PER_BU;
      const mesh = BJS.MeshBuilder.CreateBox(`plat_${p.x}`, { width: bw, height: bh, depth: 1.2 }, scene);
      const mat  = new BJS.StandardMaterial(`pmat_${p.x}`, scene);

      if (p.type === 'goal') {
        mat.diffuseColor  = new BJS.Color3(0.9, 0.7, 0.1);
        mat.emissiveColor = new BJS.Color3(0.5, 0.35, 0.0);
        glow.addIncludedOnlyMesh(mesh);
      } else if (p.type === 'moving') {
        mat.diffuseColor  = new BJS.Color3(0.2, 0.55, 0.85);
        mat.emissiveColor = new BJS.Color3(0.05, 0.15, 0.3);
      } else {
        const isGround = p.y === 400;
        mat.diffuseColor  = isGround
          ? new BJS.Color3(zone.gnd[0], zone.gnd[1], zone.gnd[2])
          : new BJS.Color3(zone.plt[0], zone.plt[1], zone.plt[2]);
        mat.emissiveColor = new BJS.Color3(zone.em[0], zone.em[1], zone.em[2]);
      }
      mat.specularColor = new BJS.Color3(0.15, 0.2, 0.4);
      mesh.material = mat;
      mesh.receiveShadows = true;
      shadowGen.addShadowCaster(mesh, false);
      this.platMeshes.push(mesh);
    }

    // ── Coin meshes ───────────────────────────────────────────────────────────
    // Goal coin is special: rendered as an animated star (sphere + torus ring).
    const goalMat = new BJS.StandardMaterial('goalMat', scene);
    goalMat.diffuseColor  = new BJS.Color3(1.0, 0.85, 0.10);
    goalMat.emissiveColor = new BJS.Color3(0.70, 0.42, 0.00);
    goalMat.specularColor = new BJS.Color3(1.0, 0.9, 0.3);

    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i];
      if (c.isGoal) {
        this.goalIdx = i;
        // Central star body
        const star = BJS.MeshBuilder.CreateSphere(`goal_body`, { diameter: 0.88, segments: 10 }, scene);
        star.material = goalMat;
        shadowGen.addShadowCaster(star, false);
        glow.addIncludedOnlyMesh(star);
        this.goalMesh = star;
        // Orbiting torus ring
        const ring = BJS.MeshBuilder.CreateTorus(`goal_ring`,
          { diameter: 1.5, thickness: 0.10, tessellation: 28 }, scene);
        ring.material = goalMat;
        shadowGen.addShadowCaster(ring, false);
        glow.addIncludedOnlyMesh(ring);
        this.goalRing = ring;
        this.coinMeshes.push(null); // keep index aligned with this.coins[] for collision detection
      } else {
        const mesh = BJS.MeshBuilder.CreateSphere(`coin_${c.x}_${c.y}`,
          { diameter: 0.42, segments: 14 }, scene);
        const mat  = new BJS.StandardMaterial(`cmat_${c.x}`, scene);
        // SILVER coins (regular) — flat metallic look
        mat.diffuseColor  = new BJS.Color3(0.80, 0.82, 0.88);
        mat.emissiveColor = new BJS.Color3(0.18, 0.20, 0.26);
        mat.specularColor = new BJS.Color3(1.0, 1.0, 1.0);
        mat.specularPower = 96;
        mesh.material = mat;
        shadowGen.addShadowCaster(mesh, false);
        glow.addIncludedOnlyMesh(mesh);
        this.coinMeshes.push(mesh);
      }
    }

    // ── Hazard meshes ─────────────────────────────────────────────────────────
    for (let hi = 0; hi < this.hazards.length; hi++) {
      const hz = this.hazards[hi];
      let mesh: import('@babylonjs/core').Mesh;
      if (hz.type === 'spike') {
        mesh = BJS.MeshBuilder.CreateCylinder(`haz_${hi}`, {
          diameterTop: 0,
          diameterBottom: 0.55,
          height: 0.6,
          tessellation: 6,
        }, scene);
      } else {
        mesh = BJS.MeshBuilder.CreateBox(`haz_${hi}`, { width: 0.46, height: 0.46, depth: 0.46 }, scene);
      }
      const mat = new BJS.StandardMaterial(`haz_mat_${hi}`, scene);
      mat.diffuseColor = hz.type === 'spike' ? new BJS.Color3(0.75, 0.08, 0.18) : new BJS.Color3(0.56, 0.24, 0.08);
      mat.emissiveColor = hz.type === 'spike' ? new BJS.Color3(0.22, 0.01, 0.05) : new BJS.Color3(0.12, 0.05, 0.01);
      mesh.material = mat;
      glow.addIncludedOnlyMesh(mesh);
      this.hazardMeshes.push(mesh);
    }

    // ── Power-up meshes ───────────────────────────────────────────────────────
    for (let pi = 0; pi < this.powerUps.length; pi++) {
      const p = this.powerUps[pi];
      const mesh = BJS.MeshBuilder.CreateTorus(`power_${pi}`, {
        diameter: 0.55,
        thickness: 0.14,
        tessellation: 18,
      }, scene);
      const mat = new BJS.StandardMaterial(`power_mat_${pi}`, scene);
      if (p.type === 'shield') mat.emissiveColor = new BJS.Color3(0.15, 0.8, 1.0);
      if (p.type === 'high-jump') mat.emissiveColor = new BJS.Color3(0.4, 1.0, 0.4);
      if (p.type === 'laser') mat.emissiveColor = new BJS.Color3(1.0, 0.25, 0.4);
      if (p.type === 'giant') mat.emissiveColor = new BJS.Color3(0.95, 0.72, 0.12);
      mat.diffuseColor = mat.emissiveColor.scale(0.8);
      mesh.material = mat;
      glow.addIncludedOnlyMesh(mesh);
      this.powerUpMeshes.push(mesh);
    }

    // ── Enemy meshes ──────────────────────────────────────────────────────────
    for (let ei = 0; ei < this.enemies.length; ei++) {
      const en = this.enemies[ei];
      const isBoss  = !!en.boss;
      const diameter = isBoss ? 0.85 * (en.size ?? 1.8) : 0.85;
      let mesh: import('@babylonjs/core').Mesh;
      if (isBoss) {
        mesh = BJS.MeshBuilder.CreateSphere(`enemy_${ei}`, { diameter, segments: 24 }, scene);
      } else {
        switch (en.kind) {
          case 'runner':
          case 'charger':
            mesh = BJS.MeshBuilder.CreateBox(`enemy_${ei}`, { width: 0.78, height: 0.62, depth: 0.48 }, scene);
            break;
          case 'hopper':
            mesh = BJS.MeshBuilder.CreateSphere(`enemy_${ei}`, { diameter: 0.78, segments: 16 }, scene);
            break;
          case 'flyer':
            mesh = BJS.MeshBuilder.CreateCylinder(`enemy_${ei}`, { diameterTop: 0.18, diameterBottom: 0.8, height: 0.54, tessellation: 3 }, scene);
            break;
          case 'zigzag':
            mesh = BJS.MeshBuilder.CreateTorus(`enemy_${ei}`, { diameter: 0.78, thickness: 0.18, tessellation: 14 }, scene);
            break;
          case 'orbiter':
            mesh = BJS.MeshBuilder.CreateSphere(`enemy_${ei}`, { diameter: 0.58, segments: 10 }, scene);
            break;
          case 'sniper':
            mesh = BJS.MeshBuilder.CreateCylinder(`enemy_${ei}`, { diameter: 0.6, height: 0.8, tessellation: 8 }, scene);
            break;
          case 'burrower':
            mesh = BJS.MeshBuilder.CreateSphere(`enemy_${ei}`, { diameter: 0.72, segments: 12 }, scene);
            break;
          case 'spiker':
            mesh = BJS.MeshBuilder.CreatePolyhedron(`enemy_${ei}`, { type: 4, size: 0.46 }, scene);
            break;
          case 'shadow':
          default:
            mesh = BJS.MeshBuilder.CreateCapsule(`enemy_${ei}`, { radius: 0.22, height: 0.95, tessellation: 10 }, scene);
            break;
        }
      }
      const mat  = new BJS.StandardMaterial(`emat_${ei}`, scene);
      if (isBoss && en.bossColor) {
        const [r,g,b] = en.bossColor;
        const [er,eg,eb] = en.bossEmissive ?? [r*0.4,g*0.4,b*0.4];
        mat.diffuseColor  = new BJS.Color3(r, g, b);
        mat.emissiveColor = new BJS.Color3(er, eg, eb);
        mat.specularColor = new BJS.Color3(0.8, 0.7, 0.4);
      } else {
        const colorMap: Record<MadmaxiEnemyKind, [number, number, number]> = {
          runner: [0.90, 0.28, 0.18],
          charger: [0.88, 0.42, 0.08],
          hopper: [0.60, 0.90, 0.18],
          flyer: [0.15, 0.90, 0.85],
          zigzag: [0.82, 0.22, 0.88],
          orbiter: [0.35, 0.55, 1.0],
          sniper: [0.96, 0.82, 0.22],
          burrower: [0.58, 0.28, 0.08],
          spiker: [0.86, 0.10, 0.28],
          shadow: [0.44, 0.44, 0.56],
        };
        const kind = en.kind ?? 'runner';
        const [r, g, b] = colorMap[kind];
        mat.diffuseColor  = new BJS.Color3(r, g, b);
        mat.emissiveColor = new BJS.Color3(r * 0.28, g * 0.18, b * 0.28);
        mat.specularColor = new BJS.Color3(0.6, 0.6, 0.7);
      }
      mesh.material = mat;
      shadowGen.addShadowCaster(mesh, false);
      glow.addIncludedOnlyMesh(mesh);
      this.enemyMeshes.push(mesh);
    }

    // ── MADMAXI Robot player ─────────────────────────────────────────────────
    // Build a robot character evocative of the landing-page Dr. Eams design:
    //  Body → gold/silver metallic box torso
    //  Head → box with prominent cyan glowing visor band
    //  Arms → thin boxes on either side, swing when walking
    //  Legs → box legs, step animation

    // Shared robot gold material
    const robotBodyMat = new BJS.StandardMaterial('robotBodyMat', scene);
    robotBodyMat.diffuseColor  = new BJS.Color3(0.76, 0.60, 0.14); // gold body
    robotBodyMat.emissiveColor = new BJS.Color3(0.28, 0.20, 0.04);
    robotBodyMat.specularColor = new BJS.Color3(1.0, 0.88, 0.40);
    robotBodyMat.specularPower = 120;

    const robotDarkMat = new BJS.StandardMaterial('robotDarkMat', scene);
    robotDarkMat.diffuseColor  = new BJS.Color3(0.22, 0.20, 0.24); // dark silver joints
    robotDarkMat.emissiveColor = new BJS.Color3(0.06, 0.06, 0.08);
    robotDarkMat.specularColor = new BJS.Color3(0.6, 0.6, 0.7);
    robotDarkMat.specularPower = 80;

    const robotVisorMat = new BJS.StandardMaterial('robotVisorMat', scene);
    robotVisorMat.diffuseColor  = new BJS.Color3(0.0, 0.7, 1.0);  // cyan visor
    robotVisorMat.emissiveColor = new BJS.Color3(0.0, 0.5, 0.9);
    robotVisorMat.specularColor = new BJS.Color3(0.4, 0.9, 1.0);
    robotVisorMat.specularPower = 200;

    // Body (torso)
    const robotBody = BJS.MeshBuilder.CreateBox('robot_body',
      { width: 0.55, height: 0.62, depth: 0.38 }, scene);
    robotBody.material = robotBodyMat;
    shadowGen.addShadowCaster(robotBody, true);
    glow.addIncludedOnlyMesh(robotBody);
    this.playerMesh = robotBody;

    // Head (box, sits on top of body)
    const robotHead = BJS.MeshBuilder.CreateBox('robot_head',
      { width: 0.44, height: 0.36, depth: 0.36 }, scene);
    robotHead.material = robotBodyMat;
    shadowGen.addShadowCaster(robotHead, true);
    this.playerHead = robotHead;

    // Visor (thin flat box on front of head, glowing cyan)
    const robotVisor = BJS.MeshBuilder.CreateBox('robot_visor',
      { width: 0.30, height: 0.09, depth: 0.05 }, scene);
    robotVisor.material = robotVisorMat;
    glow.addIncludedOnlyMesh(robotVisor);
    this.playerVisor = robotVisor;

    // Left arm
    const robotArmL = BJS.MeshBuilder.CreateBox('robot_arm_l',
      { width: 0.16, height: 0.42, depth: 0.18 }, scene);
    robotArmL.material = robotDarkMat;
    shadowGen.addShadowCaster(robotArmL, false);
    this.playerArmL = robotArmL;

    // Right arm
    const robotArmR = BJS.MeshBuilder.CreateBox('robot_arm_r',
      { width: 0.16, height: 0.42, depth: 0.18 }, scene);
    robotArmR.material = robotDarkMat;
    shadowGen.addShadowCaster(robotArmR, false);
    this.playerArmR = robotArmR;

    // Left leg
    const robotLegL = BJS.MeshBuilder.CreateBox('robot_leg_l',
      { width: 0.20, height: 0.44, depth: 0.22 }, scene);
    robotLegL.material = robotBodyMat;
    shadowGen.addShadowCaster(robotLegL, false);
    this.playerLegL = robotLegL;

    // Right leg
    const robotLegR = BJS.MeshBuilder.CreateBox('robot_leg_r',
      { width: 0.20, height: 0.44, depth: 0.22 }, scene);
    robotLegR.material = robotBodyMat;
    shadowGen.addShadowCaster(robotLegR, false);
    this.playerLegR = robotLegR;

    // ── Particle system (landing/jump dust) ────────────────────────────────
    const dust = new BJS.ParticleSystem('dust', 60, scene);
    // Use a 1x1 white data-URI texture for cross-origin-safe particles
    dust.particleTexture  = new BJS.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
      scene,
    );
    dust.emitter          = new BJS.Vector3(0, 0, 0);
    dust.minSize          = 0.08;
    dust.maxSize          = 0.22;
    dust.minLifeTime      = 0.2;
    dust.maxLifeTime      = 0.5;
    dust.minEmitPower     = 0.8;
    dust.maxEmitPower     = 2.0;
    dust.emitRate         = 0;
    dust.direction1       = new BJS.Vector3(-1.5, 1, -0.5);
    dust.direction2       = new BJS.Vector3(1.5,  2,  0.5);
    dust.color1 = new BJS.Color4(0.4, 0.65, 1.0, 0.8);
    dust.color2 = new BJS.Color4(0.2, 0.4,  0.8, 0.4);
    dust.colorDead = new BJS.Color4(0, 0, 0, 0);
    dust.gravity  = new BJS.Vector3(0, -4, 0);
    dust.start();
    this.dustPS = dust;

    // ── Render loop + God Tier ─────────────────────────────────────────────
    let lastGtMs = 0;
    engine.runRenderLoop(() => {
      if (this.disposed) return;
      this.tick();
      scene.render();
      // God Tier hardware scaling — check every 3000ms
      const now = performance.now();
      if (now - lastGtMs > 3000) {
        lastGtMs = now;
        const perf = (engine as import('@babylonjs/core').Engine).performanceMonitor;
        const avgFrame = perf ? perf.averageFrameTime : 16.6;
        const gt = this.godTier.update({
          device:  defaultDeviceSignals(),
          runtime: { frameMs: avgFrame, avgFrameMs: avgFrame, cpuMs: avgFrame * 0.4, gpuMs: avgFrame * 0.5, droppedFrameRatio: perf ? (perf.averageFrameTime > 20 ? 0.1 : 0) : 0, inputLatencyMs: 20, scrollVelocity: 0, pointerVelocity: 0, interactionBurst: 0 },
          ux:      defaultUXSignals(),
          route:   defaultRouteSignals('/game/madmaxi'),
          meshes:  scene.meshes.map((m) => ({
            id: m.id, visible: m.isVisible, interactive: m.isPickable, nearPointer: false,
            distanceToCamera: 10, transformDelta: 0, materialChanged: false,
            screenCoverage: m.id === 'player' ? 0.15 : 0.05,
            semanticWeight: m.id === 'player' || m.id === 'goal' ? 1.0 : 0.3,
            motionWeight:   m.id === 'player' ? 1.0 : 0.2,
            detailWeight:   0.5,
            heroWeight:     m.id === 'player' ? 1.0 : 0.2,
            occluded: false,
          })),
          ui: [],
        });
        applyGodTierToBabylon(engine, scene as unknown as BabylonSceneLike, gt, window.devicePixelRatio ?? 1);
      }
    });

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => { this.engine?.resize(); };

  setKeys(k: Set<string>) { this.keys = k; }
  setVpad(v: VPad)        { this.vpad = v; }

  private emitRuntime() {
    this.cbs.onRuntime?.({
      superSeconds: Math.ceil(this.superFrames / 60),
      boosts: {
        shield: Math.ceil(this.shieldFrames / 60),
        'high-jump': Math.ceil(this.highJumpFrames / 60),
        laser: Math.ceil(this.laserFrames / 60),
        giant: Math.ceil(this.giantFrames / 60),
      },
    });
  }

  private canShootLaser() {
    return this.superFrames > 0 || this.laserFrames > 0;
  }

  private grantPowerUp(type: MadmaxiPowerUpKind) {
    if (type === 'shield') this.shieldFrames = 8 * 60;
    if (type === 'high-jump') this.highJumpFrames = 8 * 60;
    if (type === 'laser') this.laserFrames = 8 * 60;
    if (type === 'giant') this.giantFrames = 4 * 60;
    this.emitRuntime();
    this.audio.playCue('powerup');
  }

  private absorbOrDie() {
    if (this.superFrames > 0) return;
    if (this.shieldFrames > 0) {
      this.shieldFrames = 0;
      this.invincible = 45;
      this.emitRuntime();
      this.audio.playCue('hurt');
      return;
    }
    this.dying = true;
    this.invincible = 90;
    this.lives--;
    this.audio.playCue('hurt');
    this.cbs.onDie(this.lives);
  }

  private firePlayerLaser() {
    if (!this.scene || !this.bjs || this.shootCool > 0 || !this.canShootLaser()) return;
    this.shootCool = 12;
    const BJS = this.bjs;
    const startX = this.px + (this.facingR ? 30 : -2);
    const startY = this.py + 16;
    const mesh = BJS.MeshBuilder.CreateCylinder(`player_laser_${Date.now()}`, {
      diameter: 0.14,
      height: 0.9,
      tessellation: 8,
    }, this.scene);
    mesh.rotation.z = Math.PI / 2;
    const mat = new BJS.StandardMaterial(`player_laser_mat_${Date.now()}`, this.scene);
    mat.emissiveColor = this.superFrames > 0
      ? new BJS.Color3(1.0, 0.85, 0.18)
      : new BJS.Color3(0.0, 0.85, 1.0);
    mesh.material = mat;
    this.audio.playCue('laser');
    this.projectiles.push({
      x: startX,
      y: startY,
      vx: this.facingR ? 8.4 : -8.4,
      vy: 0,
      life: 46,
      friendly: true,
      mesh,
    });
  }

  // ── Physics & logic tick ──────────────────────────────────────────────────
  private tick() {
    if (!this.engine || !this.scene) return;
    if (this.dying) return;
    this.animTick++;

    const isLeft  = this.keys.has('ArrowLeft')  || this.keys.has('KeyA')  || this.vpad.left;
    const isRight = this.keys.has('ArrowRight') || this.keys.has('KeyD')  || this.vpad.right;
    const isJump  = this.keys.has('ArrowUp')    || this.keys.has('KeyW')  || this.keys.has('Space') || this.vpad.jump;
    const isDash  = this.vpad.dash;
    const isShoot = this.keys.has('KeyJ') || this.keys.has('KeyX') || this.vpad.shoot;

    if (this.superFrames > 0) this.superFrames--;
    if (this.shieldFrames > 0) this.shieldFrames--;
    if (this.highJumpFrames > 0) this.highJumpFrames--;
    if (this.laserFrames > 0) this.laserFrames--;
    if (this.giantFrames > 0) this.giantFrames--;
    if (this.shootCool > 0) this.shootCool--;
    if (this.animTick % 15 === 0) this.emitRuntime();

    // Jump buffer — remember a fresh jump press for JBUF_MS frames
    const freshJump = isJump && !this.prevJump;
    if (freshJump) this.jBufFr = JBUF_MS;
    if (this.jBufFr > 0) this.jBufFr--;
    this.prevJump = isJump;

    if (isShoot) this.firePlayerLaser();

    // ── Dash system ────────────────────────────────────────────────────────
    if (this.dashCool > 0) this.dashCool--;
    if (isDash && this.dashCool === 0 && this.dashFrames === 0) {
      this.dashDir    = this.facingR ? 1 : -1;
      this.dashFrames = DASH_DUR;
      this.dashCool   = DASH_COOL;
      this.invincible = Math.max(this.invincible, DASH_DUR + 2); // i-frames during dash
      this.cbs.onDash?.();
    }

    // ── Horizontal movement ────────────────────────────────────────────────
    if (this.dashFrames > 0) {
      this.pvx = this.dashDir * DASH_SPD * PX_PER_BU;
      this.dashFrames--;
    } else {
      const baseWalk = this.superFrames > 0 ? WALK_SPD * 1.45 : WALK_SPD;
      this.pvx = isRight ? baseWalk * PX_PER_BU
                : isLeft  ? -baseWalk * PX_PER_BU
                : 0;
    }
    if (isRight) this.facingR = true;
    if (isLeft)  this.facingR = false;

    // Gravity — lighter during super mode / hover
    const gravityMul = this.superFrames > 0 && isJump && this.pvy > 0 ? 0.18 : 1;
    this.pvy += GRAV * gravityMul * PX_PER_BU;
    if (this.pvy > MAX_FALL * PX_PER_BU) this.pvy = MAX_FALL * PX_PER_BU;

    // Move
    this.px += this.pvx;
    this.py += this.pvy;

    // World bounds (clamp left, don't scroll past right until goal)
    if (this.px < 0) { this.px = 0; this.pvx = 0; }

    // ── Platform collisions ───────────────────────────────────────────────
    const wasOnGround = this.onGround;
    this.onGround = false;

    const playerScale = this.giantFrames > 0 ? 1.45 : this.superFrames > 0 ? 1.18 : 1;
    const PW = 28 * playerScale;
    const PH = 40 * playerScale;

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      // Update moving platform
      if (p.type === 'moving' && p.moveRange && p.moveSpd) {
        p.curX += p.moveSpd * p.moveDir;
        if (p.curX > p.x + p.moveRange || p.curX < p.x - p.moveRange)
          p.moveDir *= -1;
      } else {
        p.curX = p.x;
      }

      // AABB collision (player bottom vs platform top)
      const px2 = this.px + PW, py2 = this.py + PH;
      const tx2 = p.curX + p.w,  ty2 = p.y + p.h;
      const tx  = p.curX,         ty  = p.y;

      if (px2 > tx && this.px < tx2 && py2 > ty && this.py < ty2) {
        const overlapT = py2 - ty;
        const overlapB = ty2 - this.py;
        const overlapL = px2 - tx;
        const overlapR = tx2 - this.px;
        const minOv    = Math.min(overlapT, overlapB, overlapL, overlapR);

        if (minOv === overlapT && this.pvy >= 0) {
          // Land on top
          this.py = ty - PH;
          this.pvy = 0;
          this.onGround = true;
          this.jumpCount = 0;
          // Moving platform drag
          if (p.type === 'moving') this.px += (p.moveSpd ?? 0) * p.moveDir;
        } else if (minOv === overlapB && this.pvy < 0) {
          // Hit ceiling
          this.py = ty2;
          this.pvy = 0;
        } else if (minOv === overlapL) {
          this.px = tx - PW;
          this.pvx = 0;
        } else if (minOv === overlapR) {
          this.px = tx2;
          this.pvx = 0;
        }
      }
    }

    // Coyote time
    if (wasOnGround && !this.onGround) {
      this.coyoteFr = COYOTE_MS;
    }
    if (this.onGround) this.coyoteFr = 0;
    if (this.coyoteFr > 0) this.coyoteFr--;

    // Jump: ground jump, coyote jump, or double-jump
    const canJump = this.onGround || this.coyoteFr > 0;
    if (this.jBufFr > 0) {
      if (canJump && this.jumpCount === 0) {
        const jumpPower = this.highJumpFrames > 0 || this.superFrames > 0 ? JUMP_VY * 1.28 : JUMP_VY;
        this.pvy       = -jumpPower * PX_PER_BU;
        this.jumpCount = 1;
        this.jBufFr    = 0;
        this.coyoteFr  = 0;
        this.emitDust();
        this.audio.playCue('jump');
      } else if (!canJump && this.jumpCount === 1) {
        // Double-jump
        const jumpPower = this.highJumpFrames > 0 || this.superFrames > 0 ? JUMP_VY * 1.10 : JUMP_VY * 0.85;
        this.pvy       = -jumpPower * PX_PER_BU;
        this.jumpCount = 2;
        this.jBufFr    = 0;
        this.emitDust();
        this.audio.playCue('jump');
      }
    }

    // Fell off screen — die
    if (this.py > GH + 60) {
      this.dying = true;
      this.lives--;
      this.cbs.onDie(this.lives);
      return;
    }

    // Emit progress (every 15 frames to avoid excessive re-renders)
    if (this.animTick % 15 === 0) {
      this.cbs.onProgress?.(Math.min(100, Math.round((this.px / this.worldW) * 100)));
    }

    // ── Coin collection ────────────────────────────────────────────────────
    const CW = 18, PCX = this.px + PW / 2, PCY = this.py + PH / 2;
    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i];
      if (c.collected) continue;
      const cx = c.x + CW / 2, cy = c.y + CW / 2;
      if (Math.abs(PCX - cx) < CW + 8 && Math.abs(PCY - cy) < CW + 8) {
        c.collected = true;
        if (c.isGoal) {
          // Gold Dream Star collected → level complete
          this.goalMesh?.setEnabled(false);
          this.goalMesh = null;
          this.goalRing?.setEnabled(false);
          this.goalRing = null;
          this.score += 500;
          this.cbs.onScore(this.score);
          this.audio.playCue('goal');
          this.cbs.onComplete(this.level + 1);
          return;
        } else {
          // Silver coin collected
          if (this.coinMeshes[i]) {
            this.coinMeshes[i]!.setEnabled(false);
            this.coinMeshes[i] = null;
          }
          this.collectedRegularCoins++;
          this.score += 100;
          this.cbs.onScore(this.score);
          this.audio.playCue('coin');
          this.cbs.onCoinCount?.(this.collectedRegularCoins, this.totalRegularCoins);

          // All 9 silver coins collected → camera zoom toward the Gold Dream Star
          if (this.collectedRegularCoins >= this.totalRegularCoins && this.goalIdx >= 0) {
            const goal = this.coins[this.goalIdx];
            this.coinFlashDir    = goal.x > this.px ? 1 : -1;
            this.coinFlashFrames = 70; // 70-frame zoom animation
          }
        }
      }
    }

    // ── Power-up collection ────────────────────────────────────────────────
    for (let i = 0; i < this.powerUps.length; i++) {
      const p = this.powerUps[i];
      if (p.collected) continue;
      if (Math.abs(PCX - p.x) < 22 && Math.abs(PCY - p.y) < 22) {
        p.collected = true;
        this.powerUpMeshes[i]?.setEnabled(false);
        this.powerUpMeshes[i] = null;
        this.grantPowerUp(p.type);
      }
    }

    // ── Hazard collisions / updates ────────────────────────────────────────
    for (let i = 0; i < this.hazards.length; i++) {
      const hz = this.hazards[i];
      if (hz.type === 'spike') {
        if (hz.moveRange && hz.moveSpd) {
          hz.curX += hz.moveSpd * hz.moveDir;
          if (hz.curX > hz.x + hz.moveRange || hz.curX < hz.x - hz.moveRange) hz.moveDir *= -1;
        }
      } else {
        const distX = Math.abs((this.px + PW / 2) - hz.x);
        if (distX < (hz.triggerRadius ?? 140)) hz.fallVy = Math.min(hz.fallVy + 0.34, 8.2);
        hz.curY += hz.fallVy;
        if (hz.curY > 420) {
          hz.curY = hz.y;
          hz.fallVy = 0;
        }
      }
      if (Math.abs(PCX - hz.curX) < 22 && Math.abs(PCY - hz.curY) < 28) {
        this.absorbOrDie();
        if (this.dying) return;
      }
    }

    // ── Enemy collisions ──────────────────────────────────────────────────
    if (this.invincible > 0) this.invincible--;

    for (let i = 0; i < this.enemies.length; i++) {
      const en = this.enemies[i];
      if (!en.alive) continue;

      // Boss enrages at ≤50% HP — speed multiplied by 1.5
      const enrageMultiplier = (en.boss && this.bossHitsMax > 0 && en.hitsLeft / this.bossHitsMax <= BOSS_ENRAGE_THRESHOLD) ? BOSS_ENRAGE_MULTIPLIER : 1.0;

      // Move enemy
      if (en.boss) {
        en.curX += en.vx * enrageMultiplier;
      } else {
        const anchorX = en.anchorX ?? en.x;
        const anchorY = en.anchorY ?? en.y;
        switch (en.kind) {
          case 'charger':
            if (Math.abs(this.px - en.curX) < 220) {
              en.vx = this.px > en.curX ? Math.abs(en.vx) + 0.16 : -Math.abs(en.vx) - 0.16;
            }
            en.curX += en.vx * 1.22;
            break;
          case 'hopper':
            en.state += 0.18;
            en.curX += en.vx * 0.85;
            en.curY = anchorY - Math.abs(Math.sin(en.state) * 42);
            break;
          case 'flyer':
            en.state += 0.08;
            en.curX += en.vx * 0.75;
            en.curY = anchorY + Math.sin(en.state * 2.2) * 26;
            break;
          case 'zigzag':
            en.state += 0.12;
            en.curX += en.vx * 0.92;
            en.curY = anchorY + Math.sin(en.state * 3.4) * 40;
            break;
          case 'orbiter':
            en.state += 0.08;
            en.curX = anchorX + Math.cos(en.state) * 46;
            en.curY = anchorY + Math.sin(en.state) * 32;
            break;
          case 'sniper':
            en.state += 1;
            en.curX += Math.sin(en.state * 0.05) * 0.35;
            en.curY = anchorY;
            if (this.animTick % 120 === 0 && Math.abs(this.px - en.curX) < 280) {
              en.vx = this.px > en.curX ? Math.abs(en.vx) : -Math.abs(en.vx);
            }
            break;
          case 'burrower':
            en.state += 0.15;
            en.curX += en.vx * 0.65;
            en.curY = anchorY + Math.sin(en.state) * 12;
            break;
          case 'spiker':
            en.curX += en.vx * 0.55;
            en.curY = 360;
            break;
          case 'shadow':
            en.curX += (this.px > en.curX ? 1.8 : -1.8) + en.vx * 0.2;
            en.curY = anchorY + Math.sin(this.animTick * 0.08 + i) * 22;
            break;
          case 'runner':
          default:
            en.curX += en.vx;
            en.curY = anchorY;
            break;
        }
      }
      // Reverse at world edges
      const groundPlat = this.platforms.find(p => p.y === 400);
      const gLeft  = groundPlat ? groundPlat.x : 0;
      const gRight = gLeft + (groundPlat ? groundPlat.w : this.worldW);
      // Boss uses scaled hitbox
      const eSize = en.boss ? Math.round((en.size ?? 1.8) * 32) : 32;
      if (en.curX < gLeft || en.curX > gRight - eSize) en.vx *= -1;

      const ex2 = en.curX + eSize, ey2 = en.curY + eSize;
      const px2e = this.px + PW, py2e = this.py + PH;

      if (px2e > en.curX && this.px < ex2 && py2e > en.curY && this.py < ey2) {
        const stompThreshold = en.boss ? (en.size ?? 1.8) * 22 : (this.giantFrames > 0 || this.superFrames > 0 ? 34 : 22);
        const stompOv = py2e - en.curY;
        if (stompOv < stompThreshold && this.pvy > 0) {
          // Stomp hit!
          en.hitsLeft--;
          this.pvy = -JUMP_VY * 0.7 * PX_PER_BU;
          if (en.boss) {
            // Report boss HP update before checking for death
            this.cbs.onBossHp?.(en.hitsLeft);
            if (en.hitsLeft <= 0) {
              // Boss defeated — boss level victory
              en.alive = false;
              if (this.enemyMeshes[i]) {
                this.enemyMeshes[i]!.setEnabled(false);
                this.enemyMeshes[i] = null;
              }
              this.score += this.bossHitsMax * 300;
              this.audio.playCue('boss-hit');
              this.cbs.onScore(this.score);
              this.cbs.onComplete(this.level + 1);
              return;
            }
            // Boss still alive — bounce player higher for drama
            this.audio.playCue('boss-hit');
            this.pvy = -JUMP_VY * 0.9 * PX_PER_BU;
          } else {
            en.alive = false;
            if (this.enemyMeshes[i]) {
              this.enemyMeshes[i]!.setEnabled(false);
              this.enemyMeshes[i] = null;
            }
            // Combo kill scoring
            const now = Date.now();
            if (now - this.comboTimestamp < COMBO_WIN) {
              this.comboCount++;
            } else {
              this.comboCount = 1;
            }
            this.comboTimestamp = now;
            this.score += 200 * this.comboCount;
            this.audio.playCue('enemy-hit');
            this.cbs.onScore(this.score);
            this.cbs.onCombo?.(this.comboCount);
          }
        } else if (this.invincible === 0) {
          // Hit by enemy
          this.absorbOrDie();
          if (this.dying) return;
        }
      }

      // ── Boss / sniper projectile firing ────────────────────────────────
      if ((en.boss && en.alive && this.animTick % 80 === 0) || (en.kind === 'sniper' && en.alive && this.animTick % 130 === 0)) {
        // Boss or sniper fires a projectile toward the player
        const PW2 = 28;
        const bCX = en.curX + (en.size ?? 1.8) * 32 / 2;
        const bCY = en.curY + (en.size ?? 1.8) * 32 / 2;
        const pCX = this.px + PW2 / 2;
        const pCY = this.py + 20;
        const dx = pCX - bCX;
        const dy = pCY - bCY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const projMesh = (this.scene && this.bjs) ? ((): import('@babylonjs/core').Mesh | null => {
          try {
            const BJS = this.bjs!;
            const m = BJS.MeshBuilder.CreateSphere('proj_' + Date.now(),
              { diameter: 0.35, segments: 6 }, this.scene!);
            const mat = new BJS.StandardMaterial('projMat', this.scene!);
            mat.emissiveColor = en.boss
              ? new BJS.Color3(1, 0.2, 0.2)
              : new BJS.Color3(1.0, 0.85, 0.18);
            m.material = mat;
            m.position.set(
              (bCX - this.camX - GW / 2) / PX_PER_BU,
              -(bCY - GH / 2) / PX_PER_BU,
              0.5,
            );
            return m;
          } catch { return null; }
        })() : null;

        this.projectiles.push({
          x: bCX, y: bCY,
          vx: (dx / dist) * (en.boss ? PROJ_SPD : PROJ_SPD * 0.8),
          vy: (dy / dist) * (en.boss ? PROJ_SPD : PROJ_SPD * 0.8),
          life: en.boss ? PROJ_LIFE : Math.round(PROJ_LIFE * 0.65),
          mesh: projMesh,
        });
      }
    }

    // ── Projectile updates ───────────────────────────────────────────────
    for (let p = this.projectiles.length - 1; p >= 0; p--) {
      const proj = this.projectiles[p];
      proj.life--;
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Update mesh position
      if (proj.mesh) {
        proj.mesh.position.x = (proj.x - this.camX - GW / 2) / PX_PER_BU;
        proj.mesh.position.y = -(proj.y - GH / 2) / PX_PER_BU;
      }

      // Expire
      if (proj.life <= 0 || proj.y > GH + 20) {
        proj.mesh?.dispose();
        this.projectiles.splice(p, 1);
        continue;
      }

      if (proj.friendly) {
        let consumed = false;
        for (let i = 0; i < this.enemies.length; i++) {
          const en = this.enemies[i];
          if (!en.alive) continue;
          const eSize = en.boss ? Math.round((en.size ?? 1.8) * 32) : en.kind === 'spiker' ? 36 : 32;
          if (proj.x > en.curX - 12 && proj.x < en.curX + eSize + 12 &&
              proj.y > en.curY - 12 && proj.y < en.curY + eSize + 12) {
            if (en.boss) {
              en.hitsLeft--;
              this.cbs.onBossHp?.(en.hitsLeft);
              if (en.hitsLeft <= 0) {
                en.alive = false;
                this.enemyMeshes[i]?.setEnabled(false);
                this.enemyMeshes[i] = null;
                this.score += this.bossHitsMax * 300;
                this.audio.playCue('boss-hit');
                this.cbs.onScore(this.score);
                this.cbs.onComplete(this.level + 1);
              }
            } else {
              en.alive = false;
              this.enemyMeshes[i]?.setEnabled(false);
              this.enemyMeshes[i] = null;
              this.score += 250;
              this.audio.playCue('enemy-hit');
            }
            this.cbs.onScore(this.score);
            consumed = true;
            break;
          }
        }
        if (consumed) {
          proj.mesh?.dispose();
          this.projectiles.splice(p, 1);
          continue;
        }
      } else if (this.invincible === 0 &&
          proj.x > this.px - 8 && proj.x < this.px + PW + 8 &&
          proj.y > this.py - 8 && proj.y < this.py + PH + 8) {
        proj.mesh?.dispose();
        this.projectiles.splice(p, 1);
        this.absorbOrDie();
        if (this.dying) return;
      }
    }

    // ── Smooth camera follow ─────────────────────────────────────────────
    const targetCamX = this.px - GW / 3;
    const maxCamX    = this.worldW - GW;
    this.camX += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.camX) * 0.09;

    // ── Sync Babylon meshes ──────────────────────────────────────────────
    this.syncMeshes();
  }

  private emitDust() {
    if (!this.dustPS) return;
    const bx = (this.px + 14 - this.camX - GW / 2) / PX_PER_BU;
    const by = -(this.py + 40 - GH / 2) / PX_PER_BU;
    (this.dustPS.emitter as import('@babylonjs/core').Vector3).set(bx, by, 0);
    this.dustPS.manualEmitCount = 12;
  }

  private syncMeshes() {
    const toB = (lx: number, ly: number, lw = 0, lh = 0) => ({
      bx: (lx + lw / 2 - this.camX - GW / 2) / PX_PER_BU,
      by: -(ly + lh / 2 - GH / 2) / PX_PER_BU,
    });

    // Platforms
    for (let i = 0; i < this.platMeshes.length; i++) {
      const p = this.platforms[i];
      const { bx, by } = toB(p.curX, p.y, p.w, p.h);
      this.platMeshes[i].position.x = bx;
      this.platMeshes[i].position.y = by;
      this.platMeshes[i].position.z = 0;
    }

    // Coins (regular only — goal coin handled separately below)
    const coinY = Math.sin(this.animTick * 0.05) * 0.1; // bob animation
    for (let i = 0; i < this.coinMeshes.length; i++) {
      const m = this.coinMeshes[i];
      if (!m) continue;
      const c = this.coins[i];
      const { bx, by } = toB(c.x, c.y, 18, 18);
      m.position.x = bx;
      m.position.y = by + coinY;
      m.position.z = 0.2;
      m.rotation.y = this.animTick * 0.04;
    }

    // Goal star (sphere + orbiting torus ring)
    if (this.goalMesh && this.goalIdx >= 0) {
      const gc = this.coins[this.goalIdx];
      if (!gc.collected) {
        const floatY = Math.sin(this.animTick * 0.055) * 0.20;
        const pulse  = 1.0 + Math.sin(this.animTick * 0.08) * 0.12;
        const { bx, by } = toB(gc.x, gc.y, 18, 18);
        this.goalMesh.position.set(bx, by + floatY, 0.2);
        this.goalMesh.scaling.setAll(pulse);
        this.goalMesh.rotation.y = this.animTick * 0.05;
        if (this.goalRing) {
          this.goalRing.position.set(bx, by + floatY, 0.2);
          this.goalRing.rotation.y  =  this.animTick * 0.04;
          this.goalRing.rotation.x  = Math.PI / 3 + Math.sin(this.animTick * 0.025) * 0.35;
          this.goalRing.scaling.setAll(pulse);
        }
      }
    }

    // Hazards
    for (let i = 0; i < this.hazardMeshes.length; i++) {
      const mesh = this.hazardMeshes[i];
      if (!mesh) continue;
      const hz = this.hazards[i];
      const { bx, by } = toB(hz.curX, hz.curY, 18, 18);
      mesh.position.x = bx;
      mesh.position.y = by;
      mesh.position.z = 0.1;
      if (hz.type === 'spike') {
        mesh.rotation.z = Math.PI;
      } else {
        mesh.rotation.x += 0.04;
        mesh.rotation.y += 0.06;
      }
    }

    // Power-ups
    for (let i = 0; i < this.powerUpMeshes.length; i++) {
      const mesh = this.powerUpMeshes[i];
      if (!mesh) continue;
      const p = this.powerUps[i];
      if (p.collected) {
        mesh.setEnabled(false);
        continue;
      }
      const { bx, by } = toB(p.x, p.y, 18, 18);
      mesh.position.x = bx;
      mesh.position.y = by + Math.sin(this.animTick * 0.08 + i) * 0.14;
      mesh.position.z = 0.18;
      mesh.rotation.y += 0.04;
    }

    // Enemies
    for (let i = 0; i < this.enemyMeshes.length; i++) {
      const m = this.enemyMeshes[i];
      if (!m) continue;
      const en = this.enemies[i];
      const eSize = en.boss ? Math.round((en.size ?? 1.8) * 32) : 32;
      const { bx, by } = toB(en.curX, en.curY, eSize, eSize);
      m.position.x = bx;
      m.position.y = by;
      m.position.z = 0;
      if (en.boss) {
        // Boss visual: shrinks as it loses HP; pulses faster when enraged
        const hpRatio     = this.bossHitsMax > 0 ? en.hitsLeft / this.bossHitsMax : 1;
        const enraged     = hpRatio <= BOSS_ENRAGE_THRESHOLD;
        const pulseSpeed  = enraged ? 0.18 : 0.08;
        const pulse       = 1 + Math.sin(this.animTick * pulseSpeed) * 0.07;
        const healthScale = 0.70 + hpRatio * 0.30; // 1.0 full HP → 0.70 at last hit
        m.scaling.setAll(healthScale * pulse);
      } else {
        const pulse = 1 + Math.sin(this.animTick * 0.1 + i) * 0.06;
        m.scaling.setAll(pulse);
        switch (en.kind) {
          case 'flyer':
            m.rotation.z = Math.sin(this.animTick * 0.18 + i) * 0.25;
            break;
          case 'zigzag':
            m.rotation.x += 0.06;
            m.rotation.z += 0.03;
            break;
          case 'orbiter':
            m.rotation.y += 0.08;
            break;
          case 'sniper':
            m.rotation.y = this.px > en.curX ? Math.PI / 2 : -Math.PI / 2;
            break;
          case 'spiker':
            m.rotation.y += 0.02;
            break;
          case 'shadow':
            m.scaling.setAll(1.0 + Math.sin(this.animTick * 0.2) * 0.15);
            break;
          default:
            m.rotation.y = en.vx >= 0 ? 0 : Math.PI;
            break;
        }
      }
    }

    // ── MADMAXI Robot player ──────────────────────────────────────────────
    const PW = 28 * (this.giantFrames > 0 ? 1.45 : 1), PH = 40 * (this.giantFrames > 0 ? 1.45 : 1);
    const { bx: pbx, by: pby } = toB(this.px, this.py, PW, PH);
    const isMoving  = Math.abs(this.pvx) > 0.5;
    const isVisible = this.invincible === 0 || (this.animTick & 4) !== 0;
    // Walk cycle: swings arms+legs 180° out of phase
    const walkPhase  = isMoving ? this.animTick * 0.32 : 0;
    const legSwing   = isMoving ? Math.sin(walkPhase) * 0.30 : 0; // radians
    const armSwing   = isMoving ? -Math.sin(walkPhase) * 0.28 : 0;
    // Squash-stretch on body
    const giantMul = this.giantFrames > 0 ? 1.45 : 1;
    const superPulse = this.superFrames > 0 ? 1 + Math.sin(this.animTick * 0.18) * 0.08 : 1;
    const bodyScaleX = (this.onGround ? 1.12 : 0.90) * giantMul * superPulse;
    const bodyScaleY = (this.onGround ? 0.90 : 1.12) * giantMul * superPulse;

    if (this.playerMesh) {
      this.playerMesh.position.set(pbx, pby, 0);
      this.playerMesh.scaling.set(bodyScaleX, bodyScaleY, 1);
      this.playerMesh.rotation.y = this.facingR ? 0 : Math.PI;
      this.playerMesh.setEnabled(isVisible);
      const mat = this.playerMesh.material as import('@babylonjs/core').StandardMaterial | null;
      if (mat) {
        mat.emissiveColor = this.superFrames > 0
          ? new (this.bjs!.Color3)(0.55, 0.48, 0.12)
          : new (this.bjs!.Color3)(0.28, 0.20, 0.04);
      }
    }
    if (this.playerHead) {
      this.playerHead.position.set(pbx, pby + 0.52, 0);
      this.playerHead.rotation.y = this.facingR ? 0 : Math.PI;
      this.playerHead.setEnabled(isVisible);
    }
    if (this.playerVisor) {
      // Visor sits in front of head (−z is toward camera in our setup)
      const visorZ = this.facingR ? -0.20 : 0.20;
      this.playerVisor.position.set(pbx, pby + 0.52, visorZ);
      this.playerVisor.setEnabled(isVisible);
      // Pulse the visor glow when all coins collected (beacon effect)
      if (this.collectedRegularCoins >= this.totalRegularCoins && this.totalRegularCoins > 0) {
        const p = 0.9 + Math.sin(this.animTick * 0.22) * 0.2;
        this.playerVisor.scaling.setAll(p);
      } else {
        this.playerVisor.scaling.setAll(1);
      }
      const mat = this.playerVisor.material as import('@babylonjs/core').StandardMaterial | null;
      if (mat) {
        mat.emissiveColor = this.superFrames > 0
          ? new (this.bjs!.Color3)(1.0, 0.92, 0.25)
          : new (this.bjs!.Color3)(0.0, 0.5, 0.9);
      }
    }
    if (this.playerArmL) {
      this.playerArmL.position.set(pbx - 0.38, pby + 0.05, 0);
      this.playerArmL.rotation.x = armSwing;
      this.playerArmL.setEnabled(isVisible);
    }
    if (this.playerArmR) {
      this.playerArmR.position.set(pbx + 0.38, pby + 0.05, 0);
      this.playerArmR.rotation.x = -armSwing;
      this.playerArmR.setEnabled(isVisible);
    }
    if (this.playerLegL) {
      this.playerLegL.position.set(pbx - 0.14, pby - 0.54, 0);
      this.playerLegL.rotation.x = legSwing;
      this.playerLegL.setEnabled(isVisible);
    }
    if (this.playerLegR) {
      this.playerLegR.position.set(pbx + 0.14, pby - 0.54, 0);
      this.playerLegR.rotation.x = -legSwing;
      this.playerLegR.setEnabled(isVisible);
    }

    // ── Camera Y zoom when all silver coins collected ──────────────────────
    if (this.coinFlashFrames > 0) {
      this.coinFlashFrames--;
      // First 30 frames: zoom out (camera moves up by up to 3.5 BU)
      // Next 40 frames: zoom back in
      if (this.coinFlashFrames > 40) {
        this.camZoomOffset = ((70 - this.coinFlashFrames) / 30) * 3.5;
      } else {
        this.camZoomOffset = (this.coinFlashFrames / 40) * 3.5;
      }
    }

    // Parallax background plane
    if (this.bgPlane) {
      this.bgPlane.position.x = this.camX / PX_PER_BU * 0.2;
    }

    // Parallax star layers — each layer scrolls at its own rate
    const camBX = this.camX / PX_PER_BU;
    for (const { mesh, baseX, parallax } of this.bgStars) {
      mesh.position.x = baseX - camBX * parallax;
      const twinkle = 0.92 + Math.sin(this.animTick * 0.045 + baseX) * 0.12;
      mesh.scaling.setAll(twinkle);
    }
    for (const skyline of this.skylineBands) {
      skyline.mesh.position.x = skyline.baseX - camBX * skyline.parallax;
      skyline.mesh.position.y = 10 + Math.sin(this.animTick * 0.01 + skyline.pulseOffset) * 0.9;
    }

    // Camera follows player smoothly in X; zooms up on coin flash
    if (this.camMesh) {
      this.camMesh.position.x = 0;
      // Smooth cam Y toward target (normally 6 BU, zoomed out when flash active)
      const targetCamY = 5.25 + this.camZoomOffset;
      this.camMesh.position.y += (targetCamY - this.camMesh.position.y) * 0.10;
      this.camMesh.setTarget(new (this.bjs!.Vector3)(0, this.camMesh.position.y - 0.5, 0));
    }
  }

  destroy() {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    this.dustPS?.stop();
    // Clean up projectile meshes
    for (const proj of this.projectiles) proj.mesh?.dispose();
    this.projectiles = [];
    this.scene?.dispose();
    this.engine?.stopRenderLoop();
    this.engine?.dispose();
    this.audio.dispose();
    this.engine = null;
    this.scene  = null;
    this.bjs    = null;
    // Nullify robot refs (already disposed via scene.dispose)
    this.playerMesh = null;
    this.playerHead = null;
    this.playerVisor = null;
    this.playerArmL = null;
    this.playerArmR = null;
    this.playerLegL = null;
    this.playerLegR = null;
  }
}
