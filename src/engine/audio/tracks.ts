export type TrackId = 'title' | 'garrison' | 'town' | 'overworld' | 'shrine' | 'battle' | 'boss' | 'victory';

export interface MusicTrack {
  bpm: number;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  lead: Array<number | null>; // MIDI note numbers, 16th/8th steps
  bass: Array<number | null>;
}

/**
 * Original SNES-inspired 16-bit looping themes evoking Breath of Fire & retro Pokémon.
 */
export const TRACKS: Record<TrackId, MusicTrack> = {
  title: {
    bpm: 112,
    leadWave: 'triangle',
    bassWave: 'sawtooth',
    lead: [
      62, null, 66, 69, 74, null, 73, 71, 69, null, 66, null, 62, null, null, null,
      64, null, 67, 71, 76, null, 74, 73, 71, null, 69, null, 73, null, null, null,
      74, null, 78, 81, 79, null, 76, 74, 73, null, 71, 69, 66, null, 69, null,
      67, null, 66, 64, 62, null, 66, 69, 74, null, null, null, null, null, null, null,
    ],
    bass: [
      38, null, 45, null, 50, null, 45, null, 42, null, 45, null, 50, null, 45, null,
      40, null, 47, null, 52, null, 47, null, 45, null, 49, null, 52, null, 49, null,
      38, null, 45, null, 43, null, 47, null, 45, null, 49, null, 42, null, 45, null,
      43, null, 47, null, 45, null, 49, null, 38, null, 45, null, 50, null, null, null,
    ],
  },
  garrison: {
    bpm: 108,
    leadWave: 'square',
    bassWave: 'sawtooth',
    lead: [
      57, null, 60, null, 64, null, 63, 64, 60, null, 57, null, 55, null, null, null,
      57, null, 60, null, 65, null, 64, 62, 60, null, 59, null, 57, null, null, null,
    ],
    bass: [
      33, 33, null, 33, 40, null, 38, null, 36, 36, null, 36, 35, null, 33, null,
      33, 33, null, 33, 41, null, 40, null, 38, null, 35, null, 33, null, null, null,
    ],
  },
  town: {
    bpm: 104,
    leadWave: 'triangle',
    bassWave: 'triangle',
    lead: [
      67, null, 71, 74, 72, null, 71, 69, 67, null, 64, null, 67, null, null, null,
      69, null, 72, 76, 74, null, 72, 71, 69, null, null, null, 71, null, 74, null,
      76, null, 74, 72, 71, null, 69, 67, 64, null, 67, 69, 71, null, 69, null,
      67, null, null, null, 64, null, 67, null, 69, null, 67, null, null, null, null, null,
    ],
    bass: [
      43, null, 50, null, 48, null, 52, null, 43, null, 47, null, 50, null, 47, null,
      45, null, 52, null, 50, null, 54, null, 45, null, 48, null, 43, null, 47, null,
      48, null, 52, null, 43, null, 47, null, 45, null, 48, null, 50, null, 45, null,
      43, null, 47, null, 48, null, 50, null, 43, null, null, null, null, null, null, null,
    ],
  },
  overworld: {
    bpm: 126,
    leadWave: 'square',
    bassWave: 'triangle',
    lead: [
      64, 67, 71, null, 72, null, 71, 67, 69, null, 67, 64, 62, null, null, null,
      64, 67, 71, null, 74, null, 72, 71, 69, null, 71, null, 74, null, null, null,
      76, null, 74, 72, 71, null, 69, 67, 69, 71, 72, null, 71, null, 67, null,
      64, null, 67, 69, 71, null, 69, 67, 64, null, null, null, null, null, null, null,
    ],
    bass: [
      40, null, 47, null, 48, null, 47, null, 45, null, 43, null, 42, null, 47, null,
      40, null, 47, null, 50, null, 48, null, 45, null, 47, null, 50, null, 47, null,
      48, null, 52, null, 43, null, 47, null, 45, null, 48, null, 47, null, 43, null,
      40, null, 43, null, 47, null, 45, null, 40, null, 47, null, 40, null, null, null,
    ],
  },
  shrine: {
    bpm: 96,
    leadWave: 'triangle',
    bassWave: 'sine',
    lead: [
      62, null, null, 65, 69, null, 68, null, 65, null, 62, null, 61, null, null, null,
      62, null, 65, null, 70, null, 69, null, 67, null, 65, null, 64, null, null, null,
    ],
    bass: [
      38, null, 45, null, 38, null, 44, null, 38, null, 41, null, 37, null, 45, null,
      38, null, 45, null, 46, null, 45, null, 43, null, 41, null, 40, null, 45, null,
    ],
  },
  battle: {
    bpm: 152,
    leadWave: 'square',
    bassWave: 'sawtooth',
    lead: [
      64, 67, 71, 72, 71, 67, 64, 67, 74, null, 72, 71, 69, null, 67, null,
      64, 67, 71, 76, 74, 72, 71, 69, 71, null, 74, null, 76, null, null, null,
      79, 76, 74, 72, 71, 72, 74, 71, 72, 71, 69, 67, 69, null, 71, null,
      72, 71, 69, 67, 66, 67, 69, 71, 64, null, 71, null, 76, null, null, null,
    ],
    bass: [
      40, 40, 47, 40, 48, 48, 47, 40, 43, 43, 50, 43, 45, 45, 47, 45,
      40, 40, 47, 40, 50, 50, 48, 47, 45, 45, 47, 47, 52, 47, 40, null,
      48, 48, 52, 48, 47, 47, 50, 47, 45, 45, 48, 45, 43, 43, 47, 43,
      48, 48, 45, 45, 42, 42, 47, 47, 40, 40, 47, 47, 52, null, 47, null,
    ],
  },
  boss: {
    bpm: 164,
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    lead: [
      62, 65, 69, 70, 69, 65, 62, 61, 62, 65, 69, 74, 73, null, 70, 69,
      74, 77, 76, 74, 73, 70, 69, 67, 69, null, 73, null, 74, null, null, null,
      77, 76, 74, 73, 74, 70, 69, 65, 67, 69, 70, 74, 73, null, 69, null,
      65, 69, 70, 74, 76, 74, 73, 70, 74, null, 81, null, 74, null, null, null,
    ],
    bass: [
      38, 38, 45, 38, 46, 46, 45, 38, 38, 38, 45, 38, 37, 37, 44, 37,
      38, 38, 46, 46, 45, 45, 43, 43, 45, 45, 49, 49, 50, 45, 38, null,
      41, 41, 45, 41, 46, 46, 50, 46, 43, 43, 46, 43, 45, 45, 49, 45,
      46, 46, 43, 43, 45, 45, 49, 49, 38, 38, 45, 45, 50, null, 38, null,
    ],
  },
  victory: {
    bpm: 138,
    leadWave: 'square',
    bassWave: 'triangle',
    lead: [
      67, 67, 67, 72, null, 76, null, 74, 72, 74, 76, null, 79, null, null, null,
      76, 74, 72, 74, 76, null, 72, null, 74, null, 79, null, 84, null, null, null,
    ],
    bass: [
      48, null, 52, null, 55, null, 52, null, 43, null, 47, null, 50, null, 47, null,
      45, null, 48, null, 52, null, 48, null, 43, null, 50, null, 48, null, null, null,
    ],
  },
};
