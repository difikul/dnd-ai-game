/**
 * Unit Tests - Save Service
 * Testuje business logiku pro save/load game funkcionalitu
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PrismaClient, GameSession, Character, Message } from '@prisma/client'

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mockedNanoid12345678')
}))

// Mock Prisma Client - must be declared outside to avoid hoisting issues
vi.mock('../../../src/config/database', () => ({
  prisma: {
    gameSession: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))

import {
  saveGame,
  loadGameByToken,
  listActiveSessions,
  deleteSession,
  regenerateToken
} from '../../../src/services/saveService'

// Get mocked prisma after import
import { prisma as mockPrisma } from '../../../src/config/database'
const mockGameSession = mockPrisma.gameSession as any

describe('SaveService - Token Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // saveGame Tests
  // ============================================================================

  describe('saveGame', () => {
    it('should save game and return existing session token', async () => {
      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_existingToken1234567',
        isActive: true,
        currentLocation: 'Tavern',
        questLog: [],
        worldState: {},
        characterId: 'char-id',
        lastPlayedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue({
        ...mockSession,
        lastPlayedAt: new Date()
      })

      const token = await saveGame('session-id')

      expect(token).toBe('gs_existingToken1234567')
      expect(mockGameSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        select: {
          id: true,
          sessionToken: true,
          isActive: true
        }
      })
      expect(mockGameSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          lastPlayedAt: expect.any(Date)
        }
      })
    })

    it('should throw error when session not found', async () => {
      mockGameSession.findUnique.mockResolvedValue(null)

      await expect(saveGame('non-existent-id')).rejects.toThrow('Herní session nenalezena')
    })

    it('should update lastPlayedAt timestamp', async () => {
      const oldDate = new Date('2024-01-01')
      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_token123',
        isActive: true,
        lastPlayedAt: oldDate
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue({
        ...mockSession,
        lastPlayedAt: new Date()
      })

      const token = await saveGame('session-id')

      expect(mockGameSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          lastPlayedAt: expect.any(Date)
        }
      })

      const updateCall = mockGameSession.update.mock.calls[0][0]
      expect(updateCall.data.lastPlayedAt.getTime()).toBeGreaterThan(oldDate.getTime())
    })

    it('should handle database error gracefully', async () => {
      mockGameSession.findUnique.mockRejectedValue(new Error('Database connection error'))

      await expect(saveGame('session-id')).rejects.toThrow('Database connection error')
    })

    it('should save game for inactive session', async () => {
      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_inactiveToken123',
        isActive: false
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue(mockSession)

      const token = await saveGame('session-id')

      expect(token).toBe('gs_inactiveToken123')
    })
  })

  // ============================================================================
  // loadGameByToken Tests
  // ============================================================================

  describe('loadGameByToken', () => {
    it('should load game session with all relations', async () => {
      const mockCharacter = {
        id: 'char-id',
        name: 'Thorin',
        race: 'Dwarf',
        class: 'Fighter',
        level: 5,
        hitPoints: 40,
        maxHitPoints: 44,
        inventory: [
          { id: 'item-1', name: 'Sword', quantity: 1 }
        ]
      }

      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          content: 'Hello',
          role: 'player',
          sessionId: 'session-id',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: null
        },
        {
          id: 'msg-2',
          content: 'Welcome',
          role: 'narrator',
          sessionId: 'session-id',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          metadata: null
        }
      ]

      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_loadToken123',
        characterId: 'char-id',
        currentLocation: 'Forest',
        questLog: [{ id: 'q1', title: 'Find treasure', completed: false }],
        worldState: { reputation: { elves: 10 } },
        isActive: true,
        lastPlayedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        character: mockCharacter,
        messages: mockMessages
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue(mockSession)

      const result = await loadGameByToken('gs_loadToken123')

      expect(result).toEqual(mockSession)
      expect(result.character.name).toBe('Thorin')
      expect(result.character.inventory).toHaveLength(1)
      expect(result.messages).toHaveLength(2)
      expect(mockGameSession.findUnique).toHaveBeenCalledWith({
        where: { sessionToken: 'gs_loadToken123' },
        include: {
          character: {
            include: {
              inventory: true
            }
          },
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            take: 100
          }
        }
      })
    })

    it('should throw error when token not found', async () => {
      mockGameSession.findUnique.mockResolvedValue(null)

      await expect(loadGameByToken('gs_invalidToken')).rejects.toThrow('Session s tímto tokenem nebyla nalezena')
    })

    it('should update lastPlayedAt on load', async () => {
      const oldDate = new Date('2024-01-01')
      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_token123',
        characterId: 'char-id',
        currentLocation: 'Town',
        questLog: [],
        worldState: {},
        isActive: true,
        lastPlayedAt: oldDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        character: {
          id: 'char-id',
          name: 'Test',
          inventory: []
        },
        messages: []
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue(mockSession)

      await loadGameByToken('gs_token123')

      expect(mockGameSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          lastPlayedAt: expect.any(Date)
        }
      })
    })

    it('should load session with empty message history', async () => {
      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_token123',
        characterId: 'char-id',
        currentLocation: 'Start',
        questLog: [],
        worldState: {},
        isActive: true,
        lastPlayedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        character: {
          id: 'char-id',
          name: 'Test',
          inventory: []
        },
        messages: []
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue(mockSession)

      const result = await loadGameByToken('gs_token123')

      expect(result.messages).toEqual([])
    })

    it('should load session with 100 most recent messages', async () => {
      const mockMessages = Array.from({ length: 150 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'player' as const,
        sessionId: 'session-id',
        createdAt: new Date(2024, 0, i + 1),
        updatedAt: new Date(2024, 0, i + 1),
        metadata: null
      }))

      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_token123',
        characterId: 'char-id',
        currentLocation: 'Town',
        questLog: [],
        worldState: {},
        isActive: true,
        lastPlayedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        character: {
          id: 'char-id',
          name: 'Test',
          inventory: []
        },
        messages: mockMessages.slice(0, 100) // Prisma returns only 100
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue(mockSession)

      const result = await loadGameByToken('gs_token123')

      expect(result.messages).toHaveLength(100)
    })

    it('should handle database error', async () => {
      mockGameSession.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(loadGameByToken('gs_token123')).rejects.toThrow('Database error')
    })

    it('should load session with complex quest log', async () => {
      const complexQuestLog = [
        {
          id: 'q1',
          title: 'Save the village',
          description: 'Defeat the dragon',
          completed: false,
          objectives: [
            { id: 'obj1', text: 'Find dragon lair', completed: true },
            { id: 'obj2', text: 'Defeat dragon', completed: false }
          ]
        }
      ]

      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_token123',
        characterId: 'char-id',
        currentLocation: 'Dragon Lair',
        questLog: complexQuestLog,
        worldState: {},
        isActive: true,
        lastPlayedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        character: {
          id: 'char-id',
          name: 'Hero',
          inventory: []
        },
        messages: []
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue(mockSession)

      const result = await loadGameByToken('gs_token123')

      expect(result.questLog).toEqual(complexQuestLog)
    })

    it('should load session with complex world state', async () => {
      const complexWorldState = {
        reputation: {
          elves: 50,
          dwarves: -10,
          humans: 25
        },
        completedEvents: ['dragon_slain', 'king_saved'],
        gameTime: '10:30 AM, Day 15'
      }

      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_token123',
        characterId: 'char-id',
        currentLocation: 'Capital City',
        questLog: [],
        worldState: complexWorldState,
        isActive: true,
        lastPlayedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        character: {
          id: 'char-id',
          name: 'Hero',
          inventory: []
        },
        messages: []
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue(mockSession)

      const result = await loadGameByToken('gs_token123')

      expect(result.worldState).toEqual(complexWorldState)
    })
  })

  // ============================================================================
  // listActiveSessions Tests
  // ============================================================================

  describe('listActiveSessions', () => {
    it('should return list of active sessions ordered by lastPlayedAt', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          sessionToken: 'gs_token1',
          currentLocation: 'Forest',
          lastPlayedAt: new Date('2024-01-03'),
          createdAt: new Date('2024-01-01'),
          isActive: true,
          character: {
            name: 'Hero 1',
            level: 5
          },
          _count: {
            messages: 25
          }
        },
        {
          id: 'session-2',
          sessionToken: 'gs_token2',
          currentLocation: 'Dungeon',
          lastPlayedAt: new Date('2024-01-02'),
          createdAt: new Date('2024-01-01'),
          isActive: true,
          character: {
            name: 'Hero 2',
            level: 3
          },
          _count: {
            messages: 15
          }
        }
      ]

      mockGameSession.findMany.mockResolvedValue(mockSessions)

      const result = await listActiveSessions()

      expect(result).toHaveLength(2)
      expect(result[0].characterName).toBe('Hero 1')
      expect(result[0].characterLevel).toBe(5)
      expect(result[0].messageCount).toBe(25)
      expect(result[0].currentLocation).toBe('Forest')
      expect(mockGameSession.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true
        },
        include: {
          character: {
            select: {
              name: true,
              level: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          lastPlayedAt: 'desc'
        }
      })
    })

    it('should return empty array when no active sessions exist', async () => {
      mockGameSession.findMany.mockResolvedValue([])

      const result = await listActiveSessions()

      expect(result).toEqual([])
    })

    it('should filter only active sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          sessionToken: 'gs_token1',
          currentLocation: 'Town',
          lastPlayedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          isActive: true,
          character: {
            name: 'Active Hero',
            level: 5
          },
          _count: {
            messages: 10
          }
        }
      ]

      mockGameSession.findMany.mockResolvedValue(mockSessions)

      const result = await listActiveSessions()

      expect(result).toHaveLength(1)
      expect(result[0].isActive).toBe(true)
    })

    it('should handle database error', async () => {
      mockGameSession.findMany.mockRejectedValue(new Error('Database error'))

      await expect(listActiveSessions()).rejects.toThrow('Database error')
    })

    it('should return sessions with correct SavedGameListItem format', async () => {
      const mockSessions = [
        {
          id: 'session-id',
          sessionToken: 'gs_token123',
          currentLocation: 'Forest',
          lastPlayedAt: new Date('2024-01-02'),
          createdAt: new Date('2024-01-01'),
          isActive: true,
          character: {
            name: 'Test Hero',
            level: 7
          },
          _count: {
            messages: 42
          }
        }
      ]

      mockGameSession.findMany.mockResolvedValue(mockSessions)

      const result = await listActiveSessions()

      expect(result[0]).toEqual({
        sessionId: 'session-id',
        sessionToken: 'gs_token123',
        characterName: 'Test Hero',
        characterLevel: 7,
        currentLocation: 'Forest',
        lastPlayedAt: expect.any(Date),
        createdAt: expect.any(Date),
        isActive: true,
        messageCount: 42
      })
    })

    it('should handle sessions with zero messages', async () => {
      const mockSessions = [
        {
          id: 'session-id',
          sessionToken: 'gs_token123',
          currentLocation: 'Start',
          lastPlayedAt: new Date(),
          createdAt: new Date(),
          isActive: true,
          character: {
            name: 'New Hero',
            level: 1
          },
          _count: {
            messages: 0
          }
        }
      ]

      mockGameSession.findMany.mockResolvedValue(mockSessions)

      const result = await listActiveSessions()

      expect(result[0].messageCount).toBe(0)
    })

    it('should handle multiple sessions with different lastPlayedAt', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          sessionToken: 'gs_recent',
          currentLocation: 'Town',
          lastPlayedAt: new Date('2024-01-05'),
          createdAt: new Date('2024-01-01'),
          isActive: true,
          character: { name: 'Recent', level: 10 },
          _count: { messages: 100 }
        },
        {
          id: 'session-2',
          sessionToken: 'gs_old',
          currentLocation: 'Forest',
          lastPlayedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          isActive: true,
          character: { name: 'Old', level: 3 },
          _count: { messages: 5 }
        }
      ]

      mockGameSession.findMany.mockResolvedValue(mockSessions)

      const result = await listActiveSessions()

      expect(result[0].sessionToken).toBe('gs_recent')
      expect(result[1].sessionToken).toBe('gs_old')
    })
  })

  // ============================================================================
  // deleteSession Tests
  // ============================================================================

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_token123'
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.delete.mockResolvedValue(mockSession)

      await deleteSession('session-id')

      expect(mockGameSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        select: {
          id: true,
          sessionToken: true
        }
      })
      expect(mockGameSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-id' }
      })
    })

    it('should throw error when session not found', async () => {
      mockGameSession.findUnique.mockResolvedValue(null)

      await expect(deleteSession('non-existent-id')).rejects.toThrow('Herní session nenalezena')
    })

    it('should cascade delete messages', async () => {
      // Prisma handles CASCADE automatically via schema
      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_token123'
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.delete.mockResolvedValue(mockSession)

      await deleteSession('session-id')

      expect(mockGameSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-id' }
      })
    })

    it('should handle database error during delete', async () => {
      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_token123'
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.delete.mockRejectedValue(new Error('Database error'))

      await expect(deleteSession('session-id')).rejects.toThrow('Database error')
    })

    it('should handle database error during validation', async () => {
      mockGameSession.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(deleteSession('session-id')).rejects.toThrow('Database error')
    })
  })

  // ============================================================================
  // regenerateToken Tests
  // ============================================================================

  describe('regenerateToken', () => {
    it('should regenerate token for existing session', async () => {
      const mockSession = {
        id: 'session-id',
        sessionToken: 'gs_oldToken123'
      }

      const updatedSession = {
        ...mockSession,
        sessionToken: 'gs_mockedNanoid12345678'
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue(updatedSession)

      const newToken = await regenerateToken('session-id')

      expect(newToken).toBe('gs_mockedNanoid12345678')
      expect(mockGameSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          sessionToken: 'gs_mockedNanoid12345678'
        }
      })
    })

    it('should throw error when session not found', async () => {
      mockGameSession.findUnique.mockResolvedValue(null)

      await expect(regenerateToken('non-existent-id')).rejects.toThrow('Herní session nenalezena')
    })

    it('should generate token with correct format (gs_)', async () => {
      const mockSession = {
        id: 'session-id'
      }

      const updatedSession = {
        ...mockSession,
        sessionToken: 'gs_mockedNanoid12345678'
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockResolvedValue(updatedSession)

      const newToken = await regenerateToken('session-id')

      expect(newToken).toMatch(/^gs_/)
      expect(newToken.length).toBe(23) // 'gs_' (3) + 20 chars from nanoid
    })

    it('should handle database error during update', async () => {
      const mockSession = {
        id: 'session-id'
      }

      mockGameSession.findUnique.mockResolvedValue(mockSession)
      mockGameSession.update.mockRejectedValue(new Error('Database error'))

      await expect(regenerateToken('session-id')).rejects.toThrow('Database error')
    })

    it('should handle database error during validation', async () => {
      mockGameSession.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(regenerateToken('session-id')).rejects.toThrow('Database error')
    })
  })
})

// ============================================================================
// Edge Cases and Token Format Tests
// ============================================================================

describe('SaveService - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle very long session tokens', async () => {
    const longToken = 'gs_' + 'a'.repeat(100)
    const mockSession = {
      id: 'session-id',
      sessionToken: longToken,
      characterId: 'char-id',
      currentLocation: 'Town',
      questLog: [],
      worldState: {},
      isActive: true,
      lastPlayedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      character: {
        id: 'char-id',
        name: 'Test',
        inventory: []
      },
      messages: []
    }

    mockGameSession.findUnique.mockResolvedValue(mockSession)
    mockGameSession.update.mockResolvedValue(mockSession)

    const result = await loadGameByToken(longToken)

    expect(result.sessionToken).toBe(longToken)
  })

  it('should handle special characters in location names', async () => {
    const specialLocation = "Dragon's Lair - Level 3 (Boss Floor!)"
    const mockSessions = [
      {
        id: 'session-id',
        sessionToken: 'gs_token123',
        currentLocation: specialLocation,
        lastPlayedAt: new Date(),
        createdAt: new Date(),
        isActive: true,
        character: {
          name: 'Hero',
          level: 10
        },
        _count: {
          messages: 50
        }
      }
    ]

    mockGameSession.findMany.mockResolvedValue(mockSessions)

    const result = await listActiveSessions()

    expect(result[0].currentLocation).toBe(specialLocation)
  })

  it('should handle concurrent save operations', async () => {
    const mockSession = {
      id: 'session-id',
      sessionToken: 'gs_token123',
      isActive: true
    }

    mockGameSession.findUnique.mockResolvedValue(mockSession)
    mockGameSession.update.mockResolvedValue(mockSession)

    // Simulate concurrent saves
    const saves = await Promise.all([
      saveGame('session-id'),
      saveGame('session-id'),
      saveGame('session-id')
    ])

    expect(saves).toHaveLength(3)
    saves.forEach(token => {
      expect(token).toBe('gs_token123')
    })
  })

  it('should handle empty quest log and world state', async () => {
    const mockSession = {
      id: 'session-id',
      sessionToken: 'gs_token123',
      characterId: 'char-id',
      currentLocation: 'Start',
      questLog: [],
      worldState: {},
      isActive: true,
      lastPlayedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      character: {
        id: 'char-id',
        name: 'Test',
        inventory: []
      },
      messages: []
    }

    mockGameSession.findUnique.mockResolvedValue(mockSession)
    mockGameSession.update.mockResolvedValue(mockSession)

    const result = await loadGameByToken('gs_token123')

    expect(result.questLog).toEqual([])
    expect(result.worldState).toEqual({})
  })
})
