import { ITEMS, MART_STOCK } from '@data/items';
import { SPECIES } from '@data/species';
import { getDisplayName } from '@engine/battleMath';
import { drawPokemonSprite } from '@engine/gfx/sprites';
import { drawBofBox, drawCursorArrow, drawText, SCREEN_H, SCREEN_W, wrapText } from '@engine/gfx/ui';
import type { GameController, Scene } from '@engine/sceneManager';
import { addItem, getItemQty } from '@engine/state';

export class ShopScene implements Scene {
  private game: GameController;
  private mode: 'mart' | 'pc_box';
  private cursor = 0;
  private column: 'party' | 'storage' = 'party';
  private notice = '';
  private noticeTimer = 0;

  constructor(game: GameController, mode: 'mart' | 'pc_box') {
    this.game = game;
    this.mode = mode;
  }

  private flash(msg: string): void {
    this.notice = msg;
    this.noticeTimer = 2.0;
  }

  update(dt: number): void {
    const state = this.game.state!;
    const inp = this.game.input;
    if (this.noticeTimer > 0) this.noticeTimer = Math.max(0, this.noticeTimer - dt);

    if (inp.consume('cancel')) {
      this.game.audio.playSfx('cancel');
      this.game.enterOverworld();
      return;
    }

    if (this.mode === 'mart') {
      const len = MART_STOCK.length;
      if (inp.consume('up')) {
        this.cursor = (this.cursor + len - 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.cursor = (this.cursor + 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('confirm')) {
        const item = ITEMS[MART_STOCK[this.cursor]];
        if (state.gold >= item.price) {
          state.gold -= item.price;
          addItem(state, item.id, 1);
          this.game.audio.playSfx('confirm');
          this.flash(`Bought ${item.name}!`);
        } else {
          this.game.audio.playSfx('cancel');
          this.flash('Not enough Gold!');
        }
      }
      return;
    }

    // PC / Camp Box Roster Swapper
    if (inp.consume('left') || inp.consume('right')) {
      this.column = this.column === 'party' ? 'storage' : 'party';
      this.cursor = 0;
      this.game.audio.playSfx('cursor');
    }
    const list = this.column === 'party' ? state.party : state.storage;
    if (list.length === 0) return;

    if (inp.consume('up')) {
      this.cursor = (this.cursor + list.length - 1) % list.length;
      this.game.audio.playSfx('cursor');
    }
    if (inp.consume('down')) {
      this.cursor = (this.cursor + 1) % list.length;
      this.game.audio.playSfx('cursor');
    }
    if (inp.consume('confirm')) {
      if (this.column === 'party') {
        if (state.party.length <= 1) {
          this.game.audio.playSfx('cancel');
          this.flash('You must keep at least 1 Pokémon in your party!');
          return;
        }
        const [moved] = state.party.splice(this.cursor, 1);
        state.storage.push(moved);
        this.cursor = Math.max(0, this.cursor - 1);
        this.game.audio.playSfx('confirm');
        this.flash(`Deposited ${getDisplayName(moved)} into Camp Box.`);
      } else {
        if (state.party.length >= 4) {
          this.game.audio.playSfx('cancel');
          this.flash('Active party is full (4/4)! Deposit a Pokémon first.');
          return;
        }
        const [moved] = state.storage.splice(this.cursor, 1);
        state.party.push(moved);
        this.cursor = Math.max(0, this.cursor - 1);
        this.game.audio.playSfx('confirm');
        this.flash(`${getDisplayName(moved)} joined your Active Party!`);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const state = this.game.state!;
    const tick = this.game.tick;

    ctx.fillStyle = '#0a1024';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    if (this.mode === 'mart') {
      drawBofBox(ctx, 8, 8, 304, 28);
      drawText(ctx, 'EMBERVALE SUPPLY MART', 18, 17, { size: 9, bold: true, color: '#ffd858' });
      drawText(ctx, `GOLD: ${state.gold}G`, 300, 17, { align: 'right', size: 9, bold: true, color: '#ffe868' });

      drawBofBox(ctx, 8, 40, 184, 152);
      MART_STOCK.forEach((id, idx) => {
        const item = ITEMS[id];
        const y = 48 + idx * 15;
        if (idx === this.cursor) drawCursorArrow(ctx, 14, y, tick);
        drawText(ctx, item.name, 24, y, {
          size: 7,
          color: idx === this.cursor ? '#ffd858' : '#fff',
        });
        drawText(ctx, `${item.price}G`, 182, y, { align: 'right', size: 7, color: '#98e0ff' });
      });

      const cur = ITEMS[MART_STOCK[this.cursor]];
      drawBofBox(ctx, 196, 40, 116, 152);
      drawText(ctx, cur.name, 204, 50, { size: 8, bold: true, color: '#ffd858' });
      drawText(ctx, `Owned: ${getItemQty(state, cur.id)}`, 204, 66, { size: 7, color: '#90f0a8' });
      wrapText(cur.description, 16).forEach((ln, i) => {
        drawText(ctx, ln, 204, 84 + i * 11, { size: 7, color: '#e8f0ff' });
      });

      drawBofBox(ctx, 8, 196, 304, 36);
      drawText(ctx, this.noticeTimer > 0 ? this.notice : 'Z/Enter: Buy Item   X/Esc: Leave Mart', SCREEN_W / 2, 210, {
        align: 'center',
        size: 8,
        color: this.noticeTimer > 0 ? '#78f088' : '#d8e8ff',
      });
      return;
    }

    // PC / Camp Box view
    drawBofBox(ctx, 8, 8, 304, 28);
    drawText(ctx, 'POKETAVERN ROSTER TERMINAL', 18, 17, { size: 9, bold: true, color: '#ffd858' });
    drawText(ctx, '◄ ► Switch   Z: Move   X: Exit', 302, 18, { align: 'right', size: 6, color: '#a8d8ff' });

    // Left: Active Party
    drawBofBox(ctx, 8, 40, 148, 152, { accent: this.column === 'party' ? '#ffd858' : '#4a68a8' });
    drawText(ctx, `ACTIVE PARTY (${state.party.length}/4)`, 16, 48, {
      size: 7,
      bold: true,
      color: '#ffd858',
    });
    state.party.forEach((mon, idx) => {
      const y = 66 + idx * 28;
      if (this.column === 'party' && idx === this.cursor) drawCursorArrow(ctx, 14, y + 6, tick);
      drawPokemonSprite(ctx, SPECIES[mon.speciesId].spriteKey, 34, y + 22, 0.65, tick, false);
      drawText(ctx, `${getDisplayName(mon)} L${mon.level}`, 48, y + 2, { size: 7, color: '#fff' });
      drawText(ctx, SPECIES[mon.speciesId].fieldAbilityName, 48, y + 13, { size: 6, color: '#88f0d0' });
    });

    // Right: Camp Box Storage
    drawBofBox(ctx, 162, 40, 150, 152, { accent: this.column === 'storage' ? '#ffd858' : '#4a68a8' });
    drawText(ctx, `CAMP BOX (${state.storage.length})`, 170, 48, {
      size: 7,
      bold: true,
      color: '#88e0ff',
    });
    if (state.storage.length === 0) {
      drawText(ctx, 'No boxed Pokémon yet.', 172, 86, { size: 7, color: '#8898b8' });
    } else {
      const start = Math.max(0, this.cursor - 3);
      state.storage.slice(start, start + 4).forEach((mon, row) => {
        const realIdx = start + row;
        const y = 66 + row * 28;
        if (this.column === 'storage' && realIdx === this.cursor) drawCursorArrow(ctx, 168, y + 6, tick);
        drawPokemonSprite(ctx, SPECIES[mon.speciesId].spriteKey, 188, y + 22, 0.65, tick, false);
        drawText(ctx, `${getDisplayName(mon)} L${mon.level}`, 202, y + 2, { size: 7, color: '#fff' });
        drawText(ctx, SPECIES[mon.speciesId].fieldAbilityName, 202, y + 13, { size: 6, color: '#88f0d0' });
      });
    }

    drawBofBox(ctx, 8, 196, 304, 36);
    drawText(ctx, this.noticeTimer > 0 ? this.notice : 'Deposit or withdraw caught Pokémon to build your 4-mon team!', SCREEN_W / 2, 210, {
      align: 'center',
      size: 7,
      color: this.noticeTimer > 0 ? '#78f088' : '#d8e8ff',
    });
  }
}
