'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnchorWidget } from './AnchorWidget';
import { HomeSpace } from './HomeSpace';
import { ProfileSpace } from './ProfileSpace';
import { ShrunkMode } from './ShrunkMode';
import { NavStateBuffer, LAYER_HOME, LAYER_PROFILE } from '@/lib/navigation/NavStateBuffer';
import { ReturnStack } from '@/lib/navigation/ReturnStack';
import { WidgetInstanceMemory } from '@/lib/navigation/WidgetInstanceMemory';
import { AnchorStateBuffer, MODE_HOME, MODE_PROFILE, MODE_SHRUNK } from '@/lib/navigation/AnchorStateBuffer';
import { AnchorWidgetStorage, type AnchorWidgetState } from '@/lib/navigation/AnchorWidgetStorage';
import { widgetEventBus, type WidgetMsg } from '@/lib/widgets/WidgetEventBus';
import { WidgetLinkGraph } from '@/lib/widgets/WidgetLinkGraph';
import { generateMockWidgetInstances } from '@/lib/navigation/mockWidgetData';

/**
 * AnchorWidgetOrchestrator - Main controller for anchor widget system
 * Manages navigation, widget state, and mode transitions
 */
export function AnchorWidgetOrchestrator() {
  // Initialize persistent state buffers
  const navStateRef = useRef(new NavStateBuffer());
  const returnStackRef = useRef(new ReturnStack());
  const widgetMemoryRef = useRef(new WidgetInstanceMemory());
  const anchorStateRef = useRef(new AnchorStateBuffer());
  const linkGraphRef = useRef(new WidgetLinkGraph());
  
  // Local state for UI updates
  const [anchorState, setAnchorState] = useState<AnchorWidgetState | null>(null);
  const [currentMode, setCurrentMode] = useState(MODE_HOME);
  const [anchorRect, setAnchorRect] = useState({ x0: 0, y0: 0, x1: 0, y1: 0 });
  const [, forceUpdate] = useState(0);
  
  /**
   * Initialize state from storage
   */
  useEffect(() => {
    const init = async () => {
      const stored = await AnchorWidgetStorage.load();
      const state = stored || AnchorWidgetStorage.createInitialState();
      
      setAnchorState(state);
      setCurrentMode(state.mode);
      
      // Initialize anchor state buffer
      anchorStateRef.current.mode = state.mode;
      anchorStateRef.current.prevMode = state.prevMode;
      anchorStateRef.current.isOpen = state.isOpen;
      
      // Restore nav state if available
      if (state.navSnapshot) {
        navStateRef.current.restore(state.navSnapshot);
      }
      
      // Initialize widget memory with mock data
      widgetMemoryRef.current.initialize(generateMockWidgetInstances());
    };
    
    init();
  }, []);
  
  /**
   * Handle mode changes
   */
  useEffect(() => {
    if (!anchorState) return;
    
    const mode = anchorStateRef.current.mode;
    if (mode !== currentMode) {
      setCurrentMode(mode);
      
      // Update storage
      const newState = { ...anchorState, mode };
      setAnchorState(newState);
      AnchorWidgetStorage.saveIdle(newState);
    }
  }, [anchorState, currentMode]);
  
  /**
   * Handle Dream selector open
   */
  const handleDreamSelectorOpen = useCallback(() => {
    console.log('Dream selector opened');
    // Implement dream selector overlay logic here
  }, []);
  
  /**
   * Handle home slot tap
   */
  const handleSlotTap = useCallback((slotIndex: number) => {
    console.log('Slot tapped:', slotIndex);
    // Implement slot action sheet here
  }, []);
  
  /**
   * Handle home slot update
   */
  const handleSlotUpdate = useCallback((slotIndex: number, widgetId: string | null) => {
    if (!anchorState) return;
    
    AnchorWidgetStorage.setSlotWidget(anchorState, slotIndex, widgetId);
    AnchorWidgetStorage.saveIdle(anchorState);
    forceUpdate(v => v + 1);
  }, [anchorState]);
  
  /**
   * Handle widget focus in profile
   */
  const handleWidgetFocus = useCallback((widgetId: string) => {
    console.log('Widget focused:', widgetId);
    
    if (anchorState) {
      AnchorWidgetStorage.updatePriorities(anchorState, widgetId);
      AnchorWidgetStorage.saveIdle(anchorState);
      forceUpdate(v => v + 1);
    }
  }, [anchorState]);
  
  /**
   * Handle widget close from drag-to-anchor
   */
  const handleWidgetClose = useCallback((widgetId: string) => {
    console.log('Widget closed:', widgetId);
    
    // Transition widget to prior state (e.g., DOCKED or HOME slot)
    // For now, just log the event
    widgetEventBus.send(
      'anchor_widget',
      widgetId,
      100, // CLOSE type
      { widgetId }
    );
  }, []);
  
  /**
   * Handle priority widget selection
   */
  const handlePriorityWidgetSelect = useCallback((widgetId: string) => {
    console.log('Priority widget selected:', widgetId);
    
    // Request focus for the widget
    widgetEventBus.send(
      'anchor_widget',
      widgetId,
      1, // FOCUS_REQUEST type
      { widgetId }
    );
    
    // Engine will decide if this implies NAV_ZOOM_IN
  }, []);
  
  if (!anchorState) {
    return null; // Loading
  }
  
  const activeWidgets = widgetMemoryRef.current.getActiveWidgets();
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Main surface based on mode */}
      <div className="absolute inset-0 pointer-events-auto">
        {currentMode === MODE_HOME && anchorStateRef.current.isOpen && (
          <HomeSpace
            homeSlots={anchorState.homeSlots}
            onSlotTap={handleSlotTap}
            onSlotUpdate={handleSlotUpdate}
          />
        )}
        
        {currentMode === MODE_PROFILE && anchorStateRef.current.isOpen && (
          <ProfileSpace
            widgets={activeWidgets}
            onWidgetFocus={handleWidgetFocus}
            onWidgetClose={handleWidgetClose}
            anchorRect={anchorRect}
          />
        )}
        
        {currentMode === MODE_SHRUNK && (
          <ShrunkMode
            priorityWidgets={anchorState.priorityWidgets}
            onWidgetSelect={handlePriorityWidgetSelect}
          />
        )}
      </div>
      
      {/* Anchor widget (always present) */}
      <div className="pointer-events-auto">
        <AnchorWidget
          navStateBuffer={navStateRef.current}
          returnStack={returnStackRef.current}
          widgetMemory={widgetMemoryRef.current}
          onDreamSelectorOpen={handleDreamSelectorOpen}
          onRectUpdate={setAnchorRect}
        />
      </div>
    </div>
  );
}
