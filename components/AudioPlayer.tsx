'use client';
import React from 'react';

export default function AudioPlayer({ src, autoPlay = false }: { src?: string; autoPlay?: boolean }) {
  if (!src) return null;
  return <audio controls src={src} autoPlay={autoPlay} style={{ width: '100%' }} />;
}
