
import React, { useState, useCallback, useEffect } from 'react';
import Game from './components/Game';
import UIOverlay from './components/UIOverlay';
import { GameState, GameImages } from './types';
import { LEVELS } from './constants';


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INITIALIZING);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [images, setImages] = useState<GameImages | null>(null);
  const [initStatus, setInitStatus] = useState("준비 중...");

  const currentLevel = LEVELS[currentLevelIdx];

  const loadLocalAssets = async () => {
    try {
      setInitStatus("로컬 리소스 불러오는 중...");

      // 사용자가 public/assets 폴더에 이미지를 넣어야 합니다.
      const localImages = {
        hippo: `${import.meta.env.BASE_URL}assets/hippo.png`,
        piranha: `${import.meta.env.BASE_URL}assets/piranha.png`,
        background: `${import.meta.env.BASE_URL}assets/background.png`
      };

      setImages(localImages);
      setGameState(GameState.START);
    } catch (error) {
      console.error("Failed to load local assets", error);
      setInitStatus("리소스 로딩 실패. 기본 그래픽으로 시작합니다.");
      setGameState(GameState.START);
    }
  };

  useEffect(() => {
    loadLocalAssets();
  }, []);

  const handleStart = () => {
    setGameState(GameState.PLAYING);
  };

  const handleWin = useCallback(() => {
    setGameState(GameState.WIN);
    setScore(prev => prev + (currentLevelIdx + 1) * 100);
  }, [currentLevelIdx]);

  const handleLose = useCallback(() => {
    setGameState(GameState.LOSE);
  }, []);

  const nextLevel = () => {
    if (currentLevelIdx < LEVELS.length - 1) {
      setCurrentLevelIdx(prev => prev + 1);
      setGameState(GameState.PLAYING);
    } else {
      setCurrentLevelIdx(0);
      setGameState(GameState.START);
    }
  };

  const restartLevel = () => {
    setGameState(GameState.PLAYING);
  };

  const restartFromBeginning = () => {
    setCurrentLevelIdx(0);
    setScore(0);
    setGameState(GameState.PLAYING);
  };

  if (gameState === GameState.INITIALIZING) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-cyan-900 text-white">
        <div className="animate-bounce text-6xl mb-8">🦛</div>
        <h2 className="text-2xl font-bold mb-2">아기 하마 구하기</h2>
        <p className="text-cyan-300 animate-pulse">{initStatus}</p>
        <div className="mt-8 w-64 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400 animate-loading-bar"></div>
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .animate-loading-bar { animation: loading-bar 5s linear infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] flex flex-row items-center justify-center bg-slate-900 overflow-hidden select-none box-border px-4 gap-8">
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      {/* 왼쪽 광고 영역 (PC 전용) */}
      <div className="hidden xl:flex flex-col items-center justify-center w-[160px] h-[600px] bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shrink-0">
        <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-2">Advertisement</span>
        <div className="w-[120px] h-[500px] bg-slate-800/50 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-center p-4">
          <p className="text-[9px] text-cyan-400/50 leading-relaxed font-medium">Google Ads<br />Placeholder<br />(160 x 600)</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-start h-full pt-4">
        {/* 메인 게임 프레임 (상단 배치) */}
        <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[min(12px,2.5vw)] border-slate-800 rounded-[min(3.5rem,10vw)] overflow-hidden bg-white group flex items-center justify-center shrink-0"
          style={{
            height: 'min(724px, 85dvh)',
            aspectRatio: '424 / 724',
            maxWidth: '95vw'
          }}>
          <div className="absolute inset-0 border-[min(6px,1.2vw)] border-white/10 pointer-events-none z-30 rounded-[min(2.8rem,8vw)]"></div>

          <Game
            level={currentLevel}
            gameState={gameState}
            setGameState={setGameState}
            onWin={handleWin}
            onLose={handleLose}
            images={images}
            levelNum={currentLevelIdx + 1}
          />

          <UIOverlay
            gameState={gameState}
            onStart={handleStart}
            onNext={nextLevel}
            onRestart={restartLevel}
            onFullReset={restartFromBeginning}
            levelNum={currentLevelIdx + 1}
          />
        </div>

        {/* 하단 레이블 (위치 이동 및 간격 최적화) */}
        <div className="z-40 mt-auto mb-8 flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shrink-0">
          <h1 className="text-sm font-black text-cyan-400 tracking-widest uppercase">Lv.{currentLevelIdx + 1}</h1>
          <div className="w-[1px] h-3 bg-white/20"></div>
          <p className="text-[11px] font-bold text-white uppercase tracking-tighter">Score: {score}</p>
        </div>
      </div>

      {/* 오른쪽 광고 영역 (PC 전용) */}
      <div className="hidden xl:flex flex-col items-center justify-center w-[160px] h-[600px] bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shrink-0">
        <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-2">Advertisement</span>
        <div className="w-[120px] h-[500px] bg-slate-800/50 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-center p-4">
          <p className="text-[9px] text-cyan-400/50 leading-relaxed font-medium">Google Ads<br />Placeholder<br />(160 x 600)</p>
        </div>
      </div>
    </div>
  );
};

export default App;
