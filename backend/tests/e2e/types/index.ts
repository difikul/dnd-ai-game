/**
 * TypeScript Type Definitions for E2E Tests
 *
 * Sdílené typy pro Playwright E2E testy.
 */

// ============================================================================
// Test Context Types
// ============================================================================

export interface TestContext {
  authToken: string
  userId: string
  characterId: string
  sessionId: string
  sessionToken: string
}

export interface TestUser {
  email: string
  username: string
  password: string
  geminiApiKey: string
}

export interface TestCharacter {
  name: string
  race: string
  class: string
  level: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  background?: string
  knownSpells?: Spell[]
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface GameStartResponse {
  sessionId: string
  sessionToken: string
  narratorMessage: string
  character: Character
}

export interface GameActionResponse {
  narratorResponse: string
  requiresDiceRoll?: boolean
  diceRollType?: string
  metadata?: {
    diceRequirement?: string
    [key: string]: any
  }
}

// ============================================================================
// Domain Types
// ============================================================================

export interface User {
  id: string
  email: string
  username: string
  geminiApiKey?: string
  createdAt: string
  updatedAt: string
}

export interface Character {
  id: string
  userId?: string
  name: string
  race: string
  class: string
  level: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  hitPoints: number
  maxHitPoints: number
  armorClass: number
  experience: number
  background?: string
  avatarUrl?: string
  currentLocation?: string
  spellSlots?: SpellSlot[]
  knownSpells?: Spell[]
  inventory?: Item[]
  classFeatures?: ClassFeature[]
  createdAt?: string
  updatedAt?: string
}

export interface GameSession {
  id: string
  userId: string
  characterId: string
  sessionToken: string
  currentLocation: string
  isActive: boolean
  lastPlayedAt: string
  createdAt: string
  updatedAt: string
  messages?: Message[]
  character?: Character
}

export interface Message {
  id: string
  sessionId: string
  role: 'narrator' | 'player' | 'system'
  content: string
  metadata?: any
  createdAt: string
}

export interface SpellSlot {
  id: string
  characterId: string
  level: number
  current: number
  maximum: number
}

export interface Spell {
  id?: string
  characterId?: string
  name: string
  level: number
  school: string
  castingTime?: string
  range?: string
  components?: string
  duration?: string
  description?: string
  isPrepared?: boolean
}

export interface Item {
  id: string
  characterId: string
  name: string
  type: string
  quantity: number
  equipped: boolean
  damage?: string
  armorClass?: number
  description?: string
}

export interface ClassFeature {
  id: string
  characterId: string
  name: string
  description: string
  usesPerRest?: number | null
  currentUses?: number | null
}

// ============================================================================
// D&D Specific Types
// ============================================================================

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'

export type AbilityScore = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

export type CharacterClass =
  | 'Barbarian'
  | 'Bard'
  | 'Cleric'
  | 'Druid'
  | 'Fighter'
  | 'Monk'
  | 'Paladin'
  | 'Ranger'
  | 'Rogue'
  | 'Sorcerer'
  | 'Warlock'
  | 'Wizard'

export type CharacterRace =
  | 'Human'
  | 'Elf'
  | 'Dwarf'
  | 'Halfling'
  | 'Dragonborn'
  | 'Gnome'
  | 'Half-Elf'
  | 'Half-Orc'
  | 'Tiefling'

export type SpellSchool =
  | 'Abjuration'
  | 'Conjuration'
  | 'Divination'
  | 'Enchantment'
  | 'Evocation'
  | 'Illusion'
  | 'Necromancy'
  | 'Transmutation'

// ============================================================================
// Test Utility Types
// ============================================================================

export interface TestResult {
  passed: boolean
  duration: number
  error?: string
}

export interface PerformanceMetrics {
  responseTime: number
  databaseQueryTime?: number
  aiResponseTime?: number
}

export interface TestSnapshot {
  timestamp: string
  character: Character
  session: GameSession
  messages: Message[]
  spellSlots: SpellSlot[]
}

// ============================================================================
// Helper Function Types
// ============================================================================

export type SubmitActionFn = (page: any, action: string) => Promise<void>
export type WaitForResponseFn = (page: any, timeout?: number) => Promise<void>
export type GetAPIDataFn<T> = (request: any, ...args: any[]) => Promise<T>
export type AssertionFn = (...args: any[]) => void | Promise<void>
