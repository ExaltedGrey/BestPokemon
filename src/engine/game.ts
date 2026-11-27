import { SnesAudioEngine } from '@engine/audio/synth';
import { SCREEN_H, SCREEN_W } from '@engine/gfx/ui';
import { InputManager } from '@engine/input';
import {
  autoSaveGame,
  exportSaveFilename,
  importSaveFromJson,
  saveGameToSlot,
  serializeSave,
} from '@engine/save';
import type { GameController, Scene } from '@engine/sceneManager';
import { BattleScene } from '@engine/scenes/battleScene';
import { FishingScene } from '@engine/scenes/fishingScene';
import { MenuScene } from '@engine/scenes/menuScene';
import { OverworldScene } from '@engine/scenes/overworldScene';
import { ShopScene } from '@engine/scenes/shopScene';
import { TitleScene } from '@engine/scenes/titleScene';
import { createInitialGameState } from '@engine/state';
import type { BattleConfig, GameState } from '@engine/types';

export class GameApp implements GameController {
  state: GameState | null = null;
  input: InputManager;
  audio: SnesAudioEngine;
  tick = 0;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentScene: Scene | null = null;
  private lastTime = 0;
  private rafId = 0;
  private onUiSync?: (crt: boolean, muted: boolean, hasActiveState: boolean) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onUiSync?: (crt: boolean, muted: boolean, hasActiveState: boolean) => void,
  ) {
    this.canvas = canvas;
    this.canvas.width = SCREEN_W;
    this.canvas.height = SCREEN_H;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D Canvas context unavailable');
    context.imageSmoothingEnabled = false;
    this.ctx = context;
    this.onUiSync = onUiSync;

    this.audio = new SnesAudioEngine();
    this.input = new InputManager(() => {
      this.audio.unlock();
    });
  }

  start(): void {
    this.openTitle();
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.tick += 1;

      this.currentScene?.update(dt);
      this.currentScene?.render(this.ctx);
      this.input.endFrame();

      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.audio.stopMusic();
  }

  setScene(scene: Scene): void {
    this.currentScene?.exit?.();
    this.currentScene = scene;
    this.currentScene.enter?.();
  }

  openTitle(): void {
    this.setScene(new TitleScene(this));
    this.onUiSync?.(this.state?.settings.crt ?? true, this.audio.isMuted(), Boolean(this.state));
  }

  startNewGame(starterId: string): void {
    this.state = createInitialGameState(starterId, 'Kael');
    autoSaveGame(this.state);
    this.applyCrtSetting(this.state.settings.crt);
    this.applyMuteSetting(this.state.settings.muted);
    this.enterOverworld();
  }

  loadGameState(state: GameState): void {
    this.state = state;
    this.applyCrtSetting(state.settings.crt);
    this.applyMuteSetting(state.settings.muted);
    this.enterOverworld();
  }

  enterOverworld(postDialogueId?: string): void {
    this.setScene(new OverworldScene(this, postDialogueId));
    this.onUiSync?.(this.state?.settings.crt ?? true, this.audio.isMuted(), Boolean(this.state));
  }

  startBattle(config: BattleConfig): void {
    this.setScene(new BattleScene(this, config));
  }

  openFishing(): void {
    this.setScene(new FishingScene(this));
  }

  openPauseMenu(): void {
    this.setScene(new MenuScene(this));
  }

  openShop(mode: 'mart' | 'pc_box'): void {
    this.setScene(new ShopScene(this, mode));
  }

  quickSave(): boolean {
    if (!this.state) return false;
    const okAuto = autoSaveGame(this.state);
    const okSlot = saveGameToSlot(1, this.state);
    if (okAuto || okSlot) {
      this.audio.playSfx('orbCatch');
      return true;
    }
    return false;
  }

  exportCurrentSave(): { filename: string; json: string } | null {
    if (!this.state) return null;
    autoSaveGame(this.state);
    return {
      filename: exportSaveFilename(this.state),
      json: serializeSave(this.state),
    };
  }

  importSaveFile(rawJson: string): boolean {
    const loaded = importSaveFromJson(rawJson);
    if (!loaded) return false;
    autoSaveGame(loaded);
    saveGameToSlot(1, loaded);
    this.audio.playSfx('orbCatch');
    this.loadGameState(loaded);
    return true;
  }

  applyCrtSetting(enabled: boolean): void {
    if (this.state) this.state.settings.crt = enabled;
    this.onUiSync?.(enabled, this.audio.isMuted(), Boolean(this.state));
  }

  applyMuteSetting(muted: boolean): void {
    this.audio.setMuted(muted);
    if (this.state) this.state.settings.muted = muted;
    this.onUiSync?.(this.state?.settings.crt ?? true, muted, Boolean(this.state));
  }
}
