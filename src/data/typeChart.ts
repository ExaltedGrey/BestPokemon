import type { PokemonType } from '@engine/types';

/**
 * Type effectiveness chart tailored for Pokémon: Breath of the Dragon.
 * Shadow moves deal 1.5x against normal Pokémon, while ancient Dragon energy
 * resists and strikes Shadow foes super-effectively (2.0x)!
 */
const CHART: Partial<Record<PokemonType, Partial<Record<PokemonType, number>>>> = {
  Normal: { Ghost: 0.5, Shadow: 0.75 },
  Fire: { Grass: 2, Fire: 0.5, Water: 0.5, Dragon: 0.5, Ground: 1 },
  Water: { Fire: 2, Ground: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
  Grass: { Water: 2, Ground: 2, Fire: 0.5, Grass: 0.5, Flying: 0.5, Poison: 0.5, Dragon: 0.5 },
  Electric: { Water: 2, Flying: 2, Electric: 0.5, Grass: 0.5, Dragon: 0.5, Ground: 0.25 },
  Dragon: { Dragon: 2, Shadow: 2 },
  Ground: { Fire: 2, Electric: 2, Poison: 2, Grass: 0.5, Flying: 0.25 },
  Flying: { Grass: 2, Electric: 0.5 },
  Ghost: { Ghost: 2, Dark: 0.5, Normal: 0.25 },
  Dark: { Ghost: 2, Dark: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Ghost: 0.5 },
  Shadow: {
    Normal: 1.5,
    Fire: 1.5,
    Water: 1.5,
    Grass: 1.5,
    Electric: 1.5,
    Ground: 1.5,
    Flying: 1.5,
    Ghost: 1.5,
    Dark: 1,
    Poison: 1.5,
    Dragon: 0.5,
    Shadow: 0.5,
  },
};

export function getTypeMultiplier(moveType: PokemonType, targetTypes: PokemonType[]): number {
  let mult = 1;
  const row = CHART[moveType];
  if (!row) return mult;
  for (const t of targetTypes) {
    const val = row[t];
    if (val !== undefined) {
      mult *= val;
    }
  }
  return mult;
}

export const TYPE_COLORS: Record<PokemonType, string> = {
  Normal: '#a8a890',
  Fire: '#f07030',
  Water: '#4890f0',
  Grass: '#58c048',
  Electric: '#f0c830',
  Dragon: '#7058f8',
  Ground: '#d8b058',
  Flying: '#90a8f0',
  Ghost: '#785898',
  Dark: '#584848',
  Poison: '#a848b8',
  Shadow: '#9838d8',
};
