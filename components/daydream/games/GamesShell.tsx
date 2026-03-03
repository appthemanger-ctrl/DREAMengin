'use client';
import React, { useCallback, useState } from 'react';
import DayDreamShell from '@/components/daydream/DayDreamShell';
import LibraryFace from './LibraryFace';
import PlayFace from './PlayFace';
import GameHomeButton from './GameHomeButton';

export default function GamesShell() {
  const [_activeGame, setActiveGame] = useState<string>('word-sprint');
  const [isGameActive, setIsGameActive] = useState(false);
  // Incrementing counters act as edge-triggered signals to PlayFace.
  const [pauseSignal, setPauseSignal] = useState(0);
  const [menuSignal,  setMenuSignal]  = useState(0);

  const handlePause = useCallback(() => setPauseSignal(s => s + 1), []);
  const handleMenu  = useCallback(() => setMenuSignal(s => s + 1),  []);

  const gameHomeButton = isGameActive ? (
    <GameHomeButton onPause={handlePause} onMenu={handleMenu} />
  ) : undefined;

  return (
    <DayDreamShell
      dreamId="games"
      faceALabel="Library" faceAIcon="🎮"
      faceBLabel="Play"    faceBIcon="▶"
      faceA={<LibraryFace onPlay={(id) => setActiveGame(id)} />}
      faceB={
        <PlayFace
          onActiveChange={setIsGameActive}
          externalPauseSignal={pauseSignal}
          externalMenuSignal={menuSignal}
        />
      }
      accent="#f97316"
      gameHomeButton={gameHomeButton}
    />
  );
}
