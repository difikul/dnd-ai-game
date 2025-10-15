/**
 * D&D specific types and interfaces
 */

export type DiceNotation = string // e.g., "1d20+5", "2d6", "1d8+3"

export interface DiceRoll {
  notation: string
  rolls: number[]
  modifier: number
  total: number
  type?: string // e.g., "attack", "damage", "saving throw"
}

export interface DiceRollRequest {
  notation: DiceNotation
  advantage?: boolean
  disadvantage?: boolean
  type?: string
}

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

export interface CharacterStats {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface CharacterModifiers {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface CombatStats {
  hitPoints: number
  maxHitPoints: number
  armorClass: number
  initiative: number
}

export interface Quest {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'failed'
  objectives: QuestObjective[]
}

export interface QuestObjective {
  id: string
  text: string
  completed: boolean
}

export interface WorldState {
  reputation?: Record<string, number>
  completedEvents?: string[]
  gameTime?: string
  [key: string]: any
}

export interface GameContext {
  currentLocation: string
  questLog: Quest[]
  worldState: WorldState
  recentEvents?: string[]
}

export interface MessageMetadata {
  timestamp?: string
  diceRolls?: DiceRoll[]
  combat?: CombatInfo
  [key: string]: any
}

export interface CombatInfo {
  inCombat: boolean
  enemies?: Enemy[]
  initiative?: number[]
  currentTurn?: number
}

export interface Enemy {
  id: string
  name: string
  hp: number
  maxHp: number
  ac: number
  damage: string
}

export type MessageRole = 'player' | 'narrator' | 'system'

export interface NarratorResponse {
  content: string
  requiresDiceRoll?: boolean
  diceRollType?: string
  suggestedActions?: string[]
}
