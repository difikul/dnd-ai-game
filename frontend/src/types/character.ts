/**
 * Character Types for D&D Application
 * Complete TypeScript interfaces for character management
 */

// Character Races
export const CHARACTER_RACES = [
  'Human',
  'Elf',
  'Dwarf',
  'Halfling',
  'Dragonborn',
  'Gnome',
  'Half-Elf',
  'Half-Orc',
  'Tiefling',
] as const

export type CharacterRace = typeof CHARACTER_RACES[number]

// Character Classes
export const CHARACTER_CLASSES = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
] as const

export type CharacterClass = typeof CHARACTER_CLASSES[number]

// Ability Score Names
export const ABILITY_SCORES = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const

export type AbilityScoreName = typeof ABILITY_SCORES[number]

// Ability Scores Interface
export interface AbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

// ASI (Ability Score Improvement) Types
export interface ASIHistoryEntry {
  level: number
  changes: Partial<AbilityScores>
  appliedAt: string
}

export interface ASIImprovement {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
}

// ASI Levels (D&D 5e standard)
export const ASI_LEVELS = [4, 8, 12, 16, 19] as const

// Effective Stats (BUG-001 fix - bonusy z vybavení)
export interface EffectiveStats {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

// Equipped Bonuses (bonusy z nasazeného a propojeného vybavení)
export interface EquippedBonuses {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  acBonus?: number
  hpBonus?: number
}

// Main Character Interface
export interface Character {
  id: string
  name: string
  race: CharacterRace
  class: CharacterClass
  level: number

  // Ability Scores
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number

  // Combat Stats
  hitPoints: number
  maxHitPoints: number
  armorClass: number

  // Progression
  experience: number

  // ASI (Ability Score Improvement)
  pendingASI: boolean
  asiHistory: ASIHistoryEntry[]

  // Optional Fields
  avatarUrl?: string
  background?: string

  // Efektivní statistiky (základní + bonusy z vybavení) - BUG-001 fix
  effectiveStats?: EffectiveStats

  // Bonusy z vybavení (pro vizuální indikaci)
  equippedBonuses?: EquippedBonuses

  // Metadata
  createdAt: string
  updatedAt: string
}

// Character Creation DTO
export interface CreateCharacterDto {
  name: string
  race: CharacterRace
  class: CharacterClass
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  background?: string
  avatarUrl?: string
}

// Character Update DTO
export interface UpdateCharacterDto {
  name?: string
  level?: number
  hitPoints?: number
  maxHitPoints?: number
  armorClass?: number
  experience?: number
  background?: string
  avatarUrl?: string
}

// Race Info for UI
export interface RaceInfo {
  name: CharacterRace
  description: string
  abilityBonuses: Partial<AbilityScores>
  traits: string[]
  icon: string
}

// Class Info for UI
export interface ClassInfo {
  name: CharacterClass
  description: string
  hitDice: string
  primaryAbilities: AbilityScoreName[]
  savingThrows: AbilityScoreName[]
  icon: string
}

// Character Creation Step
export enum CreationStep {
  NameAndRace = 1,
  Class = 2,
  AbilityScores = 3,
  Background = 4,
}

// Ability Score Generation Method
export enum AbilityScoreMethod {
  PointBuy = 'pointBuy',
  StandardArray = 'standardArray',
  Manual = 'manual',
}

// Character Creation State
export interface CharacterCreationState {
  currentStep: CreationStep
  name: string
  race: CharacterRace | null
  class: CharacterClass | null
  abilityScores: AbilityScores
  abilityScoreMethod: AbilityScoreMethod
  background: string
  avatarUrl: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CharacterListResponse {
  characters: Character[]
  total: number
}
