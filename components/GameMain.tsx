import React, { useState, useEffect } from 'react';
import { GameState, Character, ViewState, Item, Enemy, Personality, Job } from '../types';
import { MAX_ENERGY, ITEMS, generateEnemy, calculatePlayerDamage, STARTING_GOLD, CLUES_NEEDED, formatCurrency, MAX_DAYS } from '../utils';
import { Map, ShoppingBag, BedDouble, Skull, Footprints, ShieldAlert, Heart, Activity } from 'lucide-react';

interface GameMainProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  isDarkMode: boolean;
}

const GameMain: React.FC<GameMainProps> = ({ state, setState, isDarkMode }) => {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  // Computed Values
  const aliveCharacters = state.characters.filter(c => !c.isMissing);
  const selectedChar = state.characters.find(c => c.id === selectedCharId);
  const survivalRate = Math.max(0, 100 - (state.day * 1)); // Decreases 1% per day

  // Helper: Add Log
  const addLog = (message: string, type: 'info' | 'danger' | 'success' | 'combat' = 'info') => {
    setState(prev => ({
      ...prev,
      logs: [{ id: Math.random().toString(), day: prev.day, message, type }, ...prev.logs].slice(0, 50)
    }));
  };

  // Action: Advance Day
  const advanceDay = () => {
    setState(prev => {
      // Heal slightly for living chars? Reset Energy?
      const newChars = prev.characters.map(c => ({
        ...c,
        energy: MAX_ENERGY // Reset energy
      }));
      
      const nextDay = prev.day + 1;
      let logMessage = `${nextDay}일차 아침이 밝았습니다. 공기가 더욱 무거워진 것 같습니다.`;
      if (nextDay === 2) logMessage = "2일차. 호텔의 분위기가 어제와 다릅니다. 기이한 소리가 들려옵니다.";

      return {
        ...prev,
        day: nextDay,
        characters: newChars,
        logs: [{ id: Math.random().toString(), day: nextDay, message: logMessage, type: 'info' }, ...prev.logs]
      };
    });
  };

  // Action: Buy Item
  const buyItem = (itemKey: string) => {
    const item = ITEMS[itemKey];
    if (state.gold >= item.value) {
      setState(prev => ({
        ...prev,
        gold: prev.gold - item.value,
        inventory: [...prev.inventory, { ...item, id: Math.random().toString() }]
      }));
      addLog(`${item.name}을(를) 구매했습니다.`, 'success');
    }
  };

  // Action: Use Consumable
  const useItem = (charId: string, itemIdx: number) => {
    const char = state.characters.find(c => c.id === charId);
    const item = state.inventory[itemIdx];
    
    if (char && item && item.type === 'consumable' && item.effect) {
      const newHp = Math.min(char.maxHp, char.hp + item.effect);
      
      setState(prev => {
        const newChars = prev.characters.map(c => c.id === charId ? { ...c, hp: newHp } : c);
        const newInv = [...prev.inventory];
        newInv.splice(itemIdx, 1);
        return { ...prev, characters: newChars, inventory: newInv };
      });
      addLog(`${char.name}이(가) ${item.name}을(를) 사용하여 체력을 ${item.effect} 회복했습니다.`, 'success');
    }
  };

  // Action: Investigate (The Core Loop)
  const handleInvestigate = (char: Character) => {
    if (char.energy <= 0) return;

    // Deduct Energy
    setState(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === char.id ? { ...c, energy: c.energy - 1 } : c)
    }));

    // RNG Logic
    const rng = Math.random();
    let combatChance = 0.2;
    let lootChance = 0.5;
    let trapChance = 0.2; // Remaining 0.1 is nothing

    // Traits modifiers
    if (char.personality === Personality.Cautious) {
      combatChance -= 0.05;
      trapChance -= 0.1;
      lootChance -= 0.1;
    } else if (char.personality === Personality.Cowardly) {
      combatChance -= 0.1;
      lootChance -= 0.2; // Less likely to find things
    } else if (char.personality === Personality.Curious) {
      lootChance += 0.1;
      trapChance += 0.1;
    }

    // Determine Outcome
    const outcomeRoll = Math.random();

    if (outcomeRoll < combatChance) {
      // Combat Start
      startCombat(char);
    } else if (outcomeRoll < combatChance + trapChance) {
      // Trap
      const dmg = Math.floor(Math.random() * 20) + 5;
      takeDamage(char.id, dmg);
      addLog(`${char.name}이(가) 함정을 건드렸습니다! ${dmg}의 피해를 입었습니다.`, 'danger');
    } else if (outcomeRoll < combatChance + trapChance + lootChance) {
      // Loot / Clue
      const findRoll = Math.random();
      if (findRoll > 0.85) {
        // Clue
        setState(prev => ({ ...prev, cluesFound: prev.cluesFound + 1 }));
        addLog(`${char.name}이(가) 불길한 쪽지를 발견했습니다... (단서 획득!)`, 'success');
      } else if (findRoll > 0.5) {
        // Gold
        const goldFound = Math.floor(Math.random() * 50) + 10;
        setState(prev => ({ ...prev, gold: prev.gold + goldFound }));
        addLog(`${char.name}이(가) 서랍 속에서 ${goldFound} 골드를 발견했습니다.`, 'success');
      } else {
        // Shelter / Minor Restore
        const heal = 10;
        const newHp = Math.min(char.maxHp, char.hp + heal);
        setState(prev => ({
           ...prev,
           characters: prev.characters.map(c => c.id === char.id ? { ...c, hp: newHp } : c)
        }));
        addLog(`${char.name}이(가) 안전한 휴식처를 찾았습니다. 체력을 ${heal} 회복합니다.`, 'info');
      }
    } else {
      addLog(`${char.name}이(가) 샅샅이 뒤져보았지만, 먼지뿐이었습니다.`, 'info');
    }
  };

  const takeDamage = (charId: string, amount: number) => {
    setState(prev => {
      const char = prev.characters.find(c => c.id === charId);
      if (!char) return prev;
      const newHp = char.hp - amount;
      
      let logs = [...prev.logs];
      let chars = prev.characters.map(c => c.id === charId ? { ...c, hp: newHp } : c);

      if (newHp <= 0) {
        // Missing / Dead
        chars = chars.map(c => c.id === charId ? { ...c, isMissing: true, hp: 0 } : c);
        logs = [{ id: Math.random().toString(), day: prev.day, message: `${char.name}이(가) 실종되었습니다...`, type: 'danger' }, ...logs];
      }

      return { ...prev, characters: chars, logs };
    });
  };

  const startCombat = (triggerChar: Character) => {
    // Find allies on same floor
    const allies = aliveCharacters.filter(c => c.floor === triggerChar.floor && c.id !== triggerChar.id);
    const combatants = [triggerChar, ...allies];
    const enemy = generateEnemy(state.day);

    setState(prev => ({
      ...prev,
      combatActive: true,
      activeCombatEnemies: [enemy],
      activeCombatCharacterIds: combatants.map(c => c.id)
    }));

    addLog(`${triggerChar.name}이(가) ${enemy.name}와(과) 마주쳤습니다! ${allies.length > 0 ? `${triggerChar.floor}층의 동료들이 합류합니다!` : '홀로 싸워야 합니다.'}`, 'combat');
  };

  const resolveCombat = () => {
    if (!state.activeCombatEnemies.length) return;
    const enemy = state.activeCombatEnemies[0];
    const fighters = state.characters.filter(c => state.activeCombatCharacterIds.includes(c.id));

    // Calculate total player damage
    let totalDmg = 0;
    fighters.forEach(f => {
      totalDmg += calculatePlayerDamage(f, enemy);
    });

    // Enemy attacks a random fighter
    const target = fighters[Math.floor(Math.random() * fighters.length)];
    const enemyDmg = enemy.damage;

    // Apply results
    if (totalDmg >= enemy.hp) {
      // Victory
      const rewardGold = enemy.hp * 2;
      setState(prev => ({
        ...prev,
        combatActive: false,
        activeCombatCharacterIds: [],
        activeCombatEnemies: [],
        gold: prev.gold + rewardGold
      }));
      addLog(`${enemy.name} 처치 성공! ${rewardGold} 골드를 획득했습니다.`, 'success');
      
      // Chance for clue on boss kill (simulated) or random
      if(Math.random() > 0.8) {
         setState(prev => ({ ...prev, cluesFound: prev.cluesFound + 1 }));
         addLog(`괴물의 잔해 속에서 단서를 발견했습니다.`, 'success');
      }

    } else {
      
      // Let's roll for "Tactical Success"
      const winChance = 0.5 + (fighters.length * 0.1) + (totalDmg / 100); 
      // If damage is high, chance is high.
      
      const roll = Math.random();
      
      if (roll < winChance || totalDmg > enemy.hp) {
         // WIN
          const rewardGold = enemy.hp * 2;
          setState(prev => ({
            ...prev,
            combatActive: false,
            activeCombatCharacterIds: [],
            activeCombatEnemies: [],
            gold: prev.gold + rewardGold,
            inventory: Math.random() > 0.5 ? [...prev.inventory, { ...ITEMS.FOOD, id: Math.random().toString() }] : prev.inventory
          }));
          addLog(`${enemy.name} 격퇴 성공! 모두 무사합니다.`, 'success');
      } else {
          // LOSE / TAKE DAMAGE
          // Apply damage to target
          takeDamage(target.id, enemyDmg * 2); // Critical hit leads to potential missing
          addLog(`${target.name}이(가) ${enemy.name}에게 압도당해 큰 피해를 입었습니다! 팀은 후퇴했습니다.`, 'danger');
           setState(prev => ({
            ...prev,
            combatActive: false,
            activeCombatCharacterIds: [],
            activeCombatEnemies: [],
          }));
      }
    }
  };

  // Check Game Over / Victory Conditions
  useEffect(() => {
    const living = state.characters.filter(c => !c.isMissing);
    if (state.characters.length > 0 && living.length === 0) {
      setState(prev => ({ ...prev, view: 'gameover' }));
    }
    if (state.day >= 30 || state.cluesFound >= CLUES_NEEDED) {
      setState(prev => ({ ...prev, view: 'victory' }));
    }
  }, [state.characters, state.day, state.cluesFound, setState]);


  // RENDER HELPERS
  const renderCharacterCard = (char: Character) => {
    const isSelected = selectedCharId === char.id;
    return (
      <div 
        key={char.id} 
        onClick={() => !char.isMissing && setSelectedCharId(char.id)}
        className={`p-3 border transition-all cursor-pointer relative overflow-hidden
          ${isDarkMode ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'}
          ${isSelected ? 'ring-2 ring-burgundy-500' : ''}
          ${char.isMissing ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:shadow-md'}
        `}
      >
        <div className="flex justify-between items-start">
           <div>
             <h4 className="font-bold">{char.name}</h4>
             <p className="text-xs uppercase">{char.job} • {char.age}세</p>
           </div>
           <div className={`text-xs px-2 py-1 rounded ${char.isMissing ? 'bg-stone-800' : 'bg-burgundy-900 text-white'}`}>
             {char.isMissing ? '실종' : `${char.roomNumber}호`}
           </div>
        </div>

        {!char.isMissing && (
          <div className="mt-3 space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>체력</span>
                <span>{char.hp}/{char.maxHp}</span>
              </div>
              <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-700 transition-all duration-500" 
                  style={{ width: `${(char.hp / char.maxHp) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex gap-1">
               {Array.from({ length: MAX_ENERGY }).map((_, i) => (
                 <div key={i} className={`h-2 flex-1 rounded-sm ${i < char.energy ? 'bg-yellow-500' : 'bg-gray-700'}`} />
               ))}
            </div>
          </div>
        )}
        {char.isMissing && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-red-500 font-bold tracking-widest rotate-12 border-4 border-red-900">실종됨</div>}
      </div>
    );
  };

  // --- VIEW: SHOP ---
  if (state.view === 'shop') {
    return (
      <div className="animate-fade-in">
        <h2 className="text-3xl mb-6 text-center font-serif text-burgundy-700">컨시어지 상점</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(ITEMS).filter(i => {
            // Day 1 only consumables, Day 2+ weapons/keys
            if (state.day === 1) return i.type === 'consumable';
            return true;
          }).map(item => (
             <div key={item.id} className={`p-4 border border-burgundy-900/30 flex flex-col justify-between ${isDarkMode ? 'bg-stone-900' : 'bg-white'}`}>
                <div>
                   <h4 className="font-bold text-lg">{item.name}</h4>
                   <p className="text-sm opacity-70 italic mb-2">{item.description}</p>
                   {item.effect && <p className="text-xs font-bold text-burgundy-600">효과: +{item.effect}</p>}
                </div>
                <button 
                  onClick={() => buyItem(item.id.toUpperCase())}
                  disabled={state.gold < item.value}
                  className={`mt-4 w-full py-2 border uppercase text-sm tracking-widest
                    ${state.gold >= item.value 
                      ? 'border-burgundy-800 hover:bg-burgundy-800 hover:text-white' 
                      : 'opacity-50 cursor-not-allowed border-gray-500'}
                  `}
                >
                  구매 ({formatCurrency(item.value)})
                </button>
             </div>
          ))}
        </div>
        <button onClick={() => setState(prev => ({ ...prev, view: 'lobby' }))} className="mt-8 block mx-auto underline">로비로 돌아가기</button>
      </div>
    );
  }

  // --- VIEW: MAIN GAME DASHBOARD ---
  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full">
      {/* Left Col: Characters */}
      <div className="lg:col-span-2 space-y-6">
         {/* Stats Bar */}
         <div className={`p-4 border flex justify-between items-center ${isDarkMode ? 'bg-stone-900 border-burgundy-900' : 'bg-white border-burgundy-900'}`}>
            <div>
              <span className="text-xs uppercase tracking-widest opacity-60 block">날짜</span>
              <span className="text-2xl font-bold">{state.day} / {MAX_DAYS}일</span>
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest opacity-60 block">자금</span>
              <span className="text-2xl font-bold text-yellow-600">{formatCurrency(state.gold)}</span>
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest opacity-60 block">단서</span>
              <span className="text-2xl font-bold text-blue-600">{state.cluesFound} / {CLUES_NEEDED}</span>
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest opacity-60 block">생존 확률</span>
              <span className="text-2xl font-bold text-red-600">{survivalRate}%</span>
            </div>
         </div>

         {/* Floor Map / Character Grid */}
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-2">
            {state.characters.map(renderCharacterCard)}
         </div>
         
         {/* Action Area */}
         <div className={`p-6 border-t-4 border-burgundy-900 ${isDarkMode ? 'bg-stone-900' : 'bg-antique-white'}`}>
            {selectedChar ? (
               <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{selectedChar.name}의 행동</h3>
                    <p className="text-sm opacity-70">기력: {selectedChar.energy}/{MAX_ENERGY} • 현재 위치: {selectedChar.floor}층</p>
                  </div>
                  
                  <div className="flex gap-4">
                     <button 
                       onClick={() => handleInvestigate(selectedChar)}
                       disabled={selectedChar.energy <= 0 || state.combatActive}
                       className={`px-6 py-3 border-2 font-bold uppercase tracking-widest flex items-center gap-2
                         ${selectedChar.energy > 0 && !state.combatActive
                           ? 'border-burgundy-700 hover:bg-burgundy-700 hover:text-white' 
                           : 'border-gray-500 opacity-50 cursor-not-allowed'}
                       `}
                     >
                       <Footprints size={18} /> 조사하기
                     </button>
                     <button 
                        onClick={() => setState(prev => ({...prev, view: 'shop'}))}
                        className="px-6 py-3 border-2 border-stone-500 hover:bg-stone-700 hover:text-white font-bold uppercase tracking-widest flex items-center gap-2"
                     >
                       <ShoppingBag size={18} /> 편의시설
                     </button>
                  </div>
               </div>
            ) : (
               <div className="text-center opacity-50 py-4 italic">행동할 투숙객 카드를 선택하세요.</div>
            )}
         </div>
      </div>

      {/* Right Col: Logs & Inventory */}
      <div className="space-y-6 flex flex-col h-full">
         {/* Action Log */}
         <div className={`flex-1 border p-4 overflow-hidden flex flex-col ${isDarkMode ? 'bg-black border-stone-800' : 'bg-white border-stone-300'}`}>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-3 border-b pb-2">호텔 기록</h3>
            <div className="flex-1 overflow-y-auto space-y-2 text-sm custom-scrollbar pr-2">
               {state.logs.map(log => (
                 <div key={log.id} className={`p-2 border-l-2 text-xs md:text-sm font-body
                   ${log.type === 'danger' ? 'border-red-600 bg-red-900/10 text-red-700 dark:text-red-400' : ''}
                   ${log.type === 'success' ? 'border-green-600 bg-green-900/10 text-green-700 dark:text-green-400' : ''}
                   ${log.type === 'combat' ? 'border-orange-600 bg-orange-900/10 font-bold' : ''}
                   ${log.type === 'info' ? 'border-stone-400 opacity-80' : ''}
                 `}>
                   <span className="opacity-50 mr-2">[{log.day}일차]</span>
                   {log.message}
                 </div>
               ))}
            </div>
         </div>

         {/* Shared Inventory */}
         <div className={`h-48 border p-4 overflow-y-auto ${isDarkMode ? 'bg-stone-900' : 'bg-white'}`}>
             <h3 className="font-bold text-sm uppercase tracking-widest mb-3 border-b pb-2">보급품</h3>
             <div className="grid grid-cols-2 gap-2">
                {state.inventory.map((item, idx) => (
                   <div key={item.id} className="text-xs p-1 border flex justify-between items-center group">
                      <span>{item.name}</span>
                      {selectedChar && item.type === 'consumable' && (
                        <button 
                          onClick={() => useItem(selectedChar.id, idx)}
                          className="opacity-0 group-hover:opacity-100 bg-green-700 text-white px-1 rounded"
                        >사용</button>
                      )}
                   </div>
                ))}
                {state.inventory.length === 0 && <span className="text-xs opacity-50 italic">아이템이 없습니다. 상점을 방문하세요.</span>}
             </div>
         </div>

         {/* End Day Button */}
         <button 
           onClick={advanceDay}
           disabled={state.combatActive}
           className={`w-full py-4 bg-stone-800 text-white font-serif text-xl hover:bg-red-900 transition-colors uppercase tracking-[0.2em]
              ${state.combatActive ? 'opacity-50 cursor-not-allowed' : ''}
           `}
         >
            <BedDouble className="inline mr-2" /> 하루 끝내기
         </button>
      </div>

      {/* Combat Modal Overlay */}
      {state.combatActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className={`max-w-md w-full p-6 border-4 border-double border-red-800 shadow-2xl relative animate-pulse-slow
              ${isDarkMode ? 'bg-stone-950 text-red-500' : 'bg-white text-red-900'}
           `}>
              <div className="text-center mb-6">
                 <ShieldAlert size={48} className="mx-auto mb-2 text-red-600" />
                 <h2 className="text-3xl font-serif font-bold uppercase">전투 개시</h2>
                 <p className="mt-2 text-lg">{state.activeCombatEnemies[0]?.name}</p>
                 <div className="text-4xl font-bold my-4">{state.activeCombatEnemies[0]?.hp} HP</div>
              </div>

              <div className="mb-6">
                <p className="font-bold text-sm uppercase mb-2">대응 팀:</p>
                {state.characters.filter(c => state.activeCombatCharacterIds.includes(c.id)).map(c => (
                  <div key={c.id} className="flex justify-between text-sm border-b border-red-900/30 py-1">
                    <span>{c.name} ({c.job})</span>
                    <span>{c.hp} HP</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={resolveCombat}
                className="w-full py-3 bg-red-900 text-white font-bold uppercase tracking-widest hover:bg-red-700"
              >
                싸운다 / 턴 진행
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default GameMain;