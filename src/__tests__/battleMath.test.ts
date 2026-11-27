import { describe, expect, it } from 'vitest';
import { MOVES } from '@data/moves';
import { getTypeMultiplier } from '@data/typeChart';
import {
  calculateCatchProbability,
  calculateDamage,
  createPokemonInstance,
  getAvailableMovesForBattle,
  getEffectiveCombatStats,
} from '@engine/battleMath';

describe('Battle Math & Dragon Resonance', () => {
  it('applies Pokémon type matchups and Dragon > Shadow advantage', () => {
    expect(getTypeMultiplier('Fire', ['Grass'])).toBe(2);
    expect(getTypeMultiplier('Water', ['Fire'])).toBe(2);
    expect(getTypeMultiplier('Dragon', ['Shadow'])).toBe(2);
    expect(getTypeMultiplier('Shadow', ['Dragon'])).toBe(0.5);
    expect(getTypeMultiplier('Shadow', ['Normal'])).toBe(1.5);
  });

  it('boosts stats and grants signature AoE move when Dragon Resonance is active', () => {
    const charmander = createPokemonInstance('charmander', 6, { isPartner: true });
    const baseStats = getEffectiveCombatStats(charmander);
    charmander.activeResonanceId = 'whelp';
    const resStats = getEffectiveCombatStats(charmander);

    expect(resStats.atk).toBeGreaterThan(baseStats.atk);
    expect(resStats.def).toBeGreaterThan(baseStats.def);
    const moves = getAvailableMovesForBattle(charmander);
    expect(moves.some((m) => m.id === 'dragon_breath')).toBe(true);
  });

  it('reduces incoming damage when defender is guarding and boosts super-effective hits', () => {
    const attacker = createPokemonInstance('charmander', 6);
    const defender = createPokemonInstance('bulbasaur', 6);
    const fixedRng = () => 0.5;

    const normalHit = calculateDamage(attacker, defender, MOVES.ember, { rng: fixedRng });
    const guardedHit = calculateDamage(attacker, defender, MOVES.ember, {
      defenderGuarding: true,
      rng: fixedRng,
    });

    expect(normalHit.missed).toBe(false);
    expect(normalHit.effectiveness).toBe(2);
    expect(guardedHit.damage).toBeLessThan(normalHit.damage);
  });

  it('calculates higher catch probability for Dusk Orb at night and 0 for uncatchable bosses', () => {
    const gastly = createPokemonInstance('gastly', 5);
    gastly.hp = Math.floor(gastly.maxHp * 0.25);

    const dayProb = calculateCatchProbability(gastly, 'dusk_orb', { timeOfDay: 'day', isShrine: false });
    const nightProb = calculateCatchProbability(gastly, 'dusk_orb', { timeOfDay: 'night', isShrine: false });
    expect(nightProb).toBeGreaterThan(dayProb);

    const boss = createPokemonInstance('shadow_gyarados', 9);
    expect(calculateCatchProbability(boss, 'great_orb', { timeOfDay: 'night', isShrine: true })).toBe(0);
  });
});
