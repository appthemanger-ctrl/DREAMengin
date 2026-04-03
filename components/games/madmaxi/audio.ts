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

// ── BGM: procedural looping soundtrack per zone ──────────────────────────────
// Each zone theme drives a layered synth loop: bass drone, arpeggio, and rhythm.
// The sequence repeats every 4 bars (≈ 8 s at 120 BPM).
const BGM_BPM = 120;
const BGM_BAR_SECONDS = (60 / BGM_BPM) * 4; // 4 beats per bar = 2 s
const BGM_LOOP_BARS = 4;                     // 4 bars per loop cycle
const BGM_LOOP_SECONDS = BGM_BAR_SECONDS * BGM_LOOP_BARS; // 8 s

/** Semitone offsets for the arpeggio pattern (minor-feel sequence) */
const ARP_PATTERN = [0, 3, 7, 12, 7, 3, 0, -5];
/** Rhythm hits per bar: indices (0-7) within 8 sub-divisions */
const RHYTHM_HITS = [0, 2, 3, 5, 6];

export class MadmaxiAudioController {
  private theme = 'meadow pulse choir';
  private ctx: AudioContext | null = null;

  // BGM state
  private bgmGain: GainNode | null = null;
  private bgmTimer: ReturnType<typeof setInterval> | null = null;
  private bgmActive = false;

  setTheme(theme: string | undefined) {
    if (theme && AUDIO_PROFILES[theme]) this.theme = theme;
    // If BGM is already running, the new theme will take effect on the next loop
  }

  dispose() {
    this.stopBGM();
    this.ctx = null;
  }

  // ── Background music ───────────────────────────────────────────────────────

  startBGM() {
    if (this.bgmActive) return;
    this.bgmActive = true;
    this.ensureCtx();
    if (!this.ctx) return;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    // Fade in over 1 s
    this.bgmGain.gain.exponentialRampToValueAtTime(1, this.ctx.currentTime + 1);
    this.bgmGain.connect(this.ctx.destination);

    // Schedule the first loop immediately, then repeat
    this.scheduleBGMLoop();
    this.bgmTimer = setInterval(() => {
      if (!this.bgmActive) return;
      this.scheduleBGMLoop();
    }, BGM_LOOP_SECONDS * 1000);
  }

  stopBGM() {
    this.bgmActive = false;
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
        this.bgmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      } catch { /* ok */ }
    }
    this.bgmGain = null;
  }

  private ensureCtx() {
    if (typeof window === 'undefined') return;
    const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    try {
      this.ctx ??= new AudioCtor();
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => undefined);
      }
    } catch { /* ignore */ }
  }

  private scheduleBGMLoop() {
    if (!this.ctx || !this.bgmGain) return;
    const profile = AUDIO_PROFILES[this.theme] ?? AUDIO_PROFILES['meadow pulse choir'];
    const now = this.ctx.currentTime;

    // ── Layer 1: Bass drone (sustained low note) ─────────────────────────
    this.scheduleNote({
      freq: profile.base * 0.5,
      waveform: 'triangle',
      startTime: now,
      duration: BGM_LOOP_SECONDS - 0.05,
      volume: profile.volume * 0.55,
      slide: 1.002,
    });

    // ── Layer 2: Arpeggio (8th-note pulse) ───────────────────────────────
    const eighthNote = BGM_BAR_SECONDS / 2; // duration of an 8th note
    for (let bar = 0; bar < BGM_LOOP_BARS; bar++) {
      for (let step = 0; step < ARP_PATTERN.length; step++) {
        const semitone = ARP_PATTERN[step];
        const freq = profile.base * Math.pow(2, semitone / 12);
        const t = now + bar * BGM_BAR_SECONDS + step * eighthNote;
        this.scheduleNote({
          freq,
          waveform: profile.waveform,
          startTime: t,
          duration: eighthNote * 0.7,
          volume: profile.volume * 0.35,
        });
      }
    }

    // ── Layer 3: Rhythmic pulse (kick-like) ──────────────────────────────
    const subdivDur = BGM_BAR_SECONDS / 8;
    for (let bar = 0; bar < BGM_LOOP_BARS; bar++) {
      for (const hit of RHYTHM_HITS) {
        const t = now + bar * BGM_BAR_SECONDS + hit * subdivDur;
        this.scheduleNote({
          freq: profile.base * 0.25,
          waveform: 'square',
          startTime: t,
          duration: subdivDur * 0.4,
          volume: profile.volume * 0.28,
          slide: 0.5,
        });
      }
    }
  }

  private scheduleNote(opts: {
    freq: number;
    waveform: OscillatorType;
    startTime: number;
    duration: number;
    volume: number;
    slide?: number;
  }) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = opts.waveform;
      osc.frequency.setValueAtTime(opts.freq, opts.startTime);
      if (opts.slide) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, opts.freq * opts.slide),
          opts.startTime + opts.duration,
        );
      }
      gain.gain.setValueAtTime(0.0001, opts.startTime);
      gain.gain.exponentialRampToValueAtTime(opts.volume, opts.startTime + 0.015);
      gain.gain.setValueAtTime(opts.volume, opts.startTime + opts.duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, opts.startTime + opts.duration);
      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(opts.startTime);
      osc.stop(opts.startTime + opts.duration + 0.02);
    } catch { /* ignore */ }
  }

  // ── SFX cues ───────────────────────────────────────────────────────────────

  playCue(cue: MadmaxiAudioCue) {
    if (typeof window === 'undefined') return;
    const profile = AUDIO_PROFILES[this.theme] ?? AUDIO_PROFILES['meadow pulse choir'];
    const shape = CUE_SHAPES[cue];
    if (!shape) return;

    this.ensureCtx();
    if (!this.ctx) return;
    try {
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
