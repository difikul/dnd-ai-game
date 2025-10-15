/**
 * Race Information Constants
 * D&D 5e races with their bonuses and traits
 */

import type { RaceInfo, CharacterRace } from '@/types/character'

export const RACE_DATA: Record<CharacterRace, RaceInfo> = {
  Human: {
    name: 'Human',
    description: 'Všestranní a ambiciózní lidé, kteří se rychle přizpůsobují',
    abilityBonuses: {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      charisma: 1,
    },
    traits: ['Všestrannost', 'Rychlé učení', 'Bonus ke všem statistikám +1'],
    icon: '👤',
  },
  Elf: {
    name: 'Elf',
    description: 'Půvabné a hbitá bytost s magickými schopnostmi',
    abilityBonuses: {
      dexterity: 2,
    },
    traits: [
      'Vidění ve tmě (18m)',
      'Výhoda proti kouzlům Zmámení',
      'Magii nelze uspat',
      'Znalost Percepcí',
    ],
    icon: '🧝',
  },
  Dwarf: {
    name: 'Dwarf',
    description: 'Odolní a houževnatí válečníci s kamenným srdcem',
    abilityBonuses: {
      constitution: 2,
    },
    traits: [
      'Vidění ve tmě (18m)',
      'Odolnost vůči jedu',
      'Znalost Historie (kámen)',
      'Obratnost se zbraněmi',
    ],
    icon: '⛏️',
  },
  Halfling: {
    name: 'Halfling',
    description: 'Malí a šikovní dobrodruhové se štěstím na své straně',
    abilityBonuses: {
      dexterity: 2,
    },
    traits: [
      'Štěstěna (znovu hod na 1)',
      'Statečný (výhoda proti strachu)',
      'Hbitost (průchod skrz větší tvory)',
    ],
    icon: '🍀',
  },
  Dragonborn: {
    name: 'Dragonborn',
    description: 'Dračí potomci s dechem draka a hrdou povahou',
    abilityBonuses: {
      strength: 2,
      charisma: 1,
    },
    traits: [
      'Dračí dech (dle ancestrálního typu)',
      'Odolnost vůči poškození (dle typu)',
      'Síla draka',
    ],
    icon: '🐉',
  },
  Gnome: {
    name: 'Gnome',
    description: 'Malí a inteligentní vynálezci s velkým srdcem',
    abilityBonuses: {
      intelligence: 2,
    },
    traits: [
      'Vidění ve tmě (18m)',
      'Gnómská lstivost (výhoda proti magii)',
      'Vynalézavost',
    ],
    icon: '🎩',
  },
  'Half-Elf': {
    name: 'Half-Elf',
    description: 'Spojení lidské všestrannosti a elfské elegance',
    abilityBonuses: {
      charisma: 2,
      // +1 ke dvěma dalším dle výběru
    },
    traits: [
      'Vidění ve tmě (18m)',
      'Výhoda proti Zmámení',
      'Magii nelze uspat',
      'Všestranné dovednosti',
    ],
    icon: '👥',
  },
  'Half-Orc': {
    name: 'Half-Orc',
    description: 'Síla orka a lidská vytrvalost v jednom',
    abilityBonuses: {
      strength: 2,
      constitution: 1,
    },
    traits: [
      'Vidění ve tmě (18m)',
      'Neúnavná vytrvalost (1 HP místo 0)',
      'Kruté útoky (extra kostka)',
    ],
    icon: '💪',
  },
  Tiefling: {
    name: 'Tiefling',
    description: 'Potomci démonů s vrozenou magií a temným šarmem',
    abilityBonuses: {
      charisma: 2,
      intelligence: 1,
    },
    traits: [
      'Vidění ve tmě (18m)',
      'Ohnivá odolnost',
      'Vrozená kouzla (Thaumaturgy)',
      'Peklo v krvi',
    ],
    icon: '😈',
  },
}

/**
 * Get race information by name
 */
export function getRaceInfo(race: CharacterRace): RaceInfo {
  return RACE_DATA[race]
}

/**
 * Get all available races
 */
export function getAllRaces(): RaceInfo[] {
  return Object.values(RACE_DATA)
}
