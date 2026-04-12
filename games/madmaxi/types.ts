export type RGB = [number, number, number];

export type MadmaxiEnemyKind =
  | 'runner'
  | 'charger'
  | 'hopper'
  | 'flyer'
  | 'zigzag'
  | 'orbiter'
  | 'sniper'
  | 'burrower'
  | 'spiker'
  | 'shadow';

export type MadmaxiPowerUpKind = 'shield' | 'high-jump' | 'laser' | 'giant';

export interface ZoneMeta {
  name: string;
  story: string;
  sky: RGB;
  gnd: RGB;
  plt: RGB;
  em: RGB;
  accent: RGB;
  hazard: RGB;
  laser: RGB;
  audioTheme: string;
  vfxTheme: string;
}

export interface BossMeta {
  name: string;
  title: string;
  intro: string;
  hp: number;
  spd: number;
  size: number;
  col: RGB;
  em: RGB;
}

export interface PlatDef {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'moving' | 'goal';
  moveRange?: number;
  moveSpd?: number;
}

export interface CoinDef {
  x: number;
  y: number;
  isGoal?: boolean;
}

export interface HazardDef {
  x: number;
  y: number;
  type: 'spike' | 'drop';
  moveRange?: number;
  moveSpd?: number;
  triggerRadius?: number;
}

export interface PowerUpDef {
  x: number;
  y: number;
  type: MadmaxiPowerUpKind;
}

export interface EnemyDef {
  x: number;
  y: number;
  vx: number;
  kind?: MadmaxiEnemyKind;
  anchorX?: number;
  anchorY?: number;
  boss?: boolean;
  hitsLeft?: number;
  size?: number;
  bossColor?: RGB;
  bossEmissive?: RGB;
}

export interface LevelDef {
  platforms: PlatDef[];
  coins: CoinDef[];
  enemies: EnemyDef[];
  hazards?: HazardDef[];
  powerUps?: PowerUpDef[];
  worldW: number;
  zoneName?: string;
  zoneStory?: string;
  isBossLevel?: boolean;
  encounterName?: string;
  audioTheme?: string;
  vfxTheme?: string;
  isAuthored?: boolean;
}
