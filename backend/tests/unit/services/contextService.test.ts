/**
 * Unit Tests - Context Service
 * Testuje sestavování AI kontextu pro Gemini API
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Character, Message, GameSession } from '@prisma/client'
import {
  buildContextForAI,
  summarizeOldMessages,
  getOptimalMessageCount
} from '../../../src/services/contextService'

// Mock Gemini Service
vi.mock('../../../src/services/geminiService', () => ({
  geminiService: {
    summarizeConversation: vi.fn(async (messages: Message[]) => {
      return `Shrnutí ${messages.length} zpráv: Hráč prozkoumává jeskyni a bojuje s gobliny.`
    })
  }
}))

describe('ContextService - AI Context Building', () => {
  let mockCharacter: Character
  let mockSession: GameSession
  let mockMessages: Message[]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock character
    mockCharacter = {
      id: 'char-id',
      name: 'Thorin Oakenshield',
      race: 'Dwarf',
      class: 'Fighter',
      level: 5,
      strength: 18,
      dexterity: 14,
      constitution: 16,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
      hitPoints: 40,
      maxHitPoints: 44,
      armorClass: 16,
      experience: 6500,
      background: 'Exiled prince seeking to reclaim his homeland',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Mock session
    mockSession = {
      id: 'session-id',
      characterId: 'char-id',
      sessionToken: 'gs_token123',
      currentLocation: 'Dark Forest - Ancient Oak',
      questLog: [
        {
          id: 'q1',
          title: 'Find the Lost Sword',
          description: 'Retrieve the legendary blade from the dragon\'s lair',
          completed: false
        }
      ],
      worldState: {
        reputation: {
          elves: 10,
          dwarves: 50
        },
        gameTime: 'Evening, Day 5'
      },
      isActive: true,
      lastPlayedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Mock messages
    mockMessages = [
      {
        id: 'msg-1',
        sessionId: 'session-id',
        role: 'narrator',
        content: 'You enter the dark forest.',
        metadata: null,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 'msg-2',
        sessionId: 'session-id',
        role: 'player',
        content: 'I look around cautiously.',
        metadata: null,
        createdAt: new Date('2024-01-01T10:01:00Z'),
        updatedAt: new Date('2024-01-01T10:01:00Z')
      },
      {
        id: 'msg-3',
        sessionId: 'session-id',
        role: 'narrator',
        content: 'You hear strange noises in the distance.',
        metadata: null,
        createdAt: new Date('2024-01-01T10:02:00Z'),
        updatedAt: new Date('2024-01-01T10:02:00Z')
      }
    ]
  })

  // ============================================================================
  // buildContextForAI Tests
  // ============================================================================

  describe('buildContextForAI', () => {
    it('should build complete context with all sections', () => {
      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      // Character stats section
      expect(context).toContain('## Postava hráče')
      expect(context).toContain('Jméno: Thorin Oakenshield')
      expect(context).toContain('Rasa: Dwarf')
      expect(context).toContain('Třída: Fighter')
      expect(context).toContain('Level: 5')

      // Ability scores
      expect(context).toContain('Síla (STR): 18')
      expect(context).toContain('Obratnost (DEX): 14')
      expect(context).toContain('Odolnost (CON): 16')
      expect(context).toContain('Inteligence (INT): 10')
      expect(context).toContain('Moudrost (WIS): 12')
      expect(context).toContain('Charisma (CHA): 8')

      // Combat stats
      expect(context).toContain('HP: 40/44')
      expect(context).toContain('AC: 16')
      expect(context).toContain('XP: 6500')

      // Background
      expect(context).toContain('Background: Exiled prince seeking to reclaim his homeland')

      // Location
      expect(context).toContain('## Aktuální lokace')
      expect(context).toContain('Dark Forest - Ancient Oak')

      // Quest log
      expect(context).toContain('## Questy')
      expect(context).toContain('Find the Lost Sword')

      // World state
      expect(context).toContain('## Stav světa')
      expect(context).toContain('reputation')

      // Conversation history
      expect(context).toContain('## Historie konverzace')
      expect(context).toContain('[Vypravěč]: You enter the dark forest.')
      expect(context).toContain('[Hráč]: I look around cautiously.')
    })

    it('should handle character without background', () => {
      mockCharacter.background = null

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('## Postava hráče')
      expect(context).not.toContain('Background:')
    })

    it('should handle empty quest log', () => {
      mockSession.questLog = []

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('## Questy')
      expect(context).toContain('Žádné aktivní questy.')
    })

    it('should handle null quest log', () => {
      mockSession.questLog = null as any

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('## Questy')
      expect(context).toContain('Žádné aktivní questy.')
    })

    it('should handle empty world state', () => {
      mockSession.worldState = {}

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).not.toContain('## Stav světa')
    })

    it('should handle null world state', () => {
      mockSession.worldState = null as any

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).not.toContain('## Stav světa')
    })

    it('should handle empty message history', () => {
      const context = buildContextForAI(mockCharacter, [], mockSession)

      expect(context).toContain('## Historie konverzace')
      expect(context).toContain('Žádné předchozí zprávy.')
    })

    it('should format multiple quests correctly', () => {
      mockSession.questLog = [
        {
          id: 'q1',
          title: 'Quest 1',
          description: 'Description 1',
          completed: false
        },
        {
          id: 'q2',
          title: 'Quest 2',
          description: 'Description 2',
          completed: true
        },
        {
          id: 'q3',
          title: 'Quest 3',
          description: 'Description 3',
          completed: false
        }
      ]

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('○ 1. Quest 1')
      expect(context).toContain('✓ 2. Quest 2')
      expect(context).toContain('○ 3. Quest 3')
      expect(context).toContain('Description 1')
      expect(context).toContain('Description 2')
      expect(context).toContain('Description 3')
    })

    it('should handle quest without title', () => {
      mockSession.questLog = [
        {
          id: 'q1',
          description: 'Some description',
          completed: false
        } as any
      ]

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('Bez názvu')
      expect(context).toContain('Some description')
    })

    it('should handle quest without description', () => {
      mockSession.questLog = [
        {
          id: 'q1',
          title: 'Quest Title',
          completed: false
        } as any
      ]

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('Quest Title')
    })

    it('should handle complex world state with nested objects', () => {
      mockSession.worldState = {
        reputation: {
          elves: 50,
          dwarves: -10,
          humans: 25
        },
        completedEvents: ['dragon_slain', 'king_saved'],
        gameTime: '10:30 AM, Day 15',
        customData: {
          nested: {
            value: true
          }
        }
      }

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('## Stav světa')
      expect(context).toContain('reputation')
      expect(context).toContain('completedEvents')
      expect(context).toContain('gameTime')
      expect(context).toContain('customData')
    })

    it('should format message roles correctly', () => {
      const messagesWithAllRoles: Message[] = [
        {
          id: 'msg-1',
          sessionId: 'session-id',
          role: 'player',
          content: 'Player message',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'msg-2',
          sessionId: 'session-id',
          role: 'narrator',
          content: 'Narrator message',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'msg-3',
          sessionId: 'session-id',
          role: 'system',
          content: 'System message',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const context = buildContextForAI(mockCharacter, messagesWithAllRoles, mockSession)

      expect(context).toContain('[Hráč]: Player message')
      expect(context).toContain('[Vypravěč]: Narrator message')
      expect(context).toContain('[Systém]: System message')
    })

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(5000)
      const messagesWithLong: Message[] = [
        {
          id: 'msg-1',
          sessionId: 'session-id',
          role: 'player',
          content: longMessage,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const context = buildContextForAI(mockCharacter, messagesWithLong, mockSession)

      expect(context).toContain(longMessage)
    })

    it('should handle special characters in messages', () => {
      const specialMessages: Message[] = [
        {
          id: 'msg-1',
          sessionId: 'session-id',
          role: 'player',
          content: 'I say "Hello!" & <wave>',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const context = buildContextForAI(mockCharacter, specialMessages, mockSession)

      expect(context).toContain('I say "Hello!" & <wave>')
    })

    it('should display correct message count in history', () => {
      const manyMessages = Array.from({ length: 15 }, (_, i) => ({
        id: `msg-${i}`,
        sessionId: 'session-id',
        role: 'player' as const,
        content: `Message ${i}`,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const context = buildContextForAI(mockCharacter, manyMessages, mockSession)

      expect(context).toContain('Historie konverzace (posledních 15 zpráv)')
    })

    it('should handle character at full HP', () => {
      mockCharacter.hitPoints = 44
      mockCharacter.maxHitPoints = 44

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('HP: 44/44')
    })

    it('should handle character at zero HP', () => {
      mockCharacter.hitPoints = 0

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('HP: 0/44')
    })

    it('should handle level 1 character', () => {
      mockCharacter.level = 1
      mockCharacter.experience = 0

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('Level: 1')
      expect(context).toContain('XP: 0')
    })

    it('should handle level 20 character', () => {
      mockCharacter.level = 20
      mockCharacter.experience = 355000

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('Level: 20')
      expect(context).toContain('XP: 355000')
    })
  })

  // ============================================================================
  // summarizeOldMessages Tests
  // ============================================================================

  describe('summarizeOldMessages', () => {
    it('should call gemini service to summarize messages', async () => {
      const messagesToSummarize: Message[] = [
        {
          id: 'msg-1',
          sessionId: 'session-id',
          role: 'player',
          content: 'I enter the dungeon',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'msg-2',
          sessionId: 'session-id',
          role: 'narrator',
          content: 'You see goblins',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const summary = await summarizeOldMessages(messagesToSummarize)

      expect(summary).toContain('Shrnutí 2 zpráv')
      expect(summary).toContain('jeskyni')
      expect(summary).toContain('gobliny')
    })

    it('should handle empty messages array', async () => {
      const summary = await summarizeOldMessages([])

      expect(summary).toBe('Žádné zprávy k shrnutí.')
    })

    it('should handle gemini service error', async () => {
      const { geminiService } = await import('../../../src/services/geminiService')
      vi.mocked(geminiService.summarizeConversation).mockRejectedValueOnce(new Error('API error'))

      const messagesToSummarize: Message[] = [
        {
          id: 'msg-1',
          sessionId: 'session-id',
          role: 'player',
          content: 'Test',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      await expect(summarizeOldMessages(messagesToSummarize)).rejects.toThrow('Nepodařilo se vytvořit shrnutí starých zpráv')
    })

    it('should handle large number of messages', async () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        sessionId: 'session-id',
        role: 'player' as const,
        content: `Message ${i}`,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const summary = await summarizeOldMessages(manyMessages)

      expect(summary).toContain('Shrnutí 100 zpráv')
    })
  })

  // ============================================================================
  // getOptimalMessageCount Tests
  // ============================================================================

  describe('getOptimalMessageCount', () => {
    it('should return all messages when total is 50 or less', () => {
      const result = getOptimalMessageCount(50)

      expect(result).toEqual({
        recentCount: 50,
        shouldSummarize: false,
        summarizeCount: 0
      })
    })

    it('should return all messages when total is less than 50', () => {
      const result = getOptimalMessageCount(30)

      expect(result).toEqual({
        recentCount: 30,
        shouldSummarize: false,
        summarizeCount: 0
      })
    })

    it('should return 20 recent messages when total is between 51-100', () => {
      const result = getOptimalMessageCount(75)

      expect(result).toEqual({
        recentCount: 20,
        shouldSummarize: false,
        summarizeCount: 0
      })
    })

    it('should return exactly 100 messages without summarization', () => {
      const result = getOptimalMessageCount(100)

      expect(result).toEqual({
        recentCount: 20,
        shouldSummarize: false,
        summarizeCount: 0
      })
    })

    it('should return 10 recent + summarize 50 old when total is over 100', () => {
      const result = getOptimalMessageCount(150)

      expect(result).toEqual({
        recentCount: 10,
        shouldSummarize: true,
        summarizeCount: 50
      })
    })

    it('should handle exactly 101 messages', () => {
      const result = getOptimalMessageCount(101)

      expect(result).toEqual({
        recentCount: 10,
        shouldSummarize: true,
        summarizeCount: 50
      })
    })

    it('should handle very large message counts', () => {
      const result = getOptimalMessageCount(1000)

      expect(result).toEqual({
        recentCount: 10,
        shouldSummarize: true,
        summarizeCount: 50
      })
    })

    it('should handle exactly 1 message', () => {
      const result = getOptimalMessageCount(1)

      expect(result).toEqual({
        recentCount: 1,
        shouldSummarize: false,
        summarizeCount: 0
      })
    })

    it('should handle 0 messages', () => {
      const result = getOptimalMessageCount(0)

      expect(result).toEqual({
        recentCount: 0,
        shouldSummarize: false,
        summarizeCount: 0
      })
    })

    it('should handle exactly 51 messages (boundary)', () => {
      const result = getOptimalMessageCount(51)

      expect(result).toEqual({
        recentCount: 20,
        shouldSummarize: false,
        summarizeCount: 0
      })
    })
  })

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('ContextService - Edge Cases', () => {
    it('should handle malformed quest log gracefully', () => {
      mockSession.questLog = 'invalid json' as any

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('## Questy')
      expect(context).toContain('Žádné aktivní questy.')
    })

    it('should handle malformed world state gracefully', () => {
      mockSession.worldState = 'invalid json' as any

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      // Should not crash and should not include world state section
      expect(context).toContain('## Postava hráče')
    })

    it('should handle circular references in world state', () => {
      const circular: any = { a: 1 }
      circular.self = circular
      mockSession.worldState = circular

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      // Should handle gracefully without crashing
      expect(context).toContain('## Postava hráče')
    })

    it('should handle unicode characters in messages', () => {
      const unicodeMessages: Message[] = [
        {
          id: 'msg-1',
          sessionId: 'session-id',
          role: 'player',
          content: '你好! Привет! مرحبا! 🐉⚔️',
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const context = buildContextForAI(mockCharacter, unicodeMessages, mockSession)

      expect(context).toContain('你好! Привет! مرحبا! 🐉⚔️')
    })

    it('should handle very long character name', () => {
      mockCharacter.name = 'A'.repeat(200)

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('A'.repeat(200))
    })

    it('should handle very long location name', () => {
      mockSession.currentLocation = 'L'.repeat(500)

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('L'.repeat(500))
    })

    it('should handle negative stats gracefully', () => {
      mockCharacter.strength = -5
      mockCharacter.hitPoints = -10

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('Síla (STR): -5')
      expect(context).toContain('HP: -10/')
    })

    it('should handle extremely high stats', () => {
      mockCharacter.strength = 999
      mockCharacter.level = 999
      mockCharacter.experience = 9999999

      const context = buildContextForAI(mockCharacter, mockMessages, mockSession)

      expect(context).toContain('Síla (STR): 999')
      expect(context).toContain('Level: 999')
      expect(context).toContain('XP: 9999999')
    })
  })
})
