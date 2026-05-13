'use client';

import { useEffect } from 'react';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import { useDualRuntime } from '@/components/runtime/dream.DualRuntimeContainer';

export default function DreamDMBarDreamSpacePage() {
  const { setFocus } = useDreamSystem();
  const dualRuntime = useDualRuntime();

  useEffect(() => {
    setFocus('dreamspace');
    dualRuntime.goToDreamSpace();
    dualRuntime.setDominantRuntime('DreamSpace');
  }, [dualRuntime, setFocus]);

  return null;
}
