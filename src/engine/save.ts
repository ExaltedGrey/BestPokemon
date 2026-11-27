import { MAPS } from '@data/maps';
import { SPECIES } from '@data/species';
import { SAVE_VERSION } from '@engine/state';
import type { GameState, SaveSlotSummary } from '@engine/types';

const STORAGE_PREFIX = 'pbotd_save_slot_';
const AUTOSAVE_KEY = 'pbotd_save_autosave';

interface SaveEnvelope {
  version: number;
  savedAt: string;
  state: GameState;
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function serializeSave(state: GameState): string {
  const envelope: SaveEnvelope = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(envelope, null, 2);
}

export function deserializeSave(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SaveEnvelope> & Partial<GameState>;
    // Support both SaveEnvelope and bare GameState JSON files
    const candidate = parsed?.state ?? (Array.isArray(parsed?.party) ? (parsed as GameState) : null);
    if (!candidate || !Array.isArray(candidate.party) || candidate.party.length === 0) return null;

    if (!Array.isArray(candidate.unlockedLore)) candidate.unlockedLore = [];
    if (!Array.isArray(candidate.unlockedResonances)) candidate.unlockedResonances = [];
    if (!Array.isArray(candidate.storage)) candidate.storage = [];
    if (!Array.isArray(candidate.inventory)) candidate.inventory = [];
    if (!candidate.flags || typeof candidate.flags !== 'object') candidate.flags = {};
    if (!candidate.settings) {
      candidate.settings = { crt: true, muted: false, battleSpeed: 1 };
    }

    const map = MAPS[candidate.mapId];
    if (!map || candidate.x < 0 || candidate.y < 0 || candidate.x >= map.width || candidate.y >= map.height) {
      candidate.mapId = 'embervale';
      candidate.x = 14;
      candidate.y = 11;
      candidate.facing = 'down';
    }
    return candidate;
  } catch {
    return null;
  }
}

export function saveGameToSlot(slot: number, state: GameState): boolean {
  const store = getStorage();
  if (!store) return false;
  try {
    const key = slot === 0 ? AUTOSAVE_KEY : `${STORAGE_PREFIX}${slot}`;
    store.setItem(key, serializeSave(state));
    return true;
  } catch {
    return false;
  }
}

export function autoSaveGame(state: GameState): boolean {
  return saveGameToSlot(0, state);
}

export function loadGameFromSlot(slot: number): GameState | null {
  const store = getStorage();
  if (!store) return null;
  const key = slot === 0 ? AUTOSAVE_KEY : `${STORAGE_PREFIX}${slot}`;
  const raw = store.getItem(key);
  if (!raw) return null;
  return deserializeSave(raw);
}

export function loadAutoSave(): GameState | null {
  return loadGameFromSlot(0);
}

function summarizeRaw(slot: number, raw: string | null | undefined): SaveSlotSummary {
  if (!raw) return { slot, empty: true };
  try {
    const env = JSON.parse(raw) as SaveEnvelope;
    const st = env.state;
    const lead = st.party[0];
    return {
      slot,
      empty: false,
      playerName: st.playerName,
      mapName: MAPS[st.mapId]?.name ?? st.mapId,
      leadName: lead ? SPECIES[lead.speciesId]?.name ?? lead.speciesId : 'None',
      leadLevel: lead?.level ?? 1,
      playtimeSeconds: st.playtimeSeconds,
      chapter: st.chapter,
      savedAt: env.savedAt,
    };
  } catch {
    return { slot, empty: true };
  }
}

export function listSaveSlots(): SaveSlotSummary[] {
  const store = getStorage();
  return [1, 2, 3].map((slot) => summarizeRaw(slot, store?.getItem(`${STORAGE_PREFIX}${slot}`)));
}

export function listAllSaveSlots(): SaveSlotSummary[] {
  const store = getStorage();
  return [
    summarizeRaw(0, store?.getItem(AUTOSAVE_KEY)),
    ...listSaveSlots(),
  ];
}

export function exportSaveFilename(state: GameState): string {
  const safeName = (state.playerName || 'kael').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `breath_of_the_dragon_${safeName}_ch${state.chapter}.json`;
}

export function importSaveFromJson(raw: string): GameState | null {
  return deserializeSave(raw);
}
