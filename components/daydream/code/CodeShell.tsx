'use client';
import React, { useState } from 'react';
import DayDreamShell from '@/components/daydream/DayDreamShell';
import EditorFace from './EditorFace';
import PreviewFace from './PreviewFace';

export default function CodeShell() {
  const [liveCode, setLiveCode] = useState('');

  return (
    <DayDreamShell
      dreamId="code"
      faceALabel="Code Space" faceAIcon="💻"
      faceBLabel="Preview"    faceBIcon="▶"
      faceA={<EditorFace onCodeChange={setLiveCode} />}
      faceB={<PreviewFace previewCode={liveCode} />}
      accent="#38bdf8"
    />
  );
}
