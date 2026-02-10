'use client';

import React, { useCallback, useRef, useState } from 'react';

interface DragToAnchorCloseProps {
  anchorRect: { x0: number; y0: number; x1: number; y1: number };
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * DragToAnchorClose - Enables closing widgets by dragging to anchor
 * Implements the drag-to-anchor close contract
 */
export function DragToAnchorClose({ anchorRect, onClose, children }: DragToAnchorCloseProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isOverAnchor, setIsOverAnchor] = useState(false);
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    pointerId: -1,
    element: null as HTMLElement | null
  });
  
  /**
   * Check if pointer is over anchor drop zone
   */
  const checkOverAnchor = useCallback((x: number, y: number): boolean => {
    return (
      x >= anchorRect.x0 &&
      x <= anchorRect.x1 &&
      y >= anchorRect.y0 &&
      y <= anchorRect.y1
    );
  }, [anchorRect]);
  
  /**
   * Handle pointer down - start drag
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only allow drag from specific handle (e.g., top bar)
    const target = e.target as HTMLElement;
    if (!target.classList.contains('drag-handle')) {
      return;
    }
    
    e.preventDefault();
    
    const dragState = dragStateRef.current;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.pointerId = e.pointerId;
    dragState.element = e.currentTarget as HTMLElement;
    
    setIsDragging(true);
    
    if (dragState.element) {
      dragState.element.setPointerCapture(e.pointerId);
    }
  }, []);
  
  /**
   * Handle pointer move - track drag
   */
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dragState = dragStateRef.current;
    if (dragState.pointerId !== e.pointerId) return;
    
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    
    // Update element position
    if (dragState.element) {
      dragState.element.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    
    // Check if over anchor
    const overAnchor = checkOverAnchor(e.clientX, e.clientY);
    setIsOverAnchor(overAnchor);
  }, [isDragging, checkOverAnchor]);
  
  /**
   * Handle pointer up - complete drag or close
   */
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dragState = dragStateRef.current;
    if (dragState.pointerId !== e.pointerId) return;
    
    // Check if released over anchor
    const overAnchor = checkOverAnchor(e.clientX, e.clientY);
    
    if (overAnchor) {
      // Close widget
      onClose();
    } else {
      // Reset position
      if (dragState.element) {
        dragState.element.style.transform = '';
      }
    }
    
    // Reset state
    setIsDragging(false);
    setIsOverAnchor(false);
    
    if (dragState.element) {
      dragState.element.releasePointerCapture(e.pointerId);
    }
  }, [isDragging, checkOverAnchor, onClose]);
  
  /**
   * Handle pointer cancel
   */
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    const dragState = dragStateRef.current;
    if (dragState.pointerId !== e.pointerId) return;
    
    // Reset position
    if (dragState.element) {
      dragState.element.style.transform = '';
    }
    
    setIsDragging(false);
    setIsOverAnchor(false);
    
    if (dragState.element) {
      dragState.element.releasePointerCapture(e.pointerId);
    }
  }, []);
  
  return (
    <div
      className={`
        transition-all duration-200
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${isOverAnchor ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
      `}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ touchAction: 'none' }}
    >
      {children}
      
      {/* Visual feedback when over anchor */}
      {isOverAnchor && (
        <div className="fixed inset-0 bg-purple-500 bg-opacity-20 pointer-events-none animate-pulse" />
      )}
    </div>
  );
}

/**
 * DragHandle - Component to mark draggable area
 */
export function DragHandle({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`drag-handle ${className}`}>
      {children || (
        <div className="flex items-center justify-center p-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
      )}
    </div>
  );
}
