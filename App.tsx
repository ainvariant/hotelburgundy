import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import CheckIn from './components/CheckIn';
import GameMain from './components/GameMain';
import { GameState, Character, ViewState, Item } from './types';
import { STARTING_GOLD, CLUES_NEEDED } from './utils';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    day: 1,
    gold: STARTING_GOLD,
    characters: [],
    inventory: [],
    cluesFound: 0,
    isDarkMode: false,
    logs: [],
    view: 'checkin',
    combatActive: false,
    activeCombatEnemies: [],
    activeCombatCharacterIds: []
  });

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const startGame = (characters: Character[]) => {
    // Consolidate starting items from characters into shared or keep personal?
    // Let's copy starting items to global inventory for ease of management in this UI
    let startingInv: Item[] = [];
    characters.forEach(c => {
      startingInv = [...startingInv, ...c.inventory];
      c.inventory = []; // Clear personal to move to shared for UI simplicity
    });

    setGameState(prev => ({
      ...prev,
      characters,
      inventory: startingInv,
      view: 'lobby',
      logs: [{ id: 'init', day: 1, message: '모든 투숙객의 체크인이 완료되었습니다. 체류가 시작됩니다.', type: 'info' }]
    }));
  };

  const resetGame = () => {
    setGameState({
      day: 1,
      gold: STARTING_GOLD,
      characters: [],
      inventory: [],
      cluesFound: 0,
      isDarkMode: isDarkMode,
      logs: [],
      view: 'checkin',
      combatActive: false,
      activeCombatEnemies: [],
      activeCombatCharacterIds: []
    });
  };

  const renderContent = () => {
    switch (gameState.view) {
      case 'checkin':
        return <CheckIn onStartGame={startGame} isDarkMode={isDarkMode} />;
      
      case 'gameover':
        return (
          <div className="text-center py-20 animate-fade-in">
            <h2 className="text-5xl font-serif text-red-900 mb-6 uppercase tracking-widest">게임 오버</h2>
            <p className="text-xl mb-8 font-serif">모든 투숙객이 실종되었습니다. 호텔이 또 다른 영혼들을 삼켰습니다.</p>
            <button onClick={resetGame} className="px-8 py-3 border-2 border-red-900 text-red-900 hover:bg-red-900 hover:text-white uppercase tracking-widest font-bold transition-all">
              다시 시도
            </button>
          </div>
        );

      case 'victory':
        return (
          <div className="text-center py-20 animate-fade-in">
            <h2 className="text-5xl font-serif text-green-800 dark:text-green-500 mb-6 uppercase tracking-widest">탈출 성공</h2>
            <p className="text-xl mb-8 font-serif">당신은 30일을 버텨내거나 진실을 밝혀냈습니다. 굳게 닫혔던 문이 열립니다.</p>
            <p className="mb-8">생존자 수: {gameState.characters.filter(c => !c.isMissing).length}명</p>
            <button onClick={resetGame} className="px-8 py-3 border-2 border-green-800 text-green-800 hover:bg-green-800 hover:text-white uppercase tracking-widest font-bold transition-all">
              체크 아웃
            </button>
          </div>
        );

      default:
        return <GameMain state={gameState} setState={setGameState} isDarkMode={isDarkMode} />;
    }
  };

  return (
    <Layout 
      isDarkMode={isDarkMode} 
      toggleTheme={() => setIsDarkMode(!isDarkMode)} 
      gameActive={gameState.view !== 'checkin'}
      resetGame={resetGame}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;