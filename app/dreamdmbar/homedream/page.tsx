'use client';

import { useEffect } from 'react';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import { useDualRuntime } from '@/components/runtime/dream.DualRuntimeContainer';

export default function DreamDMBarHomeDreamPage( {
  const { setFocus } = useDreamSystem();
  const dualRuntime = useDualRuntime();

  useEffect(() => {
    setFocus('home');
    dualRuntime.goToHome();
    dualRuntime.setDominantRuntime('Surface Space');
  }, [dualRuntime, setFocus]);

  return null;
}
