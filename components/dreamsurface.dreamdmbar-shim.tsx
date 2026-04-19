'use client';

import React, { useEffect, useRef, useState, useCallback, useOptimistic } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { X, Send, ImageIcon, Loader2, MessageCircle, Search, Bot, Gamepad2, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkipCreditBalance } from '@/components/ads/SkipCreditBalance';

// ============================================================================
// CONFIG
// ============================================================================
const BAR_H = 80;
const TOP_H = 340;
const NAV_H = 52;
const GOLD_SZ = 60;
const GOLD_R = GOLD_SZ / 2;
const SNAP_DOWN_PX = 88;
const EXPAND_THRESHOLD = 80;
const ORB_SIZE = 44;
const ORB_TAP_SLOP = 10;
const DOUBLE_TAP_WINDOW_MS = 300;
const GOLD_LONG_PRESS_MS = 500;
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// ============================================================================
// TYPES
// ============================================================================
type IntentMode = 'default' | 'comment' | 'message' | 'search' | 'dreams' | 'game';
interface Intent {
  mode: IntentMode;
  targetId?: string;
  targetLabel?: string;
}

// ============================================================================
// STORES
// ============================================================================
type BarMode = 'bottom' | 'top-compact' | 'top-expanded';

interface BarState {
  mode: BarMode; height: number; slideDown: number;
  isMinimized: boolean; isDragging: boolean; barTouched: boolean; composeFocused: boolean;
  keyboardOffset: number; screenH: number; screenW: number;
  firstTimeLight: boolean; lightTooltip: string | null; unreadCount: number;
  setMode: (m: BarMode) => void; setHeight: (h: number) => void; setSlideDown: (v: number) => void;
  setIsMinimized: (v: boolean) => void; setIsDragging: (v: boolean) => void; setBarTouched: (v: boolean) => void;
  setComposeFocused: (v: boolean) => void; setKeyboardOffset: (o: number) => void;
  setScreenDimensions: (w: number, h: number) => void; setFirstTimeLight: (v: boolean) => void;
  setLightTooltip: (m: string | null) => void; setUnreadCount: (c: number) => void;
  resetToBottom: () => void; minimize: () => void; expandFromMinimized: () => void;
  snapToTopCompact: () => void; snapToTopExpanded: () => void;
}

const useBarStore = create<BarState>((set) => ({
  mode: 'bottom', height: BAR_H, slideDown: 0, isMinimized: false, isDragging: false,
  barTouched: false, composeFocused: false, keyboardOffset: 0, screenH: 900, screenW: 1440,
  firstTimeLight: false, lightTooltip: null, unreadCount: 0,
  setMode: (m) => set({ mode: m }), setHeight: (h) => set({ height: h }), setSlideDown: (v) => set({ slideDown: v }),
  setIsMinimized: (v) => set({ isMinimized: v }), setIsDragging: (v) => set({ isDragging: v }),
  setBarTouched: (v) => set({ barTouched: v }), setComposeFocused: (v) => set({ composeFocused: v }),
  setKeyboardOffset: (o) => set({ keyboardOffset: o }), setScreenDimensions: (w, h) => set({ screenW: w, screenH: h }),
  setFirstTimeLight: (v) => set({ firstTimeLight: v }), setLightTooltip: (m) => set({ lightTooltip: m }),
  setUnreadCount: (c) => set({ unreadCount: c }),
  resetToBottom: () => set({ mode: 'bottom', height: BAR_H, slideDown: 0, isMinimized: false }),
  minimize: () => set({ isMinimized: true, mode: 'bottom', height: BAR_H, slideDown: 0 }),
  expandFromMinimized: () => set({ isMinimized: false, mode: 'bottom', height: BAR_H, slideDown: 0 }),
  snapToTopCompact: () => set({ mode: 'top-compact', height: NAV_H, slideDown: 0 }),
  snapToTopExpanded: () => set({ mode: 'top-expanded', height: TOP_H, slideDown: 0 }),
}));

interface IntentState {
  intent: Intent;
  setIntent: (intent: Partial<Intent>) => void;
  clearIntent: () => void;
}

const useIntentStore = create<IntentState>((set) => ({
  intent: { mode: 'default' },
  setIntent: (intent) => set((state) => ({ intent: { ...state.intent, ...intent } })),
  clearIntent: () => set({ intent: { mode: 'default' } }),
}));

interface DraftState {
  draft: string; files: File[]; previews: string[]; isSending: boolean; error: string | null;
  setDraft: (text: string) => void; addFile: (file: File) => void; removeFile: (index: number) => void;
  clearFiles: () => void; setIsSending: (v: boolean) => void; setError: (e: string | null) => void; reset: () => void;
}

const useDraftStore = create<DraftState>((set) => ({
  draft: '', files: [], previews: [], isSending: false, error: null,
  setDraft: (draft) => set({ draft }),
  addFile: (file) => set((state) => {
    const url = URL.createObjectURL(file);
    return { files: [...state.files, file], previews: [...state.previews, url] };
  }),
  removeFile: (index) => set((state) => {
    const newFiles = [...state.files]; const newPreviews = [...state.previews];
    newFiles.splice(index, 1); const removed = newPreviews.splice(index, 1)[0];
    if (removed) URL.revokeObjectURL(removed);
    return { files: newFiles, previews: newPreviews };
  }),
  clearFiles: () => set((state) => { state.previews.forEach(URL.revokeObjectURL); return { files: [], previews: [] }; }),
  setIsSending: (isSending) => set({ isSending }),
  setError: (error) => set({ error }),
  reset: () => set((state) => { state.previews.forEach(URL.revokeObjectURL); return { draft: '', files: [], previews: [], isSending: false, error: null }; }),
}));

// ============================================================================
// HOOKS
// ============================================================================
function useKeyboard() {
  const setScreen = useBarStore((s) => s.setScreenDimensions);
  const setKbOffset = useBarStore((s) => s.setKeyboardOffset);
  useEffect(() => {
    const update = () => {
      const innerH = window.innerHeight; const vv = window.visualViewport;
      const screenH = vv ? vv.height : innerH; const screenW = vv ? vv.width : window.innerWidth;
      const kbOffset = Math.max(0, innerH - (vv?.height ?? innerH) - (vv?.offsetTop ?? 0));
      setScreen(screenW, screenH); setKbOffset(kbOffset);
    };
    update(); window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [setScreen, setKbOffset]);
}

function useMinimizedOrb() {
  const bar = useBarStore();
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0, moved: false });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startPosX: rect.left, startPosY: rect.top, moved: false };
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX; const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > ORB_TAP_SLOP || Math.abs(dy) > ORB_TAP_SLOP) dragRef.current.moved = true;
    if (dragRef.current.moved) {
      setPosition({ x: Math.max(0, Math.min(bar.screenW - ORB_SIZE, dragRef.current.startPosX + dx)), y: Math.max(0, Math.min(bar.screenH - ORB_SIZE, dragRef.current.startPosY + dy)) });
    }
  }, [bar.screenW, bar.screenH]);
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return; const wasDragged = dragRef.current.moved; dragRef.current.active = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!wasDragged) { bar.expandFromMinimized(); bar.setBarTouched(true); }
  }, [bar]);
  return { position, handlers: { onPointerDown, onPointerMove, onPointerUp } };
}

// ============================================================================
// COMPONENTS
// ============================================================================
function GlowingLight({ isDragging, isCollapsed, firstTime, tooltip }: { isDragging?: boolean; isCollapsed?: boolean; firstTime?: boolean; tooltip?: string | null }) {
  const size = isCollapsed ? 14 : 10;
  return (
    <span className="relative inline-flex items-center justify-center w-11 h-11 cursor-pointer touch-none">
      <span className={cn("block rounded-full transition-all duration-300", firstTime && "animate-pulse")}
        style={{ width: size, height: size, background: `radial-gradient(ellipse at center, rgba(255,215,64,0.85) 0%, rgba(232,184,48,0.5) 35%, rgba(200,152,26,0.2) 65%, transparent 100%)`, boxShadow: isDragging ? '0 0 24px 8px rgba(255,215,64,0.85)' : '0 0 14px 6px rgba(255,215,64,0.6)', filter: `blur(${isDragging ? 2 : 3}px)` }} />
      {tooltip && <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800/90 text-white text-[11px] font-semibold rounded-lg whitespace-nowrap">{tooltip}</span>}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DreamDMBar({ onHome, onBothMenus }: { onHome: () => void; onBothMenus: () => void }) {
  const bar = useBarStore();
  const intent = useIntentStore();
  const draft = useDraftStore();
  const minimized = useMinimizedOrb();
  useKeyboard();

  // Local state
  const [lightPos, setLightPos] = useState<'bottom' | 'middle' | 'top'>('bottom');
  const [particles, setParticles] = useState<{ id: string; x: number; y: number; vx: number; vy: number; size: number; color: string }[]>([]);

  // Stream 3.2 — useOptimistic for DM message sends (React 19)
  // Optimistic messages appear instantly before API confirmation.
  // docs/ARCHITECTURE.md §10 — intentional, responsive interactions.
  type SentMessage = { id: string; text: string; files: number; mode: IntentMode; status: 'sending' | 'sent' | 'error' };
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state: SentMessage[], newMsg: SentMessage) => [...state, newMsg],
  );
  const particleCenter = useRef({ x: 0, y: 0 });
  const barTouchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lightTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Motion
  const dragY = useMotionValue(0);
  const barHeight = useTransform(dragY, (y) => {
    if (bar.mode === 'bottom') return Math.max(BAR_H, Math.min(bar.screenH * 0.85, bar.height - y));
    if (bar.mode === 'top-compact') return Math.max(NAV_H, Math.min(TOP_H, bar.height + y));
    return bar.height;
  });

  // First-time discovery
  useEffect(() => {
    try { if (!localStorage.getItem('de-light')) { bar.setFirstTimeLight(true); bar.setLightTooltip('drag to move, tap to open'); localStorage.setItem('de-light', '1'); setTimeout(() => { bar.setLightTooltip(null); bar.setFirstTimeLight(false); }, 3000); } } catch { }
  }, []);

  // Reveal bar on touch
  const revealBar = useCallback(() => {
    bar.setBarTouched(true);
    if (barTouchTimer.current) clearTimeout(barTouchTimer.current);
    barTouchTimer.current = setTimeout(() => bar.setBarTouched(false), 3000);
  }, [bar]);

  // Drag handlers
  const handleDragStart = useCallback(() => { bar.setIsDragging(true); revealBar(); }, [bar, revealBar]);
  const handleDragEnd = useCallback(() => {
    const finalY = dragY.get(); const finalH = barHeight.get(); dragY.set(0);
    if (bar.mode === 'bottom') {
      if (bar.screenH - finalH < bar.screenH * 0.4 || finalH > bar.screenH * 0.6) bar.snapToTopCompact();
      else bar.setHeight(BAR_H);
    } else if (bar.mode === 'top-compact') {
      if (finalH > NAV_H + EXPAND_THRESHOLD) bar.snapToTopExpanded();
      else bar.setHeight(NAV_H);
    } else if (bar.mode === 'top-expanded') {
      if (finalY > SNAP_DOWN_PX) bar.resetToBottom();
      else bar.setSlideDown(0);
    }
    bar.setIsDragging(false);
  }, [bar, dragY, barHeight]);

  // Light tap/double-tap
  const handleLightTap = useCallback(() => {
    if (lightTapTimer.current) {
      clearTimeout(lightTapTimer.current);
      lightTapTimer.current = null;
      navigator.vibrate?.([6, 40, 6]);
      onHome();
      setLightPos('bottom');
      bar.resetToBottom();
    }
    else {
      lightTapTimer.current = setTimeout(() => {
        navigator.vibrate?.(4);
        const next: 'bottom' | 'middle' | 'top' = lightPos === 'bottom' ? 'middle' : lightPos === 'middle' ? 'top' : 'bottom';
        setLightPos(next);
        if (next === 'bottom') bar.resetToBottom();
        else if (next === 'middle') {
          bar.setMode('bottom');
          bar.setHeight(Math.round(bar.screenH * 0.5));
        } else bar.snapToTopCompact();
        lightTapTimer.current = null;
      }, DOUBLE_TAP_WINDOW_MS);
    }
  }, [lightPos, onHome, bar]);

  // Long press particles
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onGoldPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    particleCenter.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    longPressTimer.current = setTimeout(() => { setParticles(Array.from({ length: 20 }, (_, i) => ({ id: `p-${Date.now()}-${i}`, x: 0, y: 0, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 1) * 2, size: Math.random() * 6 + 4, color: `hsl(${Math.random() * 60 + 30}, 80%, 60%)` }))); setTimeout(() => setParticles([]), 1000); }, GOLD_LONG_PRESS_MS);
  }, []);
  const onGoldPointerUp = useCallback(() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }, []);

  // Send action — optimistic update fires before API call
  const handleSend = useCallback(async () => {
    const text = draft.draft.trim(); if (!text && draft.files.length === 0) return;
    const newMsg: SentMessage = {
      id: `msg-${Date.now()}`,
      text,
      files: draft.files.length,
      mode: intent.intent.mode,
      status: 'sending',
    };
    // Optimistic update: message appears immediately in the list
    addOptimisticMessage(newMsg);
    draft.setIsSending(true);
    try {
      // Simulate API call based on intent
      await new Promise(r => setTimeout(r, 500));
      console.log(`[DreamDM] Sending ${intent.intent.mode}:`, text, draft.files);
      // Commit to base state once API confirms
      setMessages(prev => [...prev, { ...newMsg, status: 'sent' }]);
      draft.reset(); intent.clearIntent();
    } catch {
      setMessages(prev => [...prev, { ...newMsg, status: 'error' }]);
      draft.setError('Failed to send');
    }
    finally { draft.setIsSending(false); }
  }, [draft, intent, addOptimisticMessage]);

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); files.slice(0, 5 - draft.files.length).forEach(f => draft.addFile(f));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Render minimized orb
  if (bar.isMinimized) {
    const style = minimized.position ? { left: minimized.position.x, top: minimized.position.y } : { right: 20, bottom: 20 + bar.keyboardOffset };
    return <div {...minimized.handlers} className="fixed z-[200] w-11 h-11 flex items-center justify-center touch-none" style={style}><GlowingLight isCollapsed firstTime={bar.firstTimeLight} tooltip={bar.lightTooltip} /></div>;
  }

  const showExpanded = bar.mode === 'top-expanded' || bar.height > 180;
  const barTop = bar.mode === 'bottom' ? bar.screenH - bar.height : bar.mode === 'top-expanded' ? bar.slideDown : 0;
  const isResting = bar.mode === 'bottom' && !bar.isDragging && !bar.composeFocused && bar.height <= BAR_H && !bar.barTouched;

  return (
    <>
      <motion.div
        className={cn("fixed left-0 right-0 z-[100] pointer-events-auto overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-white/97 to-gray-50/99", isResting && "opacity-0")}
        style={{ top: barTop, height: showExpanded ? TOP_H : bar.height, y: dragY, transition: bar.isDragging ? 'none' : 'all 0.46s cubic-bezier(0.34,1.22,0.64,1)', transform: bar.composeFocused && bar.keyboardOffset ? `translateY(-${bar.keyboardOffset}px)` : undefined, boxShadow: isResting ? 'none' : '0 -6px 32px rgba(0,0,0,0.1)' }}
        drag="y"
        dragConstraints={{ top: -bar.screenH, bottom: bar.screenH }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={revealBar}
      >
        {/* Drag handle (visible indicator) */}
        <div className="h-7 flex items-center justify-center flex-shrink-0 pointer-events-none">
          <div className="w-12 h-1 bg-gray-300/50 rounded-full" />
        </div>

        {/* Glowing light (attached to bar top/bottom) */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: bar.mode === 'bottom' ? -GOLD_R : undefined, bottom: bar.mode !== 'bottom' ? -GOLD_R : undefined }}>
          <div onPointerDown={onGoldPointerDown} onPointerUp={onGoldPointerUp} onClick={handleLightTap}>
            <GlowingLight isDragging={bar.isDragging} firstTime={bar.firstTimeLight} tooltip={bar.lightTooltip} />
          </div>
        </div>

        {showExpanded ? (
          // Expanded panel — shows optimistic message list (Stream 3.2)
          <div className="flex-1 p-4 overflow-y-auto">
            {optimisticMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">Your messages will appear here.</p>
            ) : (
              <div className="space-y-2">
                {optimisticMessages.map(m => (
                  <div key={m.id} className={cn('flex items-start gap-2 rounded-lg p-2 bg-white/60', m.status === 'sending' && 'opacity-60')}>
                    <div className="flex-1 text-sm text-gray-800">{m.text || `[${m.files} file(s)]`}</div>
                    {m.status === 'sending' && <Loader2 className="w-3 h-3 animate-spin text-gray-400 flex-shrink-0 mt-0.5" />}
                    {m.status === 'error' && <span className="text-red-500 text-[10px] flex-shrink-0">Failed</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Compact bar
          <div className="flex flex-col gap-1 px-3 pb-safe justify-end">
            {/* Top row: notifications + intent indicator + mode buttons + close */}
            <div className="flex items-center gap-1">
              <div className="relative"><Bell className={cn("w-4 h-4", bar.unreadCount > 0 ? "text-amber-500" : "text-gray-400")} />{bar.unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] px-1 rounded-full">{bar.unreadCount}</span>}</div>
              {intent.intent.mode !== 'default' && (
                <div className="flex items-center gap-1 bg-blue-500/10 rounded-full px-2 py-0.5 text-xs text-blue-600">
                  {intent.intent.mode === 'comment' && <MessageCircle className="w-3 h-3" />}
                  {intent.intent.mode === 'search' && <Search className="w-3 h-3" />}
                  {intent.intent.mode === 'dreams' && <Bot className="w-3 h-3" />}
                  {intent.intent.mode === 'game' && <Gamepad2 className="w-3 h-3" />}
                  <span className="truncate max-w-[80px]">{intent.intent.targetLabel || intent.intent.mode}</span>
                  <button onClick={intent.clearIntent}><X className="w-3 h-3" /></button>
                </div>
              )}
              <div className="flex-1" />
              <SkipCreditBalance />
              <button onClick={() => bar.minimize()} className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-500" /></button>
            </div>

            {/* Quick reactions (comment mode) */}
            {intent.intent.mode === 'comment' && (
              <div className="flex gap-1 py-1">{QUICK_REACTIONS.map(e => <button key={e} onClick={() => draft.setDraft(draft.draft + e)} className="w-7 h-7 bg-white/70 border border-gray-200 rounded-full text-base">{e}</button>)}</div>
            )}

            {/* Media previews */}
            {draft.files.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-1">{draft.previews.map((url, i) => <div key={i} className="relative w-16 h-16"><img src={url} alt="preview" className="w-full h-full object-cover rounded-lg" /><button onClick={() => draft.removeFile(i)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white"><X className="w-3 h-3" /></button></div>)}</div>
            )}

            {/* Compose row */}
            <div className="flex items-end gap-2">
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} hidden />
              <button onClick={() => fileInputRef.current?.click()} disabled={draft.files.length >= 5} className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-500" /></button>
              <textarea ref={textareaRef} value={draft.draft} onChange={e => draft.setDraft(e.target.value)} onFocus={() => bar.setComposeFocused(true)} onBlur={() => bar.setComposeFocused(false)} placeholder={intent.intent.mode === 'comment' ? 'Add a comment...' : intent.intent.mode === 'search' ? 'Search...' : intent.intent.mode === 'dreams' ? 'Ask Dr. Eams...' : intent.intent.mode === 'game' ? 'Enter game engine...' : 'What\'s on your mind?'} className="flex-1 resize-none overflow-hidden bg-white/50 border border-gray-300/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-amber-500/60" rows={1} />
              {(draft.draft.trim() || draft.files.length > 0) && <button onClick={handleSend} disabled={draft.isSending} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-blue-500 text-white"><Send className="w-4 h-4" /></button>}
            </div>
          </div>
        )}
      </motion.div>

      {/* Particles */}
      <AnimatePresence>{particles.map(p => <motion.div key={p.id} initial={{ x: particleCenter.current.x, y: particleCenter.current.y, opacity: 1 }} animate={{ x: particleCenter.current.x + p.vx * 60, y: particleCenter.current.y + p.vy * 60, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute rounded-full pointer-events-none z-[200]" style={{ width: p.size, height: p.size, background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />)}</AnimatePresence>
    </>
  );
}
