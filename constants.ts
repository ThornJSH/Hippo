
import { LevelConfig } from './types';

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 700;
export const PROTECT_TIME = 10;
export const BEE_FORCE = 0.0028;
export const MAX_INK = 500; // 난이도 조정을 위해 잉크 양 대폭 축소
export const FORBIDDEN_RADIUS_NEST = 70;
export const FORBIDDEN_RADIUS_HIPO = 50;

const baseLevels: LevelConfig[] = [
  {
    id: 1,
    hipoPos: { x: 200, y: 670 }, // 캔버스 최하단 (바닥 700)
    nests: [{ x: 200, y: 120 }],
    obstacles: [
      { x: 100, y: 300, w: 80, h: 20 },
      { x: 300, y: 300, w: 80, h: 20 }
    ],
    beeCount: 10
  },
  {
    id: 2,
    hipoPos: { x: 200, y: 670 },
    nests: [{ x: 80, y: 120 }, { x: 320, y: 120 }],
    obstacles: [
      { x: 200, y: 350, w: 120, h: 20 },
      { x: 100, y: 480, w: 20, h: 60 },
      { x: 300, y: 480, w: 20, h: 60 }
    ],
    beeCount: 15
  }
];

const generateLevels = (): LevelConfig[] => {
  const levels = [...baseLevels];
  for (let i = 3; i <= 50; i++) {
    const nestsCount = i > 20 ? 3 : (i > 8 ? 2 : 1);
    const nests = [];
    for (let n = 0; n < nestsCount; n++) {
      nests.push({
        x: 60 + Math.random() * (CANVAS_WIDTH - 120),
        y: 80 + Math.random() * 100
      });
    }

    levels.push({
      id: i,
      hipoPos: {
        x: 150 + Math.random() * (CANVAS_WIDTH - 300),
        y: 600 + Math.random() * 70 // 최하단 영역
      },
      nests: nests,
      obstacles: [
        { x: CANVAS_WIDTH / 2, y: 300 + (Math.random() - 0.5) * 150, w: 80 + Math.random() * 60, h: 20 },
        { x: Math.random() * CANVAS_WIDTH, y: 520, w: 50, h: 20 }
      ],
      beeCount: 10 + (i * 2)
    });
  }
  return levels;
};

export const LEVELS = generateLevels();
