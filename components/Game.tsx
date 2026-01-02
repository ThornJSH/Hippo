
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { GameState, LevelConfig, Point, GameImages } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PROTECT_TIME, BEE_FORCE, MAX_INK, FORBIDDEN_RADIUS_NEST, FORBIDDEN_RADIUS_HIPO } from '../constants';
import { createDrawnBody, CATEGORY_WALL, CATEGORY_HIPO, CATEGORY_PIRANHA, CATEGORY_OBSTACLE, CATEGORY_LINE } from '../services/physicsService';

interface GameProps {
  level: LevelConfig;
  gameState: GameState;
  setGameState: (s: GameState) => void;
  onWin: () => void;
  onLose: () => void;
  images: GameImages | null;
  levelNum: number;
}

const Game: React.FC<GameProps> = ({ level, gameState, setGameState, onWin, onLose, images, levelNum }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const currentPointsRef = useRef<Point[]>([]);

  const [timer, setTimer] = useState(PROTECT_TIME);
  const [inkRemaining, setInkRemaining] = useState(MAX_INK);
  const [isHoveringForbidden, setIsHoveringForbidden] = useState(false);

  const loadedImages = useRef<{ [key: string]: HTMLImageElement }>({});

  // 이미지 프리로드
  useEffect(() => {
    if (images) {
      const hipoImg = new Image(); hipoImg.src = images.hipo;
      const piranhaImg = new Image(); piranhaImg.src = images.piranha;
      const bgImg = new Image(); bgImg.src = images.background;
      loadedImages.current = { hipo: hipoImg, piranha: piranhaImg, bg: bgImg };
    }
  }, [images]);

  // 물리 엔진 초기화
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = Matter.Engine.create({ positionIterations: 10, velocityIterations: 10 });
    engineRef.current = engine;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, wireframes: false, background: 'transparent' },
    });
    renderRef.current = render;

    Matter.Runner.run(Matter.Runner.create(), engine);
    Matter.Render.run(render);

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (labels.includes('hipo') && labels.includes('piranha')) {
          onLose();
        }
      });
    });

    return () => {
      Matter.Engine.clear(engine);
      Matter.Render.stop(render);
    };
  }, [onLose]);

  // 피라니아 추적 AI
  useEffect(() => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    const forceListener = () => {
      if (gameState !== GameState.COUNTDOWN) return;
      const hipoBody = engine.world.bodies.find(b => b.label === 'hipo');
      if (!hipoBody) return;
      const piranhas = engine.world.bodies.filter(b => b.label === 'piranha');
      piranhas.forEach(piranha => {
        const dx = hipoBody.position.x - piranha.position.x;
        const dy = hipoBody.position.y - piranha.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          const noiseX = (Math.random() - 0.5) * 0.2;
          const noiseY = (Math.random() - 0.5) * 0.2;
          const forceMagnitude = BEE_FORCE * piranha.mass;
          Matter.Body.applyForce(piranha, piranha.position, {
            x: (dx / distance + noiseX) * forceMagnitude,
            y: (dy / distance + noiseY) * forceMagnitude
          });
        }
      });
    };
    Matter.Events.on(engine, 'beforeUpdate', forceListener);
    return () => Matter.Events.off(engine, 'beforeUpdate', forceListener);
  }, [gameState]);

  // 레벨 상태 초기화
  useEffect(() => {
    if (!engineRef.current) return;
    if (gameState === GameState.PLAYING) {
      const world = engineRef.current.world;
      Matter.World.clear(world, false);

      const wallFilter = { category: CATEGORY_WALL, mask: CATEGORY_HIPO | CATEGORY_PIRANHA };

      const bodies = [
        Matter.Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + 25, CANVAS_WIDTH, 50, {
          isStatic: true, label: 'ground',
          collisionFilter: { category: CATEGORY_WALL, mask: 0xFFFF }
        }),
        Matter.Bodies.rectangle(-25, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT, { isStatic: true, collisionFilter: wallFilter }),
        Matter.Bodies.rectangle(CANVAS_WIDTH + 25, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT, { isStatic: true, collisionFilter: wallFilter }),
        Matter.Bodies.rectangle(CANVAS_WIDTH / 2, -25, CANVAS_WIDTH, 50, { isStatic: true, collisionFilter: wallFilter }),

        ...level.obstacles.map(obs => Matter.Bodies.rectangle(obs.x, obs.y, obs.w, obs.h, {
          isStatic: true, label: 'obstacle',
          collisionFilter: { category: CATEGORY_OBSTACLE, mask: 0xFFFF },
          render: { fillStyle: '#1e40af' }
        })),

        Matter.Bodies.circle(level.hipoPos.x, level.hipoPos.y, 30, {
          label: 'hipo', restitution: 0.4, friction: 0.05, density: 0.01,
          collisionFilter: { category: CATEGORY_HIPO, mask: 0xFFFF },
          render: { visible: false }
        })
      ];
      Matter.World.add(world, bodies);

      // 상태 초기화
      setTimer(PROTECT_TIME);
      setInkRemaining(MAX_INK);
      currentPointsRef.current = [];
    }
  }, [level, gameState]);

  // 타이머 로직 (상태 기반)
  useEffect(() => {
    let intervalId: number | null = null;
    if (gameState === GameState.COUNTDOWN) {
      intervalId = window.setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (intervalId) clearInterval(intervalId);
            onWin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameState, onWin]);

  // 메인 렌더 루프
  useEffect(() => {
    const updateLoop = () => {
      if (!renderRef.current || !engineRef.current) return;
      const ctx = renderRef.current.canvas.getContext('2d');
      if (!ctx) return;

      if (loadedImages.current.bg) {
        ctx.drawImage(loadedImages.current.bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'rgba(0, 0, 50, 0.1)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = '#ecfeff';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      const obstacles = engineRef.current.world.bodies.filter(b => b.label === 'obstacle');
      obstacles.forEach(obs => {
        ctx.fillStyle = '#3b82f6';
        const { min, max } = obs.bounds;
        ctx.fillRect(min.x, min.y, max.x - min.x, max.y - min.y);
        ctx.strokeStyle = '#1d4ed8'; ctx.strokeRect(min.x, min.y, max.x - min.x, max.y - min.y);
      });

      if (gameState === GameState.PLAYING && currentPointsRef.current.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPointsRef.current[0].x, currentPointsRef.current[0].y);
        currentPointsRef.current.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = isHoveringForbidden ? '#ef4444' : '#0f172a';
        ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.stroke();
        if (isHoveringForbidden) {
          const lastPoint = currentPointsRef.current[currentPointsRef.current.length - 1];
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.beginPath(); ctx.arc(lastPoint.x, lastPoint.y, 15, 0, Math.PI * 2); ctx.fill();
        }
      }

      const lines = engineRef.current.world.bodies.filter(b => b.label === 'drawnLine');
      lines.forEach(line => {
        line.parts.slice(1).forEach(part => {
          ctx.save(); ctx.translate(part.position.x, part.position.y); ctx.rotate(part.angle);
          ctx.fillStyle = '#0f172a'; ctx.beginPath();
          ctx.moveTo(part.vertices[0].x - part.position.x, part.vertices[0].y - part.position.y);
          part.vertices.forEach(v => ctx.lineTo(v.x - part.position.x, v.y - part.position.y));
          ctx.closePath(); ctx.fill(); ctx.restore();
        });
      });

      const hipoBody = engineRef.current.world.bodies.find(b => b.label === 'hipo');
      if (hipoBody) {
        ctx.save(); ctx.translate(hipoBody.position.x, hipoBody.position.y); ctx.rotate(hipoBody.angle);
        if (loadedImages.current.hipo) ctx.drawImage(loadedImages.current.hipo, -35, -40, 70, 70);
        else { ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }

      level.nests.forEach(nest => {
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.beginPath(); ctx.arc(nest.x, nest.y, FORBIDDEN_RADIUS_NEST, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(51, 65, 85, 0.8)'; ctx.beginPath(); ctx.arc(nest.x, nest.y, 45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(nest.x, nest.y, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText("NEST", nest.x, nest.y + 5);
      });

      const piranhas = engineRef.current.world.bodies.filter(b => b.label === 'piranha');
      piranhas.forEach(p => {
        ctx.save(); ctx.translate(p.position.x, p.position.y); ctx.rotate(Math.atan2(p.velocity.y, p.velocity.x));
        if (loadedImages.current.piranha) ctx.drawImage(loadedImages.current.piranha, -15, -15, 30, 30);
        else { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });

      requestAnimationFrame(updateLoop);
    };
    const animFrame = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrame);
  }, [level, gameState, images, isHoveringForbidden]);

  // 카운트다운 시작 시 피라니아 생성
  useEffect(() => {
    if (gameState === GameState.COUNTDOWN && engineRef.current) {
      const world = engineRef.current.world;
      const piranhas = [];
      level.nests.forEach(nest => {
        for (let i = 0; i < Math.floor(level.beeCount / level.nests.length); i++) {
          // 난이도에 따른 물리 설정 동적 계산 (1단계는 얌전하게, 갈수록 격렬하게)
          const bounce = Math.min(0.95, 0.4 + (levelNum * 0.02)); // 1단계 0.42 ~ 최대 0.95
          const dens = Math.min(0.015, 0.002 + (levelNum * 0.0003)); // 1단계 0.0023 ~ 최대 0.015
          const air = Math.max(0.015, 0.04 - (levelNum * 0.0005)); // 1단계 0.039 ~ 최소 0.015

          piranhas.push(Matter.Bodies.circle(nest.x + (Math.random() - 0.5) * 40, nest.y + (Math.random() - 0.5) * 40, 9, {
            label: 'piranha', frictionAir: air, restitution: bounce, density: dens,
            collisionFilter: { category: CATEGORY_PIRANHA, mask: 0xFFFF },
            render: { visible: false }
          }));
        }
      });
      Matter.World.add(world, piranhas);
    }
  }, [gameState, level]);

  const isForbidden = useCallback((x: number, y: number) => {
    for (const nest of level.nests) {
      if (Math.sqrt(Math.pow(nest.x - x, 2) + Math.pow(nest.y - y, 2)) < FORBIDDEN_RADIUS_NEST) return true;
    }
    if (Math.sqrt(Math.pow(level.hipoPos.x - x, 2) + Math.pow(level.hipoPos.y - y, 2)) < FORBIDDEN_RADIUS_HIPO) return true;
    for (const obs of level.obstacles) {
      const left = obs.x - obs.w / 2; const right = obs.x + obs.w / 2;
      const top = obs.y - obs.h / 2; const bottom = obs.y + obs.h / 2;
      if (x >= left && x <= right && y >= top && y <= bottom) return true;
    }
    return false;
  }, [level]);

  const isSegmentBlocked = useCallback((p1: Point, p2: Point) => {
    for (const obs of level.obstacles) {
      const left = obs.x - obs.w / 2; const right = obs.x + obs.w / 2;
      const top = obs.y - obs.h / 2; const bottom = obs.y + obs.h / 2;
      const intersect = (a: Point, b: Point, c: Point, d: Point) => {
        const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
        if (det === 0) return false;
        const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
        const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
      };
      const rectEdges = [[{ x: left, y: top }, { x: right, y: top }], [{ x: right, y: top }, { x: right, y: bottom }], [{ x: right, y: bottom }, { x: left, y: bottom }], [{ x: left, y: bottom }, { x: left, y: top }]];
      for (const edge of rectEdges) { if (intersect(p1, p2, edge[0] as Point, edge[1] as Point)) return true; }
    }
    return false;
  }, [level]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== GameState.PLAYING) return;
    const pos = getPos(e);
    if (isForbidden(pos.x, pos.y)) { setIsHoveringForbidden(true); return; }
    currentPointsRef.current = [pos];
    setIsHoveringForbidden(false);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== GameState.PLAYING) return;
    const pos = getPos(e);
    const forbidden = isForbidden(pos.x, pos.y);
    setIsHoveringForbidden(forbidden);

    if (currentPointsRef.current.length === 0) return;
    if (inkRemaining <= 0) { handleMouseUp(); return; }

    const last = currentPointsRef.current[currentPointsRef.current.length - 1];
    if (forbidden || isSegmentBlocked(last, pos)) {
      setIsHoveringForbidden(true);
      return;
    }

    const dist = Math.sqrt(Math.pow(pos.x - last.x, 2) + Math.pow(pos.y - last.y, 2));
    if (dist > 12) {
      setInkRemaining(prev => Math.max(0, prev - dist));
      currentPointsRef.current.push(pos);
    }
  };

  const handleMouseUp = () => {
    setIsHoveringForbidden(false);

    // 실수 방지: 드로잉이 너무 짧거나 잉크 소모가 거의 없으면 무시
    const usedInk = MAX_INK - inkRemaining;
    if (gameState !== GameState.PLAYING || currentPointsRef.current.length < 5 || usedInk < 40) {
      currentPointsRef.current = [];
      setInkRemaining(MAX_INK); // 잉크 리셋
      return;
    }

    const body = createDrawnBody(currentPointsRef.current);
    if (body && engineRef.current) {
      Matter.World.add(engineRef.current.world, body);
      setGameState(GameState.COUNTDOWN);
    }
    currentPointsRef.current = [];
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    // 캔버스 내부 해상도(400x700)와 실제 화면에 표시되는 크기(rect) 사이의 비율 계산
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (cx - rect.left) * scaleX,
      y: (cy - rect.top) * scaleY
    };
  };

  return (
    <div className="relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-4 bg-gray-200 rounded-full border border-white/50 shadow-inner overflow-hidden z-10 box-border">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-100" style={{ width: `${(inkRemaining / MAX_INK) * 100}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-overlay uppercase tracking-widest">Ink</span>
      </div>
      <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} className="cursor-crosshair bg-cyan-50 shadow-inner w-full h-full object-contain" />
      {gameState === GameState.COUNTDOWN && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-8xl font-black text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] animate-pulse">{timer}</span>
        </div>
      )}
    </div>
  );
};

export default Game;
