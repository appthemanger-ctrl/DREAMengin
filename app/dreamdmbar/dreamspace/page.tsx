'use client';

import { useDualRuntime } from '@/components/runtime/dream.DualRuntimeContainer';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import { useEffect } from 'react';

export default function DreamDMBarDreamSpacePage( ){
  const { setFocus } = useDreamSystem();
  const dualRuntime = useDualRuntime();

  useEffect(() => {
    setFocus('dreamspace');
    dualRuntime.goToDreamSpace();
    dualRuntime.setDominantRuntime('DreamSpace');
  }, [dualRuntime, setFocus]);

  return null;
}