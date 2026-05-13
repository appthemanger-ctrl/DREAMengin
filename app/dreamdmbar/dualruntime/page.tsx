'use client';

import { useEffect } from 'react';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';

export default function DreamDMBarDualRuntimePage() {
  const { setFocus, setSplitRatio, setIsBarMinimized } = useDreamSystem();

  useEffect(() => {
    setFocus('dualruntime');
    setIsBarMinimized(false);
    setSplitRatio(0.5);
  }, [setFocus, setIsBarMinimized, setSplitRatio]);

  return null;
}
