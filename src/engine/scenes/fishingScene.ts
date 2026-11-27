import { ITEMS } from '@data/items';
import { SPECIES } from '@data/species';
import { drawCharacter } from '@engine/gfx/sprites';
import { drawBar, drawBofBox, drawText, SCREEN_H, SCREEN_W } from '@engine/gfx/ui';
import type { GameController, Scene } from '@engine/sceneManager';
import { addItem, getItemQty, removeItem } from '@engine/state';

type FishPhase = 'aim' | 'waiting' | 'bite' | 'reeling' | 'result';

interface CatchOutcome {
  kind: 'pokemon' | 'item';
  id: string;
  level?: number;
  qty?: number;
  label: string;
}

export class FishingScene implements Scene {
  private game: GameController;
  private phase: FishPhase = 'aim';
  private power = 0.5;
  private powerDir = 1;
  private bobberX = 160;
  private bobberY = 140;
  private waitTimer = 0;
  private biteWindow = 0;
  private reelProgress = 0.35;
  private resultText = '';
  private hookedOutcome: CatchOutcome | null = null;

  constructor(game: GameController) {
    this.game = game;
  }

  enter(): void {
    this.phase = 'aim';
    this.power = 0.25;
    this.powerDir = 1;
    this.resultText = '';
  }

  private rollOutcome(): CatchOutcome {
    const r = Math.random();
    if (r < 0.34) return { kind: 'pokemon', id: 'poliwag', level: 4 + Math.floor(Math.random() * 3), label: 'Wild Poliwag' };
    if (r < 0.6) return { kind: 'pokemon', id: 'magikarp', level: 4 + Math.floor(Math.random() * 3), label: 'Wild Magikarp' };
    if (r < 0.78) return { kind: 'pokemon', id: 'staryu', level: 5 + Math.floor(Math.random() * 2), label: 'Wild Staryu' };
    if (r < 0.9) return { kind: 'pokemon', id: 'dratini', level: 6, label: 'Rare River Dratini!' };
    return { kind: 'item', id: 'great_orb', qty: 1, label: 'Sunken Great Orb' };
  }

  update(dt: number): void {
    const inp = this.game.input;
    const state = this.game.state;
    if (!state) return;

    if (inp.consume('cancel') && (this.phase === 'aim' || this.phase === 'waiting')) {
      this.game.audio.playSfx('cancel');
      this.game.enterOverworld();
      return;
    }

    if (this.phase === 'aim') {
      this.power += this.powerDir * dt * 1.4;
      if (this.power >= 1) {
        this.power = 1;
        this.powerDir = -1;
      } else if (this.power <= 0.1) {
        this.power = 0.1;
        this.powerDir = 1;
      }

      if (inp.consume('confirm')) {
        if (getItemQty(state, 'wooden_lure') > 0) {
          removeItem(state, 'wooden_lure', 1);
        }
        this.bobberX = 115 + Math.round(this.power * 145);
        this.bobberY = 128 + Math.round((1 - this.power) * 30);
        this.waitTimer = 1.4 + Math.random() * 2.1;
        this.phase = 'waiting';
        this.game.audio.playSfx('splash');
      }
      return;
    }

    if (this.phase === 'waiting') {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        this.phase = 'bite';
        this.biteWindow = 1.35;
        this.hookedOutcome = this.rollOutcome();
        this.game.audio.playSfx('superEffective');
      }
      return;
    }

    if (this.phase === 'bite') {
      this.biteWindow -= dt;
      if (inp.consume('confirm')) {
        this.phase = 'reeling';
        this.reelProgress = 0.42;
        this.game.audio.playSfx('confirm');
        return;
      }
      if (this.biteWindow <= 0) {
        this.phase = 'result';
        this.resultText = 'Too slow! The nibble slipped away...';
        this.hookedOutcome = null;
        this.game.audio.playSfx('cancel');
      }
      return;
    }

    if (this.phase === 'reeling') {
      this.reelProgress -= dt * 0.28;
      if (inp.consume('confirm') || inp.consume('skill')) {
        this.reelProgress += 0.13;
        this.game.audio.playSfx('cursor');
      }
      if (this.reelProgress >= 1) {
        const out = this.hookedOutcome!;
        if (out.kind === 'item') {
          addItem(state, out.id, out.qty ?? 1);
          this.resultText = `Reeled up a treasure: ${ITEMS[out.id].name}!`;
          this.phase = 'result';
          this.game.audio.playSfx('orbCatch');
        } else {
          this.game.audio.playSfx('orbCatch');
          this.game.startBattle({
            id: `fish_${out.id}`,
            title: `Hooked ${SPECIES[out.id].name}!`,
            isTrainer: false,
            isBoss: false,
            canRun: true,
            canCatch: true,
            bg: 'meadow',
            music: 'battle',
            enemies: [{ speciesId: out.id, level: out.level ?? 5 }],
          });
        }
        return;
      }
      if (this.reelProgress <= 0) {
        this.phase = 'result';
        this.resultText = 'The line snapped! Try reeling faster next time.';
        this.hookedOutcome = null;
        this.game.audio.playSfx('cancel');
      }
      return;
    }

    if (this.phase === 'result') {
      if (inp.consume('confirm')) {
        this.phase = 'aim';
        this.game.audio.playSfx('cursor');
      } else if (inp.consume('cancel')) {
        this.game.enterOverworld();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const tick = this.game.tick;
    const state = this.game.state;
    const lures = state ? getItemQty(state, 'wooden_lure') : 0;

    // Sky & riverside backdrop
    const sky = ctx.createLinearGradient(0, 0, 0, 96);
    sky.addColorStop(0, '#3878d0');
    sky.addColorStop(1, '#90d8ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, SCREEN_W, 96);

    // Distant treeline
    ctx.fillStyle = '#286838';
    for (let x = 0; x < SCREEN_W; x += 22) {
      ctx.fillRect(x, 70 + ((x * 7) % 10), 24, 28);
    }

    // Animated river water
    ctx.fillStyle = '#205cb8';
    ctx.fillRect(0, 96, SCREEN_W, SCREEN_H - 96);
    ctx.fillStyle = '#4890e8';
    const shimmer = Math.floor(tick * 0.15) % 24;
    for (let y = 104; y < 200; y += 14) {
      for (let x = (y % 28) + shimmer; x < SCREEN_W; x += 48) {
        ctx.fillRect(x, y, 16, 2);
      }
    }

    // Wooden Willow Pier on left
    ctx.fillStyle = '#683c1c';
    ctx.fillRect(0, 128, 76, 36);
    ctx.fillStyle = '#9c6230';
    ctx.fillRect(0, 124, 74, 28);
    ctx.fillStyle = '#b87c42';
    ctx.fillRect(0, 126, 74, 4);

    // Kael fishing on pier
    drawCharacter(ctx, 'player', 52, 114, 'right', tick, false);

    // Fishing rod
    ctx.strokeStyle = '#e0b868';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(66, 122);
    ctx.lineTo(94, 96);
    ctx.stroke();

    // Line & bobber when cast
    if (this.phase !== 'aim') {
      const plunge = this.phase === 'bite' ? 5 : Math.sin(tick * 0.2) * 1.5;
      const bx = this.phase === 'reeling' ? 115 + (1 - this.reelProgress) * (this.bobberX - 115) : this.bobberX;
      const by = this.bobberY + plunge;

      ctx.strokeStyle = '#e8f4ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(94, 96);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Water ripple rings
      const rip = Math.floor(tick * 0.25) % 10;
      ctx.strokeStyle = this.phase === 'bite' ? '#ffe860' : '#90e0ff';
      ctx.strokeRect(bx - 6 - rip * 0.5, by - 2, 12 + rip, 5);

      // Red/white bobber
      ctx.fillStyle = '#e83838';
      ctx.fillRect(bx - 3, by - 4, 6, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - 3, by, 6, 3);

      if (this.phase === 'bite') {
        drawText(ctx, '!! BITE — PRESS Z !!', bx, by - 24, {
          align: 'center',
          size: 10,
          bold: true,
          color: '#ffe850',
        });
      }
    }

    // Header bar
    drawBofBox(ctx, 8, 8, 304, 26);
    drawText(ctx, 'WILLOW PIER FISHING', 18, 17, { size: 9, bold: true, color: '#ffd858' });
    drawText(ctx, `River Lures: ${lures} (Free cast ok)`, 164, 17, { size: 8, color: '#b8e8ff' });

    // Bottom prompt & gauge
    drawBofBox(ctx, 10, 184, 300, 48);
    if (this.phase === 'aim') {
      drawText(ctx, 'CAST POWER — Press Z/Enter to Cast! (X to Leave)', 20, 192, { size: 8, color: '#fff' });
      drawBar(ctx, 20, 208, 280, 12, this.power, '#58d8ff');
    } else if (this.phase === 'waiting') {
      drawText(ctx, 'Watching the bobber... Wait for a splash!', 20, 198, { size: 8, color: '#b8e8ff' });
      drawText(ctx, '(Press X to pull line back)', 20, 212, { size: 7, color: '#90a8d8' });
    } else if (this.phase === 'bite') {
      drawText(ctx, 'A POKEMON TOOK THE BAIT! Press Z / Enter NOW!', 20, 202, {
        size: 9,
        bold: true,
        color: '#ffe850',
      });
    } else if (this.phase === 'reeling') {
      drawText(ctx, 'MASH Z / ENTER TO REEL IT IN!', 20, 192, { size: 8, bold: true, color: '#ffd858' });
      drawBar(ctx, 20, 208, 280, 12, this.reelProgress, '#62e068');
    } else {
      drawText(ctx, this.resultText, 20, 196, { size: 8, color: '#fff' });
      drawText(ctx, 'Z/Enter: Cast Again   X/Esc: Return to Pier', 20, 212, { size: 7, color: '#ffd858' });
    }
  }
}
