'use client';

import React, { useCallback, useState } from 'react';
import { AnchorWidgetStorage, type HomeSlotMapping } from '@/lib/navigation/AnchorWidgetStorage';

interface HomeSpaceProps {
  homeSlots: HomeSlotMapping[];
  onSlotTap?: (slotIndex: number) => void;
  onSlotUpdate?: (slotIndex: number, widgetId: string | null) => void;
}

/**
 * HomeSpace - 8-slot widget surface for HOME mode
 * Each slot can be blank or bound to a widget
 */
export function HomeSpace({ homeSlots, onSlotTap, onSlotUpdate }: HomeSpaceProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  const handleSlotTap = useCallback((slotIndex: number) => {
    setSelectedSlot(slotIndex);
    onSlotTap?.(slotIndex);
  }, [onSlotTap]);
  
  const handleDockOffscreen = useCallback((slotIndex: number) => {
    // Move widget offscreen without changing NavState
    onSlotUpdate?.(slotIndex, null);
    setSelectedSlot(null);
  }, [onSlotUpdate]);
  
  return (
    <div className="w-full h-full p-4">
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {homeSlots.map((slot) => (
          <HomeSlot
            key={slot.slotIndex}
            slotIndex={slot.slotIndex}
            widgetId={slot.widgetId}
            isSelected={selectedSlot === slot.slotIndex}
            onTap={handleSlotTap}
            onDockOffscreen={handleDockOffscreen}
          />
        ))}
      </div>
    </div>
  );
}

interface HomeSlotProps {
  slotIndex: number;
  widgetId: string | null;
  isSelected: boolean;
  onTap: (slotIndex: number) => void;
  onDockOffscreen: (slotIndex: number) => void;
}

function HomeSlot({ slotIndex, widgetId, isSelected, onTap, onDockOffscreen }: HomeSlotProps) {
  return (
    <div
      className={`
        aspect-square rounded-2xl border-2 transition-all cursor-pointer
        ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white'}
        ${widgetId ? 'shadow-md' : 'border-dashed'}
        hover:border-purple-400 hover:shadow-lg
      `}
      onClick={() => onTap(slotIndex)}
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        {widgetId ? (
          <>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mb-2">
              <span className="text-white text-xl font-bold">W</span>
            </div>
            <div className="text-sm text-gray-700 font-medium truncate max-w-full">
              Widget {slotIndex + 1}
            </div>
            {isSelected && (
              <button
                className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onDockOffscreen(slotIndex);
                }}
              >
                Dock →
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
              <span className="text-gray-400 text-2xl">+</span>
            </div>
            <div className="text-xs text-gray-400">
              Slot {slotIndex + 1}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
