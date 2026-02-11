"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SpatialNavigationEngine } from '@/lib/navigation/SpatialNavigationEngine';
import { WidgetInstanceRecord, WidgetPresentation, WidgetVisibility, WidgetBindingType } from '@/lib/navigation/WidgetInstanceMemory';
import { LAYER_HOME, LAYER_PROFILE } from '@/lib/navigation/NavStateBuffer';
import { Home } from 'lucide-react';
import PixiPhysicsLayer from '@/components/spatial/PixiPhysicsLayer';

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
  
  // Memoize widgets to prevent reinitialization
  const widgets = useMemo(() => {
    if (initialWidgets.length > 0) {
      return initialWidgets;
    }
    
    // Create default widgets
    return [
      {
        instanceId: 'home-feed',
        ownerId: userId,
        context: 'HOME' as const,
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
        context: 'PROFILE' as const,
        transformState: { x: 0, y: 0, scale: 1, rotation: 0 },
        zIndex: 1,
        presentation: WidgetPresentation.FLOATING,
        bindingType: WidgetBindingType.STATIC,
        bindingConfig: { type: 'profile_info', handle, displayName, avatarUrl, bio },
        visibility: WidgetVisibility.ACTIVE,
        internalState: {},
      },
    ];
  }, [userId, handle, displayName, avatarUrl, bio, initialWidgets]);
  
  // Initialize engine
  useEffect(() => {
    if (!containerRef.current) return;
    
    const engine = new SpatialNavigationEngine({
      element: document,
      enablePersistence: true,
    });
    
    // Initialize with widgets
    engine.getWidgetMemory().initialize(widgets);
    
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
    
    return (
    <div className="fixed inset-0 bg-background overflow-hidden" style={{ touchAction: "none" }}>
      <PixiPhysicsLayer
        worldWidth={5000}
        worldHeight={5000}
        onTransform={(t) => {
          if (!containerRef.current) return;
          containerRef.current.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale3d(${t.scale}, ${t.scale}, 1)`;
        }}
      />

      <div className="absolute inset-0 z-10">
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{
            willChange: "transform",
            contain: "layout paint",
            transform: "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
          }}
        >
          <div className="relative w-full h-full">
            {activeWidgets.length > 0 ? (
              activeWidgets.map((widget) => (
                <div
                  key={widget.instanceId}
                  className="absolute top-0 left-0"
                  style={{
                    transform: `translate3d(${widget.transformState.x}px, ${widget.transformState.y}px, 0) scale3d(${widget.transformState.scale}, ${widget.transformState.scale}, 1)`,
                    zIndex: widget.zIndex,
                    willChange: "transform",
                    opacity: widget.presentation === WidgetPresentation.FULL ? 1 : 0.95,
                  }}
                >
                  <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-[min(92vw,768px)]">
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
                  <div className="text-xl font-bold">Swipe and Pinch</div>
                  <div className="text-sm mt-2">Torus navigation physics enabled</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute right-4 bottom-4 z-50 flex flex-col gap-3">
          <button
            onClick={() => engineRef.current?.homeAnchorInterrupt()}
            className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center"
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => engineRef.current?.homeAnchorSecondary()}
            className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center"
            aria-label="Secondary Home"
          >
            <span className="text-xs font-semibold">H2</span>
          </button>
        </div>
      </div>
    </div>
  );

}
