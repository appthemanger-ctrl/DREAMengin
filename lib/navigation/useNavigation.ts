// useNavigation - React hook for spatial navigation engine
// Mobile-optimized integration with React

import { useEffect, useRef, useState, useCallback } from 'react';
import { SpatialNavigationEngine } from './SpatialNavigationEngine';
import type { WidgetInstanceRecord } from './WidgetInstanceMemory';

export interface UseNavigationOptions {
  enablePersistence?: boolean;
  widgets?: WidgetInstanceRecord[];
}

export interface NavigationState {
  layer: number;
  face: number;
  slot: number;
  depth: number;
}

/**
 * useNavigation - React hook for gesture-driven navigation
 */
export function useNavigation(options: UseNavigationOptions = {}) {
  const engineRef = useRef<SpatialNavigationEngine | null>(null);
  const [navState, setNavState] = useState<NavigationState>({
    layer: 0,
    face: 0,
    slot: -1,
    depth: 0,
  });
  const [isReady, setIsReady] = useState(false);
  
  // Initialize engine
  useEffect(() => {
    const engine = new SpatialNavigationEngine({
      element: document,
      enablePersistence: options.enablePersistence,
    });
    
    // Initialize widgets if provided
    if (options.widgets) {
      engine.getWidgetMemory().initialize(options.widgets);
    }
    
    // Restore persisted state
    if (options.enablePersistence) {
      engine.restore();
    }
    
    // Listen to nav changes
    const handleNavChange = (data: any) => {
      const snapshot = data.state as Int32Array;
      setNavState({
        layer: snapshot[0],
        face: snapshot[1],
        slot: snapshot[2],
        depth: snapshot[3],
      });
    };
    
    engine.on('navchange', handleNavChange);
    
    // Start engine
    engine.start();
    engineRef.current = engine;
    setIsReady(true);
    
    return () => {
      engine.stop();
      engine.off('navchange', handleNavChange);
    };
  }, [options.enablePersistence]);
  
  // Update widgets when they change
  useEffect(() => {
    if (engineRef.current && options.widgets) {
      engineRef.current.getWidgetMemory().initialize(options.widgets);
    }
  }, [options.widgets]);
  
  // Home anchor interrupt
  const goHome = useCallback(() => {
    engineRef.current?.homeAnchorInterrupt();
  }, []);
  
  // Switch to profile
  const switchToProfile = useCallback(() => {
    engineRef.current?.getWidgetMemory().switchToProfile();
  }, []);
  
  // Switch to home
  const switchToHome = useCallback(() => {
    engineRef.current?.getWidgetMemory().switchToHome();
  }, []);
  
  // Get active widgets
  const getActiveWidgets = useCallback(() => {
    return engineRef.current?.getWidgetMemory().getActiveWidgets() || [];
  }, []);
  
  return {
    navState,
    isReady,
    engine: engineRef.current,
    goHome,
    switchToProfile,
    switchToHome,
    getActiveWidgets,
  };
}
