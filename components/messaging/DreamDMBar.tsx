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
  Bell,
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
  ImageIcon,
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
  snapSplitRatioOnRelease,
  DIVIDER_H,
  SPLIT_RATIO_MIN,
  SPLIT_RATIO_MAX,
} from '@/lib/dreamdm/barInteractions';
import type { DMMessage } from '@/lib/dreamdm/useDreamDMMessages';
import { useDreamBarContext, type DreamBarContext } from '@/lib/dreamdm/useDreamBarContext';
import { useDreamSystem, type BarIntentMode } from '@/lib/dreamdm/DreamSystemContext';
import DreamWord from '@/components/ui/DreamWord';
import { getPreferredViewportHeight, isCompactRuntimeViewport } from '@/lib/ui/runtimeViewport';

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
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function DreamDMBar({ onHome, onBothMenus, onHomeDreamSpace, onRuntimeModeChange, onRuntimeBlendChange, onBarInsets, splitRatio, onSplitChange }: DreamDMBarProps) {
  // ── Screen geometry ────────────────────────────────────────────────────────
  const [screenH, setScreenH] = useState(900);
  const [screenW, setScreenW] = useState(1440);
  useEffect(() => {
    const update = () => {
      setScreenH(getPreferredViewportHeight(window.innerHeight, window.visualViewport?.height));
      setScreenW(window.visualViewport?.width ?? window.innerWidth);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
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
  /**
   * goldMinimized — button rests as a thin gold capsule by default.
   * Expands to the full sphere on first touch, auto-minimizes back after
   * the interaction settles (2 s after pointer-up with no new interaction).
   */
  const [goldMinimized, setGoldMinimized] = useState(true);
  const goldMinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // Reveal: cancel any pending minimize timer and expand to full sphere
    if (goldMinTimerRef.current) { clearTimeout(goldMinTimerRef.current); goldMinTimerRef.current = null; }
    setGoldMinimized(false);
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
    // Auto-minimize after 2 s of inactivity
    goldMinTimerRef.current = setTimeout(() => { setGoldMinimized(true); goldMinTimerRef.current = null; }, 2000);
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
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: barIntent.targetPostId, content: text }),
        });
        if (res.ok) {
          setQuickDraft('');
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
            const filename = `${userId}/posts/${Date.now()}-${crypto.randomUUID()}.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filename, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filename);
              mediaUrls.push(publicUrl);
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
    ? (barTop + DIVIDER_H / 2 - GOLD_R)  // centered on the divider
    : (isTop
      ? (barTop + barH - GOLD_R)  // bottom edge of the top bar / panel
      : (barTop - GOLD_R));       // top edge of the bottom bar
  const isGoldOffScreen: boolean = !isDividerMode && !isTop && (barTop - GOLD_R < 0);
  const goldTopPx: number = isGoldOffScreen ? 10 : attachedGoldTop;

  // Track if button is in screen-locked mode (for styling/behavior)
  const isScreenLocked: boolean = isGoldOffScreen;
  const isCompactViewport = isCompactRuntimeViewport(screenW);

  // ── Minimized-mode geometry ───────────────────────────────────────────────
  // When minimized, the capsule is centered on the same Y axis as the full button
  // but only GOLD_MIN_H tall and GOLD_MIN_W wide (a subtle gold pill indicator).
  // The "top" for the capsule should align its center with goldTopPx + GOLD_R.
  const goldCenterY = goldTopPx + GOLD_R;
  const minCapsuleTop = goldCenterY - GOLD_MIN_H / 2;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Gold sphere / capsule button ────────────────────────────────────── */}

      {/* SICC outer glow ring — only when revealed */}
      {!goldMinimized && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            top: goldTopPx - 6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: GOLD_SZ + 12,
            height: GOLD_SZ + 12,
            borderRadius: '50%',
            zIndex: 101,
            pointerEvents: 'none',
            transition: isDragging ? 'none' : `top ${SPRING}, opacity 0.4s ease, width 0.38s cubic-bezier(0.34,1.22,0.64,1), height 0.38s cubic-bezier(0.34,1.22,0.64,1)`,
            background: 'transparent',
            border: goldPressed
              ? '2px solid rgba(42,138,184,0.55)'  // Blue ring on press
              : '1.5px solid rgba(200,152,26,0.22)',
            animation: goldPressed ? 'none' : 'sicc-gold-breathe 3.2s cubic-bezier(0.45,0.05,0.55,0.95) infinite',
            opacity: isScreenLocked ? 0.9 : 0.72,
          }}
        />
      )}

      {/* SICC gold/blue burst ring on press */}
      {goldPressed && !goldMinimized && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            top: goldTopPx - 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: GOLD_SZ + 8,
            height: GOLD_SZ + 8,
            borderRadius: '50%',
            zIndex: 101,
            pointerEvents: 'none',
            border: '2.5px solid rgba(42,138,184,0.65)',
            animation: 'sicc-gold-burst 0.55s ease-out forwards',
          }}
        />
      )}

      <button
        type="button"
        aria-label="Gold button — tap for menus, double-tap to open HomeDream"
        onPointerDown={handleGoldPointerDown}
        onPointerUp={handleGoldPointerUp}
        onPointerCancel={() => {
          goldDragRef.current.active = false;
          setGoldPressed(false);
          // auto-minimize after cancel too
          goldMinTimerRef.current = setTimeout(() => { setGoldMinimized(true); goldMinTimerRef.current = null; }, 2000);
        }}
        style={{
          position: 'fixed',
          // When minimized: center the capsule pill; when revealed: full sphere position
          top: goldMinimized ? minCapsuleTop : goldTopPx,
          left: '50%',
          transform: goldMinimized
            ? 'translateX(-50%)'
            : `translateX(-50%) scale(${goldPressed ? 0.88 : 1})`,
          width:  goldMinimized ? GOLD_MIN_W : GOLD_SZ,
          height: goldMinimized ? GOLD_MIN_H : GOLD_SZ,
          borderRadius: goldMinimized ? 99 : '50%',
          border: 'none',
          cursor: 'pointer',
          zIndex: 102,
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          transition: goldMinimized
            ? (isDragging ? 'none' : `top ${SPRING}, width 0.42s cubic-bezier(0.34,1.22,0.64,1), height 0.42s cubic-bezier(0.34,1.22,0.64,1), border-radius 0.42s ease, opacity 0.3s ease, box-shadow 0.3s ease`)
            : goldPressed
              ? 'transform 0.08s ease, box-shadow 0.1s ease, border 0.08s ease'
              : isDragging
                ? 'none'
                : `top ${SPRING}, transform 0.26s cubic-bezier(0.34,1.6,0.64,1), box-shadow 0.3s ease, width 0.42s cubic-bezier(0.34,1.22,0.64,1), height 0.42s cubic-bezier(0.34,1.22,0.64,1), border-radius 0.42s ease`,
          willChange: 'transform, width, height',
          // Minimized: subtle translucent gold pill
          background: goldMinimized
            ? 'linear-gradient(90deg, rgba(200,152,26,0.45), rgba(232,184,48,0.65), rgba(200,152,26,0.45))'
            : `radial-gradient(circle at 36% 32%,
                #fffde0 0%, #f7e07a 10%, #e8c040 22%, #d4a843 38%, #a16207 65%, #6b3c03 100%)`,
          boxShadow: goldMinimized
            ? '0 1px 6px rgba(200,152,26,0.28)'
            : goldPressed
              ? `inset 0 3px 8px rgba(80,40,0,0.55),
                 inset -2px -2px 10px rgba(80,40,0,0.35),
                 0 2px 8px rgba(100,58,4,0.40),
                 0 0 0 3px rgba(42,138,184,0.55),
                 0 0 20px rgba(42,138,184,0.35)`
              : `inset 0 2px 5px rgba(255,255,220,0.90),
                 inset -3px -3px 12px rgba(80,40,0,0.42),
                 0 8px 32px rgba(100,58,4,0.55),
                 0 2px 12px rgba(212,168,67,0.60),
                 0 0 0 1.5px rgba(180,120,20,0.45),
                 0 0 ${isScreenLocked ? '28px' : '16px'} rgba(200,152,26,${isScreenLocked ? '0.60' : '0.30'})`,
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Contents only shown when revealed */}
        {!goldMinimized && (
          <>
            {/* SICC specular highlight */}
            <span aria-hidden style={{
              position: 'absolute', top: '10%', left: '15%',
              width: '40%', height: '24%', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,255,245,0.72) 0%, rgba(255,255,220,0.22) 100%)',
              filter: 'blur(2.5px)', pointerEvents: 'none',
            }} />
            {/* SICC secondary edge highlight */}
            <span aria-hidden style={{
              position: 'absolute', bottom: '12%', right: '16%',
              width: '22%', height: '14%', borderRadius: '50%',
              background: 'rgba(255,240,180,0.25)',
              filter: 'blur(3px)', pointerEvents: 'none',
            }} />
            {/* Blue inner glow on press */}
            {goldPressed && (
              <span aria-hidden style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle at 50% 50%, rgba(42,138,184,0.22) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
            )}
            <svg width="24" height="12" viewBox="0 0 80 36"
              style={{ opacity: 0.90, flexShrink: 0, position: 'relative', filter: 'drop-shadow(0 0 6px rgba(255,240,180,0.90)) drop-shadow(0 0 14px rgba(200,152,26,0.75)) drop-shadow(0 1px 2px rgba(0,0,0,0.18))', animation: 'sicc-infinity-glow 2.4s ease-in-out infinite' }} aria-hidden>
              <path d="M12 18c8-10 18-10 28 0s20 10 28 0" fill="none" stroke="#fffde0" strokeWidth="6" strokeLinecap="round" />
              <path d="M12 18c8 10 18 10 28 0s20-10 28 0" fill="none" stroke="#fffde0" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </>
        )}
      </button>

      {/* ── DreamDM window ───────────────────────────────────────────────────── */}
      <div
        aria-label="DreamDM Bar"
        className="sicc-bar-edge"
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
          // Divider mode: handle always at top; legacy: handle position depends on snap state
          flexDirection: isDividerMode ? 'column' : (isTop ? 'column-reverse' : 'column'),
          background: isDividerMode
            ? 'linear-gradient(180deg, rgba(245,246,250,0.98) 0%, rgba(240,242,247,0.99) 100%)'
            : 'linear-gradient(180deg, rgba(248,249,253,0.97) 0%, rgba(242,244,249,0.99) 100%)',
          backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          borderTop: isDividerMode ? 'none' : (isTop ? 'none' : 'none'),
          borderBottom: isDividerMode ? 'none' : (isTop ? 'none' : 'none'),
          boxShadow: isDividerMode
            ? `0 4px 24px rgba(0,0,0,0.08), 0 -4px 24px rgba(0,0,0,0.06),
               0 1px 0 rgba(200,152,26,0.18), 0 -1px 0 rgba(200,152,26,0.12),
               inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(255,255,255,0.25)`
            : (isTop
              ? `0 6px 32px rgba(0,0,0,0.12), 0 1px 0 rgba(200,152,26,0.15),
                 inset 0 -1px 0 rgba(255,255,255,0.35)`
              : `0 -6px 32px rgba(0,0,0,0.10), 0 -1px 0 rgba(200,152,26,0.15),
                 inset 0 1px 0 rgba(255,255,255,0.45)`),
        }}
      >
        {/* ── Drag handle ──────────────────────────────────────────────────── */}
        <div
          role="separator" aria-label="Drag to resize DreamDM"
          onPointerDown={isDividerMode ? handleDividerDragStart : handleDragStart}
          onPointerMove={isDividerMode ? handleDividerDragMove : handleDragMove}
          onPointerUp={isDividerMode ? handleDividerDragEnd : handleDragEnd}
          onPointerCancel={isDividerMode ? handleDividerDragEnd : handleDragEnd}
          style={{
            height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none', userSelect: 'none',
            position: 'relative',
          }}
        >
          {/* SICC drag handle — refined dual-line with gold center */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <div style={{
              width: 44, height: 3, borderRadius: 99,
              background: 'linear-gradient(90deg, rgba(200,152,26,0.15), rgba(200,152,26,0.55), rgba(200,152,26,0.15))',
              boxShadow: '0 0 4px rgba(200,152,26,0.15)',
            }} />
            <div style={{
              width: 28, height: 2, borderRadius: 99,
              background: 'linear-gradient(90deg, rgba(42,138,184,0.08), rgba(42,138,184,0.25), rgba(42,138,184,0.08))',
            }} />
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
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
              </div>

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
                  onChange={(e) => setQuickDraft(e.target.value)}
                  onFocus={() => setComposeFocused(true)}
                  onBlur={() => setComposeFocused(false)}
                  onKeyDown={(e) => {
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
