/**
 * Class Information Constants
 * D&D 5e character classes with their features
 */

import type { ClassInfo, CharacterClass } from '@/types/character'

export const CLASS_DATA: Record<CharacterClass, ClassInfo> = {
  Barbarian: {
    name: 'Barbarian',
    description: 'Divoký válečník využívající prvotní zuřivost v boji',
    hitDice: 'd12',
    primaryAbilities: ['strength', 'constitution'],
    savingThrows: ['strength', 'constitution'],
    icon: '⚔️',
  },
  Bard: {
    name: 'Bard',
    description: 'Inspirující kouzelník ovládající magii skrze hudbu',
    hitDice: 'd8',
    primaryAbilities: ['charisma'],
    savingThrows: ['dexterity', 'charisma'],
    icon: '🎵',
  },
  Cleric: {
    name: 'Cleric',
    description: 'Boží služebník s léčivými a ochratnými kouzly',
    hitDice: 'd8',
    primaryAbilities: ['wisdom'],
    savingThrows: ['wisdom', 'charisma'],
    icon: '✨',
  },
  Druid: {
    name: 'Druid',
    description: 'Přírodní kouzelník schopný proměňovat se v zvířata',
    hitDice: 'd8',
    primaryAbilities: ['wisdom'],
    savingThrows: ['intelligence', 'wisdom'],
    icon: '🌿',
  },
  Fighter: {
    name: 'Fighter',
    description: 'Mistr bojových technik a všestranný válečník',
    hitDice: 'd10',
    primaryAbilities: ['strength', 'dexterity'],
    savingThrows: ['strength', 'constitution'],
    icon: '🛡️',
  },
  Monk: {
    name: 'Monk',
    description: 'Disciplinovaný bojovník využívající Ki energii',
    hitDice: 'd8',
    primaryAbilities: ['dexterity', 'wisdom'],
    savingThrows: ['strength', 'dexterity'],
    icon: '🥋',
  },
  Paladin: {
    name: 'Paladin',
    description: 'Svatý válečník s božskou přísahou a léčivou silou',
    hitDice: 'd10',
    primaryAbilities: ['strength', 'charisma'],
    savingThrows: ['wisdom', 'charisma'],
    icon: '⚜️',
  },
  Ranger: {
    name: 'Ranger',
    description: 'Stopař a lovec s vazbou na přírodu',
    hitDice: 'd10',
    primaryAbilities: ['dexterity', 'wisdom'],
    savingThrows: ['strength', 'dexterity'],
    icon: '🏹',
  },
  Rogue: {
    name: 'Rogue',
    description: 'Lstivý specialista na skrytost a zákeřné útoky',
    hitDice: 'd8',
    primaryAbilities: ['dexterity'],
    savingThrows: ['dexterity', 'intelligence'],
    icon: '🗡️',
  },
  Sorcerer: {
    name: 'Sorcerer',
    description: 'Kouzelník s vrozenou magickou silou v krvi',
    hitDice: 'd6',
    primaryAbilities: ['charisma'],
    savingThrows: ['constitution', 'charisma'],
    icon: '🔮',
  },
  Warlock: {
    name: 'Warlock',
    description: 'Čaroděj s paktem s nadpřirozenou bytostí',
    hitDice: 'd8',
    primaryAbilities: ['charisma'],
    savingThrows: ['wisdom', 'charisma'],
    icon: '🌙',
  },
  Wizard: {
    name: 'Wizard',
    description: 'Učený kouzelník s rozsáhlými znalostmi magie',
    hitDice: 'd6',
    primaryAbilities: ['intelligence'],
    savingThrows: ['intelligence', 'wisdom'],
    icon: '🧙',
  },
}

/**
 * Get class information by name
 */
export function getClassInfo(characterClass: CharacterClass): ClassInfo {
  return CLASS_DATA[characterClass]
}

/**
 * Get all available classes
 */
export function getAllClasses(): ClassInfo[] {
  return Object.values(CLASS_DATA)
}

/**
 * Get class hit dice value (number only)
 */
export function getClassHitDiceValue(characterClass: CharacterClass): number {
  const hitDice = CLASS_DATA[characterClass].hitDice
  return parseInt(hitDice.replace('d', ''))
}
