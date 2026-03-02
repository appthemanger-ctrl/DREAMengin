'use client';
import React, { useState } from 'react';
import DayDreamShell from '@/components/daydream/DayDreamShell';
import LibraryFace from './LibraryFace';
import PlayFace from './PlayFace';

export default function GamesShell() {
  const [activeGame, setActiveGame] = useState<string>('word-sprint');

  // suppress unused warning
  void activeGame;

  return (
    <DayDreamShell
      dreamId="games"
      faceALabel="Library" faceAIcon="🎮"
      faceBLabel="Play"    faceBIcon="▶"
      faceA={<LibraryFace onPlay={(id) => setActiveGame(id)} />}
      faceB={<PlayFace />}
      accent="#f97316"
    />
  );
}
