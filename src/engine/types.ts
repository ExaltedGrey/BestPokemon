export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Dragon'
  | 'Ground'
  | 'Flying'
  | 'Ghost'
  | 'Dark'
  | 'Poison'
  | 'Shadow';

export type FieldAbilityId = 'ember' | 'cut' | 'dig' | 'surge' | 'scout';

export type StatusCondition = 'none' | 'burn' | 'paralyze' | 'poison' | 'sleep' | 'curse';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export type MoveTarget = 'single_enemy' | 'all_enemies' | 'self' | 'single_ally' | 'all_allies';

export type MoveCategory = 'physical' | 'special' | 'status' | 'heal';

export interface MoveDef {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  apCost: number;
  target: MoveTarget;
  statusEffect?: StatusCondition;
  statusChance?: number;
  healPercent?: number;
  buffStat?: 'atk' | 'def' | 'spd';
  description: string;
  animStyle: 'slash' | 'fire' | 'water' | 'leaf' | 'bolt' | 'dragon' | 'rock' | 'shadow' | 'heal' | 'wind';
}

export interface ResonanceFormDef {
  id: string;
  name: string;
  subtitle: string;
  type: PokemonType;
  apCost: number;
  resonanceCost: number;
  atkMult: number;
  defMult: number;
  spdMult: number;
  signatureMoveId: string;
  auraColor: string;
  spriteKey: string;
  description: string;
}

export interface SpeciesDef {
  id: string;
  dexNumber: number;
  name: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  baseAp: number;
  catchRate: number; // 0 = uncatchable boss, 1..255
  expYield: number;
  goldYield: number;
  fieldAbility: FieldAbilityId;
  fieldAbilityName: string;
  canResonate?: boolean;
  evolvesTo?: { speciesId: string; level: number };
  learnset: Array<{ level: number; moveId: string }>;
  lore: string;
  spriteKey: string;
  isBoss?: boolean;
}

export interface PokemonInstance {
  uid: string;
  speciesId: string;
  nickname?: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  maxHp: number;
  hp: number;
  maxAp: number;
  ap: number;
  atk: number;
  def: number;
  spd: number;
  moves: string[];
  status: StatusCondition;
  isPartner?: boolean;
  activeResonanceId?: string | null;
}

export type ItemCategory = 'heal' | 'ap' | 'status' | 'revive' | 'orb' | 'lure' | 'key';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  power: number; // HP/AP restored, or orb catch multiplier (x10 -> 1.0 = 10)
  nightBonus?: number;
  description: string;
  usableInBattle: boolean;
  usableInOverworld: boolean;
}

export interface InventoryEntry {
  itemId: string;
  qty: number;
}

export type TileType =
  | 'grass'
  | 'tall_grass'
  | 'path'
  | 'water'
  | 'tree'
  | 'wall'
  | 'floor_wood'
  | 'floor_stone'
  | 'carpet'
  | 'bridge'
  | 'pier'
  | 'shrine_floor'
  | 'shrine_wall'
  | 'brazier_off'
  | 'brazier_on'
  | 'vines'
  | 'boulder'
  | 'rune_off'
  | 'rune_on'
  | 'door'
  | 'flowers'
  | 'lamp'
  | 'campfire'
  | 'statue'
  | 'bed'
  | 'counter'
  | 'sand'
  | 'cliff'
  | 'sealed_gate'
  | 'open_gate'
  | 'roof_red'
  | 'roof_blue'
  | 'roof_green'
  | 'roof_slate'
  | 'facade_timber'
  | 'facade_stone'
  | 'window_lit'
  | 'cobble'
  | 'fence'
  | 'fountain'
  | 'sign_post'
  | 'plaque'
  | 'banner'
  | 'crate'
  | 'bookshelf'
  | 'table'
  | 'hearth'
  | 'rug_blue'
  | 'scroll_wall'
  | 'desk';

export interface WarpDef {
  x: number;
  y: number;
  targetMap: string;
  targetX: number;
  targetY: number;
  facing?: Direction;
  requiredFlag?: string;
  lockedText?: string;
}

export interface EncounterEntry {
  speciesId: string;
  minLevel: number;
  maxLevel: number;
  weight: number;
}

export interface MapEntityDef {
  id: string;
  name: string;
  x: number;
  y: number;
  spriteKey: string;
  facing: Direction;
  dialogueId?: string;
  shopId?: 'mart' | 'tavern';
  chestItem?: { itemId: string; qty: number; flag: string };
  flagRequired?: string;
  flagHiddenWhen?: string;
  interactAction?: 'fish' | 'campfire' | 'statue' | 'heal_inn' | 'pc_box' | 'boss_vex' | 'rescue_ally';
  inspectLabel?: string;
  turnOnTalk?: boolean;
  patrol?: Array<{ x: number; y: number }>;
}

export interface FieldObstacleDef {
  id: string;
  x: number;
  y: number;
  kind: 'brazier' | 'vines' | 'boulder' | 'rune' | 'buried_chest';
  requiredAbility: FieldAbilityId;
  flag: string;
  rewardItem?: { itemId: string; qty: number };
  message: string;
}

export interface MapDef {
  id: string;
  chapter: number;
  name: string;
  subtitle: string;
  music: 'town' | 'overworld' | 'shrine' | 'garrison';
  indoor: boolean;
  battleBg: 'meadow' | 'forest' | 'shrine' | 'garrison';
  width: number;
  height: number;
  /** ASCII legend row strings converted to TileType at runtime */
  layout: string[];
  warps: WarpDef[];
  entities: MapEntityDef[];
  obstacles: FieldObstacleDef[];
  dayEncounters: EncounterEntry[];
  nightEncounters: EncounterEntry[];
  encounterRate: number; // 0..1 chance per tall_grass / shrine step
}

export interface DialogueChoice {
  label: string;
  nextId?: string;
  alignmentDelta?: number; // negative = Syndicate loyalist, positive = Rebel heart
  setFlag?: string;
  giveItem?: { itemId: string; qty: number };
  giveGold?: number;
  healParty?: boolean;
  unlockLoreId?: string;
  startBattle?: string;
  openShop?: 'mart' | 'tavern';
  recruitSpecies?: { speciesId: string; level: number };
}

export interface DialogueNode {
  id: string;
  speaker: string;
  portrait?: string;
  lines: string[];
  choices?: DialogueChoice[];
  nextId?: string;
  setFlag?: string;
  giveItem?: { itemId: string; qty: number };
  giveGold?: number;
  healParty?: boolean;
  unlockResonance?: string;
  unlockLoreId?: string;
  startBattle?: string;
  openShop?: 'mart' | 'tavern';
  recruitSpecies?: { speciesId: string; level: number };
}

export interface QuestDef {
  id: string;
  chapter: number;
  title: string;
  description: string;
  startFlag?: string;
  completeFlag: string;
}

export interface GameState {
  version: number;
  chapter: number;
  playerName: string;
  starterId: string;
  mapId: string;
  x: number;
  y: number;
  facing: Direction;
  trail: Array<{ x: number; y: number; facing: Direction }>;
  party: PokemonInstance[];
  storage: PokemonInstance[];
  inventory: InventoryEntry[];
  gold: number;
  timeMinutes: number; // 0..1439 (360=dawn, 540=day, 1080=dusk, 1260=night)
  stepCount: number;
  alignment: number; // < 0 Syndicate Loyalist, > 0 Rebel Heart
  resonanceGauge: number; // 0..100
  unlockedResonances: string[];
  unlockedLore: string[];
  seenSpecies: string[];
  caughtSpecies: string[];
  flags: Record<string, boolean>;
  playtimeSeconds: number;
  settings: {
    crt: boolean;
    muted: boolean;
    battleSpeed: 1 | 2;
  };
}

export interface SaveSlotSummary {
  slot: number;
  empty: boolean;
  playerName?: string;
  mapName?: string;
  leadName?: string;
  leadLevel?: number;
  playtimeSeconds?: number;
  chapter?: number;
  savedAt?: string;
}

export interface BattleEnemySpec {
  speciesId: string;
  level: number;
  nickname?: string;
  isBoss?: boolean;
}

export interface BattleConfig {
  id: string;
  title?: string;
  isTrainer: boolean;
  isBoss: boolean;
  canRun: boolean;
  canCatch: boolean;
  bg: 'meadow' | 'forest' | 'shrine' | 'garrison';
  music: 'battle' | 'boss';
  enemies: BattleEnemySpec[];
  onVictoryFlag?: string;
  onVictoryDialogue?: string;
  midBattleDialogue?: { hpPercentThreshold: number; lines: Array<{ speaker: string; text: string }> };
}
