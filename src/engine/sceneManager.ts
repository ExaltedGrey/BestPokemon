import type { SnesAudioEngine } from '@engine/audio/synth';
import type { InputManager } from '@engine/input';
import type { BattleConfig, GameState } from '@engine/types';

export interface Scene {
  enter?(): void;
  exit?(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export interface GameController {
  state: GameState | null;
  input: InputManager;
  audio: SnesAudioEngine;
  tick: number;
  setScene(scene: Scene): void;
  openTitle(): void;
  startNewGame(starterId: string): void;
  loadGameState(state: GameState): void;
  enterOverworld(postDialogueId?: string): void;
  startBattle(config: BattleConfig): void;
  openFishing(): void;
  openPauseMenu(): void;
  openShop(mode: 'mart' | 'pc_box'): void;
  applyCrtSetting(enabled: boolean): void;
  applyMuteSetting(muted: boolean): void;
}
