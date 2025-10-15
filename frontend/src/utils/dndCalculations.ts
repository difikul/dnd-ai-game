/**
 * D&D Calculations Utilities
 * Helper functions for ability modifiers, HP, AC, and other game mechanics
 */

import type { AbilityScores, CharacterClass, AbilityScoreName } from '@/types/character'

/**
 * Calculate ability modifier from ability score
 * Formula: (score - 10) / 2, rounded down
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Format modifier for display (+2, -1, etc.)
 */
export function formatModifier(modifier: number): string {
  if (modifier >= 0) {
    return `+${modifier}`
  }
  return modifier.toString()
}

/**
 * Calculate proficiency bonus based on character level
 */
export function calculateProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2
}

/**
 * Calculate max HP for a character class at level 1
 */
export function calculateMaxHP(
  characterClass: CharacterClass,
  constitutionModifier: number
): number {
  const hitDiceMap: Record<CharacterClass, number> = {
    Barbarian: 12,
    Bard: 8,
    Cleric: 8,
    Druid: 8,
    Fighter: 10,
    Monk: 8,
    Paladin: 10,
    Ranger: 10,
    Rogue: 8,
    Sorcerer: 6,
    Warlock: 8,
    Wizard: 6,
  }

  const hitDice = hitDiceMap[characterClass]
  return hitDice + constitutionModifier
}

/**
 * Calculate base Armor Class (10 + Dexterity modifier)
 */
export function calculateBaseAC(dexterityModifier: number): number {
  return 10 + dexterityModifier
}

/**
 * Validate ability score (must be between 3 and 20 for standard rules)
 */
export function isValidAbilityScore(score: number): boolean {
  return score >= 3 && score <= 20
}

/**
 * Calculate total point buy cost for ability scores
 * Standard Point Buy: 27 points, costs vary by score
 */
export function calculatePointBuyCost(scores: AbilityScores): number {
  const costMap: Record<number, number> = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9,
  }

  let totalCost = 0

  Object.values(scores).forEach((score) => {
    if (score < 8 || score > 15) {
      totalCost = Infinity // Invalid for point buy
    } else {
      totalCost += costMap[score] || 0
    }
  })

  return totalCost
}

/**
 * Get standard array for ability scores
 */
export function getStandardArray(): number[] {
  return [15, 14, 13, 12, 10, 8]
}

/**
 * Get default ability scores (all 10s)
 */
export function getDefaultAbilityScores(): AbilityScores {
  return {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  }
}

/**
 * Get ability score label for display
 */
export function getAbilityLabel(ability: AbilityScoreName): string {
  const labelMap: Record<AbilityScoreName, string> = {
    strength: 'STR',
    dexterity: 'DEX',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'WIS',
    charisma: 'CHA',
  }

  return labelMap[ability]
}

/**
 * Get ability score full name
 */
export function getAbilityFullName(ability: AbilityScoreName): string {
  const nameMap: Record<AbilityScoreName, string> = {
    strength: 'Síla',
    dexterity: 'Obratnost',
    constitution: 'Odolnost',
    intelligence: 'Inteligence',
    wisdom: 'Moudrost',
    charisma: 'Charisma',
  }

  return nameMap[ability]
}

/**
 * Get class primary abilities
 */
export function getClassPrimaryAbilities(characterClass: CharacterClass): AbilityScoreName[] {
  const primaryAbilitiesMap: Record<CharacterClass, AbilityScoreName[]> = {
    Barbarian: ['strength', 'constitution'],
    Bard: ['charisma'],
    Cleric: ['wisdom'],
    Druid: ['wisdom'],
    Fighter: ['strength', 'dexterity'],
    Monk: ['dexterity', 'wisdom'],
    Paladin: ['strength', 'charisma'],
    Ranger: ['dexterity', 'wisdom'],
    Rogue: ['dexterity'],
    Sorcerer: ['charisma'],
    Warlock: ['charisma'],
    Wizard: ['intelligence'],
  }

  return primaryAbilitiesMap[characterClass]
}

/**
 * Calculate experience needed for next level
 */
export function experienceForLevel(level: number): number {
  const xpTable: Record<number, number> = {
    1: 0,
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000,
  }

  return xpTable[level] || 0
}
