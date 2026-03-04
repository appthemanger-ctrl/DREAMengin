"use client";

import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@/lib/navigation';
import { WidgetInstanceRecord, WidgetPresentation, WidgetVisibility, WidgetBindingType } from '@/lib/navigation/WidgetInstanceMemory';

// Mock widget instances for demo
const mockWidgets: WidgetInstanceRecord[] = [
  {
    instanceId: 'widget-1',
    ownerId: 'user-1',
    context: 'HOME',
    transformState: { x: 0, y: 0, scale: 1, rotation: 0 },
    zIndex: 1,
    presentation: WidgetPresentation.FLOATING,
    bindingType: WidgetBindingType.STATIC,
    bindingConfig: {},
    visibility: WidgetVisibility.ACTIVE,
    internalState: {},
  },
  {
    instanceId: 'widget-2',
    ownerId: 'user-1',
    context: 'HOME',
    transformState: { x: 100, y: 100, scale: 1, rotation: 0 },
    zIndex: 2,
    presentation: WidgetPresentation.FLOATING,
    bindingType: WidgetBindingType.STATIC,
    bindingConfig: {},
    visibility: WidgetVisibility.ACTIVE,
    internalState: {},
  },
  {
    instanceId: 'widget-3',
    ownerId: 'user-1',
    context: 'PROFILE',
    transformState: { x: 0, y: 0, scale: 1, rotation: 0 },
    zIndex: 1,
    presentation: WidgetPresentation.FLOATING,
    bindingType: WidgetBindingType.STATIC,
    bindingConfig: {},
    visibility: WidgetVisibility.ACTIVE,
    internalState: {},
  },
];

/**
 * GestureNavigationDemo - Demonstrates the gesture-driven navigation engine
 * Shows real-time navigation state and responds to touch/pointer gestures
 */
export default function GestureNavigationDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { navState, isReady, engine, goHome, switchToProfile, switchToHome, getActiveWidgets } = useNavigation({
    enablePersistence: true,
    widgets: mockWidgets,
  });
  
  // Apply transforms to container
  useEffect(() => {
    if (!isReady || !engine || !containerRef.current) return;
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    
    engine.applyTransform(containerRef.current, viewport);
  }, [navState, isReady, engine]);
  
  const activeWidgets = getActiveWidgets();
  const layerNames = ['HOME', 'CUBE', 'PROFILE', 'WIDGET', 'DREAM'];
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Navigation State Display */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-md text-white p-4 rounded-lg font-mono text-sm">
        <div className="font-bold mb-2">Navigation State</div>
        <div>Layer: {layerNames[navState.layer] || navState.layer}</div>
        <div>Face: {navState.face}</div>
        <div>Slot: {navState.slot === -1 ? 'null' : navState.slot}</div>
        <div>Depth: {navState.depth}</div>
        <div className="mt-2 pt-2 border-t border-white/20">
          Active Widgets: {activeWidgets.length}
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={goHome}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg transition-colors"
        >
          🏠 Home
        </button>
        <button
          onClick={switchToProfile}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg transition-colors"
        >
          👤 Profile
        </button>
        <button
          onClick={switchToHome}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg transition-colors"
        >
          ← Back to Home
        </button>
      </div>
      
      {/* Gesture Instructions */}
      <div className="absolute bottom-4 left-4 right-4 z-50 bg-black/80 backdrop-blur-md text-white p-4 rounded-lg text-sm">
        <div className="font-bold mb-2">Gesture Controls (Mobile-Optimized)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>📱 <strong>Pinch in:</strong> Zoom in (depth++)</div>
          <div>📱 <strong>Pinch out:</strong> Zoom out (depth--)</div>
          <div>👆 <strong>Swipe left/right:</strong> Rotate face</div>
          <div>✋ <strong>Hold:</strong> Long press gesture</div>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{
          willChange: 'transform',
          contain: 'paint layout',
        }}
      >
        {/* Render Active Widgets */}
        <div className="relative w-full h-full flex items-center justify-center">
          {activeWidgets.map((widget) => (
            <div
              key={widget.instanceId}
              className="absolute bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6"
              style={{
                transform: `translate(${widget.transformState.x}px, ${widget.transformState.y}px) scale(${widget.transformState.scale}) rotate(${widget.transformState.rotation}deg)`,
                zIndex: widget.zIndex,
                willChange: 'transform',
              }}
            >
              <div className="text-white text-center">
                <div className="font-bold mb-2">{widget.instanceId}</div>
                <div className="text-sm opacity-70">{widget.context}</div>
                <div className="text-xs opacity-50 mt-1">{widget.presentation}</div>
              </div>
            </div>
          ))}
          
          {/* Center Indicator */}
          <div className="text-white text-center">
            <div className="text-6xl mb-4">👆</div>
            <div className="text-xl font-bold">Touch to Navigate</div>
            <div className="text-sm opacity-70 mt-2">Pinch, swipe, or hold</div>
          </div>
        </div>
      </div>
      
      {/* Status Indicator */}
      {!isReady && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="text-2xl mb-2">Initializing Engine...</div>
            <div className="text-sm opacity-70">Loading spatial navigation</div>
          </div>
        </div>
      )}
    </div>
  );
}
