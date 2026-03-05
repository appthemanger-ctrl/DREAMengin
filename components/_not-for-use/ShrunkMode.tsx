'use client';

import React from 'react';
import type { PriorityWidget } from '@/lib/navigation/AnchorWidgetStorage';

interface ShrunkModeProps {
  priorityWidgets: PriorityWidget[];
  onWidgetSelect?: (widgetId: string) => void;
}

/**
 * ShrunkMode - 12 priority widget launchers
 * Displays most recently used or pinned widgets for quick access
 */
export function ShrunkMode({ priorityWidgets, onWidgetSelect }: ShrunkModeProps) {
  // Display up to 12 widgets
  const displayWidgets = priorityWidgets.slice(0, 12);
  
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white rounded-3xl shadow-2xl p-4 border border-gray-200">
        <div className="grid grid-cols-4 gap-3 max-w-md">
          {displayWidgets.map((widget) => (
            <PriorityWidgetLauncher
              key={widget.widgetId}
              widget={widget}
              onSelect={onWidgetSelect}
            />
          ))}
          
          {/* Fill empty slots */}
          {Array.from({ length: Math.max(0, 12 - displayWidgets.length) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center"
            >
              <span className="text-gray-300 text-sm">+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PriorityWidgetLauncherProps {
  widget: PriorityWidget;
  onSelect?: (widgetId: string) => void;
}

function PriorityWidgetLauncher({ widget, onSelect }: PriorityWidgetLauncherProps) {
  return (
    <div
      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 shadow-md relative"
      onClick={() => onSelect?.(widget.widgetId)}
    >
      {widget.pinned && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-[8px]">📌</span>
        </div>
      )}
      <div className="text-white text-xl mb-0.5">✨</div>
      <div className="text-[8px] text-white/80 font-medium truncate max-w-full px-1">
        {widget.widgetId.slice(0, 6)}
      </div>
      {widget.usageCount && widget.usageCount > 1 && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
          {widget.usageCount > 99 ? '99+' : widget.usageCount}
        </div>
      )}
    </div>
  );
}
