import { useRef, useCallback } from 'react';

/**
 * Custom hook for synthetic haptic feedback using Web Audio API
 * Creates click/tick sounds without requiring audio files
 */
export function useTick() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize AudioContext on first user gesture (required by browser autoplay policies)
  const ensureAudioContext = useCallback(() => {
    if (!isInitializedRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        isInitializedRef.current = true;
      } catch (e) {
        console.warn('[useTick] AudioContext not supported:', e);
      }
    }
    return audioContextRef.current;
  }, []);

  // Menu open sound - mechanical click
  const tickOpen = useCallback(() => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(3500, ctx.currentTime);

      // Quick gain envelope: 0 → 0.15 → 0 over 30ms
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.03);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.03);
    } catch (e) {
      console.warn('[useTick] tickOpen error:', e);
    }
  }, [ensureAudioContext]);

  // Item highlight sound - subtle detent feel
  const tickSelect = useCallback((index: number) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'triangle';
      // Each item has slightly different pitch
      oscillator.frequency.setValueAtTime(2800 + (index * 80), ctx.currentTime);

      // Short burst: 15ms duration, gain 0.08
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.005);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.015);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.015);
    } catch (e) {
      console.warn('[useTick] tickSelect error:', e);
    }
  }, [ensureAudioContext]);

  // Item confirmed sound - double-click confirmation
  const tickConfirm = useCallback(() => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    try {
      // First burst at 3200Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(3200, ctx.currentTime);
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.005);
      gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.015);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.015);

      // Second burst at 4000Hz after 30ms gap
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(4000, ctx.currentTime + 0.03);
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.03);
      gain2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.035);
      gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      osc2.start(ctx.currentTime + 0.03);
      osc2.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('[useTick] tickConfirm error:', e);
    }
  }, [ensureAudioContext]);

  return {
    tickOpen,
    tickSelect,
    tickConfirm,
  };
}
