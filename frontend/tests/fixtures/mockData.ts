import type { Character } from '@/types/character'
import type { GameSession, Message, DiceRoll, Quest } from '@/types/game'

/**
 * Mock Character Data
 */
export const mockCharacter: Character = {
  id: 'char-123',
  name: 'Gandalf the Grey',
  race: 'Human',
  class: 'Wizard',
  level: 1,
  strength: 8,
  dexterity: 10,
  constitution: 12,
  intelligence: 15,
  wisdom: 13,
  charisma: 14,
  hitPoints: 8,
  maxHitPoints: 8,
  armorClass: 10,
  experience: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

export const mockFighter: Character = {
  ...mockCharacter,
  id: 'char-456',
  name: 'Conan the Barbarian',
  race: 'Human',
  class: 'Fighter',
  strength: 16,
  dexterity: 14,
  constitution: 15,
  intelligence: 10,
  wisdom: 12,
  charisma: 8,
  hitPoints: 13,
  maxHitPoints: 13,
  armorClass: 16
}

export const mockRogue: Character = {
  ...mockCharacter,
  id: 'char-789',
  name: 'Bilbo Baggins',
  race: 'Halfling',
  class: 'Rogue',
  strength: 8,
  dexterity: 16,
  constitution: 12,
  intelligence: 12,
  wisdom: 10,
  charisma: 14,
  hitPoints: 10,
  maxHitPoints: 10,
  armorClass: 14
}

export const mockHighLevelWizard: Character = {
  ...mockCharacter,
  id: 'char-999',
  name: 'Elminster',
  level: 10,
  strength: 10,
  dexterity: 12,
  constitution: 14,
  intelligence: 18,
  wisdom: 16,
  charisma: 14,
  hitPoints: 58,
  maxHitPoints: 58,
  armorClass: 13,
  experience: 48000
}

/**
 * Mock Game Session Data
 */
export const mockGameSession: GameSession = {
  id: 'session-123',
  sessionToken: 'gs_test_token_123',
  characterId: 'char-123',
  currentLocation: 'Bree',
  questLog: {
    activeQuests: [],
    completedQuests: []
  },
  worldState: {
    location: 'Bree',
    time: 'Evening',
    weather: 'Clear'
  },
  isActive: true,
  lastPlayedAt: new Date('2024-01-01T12:00:00.000Z'),
  createdAt: new Date('2024-01-01T10:00:00.000Z'),
  updatedAt: new Date('2024-01-01T12:00:00.000Z')
}

export const mockQuest: Quest = {
  id: 'quest-001',
  title: 'The Lost Ring',
  description: 'Find the magical ring lost in the Misty Mountains',
  objectives: [
    {
      id: 'obj-001',
      description: 'Travel to the Misty Mountains',
      completed: false
    },
    {
      id: 'obj-002',
      description: 'Explore the caves',
      completed: false
    },
    {
      id: 'obj-003',
      description: 'Retrieve the ring',
      completed: false
    }
  ],
  reward: '500 XP and a magic item',
  status: 'active'
}

/**
 * Mock Messages
 */
export const mockNarratorMessage: Message = {
  id: 'msg-001',
  sessionId: 'session-123',
  role: 'narrator',
  content: 'You find yourself at the entrance of a dark cave. The air is cold and damp.',
  createdAt: new Date('2024-01-01T12:00:00.000Z')
}

export const mockPlayerMessage: Message = {
  id: 'msg-002',
  sessionId: 'session-123',
  role: 'player',
  content: 'I light a torch and enter the cave carefully.',
  createdAt: new Date('2024-01-01T12:01:00.000Z')
}

export const mockSystemMessage: Message = {
  id: 'msg-003',
  sessionId: 'session-123',
  role: 'system',
  content: 'Roll for Perception: 1d20 + 3',
  metadata: {
    diceRolls: [
      {
        notation: '1d20+3',
        result: 18,
        rolls: [15],
        modifier: 3,
        type: 'skill'
      }
    ]
  },
  createdAt: new Date('2024-01-01T12:02:00.000Z')
}

/**
 * Mock Dice Rolls
 */
export const mockDiceRoll: DiceRoll = {
  notation: '1d20',
  result: 15,
  rolls: [15],
  modifier: 0
}

export const mockD20WithModifier: DiceRoll = {
  notation: '1d20+5',
  result: 20,
  rolls: [15],
  modifier: 5,
  type: 'attack'
}

export const mockCriticalHit: DiceRoll = {
  notation: '1d20',
  result: 20,
  rolls: [20],
  modifier: 0,
  type: 'attack'
}

export const mockCriticalFail: DiceRoll = {
  notation: '1d20',
  result: 1,
  rolls: [1],
  modifier: 0,
  type: 'attack'
}

export const mockDamageRoll: DiceRoll = {
  notation: '2d6+3',
  result: 12,
  rolls: [5, 4],
  modifier: 3,
  type: 'damage'
}

export const mockAdvantageRoll: DiceRoll = {
  notation: '2d20kh1+2', // Keep highest 1
  result: 19,
  rolls: [17, 8],
  modifier: 2,
  type: 'attack'
}

/**
 * Mock Character Creation Data
 */
export const mockCreateCharacterDto = {
  name: 'Test Character',
  race: 'Human' as const,
  class: 'Fighter' as const,
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8
}

/**
 * Helper function to create mock character with custom properties
 */
export function createMockCharacter(overrides: Partial<Character> = {}): Character {
  return {
    ...mockCharacter,
    ...overrides
  }
}

/**
 * Helper function to create mock game session with custom properties
 */
export function createMockGameSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    ...mockGameSession,
    ...overrides
  }
}

/**
 * Helper function to create mock message with custom properties
 */
export function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: `msg-${Date.now()}`,
    sessionId: 'session-123',
    role: 'player',
    content: 'Test message',
    createdAt: new Date(),
    ...overrides
  }
}

/**
 * Helper function to create mock dice roll with custom properties
 */
export function createMockDiceRoll(overrides: Partial<DiceRoll> = {}): DiceRoll {
  return {
    ...mockDiceRoll,
    ...overrides
  }
}
