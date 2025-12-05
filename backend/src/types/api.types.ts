/**
 * API request and response types
 */

import { z } from 'zod'
import { DiceNotation } from './dnd.types'
import { AtmosphereData } from './atmosphere.types'

// ============================================================================
// Character API Types
// ============================================================================

// Zod Validation Schemas
export const createCharacterSchema = z.object({
  name: z.string().min(1, 'Jméno je povinné').max(50, 'Jméno může mít maximálně 50 znaků'),
  race: z.enum(['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'], {
    errorMap: () => ({ message: 'Neplatná rasa' })
  }),
  class: z.enum(['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'], {
    errorMap: () => ({ message: 'Neplatná třída' })
  }),
  level: z.number().int().min(1, 'Level musí být minimálně 1').max(20, 'Level může být maximálně 20').default(1).optional(),
  strength: z.number().int().min(3, 'Síla musí být minimálně 3').max(20, 'Síla může být maximálně 20'),
  dexterity: z.number().int().min(3, 'Obratnost musí být minimálně 3').max(20, 'Obratnost může být maximálně 20'),
  constitution: z.number().int().min(3, 'Odolnost musí být minimálně 3').max(20, 'Odolnost může být maximálně 20'),
  intelligence: z.number().int().min(3, 'Inteligence musí být minimálně 3').max(20, 'Inteligence může být maximálně 20'),
  wisdom: z.number().int().min(3, 'Moudrost musí být minimálně 3').max(20, 'Moudrost může být maximálně 20'),
  charisma: z.number().int().min(3, 'Charisma musí být minimálně 3').max(20, 'Charisma může být maximálně 20'),
  background: z.string().max(2000, 'Pozadí může mít maximálně 2000 znaků').optional(),
  avatarUrl: z.string().url('Neplatná URL adresa avatara').optional()
}).strict()

export const updateCharacterSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  hitPoints: z.number().int().min(0).optional(),
  experience: z.number().int().min(0).optional(),
  level: z.number().int().min(1).max(20).optional(),
  background: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional()
}).strict()

export const generateBackstorySchema = z.object({
  name: z.string().min(1, 'Jméno je povinné').max(50, 'Jméno může mít maximálně 50 znaků'),
  race: z.enum(['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'], {
    errorMap: () => ({ message: 'Neplatná rasa' })
  }),
  class: z.enum(['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'], {
    errorMap: () => ({ message: 'Neplatná třída' })
  })
}).strict()

export type CreateCharacterRequest = z.infer<typeof createCharacterSchema>
export type UpdateCharacterRequest = z.infer<typeof updateCharacterSchema>
export type GenerateBackstoryRequest = z.infer<typeof generateBackstorySchema>

// ============================================================================
// Game API Types
// ============================================================================

// Zod Validation Schemas pro Game API
export const startGameSchema = z.object({
  characterId: z.string().uuid('Neplatné UUID postavy'),
  startingLocation: z.string().min(1).max(100).optional()
}).strict()

export const playerActionSchema = z.object({
  action: z.string().min(1, 'Akce nesmí být prázdná').max(500, 'Akce může mít maximálně 500 znaků'),
  characterId: z.string().uuid('Neplatné UUID postavy'),
  diceRollResult: z.number().int().optional() // ✅ Bug #3 fix: Optional dice roll result z frontendu
}).strict()

export const sessionIdParamSchema = z.object({
  id: z.string().uuid('Neplatné UUID session')
})

// TypeScript Types
export type StartGameRequest = z.infer<typeof startGameSchema>
export type PlayerActionRequest = z.infer<typeof playerActionSchema>

export interface StartGameResponse {
  sessionId: string
  sessionToken: string
  narratorMessage: string
  character: any
}

export interface PlayerActionResponse {
  response: string
  requiresDiceRoll?: boolean
  diceType?: string
  metadata?: any
  atmosphere?: AtmosphereData
  hpChange?: {
    amount: number          // Amount of HP change (negative = damage, positive = healing)
    newHP: number           // New HP value after change
    maxHP: number           // Maximum HP for reference
    source: 'pattern' | 'text'  // How it was detected
  }
  xpChange?: {
    amount: number          // Amount of XP gained
    newXP: number           // New total XP
    nextLevelXP: number     // XP required for next level
    source: 'pattern' | 'text'  // How it was detected
    shouldLevelUp: boolean  // True if character reached level threshold
  }
  levelUp?: {
    newLevel: number        // New character level
    hpGained: number        // HP gained from level up
    newMaxHP: number        // New maximum HP
    abilityScoreImprovement: boolean  // True if ASI available at this level
  }
  itemGain?: {              // Item found/acquired by player
    name: string
    type: string            // weapon, armor, potion, accessory, misc
    rarity: string          // common, uncommon, rare, very_rare, legendary
    description?: string
    damage?: string         // For weapons: "1d8+1"
    armorValue?: number     // For armor
    statBonuses?: {         // For magical items
      strength?: number
      dexterity?: number
      constitution?: number
      intelligence?: number
      wisdom?: number
      charisma?: number
      acBonus?: number
      hpBonus?: number
    }
    requiresAttunement?: boolean
  }
  characterDied?: boolean   // True if character HP reached 0
}

export interface GameStateResponse {
  session: any
  character: any
  messages: any[]
}

// ============================================================================
// Narrator API Types
// ============================================================================

export interface GenerateNarratorRequest {
  characterId: string
  playerAction: string
  conversationHistory?: any[]
  gameContext?: any
}

export interface GenerateNarratorResponse {
  response: string
  requiresDiceRoll?: boolean
  metadata?: any
}

// ============================================================================
// Dice API Types
// ============================================================================

export interface RollDiceRequest {
  notation: DiceNotation
  advantage?: boolean
  disadvantage?: boolean
  type?: string
}

export interface RollDiceResponse {
  notation: string
  rolls: number[]
  modifier: number
  total: number
  type?: string
  advantage?: boolean
  disadvantage?: boolean
}

// ============================================================================
// Save/Load API Types
// ============================================================================

export interface SaveGameResponse {
  sessionToken: string
  message: string
}

export interface LoadGameRequest {
  sessionToken: string
}

export interface LoadGameResponse {
  session: any
  character: any
  messages: any[]
}

// ============================================================================
// Generic API Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  timestamp: string
}

// ============================================================================
// Test API Types
// ============================================================================

export interface TestNarratorRequest {
  prompt: string
  characterName?: string
}

export interface TestNarratorResponse {
  response: string
  model: string
  timestamp: string
}

// ============================================================================
// Character Effective Stats Types (BUG-001 fix)
// ============================================================================

/**
 * Efektivní statistiky postavy (základní statistiky + bonusy z vybavení)
 */
export interface EffectiveStats {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

/**
 * Bonusy z nasazeného a propojeného vybavení
 */
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
