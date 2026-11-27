import { SPECIES, STARTER_IDS } from '@data/species';
import { TYPE_COLORS } from '@data/typeChart';
import { drawPokemonSprite } from '@engine/gfx/sprites';
import { drawBofBox, drawCursorArrow, drawText, SCREEN_H, SCREEN_W } from '@engine/gfx/ui';
import { listAllSaveSlots, loadGameFromSlot } from '@engine/save';
import type { GameController, Scene } from '@engine/sceneManager';
import type { SaveSlotSummary } from '@engine/types';

type TitleMode = 'main' | 'load' | 'starter' | 'prologue';

export class TitleScene implements Scene {
  private game: GameController;
  private mode: TitleMode = 'main';
  private cursor = 0;
  private starterCursor = 0;
  private loadCursor = 0;
  private slots: SaveSlotSummary[] = [];
  private prologueIdx = 0;
  private stars: Array<{ x: number; y: number; phase: number }> = [];

  private readonly prologueSlides = [
    [
      'Long ago, the Four Dragon Guardians kept',
      'balance across the Pokémon realms of Draconia.',
      '',
      'Then rose the OBSIDIAN SYNDICATE—forging',
      'Shadow Collars to enslave ancient legends.',
    ],
    [
      'You are KAEL, Syndicate Initiate #07,',
      'assigned to occupy frontier Embervale Town.',
      '',
      'Hidden in your pack lies an Ancient Dragon',
      'Scale—stirring awake beside your partner...',
    ],
  ];

  constructor(game: GameController) {
    this.game = game;
    for (let i = 0; i < 42; i++) {
      this.stars.push({
        x: (i * 73 + 17) % SCREEN_W,
        y: (i * 41 + 9) % 130,
        phase: i * 0.7,
      });
    }
  }

  enter(): void {
    this.slots = listAllSaveSlots();
    this.game.audio.playMusic('title');
  }

  update(_dt: number): void {
    const inp = this.game.input;

    if (this.mode === 'main') {
      if (inp.consume('up') || inp.consume('down')) {
        this.cursor = this.cursor === 0 ? 1 : 0;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('confirm')) {
        this.game.audio.playSfx('confirm');
        if (this.cursor === 0) {
          this.mode = 'starter';
          this.starterCursor = 0;
        } else {
          this.slots = listAllSaveSlots();
          this.mode = 'load';
          this.loadCursor = 0;
        }
      }
      return;
    }

    if (this.mode === 'load') {
      const len = this.slots.length;
      if (inp.consume('up')) {
        this.loadCursor = (this.loadCursor + len - 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('down')) {
        this.loadCursor = (this.loadCursor + 1) % len;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('cancel')) {
        this.game.audio.playSfx('cancel');
        this.mode = 'main';
      }
      if (inp.consume('confirm')) {
        const slot = this.slots[this.loadCursor];
        if (slot && !slot.empty) {
          const loaded = loadGameFromSlot(slot.slot);
          if (loaded) {
            this.game.audio.playSfx('confirm');
            this.game.loadGameState(loaded);
          }
        } else {
          this.game.audio.playSfx('cancel');
        }
      }
      return;
    }

    if (this.mode === 'starter') {
      if (inp.consume('left')) {
        this.starterCursor = (this.starterCursor + STARTER_IDS.length - 1) % STARTER_IDS.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('right')) {
        this.starterCursor = (this.starterCursor + 1) % STARTER_IDS.length;
        this.game.audio.playSfx('cursor');
      }
      if (inp.consume('cancel')) {
        this.game.audio.playSfx('cancel');
        this.mode = 'main';
      }
      if (inp.consume('confirm')) {
        this.game.audio.playSfx('resonance');
        this.mode = 'prologue';
        this.prologueIdx = 0;
      }
      return;
    }

    if (this.mode === 'prologue') {
      if (inp.consume('confirm') || inp.consume('cancel')) {
        this.game.audio.playSfx('confirm');
        if (this.prologueIdx < this.prologueSlides.length - 1) {
          this.prologueIdx++;
        } else {
          const starterId = STARTER_IDS[this.starterCursor];
          this.game.startNewGame(starterId);
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const tick = this.game.tick;

    // Twilight SNES gradient sky
    const sky = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    sky.addColorStop(0, '#0a1230');
    sky.addColorStop(0.55, '#1b2c66');
    sky.addColorStop(1, '#101424');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Twinkling stars
    for (const s of this.stars) {
      const bright = Math.sin(tick * 0.08 + s.phase) > 0.2;
      ctx.fillStyle = bright ? '#fff6c8' : '#6c84c8';
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Distant mountain silhouette
    ctx.fillStyle = '#141e3c';
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(50, 128);
    ctx.lineTo(110, 160);
    ctx.lineTo(175, 112);
    ctx.lineTo(245, 152);
    ctx.lineTo(320, 122);
    ctx.lineTo(320, 240);
    ctx.lineTo(0, 240);
    ctx.closePath();
    ctx.fill();

    if (this.mode === 'main') {
      // Majestic animated Dragon Resonance crest sprite
      drawPokemonSprite(ctx, 'res_whelp', 160, 108, 1.9, tick, false);

      // Golden SNES logo banner
      drawText(ctx, 'POKEMON:', SCREEN_W / 2, 18, {
        align: 'center',
        size: 12,
        bold: true,
        color: '#88e0ff',
      });
      drawText(ctx, 'BREATH OF THE DRAGON', SCREEN_W / 2, 34, {
        align: 'center',
        size: 16,
        bold: true,
        color: '#ffd858',
      });
      drawText(ctx, 'Chronicles of the Obsidian Syndicate', SCREEN_W / 2, 54, {
        align: 'center',
        size: 8,
        color: '#d4e2ff',
      });

      drawBofBox(ctx, 92, 134, 136, 62);
      const hasSave = this.slots.some((s) => !s.empty);
      drawText(ctx, 'NEW ADVENTURE', 120, 148, { size: 9, bold: true, color: '#fff' });
      drawText(ctx, hasSave ? 'CONTINUE SAVE' : 'CONTINUE (EMPTY)', 120, 168, {
        size: 9,
        bold: true,
        color: hasSave ? '#fff' : '#8094bd',
      });
      drawCursorArrow(ctx, 106, this.cursor === 0 ? 148 : 168, tick);

      drawText(ctx, 'Press Z / Enter to Begin • 16-Bit Fan RPG', SCREEN_W / 2, 214, {
        align: 'center',
        size: 8,
        color: '#a8bce6',
      });
      return;
    }

    if (this.mode === 'load') {
      drawBofBox(ctx, 20, 16, 280, 206);
      drawText(ctx, 'SELECT SAVE SLOT', SCREEN_W / 2, 24, {
        align: 'center',
        size: 10,
        bold: true,
        color: '#ffd858',
      });

      this.slots.forEach((slot, idx) => {
        const y = 44 + idx * 38;
        const label = slot.slot === 0 ? 'AUTO-SAVE' : `SLOT ${slot.slot}`;
        drawBofBox(ctx, 34, y, 252, 33, {
          accent: idx === this.loadCursor ? '#ffd858' : '#5072b8',
        });
        if (idx === this.loadCursor) {
          drawCursorArrow(ctx, 24, y + 12, tick);
        }
        if (slot.empty) {
          drawText(ctx, `${label} — [ Empty ]`, 46, y + 12, { color: '#8ca0c8', size: 8 });
        } else {
          drawText(ctx, `${label}: ${slot.playerName} • Ch.${slot.chapter}`, 46, y + 6, {
            color: slot.slot === 0 ? '#78e8ff' : '#ffd858',
            bold: true,
            size: 7,
          });
          drawText(ctx, `${slot.mapName} • Lead: ${slot.leadName} Lv.${slot.leadLevel}`, 46, y + 18, {
            color: '#e8f0ff',
            size: 7,
          });
        }
      });

      drawText(ctx, 'Z/Enter: Load   X: Back   (Or Import .json above!)', SCREEN_W / 2, 204, {
        align: 'center',
        size: 7,
        color: '#b8caf0',
      });
      return;
    }

    if (this.mode === 'starter') {
      drawBofBox(ctx, 12, 12, 296, 216);
      drawText(ctx, 'CHOOSE YOUR DRAGON-BONDED PARTNER', SCREEN_W / 2, 22, {
        align: 'center',
        size: 9,
        bold: true,
        color: '#ffd858',
      });

      STARTER_IDS.forEach((id, idx) => {
        const sp = SPECIES[id];
        const cardX = 22 + idx * 94;
        const selected = idx === this.starterCursor;
        drawBofBox(ctx, cardX, 42, 88, 108, {
          accent: selected ? '#ffd858' : '#4a68a8',
          bgTop: selected ? '#2f52a8' : '#1b2f68',
        });
        drawPokemonSprite(ctx, sp.spriteKey, cardX + 44, 104, selected ? 1.55 : 1.3, tick, false);
        drawText(ctx, sp.name.toUpperCase(), cardX + 44, 114, {
          align: 'center',
          size: 8,
          bold: true,
          color: selected ? '#ffd858' : '#e0e8ff',
        });
        drawText(ctx, sp.types.join('/'), cardX + 44, 126, {
          align: 'center',
          size: 7,
          color: TYPE_COLORS[sp.types[0]],
        });
        drawText(ctx, sp.fieldAbilityName, cardX + 44, 137, {
          align: 'center',
          size: 7,
          color: '#a8f0d8',
        });
      });

      const chosen = SPECIES[STARTER_IDS[this.starterCursor]];
      drawBofBox(ctx, 22, 158, 276, 56);
      drawText(ctx, `${chosen.name} — Field Skill: ${chosen.fieldAbilityName}`, 32, 166, {
        size: 8,
        bold: true,
        color: '#88e8ff',
      });
      drawText(ctx, chosen.lore, 32, 180, { size: 7, color: '#eef4ff' });
      drawText(ctx, '◄ ► Select   Z/Enter: Confirm   X: Back', SCREEN_W / 2, 198, {
        align: 'center',
        size: 7,
        color: '#ffd858',
      });
      return;
    }

    // Prologue
    drawBofBox(ctx, 18, 44, 284, 146);
    drawText(ctx, 'PROLOGUE — CHAPTER 1', SCREEN_W / 2, 56, {
      align: 'center',
      size: 9,
      bold: true,
      color: '#ffd858',
    });
    const slide = this.prologueSlides[this.prologueIdx];
    slide.forEach((line, i) => {
      drawText(ctx, line, 32, 82 + i * 16, { size: 8, color: '#eef4ff' });
    });
    drawText(ctx, 'Press Z / Enter to continue ▼', SCREEN_W / 2, 172, {
      align: 'center',
      size: 8,
      color: '#88e0ff',
    });
  }
}
