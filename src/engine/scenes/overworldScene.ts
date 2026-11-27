import { SCRIPTED_BATTLES } from '@data/battles';
import { DIALOGUES } from '@data/dialogues';
import { ITEMS } from '@data/items';
import { LORE_BY_ID } from '@data/lore';
import { MAPS } from '@data/maps';
import { parseTile, SOLID_TILES } from '@data/maps/tiles';
import { SPECIES } from '@data/species';
import { createPokemonInstance } from '@engine/battleMath';
import { drawCharacter, drawObstacle, drawPokemonSprite, drawTile, TILE_SIZE } from '@engine/gfx/sprites';
import {
  drawBofBox,
  drawCursorArrow,
  drawDayNightOverlay,
  drawText,
  SCREEN_H,
  SCREEN_W,
  wrapText,
} from '@engine/gfx/ui';
import type { GameController, Scene } from '@engine/sceneManager';
import { autoSaveGame } from '@engine/save';
import {
  addItem,
  addPokemonToRoster,
  formatClock,
  getLeadAbility,
  getTimeOfDay,
  healFullParty,
  rotatePartyLead,
  unlockLore,
} from '@engine/state';
import type {
  BattleConfig,
  DialogueNode,
  Direction,
  EncounterEntry,
  MapDef,
  MapEntityDef,
  TileType,
} from '@engine/types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const DIR_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const OPPOSITE_DIR: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export class OverworldScene implements Scene {
  private game: GameController;
  private moving = false;
  private moveFrom = { x: 0, y: 0 };
  private moveTo = { x: 0, y: 0 };
  private moveProgress = 0;
  private readonly moveSpeed = 7.2; // tiles per second
  private turnGraceTimer = 0;
  private npcFacingOverrides = new Map<string, Direction>();

  // Active dialogue state
  private activeDialogue: DialogueNode | null = null;
  private dialogueLineIdx = 0;
  private choiceCursor = 0;
  private pendingStartDialogue?: string;

  // Toast / banner / particles
  private toastText = '';
  private toastTimer = 0;
  private mapBannerText = '';
  private mapBannerSub = '';
  private mapBannerTimer = 0;
  private particles: Particle[] = [];

  constructor(game: GameController, postDialogueId?: string) {
    this.game = game;
    this.pendingStartDialogue = postDialogueId;
  }

  enter(): void {
    const state = this.game.state;
    if (!state) return;
    const map = MAPS[state.mapId];
    this.game.audio.playMusic(map.music);
    this.showMapBanner(map.name, map.subtitle);
    if (this.pendingStartDialogue) {
      const id = this.pendingStartDialogue;
      this.pendingStartDialogue = undefined;
      this.openDialogue(id);
    }
  }

  private showMapBanner(name: string, sub: string): void {
    this.mapBannerText = name;
    this.mapBannerSub = sub;
    this.mapBannerTimer = 2.6;
  }

  private showToast(text: string, duration = 2.4): void {
    this.toastText = text;
    this.toastTimer = duration;
  }

  private spawnParticles(tileX: number, tileY: number, color: string, count = 14): void {
    const cx = tileX * TILE_SIZE + 8;
    const cy = tileY * TILE_SIZE + 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 18 + Math.random() * 34;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        life: 0.45 + Math.random() * 0.25,
      });
    }
  }

  private getMap(): MapDef {
    return MAPS[this.game.state!.mapId];
  }

  private getTileAt(map: MapDef, x: number, y: number): TileType {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return 'wall';
    const base = parseTile(map.layout[y][x]);
    if (base === 'sealed_gate' && this.game.state?.flags.shrine_seal_unlocked) {
      return 'open_gate';
    }
    return base;
  }

  private getVisibleEntities(map: MapDef): MapEntityDef[] {
    const flags = this.game.state!.flags;
    return map.entities.filter((e) => {
      if (e.flagRequired && !flags[e.flagRequired]) return false;
      if (e.flagHiddenWhen && flags[e.flagHiddenWhen]) return false;
      if (e.chestItem && flags[e.chestItem.flag]) return false;
      return true;
    });
  }

  private isTileBlocked(map: MapDef, x: number, y: number): boolean {
    const tile = this.getTileAt(map, x, y);
    if (SOLID_TILES.has(tile)) return true;

    const flags = this.game.state!.flags;
    for (const obs of map.obstacles) {
      if (obs.x === x && obs.y === y) {
        if (obs.kind === 'brazier' || obs.kind === 'rune') return true;
        if (obs.kind === 'buried_chest') continue;
        if (!flags[obs.flag]) return true;
      }
    }

    for (const ent of this.getVisibleEntities(map)) {
      if (ent.x === x && ent.y === y) return true;
    }
    return false;
  }

  private openDialogue(dialogueId: string): void {
    const node = DIALOGUES[dialogueId];
    if (!node) return;
    this.activeDialogue = node;
    this.dialogueLineIdx = 0;
    this.choiceCursor = 0;
  }

  private grantLore(loreId: string): void {
    const state = this.game.state!;
    if (unlockLore(state, loreId)) {
      const entry = LORE_BY_ID[loreId];
      this.game.audio.playSfx('levelUp');
      if (entry) {
        this.showToast(`★ Codex Unlocked: ${entry.title}!`, 3.2);
      }
    }
  }

  private applyNodeRewards(node: DialogueNode): void {
    const state = this.game.state!;
    if (node.setFlag) state.flags[node.setFlag] = true;
    if (node.unlockLoreId) this.grantLore(node.unlockLoreId);
    if (node.giveItem) {
      addItem(state, node.giveItem.itemId, node.giveItem.qty);
      this.showToast(`Obtained ${ITEMS[node.giveItem.itemId]?.name ?? node.giveItem.itemId} x${node.giveItem.qty}!`);
    }
    if (node.giveGold) {
      state.gold += node.giveGold;
      this.showToast(`Received ${node.giveGold} Gold!`);
    }
    if (node.healParty) {
      healFullParty(state);
      this.game.audio.playSfx('heal');
    }
    if (node.unlockResonance && !state.unlockedResonances.includes(node.unlockResonance)) {
      state.unlockedResonances.push(node.unlockResonance);
      this.game.audio.playSfx('resonance');
    }
    if (node.recruitSpecies) {
      const mon = createPokemonInstance(node.recruitSpecies.speciesId, node.recruitSpecies.level);
      const dest = addPokemonToRoster(state, mon);
      this.game.audio.playSfx('orbCatch');
      this.showToast(
        dest === 'party'
          ? `${SPECIES[mon.speciesId].name} joined your active party!`
          : `${SPECIES[mon.speciesId].name} sent to your Camp Box!`,
      );
    }
  }

  private updateDialogue(): void {
    const inp = this.game.input;
    const node = this.activeDialogue!;
    const onLastLine = this.dialogueLineIdx >= node.lines.length - 1;
    const hasChoices = Boolean(node.choices && node.choices.length > 0);

    if (onLastLine && hasChoices) {
      const len = node.choices!.length;
      if (inp.consume('up')) {
        this.choiceCursor = (this.choiceCursor + len - 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.choiceCursor = (this.choiceCursor + 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('confirm')) {
        this.game.audio.playSfx('confirm');
        const choice = node.choices![this.choiceCursor];
        const state = this.game.state!;
        if (choice.alignmentDelta) state.alignment += choice.alignmentDelta;
        if (choice.setFlag) state.flags[choice.setFlag] = true;
        if (choice.unlockLoreId) this.grantLore(choice.unlockLoreId);
        if (choice.giveItem) {
          addItem(state, choice.giveItem.itemId, choice.giveItem.qty);
          this.showToast(`Got ${ITEMS[choice.giveItem.itemId].name}!`);
        }
        if (choice.giveGold) {
          state.gold += choice.giveGold;
          this.showToast(`+${choice.giveGold} Gold!`);
        }
        if (choice.healParty) {
          healFullParty(state);
          this.game.audio.playSfx('heal');
        }
        if (choice.recruitSpecies) {
          const mon = createPokemonInstance(choice.recruitSpecies.speciesId, choice.recruitSpecies.level);
          const dest = addPokemonToRoster(state, mon);
          this.game.audio.playSfx('orbCatch');
          this.showToast(
            dest === 'party'
              ? `${SPECIES[mon.speciesId].name} joined your party!`
              : `${SPECIES[mon.speciesId].name} sent to Camp Box!`,
          );
        }

        this.activeDialogue = null;
        if (choice.openShop === 'mart') {
          this.game.openShop('mart');
          return;
        }
        if (choice.startBattle && SCRIPTED_BATTLES[choice.startBattle]) {
          this.game.startBattle(SCRIPTED_BATTLES[choice.startBattle]);
          return;
        }
        if (choice.nextId) {
          this.openDialogue(choice.nextId);
        }
      }
      return;
    }

    if (inp.consume('confirm') || inp.consume('cancel')) {
      this.game.audio.playSfx('cursor');
      if (!onLastLine) {
        this.dialogueLineIdx++;
      } else {
        this.applyNodeRewards(node);
        const nextId = node.nextId;
        const battleId = node.startBattle;
        const openShop = node.openShop;
        this.activeDialogue = null;

        if (openShop === 'mart') {
          this.game.openShop('mart');
        } else if (battleId && SCRIPTED_BATTLES[battleId]) {
          this.game.startBattle(SCRIPTED_BATTLES[battleId]);
        } else if (nextId) {
          this.openDialogue(nextId);
        }
      }
    }
  }

  private interactAhead(): void {
    const state = this.game.state!;
    const map = this.getMap();
    const { dx, dy } = DIR_DELTA[state.facing];
    const tx = state.x + dx;
    const ty = state.y + dy;

    const entity = this.getVisibleEntities(map).find((e) => e.x === tx && e.y === ty);
    if (entity) {
      if (entity.turnOnTalk) {
        this.npcFacingOverrides.set(entity.id, OPPOSITE_DIR[state.facing]);
      }
      this.game.audio.playSfx('confirm');
      if (entity.chestItem) {
        state.flags[entity.chestItem.flag] = true;
        addItem(state, entity.chestItem.itemId, entity.chestItem.qty);
        const item = ITEMS[entity.chestItem.itemId];
        this.spawnParticles(tx, ty, '#ffe050', 18);

        // Unlock Dragon Resonance crests automatically on pickup!
        if (entity.chestItem.itemId === 'bolt_crest' && !state.unlockedResonances.includes('bolt_wyrm')) {
          state.unlockedResonances.push('bolt_wyrm');
          this.game.audio.playSfx('resonance');
          this.showToast('Unlocked [BOLT WYRM] Dragon Resonance!', 3.6);
          return;
        }
        if (entity.chestItem.itemId === 'pyre_crest' && !state.unlockedResonances.includes('pyre_wyrm')) {
          state.unlockedResonances.push('pyre_wyrm');
          this.game.audio.playSfx('resonance');
          this.showToast('Unlocked [PYRE WYRM] Dragon Resonance!', 3.6);
          return;
        }
        this.showToast(`Opened chest: ${item.name} x${entity.chestItem.qty}!`, 2.8);
        return;
      }

      if (entity.interactAction === 'fish') {
        this.game.openFishing();
        return;
      }
      if (entity.interactAction === 'pc_box') {
        this.game.openShop('pc_box');
        return;
      }
      if (entity.interactAction === 'campfire') {
        healFullParty(state);
        this.spawnParticles(tx, ty, '#ff9838', 16);
        this.game.audio.playSfx('heal');
        this.showToast('Rested by the Campfire! Party HP & AP restored! (Press X to Save)', 3.2);
        return;
      }
      if (entity.interactAction === 'statue') {
        this.spawnParticles(tx, ty, '#60e8ff', 22);
        this.openDialogue(state.flags.unlocked_whelp ? 'dragon_statue_repeat' : 'dragon_statue_awaken');
        return;
      }
      if (entity.interactAction === 'rescue_ally') {
        if (!state.flags.poacher_defeated) {
          this.openDialogue('poacher_camp_event');
        } else {
          this.openDialogue('rescue_ally_choice');
        }
        return;
      }
      if (entity.interactAction === 'boss_vex') {
        this.openDialogue('vex_boss_intro');
        return;
      }

      // Context-aware NPC dialogues based on story flags
      if (entity.id === 'officer_vance') {
        if (state.flags.chapter1_cleared) {
          this.openDialogue('vance_renegade');
        } else if (state.flags.briefing_done) {
          this.openDialogue('vance_repeat');
        } else {
          this.openDialogue('vance_briefing');
        }
        return;
      }
      if (entity.id === 'elder_rowan') {
        if (state.flags.chapter1_cleared) {
          this.openDialogue('elder_after_victory');
        } else if (state.flags.got_shrine_key) {
          this.openDialogue('elder_after_key');
        } else {
          this.openDialogue('elder_rowan_talk');
        }
        return;
      }

      if (entity.dialogueId) {
        this.openDialogue(entity.dialogueId);
      }
      return;
    }

    // Hint if facing a field obstacle or sealed gate
    const obs = map.obstacles.find((o) => o.x === tx && o.y === ty);
    if (obs && !state.flags[obs.flag]) {
      const skillLabels: Record<string, string> = {
        ember: 'Ember Torch (Fire/Dragon)',
        cut: 'Razor Cut (Grass/Bug)',
        dig: 'Tremor Dig (Ground)',
        surge: 'Surge (Water/Electric)',
      };
      this.showToast(`Use [C/SPACE] with ${skillLabels[obs.requiredAbility]}!`, 3.0);
      return;
    }

    if (this.getTileAt(map, tx, ty) === 'sealed_gate') {
      this.showToast('Sealed Gate! Ignite the Brazier (Ember) OR energize the Rune (Surge)!', 3.2);
    }
  }

  private useLeadFieldSkill(): void {
    const state = this.game.state!;
    const map = this.getMap();
    const { ability, abilityName, speciesName } = getLeadAbility(state);
    const { dx, dy } = DIR_DELTA[state.facing];
    const tx = state.x + dx;
    const ty = state.y + dy;

    const fxColors: Record<string, string> = {
      ember: '#ff6c28',
      cut: '#68e858',
      dig: '#e0b860',
      surge: '#58e0ff',
      scout: '#d8f0ff',
    };
    this.spawnParticles(tx, ty, fxColors[ability] ?? '#fff', 18);
    this.game.audio.playSfx('fieldSkill');

    // Check matching obstacle ahead or directly under feet (for buried chests!)
    const obs = map.obstacles.find(
      (o) => ((o.x === tx && o.y === ty) || (o.kind === 'buried_chest' && o.x === state.x && o.y === state.y)),
    );

    if (obs) {
      if (state.flags[obs.flag]) {
        this.showToast(`${speciesName} used ${abilityName}, but this mechanism is already active.`);
        return;
      }
      if (obs.requiredAbility === ability) {
        state.flags[obs.flag] = true;
        if (obs.rewardItem) {
          addItem(state, obs.rewardItem.itemId, obs.rewardItem.qty);
        }
        this.game.audio.playSfx('superEffective');
        this.spawnParticles(obs.x, obs.y, '#ffe860', 26);
        this.showToast(obs.message, 3.6);
        return;
      } else {
        const neededMap: Record<string, string> = {
          ember: 'Ember Torch (Charmander/Growlithe)',
          cut: 'Razor Cut (Bulbasaur/Oddish/Scyther)',
          dig: 'Tremor Dig (Sandshrew)',
          surge: 'Surge (Dratini/Pikachu/Poliwag)',
        };
        this.showToast(
          `${abilityName} didn't work! Swap Lead (TAB) to ${neededMap[obs.requiredAbility]}.`,
          3.4,
        );
        return;
      }
    }

    // Fishing shortcut if Surge/Angler used facing Willow Pier spot
    const fishEnt = map.entities.find((e) => e.interactAction === 'fish' && e.x === tx && e.y === ty);
    if (fishEnt) {
      this.game.openFishing();
      return;
    }

    // Berry foraging flavor when using Razor Cut on tall grass
    if (ability === 'cut' && this.getTileAt(map, tx, ty) === 'tall_grass') {
      if (Math.random() < 0.35) {
        addItem(state, 'herb', 1);
        this.showToast(`${speciesName} foraged a fresh Green Herb from the brush!`, 2.4);
        return;
      }
    }

    this.showToast(`${speciesName} unleashed ${abilityName}!`, 1.7);
  }

  private rollWeightedEncounter(table: EncounterEntry[]): EncounterEntry {
    const total = table.reduce((sum, e) => sum + e.weight, 0);
    let r = Math.random() * total;
    for (const entry of table) {
      r -= entry.weight;
      if (r <= 0) return entry;
    }
    return table[table.length - 1];
  }

  private maybeTriggerWildEncounter(map: MapDef): void {
    const state = this.game.state!;
    const tile = this.getTileAt(map, state.x, state.y);
    const canEncounter = tile === 'tall_grass' || (map.id === 'emerald_shrine' && tile === 'shrine_floor');
    if (!canEncounter || map.encounterRate <= 0) return;
    if (Math.random() > map.encounterRate) return;

    const tod = getTimeOfDay(state.timeMinutes);
    const table = tod === 'night' || tod === 'dusk' ? map.nightEncounters : map.dayEncounters;
    if (table.length === 0) return;

    // Breath of Fire style: 1 to 3 wild foes!
    const packSize = Math.random() < 0.45 ? 1 : Math.random() < 0.78 ? 2 : 3;
    const enemies = [];
    for (let i = 0; i < packSize; i++) {
      const pick = this.rollWeightedEncounter(table);
      const lvl = pick.minLevel + Math.floor(Math.random() * (pick.maxLevel - pick.minLevel + 1));
      enemies.push({ speciesId: pick.speciesId, level: lvl });
    }

    const config: BattleConfig = {
      id: `wild_${map.id}_${Date.now()}`,
      isTrainer: false,
      isBoss: false,
      canRun: true,
      canCatch: true,
      bg: tod === 'night' && !map.indoor ? 'forest' : map.battleBg,
      music: 'battle',
      enemies,
    };
    this.game.startBattle(config);
  }

  private handleStepFinished(): void {
    const state = this.game.state!;
    const map = this.getMap();
    state.stepCount += 1;

    // Step-driven Day/Night progression on outdoor maps (BoF I style!)
    if (!map.indoor) {
      state.timeMinutes = (state.timeMinutes + 9) % 1440;
    }

    // Check warps
    const warp = map.warps.find((w) => w.x === state.x && w.y === state.y);
    if (warp) {
      if (warp.requiredFlag && !state.flags[warp.requiredFlag]) {
        this.showToast(warp.lockedText ?? 'This path is sealed for now.', 3.2);
        // Step back one tile
        state.x = this.moveFrom.x;
        state.y = this.moveFrom.y;
        return;
      }
      state.mapId = warp.targetMap;
      state.x = warp.targetX;
      state.y = warp.targetY;
      if (warp.facing) state.facing = warp.facing;
      state.trail = [
        { x: state.x, y: state.y, facing: state.facing },
        { x: state.x, y: state.y, facing: state.facing },
        { x: state.x, y: state.y, facing: state.facing },
        { x: state.x, y: state.y, facing: state.facing },
      ];
      this.npcFacingOverrides.clear();
      autoSaveGame(state);
      const nextMap = MAPS[state.mapId];
      this.game.audio.playMusic(nextMap.music);
      this.showMapBanner(nextMap.name, nextMap.subtitle);
      return;
    }

    this.maybeTriggerWildEncounter(map);
  }

  private getFacingPrompt(map: MapDef): { tx: number; ty: number; label: string } | null {
    const state = this.game.state!;
    const { dx, dy } = DIR_DELTA[state.facing];
    const tx = state.x + dx;
    const ty = state.y + dy;

    const ent = this.getVisibleEntities(map).find((e) => e.x === tx && e.y === ty);
    if (ent) {
      return { tx, ty, label: `Z ${ent.inspectLabel ?? 'TALK'}`.toUpperCase() };
    }

    const obs = map.obstacles.find(
      (o) => !state.flags[o.flag] && ((o.x === tx && o.y === ty) || (o.kind === 'buried_chest' && o.x === state.x && o.y === state.y)),
    );
    if (obs) {
      const skillTag: Record<string, string> = {
        ember: 'C EMBER',
        cut: 'C CUT',
        dig: 'C DIG',
        surge: 'C SURGE',
      };
      return { tx: obs.x, ty: obs.y, label: skillTag[obs.requiredAbility] ?? 'C SKILL' };
    }

    const tile = this.getTileAt(map, tx, ty);
    if (tile === 'sealed_gate') {
      return { tx, ty, label: 'SEALED' };
    }
    return null;
  }

  update(dt: number): void {
    const state = this.game.state;
    if (!state) return;

    state.playtimeSeconds += dt;
    if (this.toastTimer > 0) this.toastTimer = Math.max(0, this.toastTimer - dt);
    if (this.mapBannerTimer > 0) this.mapBannerTimer = Math.max(0, this.mapBannerTimer - dt);
    if (this.turnGraceTimer > 0) this.turnGraceTimer = Math.max(0, this.turnGraceTimer - dt);

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (this.activeDialogue) {
      this.updateDialogue();
      return;
    }

    const inp = this.game.input;

    // Pause menu
    if (inp.consume('cancel')) {
      this.game.audio.playSfx('confirm');
      this.game.openPauseMenu();
      return;
    }

    // Rotate Lead Pokémon (BoF party swap!)
    if (inp.consume('swapNext')) {
      const lead = rotatePartyLead(state, 1);
      if (lead) {
        const sp = SPECIES[lead.speciesId];
        this.game.audio.playSfx('cursor');
        this.spawnParticles(state.x, state.y, '#88e8ff', 10);
        this.showToast(`Lead: ${sp.name} [${sp.fieldAbilityName}]`, 1.8);
      }
      return;
    }
    if (inp.consume('swapPrev')) {
      const lead = rotatePartyLead(state, -1);
      if (lead) {
        const sp = SPECIES[lead.speciesId];
        this.game.audio.playSfx('cursor');
        this.spawnParticles(state.x, state.y, '#88e8ff', 10);
        this.showToast(`Lead: ${sp.name} [${sp.fieldAbilityName}]`, 1.8);
      }
      return;
    }

    if (this.moving) {
      this.moveProgress += dt * this.moveSpeed;
      if (this.moveProgress >= 1) {
        this.moving = false;
        this.moveProgress = 0;
        state.x = this.moveTo.x;
        state.y = this.moveTo.y;
        this.handleStepFinished();
      }
      return;
    }

    // Interact or Field Skill
    if (inp.consume('confirm')) {
      this.interactAhead();
      return;
    }
    if (inp.consume('skill')) {
      this.useLeadFieldSkill();
      return;
    }

    // Grid movement with crisp tap-to-turn grace window
    let dir: Direction | null = null;
    if (inp.isHeld('up')) dir = 'up';
    else if (inp.isHeld('down')) dir = 'down';
    else if (inp.isHeld('left')) dir = 'left';
    else if (inp.isHeld('right')) dir = 'right';

    if (dir) {
      if (state.facing !== dir) {
        state.facing = dir;
        this.turnGraceTimer = 0.065;
        return;
      }
      if (this.turnGraceTimer > 0) return;

      const { dx, dy } = DIR_DELTA[dir];
      const nx = state.x + dx;
      const ny = state.y + dy;
      const map = this.getMap();
      if (!this.isTileBlocked(map, nx, ny)) {
        state.trail.unshift({ x: state.x, y: state.y, facing: dir });
        if (state.trail.length > 5) state.trail.pop();
        this.moveFrom = { x: state.x, y: state.y };
        this.moveTo = { x: nx, y: ny };
        this.moveProgress = 0;
        this.moving = true;
      }
    } else {
      this.turnGraceTimer = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const state = this.game.state;
    if (!state) return;
    const map = this.getMap();
    const tick = this.game.tick;

    // Interpolated player pixel coordinates
    const px = this.moving
      ? (this.moveFrom.x + (this.moveTo.x - this.moveFrom.x) * this.moveProgress) * TILE_SIZE
      : state.x * TILE_SIZE;
    const py = this.moving
      ? (this.moveFrom.y + (this.moveTo.y - this.moveFrom.y) * this.moveProgress) * TILE_SIZE
      : state.y * TILE_SIZE;

    // Camera clamped to map bounds
    const mapPxW = map.width * TILE_SIZE;
    const mapPxH = map.height * TILE_SIZE;
    let camX = Math.round(px + 8 - SCREEN_W / 2);
    let camY = Math.round(py + 8 - SCREEN_H / 2);
    camX = mapPxW <= SCREEN_W ? -Math.floor((SCREEN_W - mapPxW) / 2) : Math.max(0, Math.min(mapPxW - SCREEN_W, camX));
    camY = mapPxH <= SCREEN_H ? -Math.floor((SCREEN_H - mapPxH) / 2) : Math.max(0, Math.min(mapPxH - SCREEN_H, camY));

    ctx.fillStyle = '#080b14';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Draw visible tiles & collect lantern/window/hearth/fountain lights
    const lights: Array<{ x: number; y: number; radius: number; color: string }> = [];
    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        const sx = tx * TILE_SIZE - camX;
        const sy = ty * TILE_SIZE - camY;
        if (sx < -TILE_SIZE || sy < -TILE_SIZE || sx > SCREEN_W || sy > SCREEN_H) continue;
        const tile = this.getTileAt(map, tx, ty);
        drawTile(ctx, tile, sx, sy, tick);
        if (tile === 'lamp' || tile === 'campfire' || tile === 'hearth') {
          lights.push({ x: sx + 8, y: sy + 8, radius: 46, color: 'rgba(255, 210, 110, 0.36)' });
        } else if (tile === 'window_lit') {
          lights.push({ x: sx + 8, y: sy + 10, radius: 34, color: 'rgba(255, 220, 130, 0.28)' });
        } else if (tile === 'statue' || tile === 'fountain') {
          lights.push({ x: sx + 8, y: sy + 8, radius: 48, color: 'rgba(90, 230, 255, 0.30)' });
        }
      }
    }

    // Draw field obstacles
    for (const obs of map.obstacles) {
      const sx = obs.x * TILE_SIZE - camX;
      const sy = obs.y * TILE_SIZE - camY;
      const cleared = Boolean(state.flags[obs.flag]);
      drawObstacle(ctx, obs.kind, cleared, sx, sy, tick);
      if (obs.kind === 'brazier' && cleared) {
        lights.push({ x: sx + 8, y: sy + 8, radius: 42, color: 'rgba(255, 160, 70, 0.38)' });
      }
      if (obs.kind === 'rune' && cleared) {
        lights.push({ x: sx + 8, y: sy + 8, radius: 42, color: 'rgba(90, 240, 255, 0.38)' });
      }
    }

    // Facing target corner-bracket highlight
    const prompt = !this.activeDialogue ? this.getFacingPrompt(map) : null;
    if (prompt) {
      const hx = prompt.tx * TILE_SIZE - camX;
      const hy = prompt.ty * TILE_SIZE - camY;
      const pulse = Math.sin(tick * 0.2) > 0 ? '#ffe868' : '#78e8ff';
      ctx.fillStyle = pulse;
      ctx.fillRect(hx + 1, hy + 1, 3, 1);
      ctx.fillRect(hx + 1, hy + 1, 1, 3);
      ctx.fillRect(hx + 12, hy + 1, 3, 1);
      ctx.fillRect(hx + 14, hy + 1, 1, 3);
      ctx.fillRect(hx + 1, hy + 14, 3, 1);
      ctx.fillRect(hx + 1, hy + 12, 1, 3);
      ctx.fillRect(hx + 12, hy + 14, 3, 1);
      ctx.fillRect(hx + 14, hy + 12, 1, 3);
    }

    // Collect & Y-sort all characters, Pokémon followers, and map entities for SNES depth
    const renderQueue: Array<{ y: number; draw: () => void }> = [];

    for (const ent of this.getVisibleEntities(map)) {
      const sx = ent.x * TILE_SIZE - camX;
      const sy = ent.y * TILE_SIZE - camY;
      const face = this.npcFacingOverrides.get(ent.id) ?? ent.facing;
      renderQueue.push({
        y: sy,
        draw: () => drawCharacter(ctx, ent.spriteKey, sx, sy, face, tick, false),
      });
    }

    for (let i = state.party.length - 1; i >= 0; i--) {
      const mon = state.party[i];
      const sp = SPECIES[mon.speciesId];
      const curSpot = state.trail[i] ?? { x: state.x, y: state.y, facing: state.facing };
      const prevSpot = state.trail[i + 1] ?? curSpot;
      const interpX = this.moving
        ? prevSpot.x + (curSpot.x - prevSpot.x) * this.moveProgress
        : curSpot.x;
      const interpY = this.moving
        ? prevSpot.y + (curSpot.y - prevSpot.y) * this.moveProgress
        : curSpot.y;
      const fx = interpX * TILE_SIZE - camX + 8;
      const fy = interpY * TILE_SIZE - camY + 14;
      const fDir = curSpot.facing ?? state.facing;
      renderQueue.push({
        y: interpY * TILE_SIZE - camY,
        draw: () => drawPokemonSprite(ctx, sp.spriteKey, fx, fy, 0.62, tick + i * 7, false, fDir),
      });
    }

    renderQueue.push({
      y: py - camY + 0.1,
      draw: () => drawCharacter(ctx, 'player', px - camX, py - camY, state.facing, tick, this.moving),
    });

    renderQueue.sort((a, b) => a.y - b.y);
    for (const item of renderQueue) {
      item.draw();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), 2, 2);
    }

    // Ambient outdoor drifting leaves (day) or fireflies (dusk/night)
    const tod = getTimeOfDay(state.timeMinutes);
    if (!map.indoor) {
      for (let i = 0; i < 8; i++) {
        const ax = Math.round(((tick * (0.35 + (i % 3) * 0.12) + i * 53) % (SCREEN_W + 20)) - 10);
        const ay = Math.round(((tick * 0.18 + i * 37 + Math.sin(tick * 0.05 + i) * 14) % (SCREEN_H - 40)) + 34);
        if (tod === 'night' || tod === 'dusk') {
          if (Math.sin(tick * 0.12 + i * 2) > -0.2) {
            ctx.fillStyle = '#ffe878';
            ctx.fillRect(ax, ay, 2, 2);
          }
        } else {
          ctx.fillStyle = i % 2 === 0 ? '#98e878' : '#ffd8a8';
          ctx.fillRect(ax, ay, 2, 1);
        }
      }
    }

    // Day / Night & lantern lighting overlay
    drawDayNightOverlay(ctx, tod, map.indoor, lights);

    // Floating contextual prompt tag above faced object/NPC
    if (prompt) {
      const tagW = Math.max(36, prompt.label.length * 5 + 8);
      const tagX = Math.max(4, Math.min(SCREEN_W - tagW - 4, Math.round(prompt.tx * TILE_SIZE - camX + 8 - tagW / 2)));
      const tagY = Math.max(34, Math.round(prompt.ty * TILE_SIZE - camY - 14));
      ctx.fillStyle = 'rgba(10, 18, 44, 0.9)';
      ctx.fillRect(tagX, tagY, tagW, 11);
      ctx.strokeStyle = '#ffd858';
      ctx.strokeRect(tagX + 0.5, tagY + 0.5, tagW - 1, 10);
      drawText(ctx, prompt.label, tagX + tagW / 2, tagY + 2, {
        align: 'center',
        size: 6,
        bold: true,
        color: '#ffd858',
      });
    }

    // Compact Breath of Fire Top HUD (Lead Pokémon + Field Skill + Clock)
    const lead = state.party[0];
    const leadSp = SPECIES[lead.speciesId];
    drawBofBox(ctx, 4, 4, 152, 28);
    drawPokemonSprite(ctx, leadSp.spriteKey, 18, 28, 0.62, tick, false);
    drawText(ctx, `${leadSp.name} Lv.${lead.level}`, 32, 8, { size: 8, bold: true, color: '#ffd858' });
    drawText(ctx, `[C] ${leadSp.fieldAbilityName}`, 32, 19, { size: 7, color: '#90f0d8' });

    // Right HUD: Clock & Time of Day + Party count
    drawBofBox(ctx, 212, 4, 104, 28);
    const todLabel = map.indoor ? 'INDOOR' : tod.toUpperCase();
    const todColor = tod === 'night' ? '#88a8ff' : tod === 'dusk' ? '#ff98b8' : '#ffe878';
    drawText(ctx, `${formatClock(state.timeMinutes)}`, 220, 8, { size: 7, color: '#fff' });
    drawText(ctx, todLabel, 274, 8, { size: 7, bold: true, color: todColor });
    drawText(ctx, `Party ${state.party.length}/4  ${state.gold}G`, 220, 19, { size: 7, color: '#d8e4ff' });

    // Zone entry banner
    if (this.mapBannerTimer > 0 && !this.activeDialogue) {
      drawBofBox(ctx, 56, 38, 208, 30);
      drawText(ctx, this.mapBannerText.toUpperCase(), SCREEN_W / 2, 43, {
        align: 'center',
        size: 8,
        bold: true,
        color: '#ffd858',
      });
      drawText(ctx, this.mapBannerSub, SCREEN_W / 2, 55, {
        align: 'center',
        size: 7,
        color: '#d4e4ff',
      });
    }

    // Toast notification
    if (this.toastTimer > 0 && !this.activeDialogue) {
      drawBofBox(ctx, 10, 204, 300, 28, { accent: '#ffd858' });
      const lines = wrapText(this.toastText, 46);
      lines.slice(0, 2).forEach((ln, idx) => {
        drawText(ctx, ln, SCREEN_W / 2, 209 + idx * 10, { align: 'center', size: 7, color: '#fff' });
      });
    }

    // Active Dialogue Box
    if (this.activeDialogue) {
      this.renderDialogue(ctx);
    }
  }

  private renderDialogue(ctx: CanvasRenderingContext2D): void {
    const node = this.activeDialogue!;
    const tick = this.game.tick;
    const onLastLine = this.dialogueLineIdx >= node.lines.length - 1;
    const hasChoices = Boolean(node.choices && node.choices.length > 0);

    // Optional Choices panel above main dialogue box
    if (onLastLine && hasChoices) {
      const choices = node.choices!;
      const chH = 14 + choices.length * 14;
      const chY = 164 - chH - 4;
      drawBofBox(ctx, 20, chY, 280, chH, { accent: '#ffd858' });
      choices.forEach((c, idx) => {
        const y = chY + 8 + idx * 14;
        if (idx === this.choiceCursor) {
          drawCursorArrow(ctx, 28, y, tick);
        }
        drawText(ctx, c.label, 38, y, {
          size: 7,
          bold: idx === this.choiceCursor,
          color: idx === this.choiceCursor ? '#ffd858' : '#e8f0ff',
        });
      });
    }

    drawBofBox(ctx, 8, 166, 304, 68);
    let textLeft = 18;
    if (node.portrait) {
      drawBofBox(ctx, 14, 174, 34, 34, { bgTop: '#16244c', bgBottom: '#0d1632' });
      drawCharacter(ctx, node.portrait, 23, 183, 'down', tick, false);
      textLeft = 56;
    }

    drawText(ctx, node.speaker.toUpperCase(), textLeft, 173, {
      size: 8,
      bold: true,
      color: '#ffd858',
    });

    const maxChars = node.portrait ? 38 : 45;
    const wrapped = wrapText(node.lines[this.dialogueLineIdx] ?? '', maxChars);
    wrapped.slice(0, 3).forEach((ln, idx) => {
      drawText(ctx, ln, textLeft, 186 + idx * 11, { size: 7, color: '#f5f8ff' });
    });

    if (!onLastLine || !hasChoices) {
      const blink = Math.floor(tick * 0.1) % 2 === 0;
      if (blink) {
        drawText(ctx, '▼ Z', 290, 220, { size: 7, color: '#88e0ff' });
      }
    }
  }
}
