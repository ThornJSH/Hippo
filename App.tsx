
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
        hipo: '/assets/hipo.png',
        piranha: '/assets/piranha.png',
        background: '/assets/background.png'
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
        <h2 className="text-2xl font-bold mb-2">Save Baby Hipo</h2>
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
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-cyan-100 overflow-hidden select-none">
      <div className="absolute top-4 left-4 z-10 bg-white/80 p-3 rounded-xl shadow-lg border-2 border-cyan-400">
        <h1 className="text-xl font-bold text-cyan-700">레벨 {currentLevelIdx + 1} / 50</h1>
        <p className="text-sm font-semibold text-cyan-600">점수: {score}</p>
      </div>

      <div className="relative shadow-2xl border-8 border-blue-900/20 rounded-2xl overflow-hidden bg-white">
        <Game
          level={currentLevel}
          gameState={gameState}
          setGameState={setGameState}
          onWin={handleWin}
          onLose={handleLose}
          images={images}
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

      <div className="mt-6 text-cyan-900 font-medium text-center max-w-md px-4">
        <p className="text-sm opacity-80 mb-2">
          <b>규칙:</b> 잉크가 제한되어 있습니다. 둥지와 힙포 주변에는 선을 그을 수 없습니다.<br />
          선을 효율적으로 사용하여 모든 방향에서 오는 피라니아를 막으세요!
        </p>
      </div>
    </div>
  );
};

export default App;
