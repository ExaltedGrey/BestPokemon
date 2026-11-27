import { describe, expect, it } from 'vitest';
import { awardExperience, createPokemonInstance } from '@engine/battleMath';
import {
  autoSaveGame,
  deserializeSave,
  exportSaveFilename,
  importSaveFromJson,
  listAllSaveSlots,
  loadAutoSave,
  serializeSave,
} from '@engine/save';
import {
  addPokemonToRoster,
  createInitialGameState,
  getAlignmentTitle,
  getTimeOfDay,
  rotatePartyLead,
  unlockLore,
  useItemOnPokemon,
} from '@engine/state';

describe('Progression, Roster & Save Serialization', () => {
  it('levels up, learns moves, and evolves starter at evolution threshold', () => {
    const charmander = createPokemonInstance('charmander', 8, { isPartner: true });
    const summary = awardExperience(charmander, 1200);

    expect(summary.leveledUp).toBe(true);
    expect(charmander.level).toBeGreaterThanOrEqual(10);
    expect(charmander.speciesId).toBe('charmeleon');
    expect(summary.evolvedFrom).toBe('Charmander');
    expect(summary.evolvedTo).toBe('Charmeleon');
  });

  it('sends 5th caught Pokémon to Camp Box storage and rotates party lead cleanly', () => {
    const state = createInitialGameState('dratini');
    expect(state.party.length).toBe(2);

    expect(addPokemonToRoster(state, createPokemonInstance('pikachu', 5))).toBe('party');
    expect(addPokemonToRoster(state, createPokemonInstance('sandshrew', 5))).toBe('party');
    expect(state.party.length).toBe(4);

    expect(addPokemonToRoster(state, createPokemonInstance('eevee', 5))).toBe('storage');
    expect(state.storage.length).toBe(1);

    const prevLead = state.party[0].uid;
    rotatePartyLead(state, 1);
    expect(state.party[0].uid).not.toBe(prevLead);
    expect(state.party[state.party.length - 1].uid).toBe(prevLead);
  });

  it('uses healing herbs properly, tracks Lore Codex, and migrates legacy saves', () => {
    const state = createInitialGameState('bulbasaur');
    state.party[0].hp = 10;
    const msg = useItemOnPokemon(state, 'herb', state.party[0]);
    expect(msg).toContain('recovered HP');
    expect(state.party[0].hp).toBeGreaterThan(10);

    expect(unlockLore(state, 'four_guardians')).toBe(true);
    expect(unlockLore(state, 'four_guardians')).toBe(false);
    expect(state.unlockedLore).toEqual(['four_guardians']);

    state.alignment = 4;
    expect(getAlignmentTitle(state.alignment)).toBe('Dragon-Heart Rebel');
    expect(getTimeOfDay(540)).toBe('day');
    expect(getTimeOfDay(1320)).toBe('night');

    const raw = serializeSave(state);
    const parsed = JSON.parse(raw);
    delete parsed.state.unlockedLore;
    const migrated = deserializeSave(JSON.stringify(parsed));
    expect(migrated).not.toBeNull();
    expect(migrated!.unlockedLore).toEqual([]);
    expect(migrated!.starterId).toBe('bulbasaur');
  });

  it('supports portable JSON save export/import and slot listing (AUTO + 1-3)', () => {
    const state = createInitialGameState('charmander');
    expect(exportSaveFilename(state)).toBe('breath_of_the_dragon_kael_ch1.json');

    const json = serializeSave(state);
    const imported = importSaveFromJson(json);
    expect(imported).not.toBeNull();
    expect(imported!.starterId).toBe('charmander');
    expect(importSaveFromJson('not valid json')).toBeNull();
    expect(importSaveFromJson('{"party":[]}')).toBeNull();

    // Node test environment has no localStorage by default; verify graceful fallback
    expect(autoSaveGame(state)).toBe(false);
    expect(loadAutoSave()).toBeNull();
    const slots = listAllSaveSlots();
    expect(slots.map((s) => s.slot)).toEqual([0, 1, 2, 3]);
  });
});
