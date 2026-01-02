
import React from 'react';
import { GameState } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  onStart: () => void;
  onNext: () => void;
  onRestart: () => void;
  onFullReset?: () => void;
  levelNum: number;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, onStart, onNext, onRestart, onFullReset, levelNum }) => {
  if (gameState === GameState.COUNTDOWN || gameState === GameState.PLAYING) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-blue-900/40 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border-4 border-cyan-400">
        {gameState === GameState.START && (
          <>
            <h1 className="text-4xl font-black text-cyan-600 mb-2 uppercase">아기 하마 구하기</h1>
            <p className="text-gray-600 mb-6">굶주린 피라니아들로부터 귀여운 아기 하마를 지켜주세요!</p>
            <button
              onClick={onStart}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-105"
            >
              구조 시작
            </button>
          </>
        )}

        {gameState === GameState.WIN && (
          <>
            <div className="text-6xl mb-4">🌊</div>
            <h2 className="text-3xl font-bold text-green-600 mb-2">{levelNum}단계 통과!</h2>
            <p className="text-gray-600 mb-6">아기 하마가 피라니아들을 따돌렸습니다!</p>
            <button
              onClick={onNext}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-105"
            >
              다음 구역으로
            </button>
          </>
        )}

        {gameState === GameState.LOSE && (
          <>
            <div className="text-6xl mb-4">🐟</div>
            <h2 className="text-3xl font-bold text-red-600 mb-2">런! 런!</h2>
            <p className="text-gray-600 mb-6">피라니아들이 너무 배가 고팠나 봐요. 다시 시도해볼까요?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onRestart}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-105"
              >
                이번 구역 다시 하기
              </button>
              <button
                onClick={onFullReset}
                className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-105"
              >
                처음부터 다시 도전
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UIOverlay;
