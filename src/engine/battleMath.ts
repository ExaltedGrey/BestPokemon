import { ITEMS } from '@data/items';
import { MOVES } from '@data/moves';
import { RESONANCE_FORMS } from '@data/resonances';
import { SPECIES } from '@data/species';
import { getTypeMultiplier } from '@data/typeChart';
import type { MoveDef, PokemonInstance, PokemonType, TimeOfDay } from '@engine/types';

let uidCounter = 1;

export function expForLevel(level: number): number {
  return Math.floor(24 * Math.pow(level, 1.85));
}

export function computeStatsForLevel(speciesId: string, level: number) {
  const sp = SPECIES[speciesId];
  if (!sp) throw new Error(`Unknown species: ${speciesId}`);
  const scale = 1 + (level - 1) * 0.16;
  const maxHp = Math.floor(sp.baseHp * scale + (level - 1) * 5);
  const maxAp = Math.floor(sp.baseAp + (level - 1) * 2.5);
  const atk = Math.floor(sp.baseAtk * scale + (level - 1) * 1.4);
  const def = Math.floor(sp.baseDef * scale + (level - 1) * 1.2);
  const spd = Math.floor(sp.baseSpd * scale + (level - 1) * 1.1);
  return { maxHp, maxAp, atk, def, spd };
}

export function createPokemonInstance(
  speciesId: string,
  level: number,
  options?: { isPartner?: boolean; nickname?: string },
): PokemonInstance {
  const sp = SPECIES[speciesId];
  if (!sp) throw new Error(`Unknown species: ${speciesId}`);
  const stats = computeStatsForLevel(speciesId, level);
  const unlockedMoves = sp.learnset
    .filter((entry) => entry.level <= level)
    .map((entry) => entry.moveId)
    .slice(-4);
  if (unlockedMoves.length === 0) unlockedMoves.push('tackle');

  return {
    uid: `pk_${Date.now().toString(36)}_${uidCounter++}`,
    speciesId,
    nickname: options?.nickname,
    level,
    exp: 0,
    nextLevelExp: expForLevel(level + 1) - expForLevel(level),
    maxHp: stats.maxHp,
    hp: stats.maxHp,
    maxAp: stats.maxAp,
    ap: stats.maxAp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    moves: unlockedMoves,
    status: 'none',
    isPartner: options?.isPartner ?? false,
    activeResonanceId: null,
  };
}

export function getDisplayName(mon: PokemonInstance): string {
  return mon.nickname || SPECIES[mon.speciesId]?.name || mon.speciesId;
}

export function getEffectiveTypes(mon: PokemonInstance): PokemonType[] {
  const sp = SPECIES[mon.speciesId];
  const base: PokemonType[] = sp ? [...sp.types] : ['Normal'];
  if (mon.activeResonanceId) {
    const form = RESONANCE_FORMS[mon.activeResonanceId];
    if (form && !base.includes(form.type)) {
      return ['Dragon', form.type];
    }
    if (!base.includes('Dragon')) return [...base, 'Dragon'];
  }
  return base;
}

export function getEffectiveCombatStats(
  mon: PokemonInstance,
  buffs?: { atk?: number; def?: number; spd?: number },
) {
  let atk = mon.atk;
  let def = mon.def;
  let spd = mon.spd;

  if (mon.activeResonanceId) {
    const form = RESONANCE_FORMS[mon.activeResonanceId];
    if (form) {
      atk = Math.floor(atk * form.atkMult);
      def = Math.floor(def * form.defMult);
      spd = Math.floor(spd * form.spdMult);
    }
  }
  if (mon.status === 'burn') atk = Math.max(1, Math.floor(atk * 0.8));
  if (mon.status === 'paralyze') spd = Math.max(1, Math.floor(spd * 0.6));

  const atkStage = buffs?.atk ?? 0;
  const defStage = buffs?.def ?? 0;
  const spdStage = buffs?.spd ?? 0;
  atk = Math.floor(atk * (1 + atkStage * 0.25));
  def = Math.floor(def * (1 + defStage * 0.25));
  spd = Math.floor(spd * (1 + spdStage * 0.25));

  return { atk, def, spd };
}

export interface DamageResult {
  damage: number;
  effectiveness: number;
  isCrit: boolean;
  missed: boolean;
  appliedStatus?: PokemonInstance['status'];
}

export function calculateDamage(
  attacker: PokemonInstance,
  defender: PokemonInstance,
  move: MoveDef,
  options?: {
    defenderGuarding?: boolean;
    attackerBuffs?: { atk?: number; def?: number; spd?: number };
    defenderBuffs?: { atk?: number; def?: number; spd?: number };
    rng?: () => number;
  },
): DamageResult {
  const rng = options?.rng ?? Math.random;
  if (rng() * 100 > move.accuracy) {
    return { damage: 0, effectiveness: 1, isCrit: false, missed: true };
  }

  const aStats = getEffectiveCombatStats(attacker, options?.attackerBuffs);
  const dStats = getEffectiveCombatStats(defender, options?.defenderBuffs);
  const attackerTypes = getEffectiveTypes(attacker);
  const defenderTypes = getEffectiveTypes(defender);

  const stab = attackerTypes.includes(move.type) ? 1.25 : 1.0;
  const effectiveness = getTypeMultiplier(move.type, defenderTypes);
  const isCrit = rng() < 0.08;
  const critMult = isCrit ? 1.5 : 1.0;
  const guardMult = options?.defenderGuarding ? 0.55 : 1.0;
  const variance = 0.9 + rng() * 0.18;

  const base = ((move.power * 0.48 + attacker.level * 1.6) * (aStats.atk / Math.max(8, dStats.def * 0.85)));
  const raw = base * stab * effectiveness * critMult * guardMult * variance;
  const damage = Math.max(1, Math.round(raw));

  let appliedStatus: PokemonInstance['status'] | undefined;
  if (
    move.statusEffect &&
    move.statusEffect !== 'none' &&
    defender.status === 'none' &&
    rng() < (move.statusChance ?? 0.2)
  ) {
    appliedStatus = move.statusEffect;
  }

  return {
    damage,
    effectiveness,
    isCrit,
    missed: false,
    appliedStatus,
  };
}

export function calculateCatchProbability(
  target: PokemonInstance,
  orbItemId: string,
  context: { timeOfDay: TimeOfDay; isShrine: boolean },
): number {
  const sp = SPECIES[target.speciesId];
  const orb = ITEMS[orbItemId];
  if (!sp || !orb || sp.catchRate <= 0 || sp.isBoss) return 0;

  let orbMult = orb.power / 10;
  if (orb.nightBonus && (context.timeOfDay === 'night' || context.timeOfDay === 'dusk' || context.isShrine)) {
    orbMult = orb.nightBonus / 10;
  }

  const hpFactor = (3 * target.maxHp - 2 * target.hp) / (3 * target.maxHp);
  const statusBonus = target.status !== 'none' ? 1.35 : 1.0;
  const baseChance = (sp.catchRate / 255) * hpFactor * orbMult * statusBonus;
  return Math.max(0.08, Math.min(0.96, baseChance));
}

export interface LevelUpSummary {
  leveledUp: boolean;
  newLevel: number;
  learnedMoves: string[];
  evolvedFrom?: string;
  evolvedTo?: string;
}

export function awardExperience(mon: PokemonInstance, expGain: number): LevelUpSummary {
  const summary: LevelUpSummary = {
    leveledUp: false,
    newLevel: mon.level,
    learnedMoves: [],
  };
  if (mon.hp <= 0) return summary;

  mon.exp += expGain;
  while (mon.exp >= mon.nextLevelExp && mon.level < 50) {
    mon.exp -= mon.nextLevelExp;
    mon.level += 1;
    summary.leveledUp = true;
    summary.newLevel = mon.level;

    // Check evolution
    const currentSp = SPECIES[mon.speciesId];
    if (currentSp?.evolvesTo && mon.level >= currentSp.evolvesTo.level) {
      summary.evolvedFrom = currentSp.name;
      mon.speciesId = currentSp.evolvesTo.speciesId;
      summary.evolvedTo = SPECIES[mon.speciesId].name;
    }

    const updatedStats = computeStatsForLevel(mon.speciesId, mon.level);
    const hpDiff = Math.max(2, updatedStats.maxHp - mon.maxHp);
    const apDiff = Math.max(1, updatedStats.maxAp - mon.maxAp);
    mon.maxHp = updatedStats.maxHp;
    mon.hp = Math.min(mon.maxHp, mon.hp + hpDiff);
    mon.maxAp = updatedStats.maxAp;
    mon.ap = Math.min(mon.maxAp, mon.ap + apDiff);
    mon.atk = updatedStats.atk;
    mon.def = updatedStats.def;
    mon.spd = updatedStats.spd;
    mon.nextLevelExp = Math.max(25, expForLevel(mon.level + 1) - expForLevel(mon.level));

    // Learn new moves
    const sp = SPECIES[mon.speciesId];
    for (const entry of sp.learnset) {
      if (entry.level === mon.level && !mon.moves.includes(entry.moveId)) {
        if (mon.moves.length < 4) {
          mon.moves.push(entry.moveId);
        } else {
          mon.moves[0] = entry.moveId;
        }
        summary.learnedMoves.push(MOVES[entry.moveId]?.name ?? entry.moveId);
      }
    }
  }
  return summary;
}

export function getAvailableMovesForBattle(mon: PokemonInstance): MoveDef[] {
  const moveIds = [...mon.moves];
  if (mon.activeResonanceId) {
    const form = RESONANCE_FORMS[mon.activeResonanceId];
    if (form && !moveIds.includes(form.signatureMoveId)) {
      moveIds.unshift(form.signatureMoveId);
    }
  }
  return moveIds.map((id) => MOVES[id]).filter((m): m is MoveDef => Boolean(m));
}
