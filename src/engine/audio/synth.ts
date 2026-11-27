import { TRACKS, type TrackId } from '@engine/audio/tracks';

export type SfxId =
  | 'cursor'
  | 'confirm'
  | 'cancel'
  | 'hit'
  | 'superEffective'
  | 'heal'
  | 'orbThrow'
  | 'orbCatch'
  | 'resonance'
  | 'fieldSkill'
  | 'splash'
  | 'levelUp';

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class SnesAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private currentTrack: TrackId | null = null;
  private stepIdx = 0;
  private timer: number | null = null;

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.22;
    this.masterGain.connect(this.ctx.destination);
    if (this.currentTrack) {
      this.startSequencer();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.22, this.ctx.currentTime, 0.02);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  playMusic(track: TrackId): void {
    if (this.currentTrack === track && this.timer !== null) return;
    this.currentTrack = track;
    this.stepIdx = 0;
    if (this.ctx) {
      this.startSequencer();
    }
  }

  stopMusic(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startSequencer(): void {
    this.stopMusic();
    if (!this.currentTrack) return;
    const track = TRACKS[this.currentTrack];
    const stepMs = Math.max(85, Math.round((60_000 / track.bpm) / 2));

    this.timer = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.muted || this.ctx.state !== 'running') return;
      const t = TRACKS[this.currentTrack!];
      const len = t.lead.length;
      const idx = this.stepIdx % len;
      const leadNote = t.lead[idx];
      const bassNote = t.bass[idx % t.bass.length];
      const dur = (stepMs / 1000) * 0.88;

      if (leadNote !== null) {
        this.playVoice(midiToFreq(leadNote), t.leadWave, dur, 0.17, 1900);
      }
      if (bassNote !== null) {
        this.playVoice(midiToFreq(bassNote), t.bassWave, dur * 0.9, 0.14, 720);
      }
      this.stepIdx = (this.stepIdx + 1) % len;
    }, stepMs);
  }

  private playVoice(freq: number, wave: OscillatorType, dur: number, vol: number, cutoff: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  playSfx(sfx: SfxId): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    const tone = (freq: number, endFreq: number, wave: OscillatorType, delay: number, dur: number, vol = 0.25) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + delay);
      if (endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + delay + dur);
      }
      gain.gain.setValueAtTime(vol, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    };

    switch (sfx) {
      case 'cursor':
        tone(680, 740, 'square', 0, 0.045, 0.14);
        break;
      case 'confirm':
        tone(520, 780, 'square', 0, 0.06, 0.18);
        tone(780, 1040, 'triangle', 0.05, 0.08, 0.18);
        break;
      case 'cancel':
        tone(420, 240, 'square', 0, 0.08, 0.16);
        break;
      case 'hit':
        tone(190, 55, 'sawtooth', 0, 0.13, 0.28);
        break;
      case 'superEffective':
        tone(440, 880, 'square', 0, 0.08, 0.24);
        tone(660, 1320, 'square', 0.07, 0.14, 0.24);
        break;
      case 'heal':
        tone(523, 659, 'triangle', 0, 0.09, 0.2);
        tone(659, 784, 'triangle', 0.08, 0.09, 0.2);
        tone(784, 1046, 'triangle', 0.16, 0.16, 0.22);
        break;
      case 'orbThrow':
        tone(340, 760, 'sine', 0, 0.18, 0.22);
        break;
      case 'orbCatch':
        tone(523, 523, 'square', 0, 0.08, 0.2);
        tone(659, 659, 'square', 0.09, 0.08, 0.2);
        tone(784, 784, 'square', 0.18, 0.08, 0.2);
        tone(1046, 1046, 'triangle', 0.28, 0.24, 0.26);
        break;
      case 'resonance':
        tone(220, 660, 'sawtooth', 0, 0.22, 0.24);
        tone(330, 990, 'square', 0.1, 0.26, 0.22);
        tone(440, 1320, 'triangle', 0.22, 0.3, 0.24);
        break;
      case 'fieldSkill':
        tone(420, 840, 'triangle', 0, 0.12, 0.22);
        tone(620, 980, 'square', 0.08, 0.14, 0.18);
        break;
      case 'splash':
        tone(480, 180, 'sine', 0, 0.16, 0.22);
        tone(320, 640, 'triangle', 0.1, 0.12, 0.16);
        break;
      case 'levelUp':
        tone(523, 523, 'square', 0, 0.08, 0.2);
        tone(659, 659, 'square', 0.09, 0.08, 0.2);
        tone(784, 784, 'square', 0.18, 0.08, 0.2);
        tone(1046, 1046, 'square', 0.28, 0.28, 0.24);
        break;
    }
  }
}
