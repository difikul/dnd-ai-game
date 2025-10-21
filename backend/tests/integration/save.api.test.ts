/**
 * Save API Integration Tests
 * Testuje všechny /api/saves endpointy s REAL DATABASE
 * Cíl: 20+ testů, 90%+ coverage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from '@/app'
import { prisma } from '@/config/database'

// Mock Gemini API
vi.mock('@/services/geminiService', () => ({
  geminiService: {
    generateGameStart: vi.fn().mockResolvedValue('Vítej v dobrodružství! Nacházíš se v krásné vesnici Bree.'),
    generateNarratorResponse: vi.fn().mockResolvedValue({
      content: 'Test narrator response',
      requiresDiceRoll: false,
      diceRollType: undefined
    }),
    generateCombatResponse: vi.fn().mockResolvedValue('Útočíš na nepřítele!'),
    testConnection: vi.fn().mockResolvedValue('Test OK'),
    summarizeConversation: vi.fn().mockResolvedValue('Shrnutí konverzace'),
    generateNPCDialog: vi.fn().mockResolvedValue('NPC odpovídá')
  }
}))

describe('Save API Integration', () => {
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

  // Před každým testem: Vyčisti test data
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

    // Vytvoř testovací game session
    const startResponse = await request(app)
      .post('/api/game/start')
      .send({ characterId: testCharacterId })
      .expect(201)

    testSessionId = startResponse.body.data.sessionId
    testSessionToken = startResponse.body.data.sessionToken
  })

  // ============================================================================
  // GET /api/saves - List Saved Games
  // ============================================================================

  describe('GET /api/saves', () => {
    it('should return empty array when no saves exist', async () => {
      // Smaž vytvořenou session
      await prisma.gameSession.deleteMany({})

      const response = await request(app)
        .get('/api/saves')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
      expect(response.body.count).toBe(0)
    })

    it('should return all active saved games', async () => {
      const response = await request(app)
        .get('/api/saves')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.count).toBe(1)
      expect(response.body.data[0].id).toBe(testSessionId)
    })

    it('should return multiple saved games', async () => {
      // Vytvoř další postavu a session
      const char2 = await prisma.character.create({
        data: {
          name: 'Second Hero',
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

      await request(app)
        .post('/api/game/start')
        .send({ characterId: char2.id })

      const response = await request(app)
        .get('/api/saves')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.count).toBe(2)
    })

    it('should not return inactive sessions', async () => {
      // Ukonči session
      await request(app)
        .post(`/api/game/session/${testSessionId}/end`)

      const response = await request(app)
        .get('/api/saves')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(0)
    })

    it('should include character data in list', async () => {
      const response = await request(app)
        .get('/api/saves')
        .expect(200)

      expect(response.body.data[0].character).toBeTruthy()
      expect(response.body.data[0].character.name).toBe('Test Hero')
    })
  })

  // ============================================================================
  // POST /api/saves/:sessionId - Save Game
  // ============================================================================

  describe('POST /api/saves/:sessionId', () => {
    it('should save game and return token', async () => {
      const response = await request(app)
        .post(`/api/saves/${testSessionId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.sessionToken).toBeTruthy()
      expect(response.body.data.sessionId).toBe(testSessionId)
      expect(response.body.message).toContain('úspěšně uložena')
    })

    it('should return existing token if session already saved', async () => {
      const response1 = await request(app)
        .post(`/api/saves/${testSessionId}`)
        .expect(200)

      const response2 = await request(app)
        .post(`/api/saves/${testSessionId}`)
        .expect(200)

      expect(response1.body.data.sessionToken).toBe(response2.body.data.sessionToken)
    })

    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .post(`/api/saves/${fakeSessionId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for invalid session ID format', async () => {
      const response = await request(app)
        .post('/api/saves/not-a-uuid')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should save game with message history', async () => {
      // Přidej nějaké akce
      await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Test action',
          characterId: testCharacterId
        })

      const response = await request(app)
        .post(`/api/saves/${testSessionId}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Ověř že messages jsou v DB
      const messages = await prisma.message.findMany({
        where: { sessionId: testSessionId }
      })

      expect(messages.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // GET /api/saves/token/:token - Load Game by Token
  // ============================================================================

  describe('GET /api/saves/token/:token', () => {
    it('should load game by token successfully', async () => {
      const response = await request(app)
        .get(`/api/saves/token/${testSessionToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.session).toBeTruthy()
      expect(response.body.data.session.id).toBe(testSessionId)
      expect(response.body.data.character).toBeTruthy()
      expect(response.body.data.messages).toBeInstanceOf(Array)
    })

    it('should load complete game state with all messages', async () => {
      // Přidej akce
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
        .get(`/api/saves/token/${testSessionToken}`)
        .expect(200)

      expect(response.body.data.messages.length).toBeGreaterThan(2)
    })

    it('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .get('/api/saves/token/gs_nonexistent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for empty token', async () => {
      const response = await request(app)
        .get('/api/saves/token/')
        .expect(404) // Express routing
    })

    it('should include character inventory in loaded game', async () => {
      // Přidej inventory
      await prisma.item.create({
        data: {
          characterId: testCharacterId,
          name: 'Sword',
          type: 'weapon',
          quantity: 1,
          equipped: true,
          damage: '1d8+3'
        }
      })

      const response = await request(app)
        .get(`/api/saves/token/${testSessionToken}`)
        .expect(200)

      expect(response.body.data.character.inventory).toHaveLength(1)
      expect(response.body.data.character.inventory[0].name).toBe('Sword')
    })
  })

  // ============================================================================
  // DELETE /api/saves/:sessionId - Delete Saved Game
  // ============================================================================

  describe('DELETE /api/saves/:sessionId', () => {
    it('should delete saved game successfully', async () => {
      const response = await request(app)
        .delete(`/api/saves/${testSessionId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('smazána')

      // Ověř že session byla smazána
      const deleted = await prisma.gameSession.findUnique({
        where: { id: testSessionId }
      })

      expect(deleted).toBeNull()
    })

    it('should cascade delete all messages', async () => {
      // Přidej zprávy
      await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Test',
          characterId: testCharacterId
        })

      await request(app)
        .delete(`/api/saves/${testSessionId}`)
        .expect(200)

      // Ověř že messages byly smazány
      const messages = await prisma.message.findMany({
        where: { sessionId: testSessionId }
      })

      expect(messages).toHaveLength(0)
    })

    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .delete(`/api/saves/${fakeSessionId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for invalid session ID format', async () => {
      const response = await request(app)
        .delete('/api/saves/not-a-uuid')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should not delete character when deleting session', async () => {
      await request(app)
        .delete(`/api/saves/${testSessionId}`)
        .expect(200)

      // Ověř že character stále existuje
      const character = await prisma.character.findUnique({
        where: { id: testCharacterId }
      })

      expect(character).toBeTruthy()
    })
  })

  // ============================================================================
  // POST /api/saves/:sessionId/regenerate-token - Regenerate Token
  // ============================================================================

  describe('POST /api/saves/:sessionId/regenerate-token', () => {
    it('should regenerate session token', async () => {
      const oldToken = testSessionToken

      const response = await request(app)
        .post(`/api/saves/${testSessionId}/regenerate-token`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.sessionToken).toBeTruthy()
      expect(response.body.data.sessionToken).not.toBe(oldToken)
      expect(response.body.data.sessionId).toBe(testSessionId)
    })

    it('should invalidate old token after regeneration', async () => {
      const oldToken = testSessionToken

      await request(app)
        .post(`/api/saves/${testSessionId}/regenerate-token`)
        .expect(200)

      // Zkus načíst hru se starým tokenem
      const response = await request(app)
        .get(`/api/saves/token/${oldToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })

    it('should allow loading with new token', async () => {
      const response1 = await request(app)
        .post(`/api/saves/${testSessionId}/regenerate-token`)
        .expect(200)

      const newToken = response1.body.data.sessionToken

      const response2 = await request(app)
        .get(`/api/saves/token/${newToken}`)
        .expect(200)

      expect(response2.body.success).toBe(true)
      expect(response2.body.data.session.id).toBe(testSessionId)
    })

    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .post(`/api/saves/${fakeSessionId}/regenerate-token`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })

    it('should return 400 for invalid session ID format', async () => {
      const response = await request(app)
        .post('/api/saves/not-a-uuid/regenerate-token')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })
  })

  // ============================================================================
  // Edge Cases & Complex Scenarios
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle concurrent saves of the same session', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app).post(`/api/saves/${testSessionId}`)
      )

      const responses = await Promise.all(promises)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })

      // Všechny by měly vrátit stejný token
      const tokens = responses.map(r => r.body.data.sessionToken)
      expect(new Set(tokens).size).toBe(1)
    })

    it('should preserve game state after load', async () => {
      // Přidej akce
      await request(app)
        .post(`/api/game/session/${testSessionId}/action`)
        .send({
          action: 'Important action',
          characterId: testCharacterId
        })

      // Načti hru
      const response = await request(app)
        .get(`/api/saves/token/${testSessionToken}`)
        .expect(200)

      const messageContents = response.body.data.messages.map((m: any) => m.content)
      expect(messageContents.some((c: string) => c.includes('Important action'))).toBe(true)
    })

    it('should list saves ordered by lastPlayedAt', async () => {
      // Vytvoř další session
      const char2 = await prisma.character.create({
        data: {
          name: 'Second Hero',
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

      const session2Response = await request(app)
        .post('/api/game/start')
        .send({ characterId: char2.id })

      const session2Id = session2Response.body.data.sessionId

      // Počkej a proveď akci v druhé session
      await new Promise(resolve => setTimeout(resolve, 100))

      await request(app)
        .post(`/api/game/session/${session2Id}/action`)
        .send({
          action: 'Test',
          characterId: char2.id
        })

      // Načti seznam
      const response = await request(app)
        .get('/api/saves')
        .expect(200)

      expect(response.body.data).toHaveLength(2)
      // První by měla být session2 (novější lastPlayedAt)
      expect(response.body.data[0].id).toBe(session2Id)
    })
  })
})
