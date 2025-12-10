import React, { useState, useCallback } from 'react';
import { GameState, PinyinItem } from './types';
import { PINYIN_P, PINYIN_Q, COLORS, SIZES } from './constants';
import Bubble from './components/Bubble';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    round: 1,
    targetLetter: 'q',
    items: [],
    isPlaying: false,
    gameStatus: 'intro'
  });

  const [feedback, setFeedback] = useState<{msg: string, type: 'good' | 'bad' | 'neutral'} | null>(null);

  // Generate a new round
  const startRound = useCallback((roundNum: number) => {
    // Alternate target letter or random
    const target = Math.random() > 0.5 ? 'p' : 'q';
    
    // Create items
    const totalItems = 12 + Math.min(roundNum, 5); // Increase difficulty slightly
    const targetList = target === 'p' ? PINYIN_P : PINYIN_Q;
    const distractorList = target === 'p' ? PINYIN_Q : PINYIN_P;

    const newItems: PinyinItem[] = [];

    // Ensure at least 40% are targets
    const targetCount = Math.floor(totalItems * 0.4) + Math.floor(Math.random() * 3);

    for (let i = 0; i < totalItems; i++) {
      const isTargetItem = i < targetCount;
      const sourceList = isTargetItem ? targetList : distractorList;
      const text = sourceList[Math.floor(Math.random() * sourceList.length)];

      newItems.push({
        id: `item-${Date.now()}-${i}`,
        text,
        isTarget: isTargetItem,
        initialLetter: isTargetItem ? target : (target === 'p' ? 'q' : 'p'),
        colorClass: COLORS[Math.floor(Math.random() * COLORS.length)],
        sizeClass: SIZES[Math.floor(Math.random() * SIZES.length)],
        rotation: Math.floor(Math.random() * 20) - 10, // Slight random rotation
        isFound: false
      });
    }

    // Shuffle
    newItems.sort(() => Math.random() - 0.5);

    setGameState(prev => ({
      ...prev,
      targetLetter: target,
      items: newItems,
      gameStatus: 'playing',
      round: roundNum
    }));
    
    setFeedback(null);
  }, []);

  const handleStartGame = () => {
    setGameState(prev => ({ ...prev, score: 0, isPlaying: true }));
    startRound(1);
  };

  const handleItemClick = (item: PinyinItem) => {
    // Check Logic
    if (item.isTarget) {
      // Correct!
      setGameState(prev => {
        const updatedItems = prev.items.map(i => 
          i.id === item.id ? { ...i, isFound: true } : i
        );

        // Check completion
        const remainingTargets = updatedItems.filter(i => i.isTarget && !i.isFound).length;
        
        let newStatus = prev.gameStatus;
        if (remainingTargets === 0) {
           newStatus = 'round_complete';
           // Auto advance after delay
           setTimeout(() => startRound(prev.round + 1), 2000);
        }

        return {
          ...prev,
          items: updatedItems,
          score: prev.score + 10,
          gameStatus: newStatus
        };
      });
      setFeedback({ msg: "太棒了！ " + item.text, type: 'good' });
    } else {
      // Wrong!
      setFeedback({ msg: "不对哦！这是 " + item.initialLetter.toUpperCase(), type: 'bad' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-blue-50 text-slate-800 font-sans selection:bg-none">
      
      {/* Header */}
      <header className="w-full bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-black text-blue-600 tracking-tight">
          拼音 <span className="text-orange-500">P</span> & <span className="text-green-500">Q</span> 大挑战
        </h1>
        <div className="flex gap-4 font-bold text-lg text-slate-600">
           <span>关卡: {gameState.round}</span>
           <span className="text-blue-600">得分: {gameState.score}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl p-4 flex flex-col items-center justify-center">

        {gameState.gameStatus === 'intro' && (
          <div className="text-center max-w-lg bg-white p-10 rounded-3xl shadow-xl border-4 border-blue-100">
            <h2 className="text-4xl font-bold mb-6 text-slate-700">你能分清吗？</h2>
            <p className="text-xl text-slate-500 mb-8">
              点击所有以 <span className="font-black text-2xl text-pink-500">p</span> 或 <span className="font-black text-2xl text-teal-500">q</span> 开头的泡泡！
            </p>
            <button 
              onClick={handleStartGame}
              className="bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95"
            >
              开始游戏
            </button>
          </div>
        )}

        {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'round_complete') && (
          <div className="w-full flex flex-col items-center">
            
            {/* Instruction Bar */}
            <div className="bg-white/80 backdrop-blur-md px-8 py-4 rounded-2xl shadow-sm mb-8 border-b-4 border-slate-200">
              <h2 className="text-3xl font-bold text-center">
                找出所有 <span className="text-5xl mx-2 text-indigo-600 inline-block transform hover:scale-110 transition-transform">{gameState.targetLetter}</span> 开头的拼音！
              </h2>
            </div>

            {/* Feedback Toast */}
            <div className={`h-8 mb-4 font-bold text-lg transition-opacity duration-300 ${feedback ? 'opacity-100' : 'opacity-0'}`}>
              {feedback && (
                <span className={feedback.type === 'good' ? 'text-green-600' : 'text-orange-500'}>
                  {feedback.msg}
                </span>
              )}
            </div>

            {/* Game Grid */}
            <div className="flex flex-wrap justify-center gap-4 w-full">
              {gameState.items.map((item) => (
                <Bubble 
                  key={item.id} 
                  item={item} 
                  onClick={handleItemClick}
                  disabled={gameState.gameStatus === 'round_complete'}
                />
              ))}
            </div>

            {/* Success Overlay */}
            {gameState.gameStatus === 'round_complete' && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50 pointer-events-none">
                <div className="bg-white p-8 rounded-3xl shadow-2xl animate-bounce">
                  <span className="text-6xl">🌟</span>
                  <h3 className="text-3xl font-bold text-slate-800 mt-4">真棒！</h3>
                  <p className="text-slate-500">下一关马上开始...</p>
                </div>
              </div>
            )}
            
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full p-4 text-center text-slate-400 text-sm">
        Pinyin P & Q Pop
      </footer>

      {/* Tailwind Custom Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          75% { transform: translateX(5px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};

export default App;