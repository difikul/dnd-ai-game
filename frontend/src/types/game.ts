/**
 * Game Types for D&D AI Application
 * TypeScript interfaces for game session, messages, and game state
 */

import type { Character } from './character'
import type { AtmosphereData } from './atmosphere'

// Game Session Interface
export interface GameSession {
  id: string
  sessionToken: string
  characterId: string
  currentLocation: string
  questLog: QuestLog
  worldState: WorldState
  isActive: boolean
  lastPlayedAt: Date
  createdAt: Date
  updatedAt: Date
}

// Quest Log Interface
export interface QuestLog {
  activeQuests: Quest[]
  completedQuests: Quest[]
}

// Quest Interface
export interface Quest {
  id: string
  title: string
  description: string
  objectives: QuestObjective[]
  reward?: string
  status: 'active' | 'completed' | 'failed'
}

// Quest Objective Interface
export interface QuestObjective {
  id: string
  description: string
  completed: boolean
}

// World State Interface
export interface WorldState {
  location: string
  time: string
  weather?: string
  nearbyNPCs?: string[]
  availableActions?: string[]
  [key: string]: any // Allow for dynamic world state properties
}

// Message Role Type
export type MessageRole = 'player' | 'narrator' | 'system'

// Message Interface
export interface Message {
  id: string
  sessionId?: string
  role: MessageRole
  content: string
  metadata?: MessageMetadata
  createdAt: Date
}

// Dice Requirement Interface (from AI)
export interface DiceRequirement {
  notation: string          // "1d20+5"
  skillName?: string         // "perception", "insight", "attack"
  difficultyClass?: number   // 15
  description?: string       // "Hod na vnímání"
}

// Message Metadata Interface
export interface MessageMetadata {
  diceRolls?: DiceRoll[]
  diceRequirement?: DiceRequirement  // AI požaduje hod kostkou
  skillCheck?: SkillCheck
  combat?: CombatEvent
  npcInteraction?: NPCInteraction
  [key: string]: any // Allow for additional metadata
}

// Dice Roll Interface
export interface DiceRoll {
  notation: string // e.g., "1d20+5"
  total: number // Celkový výsledek hodu (align s backendem)
  rolls: number[]
  modifier: number
  type?: 'attack' | 'damage' | 'skill' | 'saving-throw'
  sides?: number // Počet stran kostky (d20 → 20)
  count?: number // Počet kostek (3d6 → 3)
  advantage?: boolean
  disadvantage?: boolean
}

// Skill Check Interface
export interface SkillCheck {
  skill: string
  dc: number // Difficulty Class
  result: number
  success: boolean
}

// Combat Event Interface
export interface CombatEvent {
  type: 'attack' | 'damage' | 'heal' | 'status-effect'
  source: string
  target?: string
  value?: number
  statusEffect?: string
}

// NPC Interaction Interface
export interface NPCInteraction {
  npcName: string
  npcId?: string
  interactionType: 'dialogue' | 'trade' | 'combat' | 'quest'
}

// Game State (complete state including session, character, messages)
export interface GameState {
  session: GameSession
  character: Character
  messages: Message[]
}

// Start Game Request
export interface StartGameRequest {
  characterId: string
}

// Start Game Response (matches backend response structure)
export interface StartGameResponse {
  sessionId: string
  sessionToken: string
  narratorMessage: string
  initialNarrative?: string // Alias for narratorMessage
  character: {
    id: string
    currentLocation: string
  }
}

// Send Action Request
export interface SendActionRequest {
  action: string
  characterId: string
}

// HP Change Data (from backend HP auto-update)
export interface HPChangeData {
  amount: number          // Amount of HP change (negative = damage, positive = healing)
  newHP: number           // New HP value after change
  maxHP: number           // Maximum HP for reference
  source: 'pattern' | 'text'  // How it was detected by backend
}

// XP Change Data (from backend XP auto-update)
export interface XPChangeData {
  amount: number          // Amount of XP gained
  newXP: number           // New total XP
  nextLevelXP: number     // XP required for next level
  source: 'pattern' | 'text'  // How it was detected by backend
  shouldLevelUp: boolean  // True if character reached level threshold
}

// Level Up Data (from backend level-up processing)
export interface LevelUpData {
  newLevel: number        // New character level
  hpGained: number        // HP gained from level up
  newMaxHP: number        // New maximum HP
  abilityScoreImprovement: boolean  // True if ASI available at this level
}

// Item Gain Data (from backend AI [ITEM-GAIN] parsing)
export interface ItemGainData {
  name: string
  type: string            // weapon, armor, potion, accessory, misc
  rarity: string          // common, uncommon, rare, very_rare, legendary
  description?: string
  damage?: string
  armorValue?: number
  quantity?: number
  statBonuses?: {
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

// Inventory Item (full item from database)
export interface InventoryItem {
  id: string
  characterId: string
  name: string
  type: string
  description?: string
  quantity: number
  equipped: boolean
  damage?: string
  armorValue?: number
  properties?: Record<string, any>
  statBonuses?: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
    acBonus?: number
    hpBonus?: number
  }
  rarity: string
  requiresAttunement: boolean
  isAttuned: boolean
  createdAt: Date
}

// Stat Bonuses from equipped items
export interface EquippedStatBonuses {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  acBonus?: number
  hpBonus?: number
}

// Send Action Response
export interface SendActionResponse {
  response: string
  metadata?: MessageMetadata
  sessionUpdated?: boolean
  worldStateChanged?: boolean
  atmosphere?: AtmosphereData
  hpChange?: HPChangeData    // HP auto-update metadata
  xpChange?: XPChangeData    // XP auto-update metadata
  levelUp?: LevelUpData      // Level-up metadata
  itemGain?: ItemGainData    // Item gain metadata (for player confirmation)
  characterDied?: boolean     // True if character HP reached 0
}

// Load Game Response
export interface LoadGameResponse {
  session: GameSession
  character: Character
  messages: Message[]
}

// Saved Game List Item (for listing saved games)
export interface SavedGameListItem {
  sessionId: string
  sessionToken: string
  characterName: string
  characterLevel: number
  currentLocation: string
  lastPlayedAt: Date
  createdAt: Date
  isActive: boolean
  messageCount: number
}

// Save Game Request
export interface SaveGameRequest {
  note?: string  // sessionId is now passed as URL parameter, not in body
}

// Save Game Response
export interface SaveGameResponse {
  success: boolean
  savedAt: Date
  sessionToken: string
}
