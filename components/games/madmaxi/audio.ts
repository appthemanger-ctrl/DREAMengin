export type MadmaxiAudioCue = 'zone-start' | 'jump' | 'coin' | 'goal' | 'powerup' | 'laser' | 'enemy-hit' | 'boss-hit' | 'hurt';

type AudioProfile = {
  waveform: OscillatorType;
  base: number;
  spread: number[];
  volume: number;
};

const AUDIO_PROFILES: Record<string, AudioProfile> = {
  'meadow pulse choir': { waveform: 'triangle', base: 220, spread: [0, 5, 9], volume: 0.03 },
  'crystal echo engine': { waveform: 'sine', base: 310, spread: [0, 7, 12], volume: 0.028 },
  'neon overdrive sync': { waveform: 'sawtooth', base: 180, spread: [0, 3, 10], volume: 0.024 },
  'sky brass ascent': { waveform: 'triangle', base: 260, spread: [0, 4, 7], volume: 0.03 },
  'shadow bass ritual': { waveform: 'square', base: 110, spread: [0, 7, 10], volume: 0.022 },
  'abyss tide synth': { waveform: 'sine', base: 140, spread: [0, 5, 12], volume: 0.028 },
  'chrono pulse engine': { waveform: 'triangle', base: 240, spread: [0, 2, 9], volume: 0.028 },
  'psy maze choir': { waveform: 'sawtooth', base: 190, spread: [0, 6, 11], volume: 0.022 },
  'stormbreaker march': { waveform: 'square', base: 210, spread: [0, 5, 7], volume: 0.024 },
  'void signal choir': { waveform: 'sine', base: 120, spread: [0, 1, 6], volume: 0.022 },
  'reborn ridge anthem': { waveform: 'triangle', base: 240, spread: [0, 4, 9], volume: 0.028 },
  'echo vault resonance': { waveform: 'triangle', base: 200, spread: [0, 7, 12], volume: 0.026 },
  'frontier engine roar': { waveform: 'sawtooth', base: 170, spread: [0, 5, 9], volume: 0.022 },
  'ascendant crown hymn': { waveform: 'triangle', base: 280, spread: [0, 7, 14], volume: 0.03 },
  'dreamheart royal pulse': { waveform: 'triangle', base: 320, spread: [0, 4, 7], volume: 0.03 },
};

const CUE_SHAPES: Record<MadmaxiAudioCue, { offset: number; duration: number; slide?: number; volumeScale?: number }> = {
  'zone-start': { offset: 12, duration: 0.18, slide: 1.05, volumeScale: 1.15 },
  jump: { offset: 7, duration: 0.08, slide: 1.08 },
  coin: { offset: 19, duration: 0.08, slide: 1.03 },
  goal: { offset: 24, duration: 0.22, slide: 1.12, volumeScale: 1.2 },
  powerup: { offset: 15, duration: 0.14, slide: 1.1, volumeScale: 1.1 },
  laser: { offset: 29, duration: 0.06, slide: 0.92 },
  'enemy-hit': { offset: -5, duration: 0.08, slide: 0.94 },
  'boss-hit': { offset: -9, duration: 0.12, slide: 0.9, volumeScale: 1.25 },
  hurt: { offset: -15, duration: 0.16, slide: 0.82, volumeScale: 1.3 },
};

export class MadmaxiAudioController {
  private theme = 'meadow pulse choir';
  private ctx: AudioContext | null = null;

  setTheme(theme: string | undefined) {
    if (theme && AUDIO_PROFILES[theme]) this.theme = theme;
  }

  dispose() {
    this.ctx = null;
  }

  playCue(cue: MadmaxiAudioCue) {
    if (typeof window === 'undefined') return;
    const profile = AUDIO_PROFILES[this.theme] ?? AUDIO_PROFILES['meadow pulse choir'];
    const shape = CUE_SHAPES[cue];
    if (!shape) return;

    const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    try {
      this.ctx ??= new AudioCtor();
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => undefined);
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const toneOffset = profile.spread[Math.floor(Math.random() * profile.spread.length)] ?? 0;
      const startFreq = profile.base * Math.pow(2, (shape.offset + toneOffset) / 12);
      const endFreq = startFreq * (shape.slide ?? 1);
      osc.type = profile.waveform;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + shape.duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(profile.volume * (shape.volumeScale ?? 1), now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + shape.duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + shape.duration + 0.02);
    } catch {
      // Ignore browsers that reject autoplay or audio context creation.
    }
  }
}
