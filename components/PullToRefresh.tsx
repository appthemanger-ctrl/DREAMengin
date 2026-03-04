'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const threshold = 80;
  const maxPull = 120;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
        setTouchStart(startY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0 || isRefreshing) return;
      
      currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        const dampedDistance = Math.min(distance * 0.5, maxPull);
        setPullDistance(dampedDistance);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
        
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
      }
      
      startY = 0;
      setTouchStart(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh, threshold, maxPull]);

  const rotation = isRefreshing ? 360 : (pullDistance / threshold) * 180;
  const opacity = Math.min(pullDistance / threshold, 1);
  const scale = Math.min(0.5 + (pullDistance / threshold) * 0.5, 1);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-30 flex justify-center pt-safe pointer-events-none"
        style={{
          transform: `translateY(${isRefreshing ? '48px' : `${pullDistance - 40}px`})`,
          transition: isRefreshing ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            opacity,
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <RefreshCw
            className={`w-6 h-6 ${
              pullDistance >= threshold 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}
