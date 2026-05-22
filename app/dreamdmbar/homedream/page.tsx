'use client';

import { useDualRuntime } from '@/components/runtime/dream.DualRuntimeContainer';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import { useEffect } from 'react';

export default function DreamDMBarHomeDreamPage( ){
  const { setFocus } = useDreamSystem();
  const dualRuntime = useDualRuntime();

  useEffect(() => {
    setFocus('home');
    dualRuntime.goToHome();
    dualRuntime.setDominantRuntime('Surface Space');
  }, [dualRuntime, setFocus]);

  return null;
}