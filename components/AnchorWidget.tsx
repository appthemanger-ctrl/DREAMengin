'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnchorStateBuffer, MODE_HOME, MODE_PROFILE, MODE_SHRUNK, HOLD_IDLE, HOLD_HOLDING, HOLD_FIRED } from '@/lib/navigation/AnchorStateBuffer';
import { NavStateBuffer, LAYER_HOME, LAYER_PROFILE, PROFILE_DEPTH } from '@/lib/navigation/NavStateBuffer';
import { ReturnStack } from '@/lib/navigation/ReturnStack';
import { WidgetInstanceMemory } from '@/lib/navigation/WidgetInstanceMemory';
import { AnchorWidgetStorage } from '@/lib/navigation/AnchorWidgetStorage';

// Constants
const TAP_SLOP = 10; // pixels
const HOLD_THRESHOLD_MS = 420; // milliseconds
const ANCHOR_WIDGET_ID = 'anchor_widget_singleton';

interface AnchorWidgetProps {
  navStateBuffer: NavStateBuffer;
  returnStack: ReturnStack;
  widgetMemory: WidgetInstanceMemory;
  onDreamSelectorOpen?: () => void;
}

/**
 * AnchorWidget - Single persistent widget controlling Home/Profile/Shrunk modes
 * Exists exactly once, never unmounted after auth
 */
export function AnchorWidget({
  navStateBuffer,
  returnStack,
  widgetMemory,
  onDreamSelectorOpen
}: AnchorWidgetProps) {
  // Persistent state buffers (outside React)
  const anchorStateRef = useRef<AnchorStateBuffer>(new AnchorStateBuffer());
  const anchorState = anchorStateRef.current;
  
  // Hit target rect (cached)
  const hitRectRef = useRef({ x0: 0, y0: 0, x1: 0, y1: 0 });
  const dropRectRef = useRef({ x0: 0, y0: 0, x1: 0, y1: 0 });
  
  // Gesture state
  const gestureStateRef = useRef({
    isActive: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    pointerId: -1
  });
  
  // Force re-render when state changes
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate(v => v + 1), []);
  
  // Container ref
  const containerRef = useRef<HTMLDivElement>(null);
  
  /**
   * Update cached rects on mount and resize
   */
  const updateCachedRects = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    hitRectRef.current = {
      x0: rect.left,
      y0: rect.top,
      x1: rect.right,
      y1: rect.bottom
    };
    
    // Drop rect is slightly larger for easier targeting
    const padding = 20;
    dropRectRef.current = {
      x0: rect.left - padding,
      y0: rect.top - padding,
      x1: rect.right + padding,
      y1: rect.bottom + padding
    };
  }, []);
  
  /**
   * Flip HOME -> PROFILE (atomic transaction)
   */
  const flipToProfile = useCallback(() => {
    // 1. Push current NavSnapshot to ReturnStack
    returnStack.push(navStateBuffer.snapshot());
    
    // 2. Set prevMode to HOME
    anchorState.prevMode = MODE_HOME;
    
    // 3. Set mode to PROFILE
    anchorState.mode = MODE_PROFILE;
    
    // 4. Update NavState layer and depth
    navStateBuffer.layer = LAYER_PROFILE;
    navStateBuffer.depth = PROFILE_DEPTH;
    
    // 5. Swap ActiveWidgetIndices to Profile (O(1))
    widgetMemory.switchToProfile();
    
    // 6. Foreground Profile
    anchorState.isOpen = true;
    
    // Trigger UI update
    triggerUpdate();
  }, [anchorState, navStateBuffer, returnStack, widgetMemory, triggerUpdate]);
  
  /**
   * Flip PROFILE -> HOME (atomic transaction)
   */
  const flipToHome = useCallback(() => {
    // 1. Optional: Push NavSnapshot for fast return (skipped for simplicity)
    
    // 2. Set prevMode to PROFILE
    anchorState.prevMode = MODE_PROFILE;
    
    // 3. Set mode to HOME
    anchorState.mode = MODE_HOME;
    
    // 4. Restore NavState to HOME-safe snapshot
    const snapshot = returnStack.popUntilLayer(LAYER_HOME);
    if (snapshot) {
      navStateBuffer.restore(snapshot);
    } else {
      // Clamp to HOME depth
      navStateBuffer.layer = LAYER_HOME;
      navStateBuffer.depth = 0;
    }
    
    // 5. Swap ActiveWidgetIndices to Home (O(1))
    widgetMemory.switchToHome();
    
    // 6. Foreground Home
    anchorState.isOpen = true;
    
    // Trigger UI update
    triggerUpdate();
  }, [anchorState, navStateBuffer, returnStack, widgetMemory, triggerUpdate]);
  
  /**
   * Handle tap behavior
   */
  const handleTap = useCallback(() => {
    const mode = anchorState.mode;
    
    if (mode === MODE_HOME) {
      // Open Home and return to HOME-safe state
      anchorState.isOpen = true;
      
      // Pop ReturnStack until HOME-safe
      const snapshot = returnStack.popUntilLayer(LAYER_HOME);
      if (snapshot) {
        navStateBuffer.restore(snapshot);
      } else {
        navStateBuffer.depth = 0;
      }
    } else if (mode === MODE_PROFILE) {
      // Open Profile and ensure correct layer/depth
      anchorState.isOpen = true;
      if (navStateBuffer.layer !== LAYER_PROFILE || navStateBuffer.depth !== PROFILE_DEPTH) {
        navStateBuffer.layer = LAYER_PROFILE;
        navStateBuffer.depth = PROFILE_DEPTH;
      }
    } else if (mode === MODE_SHRUNK) {
      // Restore previous mode
      anchorState.restoreFromShrunk();
      anchorState.isOpen = true;
      
      // If restoring to PROFILE, ensure correct NavState
      if (anchorState.mode === MODE_PROFILE) {
        navStateBuffer.layer = LAYER_PROFILE;
        navStateBuffer.depth = PROFILE_DEPTH;
      }
    }
    
    triggerUpdate();
  }, [anchorState, navStateBuffer, returnStack, triggerUpdate]);
  
  /**
   * Handle hold behavior (Dream selector)
   */
  const handleHold = useCallback(() => {
    if (anchorState.isOpen) return; // Only fire when closed
    
    anchorState.holdLatch = HOLD_FIRED;
    
    // Open Dream selector overlay
    onDreamSelectorOpen?.();
    
    triggerUpdate();
  }, [anchorState, onDreamSelectorOpen, triggerUpdate]);
  
  /**
   * Pointer down handler
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    
    const gesture = gestureStateRef.current;
    gesture.isActive = true;
    gesture.startX = e.clientX;
    gesture.startY = e.clientY;
    gesture.startTime = Date.now();
    gesture.pointerId = e.pointerId;
    
    // Capture pointer
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
    
    // Start hold detection
    anchorState.holdLatch = HOLD_HOLDING;
    
    // Check for hold after threshold
    setTimeout(() => {
      const elapsed = Date.now() - gesture.startTime;
      if (gesture.isActive && elapsed >= HOLD_THRESHOLD_MS) {
        // Check if pointer is still within anchor
        const dx = Math.abs(e.clientX - gesture.startX);
        const dy = Math.abs(e.clientY - gesture.startY);
        if (dx < TAP_SLOP && dy < TAP_SLOP) {
          handleHold();
        }
      }
    }, HOLD_THRESHOLD_MS);
  }, [anchorState, handleHold]);
  
  /**
   * Pointer up handler
   */
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const gesture = gestureStateRef.current;
    if (!gesture.isActive || gesture.pointerId !== e.pointerId) return;
    
    const dx = Math.abs(e.clientX - gesture.startX);
    const dy = Math.abs(e.clientY - gesture.startY);
    const elapsed = Date.now() - gesture.startTime;
    
    // Recognize tap if:
    // - holdLatch is not FIRED
    // - movement within TAP_SLOP
    // - duration under HOLD_THRESHOLD_MS
    if (
      anchorState.holdLatch !== HOLD_FIRED &&
      dx < TAP_SLOP &&
      dy < TAP_SLOP &&
      elapsed < HOLD_THRESHOLD_MS
    ) {
      handleTap();
    }
    
    // Reset gesture state
    gesture.isActive = false;
    anchorState.holdLatch = HOLD_IDLE;
    
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  }, [anchorState, handleTap]);
  
  /**
   * Pointer cancel handler
   */
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    const gesture = gestureStateRef.current;
    if (gesture.pointerId !== e.pointerId) return;
    
    gesture.isActive = false;
    anchorState.holdLatch = HOLD_IDLE;
    
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  }, [anchorState]);
  
  /**
   * Load persisted state on mount
   */
  useEffect(() => {
    const loadState = async () => {
      const stored = await AnchorWidgetStorage.load();
      if (stored) {
        anchorState.mode = stored.mode;
        anchorState.prevMode = stored.prevMode;
        anchorState.isOpen = stored.isOpen;
        
        if (stored.navSnapshot) {
          navStateBuffer.restore(stored.navSnapshot);
        }
        
        triggerUpdate();
      }
    };
    
    loadState();
  }, [anchorState, navStateBuffer, triggerUpdate]);
  
  /**
   * Update rects on mount and resize
   */
  useEffect(() => {
    updateCachedRects();
    
    const handleResize = () => {
      updateCachedRects();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateCachedRects]);
  
  /**
   * Persist state on changes (idle callback)
   */
  useEffect(() => {
    const saveState = async () => {
      const state = await AnchorWidgetStorage.load() || AnchorWidgetStorage.createInitialState();
      state.mode = anchorState.mode;
      state.prevMode = anchorState.prevMode;
      state.isOpen = anchorState.isOpen;
      state.navSnapshot = navStateBuffer.snapshot();
      
      AnchorWidgetStorage.saveIdle(state);
    };
    
    saveState();
  }, [anchorState.mode, anchorState.prevMode, anchorState.isOpen, navStateBuffer]);
  
  // Render based on current mode
  const modeNames = ['HOME', 'PROFILE', 'SHRUNK'];
  const currentModeName = modeNames[anchorState.mode] || 'UNKNOWN';
  
  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ touchAction: 'none' }}
    >
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-6 py-3 shadow-lg cursor-pointer select-none">
        <div className="flex items-center gap-2 text-white font-semibold">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>{currentModeName}</span>
          {anchorState.isOpen && <span className="text-xs opacity-75">●</span>}
        </div>
      </div>
    </div>
  );
}
