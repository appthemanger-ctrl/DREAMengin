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
import {
  Bot,
  Code2,
  FileText,
  Loader2,
  MessageCircle,
  Music,
  Paperclip,
  PenLine,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

import { formatRelativeTime }                    from '@/lib/utils';
import { useDreamDMMessages }                    from '@/lib/dreamdm/useDreamDMMessages';
import { useDreamDMDraft }                        from '@/lib/dreamdm/useDreamDMDraft';
import { useDreamSearch, type SearchResult }      from '@/lib/dreamdm/useDreamSearch';
import { useMessagingCore, type MediaType }       from '@/lib/dreamdm/useMessagingCore';
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
} from '@/lib/dreamdm/barInteractions';
import type { DMMessage } from '@/lib/dreamdm/useDreamDMMessages';
import DreamsSpacePanel from '@/components/dreams/DreamsSpacePanel';
import { useDreamBarContext, type DreamBarContext } from '@/lib/dreamdm/useDreamBarContext';
import DreamWord from '@/components/ui/DreamWord';

// ── Layout constants ─────────────────────────────────────────────────────────
/** Thick bar height when locked at the bottom */
export const BAR_H = 80;
/** Panel height when locked at the top (expanded) */
const TOP_H        = 340;
/** Compact nav-bar height when locked at the top (collapsed/nav-bar mode) */
export const NAV_H = 52;
/** Gold button diameter */
const GOLD_SZ      = 48;
const GOLD_R       = GOLD_SZ / 2;
/** Snap to bottom when dragged down this many px from top */
const SNAP_DOWN_PX = 88;
/** Drag distance to expand compact nav bar into full panel */
const EXPAND_THRESHOLD = 80;
/** Spring animation string */
const SPRING       = '0.46s cubic-bezier(0.34,1.22,0.64,1)';

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
    case 'send':      return <Send     {...props} />;
    case 'pen-line':  return <PenLine  {...props} />;
    case 'code':      return <Code2    {...props} />;
    case 'bot':       return <Bot      {...props} />;
    case 'music':     return <Music    {...props} />;
    case 'search':    return <Search   {...props} />;
    case 'sparkles':
    default:          return <Sparkles {...props} />;
  }
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function DreamDMBar({ onHome, onBothMenus, onHomeDreamSpace, onRuntimeModeChange, onRuntimeBlendChange, onBarInsets }: DreamDMBarProps) {
  // ── Screen geometry ────────────────────────────────────────────────────────
  const [screenH, setScreenH] = useState(900);
  useEffect(() => {
    const update = () => setScreenH(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
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

  const dragRef = useRef({
    active: false, startY: 0,
    startH: BAR_H, startSlide: 0,
    fromTop: false,
    fromTopExpanded: false,
    lastY: 0,
    lastAt: 0,
    velocity: 0,
  });

  // ── Gold button press state (iOS-like feedback) ────────────────────────────
  const [goldPressed, setGoldPressed] = useState(false);

  // ── Gold button double-tap ─────────────────────────────────────────────────
  const goldRef = useRef({ lastAt: 0 });
  const handleGoldTap = useCallback(() => {
    const { action, nextLastTapAt } = resolveGoldTapAction({
      now: Date.now(),
      lastTapAt: goldRef.current.lastAt,
      isTop,
    });
    goldRef.current.lastAt = nextLastTapAt;
    if (action === 'home' || action === 'home-dreamspace') {
      // Haptic: double-tap = strong feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([6, 40, 6]);
      if (action === 'home-dreamspace') {
        // Bar is locked at top → open HomeDream in DreamSpace region (dual-home).
        // Keep the bar at the top so both HomeDream views are active simultaneously.
        onHomeDreamSpace?.();
      } else {
        // Bar is at the bottom → return home in Surface Space (standard).
        onHome();
      }
      return;
    }

    // Haptic: single tap = light feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(4);
    // Single tap → open dual menus immediately
    onBothMenus();
  }, [isTop, onHome, onHomeDreamSpace, onBothMenus]);

  // Also handle gold swipe-down (pointer drag down > tap slop)
  const goldDragRef = useRef({ active: false, startY: 0 });
  const handleGoldPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    goldDragRef.current = { active: true, startY: e.clientY };
    setGoldPressed(true);
  }, []);
  const handleGoldPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setGoldPressed(false);
    if (!goldDragRef.current.active) return;
    goldDragRef.current.active = false;
    const dy = e.clientY - goldDragRef.current.startY;
    if (shouldCollapseGoldSwipe({ dy, isTop })) {
      // Swiping down on gold while bar is at the top → collapse bar to bottom.
      setIsTop(false); setIsTopExpanded(false); setDragH(BAR_H); setSlideDown(0);
    } else if (shouldTreatGoldReleaseAsTap(dy)) {
      handleGoldTap();
    }
  }, [handleGoldTap, isTop]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
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
  }, [dragH, isTop, isTopExpanded, slideDown]);

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
      // Expanding from bottom: snap to top-compact if reached near the top.
      if (shouldSnapBottomDragToTop({ screenH, dragH, barH: BAR_H, velocityPxPerMs: velocity })) {
        setIsTop(true); setIsTopExpanded(false); setDragH(NAV_H); setSlideDown(0);
      } else {
        setDragH(Math.max(BAR_H, Math.min(screenH * 0.85, dragH)));
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

  // ── Dream bar context (route-aware) ────────────────────────────────────────
  const barCtx = useDreamBarContext();

  // ── Messaging state ────────────────────────────────────────────────────────
  const [mounted,        setMounted]        = useState(false);
  const [composeFocused, setComposeFocused] = useState(false);
  const [userId,         setUserId]         = useState('');
  const [selectedConv,   setSelectedConv]   = useState<DMConversation | null>(null);
  const [quickDraft,     setQuickDraft]     = useState('');

  /** Active tab when panel is expanded: 'messages' or 'dreams' */
  const [activeTab, setActiveTab] = useState<'messages' | 'dreams'>('dreams');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send handlers ──────────────────────────────────────────────────────────
  const handleQuickSend = useCallback(async () => {
    const text = quickDraft.trim();
    if (!text) return;

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
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text, visibility: 'public' }),
        });
        if (res.ok) {
          setQuickDraft('');
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

    // Code surface: open codespace with the snippet pre-filled
    if (barCtx.surface === 'code') {
      window.location.href = `/codespace?snippet=${encodeURIComponent(text)}`;
      setQuickDraft('');
      return;
    }

    // Dreams / Dr. Eams surface: route as Dr. Eams chat
    if (barCtx.surface === 'dreams') {
      window.location.href = `/dreamengin?q=${encodeURIComponent(text)}`;
      setQuickDraft('');
      return;
    }

    // Music surface: open music composer
    if (barCtx.surface === 'music') {
      window.location.href = `/music?prompt=${encodeURIComponent(text)}`;
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
  }, [quickDraft, selectedConv, sendMessage, clearDraft, userId, barCtx.surface]);

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

  // Bar geometry
  // - Bottom mode:       grows upward from the screen bottom (dragH)
  // - Top-compact mode:  thin nav bar at top (NAV_H), drag handle below
  // - Top-expanded mode: full panel at top (TOP_H), can slide away from top
  const barH: number    = isTop
    ? (isTopExpanded ? TOP_H : dragH) // compact uses dragH (starts at NAV_H); expanded = fixed TOP_H
    : dragH;
  const barTop: number  = isTop
    ? (isTopExpanded ? slideDown : 0) // expanded can slide; compact is always pinned to top
    : (screenH - dragH);              // grows from bottom

  // showFull: whether to render the expanded tab panel instead of the compact bar
  const showFull: boolean = isTopExpanded || dragH > 180;

  // Gold button geometry:
  // - Bottom mode: gold sits on the BAR's top edge  (center = barTop)
  // - Top modes:   gold hangs from the BAR's bottom edge (center = barTop + barH)
  const attachedGoldTop: number = isTop
    ? (barTop + barH - GOLD_R)  // bottom edge of the top bar / panel
    : (barTop - GOLD_R);        // top edge of the bottom bar
  const isGoldOffScreen: boolean = !isTop && (barTop - GOLD_R < 0);
  const goldTopPx: number = isGoldOffScreen ? 10 : attachedGoldTop;

  // Track if button is in screen-locked mode (for styling/behavior)
  const isScreenLocked: boolean = isGoldOffScreen;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Gold sphere button ──────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label="Gold button — tap for menus, double-tap to open HomeDream"
        onPointerDown={handleGoldPointerDown}
        onPointerUp={handleGoldPointerUp}
        onPointerCancel={() => {
          goldDragRef.current.active = false;
          setGoldPressed(false);
        }}
        style={{
          position: 'fixed', // Always fixed to ensure no scroll movement when screen-locked
          top: goldTopPx,
          left: '50%',
          transform: `translateX(-50%) scale(${goldPressed ? 0.90 : 1})`,
          width: GOLD_SZ, height: GOLD_SZ,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          zIndex: 102,
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          transition: goldPressed
            ? 'transform 0.08s ease'
            : isDragging
              ? 'none'
              : `top ${SPRING}, transform 0.22s cubic-bezier(0.34,1.6,0.64,1)`,
          willChange: 'transform',
          background: `radial-gradient(circle at 36% 32%,
            #fffde0 0%, #f7e07a 12%, #d4a843 38%, #a16207 68%, #6b3c03 100%)`,
          boxShadow: goldPressed
            ? `inset 0 3px 6px rgba(80,40,0,0.50),
               inset -2px -2px 8px rgba(80,40,0,0.30),
               0 2px 8px rgba(100,58,4,0.35),
               0 0 0 1.5px rgba(180,120,20,0.45)`
            : `inset 0 2px 4px rgba(255,255,220,0.85),
               inset -3px -3px 10px rgba(80,40,0,0.40),
               0 6px 24px rgba(100,58,4,0.55),
               0 2px 8px rgba(212,168,67,0.50),
               0 0 0 1.5px rgba(180,120,20,0.45)${isScreenLocked ? ', 0 0 20px rgba(200,152,26,0.6)' : ''}`,
        }}
      >
        <span aria-hidden style={{
          position: 'absolute', top: '14%', left: '18%',
          width: '36%', height: '22%', borderRadius: '50%',
          background: 'rgba(255,255,245,0.55)', filter: 'blur(3px)', pointerEvents: 'none',
        }} />
        <svg width="22" height="11" viewBox="0 0 80 36"
          style={{ opacity: 0.82, flexShrink: 0, position: 'relative' }} aria-hidden>
          <path d="M10 18c8-10 18-10 28 0s20 10 28 0" fill="none" stroke="#fffde0" strokeWidth="6" strokeLinecap="round" />
          <path d="M10 18c8 10 18 10 28 0s20-10 28 0" fill="none" stroke="#fffde0" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </button>

      {/* ── DreamDM window ───────────────────────────────────────────────────── */}
      <div
        aria-label="DreamDM Bar"
        style={{
          position: 'fixed',
          top: barTop,
          left: 0, right: 0,
          height: barH,
          zIndex: 100,
          pointerEvents: 'auto',
          overflow: 'hidden',
          transition,
          willChange: isDragging ? 'top, height' : undefined,
          display: 'flex',
          // Drag handle at BOTTOM when at top (drag down to expand/collapse);
          // drag handle at TOP when growing from bottom (drag up to expand).
          flexDirection: isTop ? 'column-reverse' : 'column',
          background: 'linear-gradient(180deg, rgba(242,243,247,0.97) 0%, rgba(238,240,245,0.99) 100%)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderTop: isTop ? 'none' : '1.5px solid rgba(200,152,26,0.45)',
          borderBottom: isTop ? '1.5px solid rgba(200,152,26,0.45)' : 'none',
          boxShadow: isTop
            ? '0 4px 24px rgba(0,0,0,0.12)'
            : '0 -4px 24px rgba(0,0,0,0.10)',
        }}
      >
        {/* ── Drag handle ──────────────────────────────────────────────────── */}
        <div
          role="separator" aria-label="Drag to resize DreamDM"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          style={{
            height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none', userSelect: 'none',
          }}
        >
          <div style={{
            width: 40, height: 4, borderRadius: 99,
            background: 'rgba(200,152,26,0.45)',
          }} />
        </div>

        {/* ── Bar body ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showFull ? (
            /* Expanded panel — Dreams Space + Messages tabs */
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Tab switcher */}
              <div style={{
                display: 'flex', gap: 0, padding: '4px 10px 0',
                borderBottom: '1px solid rgba(200,152,26,0.2)',
                flexShrink: 0,
              }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('dreams')}
                  style={{
                    padding: '6px 14px 5px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: activeTab === 'dreams' ? 800 : 500,
                    color: activeTab === 'dreams' ? '#d4a843' : 'var(--de-text-dim)',
                    borderBottom: activeTab === 'dreams' ? '2px solid #d4a843' : '2px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  ✨ <DreamWord />s
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  style={{
                    padding: '6px 14px 5px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: activeTab === 'messages' ? 800 : 500,
                    color: activeTab === 'messages' ? '#d4a843' : 'var(--de-text-dim)',
                    borderBottom: activeTab === 'messages' ? '2px solid #d4a843' : '2px solid transparent',
                    marginBottom: -1,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <MessageCircle size={12} aria-hidden />
                  Messages
                  {unreadCount > 0 && (
                    <span style={{
                      background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800,
                      borderRadius: 9999, padding: '1px 5px', minWidth: 14, textAlign: 'center',
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {activeTab === 'dreams' ? (
                  <DreamsSpacePanel />
                ) : (
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
                )}
              </div>
            </div>
          ) : (
            /* Compact bar — quick compose + unread badge */
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              gap: 10, paddingTop: 0, paddingRight: 16, paddingLeft: 14,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}>
              {/* Context icon + unread badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <ContextIcon ctx={barCtx} size={18} />
                {unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} unread`}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      background: 'var(--de-gold)', color: 'white',
                      borderRadius: 9999, fontSize: 9, fontWeight: 700,
                      lineHeight: 1, padding: '2px 4px', minWidth: 14, textAlign: 'center',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>

              {/* Quick compose */}
              <input
                type="text" value={quickDraft}
                onChange={(e) => setQuickDraft(e.target.value)}
                onFocus={() => setComposeFocused(true)}
                onBlur={() => setComposeFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleQuickSend(); }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder={
                  barCtx.surface === 'messages' && selectedConv
                    ? `Message ${selectedConv.otherUser.display_name || selectedConv.otherUser.handle}…`
                    : barCtx.placeholder
                }
                aria-label={barCtx.actionAriaLabel}
                style={{
                  flex: 1, minWidth: 0,
                  background: composeFocused ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.40)',
                  border: composeFocused
                    ? '1.5px solid rgba(200,152,26,0.55)'
                    : '1px solid rgba(180,185,200,0.40)',
                  borderRadius: 9999, padding: '7px 14px', fontSize: 13,
                  color: 'var(--de-text)', outline: 'none', cursor: 'text',
                  transition: 'background 0.18s, border 0.18s',
                }}
              />

              {/* Context action label (shown when focused or has text) */}
              {(composeFocused || quickDraft.trim()) && (
                <span
                  aria-hidden
                  style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--de-gold)',
                    flexShrink: 0, whiteSpace: 'nowrap', letterSpacing: '0.04em',
                    textTransform: 'uppercase', opacity: 0.85,
                    transition: 'opacity 0.18s',
                  }}
                >
                  {barCtx.actionLabel}
                </span>
              )}

              {/* Send / action button */}
              {quickDraft.trim() && (
                <button
                  type="button" onClick={() => { void handleQuickSend(); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  disabled={isSending} aria-label={barCtx.actionAriaLabel}
                  style={{
                    background: 'linear-gradient(135deg, var(--de-gold), var(--de-blue))',
                    border: 'none', borderRadius: '50%', width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isSending ? 'not-allowed' : 'pointer', flexShrink: 0, color: 'white',
                    opacity: isSending ? 0.6 : 1,
                  }}
                >
                  {isSending
                    ? <Loader2 size={14} aria-hidden style={{ animation: 'spin 1s linear infinite' }} />
                    : <ContextIcon ctx={barCtx} size={14} />}
                </button>
              )}

              {/* Dr. Eams toggle */}
              <button
                type="button" onClick={toggleDrEams}
                onPointerDown={(e) => e.stopPropagation()}
                aria-pressed={drEamsMode}
                aria-label={drEamsMode ? 'Dr. Eams mode ON' : 'Dr. Eams mode OFF'}
                style={{
                  flexShrink: 0,
                  background: drEamsMode ? 'var(--de-gold)' : 'rgba(180,185,200,0.18)',
                  border: 'none', borderRadius: '50%', width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: drEamsMode ? 'white' : 'var(--de-text-dim)',
                  transition: 'background 0.18s, color 0.18s',
                }}
              >
                <Bot size={13} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
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
                  style={{ background: 'linear-gradient(135deg, var(--de-gold) 0%, var(--de-blue) 100%)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!messageBody.trim() && !selectedFile) || isSending ? 'not-allowed' : 'pointer', color: 'white', flexShrink: 0, opacity: (!messageBody.trim() && !selectedFile) || isSending ? 0.5 : 1 }}
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
