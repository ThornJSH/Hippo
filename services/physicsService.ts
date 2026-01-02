
import Matter from 'matter-js';
import { Point } from '../types';

// 충돌 카테고리 설정
export const CATEGORY_WALL = 0x0001;
export const CATEGORY_LINE = 0x0002;
export const CATEGORY_HIPO = 0x0004;
export const CATEGORY_PIRANHA = 0x0008;
export const CATEGORY_OBSTACLE = 0x0010;

export const createDrawnBody = (points: Point[]) => {
  if (points.length < 2) return null;

  const parts = [];
  const thickness = 14;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    const rect = Matter.Bodies.rectangle(
      (p1.x + p2.x) / 2,
      (p1.y + p2.y) / 2,
      dist,
      thickness,
      {
        angle: angle,
        friction: 0.1, // 미끄러움 추가
        restitution: 0.1,
        density: 0.008, // 질량 상향하여 피라니아 압박에 반응하게 함
        label: 'drawnLinePart',
        collisionFilter: {
            category: CATEGORY_LINE,
            // CATEGORY_WALL을 제외한 모든 것과 충돌 (벽은 통과)
            mask: CATEGORY_HIPO | CATEGORY_PIRANHA | CATEGORY_OBSTACLE | CATEGORY_LINE
        }
      }
    );
    parts.push(rect);
  }

  const body = Matter.Body.create({
    parts: parts,
    isStatic: false,
    label: 'drawnLine',
    frictionAir: 0.03
  });

  return body;
};
