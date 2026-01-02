
import { LevelConfig } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PROTECT_TIME = 10;
export const BEE_FORCE = 0.0018; 
export const MAX_INK = 1020; // 기존 850에서 20% 상향 (장애물 우회 여유분)
export const FORBIDDEN_RADIUS_NEST = 70;
export const FORBIDDEN_RADIUS_HIPO = 50;

const baseLevels: LevelConfig[] = [
  {
    id: 1,
    hipoPos: { x: 400, y: 500 },
    nests: [{ x: 400, y: 100 }],
    obstacles: [
        { x: 150, y: 300, w: 200, h: 40 },
        { x: 650, y: 300, w: 200, h: 40 }
    ],
    beeCount: 15
  },
  {
    id: 2,
    hipoPos: { x: 400, y: 530 },
    nests: [{ x: 100, y: 100 }, { x: 700, y: 100 }],
    obstacles: [
      { x: 400, y: 350, w: 300, h: 20 },
      { x: 200, y: 450, w: 20, h: 200 },
      { x: 600, y: 450, w: 20, h: 200 }
    ],
    beeCount: 20
  }
];

const generateLevels = (): LevelConfig[] => {
  const levels = [...baseLevels];
  for (let i = 3; i <= 50; i++) {
    const nestsCount = i > 20 ? 3 : (i > 8 ? 2 : 1);
    const nests = [];
    for(let n=0; n<nestsCount; n++) {
        nests.push({
            x: 100 + Math.random() * (CANVAS_WIDTH - 200),
            y: 80 + Math.random() * 100
        });
    }

    levels.push({
      id: i,
      hipoPos: { 
        x: 200 + Math.random() * (CANVAS_WIDTH - 400), 
        y: 450 + Math.random() * 100 
      },
      nests: nests,
      obstacles: [
        { x: CANVAS_WIDTH / 2, y: 300 + (Math.random() - 0.5) * 100, w: 200 + Math.random() * 300, h: 20 },
        { x: Math.random() * CANVAS_WIDTH, y: 450, w: 100, h: 20 }
      ],
      beeCount: 15 + (i * 2)
    });
  }
  return levels;
};

export const LEVELS = generateLevels();
