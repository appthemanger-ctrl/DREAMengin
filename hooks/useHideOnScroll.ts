// hooks/useHideOnScroll.ts
// iOS-safe scroll direction hook using useRef to avoid stale closures

import { useState, useEffect, useRef } from 'react';

interface UseHideOnScrollOptions {
  threshold?: number; // Minimum scroll Y before hiding
  delta?: number; // Minimum scroll delta to trigger change
}

export function useHideOnScroll(options: UseHideOnScrollOptions = {}) {
  const { threshold = 80, delta = 10 } = options;
  const [isVisible, setIsVisible] = useState(true);
  
  // Use refs to avoid stale closures in event listener
  const lastScrollYRef = useRef(0);
  const accumulatedDeltaRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Throttle with requestAnimationFrame
      rafIdRef.current = requestAnimationFrame(() => {
        // Clamp to 0 for iOS bounce scroll (negative values)
        const currentScrollY = Math.max(0, window.scrollY);
        const scrollDelta = currentScrollY - lastScrollYRef.current;
        
        // Accumulate delta to avoid jitter
        accumulatedDeltaRef.current += scrollDelta;
        
        // Only update if we're past threshold and have accumulated enough delta
        if (currentScrollY > threshold && Math.abs(accumulatedDeltaRef.current) > delta) {
          if (accumulatedDeltaRef.current > 0) {
            // Scrolling down - hide
            setIsVisible(false);
          } else {
            // Scrolling up - show
            setIsVisible(true);
          }
          accumulatedDeltaRef.current = 0;
        } else if (currentScrollY <= threshold) {
          // Always show when at top
          setIsVisible(true);
          accumulatedDeltaRef.current = 0;
        }
        
        lastScrollYRef.current = currentScrollY;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [threshold, delta]);

  return isVisible;
}
