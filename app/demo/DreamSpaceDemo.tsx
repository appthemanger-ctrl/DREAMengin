// app/demo/DreamSpaceDemo.tsx
// Torus grid (2x2) demo with wrapping navigation

'use client';

import { useState, useEffect, useRef } from 'react';

const GRID_SIZE = 2; // 2x2 grid
const TOTAL_PAGES = GRID_SIZE * GRID_SIZE; // 4 pages

export default function DreamSpaceDemo() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert page index to grid coordinates
  const getGridPos = (page: number) => ({
    x: page % GRID_SIZE,
    y: Math.floor(page / GRID_SIZE),
  });

  // Convert grid coordinates to page index (with wrapping)
  const getPageIndex = (x: number, y: number) => {
    const wrappedX = ((x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
    const wrappedY = ((y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
    return wrappedY * GRID_SIZE + wrappedX;
  };

  // Navigate to adjacent page with wrapping
  const navigate = (dx: number, dy: number) => {
    const pos = getGridPos(currentPage);
    const newPage = getPageIndex(pos.x + dx, pos.y + dy);
    setCurrentPage(newPage);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigate(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigate(1, 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigate(0, -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigate(0, 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  // Touch/pointer navigation
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const threshold = 50;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        navigate(dx > 0 ? -1 : 1, 0);
      } else {
        // Vertical swipe
        navigate(0, dy > 0 ? -1 : 1);
      }
    }

    setIsDragging(false);
  };

  const pages = [
    { title: 'Page 0,0', color: 'from-blue-500 to-purple-600' },
    { title: 'Page 1,0', color: 'from-green-500 to-teal-600' },
    { title: 'Page 0,1', color: 'from-orange-500 to-red-600' },
    { title: 'Page 1,1', color: 'from-pink-500 to-purple-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div
        ref={containerRef}
        className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setIsDragging(false)}
      >
        {/* Current page */}
        <div className={`absolute inset-0 bg-gradient-to-br ${pages[currentPage].color} flex flex-col items-center justify-center transition-all duration-300`}>
          <h2 className="text-6xl font-bold text-white mb-4">
            {pages[currentPage].title}
          </h2>
          <div className="text-white text-xl opacity-80">
            Page {currentPage + 1} of {TOTAL_PAGES}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-2">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`w-12 h-12 rounded-lg transition-all ${
                  idx === currentPage
                    ? 'bg-white text-black scale-110'
                    : 'bg-white/30 text-white hover:bg-white/50'
                }`}
              >
                {idx}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation indicators */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white opacity-50 text-sm">
            ↑
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white opacity-50 text-sm">
            ↓
          </div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white opacity-50 text-sm">
            ←
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white opacity-50 text-sm">
            →
          </div>
        </div>
      </div>

      {/* Grid visualization */}
      <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto">
        {pages.map((page, idx) => {
          const pos = getGridPos(idx);
          return (
            <div
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`aspect-square rounded-lg bg-gradient-to-br ${page.color} flex items-center justify-center cursor-pointer transition-all ${
                idx === currentPage
                  ? 'ring-4 ring-white scale-105'
                  : 'opacity-60 hover:opacity-80'
              }`}
            >
              <div className="text-white font-bold text-sm">
                ({pos.x}, {pos.y})
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
