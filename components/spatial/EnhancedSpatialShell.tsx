"use client";

import React, { useEffect, useRef, useState } from 'react';
import { SpatialNavigationEngine } from '@/lib/navigation/SpatialNavigationEngine';
import { WidgetInstanceRecord, WidgetPresentation, WidgetVisibility, WidgetBindingType } from '@/lib/navigation/WidgetInstanceMemory';
import { LAYER_HOME, LAYER_PROFILE } from '@/lib/navigation/NavStateBuffer';
import { Home, User, Layers } from 'lucide-react';

interface EnhancedSpatialShellProps {
  userId: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  initialWidgets?: WidgetInstanceRecord[];
}

/**
 * EnhancedSpatialShell - Gesture-driven navigation shell
 * Replaces traditional nav bar with gesture-based spatial navigation
 */
export default function EnhancedSpatialShell({
  userId,
  handle,
  displayName,
  avatarUrl,
  bio,
  initialWidgets = [],
}: EnhancedSpatialShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SpatialNavigationEngine | null>(null);
  const [navState, setNavState] = useState({ layer: 0, face: 0, slot: -1, depth: 0 });
  const [activeWidgets, setActiveWidgets] = useState<WidgetInstanceRecord[]>([]);
  
  // Initialize engine
  useEffect(() => {
    if (!containerRef.current) return;
    
    const engine = new SpatialNavigationEngine({
      element: document,
      enablePersistence: true,
    });
    
    // Initialize with widgets
    if (initialWidgets.length > 0) {
      engine.getWidgetMemory().initialize(initialWidgets);
    } else {
      // Create default widgets
      const defaultWidgets: WidgetInstanceRecord[] = [
        {
          instanceId: 'home-feed',
          ownerId: userId,
          context: 'HOME',
          transformState: { x: 0, y: 0, scale: 1, rotation: 0 },
          zIndex: 1,
          presentation: WidgetPresentation.FLOATING,
          bindingType: WidgetBindingType.LIVE,
          bindingConfig: { type: 'feed' },
          visibility: WidgetVisibility.ACTIVE,
          internalState: {},
        },
        {
          instanceId: 'profile-info',
          ownerId: userId,
          context: 'PROFILE',
          transformState: { x: 0, y: 0, scale: 1, rotation: 0 },
          zIndex: 1,
          presentation: WidgetPresentation.FLOATING,
          bindingType: WidgetBindingType.STATIC,
          bindingConfig: { type: 'profile_info', handle, displayName, avatarUrl, bio },
          visibility: WidgetVisibility.ACTIVE,
          internalState: {},
        },
      ];
      engine.getWidgetMemory().initialize(defaultWidgets);
    }
    
    // Listen to navigation changes
    const handleNavChange = (data: any) => {
      const snapshot = data.state as Int32Array;
      setNavState({
        layer: snapshot[0],
        face: snapshot[1],
        slot: snapshot[2],
        depth: snapshot[3],
      });
      
      // Update active widgets based on layer
      if (snapshot[0] === LAYER_HOME) {
        engine.getWidgetMemory().switchToHome();
      } else if (snapshot[0] === LAYER_PROFILE) {
        engine.getWidgetMemory().switchToProfile();
      }
      
      setActiveWidgets(engine.getWidgetMemory().getActiveWidgetsSorted());
    };
    
    engine.on('navchange', handleNavChange);
    engine.restore();
    engine.start();
    
    engineRef.current = engine;
    setActiveWidgets(engine.getWidgetMemory().getActiveWidgetsSorted());
    
    return () => {
      engine.stop();
      engine.off('navchange', handleNavChange);
    };
  }, [userId, handle, displayName, avatarUrl, bio, initialWidgets]);
  
  // Apply transforms on state change
  useEffect(() => {
    if (!engineRef.current || !containerRef.current) return;
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    
    engineRef.current.applyTransform(containerRef.current, viewport);
  }, [navState]);
  
  const layerNames = ['HOME', 'CUBE', 'PROFILE', 'WIDGET', 'DREAM'];
  const currentLayer = layerNames[navState.layer] || navState.layer;
  
  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Status Bar (top) */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{currentLayer}</span>
            <span className="text-xs text-muted-foreground">
              · Depth {navState.depth}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => engineRef.current?.homeAnchorInterrupt()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Go Home"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div
        ref={containerRef}
        className="absolute inset-0 pt-12 pb-16 transition-transform duration-300 ease-out"
        style={{
          willChange: 'transform',
          contain: 'paint layout',
        }}
      >
        <div className="relative w-full h-full">
          {activeWidgets.length > 0 ? (
            activeWidgets.map((widget) => (
              <div
                key={widget.instanceId}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translate(${widget.transformState.x}px, ${widget.transformState.y}px) scale(${widget.transformState.scale})`,
                  zIndex: widget.zIndex,
                  willChange: 'transform',
                  opacity: widget.presentation === WidgetPresentation.FULL ? 1 : 0.95,
                }}
              >
                <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full mx-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">{widget.instanceId}</h2>
                    <p className="text-muted-foreground mb-4">{widget.context} Space</p>
                    <div className="text-sm text-muted-foreground">
                      <div>Presentation: {widget.presentation}</div>
                      <div>Z-Index: {widget.zIndex}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">👆</div>
                <div className="text-xl font-bold">Touch to Navigate</div>
                <div className="text-sm mt-2">Pinch, swipe, or hold</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Gesture Hint (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around px-4 py-3 text-xs text-muted-foreground">
          <div className="flex flex-col items-center">
            <span>📱 Pinch</span>
            <span className="opacity-60">Zoom</span>
          </div>
          <div className="flex flex-col items-center">
            <span>👆 Swipe</span>
            <span className="opacity-60">Rotate</span>
          </div>
          <div className="flex flex-col items-center">
            <span>✋ Hold</span>
            <span className="opacity-60">Action</span>
          </div>
        </div>
      </div>
    </div>
  );
}
