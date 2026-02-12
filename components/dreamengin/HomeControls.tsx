// HomeControls.tsx
// Renders two draggable home controls (blue and red) with gesture handling.
// Implements double‑tap menus, hold‑drag depth navigation and drag‑to‑home gesture.

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface HomeControlsProps {
  onDoubleTapBlue: () => void;
  onDoubleTapRed: () => void;
  onHoldBlue: (delta: number) => void;
  onHoldRed: (delta: number) => void;
  onGoHome: () => void;
}

export default function HomeControls({
  onDoubleTapBlue,
  onDoubleTapRed,
  onHoldBlue,
  onHoldRed,
  onGoHome,
}: HomeControlsProps) {
  // Positions in pixels relative to viewport
  const [bluePos, setBluePos] = useState<{ x: number; y: number } | null>(null);
  const [redPos, setRedPos] = useState<{ x: number; y: number } | null>(null);

  // Last saved positions (for snapback on goHome)
  const lastBluePos = useRef<{ x: number; y: number } | null>(null);
  const lastRedPos = useRef<{ x: number; y: number } | null>(null);

  // Double tap state
  const blueTapRef = useRef<{ count: number; timeout: NodeJS.Timeout | null }>({
    count: 0,
    timeout: null,
  });
  const redTapRef = useRef<{ count: number; timeout: NodeJS.Timeout | null }>({
    count: 0,
    timeout: null,
  });

  // Hold state
  const holdRef = useRef<{
    active: boolean;
    startY: number;
    color: 'blue' | 'red' | null;
  }>({
    active: false,
    startY: 0,
    color: null,
  });

  // Load positions from localStorage on mount
  useEffect(() => {
    const savedBlue = window.localStorage.getItem('dreamengin_blue_pos');
    const savedRed = window.localStorage.getItem('dreamengin_red_pos');
    if (savedBlue) {
      try {
        setBluePos(JSON.parse(savedBlue));
      } catch {
        /* ignore */
      }
    }
    if (savedRed) {
      try {
        setRedPos(JSON.parse(savedRed));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Initialise positions if none loaded
  useEffect(() => {
    if (!bluePos || !redPos) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Default positions: bottom centre, side by side
      const size = 56;
      const margin = 8;
      const x0 = Math.round(vw / 2 - size - margin / 2);
      const x1 = Math.round(vw / 2 + margin / 2);
      const y = Math.round(vh - size - 16);
      if (!bluePos) setBluePos({ x: x0, y });
      if (!redPos) setRedPos({ x: x1, y });
    }
  }, [bluePos, redPos]);

  // Persist positions to localStorage
  useEffect(() => {
    if (bluePos) window.localStorage.setItem('dreamengin_blue_pos', JSON.stringify(bluePos));
    if (redPos) window.localStorage.setItem('dreamengin_red_pos', JSON.stringify(redPos));
  }, [bluePos, redPos]);

  // Helper to handle double tap
  const handleTap = useCallback(
    (color: 'blue' | 'red') => {
      const tapRef = color === 'blue' ? blueTapRef : redTapRef;
      tapRef.current.count += 1;
      if (tapRef.current.count === 1) {
        // wait for second tap within 300ms
        tapRef.current.timeout = setTimeout(() => {
          tapRef.current.count = 0;
        }, 300);
      } else if (tapRef.current.count === 2) {
        if (tapRef.current.timeout) clearTimeout(tapRef.current.timeout);
        tapRef.current.count = 0;
        // Trigger double tap handler
        if (color === 'blue') {
          onDoubleTapBlue();
        } else {
          onDoubleTapRed();
        }
      }
    },
    [onDoubleTapBlue, onDoubleTapRed]
  );

  // Handle pointer events for dragging and holds
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, color: 'blue' | 'red') => {
      const isLeftButton = e.button === 0;
      if (!isLeftButton) return;
      e.preventDefault();
      // Determine which control
      const pos = color === 'blue' ? bluePos : redPos;
      if (!pos) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const offsetX = startX - pos.x;
      const offsetY = startY - pos.y;

      // Manage hold detection
      holdRef.current.active = false;
      holdRef.current.color = color;
      holdRef.current.startY = startY;
      const holdTimer = setTimeout(() => {
        holdRef.current.active = true;
      }, 300);

      const handleMove = (ev: PointerEvent) => {
        ev.preventDefault();
        const newX = ev.clientX - offsetX;
        const newY = ev.clientY - offsetY;

        // If hold active, interpret as depth navigation (vertical movement)
        if (holdRef.current.active) {
          const deltaY = holdRef.current.startY - ev.clientY;
          holdRef.current.startY = ev.clientY;
          if (holdRef.current.color === 'blue') {
            onHoldBlue(deltaY * 0.01);
          } else {
            onHoldRed(deltaY * 0.01);
          }
        } else {
          // Normal drag moves control
          if (color === 'blue') {
            setBluePos({ x: newX, y: newY });
          } else {
            setRedPos({ x: newX, y: newY });
          }
        }
      };

      const handleUp = (ev: PointerEvent) => {
        // Clear hold timer
        clearTimeout(holdTimer);
        // If hold was never activated treat as tap
        if (!holdRef.current.active) {
          handleTap(color);
        }
        // Check for drag-to-home: if controls overlap
        setTimeout(() => {
          const b = color === 'blue' ? { x: ev.clientX - offsetX, y: ev.clientY - offsetY } : bluePos;
          const r = color === 'red' ? { x: ev.clientX - offsetX, y: ev.clientY - offsetY } : redPos;
          if (b && r) {
            const size = 56;
            const bRect = { left: b.x, right: b.x + size, top: b.y, bottom: b.y + size };
            const rRect = { left: r.x, right: r.x + size, top: r.y, bottom: r.y + size };
            const overlap = !(
              bRect.right < rRect.left ||
              bRect.left > rRect.right ||
              bRect.bottom < rRect.top ||
              bRect.top > rRect.bottom
            );
            if (overlap) {
              // Save current positions before resetting
              lastBluePos.current = bluePos;
              lastRedPos.current = redPos;
              // Reset positions to defaults (snap back)
              setBluePos(bluePos || b);
              setRedPos(redPos || r);
              onGoHome();
            }
          }
        }, 0);

        // Release pointer capture and remove listeners
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
        holdRef.current.active = false;
        holdRef.current.color = null;
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
    },
    [bluePos, redPos, onHoldBlue, onHoldRed, onGoHome, handleTap]
  );

  if (!bluePos || !redPos) {
    return null; // Wait until positions are initialised
  }

  // Helper to style each control
  const buttonStyle = (pos: { x: number; y: number }, color: string) => ({
    position: 'fixed' as const,
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    backgroundColor: color,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    userSelect: 'none' as const,
    touchAction: 'none' as const,
    zIndex: 50,
  });

  return (
    <>
      <div
        onPointerDown={(e) => handlePointerDown(e, 'blue')}
        style={buttonStyle(bluePos, '#0070f3')}
      >
        {/* Infinity symbol half (left) */}
        <svg width="32" height="20" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2 6C2 3.23858 4.23858 1 7 1C9.76142 1 12 3.23858 12 6C12 8.76142 9.76142 11 7 11C4.23858 11 2 8.76142 2 6Z"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div
        onPointerDown={(e) => handlePointerDown(e, 'red')}
        style={buttonStyle(redPos, '#e00')}
      >
        {/* Infinity symbol half (right) */}
        <svg width="32" height="20" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 6C12 3.23858 14.2386 1 17 1C19.7614 1 22 3.23858 22 6C22 8.76142 19.7614 11 17 11C14.2386 11 12 8.76142 12 6Z"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </div>
    </>
  );
}
