'use client';

import React from 'react';
import type { WidgetInstanceRecord } from '@/lib/navigation/WidgetInstanceMemory';

interface ProfileSpaceProps {
  widgets: WidgetInstanceRecord[];
  onWidgetFocus?: (widgetId: string) => void;
}

/**
 * ProfileSpace - Freeform widget instance space for PROFILE mode
 * Widgets use continuous transform coordinates, z-order sorted
 */
export function ProfileSpace({ widgets, onWidgetFocus }: ProfileSpaceProps) {
  // Sort widgets by z-index
  const sortedWidgets = [...widgets].sort((a, b) => a.zIndex - b.zIndex);
  
  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
      {sortedWidgets.map((widget) => (
        <ProfileWidget
          key={widget.instanceId}
          widget={widget}
          onFocus={onWidgetFocus}
        />
      ))}
      
      {widgets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">✨</div>
            <div className="text-lg font-medium">Profile Space</div>
            <div className="text-sm">Freeform widget layout</div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProfileWidgetProps {
  widget: WidgetInstanceRecord;
  onFocus?: (widgetId: string) => void;
}

function ProfileWidget({ widget, onFocus }: ProfileWidgetProps) {
  const { transformState, visibility, presentation } = widget;
  
  // Hide if not active
  if (visibility !== 'ACTIVE') return null;
  
  return (
    <div
      className="absolute cursor-pointer transition-transform hover:scale-105"
      style={{
        transform: `translate(${transformState.x}px, ${transformState.y}px) scale(${transformState.scale}) rotate(${transformState.rotation}deg)`,
        zIndex: widget.zIndex,
        opacity: visibility === 'ACTIVE' ? 1 : 0.5,
      }}
      onClick={() => onFocus?.(widget.instanceId)}
    >
      <div className={`
        rounded-2xl shadow-lg bg-white border-2 border-purple-300
        ${presentation === 'FULL' ? 'w-screen h-screen' : 'w-64 h-64'}
      `}>
        <div className="p-4">
          <div className="font-semibold text-gray-800 mb-2">
            Widget {widget.instanceId.slice(0, 8)}
          </div>
          <div className="text-sm text-gray-600">
            {presentation} • z:{widget.zIndex}
          </div>
        </div>
      </div>
    </div>
  );
}
