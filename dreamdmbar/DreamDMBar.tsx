'use client';

/**
 * DreamDMBar — Pass 3 (Window Model) — CORRECTED GOLD BUTTON SPEC
 *
 * DreamDMBar is a draggable window, not a thin rail.
 *
 * GOLD BUTTON ATTACHMENT RULE (CORRECTED):
 *   1. The Gold button is attached to the TOP of the DreamDM Bar by default
 *   2. It stays attached while the bar is visible and on screen
 *   3. It detaches ONLY when dragging the bar upward causes the button's
 *      normal attached position to go off the top of the screen
 *   4. When detached, the Gold button locks to the SCREEN/viewport (not the bar)
 *   5. It does NOT move with page scroll when screen-locked
 *   6. It does NOT detach for typing, keyboard, or compose state
 *   7. When the bar is dragged back down and the top-of-box position is back
 *      on screen, the Gold button unlocks and reattaches to the TOP of the bar
 *
 * Behaviour:
 *   - Rests at the bottom as a thick bar (BAR_H = 80 px)
 *   - Gold button attached to the top edge of the bar
 *   - Drag UP → bar expands from bottom; HomeDream content revealed above
 *   - Past threshold (bar top < 40% from screen top) → snaps to top as panel
 *   - If button's attached position goes off-screen → button screen-locks at top
 *   - Swipe DOWN on bar or gold → bar returns to bottom, gold re-attaches
 *   - All Phase-2 messaging / search / Dr. Eams capability preserved
 *
 * Architecture: drag state lives here; messaging logic in lib/dreamdm/ hooks.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Bot,
  Code2,
  Compass,
  FileText,
  Flame,
  Gamepad2,
  Home,
  Loader2,
  MessageCircle,
  Music,
  Paperclip,
  PenLine,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
  X,
  ImageIcon,
} from 'lucide-react';

import { formatRelativeTime }                    from '@/lib/utils';
import { useDreamDMMessages }                    from '@/lib/dreamdm/useDreamDMMessages';
import { useDreamDMDraft }                        from '@/lib/dreamdm/useDreamDMDraft';
import { useDreamSearch, type SearchResult }      from '@/lib/dreamdm/useDreamSearch';
import { useMessagingCore, type MediaType }       from '@/lib/dreamdm/useMessagingCore';
import { uploadBlobToLedgerStorage }              from '@/lib/media/ledger';
import { useNotifications }                       from '@/lib/dreamdm/useNotifications';
import { useDreamDMConversations,
  type DMConversation,
} from '@/lib/dreamdm/useDreamDMConversations';
import {
  calculatePointerVelocity,
  resolveGoldTapAction,
  shouldCollapseGoldSwipe,
  shouldCollapseTopExpandedDrag,
  shouldSnapBottomDragToTop,
  shouldTreatGoldReleaseAsTap,
  DEFAULT_SPLIT_RATIO,
  snapSplitRatioOnRelease,
  DIVIDER_H,
  SPLIT_RATIO_MIN,
  SPLIT_RATIO_MAX,
  ORB_SIZE as ORB_SIZE_CONST,
  ORB_TAP_SLOP as ORB_TAP_SLOP_CONST,
  computeOrbDragPosition,
  getMoodPeriod,
  MOOD_AURA_GRADIENTS,
  MOOD_EDGE_COLORS,
  SURFACE_ACCENT_COLORS,
  filterSlashCommands,
  SLASH_COMMANDS,
  computeTypingRhythm,
  rhythmToHandleScale,
  resolveStreak,
  getStreakTier,
  STREAK_STORAGE_KEY,
  QUICK_REACTIONS,
  GOLD_LONG_PRESS_MS,
  generateParticles,
  DRAG_TAP_THRESHOLD_PX,
  LIGHT_POSITION_CYCLE as _LIGHT_POSITION_CYCLE,
  type SlashCommand,
  type Particle,
  type MoodPeriod,
  type SurfaceAccent,
  type StreakData,
  type StreakTier,
} from '@/lib/dreamdm/barInteractions';
import type { DMMessage } from '@/lib/dreamdm/useDreamDMMessages';
import { useDreamBarContext, type DreamBarContext } from '@/lib/dreamdm/useDreamBarContext';
import { useDreamSystem, type BarIntentMode } from '@/lib/dreamdm/DreamSystemContext';
import DreamWord from '@/components/ui/DreamWord';
import { getPreferredViewportHeight, isCompactRuntimeViewport } from '@/lib/ui/runtimeViewport';
import { useImmersiveGameLayout } from '@/lib/games/useImmersiveGameLayout';

// ── Layout constants ─────────────────────────────────────────────────────────
/** Thick bar height when locked at the bottom */
export const BAR_H = 80;
/** Panel height when locked at the top (expanded) */
const TOP_H        = 340;
/** Compact nav-bar height when locked at the top (collapsed/nav-bar mode) */
export const NAV_H = 52;
/** Gold button diameter (full / revealed) */
const GOLD_SZ      = 60;
const GOLD_R       = GOLD_SZ / 2;
/** Gold capsule size when in minimized / idle state */
const GOLD_MIN_W   = 36;
const GOLD_MIN_H   = 8;
/** Snap to bottom when dragged down this many px from top */
const SNAP_DOWN_PX = 88;
/** Drag distance to expand compact nav bar into full panel */
const EXPAND_THRESHOLD = 80;
/** Spring animation string */
const SPRING       = '0.46s cubic-bezier(0.34,1.22,0.64,1)';
/** Minimum pointer movement (px) to switch from tap to drag on minimized orb */
const ORB_DRAG_SLOP = 6;

/**
 * GlowingLight — the ambient indicator that replaces the geometric gold button.
 *
 * Appearance: a tiny soft glow with NO hard edges, NO circle border-radius.
 * Implemented exclusively with CSS radial-gradient and box-shadow + blur.
 * The visible light is ~10px; the touch target wrapper is 44×44px (invisible).
 *
 * Props:
 *   isDragging  — glow brightens while the bar is being dragged
 *   isCollapsed — slightly larger glow when bar is collapsed (it's the only element)
 *   firstTime   — subtle pulse animation for first-time discovery
 *   tooltip     — tooltip string (shown for 1s then hidden)
 */
interface GlowingLightProps {
  isDragging?: boolean;
  isCollapsed?: boolean;
  firstTime?: boolean;
  tooltip?: string | null;
  onTouchStart?: (e: React.TouchEvent<HTMLSpanElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLSpanElement>) => void;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

function GlowingLight({
  isDragging,
  isCollapsed,
  firstTime,
  tooltip,
  onTouchStart,
  onTouchEnd,
  style,
  'aria-label': ariaLabel,
}: GlowingLightProps) {
  const glowSize = isCollapsed ? 14 : 10;
  const glowOpacity = isDragging ? 1.0 : 0.85;
  const spreadPx = isDragging ? 18 : (isCollapsed ? 14 : 10);

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? 'DreamDM light — tap to open menus'}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        // 44×44 invisible touch target
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        position: 'relative',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'none',
        flexShrink: 0,
        animation: 'sicc-gold-blue-breathe 4s ease-in-out infinite',
        ...style,
      }}
    >
      {/* The actual glow — no border-radius, no geometric shape */}
      <span
        aria-hidden
        style={{
          display: 'block',
          width: glowSize,
          height: glowSize,
          // Radial gradient fading to transparent — no hard edge
          background: `radial-gradient(ellipse at center, rgba(255,215,64,${glowOpacity}) 0%, rgba(232,184,48,${glowOpacity * 0.55}) 35%, rgba(200,152,26,${glowOpacity * 0.2}) 65%, transparent 100%)`,
          // Layered box-shadows for depth — the light effect
          boxShadow: isDragging
            ? `0 0 ${spreadPx * 2}px ${spreadPx}px rgba(255,215,64,0.85), 0 0 ${spreadPx * 4}px ${spreadPx * 2}px rgba(200,152,26,0.45), 0 0 2px rgba(255,245,180,0.90)`
            : `0 0 ${spreadPx}px ${spreadPx / 2}px rgba(255,215,64,${glowOpacity * 0.7}), 0 0 ${spreadPx * 2}px ${spreadPx}px rgba(200,152,26,0.35), 0 0 2px rgba(255,245,180,0.80)`,
          filter: `blur(${isDragging ? 1.5 : 2}px)`,
          borderRadius: '50%', // Only used to soften the box-shadow, the actual shape is defined by radial-gradient fading to transparent
          transition: 'box-shadow 0.25s ease, filter 0.25s ease, width 0.25s ease, height 0.25s ease',
          animation: firstTime ? 'sicc-gold-breathe 1.4s cubic-bezier(0.45,0.05,0.55,0.95) 3' : undefined,
        }}
      />
      {/* First-time tooltip */}
      {tooltip && (
        <span
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30,30,30,0.88)',
            color: 'rgba(255,255,255,0.92)',
            fontSize: 11,
            fontWeight: 600,
            padding: '5px 10px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            marginBottom: 6,
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}

function AvatarChip({ name, url, size = 28 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, width: size, height: size }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(42,138,184,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: size * 0.4, fontWeight: 700, color: 'var(--de-accent)',
      }}
    >
      {(name || 'U')[0].toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContextIcon — maps DreamBarContext iconHint to a Lucide icon
// ─────────────────────────────────────────────────────────────────────────────
function ContextIcon({ ctx, size }: { ctx: DreamBarContext; size: number }) {
  const props = { size, 'aria-hidden': true as const, style: { color: 'var(--de-blue)' } as React.CSSProperties };
  switch (ctx.iconHint) {
    case 'send':           return <Send          {...props} />;
    case 'pen-line':       return <PenLine       {...props} />;
    case 'code':           return <Code2         {...props} />;
    case 'bot':            return <Bot           {...props} />;
    case 'music':          return <Music         {...props} />;
    case 'search':         return <Search        {...props} />;
    case 'message-circle': return <MessageCircle {...props} />;
    case 'sparkles':
    default:               return <Sparkles      {...props} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SlashCommandIcon — maps slash command icon hints to Lucide icons
// ─────────────────────────────────────────────────────────────────────────────
function SlashCommandIcon({ icon, size }: { icon: string; size: number }) {
  const props = { size, 'aria-hidden': true as const };
  switch (icon) {
    case 'home':         return <Home        {...props} />;
    case 'gamepad-2':    return <Gamepad2    {...props} />;
    case 'music':        return <Music       {...props} />;
    case 'code-2':       return <Code2       {...props} />;
    case 'sparkles':     return <Sparkles    {...props} />;
    case 'send':         return <Send        {...props} />;
    case 'compass':      return <Compass     {...props} />;
    case 'settings':     return <Settings    {...props} />;
    case 'user':         return <User        {...props} />;
    case 'search':       return <Search      {...props} />;
    case 'bot':          return <Bot         {...props} />;
    case 'shopping-bag': return <ShoppingBag {...props} />;
    default:             return <Sparkles    {...props} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// StreakFlame — renders the dream streak flame icon with tier-appropriate style
// ─────────────────────────────────────────────────────────────────────────────
function StreakFlame({ count, tier }: { count: number; tier: StreakTier }) {
  if (tier === 'none') return null;
  const colors: Record<StreakTier, string> = {
    none: 'transparent',
    ember: '#ff9800',
    fire: '#ff5722',
    inferno: 'linear-gradient(135deg, #ff5722, #e91e63, #9c27b0, #2196f3)',
    legend: 'linear-gradient(135deg, #ffd700, #ff8c00, #ff5722, #e91e63, #9c27b0)',
  };
  const isGradient = tier === 'inferno' || tier === 'legend';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      <span
        className="sicc-flame"
        style={{
          display: 'inline-flex', fontSize: 14, lineHeight: 1,
          filter: tier === 'legend' ? 'drop-shadow(0 0 6px rgba(255,215,0,0.7))' : tier === 'inferno' ? 'drop-shadow(0 0 4px rgba(233,30,99,0.5))' : 'none',
        }}
        aria-hidden
      >
        🔥
      </span>
      <span style={{
        fontSize: 10, fontWeight: 800, lineHeight: 1,
        ...(isGradient ? {
          background: colors[tier],
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } : {
          color: colors[tier],
        }),
      }}>
        {count}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ParticleFountain — renders animated particles from gold button long-press
// ─────────────────────────────────────────────────────────────────────────────
function ParticleFountain({ particles, centerX, centerY }: { particles: Particle[]; centerX: number; centerY: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }} aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="sicc-particle"
          style={{
            left: centerX,
            top: centerY,
            width: p.size,
            height: p.size,
            background: p.color,
            '--particle-dx': `${p.vx * 40}px`,
            '--particle-dy': `${p.vy * 40}px`,
            animationDuration: `${0.8 + Math.random() * 0.6}s`,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ── Props
// ─────────────────────────────────────────────────────────────────────────────
interface DreamDMBarProps {
  /** Single-tap the gold button → open radial menus */
  onBothMenus: () => void;
  /** Double-tap the gold button (bar at bottom) → go home in Surface Space */
  onHome: () => void;
  /** Double-tap the gold button (bar at top) → open HomeDream in DreamSpace (dual-home) */
  onHomeDreamSpace?: () => void;
  /** Bridge bar state to the dual-runtime host */
  onRuntimeModeChange?: (mode: 'home' | 'blend' | 'dreamspace') => void;
  /** 0..1 blend for dragging second runtime from off-screen */
  onRuntimeBlendChange?: (value: number) => void;
  /**
   * Reports the safe-area insets the runtime regions should reserve so that
   * content never hides behind the bar.
   *   top:    pixels to inset from the top of the viewport (bar is at the top)
   *   bottom: pixels to inset from the bottom of the viewport (bar is at the bottom)
   */
  onBarInsets?: (top: number, bottom: number) => void;
  /**
   * Split-screen divider mode.
   *
   * When provided, the bar operates as a persistent spatial divider between
   * Surface Space (top) and DreamSpace (bottom).
   *
   *   0.0 = DreamSpace fills the entire viewport (Surface collapsed)
   *   0.5 = 50 / 50 balanced split
   *   1.0 = Surface Space fills the entire viewport (DreamSpace collapsed)
   *
   * Default snap positions: 0.9 (Surface focus), 0.5 (balanced), 0.1 (Dream focus).
   */
  splitRatio?: number;
  /** Called continuously while the user drags the divider. Emits the new 0..1 ratio. */
  onSplitChange?: (ratio: number) => void;
  /** Reports whether the DreamDM Bar is hidden so the host can hide DreamSpace with it. */
  onMinimizedChange?: (isMinimized: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function DreamDMBar({ onHome, onBothMenus, onHomeDreamSpace, onRuntimeModeChange, onRuntimeBlendChange, onBarInsets, splitRatio, onSplitChange, onMinimizedChange }: DreamDMBarProps) {
  const isGameImmersive = useImmersiveGameLayout();
  /** Gold button diameter — shrinks when a game overlay is active so it stays out of the way */
  const goldSz = isGameImmersive ? 36 : GOLD_SZ;
  const goldR  = goldSz / 2;
  // ── Screen geometry + keyboard tracking ───────────────────────────────────
  const [screenH, setScreenH] = useState(900);
  const [screenW, setScreenW] = useState(1440);
  /** px the keyboard pushes the visual viewport up from the bottom (0 when hidden) */
  const [keyboardOffsetPx, setKeyboardOffsetPx] = useState(0);
  useEffect(() => {
    const update = () => {
      const innerH = window.innerHeight;
      const vvH    = window.visualViewport?.height ?? innerH;
      const vvOff  = window.visualViewport?.offsetTop ?? 0;
      setScreenH(getPreferredViewportHeight(innerH, vvH));
      setScreenW(window.visualViewport?.width ?? window.innerWidth);
      // Keyboard offset = layout height minus (visual height + viewport scrolled-up amount)
      const kbOffset = Math.max(0, innerH - vvH - vvOff);
      setKeyboardOffsetPx(kbOffset);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  // ── Window position state ──────────────────────────────────────────────────
  /** Whether bar is snapped to top (nav-bar or panel mode) */
  const [isTop,         setIsTop]         = useState(false);
  /**
   * Whether the top-locked bar is in full-panel mode.
   * false = compact nav-bar (NAV_H); true = expanded panel (TOP_H).
   */
  const [isTopExpanded, setIsTopExpanded] = useState(false);
  /** Current bar height while dragging from bottom (px). Rests at BAR_H. */
  const [dragH,    setDragH]    = useState(BAR_H);
  /** How far bar has slid down from the top during a top-expanded→bottom drag (px) */
  const [slideDown, setSlideDown] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // ── Light tap state machine ───────────────────────────────────────────────
  // Whole-bar touch drag: startY, startTarget, didDrag, tapCount, tapTimer
  const barTouchRef = useRef<{
    active: boolean;
    startY: number;
    startTarget: EventTarget | null;
    didDrag: boolean;
    lastTapAt: number;
    tapTimer: ReturnType<typeof setTimeout> | null;
    textareaFocused: boolean;
    touchStartedInTextarea: boolean;
  }>({
    active: false, startY: 0, startTarget: null, didDrag: false,
    lastTapAt: 0, tapTimer: null, textareaFocused: false, touchStartedInTextarea: false,
  });

  // ── First-time discovery ─────────────────────────────────────────────────
  const [firstTimeLight, setFirstTimeLight] = useState(false);
  const [lightTooltip, setLightTooltip] = useState<string | null>(null);
  const lightTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Minimized / collapsed state ───────────────────────────────────────────
  /**
   * When minimized, the bar disappears and a gold glowing orb appears.
   * Tap the orb to restore the bar. Drag it to reposition out of the way.
   */
  const [isMinimized, setIsMinimized] = useState(false);
  const [minOrbPos, setMinOrbPos] = useState<{ x: number; y: number } | null>(null);
  const minOrbDragRef = useRef<{ active: boolean; startX: number; startY: number; startPosX: number; startPosY: number; moved: boolean } | null>(null);

  useEffect(() => {
    onMinimizedChange?.(isMinimized);
  }, [isMinimized, onMinimizedChange]);

  // ── Minimized orb position + drag (refs/state only — callbacks after revealBar) ──
  /** Position of the minimized orb (CSS right/bottom offsets from viewport edges) */
  const [orbPos, setOrbPos] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const orbDragRef = useRef({ active: false, startX: 0, startY: 0, startOrbX: 0, startOrbY: 0, moved: false });
  const ORB_SIZE = ORB_SIZE_CONST;
  const ORB_TAP_SLOP = ORB_TAP_SLOP_CONST;

  // ── Touch-reveal transparency ─────────────────────────────────────────────
  /**
   * The bar is fully transparent when not in use. It becomes opaque when the
   * user touches it and fades back after 3 seconds of inactivity.
   */
  const [barTouched, setBarTouched] = useState(false);
  const barTouchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealBar = useCallback(() => {
    setBarTouched(true);
    if (barTouchTimerRef.current) clearTimeout(barTouchTimerRef.current);
    barTouchTimerRef.current = setTimeout(() => { setBarTouched(false); }, 3000);
  }, []);

  // ── 🌈 Mood Aura System ──────────────────────────────────────────────────
  const [moodPeriod, setMoodPeriod] = useState<MoodPeriod>(() => getMoodPeriod(new Date().getHours()));
  useEffect(() => {
    const updateMood = () => setMoodPeriod(getMoodPeriod(new Date().getHours()));
    // Check every 5 minutes for time-of-day shift
    const interval = setInterval(updateMood, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── ⌨️ Slash Command Palette ──────────────────────────────────────────────
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashSelectedIdx, setSlashSelectedIdx] = useState(0);
  const slashResults = slashOpen ? filterSlashCommands(slashQuery) : [];
  const router = useRouter();

  // ── 🎹 Typing Rhythm Visualizer ──────────────────────────────────────────
  const keystrokeTimesRef = useRef<number[]>([]);
  const [typingRhythm, setTypingRhythm] = useState(0);

  const recordKeystroke = useCallback(() => {
    const now = Date.now();
    keystrokeTimesRef.current.push(now);
    // Keep only last 20 keystrokes
    if (keystrokeTimesRef.current.length > 20) {
      keystrokeTimesRef.current = keystrokeTimesRef.current.slice(-20);
    }
    setTypingRhythm(computeTypingRhythm(keystrokeTimesRef.current, now));
  }, []);

  // Decay rhythm when idle
  useEffect(() => {
    if (typingRhythm <= 0) return;
    const decay = setInterval(() => {
      const now = Date.now();
      const newRhythm = computeTypingRhythm(keystrokeTimesRef.current, now);
      setTypingRhythm(newRhythm);
      if (newRhythm <= 0) clearInterval(decay);
    }, 300);
    return () => clearInterval(decay);
  }, [typingRhythm]);

  // ── 🔥 Dream Streak Counter ──────────────────────────────────────────────
  const [streakData, setStreakData] = useState<StreakData>({ count: 0, lastActiveDate: '' });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STREAK_STORAGE_KEY);
      const stored: StreakData | null = raw ? JSON.parse(raw) : null;
      const updated = resolveStreak(stored);
      setStreakData(updated);
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }, []);
  const streakTier = getStreakTier(streakData.count);

  // ── ✨ Gold Button Long-Press Particle Fountain ───────────────────────────
  const [particles, setParticles] = useState<Particle[]>([]);

  // ── Minimized orb drag callbacks (must be after revealBar) ──────────────
  const handleOrbPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    orbDragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startOrbX: orbPos.x,
      startOrbY: orbPos.y,
      moved: false,
    };
  }, [orbPos]);

  const handleOrbPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!orbDragRef.current.active) return;
    const dx = e.clientX - orbDragRef.current.startX;
    const dy = e.clientY - orbDragRef.current.startY;
    if (!orbDragRef.current.moved && Math.abs(dx) < ORB_TAP_SLOP && Math.abs(dy) < ORB_TAP_SLOP) return;
    orbDragRef.current.moved = true;
    setOrbPos(computeOrbDragPosition(orbDragRef.current.startOrbX, orbDragRef.current.startOrbY, dx, dy, screenW, screenH));
  }, [screenW, screenH]);

  const handleOrbPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!orbDragRef.current.active) return;
    const wasDrag = orbDragRef.current.moved;
    orbDragRef.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!wasDrag) {
      // Tap — restore bar at the bottom
      setIsMinimized(false);
      setIsTop(false); setIsTopExpanded(false); setDragH(BAR_H); setSlideDown(0);
      revealBar();
    }
  }, [revealBar]);

  const dragRef = useRef({
    active: false, startY: 0,
    startH: BAR_H, startSlide: 0,
    fromTop: false,
    fromTopExpanded: false,
    lastY: 0,
    lastAt: 0,
    velocity: 0,
  });

  const minimizeDreamDMBar = useCallback(() => {
    setIsMinimized(true);
    setIsTop(false);
    setIsTopExpanded(false);
    setDragH(BAR_H);
    setSlideDown(0);
    // NOTE: intentionally do NOT reset splitRatio — runtimes preserve their layout
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    revealBar();
    const now = performance.now();
    dragRef.current = {
      active: true, startY: e.clientY,
      startH: dragH, startSlide: slideDown,
      fromTop: isTop,
      fromTopExpanded: isTop && isTopExpanded,
      lastY: e.clientY,
      lastAt: now,
      velocity: 0,
    };
    setIsDragging(true);
  }, [revealBar, dragH, isTop, isTopExpanded, slideDown]);

  const handleDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const now = performance.now();
    dragRef.current.velocity = calculatePointerVelocity(dragRef.current.lastY, e.clientY, dragRef.current.lastAt, now);
    dragRef.current.lastY = e.clientY;
    dragRef.current.lastAt = now;
    const dy = e.clientY - dragRef.current.startY; // positive = dragging DOWN

    if (!dragRef.current.fromTop) {
      // Expanding from bottom: dragging UP increases bar height
      const newH = Math.max(BAR_H, Math.min(screenH * 0.85, dragRef.current.startH - dy));
      setDragH(newH);
    } else if (!dragRef.current.fromTopExpanded) {
      // Top-compact → dragging DOWN expands the panel downward (grow height)
      const newH = Math.max(NAV_H, Math.min(TOP_H, dragRef.current.startH + dy));
      setDragH(newH);
    } else {
      // Top-expanded → dragging DOWN slides the bar away from the top edge
      const newSlide = Math.max(0, Math.min(screenH * 0.5, dragRef.current.startSlide + dy));
      setSlideDown(newSlide);
    }
  }, [screenH]);

  const handleDragEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const now = performance.now();
    const releaseVelocity = calculatePointerVelocity(dragRef.current.lastY, e.clientY, dragRef.current.lastAt, now);
    // If the release lands without a usable fresh sample, keep the last measured move velocity.
    const velocity = Number.isFinite(releaseVelocity)
      ? releaseVelocity
      : dragRef.current.velocity;
    dragRef.current.active = false;
    setIsDragging(false);

    if (!dragRef.current.fromTop) {
      // Expanding from bottom: snap to top if reached near top OR flung up fast.
      // Otherwise snap back to the default bottom height (no arbitrary in-between).
      if (shouldSnapBottomDragToTop({ screenH, dragH, barH: BAR_H, velocityPxPerMs: velocity })) {
        setIsTop(true); setIsTopExpanded(false); setDragH(NAV_H); setSlideDown(0);
      } else {
        // Snap back to bottom — no in-between positions allowed
        setDragH(BAR_H);
      }
    } else if (!dragRef.current.fromTopExpanded) {
      // Top-compact: decide whether to expand to full panel or snap back to compact
      const dy = e.clientY - dragRef.current.startY;
      if (dy > EXPAND_THRESHOLD || dragH > NAV_H + EXPAND_THRESHOLD) {
        setIsTopExpanded(true); setDragH(BAR_H); setSlideDown(0);
      } else {
        setDragH(NAV_H); // snap back to compact nav-bar
      }
    } else {
      // Top-expanded: decide whether to collapse to bottom or spring back to panel
      const dy = e.clientY - dragRef.current.startY;
      if (shouldCollapseTopExpandedDrag({
        dy,
        slideDown,
        snapDownPx: SNAP_DOWN_PX,
        velocityPxPerMs: velocity,
      })) {
        setIsTop(false); setIsTopExpanded(false); setDragH(BAR_H); setSlideDown(0);
      } else {
        setSlideDown(0); // spring back to expanded panel
      }
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, [dragH, screenH, slideDown]);

  // ── Divider drag — split-screen mode (splitRatio prop) ───────────────────
  // When onSplitChange is provided, the bar operates as a true spatial divider.
  // Dragging the handle resizes both regions in real time; releasing snaps to
  // the closest of the three canonical split points (0.1 / 0.5 / 0.9).
  const dividerDragRef = useRef({ active: false, lastY: 0, lastAt: 0, velocity: 0 });

  const handleDividerDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!onSplitChange) return;
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    dividerDragRef.current = { active: true, lastY: e.clientY, lastAt: now, velocity: 0 };
    setIsDragging(true);
  }, [onSplitChange]);

  const handleDividerDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dividerDragRef.current.active || !onSplitChange) return;
    const now = performance.now();
    dividerDragRef.current.velocity = calculatePointerVelocity(
      dividerDragRef.current.lastY, e.clientY, dividerDragRef.current.lastAt, now,
    );
    dividerDragRef.current.lastY = e.clientY;
    dividerDragRef.current.lastAt = now;
    // Bar top = clientY - DIVIDER_H/2 so the grab point stays under the pointer.
    const availH = screenH - DIVIDER_H;
    const newRatio = availH > 0
      ? Math.max(SPLIT_RATIO_MIN, Math.min(SPLIT_RATIO_MAX, (e.clientY - DIVIDER_H / 2) / availH))
      : (splitRatio ?? 0.9);
    onSplitChange(newRatio);
  }, [onSplitChange, screenH, splitRatio]);

  const handleDividerDragEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dividerDragRef.current.active || !onSplitChange) return;
    const now = performance.now();
    const vel = calculatePointerVelocity(
      dividerDragRef.current.lastY, e.clientY, dividerDragRef.current.lastAt, now,
    );
    const velocity = Number.isFinite(vel) ? vel : dividerDragRef.current.velocity;
    dividerDragRef.current.active = false;
    setIsDragging(false);
    const availH = screenH - DIVIDER_H;
    const rawRatio = availH > 0
      ? Math.max(SPLIT_RATIO_MIN, Math.min(SPLIT_RATIO_MAX, (e.clientY - DIVIDER_H / 2) / availH))
      : (splitRatio ?? 0.9);
    onSplitChange(snapSplitRatioOnRelease(rawRatio, velocity));
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, [onSplitChange, screenH, splitRatio]);

  // ── Dream bar context (route-aware + intent-aware) ──────────────────────────
  const { barIntent, setBarIntent, clearBarIntent } = useDreamSystem();
  const barCtx = useDreamBarContext(barIntent.mode, barIntent.targetLabel);

  // ── Messaging state ────────────────────────────────────────────────────────
  const [mounted,        setMounted]        = useState(false);
  const [composeFocused, setComposeFocused] = useState(false);

  // ── First-time light discovery useEffect ─────────────────────────────────
  useEffect(() => {
    try {
      if (!localStorage.getItem('de-light-discovered')) {
        setFirstTimeLight(true);
        setLightTooltip('drag to move, tap to open');
        localStorage.setItem('de-light-discovered', '1');
        lightTooltipTimerRef.current = setTimeout(() => {
          setLightTooltip(null);
          setFirstTimeLight(false);
        }, 3000);
      }
    } catch { /* ignore */ }
    return () => {
      if (lightTooltipTimerRef.current) clearTimeout(lightTooltipTimerRef.current);
    };
  }, []);

  // ── Whole-bar touch drag system ──────────────────────────────────────────
  // The entire bar surface is draggable.
  // Exception: when textarea is focused AND touch started inside the textarea.

  const handleBarTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    revealBar();
    const touch = e.touches[0];
    if (!touch) return;
    const target = e.target as HTMLElement;
    const isInTextarea = target.tagName === 'TEXTAREA' || target.closest('textarea') !== null;
    const ref = barTouchRef.current;
    ref.active = true;
    ref.startY = touch.clientY;
    ref.startTarget = e.target;
    ref.didDrag = false;
    ref.textareaFocused = composeFocused;
    ref.touchStartedInTextarea = isInTextarea;
  }, [revealBar, composeFocused]);

  const handleBarTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const ref = barTouchRef.current;
    if (!ref.active) return;
    // Block drag if user started touch inside focused textarea
    if (ref.textareaFocused && ref.touchStartedInTextarea) return;

    const touch = e.touches[0];
    if (!touch) return;
    const dy = touch.clientY - ref.startY;
    if (Math.abs(dy) >= DRAG_TAP_THRESHOLD_PX) {
      ref.didDrag = true;
    }
    if (!ref.didDrag) return;

    // Prevent page scroll while dragging bar
    e.preventDefault();

    // Compute new drag height from touch position (bar grows up from bottom)
    const newDragH = Math.max(BAR_H, Math.min(screenH * 0.85, screenH - touch.clientY + BAR_H / 2));
    setDragH(newDragH);
    setIsTop(false);
    setIsTopExpanded(false);
    setSlideDown(0);
    setIsDragging(true);
  }, [composeFocused, screenH]);

  const handleBarTouchEnd = useCallback((_e: React.TouchEvent<HTMLDivElement>) => {
    const ref = barTouchRef.current;
    if (!ref.active) return;
    ref.active = false;
    setIsDragging(false);

    if (ref.didDrag) {
      // Snap to bottom
      setDragH(BAR_H);
      return;
    }

    // It was a tap — the light's touch handlers manage tap/double-tap separately
  }, []);

  // ── Glowing light tap actions ─────────────────────────────────────────────
  const handleLightSingleTap = useCallback(() => {
    // Single tap → open dual menus immediately (no double-tap delay)
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(4);
    onBothMenus();
  }, [onBothMenus]);

  const handleLightTouchStart = useCallback((_e: React.TouchEvent<HTMLSpanElement>) => {
    // resolved on touchend
  }, []);

  const handleLightTouchEnd = useCallback((e: React.TouchEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    const ref = barTouchRef.current;
    // If bar drag was active, don't fire tap
    if (ref.didDrag) return;
    handleLightSingleTap();
  }, [handleLightSingleTap]);
  const [userId,         setUserId]         = useState('');
  const [selectedConv,   setSelectedConv]   = useState<DMConversation | null>(null);
  const [quickDraft,     setQuickDraft]     = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [quickDraftFiles, setQuickDraftFiles] = useState<File[]>([]);
  const [quickDraftPreviews, setQuickDraftPreviews] = useState<string[]>([]);
  const [lightboxUrl,    setLightboxUrl]    = useState<string | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Measured height of a single empty line — captured on first resize
  const singleLineHRef = useRef(0);
  // Extra height the compose bubble adds above the fixed bar (divider mode only)
  const [composeExtraH, setComposeExtraH] = useState(0);

  const { conversations, reload: reloadConvs } = useDreamDMConversations(userId);
  const { unreadCount, markAllRead }            = useNotifications();

  const { messages, isLoading: msgsLoading, addOptimistic, replaceOptimistic, removeOptimistic } =
    useDreamDMMessages(selectedConv?.id ?? null, false, []);

  const { draft, saveDraft, clearDraft, draftRestored } =
    useDreamDMDraft(selectedConv?.id ?? null);

  const [messageBody,    setMessageBody]    = useState('');
  const [selectedFile,   setSelectedFile]   = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgsEndRef   = useRef<HTMLDivElement>(null);

  const { isSending, sendError, validateFile, getFileType, sendMessage, clearSendError } =
    useMessagingCore(addOptimistic, replaceOptimistic, removeOptimistic);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch,  setShowSearch]  = useState(false);
  const { results: searchResults, isSearching, drEamsMode, toggleDrEams, clearResults } =
    useDreamSearch(searchQuery);

  // Restore draft on conversation change
  useEffect(() => {
    setMessageBody(draft?.body ?? '');
   
  }, [selectedConv?.id]);

  // Scroll to bottom
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Resolve userId
  useEffect(() => {
    setMounted(true);
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
        if (data.user) { setUserId(data.user.id); reloadConvs(); }
      });
    });
   
  }, []);

  // ── Quick file handlers ────────────────────────────────────────────────────
  const handleQuickFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.slice(0, 5 - quickDraftFiles.length);

    if (newFiles.length === 0) return;

    // Create previews
    const newPreviews: string[] = [];
    newFiles.forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        newPreviews.push(URL.createObjectURL(file));
      }
    });

    setQuickDraftFiles(prev => [...prev, ...newFiles]);
    setQuickDraftPreviews(prev => [...prev, ...newPreviews]);

    // Auto-expand the bar when files are attached so user can see the thumbnail
    if (typeof splitRatio !== 'number' || typeof onSplitChange !== 'function') {
      const expandH = Math.min(screenH * 0.55, Math.max(BAR_H, 280));
      setDragH(expandH);
      setIsTop(false);
      setIsTopExpanded(false);
      setSlideDown(0);
    }

    // Reset input
    if (quickFileInputRef.current) quickFileInputRef.current.value = '';
  }, [quickDraftFiles.length, splitRatio, onSplitChange, screenH]);

  const handleRemoveQuickFile = useCallback((index: number) => {
    setQuickDraftFiles(prev => prev.filter((_, i) => i !== index));
    setQuickDraftPreviews(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Revoke the URL to free memory
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return updated;
    });
  }, []);

  // Auto-resize textarea — bubble expansion
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    // Allow up to 240px (~8 lines) — much more room than the old 120px cap
    const newHeight = Math.min(textarea.scrollHeight, 240);
    textarea.style.height = `${newHeight}px`;

    // Capture the single-line height the first time (when textarea is empty or one line)
    if (singleLineHRef.current === 0 || quickDraft === '') {
      singleLineHRef.current = newHeight;
    }
    const baseline = singleLineHRef.current || newHeight;
    setComposeExtraH(Math.max(0, newHeight - baseline));
  }, [quickDraft]);

  // ── Send handlers ──────────────────────────────────────────────────────────
  const handleQuickSend = useCallback(async () => {
    const text = quickDraft.trim();
    if (!text && quickDraftFiles.length === 0) return;

    // ── Intent-mode overrides take priority over surface detection ──────────
    if (barIntent.mode === 'comment' && barIntent.targetPostId) {
      setCommentSending(true);
      try {
        // Upload any attached media files first
        const mediaUrls: string[] = [];
        if (quickDraftFiles.length > 0) {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          for (const file of quickDraftFiles) {
            const bucket = file.type.startsWith('image/') ? 'images'
                         : file.type.startsWith('video/') ? 'videos'
                         : 'files';
            const ext = file.name.split('.').pop();
            const filename = `${userId}/comments/${Date.now()}-${crypto.randomUUID()}.${ext}.ledger`;
            try {
              const upload = await uploadBlobToLedgerStorage(supabase, {
                bucket,
                storagePath: filename,
                blob: file,
                fileName: file.name,
                mimeType: file.type,
              });
              mediaUrls.push(upload.mediaUrl);
            } catch (uploadError) {
              console.error('[DreamBar] Comment media upload failed:', uploadError);
              alert(`Comment media upload failed for ${file.name}. Please try again.`);
            }
          }
        }
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: barIntent.targetPostId, content: text, media_urls: mediaUrls }),
        });
        if (res.ok) {
          setQuickDraft('');
          quickDraftPreviews.forEach(url => URL.revokeObjectURL(url));
          setQuickDraftFiles([]);
          setQuickDraftPreviews([]);
          clearBarIntent();
        } else {
          const { error } = await res.json().catch(() => ({})) as { error?: string };
          console.error('[DreamBar] Comment failed:', error ?? 'Unknown error');
        }
      } catch (err) {
        console.error('[DreamBar] Network error posting comment:', err);
      } finally {
        setCommentSending(false);
      }
      return;
    }

    if (barIntent.mode === 'search') {
      setSearchQuery(text);
      setShowSearch(true);
      return;
    }

    if (barIntent.mode === 'message') {
      if (selectedConv) {
        await sendMessage({ conversationId: selectedConv.id, recipientId: selectedConv.otherUser.id, content: text, userId });
        clearDraft(selectedConv.id);
      } else {
        window.location.href = `/messages?compose=${encodeURIComponent(text)}`;
      }
      setQuickDraft('');
      return;
    }

    if (barIntent.mode === 'dreams') {
      toggleDrEams();
      setQuickDraft('');
      return;
    }

    // ── Surface-detected defaults (barIntent.mode === 'default') ───────────

    // Messages surface: send as DM (existing behaviour)
    if (barCtx.surface === 'messages') {
      if (selectedConv) {
        await sendMessage({ conversationId: selectedConv.id, recipientId: selectedConv.otherUser.id, content: text, userId });
        clearDraft(selectedConv.id);
      } else {
        window.location.href = `/messages?compose=${encodeURIComponent(text)}`;
      }
      setQuickDraft('');
      return;
    }

    // Feed / home surface: create a post via POST /api/posts
    if (barCtx.surface === 'feed') {
      try {
        // Upload media files if any
        const mediaUrls: string[] = [];
        if (quickDraftFiles.length > 0) {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          for (const file of quickDraftFiles) {
            const bucket = file.type.startsWith('image/') ? 'images'
                         : file.type.startsWith('video/') ? 'videos'
                         : 'files';
            const ext = file.name.split('.').pop();
            const filename = `${userId}/posts/${Date.now()}-${crypto.randomUUID()}.${ext}.ledger`;

            try {
              const upload = await uploadBlobToLedgerStorage(supabase, {
                bucket,
                storagePath: filename,
                blob: file,
                fileName: file.name,
                mimeType: file.type,
              });
              mediaUrls.push(upload.mediaUrl);
            } catch (uploadError) {
              console.error('[DreamBar] Feed media upload failed:', uploadError);
              alert(`Post media upload failed for ${file.name}. Please try again.`);
            }
          }
        }

        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: text || '',
            visibility: 'public',
            media_urls: mediaUrls
          }),
        });
        if (res.ok) {
          setQuickDraft('');
          // Clean up files and previews
          quickDraftPreviews.forEach(url => URL.revokeObjectURL(url));
          setQuickDraftFiles([]);
          setQuickDraftPreviews([]);
        } else {
          const { error } = await res.json().catch(() => ({})) as { error?: string };
          console.error('[DreamBar] Post creation failed:', error ?? 'Unknown error', '— opening full composer');
          window.location.href = `/daydream/create?content=${encodeURIComponent(text)}`;
        }
      } catch (err) {
        console.error('[DreamBar] Network error creating post:', err, '— opening full composer');
        window.location.href = `/daydream/create?content=${encodeURIComponent(text)}`;
      }
      return;
    }

    // Code surface: open Code Daydream (v2 canonical route)
    if (barCtx.surface === 'code') {
      window.location.href = `/daydream/code`;
      setQuickDraft('');
      return;
    }

    // Dreams / Dr. Eams surface: open Dr. Eams chat panel (v2 — stays in HomeDream)
    if (barCtx.surface === 'dreams') {
      toggleDrEams();
      setQuickDraft('');
      return;
    }

    // Music surface: open Music Daydream (v2 canonical route)
    if (barCtx.surface === 'music') {
      window.location.href = `/daydream/music`;
      setQuickDraft('');
      return;
    }

    // Create surface: open content composer
    if (barCtx.surface === 'create') {
      window.location.href = `/daydream/create?content=${encodeURIComponent(text)}`;
      setQuickDraft('');
      return;
    }

    // Discover / search surface
    if (barCtx.surface === 'discover') {
      window.location.href = `/discover?q=${encodeURIComponent(text)}`;
      setQuickDraft('');
      return;
    }

    // General / fallback: compose a message
    window.location.href = `/messages?compose=${encodeURIComponent(text)}`;
    setQuickDraft('');
  }, [quickDraft, quickDraftFiles, quickDraftPreviews, selectedConv, sendMessage, clearDraft, userId, barCtx.surface, barIntent, clearBarIntent, toggleDrEams]);

  const handlePanelSend = useCallback(async () => {
    if (!selectedConv) return;
    const result = await sendMessage({
      conversationId: selectedConv.id, recipientId: selectedConv.otherUser.id,
      content: messageBody.trim(), file: selectedFile, userId,
    });
    if (result) {
      clearDraft(selectedConv.id);
      setMessageBody('');
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setSelectedFile(null);
      setFilePreviewUrl(null);
    }
  }, [selectedConv, sendMessage, messageBody, selectedFile, filePreviewUrl, clearDraft, userId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { alert(err); return; }
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const removeFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null); setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    setSearchQuery(''); clearResults(); setShowSearch(false);
    if (result.type === 'conversation' && result.targetId) {
      const conv = conversations.find((c) => c.id === result.targetId);
      if (conv) { setSelectedConv(conv); markAllRead(); }
      else window.location.href = result.href ?? '/messages';
    } else if (result.type === 'person' && result.targetId) {
      window.location.href = `/messages/new?recipient=${result.targetId}`;
    } else if (result.href) {
      window.location.href = result.href;
    }
  }, [conversations, clearResults, markAllRead]);

  useEffect(() => {
    if (!onRuntimeModeChange) return;
    if (isTop) {
      onRuntimeModeChange('dreamspace');
      return;
    }
    if (dragH <= BAR_H + 6) {
      onRuntimeModeChange('home');
      return;
    }
    onRuntimeModeChange('blend');
  }, [dragH, isTop, onRuntimeModeChange]);

  useEffect(() => {
    if (!onRuntimeBlendChange) return;
    if (isTop && isTopExpanded) {
      onRuntimeBlendChange(1);
      return;
    }
    if (isTop && !isTopExpanded) {
      // Compact nav-bar at top: blend proportional to how far the user is dragging it open
      const maxExpand = TOP_H - NAV_H;
      const expand = Math.max(0, dragH - NAV_H);
      const blend = maxExpand > 0 ? Math.max(0, Math.min(1, expand / maxExpand)) : 0;
      onRuntimeBlendChange(blend);
      return;
    }
    const maxDrag = (screenH * 0.85) - BAR_H;
    const raw = maxDrag > 0 ? (dragH - BAR_H) / maxDrag : 0;
    const blend = Math.max(0, Math.min(1, raw));
    onRuntimeBlendChange(blend);
  }, [dragH, isTop, isTopExpanded, onRuntimeBlendChange, screenH]);

  // ── Bar insets — tell the runtime regions how much space the bar occupies ──
  // top:    runtime content must not start until this many px from the screen top
  // bottom: runtime content must not extend past this many px from the screen bottom
  useEffect(() => {
    if (!onBarInsets) return;
    if (isTop) {
      // Bar is at the top; bottom of bar = slideDown (offset) + barH
      const barH = isTopExpanded ? TOP_H : dragH;
      const barTop = isTopExpanded ? slideDown : 0;
      onBarInsets(barTop + barH, 0);
    } else {
      // Bar is at the bottom; inset = current bar height (dragH, rests at BAR_H)
      onBarInsets(0, dragH);
    }
  }, [isTop, isTopExpanded, dragH, slideDown, onBarInsets]);

  if (!mounted) return null;

  // ── Derived layout values ─────────────────────────────────────────────────
  const transition = isDragging ? 'none' : SPRING;

  // ── Divider mode: bar is a fixed-height spatial seam driven by splitRatio ──
  const isDividerMode = typeof splitRatio === 'number' && typeof onSplitChange === 'function';
  const dividerBarTop: number = isDividerMode
    ? Math.round((splitRatio as number) * (screenH - DIVIDER_H))
    : 0;

  // Bar geometry (legacy window mode)
  // - Bottom mode:       grows upward from the screen bottom (dragH)
  // - Top-compact mode:  thin nav bar at top (NAV_H), drag handle below
  // - Top-expanded mode: full panel at top (TOP_H), can slide away from top
  //
  // In divider mode, the bar grows upward into Surface Space as the user types
  // (composeExtraH > 0), keeping the divider line anchored at its split position.
  const barH: number    = isDividerMode
    ? DIVIDER_H + composeExtraH
    : (isTop ? (isTopExpanded ? TOP_H : dragH) : dragH);
  const barTop: number  = isDividerMode
    ? dividerBarTop - composeExtraH
    : (isTop ? (isTopExpanded ? slideDown : 0) : (screenH - dragH));

  // showFull: whether to render the expanded tab panel instead of the compact bar
  const showFull: boolean = !isDividerMode && (isTopExpanded || dragH > 180);

  // Gold button geometry:
  // - Divider mode: gold sits centered on the divider bar (vertically centered)
  // - Bottom mode: gold sits on the BAR's top edge  (center = barTop)
  // - Top modes:   gold hangs from the BAR's bottom edge (center = barTop + barH)
  const attachedGoldTop: number = isDividerMode
    ? (barTop + DIVIDER_H / 2 - goldR)  // centered on the divider
    : (isTop
      ? (barTop + barH - goldR)  // bottom edge of the top bar / panel
      : (barTop - goldR));       // top edge of the bottom bar
  const isGoldOffScreen: boolean = !isDividerMode && !isTop && (barTop - goldR < 0);
  const goldTopPx: number = isGoldOffScreen ? 10 : attachedGoldTop;

  // Track if button is in screen-locked mode (for styling/behavior)
  const isScreenLocked: boolean = isGoldOffScreen;
  const isCompactViewport = isCompactRuntimeViewport(screenW);

  // ── Minimized-mode geometry ───────────────────────────────────────────────
  // When minimized, the capsule is centered on the same Y axis as the full button
  // but only GOLD_MIN_H tall and GOLD_MIN_W wide (a subtle gold pill indicator).
  // The "top" for the capsule should align its center with goldTopPx + goldR.
  const goldCenterY = goldTopPx + goldR;
  const minCapsuleTop = goldCenterY - GOLD_MIN_H / 2;

  // ── Resting state: bar is fully transparent until touched ────────────────
  // Bar is "resting" when: at bottom (not top), not dragging, not composeFocused,
  // at default height (BAR_H), not in divider mode, and no active intent,
  // and the user has not recently touched it.
  const isResting = !isDividerMode && !isTop && !isDragging && !composeFocused
    && dragH <= BAR_H && barIntent.mode === 'default' && !barTouched;

  // ── Keyboard-aware bottom offset ─────────────────────────────────────────
  // When the user is composing and the keyboard is visible, translate the bar
  // upward so it floats just above the keyboard instead of being hidden behind it.
  const keyboardTranslateY = composeFocused && keyboardOffsetPx > 0
    ? -keyboardOffsetPx
    : 0;

  // ── Mood aura + surface accent derived values ─────────────────────────────
  const moodAuraGradient = MOOD_AURA_GRADIENTS[moodPeriod];
  const moodEdgeColor = MOOD_EDGE_COLORS[moodPeriod];
  const surfaceAccent = SURFACE_ACCENT_COLORS[(barCtx.surface as SurfaceAccent)] ?? SURFACE_ACCENT_COLORS.general;
  const handleScale = rhythmToHandleScale(typingRhythm);

  // ── Render ────────────────────────────────────────────────────────────────

  // ── Minimized state: draggable glowing light ─────────────────────────────
  if (isMinimized) {
    const posStyle: React.CSSProperties = minOrbPos !== null
      ? { left: minOrbPos.x, top: minOrbPos.y, right: undefined, bottom: undefined }
      : { right: 20, bottom: 20 + keyboardOffsetPx };
    return (
      <div
        aria-label="DreamDM — tap to expand, drag to reposition"
        style={{
          position: 'fixed',
          ...posStyle,
          width: 44,
          height: 44,
          zIndex: 200,
          touchAction: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          const rect = e.currentTarget.getBoundingClientRect();
          minOrbDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startPosX: rect.left, startPosY: rect.top, moved: false };
        }}
        onPointerMove={(e) => {
          const drag = minOrbDragRef.current;
          if (!drag?.active) return;
          const dx = e.clientX - drag.startX;
          const dy = e.clientY - drag.startY;
          if (Math.abs(dx) > ORB_DRAG_SLOP || Math.abs(dy) > ORB_DRAG_SLOP) drag.moved = true;
          if (drag.moved) {
            const nx = Math.max(0, Math.min(window.innerWidth - 48, drag.startPosX + dx));
            const ny = Math.max(0, Math.min(window.innerHeight - 48, drag.startPosY + dy));
            setMinOrbPos({ x: nx, y: ny });
          }
        }}
        onPointerUp={() => {
          const drag = minOrbDragRef.current;
          if (!drag?.active) return;
          const wasDragged = drag.moved;
          minOrbDragRef.current = null;
          if (!wasDragged) {
            // Restore bar without resetting positions — runtimes stay exactly as they were
            setIsMinimized(false);
            revealBar();
          }
        }}
        onPointerCancel={() => { minOrbDragRef.current = null; }}
      >
        <GlowingLight
          isCollapsed
          firstTime={firstTimeLight}
          tooltip={lightTooltip}
          aria-label="DreamDM — tap to expand"
        />
      </div>
    );
  }

  return (
    <>
      {/* ── DreamDM window ───────────────────────────────────────────────────── */}
      <div
        aria-label="DreamDM Bar"
        className="sicc-bar-edge"
        onPointerDown={revealBar}
        onTouchStart={handleBarTouchStart}
        onTouchMove={handleBarTouchMove}
        onTouchEnd={handleBarTouchEnd}
        style={{
          position: 'fixed',
          top: barTop,
          // Bubble mode: pill floats above the seam with horizontal inset.
          // Legacy mode: full-width bar anchored to top or bottom edge.
          ...(isDividerMode
            ? { left: 12, right: 12 }
            : { left: 0, right: 0 }),
          height: barH,
          zIndex: 100,
          pointerEvents: 'auto',
          overflow: 'hidden',
          touchAction: 'pan-y',
          // Pill/bubble border radius only in divider mode
          borderRadius: isDividerMode ? 36 : 0,
          transition: isDragging ? 'none' : `top ${SPRING}, height ${SPRING}, border-radius ${SPRING}, opacity 0.5s ease, background 0.5s ease, transform 0.25s ease`,
          willChange: isDragging ? 'top, height' : undefined,
          transform: keyboardTranslateY !== 0 ? `translateY(${keyboardTranslateY}px)` : undefined,
          display: 'flex',
          // Divider mode: handle always at top; legacy: handle position depends on snap state
          flexDirection: isDividerMode ? 'column' : (isTop ? 'column-reverse' : 'column'),
          background: isDividerMode
            ? 'rgba(255,255,255,0.92)'
            : isResting
              ? 'transparent'
              : 'linear-gradient(180deg, rgba(248,249,253,0.97) 0%, rgba(242,244,249,0.99) 100%)',
          backdropFilter: isDividerMode
            ? 'blur(48px) saturate(200%)'
            : (isResting ? 'none' : 'blur(32px) saturate(160%)'),
          WebkitBackdropFilter: isDividerMode
            ? 'blur(48px) saturate(200%)'
            : (isResting ? 'none' : 'blur(32px) saturate(160%)'),
          opacity: isResting ? 0 : 1,
          border: isDividerMode ? '1px solid rgba(0,0,0,0.07)' : 'none',
          boxShadow: isResting
            ? 'none'
            : (isDividerMode
              // Floating bubble shadow — elevation above both runtimes
              ? `0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.07),
                 0 0 0 1px rgba(255,255,255,0.55),
                 inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.04),
                 0 -4px 24px rgba(125,211,252,0.12), 0 4px 24px rgba(200,152,26,0.08)`
              : (isTop
                ? `0 6px 32px rgba(0,0,0,0.12), 0 1px 0 rgba(200,152,26,0.15),
                   inset 0 -1px 0 rgba(255,255,255,0.35),
                   0 -6px 32px rgba(125,211,252,0.18), 0 -1px 0 rgba(125,211,252,0.22)`
                : `0 -6px 32px rgba(0,0,0,0.10), 0 -1px 0 rgba(200,152,26,0.15),
                   inset 0 1px 0 rgba(255,255,255,0.45),
                   0 -8px 32px rgba(125,211,252,0.18), 0 -1px 0 rgba(125,211,252,0.25)`)),
        }}
      >
        {/* ── 🌈 Mood Aura overlay — ambient glow shifts with time-of-day + surface ── */}
        {!isResting && (
          <div
            className="sicc-mood-aura"
            aria-hidden
            style={{
              position: 'absolute', inset: 0, zIndex: 0,
              background: moodAuraGradient,
              pointerEvents: 'none',
              borderRadius: 'inherit',
              mixBlendMode: 'soft-light',
            }}
          />
        )}
        {!isResting && (
          <div
            aria-hidden
            style={{
              position: 'absolute', inset: 0, zIndex: 0,
              background: surfaceAccent,
              pointerEvents: 'none',
              borderRadius: 'inherit',
            }}
          />
        )}

        {/* ── Drag handle / Glowing Light ──────────────────────────────────── */}
        <div
          role="separator" aria-label="Drag to resize DreamDM"
          style={{
            height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'default',
            pointerEvents: 'none',
            userSelect: 'none',
            position: 'relative',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            width: isDividerMode ? 112 : '100%',
            maxWidth: isDividerMode ? 112 : 164,
            height: '100%',
            pointerEvents: 'auto',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}>
            <div
              onPointerDown={isDividerMode ? handleDividerDragStart : handleDragStart}
              onPointerMove={isDividerMode ? handleDividerDragMove : handleDragMove}
              onPointerUp={isDividerMode ? handleDividerDragEnd : handleDragEnd}
              onPointerCancel={isDividerMode ? handleDividerDragEnd : handleDragEnd}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
              }}
            >
              <GlowingLight
                isDragging={isDragging}
                tooltip={lightTooltip}
                onTouchStart={handleLightTouchStart}
                onTouchEnd={handleLightTouchEnd}
              />
            </div>
          </div>
        </div>

        {/* ── Bar body ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showFull ? (
            /* Expanded panel — Messages */
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Minimize header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 12px 4px', flexShrink: 0,
                borderBottom: '1px solid rgba(180,185,200,0.15)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', letterSpacing: '-0.01em' }}>
                  Messages
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    aria-label="Minimize DreamDM bar"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => { setDragH(BAR_H); setIsTop(false); setIsTopExpanded(false); setSlideDown(0); }}
                    style={{
                      background: 'rgba(180,185,200,0.15)', border: 'none', borderRadius: 8,
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--de-text-dim)',
                      transition: 'background 0.18s',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Close DreamDM Bar"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={minimizeDreamDMBar}
                    style={{
                      background: 'rgba(180,185,200,0.15)', border: 'none', borderRadius: 8,
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--de-text-dim)',
                      transition: 'background 0.18s',
                    }}
                  >
                    <X size={13} aria-hidden />
                  </button>
                </div>
              </div>
              <DreamSpaceMessaging
                conversations={conversations} selectedConv={selectedConv}
                onSelectConv={(c) => { setSelectedConv(c); markAllRead(); }}
                messages={messages} msgsLoading={msgsLoading} msgsEndRef={msgsEndRef}
                userId={userId} messageBody={messageBody}
                onMessageBodyChange={(v) => { setMessageBody(v); saveDraft({ subject: '', body: v }); }}
                draftRestored={draftRestored} selectedFile={selectedFile} filePreviewUrl={filePreviewUrl}
                fileInputRef={fileInputRef} onFileSelect={handleFileSelect} onRemoveFile={removeFile}
                getFileType={getFileType} isSending={isSending} sendError={sendError}
                onClearSendError={clearSendError} onPanelSend={handlePanelSend}
                searchQuery={searchQuery}
                onSearchQueryChange={(v) => { setSearchQuery(v); setShowSearch(true); }}
                showSearch={showSearch} onShowSearch={setShowSearch}
                searchResults={searchResults} isSearching={isSearching}
                drEamsMode={drEamsMode} onToggleDrEams={toggleDrEams}
                onSearchResultSelect={handleSearchResultSelect}
              />
            </div>
          ) : (
            /* Compact bar — quick compose + mode buttons + notifications */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              gap: isCompactViewport ? 3 : 4, paddingTop: 0, paddingRight: isCompactViewport ? 8 : 12, paddingLeft: isCompactViewport ? 10 : 14,
              paddingBottom: isDividerMode ? 6 : 'env(safe-area-inset-bottom, 0px)',
              justifyContent: 'flex-end',
            }}>
              {/* ── Top accessory row: Bell + Comment indicator + Mode buttons ── */}
              {/* Slides out of the way when composing multi-line */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: isCompactViewport ? 5 : 4,
                overflow: 'hidden',
                maxHeight: composeExtraH > 20 ? 0 : 28,
                opacity: composeExtraH > 20 ? 0 : 1,
                transition: 'max-height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
              }}>
                {/* Notification bell + unread badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Bell size={16} aria-hidden style={{
                    color: unreadCount > 0 ? 'var(--de-gold)' : 'var(--de-text-dim)',
                    transition: 'color 0.18s, filter 0.3s',
                    filter: unreadCount > 0 ? 'drop-shadow(0 0 4px rgba(200,152,26,0.35))' : 'none',
                  }} />
                  {unreadCount > 0 && (
                    <span
                      aria-label={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
                      className="sicc-badge-pop"
                      style={{
                        position: 'absolute', top: -6, right: -8,
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        borderRadius: 9999, fontSize: 8, fontWeight: 700,
                        lineHeight: 1, padding: '2px 4px', minWidth: 14, textAlign: 'center',
                        boxShadow: '0 2px 6px rgba(220,38,38,0.35), 0 0 0 1.5px rgba(255,255,255,0.85)',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>

                {/* 🔥 Dream Streak counter */}
                {streakData.count > 0 && (
                  <StreakFlame count={streakData.count} tier={streakTier} />
                )}

                {/* Comment mode indicator */}
                {barIntent.mode === 'comment' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(42,138,184,0.12)', borderRadius: 9999,
                    padding: '3px 8px', fontSize: 10, color: 'var(--de-accent)',
                    fontWeight: 600, flexShrink: 0, maxWidth: 120, overflow: 'hidden',
                  }}>
                    <MessageCircle size={10} aria-hidden />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {barIntent.targetLabel ? `→ ${barIntent.targetLabel}` : 'Comment'}
                    </span>
                    <button
                      type="button" onClick={clearBarIntent}
                      onPointerDown={(e) => e.stopPropagation()}
                      aria-label="Cancel comment"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--de-text-dim)' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}

                {/* Spacer pushes mode buttons to the right */}
                <div style={{ flex: 1 }} />

                {/* Mode buttons: Search · Message · Dr. Eams */}
                <ModeButton
                  mode="search"
                  icon={<Search size={13} aria-hidden />}
                  activeMode={barIntent.mode}
                  onSelect={(m) => setBarIntent(m === barIntent.mode ? { mode: 'default' } : { mode: m })}
                  label="Search"
                  compact={isCompactViewport}
                />
                <ModeButton
                  mode="message"
                  icon={<Send size={13} aria-hidden />}
                  activeMode={barIntent.mode}
                  onSelect={(m) => setBarIntent(m === barIntent.mode ? { mode: 'default' } : { mode: m })}
                  label="Message"
                  compact={isCompactViewport}
                />
                <ModeButton
                  mode="dreams"
                  icon={<Bot size={13} aria-hidden />}
                  activeMode={barIntent.mode}
                  onSelect={(m) => setBarIntent(m === barIntent.mode ? { mode: 'default' } : { mode: m })}
                  label="Dr. Eams"
                  compact={isCompactViewport}
                />

                {/* Close (X) button — collapses bar into a gold orb */}
                <button
                  type="button"
                  aria-label="Close DreamDM Bar"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={minimizeDreamDMBar}
                  style={{
                    flexShrink: 0,
                    background: 'rgba(180,185,200,0.15)',
                    border: '1px solid rgba(180,185,200,0.22)',
                    borderRadius: '50%',
                    width: isCompactViewport ? 36 : 32,
                    height: isCompactViewport ? 36 : 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--de-text-dim)',
                    transition: 'all 0.18s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <X size={13} aria-hidden />
                </button>
              </div>

              {/* 😀 Quick React emoji row — appears in comment mode */}
              {barIntent.mode === 'comment' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: isCompactViewport ? 6 : 4,
                  padding: '2px 0',
                  overflow: 'hidden',
                  maxHeight: 32,
                }}>
                  {QUICK_REACTIONS.map((reaction, idx) => (
                    <button
                      key={reaction.emoji}
                      type="button"
                      aria-label={`React with ${reaction.label}`}
                      className="sicc-react-pop"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        // Insert emoji into the quick draft
                        setQuickDraft(prev => prev + reaction.emoji);
                        // Haptic feedback
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(3);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.65)',
                        border: '1px solid rgba(180,185,200,0.25)',
                        borderRadius: 999,
                        width: isCompactViewport ? 36 : 30,
                        height: isCompactViewport ? 36 : 30,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: isCompactViewport ? 16 : 14,
                        animationDelay: `${idx * 0.04}s`,
                        transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.18s',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.25)'; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Media previews - shown when files are selected */}
              {quickDraftFiles.length > 0 && (
                <div style={{
                  display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0',
                  scrollbarWidth: 'thin',
                }}>
                  {quickDraftFiles.map((file, idx) => (
                    <div key={idx} style={{
                      position: 'relative', minWidth: 72, height: 72,
                      borderRadius: 10, overflow: 'hidden',
                      background: 'rgba(180,185,200,0.15)',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}>
                      {file.type.startsWith('image/') && quickDraftPreviews[idx] && (
                        <button
                          type="button"
                          aria-label="Expand image preview"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setLightboxUrl(quickDraftPreviews[idx])}
                          style={{ display: 'block', width: '100%', height: '100%', border: 'none', padding: 0, background: 'none', cursor: 'zoom-in' }}
                        >
                          <Image
                            src={quickDraftPreviews[idx]}
                            alt="Preview"
                            width={72}
                            height={72}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        </button>
                      )}
                      {file.type.startsWith('video/') && quickDraftPreviews[idx] && (
                        <button
                          type="button"
                          aria-label="Expand video preview"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setLightboxUrl(quickDraftPreviews[idx])}
                          style={{ display: 'block', width: '100%', height: '100%', border: 'none', padding: 0, background: 'none', cursor: 'zoom-in' }}
                        >
                          <video
                            src={quickDraftPreviews[idx]}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        </button>
                      )}
                      {!file.type.startsWith('image/') && !file.type.startsWith('video/') && (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 24,
                        }}>
                          📎
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveQuickFile(idx)}
                        onPointerDown={(e) => e.stopPropagation()}
                        aria-label="Remove file"
                        style={{
                          position: 'absolute', top: 2, right: 2,
                          background: '#dc4444', color: 'white',
                          border: 'none', borderRadius: '50%',
                          width: 18, height: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Compose row: [Camera] [Bubble textarea] [Send] ───────────── */}
              {/* Bottom-aligned so buttons anchor to the baseline as the bubble grows */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: isCompactViewport ? 6 : 5 }}>
                {/* Media picker button - hidden file input */}
                <input
                  ref={quickFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  multiple
                  onChange={handleQuickFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => quickFileInputRef.current?.click()}
                  onPointerDown={(e) => e.stopPropagation()}
                  disabled={quickDraftFiles.length >= 5}
                  aria-label="Add photos or videos"
                  style={{
                    flexShrink: 0,
                    background: quickDraftFiles.length > 0 ? 'rgba(42,138,184,0.15)' : 'rgba(180,185,200,0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: isCompactViewport ? 36 : 32,
                    height: isCompactViewport ? 36 : 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quickDraftFiles.length >= 5 ? 'not-allowed' : 'pointer',
                    color: quickDraftFiles.length > 0 ? 'var(--de-accent)' : 'var(--de-text-dim)',
                    opacity: quickDraftFiles.length >= 5 ? 0.5 : 1,
                    transition: 'all 0.18s',
                  }}
                >
                  <ImageIcon size={13} aria-hidden />
                </button>

                {/* Quick compose — bubble textarea */}
                <textarea
                  ref={textareaRef}
                  value={quickDraft}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuickDraft(val);
                    recordKeystroke();
                    // Slash command detection
                    if (val === '/') {
                      setSlashOpen(true);
                      setSlashQuery('');
                      setSlashSelectedIdx(0);
                    } else if (val.startsWith('/') && slashOpen) {
                      setSlashQuery(val.slice(1));
                      setSlashSelectedIdx(0);
                    } else if (!val.startsWith('/') && slashOpen) {
                      setSlashOpen(false);
                    }
                  }}
                  onFocus={() => setComposeFocused(true)}
                  onBlur={() => { setComposeFocused(false); /* delay close so click can register */ setTimeout(() => setSlashOpen(false), 200); }}
                  onKeyDown={(e) => {
                    if (slashOpen) {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashSelectedIdx(i => Math.min(i + 1, slashResults.length - 1)); return; }
                      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashSelectedIdx(i => Math.max(i - 1, 0)); return; }
                      if (e.key === 'Enter' && slashResults[slashSelectedIdx]) {
                        e.preventDefault();
                        const cmd = slashResults[slashSelectedIdx];
                        setSlashOpen(false);
                        setQuickDraft('');
                        if (cmd.href) router.push(cmd.href);
                        else if (cmd.action === 'search-mode') setBarIntent({ mode: 'search' });
                        else if (cmd.action === 'dreams-mode') setBarIntent({ mode: 'dreams' });
                        return;
                      }
                      if (e.key === 'Escape') { e.preventDefault(); setSlashOpen(false); setQuickDraft(''); return; }
                    }
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleQuickSend(); }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder={
                    barCtx.surface === 'messages' && selectedConv && barIntent.mode === 'default'
                      ? `Message ${selectedConv.otherUser.display_name || selectedConv.otherUser.handle}…`
                      : barCtx.placeholder
                  }
                  aria-label={barCtx.actionAriaLabel}
                  rows={1}
                  style={{
                    flex: 1, minWidth: 0, width: '100%', resize: 'none', overflow: 'hidden',
                    background: composeFocused
                      ? 'rgba(255,255,255,0.88)'
                      : 'rgba(255,255,255,0.52)',
                    border: composeFocused
                      ? '1.5px solid rgba(200,152,26,0.60)'
                      : barIntent.mode !== 'default'
                        ? '1.5px solid rgba(42,138,184,0.50)'
                        : '1px solid rgba(180,185,200,0.35)',
                    // Pill when single-line; relax to speech-bubble radius as it grows
                    borderRadius: composeExtraH > 20 ? 20 : 999,
                    padding: isCompactViewport ? '9px 16px' : '8px 16px',
                    fontSize: isCompactViewport ? 16 : 14,
                    color: 'var(--de-text)', outline: 'none', cursor: 'text',
                    transition: 'background 0.22s ease, border 0.22s ease, box-shadow 0.22s ease, border-radius 0.22s ease',
                    WebkitAppearance: 'none',
                    boxShadow: composeFocused
                      ? '0 0 0 3px rgba(200,152,26,0.10), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.50)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.35)',
                    lineHeight: 1.4,
                    fontFamily: 'inherit',
                    // Truncate placeholder on single line
                    textOverflow: composeExtraH > 0 ? 'unset' : 'ellipsis',
                    whiteSpace: composeExtraH > 0 ? 'pre-wrap' : 'nowrap',
                  }}
                />

                {/* Send / action button — SICC premium gradient with shimmer */}
                {(quickDraft.trim() || quickDraftFiles.length > 0) ? (
                  <button
                    type="button" onClick={() => { void handleQuickSend(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={isSending || commentSending} aria-label={barCtx.actionAriaLabel}
                    className="sicc-shimmer"
                    style={{
                      background: 'linear-gradient(135deg, var(--de-gold) 0%, #e0b020 38%, var(--de-blue) 100%)',
                      border: 'none', borderRadius: '50%',
                      width: isCompactViewport ? 36 : 32,
                      height: isCompactViewport ? 36 : 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: (isSending || commentSending) ? 'not-allowed' : 'pointer', flexShrink: 0, color: 'white',
                      opacity: (isSending || commentSending) ? 0.6 : 1,
                      boxShadow: '0 4px 16px rgba(200,152,26,0.40), 0 1px 4px rgba(0,0,0,0.12)',
                      transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s, box-shadow 0.2s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {(isSending || commentSending)
                      ? <Loader2 size={15} aria-hidden style={{ animation: 'spin 1s linear infinite' }} />
                      : <ContextIcon ctx={barCtx} size={15} />}
                  </button>
                ) : (
                  /* Placeholder spacer keeps layout stable when send button is hidden */
                  <div style={{ width: isCompactViewport ? 36 : 32, flexShrink: 0 }} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ⌨️ Slash Command Palette ─────────────────────────────────────── */}
      {slashOpen && slashResults.length > 0 && (
        <div
          role="listbox"
          aria-label="Slash commands"
          className="sicc-slash-palette"
          style={{
            position: 'fixed',
            bottom: isDividerMode ? (screenH - barTop + 8) : (screenH - barTop + 8),
            left: isCompactViewport ? 12 : 24,
            right: isCompactViewport ? 12 : 24,
            maxHeight: 320,
            overflowY: 'auto',
            zIndex: 150,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
            borderRadius: 16,
            border: '1px solid rgba(200,152,26,0.25)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15), 0 2px 12px rgba(200,152,26,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
            padding: '8px 0',
          }}
        >
          <div style={{ padding: '4px 14px 8px', fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Quick Commands
          </div>
          {slashResults.map((cmd, idx) => (
            <button
              key={cmd.id}
              type="button"
              role="option"
              aria-selected={idx === slashSelectedIdx}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                setSlashOpen(false);
                setQuickDraft('');
                if (cmd.href) router.push(cmd.href);
                else if (cmd.action === 'search-mode') setBarIntent({ mode: 'search' });
                else if (cmd.action === 'dreams-mode') setBarIntent({ mode: 'dreams' });
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: idx === slashSelectedIdx ? 'rgba(200,152,26,0.10)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderRadius: 0,
                transition: 'background 0.12s',
              }}
              onMouseEnter={() => setSlashSelectedIdx(idx)}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: idx === slashSelectedIdx
                  ? 'linear-gradient(135deg, var(--de-gold), #e0b020)'
                  : 'rgba(180,185,200,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: idx === slashSelectedIdx ? 'white' : 'var(--de-text-dim)',
                transition: 'all 0.18s',
                flexShrink: 0,
              }}>
                <SlashCommandIcon icon={cmd.icon} size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', lineHeight: 1.2 }}>
                  {cmd.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.3, marginTop: 1 }}>
                  {cmd.description}
                </div>
              </div>
              <span style={{
                fontSize: 9, color: 'var(--de-text-dim)', opacity: 0.5,
                padding: '2px 6px', borderRadius: 4,
                background: 'rgba(180,185,200,0.10)',
                flexShrink: 0,
              }}>
                {cmd.category}
              </span>
            </button>
          ))}
          <div style={{ padding: '6px 14px 4px', fontSize: 9, color: 'var(--de-text-dim)', opacity: 0.6, textAlign: 'center' }}>
            Type to filter · ↑↓ to navigate · Enter to select · Esc to close
          </div>
        </div>
      )}

      {/* ── Media lightbox overlay ─────────────────────────────────────────── */}
      {lightboxUrl && (
        <div
          role="dialog"
          aria-label="Media preview"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute', top: 18, right: 18,
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
            }}
          >
            <X size={20} />
          </button>
          {lightboxUrl.startsWith('blob:') || /\.(jpg|jpeg|png|gif|webp|avif)/i.test(lightboxUrl) || !lightboxUrl.includes('.mp4') ? (
            <img
              src={lightboxUrl}
              alt="Full size preview"
              style={{ maxWidth: '92vw', maxHeight: '84vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={lightboxUrl}
              controls
              style={{ maxWidth: '92vw', maxHeight: '84vh', borderRadius: 12, boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// ModeButton — compact pill for switching bar intent mode
// ─────────────────────────────────────────────────────────────────────────────

function ModeButton({
  mode,
  icon,
  activeMode,
  onSelect,
  label,
  compact = false,
}: {
  mode: BarIntentMode;
  icon: React.ReactNode;
  activeMode: BarIntentMode;
  onSelect: (mode: BarIntentMode) => void;
  label: string;
  compact?: boolean;
}) {
  const isActive = activeMode === mode;
  const sz = compact ? 36 : 32;
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      onPointerDown={(e) => e.stopPropagation()}
      aria-pressed={isActive}
      aria-label={isActive ? `${label} mode active — tap to deactivate` : `Switch to ${label} mode`}
      title={label}
      className="sicc-mode-btn"
      style={{
        flexShrink: 0,
        background: isActive
          ? 'linear-gradient(135deg, var(--de-gold) 0%, #d4a843 100%)'
          : 'rgba(180,185,200,0.15)',
        border: isActive
          ? '1.5px solid rgba(232,184,48,0.55)'
          : '1px solid rgba(180,185,200,0.22)',
        borderRadius: '50%',
        width: sz, height: sz,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: isActive ? 'white' : 'var(--de-text-dim)',
        transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        transform: isActive ? 'scale(1.12)' : 'scale(1)',
        boxShadow: isActive
          ? '0 3px 12px rgba(200,152,26,0.42), 0 0 0 2.5px rgba(200,152,26,0.16)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        animation: isActive ? 'sicc-mode-glow 2s ease-in-out infinite' : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DreamSpaceMessaging
// ─────────────────────────────────────────────────────────────────────────────

interface DreamSpaceMessagingProps {
  conversations:       DMConversation[];
  selectedConv:        DMConversation | null;
  onSelectConv:        (c: DMConversation) => void;
  messages:            DMMessage[];
  msgsLoading:         boolean;
  msgsEndRef:          React.RefObject<HTMLDivElement | null>;
  userId:              string;
  messageBody:         string;
  onMessageBodyChange: (v: string) => void;
  draftRestored:       boolean;
  selectedFile:        File | null;
  filePreviewUrl:      string | null;
  fileInputRef:        React.RefObject<HTMLInputElement | null>;
  onFileSelect:        (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile:        () => void;
  getFileType:         (f: File) => MediaType;
  isSending:           boolean;
  sendError:           string | null;
  onClearSendError:    () => void;
  onPanelSend:         () => void;
  searchQuery:         string;
  onSearchQueryChange: (v: string) => void;
  showSearch:          boolean;
  onShowSearch:        (v: boolean) => void;
  searchResults:       SearchResult[];
  isSearching:         boolean;
  drEamsMode:          boolean;
  onToggleDrEams:      () => void;
  onSearchResultSelect:(r: SearchResult) => void;
}

function DreamSpaceMessaging({
  conversations, selectedConv, onSelectConv,
  messages, msgsLoading, msgsEndRef, userId,
  messageBody, onMessageBodyChange, draftRestored,
  selectedFile, filePreviewUrl, fileInputRef, onFileSelect, onRemoveFile, getFileType,
  isSending, sendError, onClearSendError, onPanelSend,
  searchQuery, onSearchQueryChange, showSearch, onShowSearch,
  searchResults, isSearching, drEamsMode, onToggleDrEams, onSearchResultSelect,
}: DreamSpaceMessagingProps) {
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>

      {/* ── Compact conversation list ──────────────────────────────────────── */}
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid rgba(180,185,200,0.20)', overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column' }}>

        {/* Search + Dr. Eams toggle */}
        <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid rgba(180,185,200,0.15)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={12} aria-hidden style={{ color: 'var(--de-text-dim)', position: 'absolute', left: 8, pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text" value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onFocus={() => onShowSearch(true)}
              placeholder={drEamsMode ? 'Dr. Eams…' : 'Search…'}
              aria-label={drEamsMode ? 'Dr. Eams search' : 'Universal search'}
              style={{
                flex: 1, paddingLeft: 26, paddingRight: 8, paddingTop: 5, paddingBottom: 5,
                borderRadius: 9999,
                border: drEamsMode ? '1.5px solid rgba(200,152,26,0.65)' : '1px solid rgba(180,185,200,0.40)',
                background: drEamsMode ? 'rgba(255,245,215,0.75)' : 'rgba(255,255,255,0.45)',
                fontSize: 11, color: 'var(--de-text)', outline: 'none',
              }}
            />
            <button
              type="button" onClick={onToggleDrEams}
              aria-pressed={drEamsMode}
              aria-label={drEamsMode ? 'Dr. Eams mode active — click to switch to standard search' : 'Switch to Dr. Eams mode'}
              title={drEamsMode ? 'Dr. Eams ON' : 'Dr. Eams OFF'}
              style={{
                flexShrink: 0, background: drEamsMode ? 'var(--de-gold)' : 'rgba(180,185,200,0.18)',
                border: 'none', borderRadius: '50%', width: 24, height: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: drEamsMode ? 'white' : 'var(--de-text-dim)',
                transition: 'background 0.18s, color 0.18s',
              }}
            >
              <Bot size={12} aria-hidden />
            </button>
          </div>
          {drEamsMode && (
            <p style={{ fontSize: 9, color: 'var(--de-gold)', marginTop: 4, textAlign: 'center' }}>
              Dr. Eams mode
            </p>
          )}
        </div>

        {/* Search suggestions */}
        {showSearch && (searchQuery.trim() || isSearching) && (
          <div role="listbox" aria-label="Search suggestions" style={{ background: 'rgba(255,255,255,0.96)', borderBottom: '1px solid rgba(180,185,200,0.18)', maxHeight: 180, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {isSearching && (
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={11} aria-hidden style={{ color: 'var(--de-text-dim)' }} />
                <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Searching…</span>
              </div>
            )}
            {!isSearching && searchResults.length === 0 && searchQuery.trim() && (
              <p style={{ padding: '8px 12px', fontSize: 11, color: 'var(--de-text-dim)' }}>No results</p>
            )}
            {searchResults.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                role="option" aria-selected={false} type="button"
                onClick={() => onSearchResultSelect(result)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 12px', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(180,185,200,0.10)',
                }}
              >
                <AvatarChip name={result.label} url={result.avatarUrl} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{result.label}</p>
                  {result.sublabel && (
                    <p style={{ fontSize: 10, color: 'var(--de-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{result.sublabel}</p>
                  )}
                </div>
                <span style={{ fontSize: 9, color: 'var(--de-text-dim)', opacity: 0.7, flexShrink: 0 }}>{result.type}</span>
              </button>
            ))}
          </div>
        )}

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {conversations.map((conv) => (
            <button
              key={conv.id} type="button" onClick={() => onSelectConv(conv)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 10px',
                background: selectedConv?.id === conv.id ? 'rgba(42,138,184,0.10)' : 'transparent',
                border: 'none', borderBottom: '1px solid rgba(180,185,200,0.10)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <AvatarChip name={conv.otherUser.display_name || conv.otherUser.handle || 'U'} url={conv.otherUser.avatar_url} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                  {conv.otherUser.display_name || conv.otherUser.handle || 'Unknown'}
                </p>
                {conv.lastMessage && (
                  <p style={{ fontSize: 10, color: 'var(--de-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{conv.lastMessage}</p>
                )}
              </div>
              <span style={{ fontSize: 9, color: 'var(--de-text-dim)', flexShrink: 0 }}>{formatRelativeTime(conv.updatedAt, { compact: true })}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Message panel ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {selectedConv ? (
          <>
            {/* Header */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(180,185,200,0.18)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <AvatarChip name={selectedConv.otherUser.display_name || selectedConv.otherUser.handle || 'U'} url={selectedConv.otherUser.avatar_url} size={26} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', margin: 0 }}>{selectedConv.otherUser.display_name || selectedConv.otherUser.handle}</p>
                {selectedConv.otherUser.handle && <p style={{ fontSize: 10, color: 'var(--de-text-dim)', margin: 0 }}>@{selectedConv.otherUser.handle}</p>}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: '12px 12px 0' }}>
              {msgsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60 }}>
                  <Loader2 size={16} aria-hidden style={{ color: 'var(--de-text-dim)' }} />
                </div>
              ) : messages.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', marginTop: 20 }}>No messages yet — say hello!</p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === userId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                      <div style={{
                        maxWidth: '80%', borderRadius: 12, padding: '6px 10px', fontSize: 11,
                        ...(isMe
                          ? { background: 'var(--de-heading)', color: 'white', borderBottomRightRadius: 3 }
                          : { background: 'rgba(42,138,184,0.10)', color: 'var(--de-text)', borderBottomLeftRadius: 3, border: '1px solid rgba(180,185,200,0.25)' }),
                      }}>
                        {msg.media_url && msg.media_type === 'image' && (
                          <Image src={msg.media_url} alt="Shared image" width={160} height={100} style={{ borderRadius: 8, marginBottom: 4 }} />
                        )}
                        {msg.content && <p style={{ margin: 0 }}>{msg.content}</p>}
                        <p style={{ margin: 0, fontSize: 9, opacity: 0.55, marginTop: 2 }}>{formatRelativeTime(msg.created_at, { compact: true })}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={msgsEndRef} />
            </div>

            {/* Compose */}
            <form onSubmit={(e) => { e.preventDefault(); onPanelSend(); }} style={{ padding: '8px 10px', borderTop: '1px solid rgba(180,185,200,0.18)', flexShrink: 0 }}>
              {sendError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <p style={{ fontSize: 10, color: '#dc4444', flex: 1, margin: 0 }}>{sendError}</p>
                  <button type="button" onClick={onClearSendError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc4444', padding: 0 }}><X size={12} /></button>
                </div>
              )}
              {draftRestored && (
                <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginBottom: 4 }} aria-live="polite">Draft restored</p>
              )}
              {selectedFile && filePreviewUrl && (
                <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
                  <div style={{ background: 'rgba(180,185,200,0.15)', borderRadius: 8, padding: 6 }}>
                    {getFileType(selectedFile) === 'image' && (
                      <Image src={filePreviewUrl} alt="Preview" width={80} height={60} style={{ borderRadius: 6 }} />
                    )}
                    {(getFileType(selectedFile) === 'audio' || getFileType(selectedFile) === 'file') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px' }}>
                        {getFileType(selectedFile) === 'audio' ? <Music size={12} style={{ color: 'var(--de-text-dim)' }} /> : <FileText size={12} style={{ color: 'var(--de-text-dim)' }} />}
                        <span style={{ fontSize: 10, color: 'var(--de-text)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={onRemoveFile} style={{ position: 'absolute', top: -4, right: -4, background: '#dc4444', border: 'none', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', padding: 0 }}>
                    <X size={9} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" onChange={onFileSelect} style={{ display: 'none' }} />
                <button
                  type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending}
                  aria-label="Attach file"
                  style={{ background: 'rgba(180,185,200,0.15)', border: 'none', borderRadius: 8, padding: '5px 7px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSending ? 'not-allowed' : 'pointer', color: 'var(--de-text-dim)', flexShrink: 0, opacity: isSending ? 0.5 : 1 }}
                >
                  <Paperclip size={12} aria-hidden />
                </button>
                <input
                  type="text" value={messageBody} onChange={(e) => onMessageBodyChange(e.target.value)}
                  placeholder="Type a message…" aria-label="Message body"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onPanelSend(); } }}
                  style={{ flex: 1, padding: '5px 10px', borderRadius: 9999, border: '1px solid rgba(180,185,200,0.32)', background: 'rgba(255,255,255,0.55)', fontSize: 11, color: 'var(--de-text)', outline: 'none' }}
                />
                <button
                  type="submit" aria-label="Send message"
                  disabled={(!messageBody.trim() && !selectedFile) || isSending}
                  className="sicc-shimmer"
                  style={{ background: 'linear-gradient(135deg, var(--de-gold) 0%, #e0b020 40%, var(--de-blue) 100%)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!messageBody.trim() && !selectedFile) || isSending ? 'not-allowed' : 'pointer', color: 'white', flexShrink: 0, opacity: (!messageBody.trim() && !selectedFile) || isSending ? 0.5 : 1, boxShadow: '0 3px 10px rgba(200,152,26,0.30)', transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s' }}
                >
                  {isSending ? <Loader2 size={13} aria-hidden /> : <Send size={13} aria-hidden />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <MessageCircle size={28} style={{ color: 'var(--de-text-dim)', opacity: 0.3 }} aria-hidden />
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Select a conversation</p>
            <a href="/messages" style={{ fontSize: 11, color: 'var(--de-gold)', textDecoration: 'none' }}>Open <DreamWord />DM →</a>
          </div>
        )}
      </div>
    </div>
  );
}
