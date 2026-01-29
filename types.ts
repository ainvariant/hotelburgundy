export enum Gender {
  Male = "남성",
  Female = "여성",
  NonBinary = "논바이너리"
}

export enum Personality {
  Cautious = "신중함", // 안전 중시, 전리품 적음
  Cowardly = "겁쟁이", // 매우 안전, 전리품 매우 적음
  Aggressive = "호전적", // 높은 데미지, 높은 위험
  Curious = "호기심 많음", // 전리품 많음, 함정 확률 높음
  Calm = "차분함", // 균형 잡힘
}

export enum Job {
  Civilian = "민간인",
  Police = "경찰", // 전투 보너스
  Soldier = "군인", // 전투 보너스 ++
  Doctor = "의사", // 의약품 소지
  Nurse = "간호사", // 의약품 소지
  Reporter = "기자", // 단서 발견 보너스
  Student = "학생",
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'consumable' | 'clue' | 'key';
  value: number;
  effect?: number; // HP 회복 또는 데미지
  description: string;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  personality: Personality;
  job: Job;
  roomNumber: number;
  floor: number;
  hp: number;
  maxHp: number;
  energy: number; // 최대 3
  isMissing: boolean;
  inventory: Item[];
}

export interface LogEntry {
  id: string;
  day: number;
  message: string;
  type: 'info' | 'danger' | 'success' | 'combat';
}

export type ViewState = 'checkin' | 'lobby' | 'rooms' | 'shop' | 'rooftop' | 'gameover' | 'victory';

export interface GameState {
  day: number;
  gold: number;
  characters: Character[];
  inventory: Item[]; // 공용 인벤토리
  cluesFound: number;
  isDarkMode: boolean;
  logs: LogEntry[];
  view: ViewState;
  combatActive: boolean;
  activeCombatEnemies: Enemy[];
  activeCombatCharacterIds: string[]; // 전투 중인 캐릭터
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  damage: number;
  type: 'staff' | 'painting' | 'shadow' | 'unknown';
}