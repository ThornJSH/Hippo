
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  COUNTDOWN = 'COUNTDOWN',
  WIN = 'WIN',
  LOSE = 'LOSE',
  INITIALIZING = 'INITIALIZING'
}

export interface Point {
  x: number;
  y: number;
}

export interface GameImages {
  hipo: string;
  piranha: string;
  background: string;
}

export interface LevelConfig {
  id: number;
  hipoPos: Point;
  nests: Point[]; // 다중 둥지 지원
  obstacles: { x: number, y: number, w: number, h: number }[];
  beeCount: number; // 피라니아 수
}
