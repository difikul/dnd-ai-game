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

export interface DiceRequirement {
  notation: string          // "1d20+5"
  skillName?: string         // "perception", "insight", "attack"
  difficultyClass?: number   // 15
  description?: string       // "Hod na vnímání"
}

export interface NarratorResponse {
  content: string
  requiresDiceRoll?: boolean
  diceRollType?: string
  diceRequirements?: DiceRequirement
  suggestedActions?: string[]
}

export interface HPChangeResult {
  change: number                      // Amount of HP change (negative = damage, positive = healing)
  source: 'pattern' | 'text' | null   // How it was detected
  confidence: number                  // 0-1, how confident we are in the parsing
  raw: string | null                  // Raw matched text for debugging
}

export interface XPChangeResult {
  gain: number                        // Amount of XP gained (always positive or 0)
  source: 'pattern' | 'text' | null   // How it was detected
  confidence: number                  // 0-1, how confident we are in the parsing
  raw: string | null                  // Raw matched text for debugging
}

export interface ItemGainResult {
  found: boolean                      // Whether an item was found in the text
  item: {
    name: string
    type: string                      // weapon, armor, potion, accessory, misc
    rarity: string                    // common, uncommon, rare, very_rare, legendary
    description?: string
    damage?: string                   // For weapons: "1d8+1"
    armorValue?: number               // For armor
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
  } | null
  confidence: number                  // 0-1, how confident we are in the parsing
  raw: string | null                  // Raw matched text for debugging
}
