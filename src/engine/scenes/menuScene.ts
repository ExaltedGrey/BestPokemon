import { ITEMS } from '@data/items';
import { LORE_ENTRIES } from '@data/lore';
import { MOVES } from '@data/moves';
import { RESONANCE_FORMS, RESONANCE_ORDER } from '@data/resonances';
import { SPECIES } from '@data/species';
import { getDisplayName } from '@engine/battleMath';
import { drawPokemonSprite } from '@engine/gfx/sprites';
import { drawBar, drawBofBox, drawCursorArrow, drawText, SCREEN_H, SCREEN_W, wrapText } from '@engine/gfx/ui';
import { listSaveSlots, saveGameToSlot } from '@engine/save';
import type { GameController, Scene } from '@engine/sceneManager';
import {
  CHAPTER_1_QUESTS,
  formatClock,
  getAlignmentTitle,
  useItemOnPokemon,
} from '@engine/state';
import type { SaveSlotSummary } from '@engine/types';

type MenuTab = 'main' | 'party' | 'bag' | 'bag_target' | 'dragon' | 'dex' | 'lore' | 'quests' | 'save' | 'options';

const MAIN_ITEMS: Array<{ id: MenuTab; label: string }> = [
  { id: 'party', label: 'PARTY & LEAD' },
  { id: 'bag', label: 'BAG / ITEMS' },
  { id: 'dragon', label: 'DRAGON FORMS' },
  { id: 'dex', label: 'BESTIARY' },
  { id: 'lore', label: 'LORE CODEX' },
  { id: 'quests', label: 'QUESTS & RANK' },
  { id: 'save', label: 'SAVE GAME' },
  { id: 'options', label: 'OPTIONS' },
];

export class MenuScene implements Scene {
  private game: GameController;
  private tab: MenuTab = 'main';
  private mainCursor = 0;
  private subCursor = 0;
  private targetCursor = 0;
  private selectedItemId = '';
  private notice = '';
  private noticeTimer = 0;
  private saveSlots: SaveSlotSummary[] = [];

  constructor(game: GameController) {
    this.game = game;
  }

  enter(): void {
    this.tab = 'main';
    this.saveSlots = listSaveSlots();
  }

  private flashNotice(msg: string): void {
    this.notice = msg;
    this.noticeTimer = 2.2;
  }

  update(dt: number): void {
    const state = this.game.state!;
    const inp = this.game.input;
    if (this.noticeTimer > 0) this.noticeTimer = Math.max(0, this.noticeTimer - dt);

    if (this.tab === 'main') {
      if (inp.consume('up')) {
        this.mainCursor = (this.mainCursor + MAIN_ITEMS.length - 1) % MAIN_ITEMS.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.mainCursor = (this.mainCursor + 1) % MAIN_ITEMS.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('cancel')) {
        this.game.audio.playSfx('cancel');
        this.game.enterOverworld();
        return;
      }
      if (inp.consume('confirm')) {
        this.game.audio.playSfx('confirm');
        this.tab = MAIN_ITEMS[this.mainCursor].id;
        this.subCursor = 0;
        if (this.tab === 'save') this.saveSlots = listSaveSlots();
      }
      return;
    }

    if (inp.consume('cancel')) {
      this.game.audio.playSfx('cancel');
      this.tab = this.tab === 'bag_target' ? 'bag' : 'main';
      return;
    }

    if (this.tab === 'party') {
      const len = state.party.length;
      if (inp.consume('up')) {
        this.subCursor = (this.subCursor + len - 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.subCursor = (this.subCursor + 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('confirm') && this.subCursor > 0) {
        // Set selected Pokémon as Lead!
        const [picked] = state.party.splice(this.subCursor, 1);
        state.party.unshift(picked);
        this.subCursor = 0;
        this.game.audio.playSfx('confirm');
        this.flashNotice(`${getDisplayName(picked)} is now your Lead Pokémon!`);
      }
      return;
    }

    if (this.tab === 'bag') {
      const items = state.inventory.filter((i) => i.qty > 0);
      if (items.length === 0) return;
      if (inp.consume('up')) {
        this.subCursor = (this.subCursor + items.length - 1) % items.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.subCursor = (this.subCursor + 1) % items.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('confirm')) {
        const entry = items[this.subCursor];
        const def = ITEMS[entry.itemId];
        if (def?.usableInOverworld) {
          this.selectedItemId = def.id;
          this.targetCursor = 0;
          this.tab = 'bag_target';
          this.game.audio.playSfx('confirm');
        } else {
          this.game.audio.playSfx('cancel');
          this.flashNotice(`${def?.name} is used in battle or at shrines.`);
        }
      }
      return;
    }

    if (this.tab === 'bag_target') {
      const len = state.party.length;
      if (inp.consume('up')) {
        this.targetCursor = (this.targetCursor + len - 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.targetCursor = (this.targetCursor + 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('confirm')) {
        const target = state.party[this.targetCursor];
        const msg = useItemOnPokemon(state, this.selectedItemId, target);
        if (msg) {
          this.game.audio.playSfx('heal');
          this.flashNotice(msg);
          this.tab = 'bag';
          this.subCursor = Math.min(this.subCursor, Math.max(0, state.inventory.length - 1));
        } else {
          this.game.audio.playSfx('cancel');
          this.flashNotice("It won't have any effect on that Pokémon!");
        }
      }
      return;
    }

    if (this.tab === 'dex') {
      const list = Object.values(SPECIES);
      if (inp.consume('up')) {
        this.subCursor = (this.subCursor + list.length - 1) % list.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.subCursor = (this.subCursor + 1) % list.length;
        this.game.audio.playSfx('cursor');
      }
      return;
    }

    if (this.tab === 'lore') {
      const len = LORE_ENTRIES.length;
      if (inp.consume('up')) {
        this.subCursor = (this.subCursor + len - 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.subCursor = (this.subCursor + 1) % len;
        this.game.audio.playSfx('cursor');
      }
      return;
    }

    if (this.tab === 'save') {
      if (inp.consume('up')) {
        this.subCursor = (this.subCursor + 2) % 3;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.subCursor = (this.subCursor + 1) % 3;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('confirm')) {
        const slot = this.subCursor + 1;
        const ok = saveGameToSlot(slot, state);
        if (ok) {
          this.saveSlots = listSaveSlots();
          this.game.audio.playSfx('orbCatch');
          this.flashNotice(`Saved adventure to Slot ${slot}!`);
        } else {
          this.game.audio.playSfx('cancel');
          this.flashNotice('Could not write to browser storage.');
        }
      }
      return;
    }

    if (this.tab === 'options') {
      const count = 4;
      if (inp.consume('up')) {
        this.subCursor = (this.subCursor + count - 1) % count;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.subCursor = (this.subCursor + 1) % count;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('confirm')) {
        this.game.audio.playSfx('confirm');
        if (this.subCursor === 0) {
          state.settings.crt = !state.settings.crt;
          this.game.applyCrtSetting(state.settings.crt);
        } else if (this.subCursor === 1) {
          state.settings.muted = !state.settings.muted;
          this.game.applyMuteSetting(state.settings.muted);
        } else if (this.subCursor === 2) {
          state.settings.battleSpeed = state.settings.battleSpeed === 1 ? 2 : 1;
        } else if (this.subCursor === 3) {
          this.game.openTitle();
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const state = this.game.state!;
    const tick = this.game.tick;

    ctx.fillStyle = '#0a1024';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Left Command Sidebar
    drawBofBox(ctx, 6, 6, 98, 178);
    drawText(ctx, 'CAMP MENU', 16, 14, { size: 8, bold: true, color: '#ffd858' });
    MAIN_ITEMS.forEach((item, idx) => {
      const y = 30 + idx * 18;
      const active = this.tab === 'main' && idx === this.mainCursor;
      if (active) drawCursorArrow(ctx, 12, y, tick);
      drawText(ctx, item.label, 22, y, {
        size: 7,
        bold: active || this.tab === item.id,
        color: active || this.tab === item.id ? '#ffd858' : '#e0eaff',
      });
    });

    // Bottom-left summary box
    drawBofBox(ctx, 6, 188, 98, 46);
    drawText(ctx, `GOLD: ${state.gold}G`, 14, 195, { size: 7, color: '#ffe868' });
    drawText(ctx, `TIME: ${formatClock(state.timeMinutes)}`, 14, 207, { size: 7, color: '#b8e0ff' });
    drawText(ctx, `LORE: ${state.unlockedLore?.length ?? 0}/${LORE_ENTRIES.length}`, 14, 219, {
      size: 7,
      color: '#90f0a8',
    });

    // Right Detail Pane
    drawBofBox(ctx, 108, 6, 206, 228);

    if (this.tab === 'main' || this.tab === 'party') {
      drawText(ctx, 'ACTIVE 4-POKEMON PARTY', 118, 14, { size: 8, bold: true, color: '#ffd858' });
      drawText(ctx, 'Z: Make Lead   X: Back', 118, 25, { size: 6, color: '#98c0f0' });

      state.party.forEach((mon, idx) => {
        const y = 38 + idx * 45;
        const sp = SPECIES[mon.speciesId];
        const sel = this.tab === 'party' && idx === this.subCursor;
        drawBofBox(ctx, 114, y, 194, 41, { accent: sel ? '#ffd858' : '#4a68a8' });
        drawPokemonSprite(ctx, sp.spriteKey, 130, y + 32, 0.85, tick, false);
        drawText(ctx, `${idx === 0 ? '★ ' : ''}${getDisplayName(mon)} Lv.${mon.level}`, 148, y + 5, {
          size: 7,
          bold: true,
          color: idx === 0 ? '#ffd858' : '#fff',
        });
        drawText(ctx, `Skill: ${sp.fieldAbilityName}`, 148, y + 16, { size: 6, color: '#88f0d0' });
        drawBar(ctx, 148, y + 26, 62, 4, mon.hp / mon.maxHp, '#58e068');
        drawText(ctx, `${mon.hp}/${mon.maxHp}`, 214, y + 24, { size: 6, color: '#fff' });
        drawBar(ctx, 148, y + 33, 62, 4, mon.ap / mon.maxAp, '#48b8ff');
        drawText(ctx, `AP ${mon.ap}/${mon.maxAp}`, 214, y + 31, { size: 6, color: '#98e0ff' });
      });

      if (this.tab === 'party' && state.party[this.subCursor]) {
        const m = state.party[this.subCursor];
        const moveNames = m.moves.map((id) => MOVES[id]?.name ?? id).join(', ');
        drawText(ctx, `Moves: ${moveNames}`, 116, 221, { size: 6, color: '#d8e8ff' });
      }
    } else if (this.tab === 'bag' || this.tab === 'bag_target') {
      drawText(ctx, 'PACK & KEY RELICS', 118, 14, { size: 8, bold: true, color: '#ffd858' });
      const items = state.inventory.filter((i) => i.qty > 0);
      const start = Math.max(0, this.subCursor - 6);
      items.slice(start, start + 10).forEach((entry, row) => {
        const realIdx = start + row;
        const def = ITEMS[entry.itemId];
        const y = 30 + row * 14;
        if (realIdx === this.subCursor) drawCursorArrow(ctx, 116, y, tick);
        drawText(ctx, `${def.name}`, 126, y, {
          size: 7,
          color: realIdx === this.subCursor ? '#ffd858' : '#fff',
        });
        drawText(ctx, `x${entry.qty}`, 296, y, { align: 'right', size: 7, color: '#98d8ff' });
      });

      const cur = items[this.subCursor];
      if (cur) {
        drawBofBox(ctx, 114, 178, 194, 48);
        wrapText(ITEMS[cur.itemId].description, 28).forEach((ln, i) => {
          drawText(ctx, ln, 122, 186 + i * 11, { size: 7, color: '#e8f4ff' });
        });
      }

      if (this.tab === 'bag_target') {
        drawBofBox(ctx, 130, 56, 166, 108, { accent: '#78e888' });
        drawText(ctx, 'USE ON WHICH POKEMON?', 140, 64, { size: 7, bold: true, color: '#ffd858' });
        state.party.forEach((mon, i) => {
          const y = 80 + i * 18;
          if (i === this.targetCursor) drawCursorArrow(ctx, 138, y, tick);
          drawText(ctx, `${getDisplayName(mon)} ${mon.hp}/${mon.maxHp}HP`, 148, y, {
            size: 7,
            color: i === this.targetCursor ? '#ffd858' : '#fff',
          });
        });
      }
    } else if (this.tab === 'dragon') {
      drawText(ctx, 'DRAGON RESONANCE FORMS', 118, 14, { size: 8, bold: true, color: '#ffd858' });
      drawText(ctx, `Gauge: ${state.resonanceGauge}% (Charges in battle)`, 118, 26, {
        size: 7,
        color: '#88e0ff',
      });
      RESONANCE_ORDER.forEach((id, idx) => {
        const f = RESONANCE_FORMS[id];
        const unlocked = state.unlockedResonances.includes(id);
        const y = 44 + idx * 58;
        drawBofBox(ctx, 114, y, 194, 52, { accent: unlocked ? f.auraColor : '#404c68' });
        if (unlocked) {
          drawPokemonSprite(ctx, f.spriteKey, 136, y + 40, 1.0, tick, false);
          drawText(ctx, f.name.toUpperCase(), 158, y + 6, { size: 8, bold: true, color: f.auraColor });
          drawText(ctx, `Art: ${MOVES[f.signatureMoveId]?.name}`, 158, y + 19, { size: 7, color: '#ffd858' });
          drawText(ctx, `${f.apCost}AP • ${f.resonanceCost}% Gauge`, 158, y + 31, { size: 6, color: '#d8e8ff' });
        } else {
          drawText(ctx, `??? [LOCKED CREST]`, 126, y + 12, { size: 8, color: '#7888a8' });
          const hint =
            id === 'whelp'
              ? 'Seek the Ancient Dragon Statue in Verdant Wilds.'
              : 'Explore the side wings of Sunken Emerald Shrine.';
          wrapText(hint, 28).forEach((ln, i) => {
            drawText(ctx, ln, 126, y + 26 + i * 10, { size: 6, color: '#98a8c8' });
          });
        }
      });
    } else if (this.tab === 'dex') {
      const list = Object.values(SPECIES);
      drawText(ctx, `BESTIARY (${state.caughtSpecies.length}/${list.length} CAUGHT)`, 118, 14, {
        size: 8,
        bold: true,
        color: '#ffd858',
      });
      const start = Math.max(0, this.subCursor - 4);
      list.slice(start, start + 8).forEach((sp, row) => {
        const realIdx = start + row;
        const seen = state.seenSpecies.includes(sp.id);
        const caught = state.caughtSpecies.includes(sp.id);
        const y = 30 + row * 14;
        if (realIdx === this.subCursor) drawCursorArrow(ctx, 116, y, tick);
        drawText(
          ctx,
          `#${sp.dexNumber.toString().padStart(2, '0')} ${seen ? sp.name : '?????'}`,
          126,
          y,
          { size: 7, color: realIdx === this.subCursor ? '#ffd858' : '#e8f0ff' },
        );
        if (caught) drawText(ctx, '★', 292, y, { size: 7, color: '#ffd858' });
      });

      const cur = list[this.subCursor];
      drawBofBox(ctx, 114, 148, 194, 78);
      if (cur && state.seenSpecies.includes(cur.id)) {
        drawPokemonSprite(ctx, cur.spriteKey, 138, 198, 1.15, tick, false);
        drawText(ctx, `${cur.name} (${cur.types.join('/')})`, 164, 155, {
          size: 7,
          bold: true,
          color: '#ffd858',
        });
        drawText(ctx, `Skill: ${cur.fieldAbilityName}`, 164, 167, { size: 6, color: '#90f0d8' });
        wrapText(cur.lore, 22).forEach((ln, i) => {
          drawText(ctx, ln, 164, 180 + i * 10, { size: 6, color: '#e8f0ff' });
        });
      } else {
        drawText(ctx, 'Undiscovered species...', 126, 176, { size: 7, color: '#8898b8' });
      }
    } else if (this.tab === 'lore') {
      const unlocked = state.unlockedLore ?? [];
      drawText(ctx, `DRACONIA LORE CODEX (${unlocked.length}/${LORE_ENTRIES.length})`, 116, 14, {
        size: 8,
        bold: true,
        color: '#ffd858',
      });
      const start = Math.max(0, Math.min(LORE_ENTRIES.length - 6, this.subCursor - 3));
      LORE_ENTRIES.slice(start, start + 6).forEach((entry, row) => {
        const realIdx = start + row;
        const found = unlocked.includes(entry.id);
        const y = 30 + row * 13;
        if (realIdx === this.subCursor) drawCursorArrow(ctx, 114, y, tick);
        drawText(ctx, found ? `[${entry.category}] ${entry.title}` : `[LOCKED] ???`, 124, y, {
          size: 6,
          bold: realIdx === this.subCursor,
          color: realIdx === this.subCursor ? '#ffd858' : found ? '#e8f0ff' : '#7888a8',
        });
      });

      const cur = LORE_ENTRIES[this.subCursor];
      drawBofBox(ctx, 114, 114, 194, 114);
      if (cur && unlocked.includes(cur.id)) {
        drawText(ctx, cur.title.toUpperCase(), 120, 120, { size: 7, bold: true, color: '#ffd858' });
        drawText(ctx, cur.subtitle, 120, 130, { size: 6, color: '#88e0ff' });
        let ly = 142;
        for (const para of cur.paragraphs) {
          for (const ln of wrapText(para, 31)) {
            if (ly <= 216) {
              drawText(ctx, ln, 120, ly, { size: 6, color: '#eef4ff' });
              ly += 9;
            }
          }
          ly += 3;
        }
      } else {
        drawText(ctx, 'Undiscovered Chronicle', 122, 136, { size: 7, bold: true, color: '#8898b8' });
        wrapText(
          'Read plaques, bookshelves, dossiers, and talk to Embervale villagers to unlock this Lore Codex entry.',
          30,
        ).forEach((ln, i) => {
          drawText(ctx, ln, 122, 152 + i * 10, { size: 6, color: '#98a8c8' });
        });
      }
    } else if (this.tab === 'quests') {
      drawText(ctx, 'CHAPTER 1 QUEST LOG', 118, 14, { size: 8, bold: true, color: '#ffd858' });
      drawText(ctx, `Rank: ${getAlignmentTitle(state.alignment)}`, 118, 27, {
        size: 7,
        bold: true,
        color: state.alignment >= 0 ? '#78e8ff' : '#ff8070',
      });
      CHAPTER_1_QUESTS.forEach((q, idx) => {
        const done = Boolean(state.flags[q.completeFlag]);
        const active = !q.startFlag || Boolean(state.flags[q.startFlag]);
        const y = 44 + idx * 36;
        drawText(ctx, `${done ? '[DONE]' : active ? '[ACTIVE]' : '[LOCKED]'} ${q.title}`, 118, y, {
          size: 7,
          bold: true,
          color: done ? '#68e878' : active ? '#ffd858' : '#7888a8',
        });
        wrapText(q.description, 30).slice(0, 2).forEach((ln, i) => {
          drawText(ctx, ln, 122, y + 11 + i * 9, { size: 6, color: '#dce6ff' });
        });
      });
    } else if (this.tab === 'save') {
      drawText(ctx, 'SAVE ADVENTURE (AUTO + 3 SLOTS)', 118, 14, { size: 8, bold: true, color: '#ffd858' });
      this.saveSlots.forEach((s, idx) => {
        const y = 34 + idx * 48;
        drawBofBox(ctx, 114, y, 194, 42, { accent: idx === this.subCursor ? '#ffd858' : '#4a68a8' });
        if (idx === this.subCursor) drawCursorArrow(ctx, 118, y + 16, tick);
        if (s.empty) {
          drawText(ctx, `SLOT ${s.slot} — Empty`, 130, y + 16, { size: 7, color: '#8ca0c8' });
        } else {
          drawText(ctx, `SLOT ${s.slot}: ${s.playerName} • Ch.${s.chapter}`, 130, y + 8, {
            size: 7,
            bold: true,
            color: '#ffd858',
          });
          drawText(ctx, `${s.mapName} • ${s.leadName} Lv.${s.leadLevel}`, 130, y + 22, {
            size: 6,
            color: '#e8f0ff',
          });
        }
      });
      drawText(ctx, 'Z: Save Slot  •  Auto-Saves on travel/win', 118, 186, { size: 6, color: '#88e0ff' });
      drawText(ctx, 'Use [Export Save] above for portable .json!', 118, 198, { size: 6, color: '#90f0a8' });
    } else if (this.tab === 'options') {
      drawText(ctx, 'SYSTEM OPTIONS', 118, 14, { size: 8, bold: true, color: '#ffd858' });
      const opts = [
        `CRT Scanlines: ${state.settings.crt ? 'ON' : 'OFF'}`,
        `SNES Synth Audio: ${state.settings.muted ? 'MUTED' : 'ON'}`,
        `Battle Speed: ${state.settings.battleSpeed}x`,
        'Return to Title Screen',
      ];
      opts.forEach((label, idx) => {
        const y = 42 + idx * 24;
        if (idx === this.subCursor) drawCursorArrow(ctx, 118, y, tick);
        drawText(ctx, label, 130, y, {
          size: 8,
          color: idx === this.subCursor ? '#ffd858' : '#e8f0ff',
        });
      });
    }

    if (this.noticeTimer > 0) {
      drawBofBox(ctx, 26, 200, 268, 26, { accent: '#68e888' });
      drawText(ctx, this.notice, SCREEN_W / 2, 209, { align: 'center', size: 7, color: '#fff' });
    }
  }
}
