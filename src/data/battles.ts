import type { BattleConfig } from '@engine/types';

export const SCRIPTED_BATTLES: Record<string, BattleConfig> = {
  poacher_battle: {
    id: 'poacher_battle',
    title: 'Syndicate Poacher',
    isTrainer: true,
    isBoss: false,
    canRun: false,
    canCatch: false,
    bg: 'meadow',
    music: 'battle',
    enemies: [
      { speciesId: 'zubat', level: 5 },
      { speciesId: 'houndour', level: 5 },
    ],
    onVictoryFlag: 'poacher_defeated',
    onVictoryDialogue: 'poacher_after_defeat',
  },
  shrine_sentinel_battle: {
    id: 'shrine_sentinel_battle',
    title: 'Obsidian Shrine Sentinel',
    isTrainer: true,
    isBoss: false,
    canRun: false,
    canCatch: false,
    bg: 'shrine',
    music: 'battle',
    enemies: [
      { speciesId: 'houndour', level: 7 },
      { speciesId: 'gastly', level: 7 },
      { speciesId: 'zubat', level: 6 },
    ],
    onVictoryFlag: 'shrine_sentinel_defeated',
    onVictoryDialogue: 'shrine_sentinel_after',
  },
  boss_admin_vex: {
    id: 'boss_admin_vex',
    title: 'Admin Vex & Shadow Gyarados',
    isTrainer: true,
    isBoss: true,
    canRun: false,
    canCatch: false,
    bg: 'shrine',
    music: 'boss',
    enemies: [
      { speciesId: 'shadow_gyarados', level: 9, nickname: 'Shadow Gyarados', isBoss: true },
      { speciesId: 'syndicate_houndoom', level: 8, nickname: 'Shadow Houndoom', isBoss: true },
    ],
    onVictoryFlag: 'chapter1_cleared',
    onVictoryDialogue: 'vex_defeat_finale',
    midBattleDialogue: {
      hpPercentThreshold: 0.55,
      lines: [
        {
          speaker: 'Admin Vex',
          text: 'Impossible! That Dragon Resonance aura... Project Kaiser was supposed to be a myth!',
        },
        {
          speaker: 'Admin Vex',
          text: 'Shadow Gyarados—MAXIMUM OVERDRIVE! Drown this traitor in dark tides!',
        },
      ],
    },
  },
};
