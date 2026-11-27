import { ITEMS } from '@data/items';
import { SPECIES } from '@data/species';
import { createPokemonInstance } from '@engine/battleMath';
import type { GameState, PokemonInstance, QuestDef, TimeOfDay } from '@engine/types';

export const SAVE_VERSION = 1;

export const CHAPTER_1_QUESTS: QuestDef[] = [
  {
    id: 'q_orders',
    chapter: 1,
    title: 'Syndicate Orders',
    description: 'Report to Officer Vance inside Embervale Garrison to receive your field orders.',
    completeFlag: 'briefing_done',
  },
  {
    id: 'q_elder',
    chapter: 1,
    title: 'The Emerald Key',
    description: "Visit Elder Rowan's Cottage in SE Embervale Town about the sealed Emerald Shrine.",
    startFlag: 'briefing_done',
    completeFlag: 'got_shrine_key',
  },
  {
    id: 'q_statue',
    chapter: 1,
    title: 'Awaken the Dragon Blood',
    description: 'Find the Ancient Dragon Statue in Verdant Wilds to unlock Whelp Resonance.',
    startFlag: 'briefing_done',
    completeFlag: 'unlocked_whelp',
  },
  {
    id: 'q_rescue',
    chapter: 1,
    title: 'Trapped in the Wilds',
    description: 'Investigate the Syndicate Poacher Camp in Verdant Wilds and recruit a new ally.',
    startFlag: 'briefing_done',
    completeFlag: 'rescued_ally',
  },
  {
    id: 'q_shrine',
    chapter: 1,
    title: 'Heart of the Sunken Shrine',
    description: 'Use Lead Field Skills inside Sunken Emerald Shrine and confront Admin Vex.',
    startFlag: 'got_shrine_key',
    completeFlag: 'chapter1_cleared',
  },
];

export function createInitialGameState(starterId: string, playerName = 'Kael'): GameState {
  const starter = createPokemonInstance(starterId, 5, { isPartner: true });
  // Give a complementary starter buddy so BoF party feel starts immediately!
  const buddyId = starterId === 'charmander' ? 'pidgey' : starterId === 'dratini' ? 'oddish' : 'growlithe';
  const buddy = createPokemonInstance(buddyId, 4);

  return {
    version: SAVE_VERSION,
    chapter: 1,
    playerName,
    starterId,
    mapId: 'garrison',
    x: 7,
    y: 8,
    facing: 'up',
    trail: [
      { x: 7, y: 9, facing: 'up' },
      { x: 7, y: 10, facing: 'up' },
      { x: 7, y: 10, facing: 'up' },
      { x: 7, y: 10, facing: 'up' },
    ],
    party: [starter, buddy],
    storage: [],
    inventory: [
      { itemId: 'herb', qty: 5 },
      { itemId: 'ether_berry', qty: 2 },
      { itemId: 'antidote', qty: 2 },
      { itemId: 'seal_orb', qty: 6 },
      { itemId: 'dusk_orb', qty: 2 },
      { itemId: 'wooden_lure', qty: 3 },
      { itemId: 'dragon_scale', qty: 1 },
    ],
    gold: 160,
    timeMinutes: 540, // 9:00 AM crisp morning
    stepCount: 0,
    alignment: 0,
    resonanceGauge: 50,
    unlockedResonances: [],
    unlockedLore: [],
    seenSpecies: [starterId, buddyId],
    caughtSpecies: [starterId, buddyId],
    flags: {},
    playtimeSeconds: 0,
    settings: {
      crt: true,
      muted: false,
      battleSpeed: 1,
    },
  };
}

export function unlockLore(state: GameState, loreId: string): boolean {
  if (!state.unlockedLore) state.unlockedLore = [];
  if (state.unlockedLore.includes(loreId)) return false;
  state.unlockedLore.push(loreId);
  return true;
}

export function getTimeOfDay(timeMinutes: number): TimeOfDay {
  const m = ((timeMinutes % 1440) + 1440) % 1440;
  if (m >= 330 && m < 480) return 'dawn';
  if (m >= 480 && m < 1050) return 'day';
  if (m >= 1050 && m < 1200) return 'dusk';
  return 'night';
}

export function formatClock(timeMinutes: number): string {
  const m = ((Math.floor(timeMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min.toString().padStart(2, '0')} ${suffix}`;
}

export function getAlignmentTitle(alignment: number): string {
  if (alignment <= -3) return 'Iron Syndicate Loyalist';
  if (alignment <= -1) return 'Obsidian Operative';
  if (alignment === 0) return 'Undecided Scout';
  if (alignment <= 2) return 'Reluctant Sympathizer';
  return 'Dragon-Heart Rebel';
}

export function addItem(state: GameState, itemId: string, qty: number): void {
  if (!ITEMS[itemId] || qty <= 0) return;
  const existing = state.inventory.find((i) => i.itemId === itemId);
  if (existing) {
    existing.qty += qty;
  } else {
    state.inventory.push({ itemId, qty });
  }
}

export function removeItem(state: GameState, itemId: string, qty = 1): boolean {
  const idx = state.inventory.findIndex((i) => i.itemId === itemId);
  if (idx === -1 || state.inventory[idx].qty < qty) return false;
  state.inventory[idx].qty -= qty;
  if (state.inventory[idx].qty <= 0) {
    state.inventory.splice(idx, 1);
  }
  return true;
}

export function getItemQty(state: GameState, itemId: string): number {
  return state.inventory.find((i) => i.itemId === itemId)?.qty ?? 0;
}

export function markSeen(state: GameState, speciesId: string): void {
  if (!state.seenSpecies.includes(speciesId)) {
    state.seenSpecies.push(speciesId);
  }
}

export function addPokemonToRoster(state: GameState, mon: PokemonInstance): 'party' | 'storage' {
  markSeen(state, mon.speciesId);
  if (!state.caughtSpecies.includes(mon.speciesId)) {
    state.caughtSpecies.push(mon.speciesId);
  }
  if (state.party.length < 4) {
    state.party.push(mon);
    return 'party';
  }
  state.storage.push(mon);
  return 'storage';
}

export function rotatePartyLead(state: GameState, dir: 1 | -1 = 1): PokemonInstance | null {
  if (state.party.length <= 1) return state.party[0] ?? null;
  if (dir === 1) {
    const first = state.party.shift()!;
    state.party.push(first);
  } else {
    const last = state.party.pop()!;
    state.party.unshift(last);
  }
  return state.party[0];
}

export function healFullParty(state: GameState): void {
  for (const mon of state.party) {
    mon.hp = mon.maxHp;
    mon.ap = mon.maxAp;
    mon.status = 'none';
    mon.activeResonanceId = null;
  }
  state.resonanceGauge = Math.max(state.resonanceGauge, 50);
}

export function getLeadPokemon(state: GameState): PokemonInstance {
  return state.party[0];
}

export function getLeadAbility(state: GameState) {
  const lead = state.party[0];
  const sp = SPECIES[lead.speciesId];
  return {
    ability: sp.fieldAbility,
    abilityName: sp.fieldAbilityName,
    speciesName: sp.name,
  };
}

export function useItemOnPokemon(state: GameState, itemId: string, target: PokemonInstance): string | null {
  const item = ITEMS[itemId];
  if (!item) return null;
  if (getItemQty(state, itemId) <= 0) return null;

  if (item.category === 'heal') {
    if (target.hp <= 0 || target.hp >= target.maxHp) return null;
    target.hp = Math.min(target.maxHp, target.hp + item.power);
    removeItem(state, itemId, 1);
    return `${SPECIES[target.speciesId].name} recovered HP!`;
  }
  if (item.category === 'ap') {
    if (target.ap >= target.maxAp) return null;
    target.ap = Math.min(target.maxAp, target.ap + item.power);
    removeItem(state, itemId, 1);
    return `${SPECIES[target.speciesId].name} restored AP!`;
  }
  if (item.category === 'status') {
    if (target.status === 'none') return null;
    target.status = 'none';
    removeItem(state, itemId, 1);
    return `${SPECIES[target.speciesId].name}'s status was purified!`;
  }
  if (item.category === 'revive') {
    if (target.hp > 0) return null;
    target.hp = Math.max(1, Math.floor((target.maxHp * item.power) / 100));
    target.status = 'none';
    removeItem(state, itemId, 1);
    return `${SPECIES[target.speciesId].name} stood back up!`;
  }
  return null;
}
