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
  private bgmGain: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmInterval: ReturnType<typeof setInterval> | null = null;

  setTheme(theme: string | undefined) {
    if (theme && AUDIO_PROFILES[theme]) this.theme = theme;
    // Re-start BGM with the new theme if already playing
    if (this.bgmInterval) {
      this.stopBgm();
      this.startBgm();
    }
  }

  dispose() {
    this.stopBgm();
    this.ctx = null;
  }

  /** Start a gentle procedural background loop tied to the current zone theme. */
  startBgm() {
    if (typeof window === 'undefined') return;
    const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    try {
      this.ctx ??= new AudioCtor();
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => undefined);
      }
    } catch { return; }
    if (this.bgmInterval) return; // already playing

    const profile = AUDIO_PROFILES[this.theme] ?? AUDIO_PROFILES['meadow pulse choir'];
    const ctx = this.ctx!;

    // Master gain for BGM — kept low so SFX punch through
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.bgmGain.gain.exponentialRampToValueAtTime(0.016, ctx.currentTime + 0.8);
    this.bgmGain.connect(ctx.destination);

    // A simple evolving arpeggio pattern based on the zone's audio profile.
    // We cycle through spread offsets to create a repeating melodic phrase.
    const bpm = 110;
    const noteMs = (60_000 / bpm) / 2; // eighth notes
    const scaleIntervals = [0, 2, 4, 5, 7, 9, 11, 12]; // major scale
    let stepIndex = 0;

    const playNote = () => {
      if (!this.ctx || !this.bgmGain) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Pick a note from the scale, shifted by the zone's spread offsets
        const scaleStep = scaleIntervals[stepIndex % scaleIntervals.length];
        const spreadOffset = profile.spread[(stepIndex >> 3) % profile.spread.length] ?? 0;
        const freq = profile.base * Math.pow(2, (scaleStep + spreadOffset) / 12);

        osc.type = profile.waveform === 'square' ? 'triangle' : profile.waveform;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.002, now + noteMs / 1000);

        const noteDuration = noteMs / 1000 * 0.75;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.022, now + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration);

        osc.connect(noteGain);
        noteGain.connect(this.bgmGain!);
        osc.start(now);
        osc.stop(now + noteDuration + 0.05);

        stepIndex++;
      } catch { /* audio context restrictions — ignore */ }
    };

    // Play the first note immediately, then schedule repeating
    playNote();
    this.bgmInterval = setInterval(playNote, noteMs);
  }

  /** Stop the background music loop. */
  stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.bgmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      } catch { /* ignore */ }
    }
    this.bgmOscillators.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
    this.bgmOscillators = [];
    this.bgmGain = null;
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
