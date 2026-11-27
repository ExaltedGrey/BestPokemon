import { ITEMS } from '@data/items';
import { MOVES } from '@data/moves';
import { RESONANCE_FORMS, RESONANCE_ORDER } from '@data/resonances';
import { SPECIES } from '@data/species';
import { TYPE_COLORS } from '@data/typeChart';
import {
  awardExperience,
  calculateCatchProbability,
  calculateDamage,
  createPokemonInstance,
  getAvailableMovesForBattle,
  getDisplayName,
  getEffectiveCombatStats,
} from '@engine/battleMath';
import { drawPokemonSprite } from '@engine/gfx/sprites';
import {
  drawBar,
  drawBofBox,
  drawCursorArrow,
  drawText,
  SCREEN_H,
  SCREEN_W,
  wrapText,
} from '@engine/gfx/ui';
import type { GameController, Scene } from '@engine/sceneManager';
import { autoSaveGame } from '@engine/save';
import {
  addPokemonToRoster,
  getItemQty,
  getTimeOfDay,
  healFullParty,
  markSeen,
  removeItem,
} from '@engine/state';
import type { BattleConfig, MoveDef, PokemonInstance } from '@engine/types';

type BattlePhase =
  | 'intro'
  | 'command'
  | 'sub_skill'
  | 'sub_resonance'
  | 'sub_item'
  | 'target_enemy'
  | 'target_ally'
  | 'executing'
  | 'mid_dialog'
  | 'victory'
  | 'defeat';

interface BattleAction {
  actorType: 'party' | 'enemy';
  actorIdx: number;
  kind: 'attack' | 'move' | 'resonate' | 'item' | 'guard' | 'run';
  moveId?: string;
  resonanceId?: string;
  itemId?: string;
  targetIdx?: number;
}

interface FloatingPopup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface BattleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const COMMAND_ICONS = [
  { id: 'fight', label: 'FIGHT', icon: '⚔', color: '#ff8060' },
  { id: 'skill', label: 'SKILL', icon: '✦', color: '#68d8ff' },
  { id: 'dragon', label: 'DRAGON', icon: '🐉', color: '#ffd848' },
  { id: 'bag', label: 'BAG/ORB', icon: '◎', color: '#78e888' },
  { id: 'guard', label: 'GUARD', icon: '⛨', color: '#a8b8ff' },
  { id: 'auto', label: 'AUTO', icon: '⚡', color: '#f0b8ff' },
  { id: 'run', label: 'RUN', icon: '»', color: '#d0d8e8' },
] as const;

export class BattleScene implements Scene {
  private game: GameController;
  private config: BattleConfig;
  private enemies: PokemonInstance[] = [];
  private phase: BattlePhase = 'intro';
  private message = '';
  private introTimer = 1.0;

  // Turn selection state
  private selectingPartyIdx = 0;
  private plannedActions: BattleAction[] = [];
  private cmdCursor = 0;
  private subCursor = 0;
  private targetCursor = 0;
  private pendingKind: 'attack' | 'move' | 'item' | null = null;
  private pendingMoveId?: string;
  private pendingItemId?: string;
  private autoBattle = false;

  // Execution queue
  private turnQueue: BattleAction[] = [];
  private execDelay = 0;
  private guardingSet = new Set<string>();
  private buffs = new Map<string, { atk: number; def: number; spd: number }>();

  // Visual FX
  private lungeKey: string | null = null;
  private lungeTimer = 0;
  private flashTimer = 0;
  private flashColor = '#ffffff';
  private shakeTimer = 0;
  private popups: FloatingPopup[] = [];
  private particles: BattleParticle[] = [];

  // Boss mid-battle dialogue
  private midDialogShown = false;
  private midDialogIdx = 0;

  // Victory summary lines
  private victoryLines: string[] = [];
  private victoryPage = 0;

  constructor(game: GameController, config: BattleConfig) {
    this.game = game;
    this.config = config;
  }

  enter(): void {
    const state = this.game.state!;
    this.enemies = this.config.enemies.map((spec) => {
      markSeen(state, spec.speciesId);
      return createPokemonInstance(spec.speciesId, spec.level, { nickname: spec.nickname });
    });

    // Clear any lingering battle-only resonance on entry
    for (const mon of state.party) {
      mon.activeResonanceId = null;
    }

    this.game.audio.playMusic(this.config.music);
    const foeNames = this.enemies.map((e) => getDisplayName(e)).join(', ');
    this.message = this.config.title
      ? `${this.config.title} challenges your squad!`
      : `Wild ${foeNames} appeared!`;
    this.phase = 'intro';
    this.introTimer = 1.0;
  }

  private getEnemyPos(idx: number, total: number): { x: number; y: number } {
    // Diagonal SNES Breath of Fire upper-left formation
    const base = [
      { x: 96, y: 74 },
      { x: 54, y: 98 },
      { x: 138, y: 58 },
    ];
    if (total === 1) return { x: 94, y: 82 };
    return base[idx % base.length];
  }

  private getPartyPos(idx: number): { x: number; y: number } {
    // Diagonal SNES Breath of Fire bottom-right 4-party formation
    const coords = [
      { x: 204, y: 122 },
      { x: 238, y: 134 },
      { x: 268, y: 146 },
      { x: 176, y: 144 },
    ];
    return coords[idx % coords.length];
  }

  private spawnPopup(x: number, y: number, text: string, color: string): void {
    this.popups.push({ x, y, text, color, life: 1.05 });
  }

  private spawnBurst(x: number, y: number, color: string, count = 16): void {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const spd = 25 + Math.random() * 55;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        color,
        life: 0.45 + Math.random() * 0.25,
      });
    }
  }

  private startRoundSelection(): void {
    const state = this.game.state!;
    this.plannedActions = [];
    this.guardingSet.clear();
    const firstAlive = state.party.findIndex((p) => p.hp > 0);
    if (firstAlive === -1) {
      this.triggerDefeat();
      return;
    }

    if (this.autoBattle) {
      state.party.forEach((mon, idx) => {
        if (mon.hp > 0) {
          const targetIdx = this.enemies.findIndex((e) => e.hp > 0);
          this.plannedActions.push({
            actorType: 'party',
            actorIdx: idx,
            kind: 'attack',
            targetIdx: Math.max(0, targetIdx),
          });
        }
      });
      this.beginTurnExecution();
      return;
    }

    this.selectingPartyIdx = firstAlive;
    this.cmdCursor = 0;
    this.phase = 'command';
    this.message = `Choose command for ${getDisplayName(state.party[firstAlive])}!`;
  }

  private advancePartySelection(action: BattleAction): void {
    const state = this.game.state!;
    this.plannedActions.push(action);

    let nextIdx = this.selectingPartyIdx + 1;
    while (nextIdx < state.party.length && state.party[nextIdx].hp <= 0) {
      nextIdx++;
    }
    if (nextIdx < state.party.length) {
      this.selectingPartyIdx = nextIdx;
      this.cmdCursor = 0;
      this.phase = 'command';
      this.message = `Choose command for ${getDisplayName(state.party[nextIdx])}!`;
    } else {
      this.beginTurnExecution();
    }
  }

  private beginTurnExecution(): void {
    const state = this.game.state!;
    const enemyActions: BattleAction[] = [];

    this.enemies.forEach((enemy, idx) => {
      if (enemy.hp <= 0) return;
      const alivePartyIdxs = state.party
        .map((p, i) => (p.hp > 0 ? i : -1))
        .filter((i) => i >= 0);
      if (alivePartyIdxs.length === 0) return;

      const usableMoves = enemy.moves
        .map((id) => MOVES[id])
        .filter((m): m is MoveDef => Boolean(m) && m.apCost <= enemy.ap);
      const chosen =
        usableMoves.length > 0 && Math.random() < 0.72
          ? usableMoves[Math.floor(Math.random() * usableMoves.length)]
          : null;
      const targetIdx = alivePartyIdxs[Math.floor(Math.random() * alivePartyIdxs.length)];
      enemyActions.push({
        actorType: 'enemy',
        actorIdx: idx,
        kind: chosen ? 'move' : 'attack',
        moveId: chosen?.id,
        targetIdx,
      });
    });

    const combined = [...this.plannedActions, ...enemyActions];
    // Sort by effective speed (guard/item/resonate go first!)
    combined.sort((a, b) => {
      const prio = (act: BattleAction) =>
        act.kind === 'guard' || act.kind === 'resonate' || act.kind === 'item' ? 1000 : 0;
      const spdOf = (act: BattleAction) => {
        const mon = act.actorType === 'party' ? state.party[act.actorIdx] : this.enemies[act.actorIdx];
        if (!mon) return 0;
        return getEffectiveCombatStats(mon, this.buffs.get(mon.uid)).spd + prio(act);
      };
      return spdOf(b) - spdOf(a);
    });

    this.turnQueue = combined;
    this.phase = 'executing';
    this.execDelay = 0.2;
  }

  private checkBattleEnd(): boolean {
    const state = this.game.state!;
    const aliveEnemies = this.enemies.filter((e) => e.hp > 0);
    if (aliveEnemies.length === 0) {
      this.triggerVictory();
      return true;
    }

    // Check mid-battle Boss dialogue!
    if (this.config.midBattleDialogue && !this.midDialogShown) {
      const boss = this.enemies[0];
      if (boss && boss.hp / boss.maxHp <= this.config.midBattleDialogue.hpPercentThreshold) {
        this.midDialogShown = true;
        this.midDialogIdx = 0;
        this.phase = 'mid_dialog';
        this.flashColor = '#b040ff';
        this.flashTimer = 0.35;
        this.shakeTimer = 0.3;
        return true;
      }
    }

    const aliveParty = state.party.filter((p) => p.hp > 0);
    if (aliveParty.length === 0) {
      this.triggerDefeat();
      return true;
    }
    return false;
  }

  private executeNextAction(): void {
    const state = this.game.state!;
    if (this.checkBattleEnd()) return;

    while (this.turnQueue.length > 0) {
      const act = this.turnQueue.shift()!;
      const actor = act.actorType === 'party' ? state.party[act.actorIdx] : this.enemies[act.actorIdx];
      if (!actor || actor.hp <= 0) continue;

      const actorName = getDisplayName(actor);
      const speedMult = state.settings.battleSpeed === 2 ? 0.55 : 1.0;

      // Status skip check (Paralyze)
      if (actor.status === 'paralyze' && Math.random() < 0.25 && act.kind !== 'item' && act.kind !== 'run') {
        this.message = `${actorName} is paralyzed and couldn't move!`;
        this.execDelay = 0.75 * speedMult;
        return;
      }

      if (act.kind === 'run') {
        if (!this.config.canRun) {
          this.message = "Can't escape from this battle!";
          this.execDelay = 0.8 * speedMult;
          return;
        }
        this.game.audio.playSfx('cancel');
        this.game.enterOverworld();
        return;
      }

      if (act.kind === 'guard') {
        this.guardingSet.add(actor.uid);
        actor.ap = Math.min(actor.maxAp, actor.ap + 4);
        if (act.actorType === 'party') {
          state.resonanceGauge = Math.min(100, state.resonanceGauge + 12);
        }
        this.message = `${actorName} braced in Guard! (+4 AP, +Resonance)`;
        this.game.audio.playSfx('confirm');
        this.execDelay = 0.7 * speedMult;
        return;
      }

      if (act.kind === 'resonate' && act.resonanceId) {
        const form = RESONANCE_FORMS[act.resonanceId];
        if (!form) continue;
        if (actor.ap < form.apCost || state.resonanceGauge < form.resonanceCost) {
          this.message = `${actorName} lacked AP or Resonance to transform!`;
          this.execDelay = 0.8 * speedMult;
          return;
        }
        actor.ap -= form.apCost;
        state.resonanceGauge = Math.max(0, state.resonanceGauge - form.resonanceCost);
        actor.activeResonanceId = form.id;
        const pos = this.getPartyPos(act.actorIdx);
        this.spawnBurst(pos.x, pos.y - 14, form.auraColor, 28);
        this.flashColor = form.auraColor;
        this.flashTimer = 0.35;
        this.shakeTimer = 0.25;
        this.game.audio.playSfx('resonance');
        this.message = `${actorName} invoked [${form.name.toUpperCase()}]! Dragon power surges!`;
        this.execDelay = 1.25 * speedMult;
        return;
      }

      if (act.kind === 'item' && act.itemId) {
        const item = ITEMS[act.itemId];
        if (!item || getItemQty(state, act.itemId) <= 0) {
          this.message = `Out of ${item?.name ?? 'item'}!`;
          this.execDelay = 0.65 * speedMult;
          return;
        }
        if (item.category === 'orb') {
          const targetIdx = this.resolveLivingTarget(this.enemies, act.targetIdx ?? 0);
          const target = this.enemies[targetIdx];
          if (!target) continue;
          removeItem(state, item.id, 1);
          const pos = this.getEnemyPos(targetIdx, this.enemies.length);
          this.game.audio.playSfx('orbThrow');
          this.spawnBurst(pos.x, pos.y - 12, '#78e8ff', 18);

          if (!this.config.canCatch || SPECIES[target.speciesId].catchRate <= 0) {
            this.message = `The ${item.name} bounced off! This foe cannot be captured!`;
            this.execDelay = 0.95 * speedMult;
            return;
          }

          const prob = calculateCatchProbability(target, item.id, {
            timeOfDay: getTimeOfDay(state.timeMinutes),
            isShrine: this.config.bg === 'shrine',
          });
          if (Math.random() < prob) {
            target.hp = 0;
            const caught = createPokemonInstance(target.speciesId, target.level);
            caught.hp = Math.max(1, Math.floor(caught.maxHp * 0.6));
            const dest = addPokemonToRoster(state, caught);
            this.game.audio.playSfx('orbCatch');
            this.spawnPopup(pos.x, pos.y - 24, 'CAUGHT!', '#ffe850');
            this.message = `Gotcha! ${SPECIES[caught.speciesId].name} was sent to your ${dest === 'party' ? 'Active Party' : 'Camp Box'}!`;
            this.execDelay = 1.25 * speedMult;
            return;
          } else {
            this.spawnPopup(pos.x, pos.y - 24, 'BROKE FREE!', '#ff9860');
            this.message = `Oh no! Wild ${getDisplayName(target)} broke free from the ${item.name}!`;
            this.execDelay = 0.95 * speedMult;
            return;
          }
        } else {
          // Healing / AP / Status / Revive item on ally
          const ally = state.party[act.targetIdx ?? act.actorIdx] ?? actor;
          removeItem(state, item.id, 1);
          const pos = this.getPartyPos(act.targetIdx ?? act.actorIdx);
          if (item.category === 'heal') {
            ally.hp = Math.min(ally.maxHp, ally.hp + item.power);
            this.spawnPopup(pos.x, pos.y - 22, `+${item.power} HP`, '#68f080');
            this.message = `Used ${item.name} on ${getDisplayName(ally)}!`;
          } else if (item.category === 'ap') {
            ally.ap = Math.min(ally.maxAp, ally.ap + item.power);
            this.spawnPopup(pos.x, pos.y - 22, `+${item.power} AP`, '#68d8ff');
            this.message = `${getDisplayName(ally)} restored AP with ${item.name}!`;
          } else if (item.category === 'status') {
            ally.status = 'none';
            this.spawnPopup(pos.x, pos.y - 22, 'CURED!', '#90f8d8');
            this.message = `${getDisplayName(ally)}'s status was purified!`;
          } else if (item.category === 'revive') {
            ally.hp = Math.max(1, Math.floor((ally.maxHp * item.power) / 100));
            ally.status = 'none';
            this.spawnPopup(pos.x, pos.y - 22, 'REVIVED!', '#ffe860');
            this.message = `${getDisplayName(ally)} revived and rejoined the fray!`;
          }
          this.game.audio.playSfx('heal');
          this.execDelay = 0.85 * speedMult;
          return;
        }
      }

      // Attack or Skill Move
      const move: MoveDef =
        act.kind === 'move' && act.moveId && MOVES[act.moveId] ? MOVES[act.moveId] : MOVES.tackle;

      if (act.kind === 'move') {
        if (actor.ap < move.apCost) {
          this.message = `${actorName} doesn't have enough AP for ${move.name}!`;
          this.execDelay = 0.7 * speedMult;
          return;
        }
        actor.ap -= move.apCost;
      }

      this.lungeKey = actor.uid;
      this.lungeTimer = 0.26;

      // Support / Healing moves
      if (move.category === 'heal') {
        const allies = act.actorType === 'party' ? state.party : this.enemies;
        const targets =
          move.target === 'all_allies'
            ? allies.map((m, i) => ({ m, i })).filter((t) => t.m.hp > 0)
            : [{ m: allies[act.targetIdx ?? act.actorIdx] ?? actor, i: act.targetIdx ?? act.actorIdx }];
        for (const t of targets) {
          const amt = Math.max(8, Math.round(t.m.maxHp * (move.healPercent ?? 0.4)));
          t.m.hp = Math.min(t.m.maxHp, t.m.hp + amt);
          const pos =
            act.actorType === 'party'
              ? this.getPartyPos(t.i)
              : this.getEnemyPos(t.i, this.enemies.length);
          this.spawnPopup(pos.x, pos.y - 22, `+${amt}`, '#68f080');
          this.spawnBurst(pos.x, pos.y - 12, '#68f080', 12);
        }
        this.game.audio.playSfx('heal');
        this.message = `${actorName} cast ${move.name}!`;
        this.execDelay = 0.85 * speedMult;
        return;
      }

      if (move.category === 'status' && move.buffStat) {
        const cur = this.buffs.get(actor.uid) ?? { atk: 0, def: 0, spd: 0 };
        cur[move.buffStat] = Math.min(3, cur[move.buffStat] + 1);
        this.buffs.set(actor.uid, cur);
        const pos =
          act.actorType === 'party'
            ? this.getPartyPos(act.actorIdx)
            : this.getEnemyPos(act.actorIdx, this.enemies.length);
        this.spawnPopup(pos.x, pos.y - 22, `${move.buffStat.toUpperCase()} UP!`, '#ffe860');
        this.game.audio.playSfx('confirm');
        this.message = `${actorName} used ${move.name}!`;
        this.execDelay = 0.75 * speedMult;
        return;
      }

      // Offensive move (single or AoE)
      const oppList = act.actorType === 'party' ? this.enemies : state.party;
      const targets: Array<{ mon: PokemonInstance; idx: number }> = [];
      if (move.target === 'all_enemies') {
        oppList.forEach((m, i) => {
          if (m.hp > 0) targets.push({ mon: m, idx: i });
        });
      } else {
        const tidx = this.resolveLivingTarget(oppList, act.targetIdx ?? 0);
        if (oppList[tidx] && oppList[tidx].hp > 0) {
          targets.push({ mon: oppList[tidx], idx: tidx });
        }
      }

      let superHit = false;
      let totalDmg = 0;
      const animColor = TYPE_COLORS[move.type] ?? '#ffffff';

      for (const t of targets) {
        const res = calculateDamage(actor, t.mon, move, {
          defenderGuarding: this.guardingSet.has(t.mon.uid),
          attackerBuffs: this.buffs.get(actor.uid),
          defenderBuffs: this.buffs.get(t.mon.uid),
        });
        const pos =
          act.actorType === 'party'
            ? this.getEnemyPos(t.idx, this.enemies.length)
            : this.getPartyPos(t.idx);

        if (res.missed) {
          this.spawnPopup(pos.x, pos.y - 22, 'MISS', '#c8d0e0');
        } else {
          t.mon.hp = Math.max(0, t.mon.hp - res.damage);
          totalDmg += res.damage;
          this.spawnBurst(pos.x, pos.y - 12, animColor, move.target === 'all_enemies' ? 20 : 14);
          const tag =
            res.effectiveness >= 1.5
              ? `-${res.damage} SUPER!`
              : res.effectiveness <= 0.6
                ? `-${res.damage} WEAK`
                : res.isCrit
                  ? `-${res.damage} CRIT!`
                  : `-${res.damage}`;
          const col = res.effectiveness >= 1.5 || res.isCrit ? '#ffe850' : '#ff7060';
          this.spawnPopup(pos.x, pos.y - 22, tag, col);
          if (res.effectiveness >= 1.5 || res.isCrit) superHit = true;
          if (res.appliedStatus) {
            t.mon.status = res.appliedStatus;
            this.spawnPopup(pos.x, pos.y - 34, res.appliedStatus.toUpperCase() + '!', '#d890ff');
          }
        }
      }

      // Charge Dragon Resonance gauge during combat!
      if (act.actorType === 'party') {
        state.resonanceGauge = Math.min(100, state.resonanceGauge + (superHit ? 14 : 9));
      } else if (totalDmg > 0) {
        state.resonanceGauge = Math.min(100, state.resonanceGauge + 6);
      }

      if (superHit) {
        this.game.audio.playSfx('superEffective');
        this.shakeTimer = 0.22;
      } else {
        this.game.audio.playSfx('hit');
      }

      this.message =
        act.kind === 'attack'
          ? `${actorName} struck for ${totalDmg} damage!`
          : `${actorName} unleashed ${move.name}!`;
      this.execDelay = 0.88 * speedMult;
      return;
    }

    // End of round: apply Burn/Poison/Curse ticks
    for (const mon of [...state.party, ...this.enemies]) {
      if (mon.hp > 0 && (mon.status === 'burn' || mon.status === 'poison' || mon.status === 'curse')) {
        const dot = Math.max(2, Math.floor(mon.maxHp * 0.08));
        mon.hp = Math.max(1, mon.hp - dot);
      }
    }

    if (!this.checkBattleEnd()) {
      this.startRoundSelection();
    }
  }

  private resolveLivingTarget(list: PokemonInstance[], preferred: number): number {
    if (list[preferred] && list[preferred].hp > 0) return preferred;
    const fallback = list.findIndex((m) => m.hp > 0);
    return fallback >= 0 ? fallback : 0;
  }

  private triggerVictory(): void {
    const state = this.game.state!;
    this.phase = 'victory';
    this.autoBattle = false;
    this.game.audio.playMusic('victory');

    let totalExp = 0;
    let totalGold = 0;
    for (const foe of this.enemies) {
      const sp = SPECIES[foe.speciesId];
      totalExp += Math.round((sp?.expYield ?? 30) * (0.85 + foe.level * 0.14));
      totalGold += Math.round((sp?.goldYield ?? 20) * (0.85 + foe.level * 0.1));
    }
    state.gold += totalGold;
    if (this.config.onVictoryFlag) {
      state.flags[this.config.onVictoryFlag] = true;
    }

    const lines: string[] = [
      `VICTORY! Earned ${totalExp} EXP and ${totalGold} Gold!`,
    ];

    let leveledAny = false;
    for (const mon of state.party) {
      mon.activeResonanceId = null;
      const summary = awardExperience(mon, totalExp);
      if (summary.leveledUp) {
        leveledAny = true;
        lines.push(`${getDisplayName(mon)} grew to Lv.${summary.newLevel}!`);
        for (const mv of summary.learnedMoves) {
          lines.push(`  Learned new art: ${mv}!`);
        }
        if (summary.evolvedFrom && summary.evolvedTo) {
          lines.push(`  ★ ${summary.evolvedFrom} EVOLVED into ${summary.evolvedTo}! ★`);
        }
      }
    }
    if (leveledAny) this.game.audio.playSfx('levelUp');

    this.victoryLines = lines;
    this.victoryPage = 0;
    this.message = lines[0];
    autoSaveGame(state);
  }

  private triggerDefeat(): void {
    this.phase = 'defeat';
    this.autoBattle = false;
    this.message = 'Your party collapsed! Retreating safely to Embervale PokéTavern...';
  }

  update(dt: number): void {
    const state = this.game.state!;
    const inp = this.game.input;

    if (this.lungeTimer > 0) this.lungeTimer = Math.max(0, this.lungeTimer - dt);
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - dt);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);

    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].y -= 18 * dt;
      this.popups[i].life -= dt;
      if (this.popups[i].life <= 0) this.popups.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (this.phase === 'intro') {
      this.introTimer -= dt;
      if (this.introTimer <= 0 || inp.consume('confirm')) {
        this.startRoundSelection();
      }
      return;
    }

    if (this.phase === 'mid_dialog') {
      if (inp.consume('confirm')) {
        this.game.audio.playSfx('cursor');
        this.midDialogIdx++;
        const lines = this.config.midBattleDialogue?.lines ?? [];
        if (this.midDialogIdx >= lines.length) {
          this.phase = 'executing';
          this.execDelay = 0.25;
        }
      }
      return;
    }

    if (this.phase === 'executing') {
      if (inp.consume('cancel') && this.autoBattle) {
        this.autoBattle = false;
        this.message = 'Auto-Battle cancelled for next round.';
      }
      this.execDelay -= dt;
      if (this.execDelay <= 0) {
        this.executeNextAction();
      }
      return;
    }

    if (this.phase === 'victory') {
      if (inp.consume('confirm') || inp.consume('cancel')) {
        this.victoryPage++;
        if (this.victoryPage < this.victoryLines.length) {
          this.message = this.victoryLines[this.victoryPage];
          this.game.audio.playSfx('cursor');
        } else {
          this.game.enterOverworld(this.config.onVictoryDialogue);
        }
      }
      return;
    }

    if (this.phase === 'defeat') {
      if (inp.consume('confirm') || inp.consume('cancel')) {
        healFullParty(state);
        state.mapId = 'embervale_tavern';
        state.x = 7;
        state.y = 7;
        state.facing = 'up';
        this.game.enterOverworld();
      }
      return;
    }

    const activeMon = state.party[this.selectingPartyIdx];

    // Command icon bar navigation
    if (this.phase === 'command') {
      if (inp.consume('left')) {
        this.cmdCursor = (this.cmdCursor + COMMAND_ICONS.length - 1) % COMMAND_ICONS.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('right')) {
        this.cmdCursor = (this.cmdCursor + 1) % COMMAND_ICONS.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('confirm')) {
        const cmd = COMMAND_ICONS[this.cmdCursor].id;
        this.game.audio.playSfx('confirm');
        if (cmd === 'fight') {
          this.pendingKind = 'attack';
          this.targetCursor = this.resolveLivingTarget(this.enemies, 0);
          this.phase = 'target_enemy';
        } else if (cmd === 'skill') {
          this.subCursor = 0;
          this.phase = 'sub_skill';
        } else if (cmd === 'dragon') {
          const sp = SPECIES[activeMon.speciesId];
          if (!activeMon.isPartner && !sp.canResonate) {
            this.message = 'Only your Dragon-Bonded partner can invoke Dragon Resonance!';
            this.game.audio.playSfx('cancel');
          } else if (state.unlockedResonances.length === 0) {
            this.message = 'Visit the Ancient Dragon Statue in Verdant Wilds to awaken Resonance!';
            this.game.audio.playSfx('cancel');
          } else {
            this.subCursor = 0;
            this.phase = 'sub_resonance';
          }
        } else if (cmd === 'bag') {
          this.subCursor = 0;
          this.phase = 'sub_item';
        } else if (cmd === 'guard') {
          this.advancePartySelection({
            actorType: 'party',
            actorIdx: this.selectingPartyIdx,
            kind: 'guard',
          });
        } else if (cmd === 'auto') {
          this.autoBattle = true;
          this.startRoundSelection();
        } else if (cmd === 'run') {
          this.advancePartySelection({
            actorType: 'party',
            actorIdx: this.selectingPartyIdx,
            kind: 'run',
          });
        }
      }
      return;
    }

    // Skill submenu
    if (this.phase === 'sub_skill') {
      const moves = getAvailableMovesForBattle(activeMon);
      if (inp.consume('up')) {
        this.subCursor = (this.subCursor + moves.length - 1) % moves.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.subCursor = (this.subCursor + 1) % moves.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('cancel')) {
        this.phase = 'command';
        this.game.audio.playSfx('cancel');
        return;
      }
      if (inp.consume('confirm')) {
        const mv = moves[this.subCursor];
        if (!mv || activeMon.ap < mv.apCost) {
          this.game.audio.playSfx('cancel');
          this.message = 'Not enough AP!';
          return;
        }
        this.game.audio.playSfx('confirm');
        if (mv.target === 'all_enemies' || mv.target === 'all_allies' || mv.target === 'self') {
          this.advancePartySelection({
            actorType: 'party',
            actorIdx: this.selectingPartyIdx,
            kind: 'move',
            moveId: mv.id,
          });
        } else if (mv.target === 'single_ally') {
          this.pendingKind = 'move';
          this.pendingMoveId = mv.id;
          this.targetCursor = this.selectingPartyIdx;
          this.phase = 'target_ally';
        } else {
          this.pendingKind = 'move';
          this.pendingMoveId = mv.id;
          this.targetCursor = this.resolveLivingTarget(this.enemies, 0);
          this.phase = 'target_enemy';
        }
      }
      return;
    }

    // Dragon Resonance submenu
    if (this.phase === 'sub_resonance') {
      const unlocked = RESONANCE_ORDER.filter((id) => state.unlockedResonances.includes(id));
      if (inp.consume('up')) {
        this.subCursor = (this.subCursor + unlocked.length - 1) % unlocked.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.subCursor = (this.subCursor + 1) % unlocked.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('cancel')) {
        this.phase = 'command';
        this.game.audio.playSfx('cancel');
        return;
      }
      if (inp.consume('confirm')) {
        const form = RESONANCE_FORMS[unlocked[this.subCursor]];
        if (!form) return;
        if (activeMon.ap < form.apCost || state.resonanceGauge < form.resonanceCost) {
          this.game.audio.playSfx('cancel');
          this.message = `Needs ${form.apCost} AP & ${form.resonanceCost}% Resonance Gauge! (Guard charges Resonance)`;
          return;
        }
        this.game.audio.playSfx('confirm');
        this.advancePartySelection({
          actorType: 'party',
          actorIdx: this.selectingPartyIdx,
          kind: 'resonate',
          resonanceId: form.id,
        });
      }
      return;
    }

    // Bag / Orbs submenu
    if (this.phase === 'sub_item') {
      const battleItems = state.inventory.filter((e) => ITEMS[e.itemId]?.usableInBattle && e.qty > 0);
      if (battleItems.length === 0) {
        this.message = 'No battle items or Seal Orbs left!';
        this.phase = 'command';
        return;
      }
      if (inp.consume('up')) {
        this.subCursor = (this.subCursor + battleItems.length - 1) % battleItems.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.subCursor = (this.subCursor + 1) % battleItems.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('cancel')) {
        this.phase = 'command';
        this.game.audio.playSfx('cancel');
        return;
      }
      if (inp.consume('confirm')) {
        const entry = battleItems[this.subCursor];
        const def = ITEMS[entry.itemId];
        this.game.audio.playSfx('confirm');
        this.pendingKind = 'item';
        this.pendingItemId = def.id;
        if (def.category === 'orb') {
          this.targetCursor = this.resolveLivingTarget(this.enemies, 0);
          this.phase = 'target_enemy';
        } else {
          this.targetCursor = this.selectingPartyIdx;
          this.phase = 'target_ally';
        }
      }
      return;
    }

    // Target Enemy
    if (this.phase === 'target_enemy') {
      if (inp.consume('left') || inp.consume('up') || inp.consume('right') || inp.consume('down')) {
        const len = this.enemies.length;
        for (let step = 1; step <= len; step++) {
          const cand = (this.targetCursor + step) % len;
          if (this.enemies[cand].hp > 0) {
            this.targetCursor = cand;
            this.game.audio.playSfx('cursor');
            break;
          }
        }
      }
      if (inp.consume('cancel')) {
        this.phase = 'command';
        this.game.audio.playSfx('cancel');
        return;
      }
      if (inp.consume('confirm')) {
        this.game.audio.playSfx('confirm');
        this.advancePartySelection({
          actorType: 'party',
          actorIdx: this.selectingPartyIdx,
          kind: this.pendingKind === 'item' ? 'item' : this.pendingKind === 'move' ? 'move' : 'attack',
          moveId: this.pendingMoveId,
          itemId: this.pendingItemId,
          targetIdx: this.targetCursor,
        });
      }
      return;
    }

    // Target Ally
    if (this.phase === 'target_ally') {
      if (inp.consume('left') || inp.consume('up')) {
        this.targetCursor = (this.targetCursor + state.party.length - 1) % state.party.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('right') || inp.consume('down')) {
        this.targetCursor = (this.targetCursor + 1) % state.party.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('cancel')) {
        this.phase = 'command';
        this.game.audio.playSfx('cancel');
        return;
      }
      if (inp.consume('confirm')) {
        this.game.audio.playSfx('confirm');
        this.advancePartySelection({
          actorType: 'party',
          actorIdx: this.selectingPartyIdx,
          kind: this.pendingKind === 'item' ? 'item' : 'move',
          moveId: this.pendingMoveId,
          itemId: this.pendingItemId,
          targetIdx: this.targetCursor,
        });
      }
    }
  }

  private renderArenaBackdrop(ctx: CanvasRenderingContext2D): void {
    const bg = this.config.bg;
    const sky = ctx.createLinearGradient(0, 0, 0, 92);
    let floorColor = '#3f8c3d';
    let stripeColor = '#337632';

    if (bg === 'forest') {
      sky.addColorStop(0, '#0d1636');
      sky.addColorStop(1, '#263868');
      floorColor = '#245036';
      stripeColor = '#1c402c';
    } else if (bg === 'shrine') {
      sky.addColorStop(0, '#10242c');
      sky.addColorStop(1, '#1e4a4c');
      floorColor = '#284448';
      stripeColor = '#1e363a';
    } else if (bg === 'garrison') {
      sky.addColorStop(0, '#1a1c28');
      sky.addColorStop(1, '#303448');
      floorColor = '#4c5268';
      stripeColor = '#3c4256';
    } else {
      sky.addColorStop(0, '#3674c8');
      sky.addColorStop(1, '#8cd4ff');
    }

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, SCREEN_W, 90);

    // Horizon hills / shrine pillars
    ctx.fillStyle = bg === 'shrine' ? '#162e32' : '#265c34';
    ctx.fillRect(0, 62, SCREEN_W, 28);
    if (bg === 'shrine') {
      ctx.fillStyle = '#386c68';
      for (let x = 20; x < SCREEN_W; x += 68) {
        ctx.fillRect(x, 22, 14, 68);
        ctx.fillStyle = '#60e8c8';
        ctx.fillRect(x + 5, 34, 4, 14);
        ctx.fillStyle = '#386c68';
      }
    }

    // Isometric perspective ground plane (classic Breath of Fire diagonal stripes!)
    ctx.fillStyle = floorColor;
    ctx.fillRect(0, 84, SCREEN_W, 102);

    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 2;
    for (let i = -4; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 44, 84);
      ctx.lineTo(i * 44 - 70, 186);
      ctx.stroke();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const state = this.game.state!;
    const tick = this.game.tick;

    ctx.save();
    if (this.shakeTimer > 0) {
      const sx = Math.round((Math.random() - 0.5) * 6);
      const sy = Math.round((Math.random() - 0.5) * 4);
      ctx.translate(sx, sy);
    }

    this.renderArenaBackdrop(ctx);

    // Top-right Dragon Resonance Gauge (BoF Dragon Meter!)
    drawBofBox(ctx, 206, 4, 110, 22, { accent: '#ffd848' });
    drawText(ctx, 'DRAGON', 213, 11, { size: 7, bold: true, color: '#ffd858' });
    drawBar(ctx, 250, 11, 58, 7, state.resonanceGauge / 100, '#58d8ff');

    // Render Enemies (Upper-Left Isometric Formation)
    this.enemies.forEach((enemy, idx) => {
      if (enemy.hp <= 0) return;
      const pos = this.getEnemyPos(idx, this.enemies.length);
      const sp = SPECIES[enemy.speciesId];
      const lunge = this.lungeKey === enemy.uid && this.lungeTimer > 0 ? 12 : 0;
      const scale = sp.isBoss ? 1.75 : 1.3;
      drawPokemonSprite(ctx, sp.spriteKey, pos.x + lunge, pos.y + lunge * 0.5, scale, tick + idx * 9, false);

      // Enemy HP plate
      drawBar(ctx, pos.x - 22, pos.y + 4, 44, 4, enemy.hp / enemy.maxHp, '#f04848');
      drawText(ctx, `${getDisplayName(enemy)} Lv.${enemy.level}`, pos.x, pos.y + 10, {
        align: 'center',
        size: 6,
        color: '#fff',
      });
      if (enemy.status !== 'none') {
        drawText(ctx, enemy.status.toUpperCase(), pos.x, pos.y - 36, {
          align: 'center',
          size: 6,
          bold: true,
          color: '#e088ff',
        });
      }

      if (this.phase === 'target_enemy' && this.targetCursor === idx) {
        drawCursorArrow(ctx, pos.x - 28, pos.y - 18, tick);
      }
    });

    // Render Player's 4-Pokémon Active Party (Lower-Right Isometric Formation!)
    state.party.forEach((mon, idx) => {
      const pos = this.getPartyPos(idx);
      const sp = SPECIES[mon.speciesId];
      const spriteKey = mon.activeResonanceId
        ? RESONANCE_FORMS[mon.activeResonanceId]?.spriteKey ?? sp.spriteKey
        : sp.spriteKey;
      const lunge = this.lungeKey === mon.uid && this.lungeTimer > 0 ? -12 : 0;
      const scale = mon.activeResonanceId ? 1.55 : 1.25;

      if (mon.hp > 0) {
        drawPokemonSprite(ctx, spriteKey, pos.x + lunge, pos.y + lunge * 0.5, scale, tick + idx * 5, true);
      } else {
        ctx.globalAlpha = 0.35;
        drawPokemonSprite(ctx, spriteKey, pos.x, pos.y + 4, 1.0, 0, true);
        ctx.globalAlpha = 1;
      }

      // Active command pointer above currently selecting Pokémon
      if (
        (this.phase === 'command' ||
          this.phase === 'sub_skill' ||
          this.phase === 'sub_resonance' ||
          this.phase === 'sub_item') &&
        idx === this.selectingPartyIdx
      ) {
        drawText(ctx, '▼', pos.x, pos.y - 34, { align: 'center', size: 8, color: '#ffe850' });
      }
      if (this.phase === 'target_ally' && this.targetCursor === idx) {
        drawCursorArrow(ctx, pos.x - 24, pos.y - 18, tick);
      }
    });

    // Particles & Floating damage numbers
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3);
    }
    for (const pop of this.popups) {
      drawText(ctx, pop.text, pop.x, pop.y, {
        align: 'center',
        size: 8,
        bold: true,
        color: pop.color,
      });
    }

    // Bottom 4-Slot Breath of Fire Party Status Cards
    const cardW = 76;
    state.party.forEach((mon, idx) => {
      const cx = 6 + idx * 78;
      const cy = 192;
      const active =
        (this.phase === 'command' || this.phase === 'sub_skill' || this.phase === 'sub_resonance' || this.phase === 'sub_item') &&
        idx === this.selectingPartyIdx;
      drawBofBox(ctx, cx, cy, cardW, 44, {
        accent: mon.activeResonanceId ? '#ff9840' : active ? '#ffd858' : '#4a68a8',
        bgTop: mon.hp <= 0 ? '#3a1a24' : active ? '#2e52aa' : '#1b306c',
      });
      drawText(ctx, getDisplayName(mon).slice(0, 9), cx + 5, cy + 4, {
        size: 7,
        bold: true,
        color: mon.activeResonanceId ? '#ffe066' : '#fff',
      });
      drawText(ctx, `L${mon.level}`, cx + cardW - 5, cy + 4, {
        align: 'right',
        size: 6,
        color: '#a8d8ff',
      });

      drawText(ctx, `HP`, cx + 5, cy + 16, { size: 6, color: '#a8f0a8' });
      drawBar(ctx, cx + 18, cy + 17, 30, 4, mon.hp / mon.maxHp, mon.hp / mon.maxHp < 0.25 ? '#ff5050' : '#58e068');
      drawText(ctx, `${mon.hp}`, cx + cardW - 4, cy + 15, { align: 'right', size: 6, color: '#fff' });

      drawText(ctx, `AP`, cx + 5, cy + 28, { size: 6, color: '#88d8ff' });
      drawBar(ctx, cx + 18, cy + 29, 30, 4, mon.ap / mon.maxAp, '#48b8ff');
      drawText(ctx, `${mon.ap}`, cx + cardW - 4, cy + 27, { align: 'right', size: 6, color: '#fff' });
    });

    // Breath of Fire Icon Command Bar (when choosing command)
    if (this.phase === 'command') {
      drawBofBox(ctx, 6, 158, 308, 30, { accent: '#ffd858' });
      COMMAND_ICONS.forEach((cmd, idx) => {
        const ix = 12 + idx * 43;
        const sel = idx === this.cmdCursor;
        if (sel) {
          ctx.fillStyle = 'rgba(255, 216, 88, 0.22)';
          ctx.fillRect(ix - 2, 161, 41, 24);
          ctx.strokeStyle = '#ffd858';
          ctx.strokeRect(ix - 1.5, 161.5, 40, 23);
        }
        drawText(ctx, cmd.icon, ix + 18, 163, { align: 'center', size: 9, color: cmd.color });
        drawText(ctx, cmd.label, ix + 18, 175, {
          align: 'center',
          size: 6,
          bold: sel,
          color: sel ? '#ffd858' : '#d8e4ff',
        });
      });
    } else if (this.phase === 'sub_skill') {
      const moves = getAvailableMovesForBattle(state.party[this.selectingPartyIdx]);
      drawBofBox(ctx, 10, 108, 224, 80, { accent: '#68d8ff' });
      drawText(ctx, 'SELECT SKILL / ART', 18, 114, { size: 7, bold: true, color: '#ffd858' });
      moves.forEach((mv, idx) => {
        const y = 126 + idx * 14;
        if (idx === this.subCursor) drawCursorArrow(ctx, 16, y, tick);
        drawText(ctx, mv.name, 26, y, { size: 7, color: idx === this.subCursor ? '#ffd858' : '#fff' });
        drawText(ctx, mv.type, 126, y, { size: 6, color: TYPE_COLORS[mv.type] });
        drawText(ctx, `${mv.apCost}AP`, 188, y, { size: 7, color: '#88e0ff' });
        if (mv.target === 'all_enemies' || mv.target === 'all_allies') {
          drawText(ctx, 'ALL', 214, y, { size: 6, color: '#ff9860' });
        }
      });
      const selMove = moves[this.subCursor];
      if (selMove) {
        drawBofBox(ctx, 236, 108, 76, 80);
        wrapText(selMove.description, 11).forEach((ln, i) => {
          drawText(ctx, ln, 242, 116 + i * 10, { size: 6, color: '#e8f0ff' });
        });
      }
    } else if (this.phase === 'sub_resonance') {
      const unlocked = RESONANCE_ORDER.filter((id) => state.unlockedResonances.includes(id));
      drawBofBox(ctx, 14, 112, 292, 76, { accent: '#ffd848' });
      drawText(ctx, 'DRAGON RESONANCE TRANSFORMATION', 24, 118, {
        size: 8,
        bold: true,
        color: '#ffd858',
      });
      unlocked.forEach((id, idx) => {
        const f = RESONANCE_FORMS[id];
        const y = 134 + idx * 16;
        if (idx === this.subCursor) drawCursorArrow(ctx, 22, y, tick);
        drawText(ctx, f.name, 32, y, { size: 8, bold: true, color: f.auraColor });
        drawText(ctx, `${f.apCost}AP / ${f.resonanceCost}% Gauge`, 160, y, { size: 7, color: '#e8f0ff' });
      });
    } else if (this.phase === 'sub_item') {
      const items = state.inventory.filter((e) => ITEMS[e.itemId]?.usableInBattle && e.qty > 0);
      drawBofBox(ctx, 14, 104, 292, 84, { accent: '#78e888' });
      drawText(ctx, 'BAG & CAPTURE ORBS', 24, 110, { size: 8, bold: true, color: '#ffd858' });
      const start = Math.max(0, this.subCursor - 3);
      items.slice(start, start + 5).forEach((entry, row) => {
        const realIdx = start + row;
        const def = ITEMS[entry.itemId];
        const y = 123 + row * 12;
        if (realIdx === this.subCursor) drawCursorArrow(ctx, 22, y, tick);
        drawText(ctx, `${def.name} x${entry.qty}`, 32, y, {
          size: 7,
          color: realIdx === this.subCursor ? '#ffd858' : '#fff',
        });
        drawText(ctx, def.description.slice(0, 26), 148, y, { size: 6, color: '#b8d0f8' });
      });
    } else if (this.phase === 'mid_dialog' && this.config.midBattleDialogue) {
      const entry = this.config.midBattleDialogue.lines[this.midDialogIdx];
      drawBofBox(ctx, 10, 144, 300, 44, { accent: '#d870ff' });
      drawText(ctx, entry.speaker.toUpperCase(), 18, 150, { size: 8, bold: true, color: '#ffd858' });
      wrapText(entry.text, 44).forEach((ln, i) => {
        drawText(ctx, ln, 18, 162 + i * 10, { size: 7, color: '#fff' });
      });
      drawText(ctx, '▼ Z', 290, 176, { size: 7, color: '#88e0ff' });
    } else {
      // Top/Mid Action Message Banner
      drawBofBox(ctx, 8, 160, 304, 28);
      drawText(ctx, this.message, SCREEN_W / 2, 170, {
        align: 'center',
        size: 7,
        color: this.phase === 'victory' ? '#ffd858' : '#fff',
      });
    }

    // Screen flash overlay (Dragon Resonance / Boss phase)
    if (this.flashTimer > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = Math.min(0.7, this.flashTimer * 2);
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
