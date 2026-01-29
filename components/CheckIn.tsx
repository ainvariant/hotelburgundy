import React, { useState } from 'react';
import { Character, Gender, Job, Personality } from '../types';
import { calculateMaxHp, getStartingItems } from '../utils';
import { Plus, User, Trash2, Key } from 'lucide-react';

interface CheckInProps {
  onStartGame: (chars: Character[]) => void;
  isDarkMode: boolean;
}

const CheckIn: React.FC<CheckInProps> = ({ onStartGame, isDarkMode }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<Gender>(Gender.Male);
  const [job, setJob] = useState<Job>(Job.Civilian);
  const [personality, setPersonality] = useState<Personality>(Personality.Calm);
  const [roomNumber, setRoomNumber] = useState<number>(201);

  const canAdd = name.trim().length > 0;
  
  // Validation: Max 2 per room
  const occupants = characters.filter(c => c.roomNumber === roomNumber).length;
  const isRoomFull = occupants >= 2;

  const handleAddCharacter = () => {
    if (!canAdd || isRoomFull) return;

    const maxHp = calculateMaxHp(age);
    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      age,
      gender,
      job,
      personality,
      roomNumber,
      floor: Math.floor(roomNumber / 100), // 201 -> 2
      hp: maxHp,
      maxHp,
      energy: 3,
      isMissing: false,
      inventory: getStartingItems(job)
    };

    setCharacters([...characters, newChar]);
    setName('');
    // Keep other settings for convenience
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h2 className={`text-4xl font-serif mb-4 ${isDarkMode ? 'text-burgundy-500' : 'text-burgundy-900'}`}>체크인 (Check-In)</h2>
        <p className="italic opacity-80">엘리베이터에 탑승하기 전, 모든 투숙객 정보를 등록해 주십시오.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <div className={`p-6 border rounded-sm shadow-lg ${isDarkMode ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'}`}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><User size={20}/> 투숙객 정보</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm uppercase tracking-wide opacity-70 mb-1">이름</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full p-2 border-b-2 focus:outline-none focus:border-burgundy-600 bg-transparent
                  ${isDarkMode ? 'border-stone-700 text-stone-200' : 'border-stone-300 text-stone-900'}
                `}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm uppercase tracking-wide opacity-70 mb-1">나이</label>
                <input 
                  type="number" 
                  min="0"
                  max="120"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className={`w-full p-2 border-b-2 focus:outline-none focus:border-burgundy-600 bg-transparent
                    ${isDarkMode ? 'border-stone-700 text-stone-200' : 'border-stone-300 text-stone-900'}
                  `}
                />
                <span className="text-xs opacity-60">체력(HP): {calculateMaxHp(age)}</span>
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wide opacity-70 mb-1">방 번호</label>
                <select 
                  value={roomNumber}
                  onChange={e => setRoomNumber(Number(e.target.value))}
                  className={`w-full p-2 border-b-2 focus:outline-none focus:border-burgundy-600 bg-transparent
                    ${isDarkMode ? 'border-stone-700 text-stone-200' : 'border-stone-300 text-stone-900'}
                  `}
                >
                  {Array.from({ length: 4 }).map((_, floorIdx) => 
                    Array.from({ length: 10 }).map((_, roomIdx) => {
                      const room = (floorIdx + 2) * 100 + (roomIdx + 1);
                      return <option key={room} value={room} className="text-black">{room}호</option>;
                    })
                  )}
                </select>
                {isRoomFull && <span className="text-xs text-red-500">객실 만실!</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm uppercase tracking-wide opacity-70 mb-1">성별</label>
                 <select 
                   value={gender} 
                   onChange={(e) => setGender(e.target.value as Gender)}
                   className={`w-full p-2 border-b-2 bg-transparent ${isDarkMode ? 'border-stone-700' : 'border-stone-300'}`}
                 >
                   {Object.values(Gender).map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-sm uppercase tracking-wide opacity-70 mb-1">직업</label>
                 <select 
                   value={job} 
                   onChange={(e) => setJob(e.target.value as Job)}
                   className={`w-full p-2 border-b-2 bg-transparent ${isDarkMode ? 'border-stone-700' : 'border-stone-300'}`}
                 >
                   {Object.values(Job).map(j => <option key={j} value={j} className="text-black">{j}</option>)}
                 </select>
              </div>
            </div>

            <div>
               <label className="block text-sm uppercase tracking-wide opacity-70 mb-1">성격</label>
               <select 
                 value={personality} 
                 onChange={(e) => setPersonality(e.target.value as Personality)}
                 className={`w-full p-2 border-b-2 bg-transparent ${isDarkMode ? 'border-stone-700' : 'border-stone-300'}`}
               >
                 {Object.values(Personality).map(p => <option key={p} value={p} className="text-black">{p}</option>)}
               </select>
            </div>

            <button 
              onClick={handleAddCharacter}
              disabled={!canAdd || isRoomFull}
              className={`w-full py-3 mt-4 font-bold uppercase tracking-widest transition-all
                ${!canAdd || isRoomFull 
                  ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                  : 'bg-burgundy-900 text-white hover:bg-burgundy-800 shadow-md'}
              `}
            >
              투숙객 등록
            </button>
          </div>
        </div>

        {/* Guest List */}
        <div className={`p-6 border rounded-sm relative ${isDarkMode ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'}`}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Key size={20}/> 투숙객 명부 ({characters.length})</h3>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {characters.length === 0 && (
              <p className="text-center opacity-40 py-10">등록된 투숙객이 없습니다.</p>
            )}
            {characters.map(char => (
              <div key={char.id} className={`p-3 border flex justify-between items-center group
                ${isDarkMode ? 'border-stone-800 bg-stone-950' : 'border-stone-100 bg-stone-50'}
              `}>
                <div>
                  <div className="font-bold text-lg leading-none">{char.name}</div>
                  <div className="text-xs opacity-60 mt-1 uppercase tracking-wider">
                    {char.roomNumber}호 | {char.job} | {char.age}세
                  </div>
                </div>
                <button onClick={() => removeCharacter(char.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onStartGame(characters)}
            disabled={characters.length === 0}
            className={`w-full py-4 mt-8 font-bold text-xl uppercase tracking-[0.2em] border-2 transition-all
               ${characters.length === 0 
                 ? 'opacity-30 border-gray-500 cursor-not-allowed'
                 : `border-burgundy-900 text-burgundy-900 hover:bg-burgundy-900 hover:text-white
                    ${isDarkMode ? 'border-burgundy-600 text-burgundy-600 hover:bg-burgundy-900 hover:text-white' : ''}
                 `
               }
            `}
          >
            입실 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;