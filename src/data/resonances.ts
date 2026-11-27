import type { ResonanceFormDef } from '@engine/types';

/**
 * Breath of Fire–inspired Dragon Resonance forms.
 * Unlocked by visiting Ancient Dragon Statues or claiming Dragon Crests.
 * Extensible registry for Chapter 2+ (Frost Wyrm, Aero Sovereign, Kaiser Dragon).
 */
export const RESONANCE_FORMS: Record<string, ResonanceFormDef> = {
  whelp: {
    id: 'whelp',
    name: 'Whelp Resonance',
    subtitle: 'First Seal of the Ancient Dragon',
    type: 'Dragon',
    apCost: 6,
    resonanceCost: 40,
    atkMult: 1.38,
    defMult: 1.32,
    spdMult: 1.15,
    signatureMoveId: 'dragon_breath',
    auraColor: '#58d8ff',
    spriteKey: 'res_whelp',
    description: 'Cloaks your partner in luminous dragon aura and unlocks Dragon Breath.',
  },
  pyre_wyrm: {
    id: 'pyre_wyrm',
    name: 'Pyre Wyrm',
    subtitle: 'Flame Aspect of the Crimson Crest',
    type: 'Fire',
    apCost: 10,
    resonanceCost: 65,
    atkMult: 1.58,
    defMult: 1.35,
    spdMult: 1.2,
    signatureMoveId: 'crimson_flare',
    auraColor: '#ff6c30',
    spriteKey: 'res_pyre',
    description: 'Ignites legendary flame scales and unlocks Crimson Flare.',
  },
  bolt_wyrm: {
    id: 'bolt_wyrm',
    name: 'Bolt Wyrm',
    subtitle: 'Thunder Aspect of the Emerald Shrine',
    type: 'Electric',
    apCost: 10,
    resonanceCost: 65,
    atkMult: 1.52,
    defMult: 1.28,
    spdMult: 1.45,
    signatureMoveId: 'storm_judgement',
    auraColor: '#ffe040',
    spriteKey: 'res_bolt',
    description: 'Channels living dragon lightning and unlocks Storm Judgement.',
  },
};

export const RESONANCE_ORDER = ['whelp', 'pyre_wyrm', 'bolt_wyrm'];
