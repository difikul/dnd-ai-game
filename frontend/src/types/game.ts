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

// Message Metadata Interface
export interface MessageMetadata {
  diceRolls?: DiceRoll[]
  skillCheck?: SkillCheck
  combat?: CombatEvent
  npcInteraction?: NPCInteraction
  [key: string]: any // Allow for additional metadata
}

// Dice Roll Interface
export interface DiceRoll {
  notation: string // e.g., "1d20+5"
  result: number
  rolls: number[]
  modifier: number
  type?: 'attack' | 'damage' | 'skill' | 'saving-throw'
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

// Send Action Response
export interface SendActionResponse {
  response: string
  metadata?: MessageMetadata
  sessionUpdated?: boolean
  worldStateChanged?: boolean
  atmosphere?: AtmosphereData
}

// Load Game Response
export interface LoadGameResponse {
  session: GameSession
  character: Character
  messages: Message[]
}

// Save Game Request
export interface SaveGameRequest {
  sessionId: string
  note?: string
}

// Save Game Response
export interface SaveGameResponse {
  success: boolean
  savedAt: Date
  sessionToken: string
}
