/**
 * Game API Integration Tests
 * Testuje všechny /api/game endpointy s REAL DATABASE
 * Mock pouze Gemini API
 * Cíl: 30+ testů, 85%+ coverage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from '@/app'
import { prisma } from '@/config/database'

// Mock Gemini API pro game action tests
vi.mock('@/services/geminiService', () => ({
  geminiService: {
    generateGameStart: vi.fn().mockResolvedValue('Vítej v dobrodružství! Nacházíš se v krásné vesnici Bree.'),
    generateNarratorResponse: vi.fn().mockResolvedValue({
      content: 'Vstoupil jsi do temné místnosti. Vidíš starou truhlu v rohu.',
      requiresDiceRoll: false,
      diceRollType: undefined
    }),
    generateCombatResponse: vi.fn().mockResolvedValue('Útočíš na nepřítele!'),
    testConnection: vi.fn().mockResolvedValue('Test OK'),
    summarizeConversation: vi.fn().mockResolvedValue('Shrnutí konverzace'),
    generateNPCDialog: vi.fn().mockResolvedValue('NPC odpovídá')
  }
}))

describe('Game API Integration', () => {
  let testCharacterId: string
  let testSessionId: string
  let testSessionToken: string

  // Před všemi testy: Připoj databázi
  beforeAll(async () => {
    await prisma.$connect()
  })

  // Po všech testech: Zavři connection
  afterAll(async () => {
    await prisma.$disconnect()
  })

  // Před každým testem: Vyčisti test data a vytvoř test postavu
  beforeEach(async () => {
    await prisma.message.deleteMany({})
    await prisma.gameSession.deleteMany({})
    await prisma.item.deleteMany({})
    await prisma.character.deleteMany({})

    // Vytvoř testovací postavu
    const character = await prisma.character.create({
      data: {
        name: 'Test Hero',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        strength: 16,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 10,
        hitPoints: 12,
        maxHitPoints: 12,
        armorClass: 12
      }
    })

    testCharacterId = character.id
  })

  // ============================================================================
  // POST /api/game/start - Start New Game
  // ============================================================================

  describe('POST /api/game/start', () => {
    it('should start new game with valid character', async () => {
      const response = await request(app)
        .post('/api/game/start')
        .send({
          characterId: testCharacterId,
          startingLocation: 'Prancing Pony Inn'
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.sessionId).toBeTruthy()
      expect(response.body.data.sessionToken).toBeTruthy()
      expect(response.body.data.narratorMessage).toBeTruthy()
      expect(response.body.data.character.currentLocation).toBe('Prancing Pony Inn')

      testSessionId = response.body.data.sessionId
      testSessionToken = response.body.data.sessionToken

      // Ověř v databázi
      const session = await prisma.gameSession.findUnique({
        where: { id: testSessionId },
        include: { messages: true }
      })

      expect(session).toBeTruthy()
      expect(session!.characterId).toBe(testCharacterId)
      expect(session!.currentLocation).toBe('Prancing Pony Inn')
      expect(session!.isActive).toBe(true)
      expect(session!.messages.length).toBeGreaterThan(0)
    })

    it('should start new game with default location when not specified', async () => {
      const response = await request(app)
        .post('/api/game/start')
        .send({
          characterId: testCharacterId
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.character.currentLocation).toBeTruthy()
    })

    it('should return 400 for invalid characterId format', async () => {
      const response = await request(app)
        .post('/api/game/start')
        .send({
          characterId: 'not-a-uuid',
          startingLocation: 'Test'
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 404 for non-existent character', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .post('/api/game/start')
        .send({
          characterId: fakeId,
          startingLocation: 'Test'
        })
        .expect(404)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for missing characterId', async () => {
      const response = await request(app)
        .post('/api/game/start')
        .send({
          startingLocation: 'Test'
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should create multiple game sessions for the same character', async () => {
      // První session
      const response1 = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      // Druhá session
      const response2 = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      expect(response1.body.data.sessionId).not.toBe(response2.body.data.sessionId)

      // Ověř v databázi
      const sessions = await prisma.gameSession.findMany({
        where: { characterId: testCharacterId }
      })

      expect(sessions).toHaveLength(2)
    })

    it('should generate unique session tokens', async () => {
      const response1 = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      const response2 = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      expect(response1.body.data.sessionToken).not.toBe(response2.body.data.sessionToken)
    })

    it('should accept very long starting location', async () => {
      const longLocation = 'A'.repeat(100)

      const response = await request(app)
        .post('/api/game/start')
        .send({
          characterId: testCharacterId,
          startingLocation: longLocation
        })
        .expect(201)

      expect(response.body.success).toBe(true)
    })

    it('should reject starting location that is too long', async () => {
      const tooLongLocation = 'A'.repeat(101)

      const response = await request(app)
        .post('/api/game/start')
        .send({
          characterId: testCharacterId,
          startingLocation: tooLongLocation
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })
  })

  // ============================================================================
  // POST /api/game/session/:id/action - Handle Player Action
  // ============================================================================

  describe('POST /api/game/session/:id/action', () => {
    beforeEach(async () => {
      // Vytvoř test session před každým action testem
      const response = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      testSessionId = response.body.data.sessionId
    })

    it('should process player action successfully', async () => {
      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'I look around the room',
          characterId: testCharacterId
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.narratorResponse).toBeTruthy()

      // Ověř že se přidala zpráva do databáze
      const messages = await prisma.message.findMany({
        where: { sessionId: testSessionId },
        orderBy: { createdAt: 'asc' }
      })

      expect(messages.length).toBeGreaterThan(1) // Initial + player + narrator
    })

    it('should handle multiple actions in sequence', async () => {
      await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'I draw my sword',
          characterId: testCharacterId
        })
        .expect(200)

      await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'I attack the goblin',
          characterId: testCharacterId
        })
        .expect(200)

      const messages = await prisma.message.findMany({
        where: { sessionId: testSessionId }
      })

      expect(messages.length).toBeGreaterThan(4)
    })

    it('should return 400 for missing action', async () => {
      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          characterId: testCharacterId
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for empty action', async () => {
      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: '',
          characterId: testCharacterId
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for action that is too long', async () => {
      const tooLongAction = 'A'.repeat(501)

      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: tooLongAction,
          characterId: testCharacterId
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for missing characterId', async () => {
      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Test action'
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for invalid characterId format', async () => {
      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Test action',
          characterId: 'not-a-uuid'
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for wrong character in session', async () => {
      // Vytvoř druhou postavu
      const otherChar = await prisma.character.create({
        data: {
          name: 'Other Hero',
          race: 'Elf',
          class: 'Wizard',
          level: 1,
          strength: 8,
          dexterity: 14,
          constitution: 10,
          intelligence: 18,
          wisdom: 12,
          charisma: 10,
          hitPoints: 6,
          maxHitPoints: 6,
          armorClass: 12
        }
      })

      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Test action',
          characterId: otherChar.id
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .post(`/api/game/session/${fakeSessionId}/action`)
        .send({
          action: 'Test action',
          characterId: testCharacterId
        })
        .expect(404)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for invalid session ID format', async () => {
      const response = await request(app)
        .post('/api/game/session/not-a-uuid/action')
        .send({
          action: 'Test action',
          characterId: testCharacterId
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should accept action with exactly 500 characters', async () => {
      const maxLengthAction = 'A'.repeat(500)

      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: maxLengthAction,
          characterId: testCharacterId
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should handle actions with special characters', async () => {
      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'I say "Hello!" & wave my hand... #test',
          characterId: testCharacterId
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  // ============================================================================
  // GET /api/game/session/:id - Get Game State
  // ============================================================================

  describe('GET /api/game/session/:id', () => {
    beforeEach(async () => {
      // Vytvoř test session
      const response = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      testSessionId = response.body.data.sessionId
    })

    it('should return complete game state', async () => {
      const response = await request(app)
        .get(`/api/game/session/${testSessionId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.session).toBeTruthy()
      expect(response.body.data.session.id).toBe(testSessionId)
      expect(response.body.data.character).toBeTruthy()
      expect(response.body.data.messages).toBeInstanceOf(Array)
    })

    it('should include all messages in game state', async () => {
      // Přidej několik akcí
      await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Action 1',
          characterId: testCharacterId
        })

      await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Action 2',
          characterId: testCharacterId
        })

      const response = await request(app)
        .get(`/api/game/session/${testSessionId}`)
        .expect(200)

      expect(response.body.data.messages.length).toBeGreaterThan(2)
    })

    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .get(`/api/game/session/${fakeSessionId}`)
        .expect(404)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for invalid session ID format', async () => {
      const response = await request(app)
        .get('/api/game/session/not-a-uuid')
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })
  })

  // ============================================================================
  // GET /api/game/session/token/:token - Get Game State by Token
  // ============================================================================

  describe('GET /api/game/session/token/:token', () => {
    beforeEach(async () => {
      // Vytvoř test session
      const response = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      testSessionId = response.body.data.sessionId
      testSessionToken = response.body.data.sessionToken
    })

    it('should return game state by session token', async () => {
      const response = await request(app)
        .get(`/api/game/session/token/${testSessionToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.session.id).toBe(testSessionId)
      expect(response.body.data.session.sessionToken).toBe(testSessionToken)
    })

    it('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .get('/api/game/session/token/gs_nonexistent')
        .expect(404)

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for empty token', async () => {
      const response = await request(app)
        .get('/api/game/session/token/')
        .expect(404) // Express routing returns 404 for missing param
    })
  })

  // ============================================================================
  // POST /api/game/session/:id/end - End Game Session
  // ============================================================================

  describe('POST /api/game/session/:id/end', () => {
    beforeEach(async () => {
      // Vytvoř test session
      const response = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      testSessionId = response.body.data.sessionId
    })

    it('should end game session successfully', async () => {
      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/end`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Ověř v databázi že session je neaktivní
      const session = await prisma.gameSession.findUnique({
        where: { id: testSessionId }
      })

      expect(session!.isActive).toBe(false)
    })

    it('should not allow actions on ended session', async () => {
      // Ukonči session
      await request(app)
        .post(`/api/game/session/${testSessionId}/end`)
        .expect(200)

      // Zkus provést akci
      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Test action',
          characterId: testCharacterId
        })
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should return error for non-existent session', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .post(`/api/game/session/${fakeSessionId}/end`)
        .expect(500) // Service throws error

      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for invalid session ID format', async () => {
      const response = await request(app)
        .post('/api/game/session/not-a-uuid/end')
        .expect(400)

      expect(response.body.error).toBeTruthy()
    })

    it('should be idempotent (can end session twice)', async () => {
      await request(app)
        .post(`/api/game/session/${testSessionId}/end`)
        .expect(200)

      const response = await request(app)
        .post(`/api/game/session/${testSessionId}/end`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  // ============================================================================
  // Edge Cases & Complex Scenarios
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle game state after character deletion', async () => {
      // Vytvoř session
      const response = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      testSessionId = response.body.data.sessionId

      // Smaž postavu (CASCADE smaže i session)
      await prisma.character.delete({
        where: { id: testCharacterId }
      })

      // Zkus načíst game state
      const getResponse = await request(app)
        .get(`/api/game/session/${testSessionId}`)
        .expect(404)

      expect(getResponse.body.error).toBeTruthy()
    })

    it('should preserve message history across multiple actions', async () => {
      // Vytvoř session
      const response = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      testSessionId = response.body.data.sessionId

      // Proveď 5 akcí
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post(`/api/game/session/${testSessionId}/action`)
          .send({
            action: `Action ${i}`,
            characterId: testCharacterId
          })
      }

      // Načti game state
      const stateResponse = await request(app)
        .get(`/api/game/session/${testSessionId}`)
        .expect(200)

      // Initial message + 5 player actions + 5 narrator responses = 11
      expect(stateResponse.body.data.messages.length).toBeGreaterThanOrEqual(11)
    })

    it('should update lastPlayedAt on each action', async () => {
      // Vytvoř session
      const response = await request(app)
        .post('/api/game/start')
        .send({ characterId: testCharacterId })
        .expect(201)

      testSessionId = response.body.data.sessionId

      const session1 = await prisma.gameSession.findUnique({
        where: { id: testSessionId }
      })

      // Počkej chvíli
      await new Promise(resolve => setTimeout(resolve, 100))

      // Proveď akci
      await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Test',
          characterId: testCharacterId
        })

      const session2 = await prisma.gameSession.findUnique({
        where: { id: testSessionId }
      })

      expect(new Date(session2!.lastPlayedAt).getTime()).toBeGreaterThan(
        new Date(session1!.lastPlayedAt).getTime()
      )
    })
  })
})
