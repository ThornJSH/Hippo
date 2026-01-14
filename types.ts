
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
  hippo: string;
  piranha: string;
  background: string;
}

export interface LevelConfig {
  id: number;
  hippoPos: Point;
  nests: Point[]; // 다중 둥지 지원
  obstacles: { x: number, y: number, w: number, h: number }[];
  piranhaCount: number; // 피라니아 수
}
