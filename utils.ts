import { Character, Gender, Job, Personality, Item, Enemy } from './types';

// Constants
export const MAX_ENERGY = 3;
export const MAX_DAYS = 30;
export const CLUES_NEEDED = 5;
export const STARTING_GOLD = 500;

// Items
export const ITEMS: Record<string, Item> = {
  WATER: { id: 'water', name: '미네랄 워터', type: 'consumable', value: 50, effect: 10, description: '기본적인 수분 보충.' },
  FOOD: { id: 'food', name: '호밀빵', type: 'consumable', value: 100, effect: 20, description: '퍽퍽하지만 배를 채울 수 있다.' },
  MEDKIT: { id: 'medkit', name: '구급 상자', type: 'consumable', value: 300, effect: 50, description: '필수적인 의료 용품.' },
  KNIFE: { id: 'knife', name: '녹슨 칼', type: 'weapon', value: 400, effect: 15, description: '맨주먹보다는 낫다.' },
  BAT: { id: 'bat', name: '야구 방망이', type: 'weapon', value: 600, effect: 25, description: '묵직한 타격감.' },
  CROSS: { id: 'cross', name: '은 십자가', type: 'weapon', value: 1000, effect: 40, description: '부정한 존재에게 효과적이다.' },
  KEY: { id: 'key', name: '마스터 키', type: 'key', value: 5000, effect: 0, description: '옥상으로 가는 문을 연다.' },
};

// Logic: Calculate Max HP based on Age
export const calculateMaxHp = (age: number): number => {
  if (age >= 20 && age <= 39) return 150;
  if (age >= 10 && age <= 19) return 140;
  if (age >= 0 && age <= 9) return 130;
  
  if (age >= 40) {
    // 40-49: 140, 50-59: 130, 60-69: 120...
    const decadesOver30 = Math.floor((age - 30) / 10);
    const penalty = decadesOver30 * 10;
    return Math.max(50, 150 - penalty); // 최소 HP 50
  }
  return 150;
};

// Logic: Generate Enemy
export const generateEnemy = (day: number): Enemy => {
  const types: ('staff' | 'painting' | 'shadow' | 'unknown')[] = ['staff', 'painting', 'shadow', 'unknown'];
  // Day 1: No combat usually, but function exists.
  // Difficulty scales with day
  const baseHp = 30 + (day * 5);
  const baseDmg = 5 + (day * 2);
  const type = types[Math.floor(Math.random() * types.length)];
  
  let name = "알 수 없는 존재";
  if (type === 'staff') name = "빙의된 호텔 직원";
  if (type === 'painting') name = "저주받은 그림";
  if (type === 'shadow') name = "꿈틀거리는 그림자";
  if (type === 'unknown') name = "형언할 수 없는 공포";

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: name,
    hp: baseHp,
    damage: baseDmg,
    type
  };
};

// Logic: Starting Items by Job
export const getStartingItems = (job: Job): Item[] => {
  if (job === Job.Doctor || job === Job.Nurse) {
    return [{ ...ITEMS.MEDKIT }];
  }
  return [];
};

// Logic: Combat Damage Calculation
export const calculatePlayerDamage = (char: Character, enemy: Enemy): number => {
  let damage = 10; // Base damage
  
  // Job bonus
  if (char.job === Job.Soldier) damage += 15;
  if (char.job === Job.Police) damage += 10;

  // Personality bonus
  if (char.personality === Personality.Aggressive) damage *= 1.5;

  // Weapon bonus (simplification: assume highest weapon used)
  const weapon = char.inventory.find(i => i.type === 'weapon');
  if (weapon && weapon.effect) {
    damage += weapon.effect;
  }

  return Math.floor(damage);
};

export const formatCurrency = (amount: number) => `${amount} G`;