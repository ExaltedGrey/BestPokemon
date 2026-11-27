import { describe, expect, it } from 'vitest';
import { SCRIPTED_BATTLES } from '@data/battles';
import { DIALOGUES } from '@data/dialogues';
import { ITEMS } from '@data/items';
import { LORE_BY_ID, LORE_ENTRIES } from '@data/lore';
import { MAPS } from '@data/maps';
import { parseTile, SOLID_TILES } from '@data/maps/tiles';
import { SPECIES } from '@data/species';

describe('World Maps, Warps, Interiors, Lore & Dialogue Integrity', () => {
  it('ensures all 7 map layouts match declared width and height exactly', () => {
    expect(Object.keys(MAPS).length).toBe(7);
    for (const map of Object.values(MAPS)) {
      expect(map.layout.length).toBe(map.height);
      for (const row of map.layout) {
        expect(row.length).toBe(map.width);
      }
    }
  });

  it('ensures every warp leads to an existing map and a walkable tile', () => {
    for (const map of Object.values(MAPS)) {
      for (const warp of map.warps) {
        const dest = MAPS[warp.targetMap];
        expect(dest).toBeDefined();
        expect(warp.targetX).toBeGreaterThanOrEqual(0);
        expect(warp.targetX).toBeLessThan(dest.width);
        expect(warp.targetY).toBeGreaterThanOrEqual(0);
        expect(warp.targetY).toBeLessThan(dest.height);

        const destTile = parseTile(dest.layout[warp.targetY][warp.targetX]);
        expect(SOLID_TILES.has(destTile)).toBe(false);
      }
    }
  });

  it('ensures every entity dialogue, chest item, lore unlock, encounter species, and battle exists', () => {
    const obtainableLore = new Set<string>();

    for (const map of Object.values(MAPS)) {
      for (const ent of map.entities) {
        if (ent.dialogueId) expect(DIALOGUES[ent.dialogueId]).toBeDefined();
        if (ent.chestItem) expect(ITEMS[ent.chestItem.itemId]).toBeDefined();
      }
      for (const enc of [...map.dayEncounters, ...map.nightEncounters]) {
        expect(SPECIES[enc.speciesId]).toBeDefined();
      }
    }

    for (const node of Object.values(DIALOGUES)) {
      if (node.nextId) expect(DIALOGUES[node.nextId]).toBeDefined();
      if (node.startBattle) expect(SCRIPTED_BATTLES[node.startBattle]).toBeDefined();
      if (node.unlockLoreId) {
        expect(LORE_BY_ID[node.unlockLoreId]).toBeDefined();
        obtainableLore.add(node.unlockLoreId);
      }
      for (const choice of node.choices ?? []) {
        if (choice.nextId) expect(DIALOGUES[choice.nextId]).toBeDefined();
        if (choice.startBattle) expect(SCRIPTED_BATTLES[choice.startBattle]).toBeDefined();
        if (choice.giveItem) expect(ITEMS[choice.giveItem.itemId]).toBeDefined();
        if (choice.recruitSpecies) expect(SPECIES[choice.recruitSpecies.speciesId]).toBeDefined();
        if (choice.unlockLoreId) {
          expect(LORE_BY_ID[choice.unlockLoreId]).toBeDefined();
          obtainableLore.add(choice.unlockLoreId);
        }
      }
    }

    // All 10 Lore Codex entries are obtainable in Chapter 1
    for (const lore of LORE_ENTRIES) {
      expect(obtainableLore.has(lore.id)).toBe(true);
    }
  });

  it('provides distinct nocturnal encounters in Verdant Wilds', () => {
    const wilds = MAPS.verdant_wilds;
    const dayIds = new Set(wilds.dayEncounters.map((e) => e.speciesId));
    const nightIds = new Set(wilds.nightEncounters.map((e) => e.speciesId));
    expect(nightIds.has('gastly')).toBe(true);
    expect(nightIds.has('houndour')).toBe(true);
    expect(dayIds.has('gastly')).toBe(false);
  });

  it('proves all 7 maps, village interiors, lore props, Dragon Statue, Willow Pier, and Admin Vex are reachable via BFS', () => {
    const bfsReachable = (mapId: string, startX: number, startY: number, unlockedAllFlags = false) => {
      const map = MAPS[mapId];
      const visited = new Set<string>();
      const queue: Array<[number, number]> = [[startX, startY]];
      visited.add(`${startX},${startY}`);

      const isPassable = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
        let tile = parseTile(map.layout[y][x]);
        if (tile === 'sealed_gate' && unlockedAllFlags) tile = 'open_gate';
        if (SOLID_TILES.has(tile)) return false;
        for (const obs of map.obstacles) {
          if (obs.x === x && obs.y === y) {
            if (obs.kind === 'brazier' || obs.kind === 'rune') return false;
            if (!unlockedAllFlags && obs.kind !== 'buried_chest') return false;
          }
        }
        for (const ent of map.entities) {
          if (ent.x === x && ent.y === y) return false;
        }
        return true;
      };

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx;
          const ny = cy + dy;
          const key = `${nx},${ny}`;
          if (!visited.has(key) && isPassable(nx, ny)) {
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
      }
      return visited;
    };

    const isAdjacentReachable = (visited: Set<string>, x: number, y: number) =>
      visited.has(`${x + 1},${y}`) ||
      visited.has(`${x - 1},${y}`) ||
      visited.has(`${x},${y + 1}`) ||
      visited.has(`${x},${y - 1}`);

    // 1. Garrison spawn (7,8) reaches Vance (7,3), Dossier (11,4), War Table (3,6), Crate (12,6), Exit (7,10)
    const gar = bfsReachable('garrison', 7, 8);
    expect(isAdjacentReachable(gar, 7, 3)).toBe(true);
    expect(isAdjacentReachable(gar, 11, 4)).toBe(true);
    expect(isAdjacentReachable(gar, 3, 6)).toBe(true);
    expect(isAdjacentReachable(gar, 12, 6)).toBe(true);
    expect(gar.has('7,10')).toBe(true);

    // 2. Expanded Embervale entry (3,5) reaches all 3 doors, bridges, Memorial Grove, Plaque, Notice Board, and East Gate (29,9)
    const town = bfsReachable('embervale', 3, 5);
    expect(town.has('3,4')).toBe(true); // Garrison door
    expect(town.has('14,4')).toBe(true); // Tavern door
    expect(town.has('25,4')).toBe(true); // Mart door
    expect(town.has('22,18')).toBe(true); // Elder Cottage door
    expect(town.has('29,9')).toBe(true); // East Gate to Verdant Wilds
    expect(isAdjacentReachable(town, 13, 9)).toBe(true); // Dragon-Well Plaque
    expect(isAdjacentReachable(town, 18, 7)).toBe(true); // Notice Board
    expect(isAdjacentReachable(town, 6, 17)).toBe(true); // Master Bram across Ember Brook
    expect(isAdjacentReachable(town, 5, 17)).toBe(true); // Pact Stone
    expect(isAdjacentReachable(town, 2, 16)).toBe(true); // Grove Stash chest

    // 3. Embervale Interiors: Tavern, Mart, Elder Cottage
    const tavern = bfsReachable('embervale_tavern', 7, 9);
    expect(isAdjacentReachable(tavern, 5, 3)).toBe(true); // Innkeeper Mira
    expect(isAdjacentReachable(tavern, 10, 2)).toBe(true); // PC Terminal
    expect(isAdjacentReachable(tavern, 3, 5)).toBe(true); // Bard Cedric
    expect(isAdjacentReachable(tavern, 11, 5)).toBe(true); // Scout Ren
    expect(isAdjacentReachable(tavern, 12, 1)).toBe(true); // Draconia Almanac
    expect(tavern.has('7,10')).toBe(true);

    const mart = bfsReachable('embervale_mart', 6, 8);
    expect(isAdjacentReachable(mart, 6, 2)).toBe(true); // Merchant Taro
    expect(isAdjacentReachable(mart, 9, 6)).toBe(true); // Researcher Lin
    expect(isAdjacentReachable(mart, 1, 1)).toBe(true); // Apothecary Notes
    expect(mart.has('6,9')).toBe(true);

    const elder = bfsReachable('embervale_elder_house', 6, 8);
    expect(isAdjacentReachable(elder, 6, 3)).toBe(true); // Elder Rowan
    expect(isAdjacentReachable(elder, 6, 1)).toBe(true); // Four Guardians Scroll
    expect(isAdjacentReachable(elder, 10, 1)).toBe(true); // Sunken Shrine Tome
    expect(isAdjacentReachable(elder, 1, 4)).toBe(true); // Keeper Keepsake chest
    expect(elder.has('6,9')).toBe(true);

    // 4. Verdant Wilds & Emerald Shrine
    const wilds = bfsReachable('verdant_wilds', 1, 9, true);
    expect(isAdjacentReachable(wilds, 10, 2)).toBe(true);
    expect(isAdjacentReachable(wilds, 18, 17)).toBe(true);
    expect(wilds.has('24,2')).toBe(true);

    const shrineOpen = bfsReachable('emerald_shrine', 11, 18, true);
    expect(isAdjacentReachable(shrineOpen, 3, 9)).toBe(true);
    expect(isAdjacentReachable(shrineOpen, 19, 9)).toBe(true);
    expect(isAdjacentReachable(shrineOpen, 11, 3)).toBe(true);
  });
});
