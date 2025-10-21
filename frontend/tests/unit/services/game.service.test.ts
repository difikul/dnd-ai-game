/**
 * Unit Tests for Game Service
 * Tests API service for game session management and AI interactions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import gameService from '@/services/game.service'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import { mockCharacter, mockGameSession, mockNarratorMessage } from '../../fixtures/mockData'
import type {
  StartGameResponse,
  SendActionResponse,
  LoadGameResponse,
  SaveGameResponse
} from '@/types/game'

describe('Game Service', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  describe('startGame', () => {
    it('should start new game session successfully', async () => {
      const mockResponse: StartGameResponse = {
        sessionId: 'new-session-123',
        sessionToken: 'gs_new_token',
        narratorMessage: 'Welcome to the adventure!',
        character: {
          id: 'char-123',
          currentLocation: 'Starting Village'
        }
      }

      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.json({
            success: true,
            data: mockResponse
          })
        })
      )

      const result = await gameService.startGame('char-123')

      expect(result.sessionId).toBe('new-session-123')
      expect(result.sessionToken).toBe('gs_new_token')
      expect(result.narratorMessage).toBe('Welcome to the adventure!')
      expect(result.character.id).toBe('char-123')
    })

    it('should send correct character ID in request', async () => {
      let receivedCharacterId: string | null = null

      server.use(
        http.post('http://localhost:3000/api/game/start', async ({ request }) => {
          const body = await request.json() as any
          receivedCharacterId = body.characterId

          return HttpResponse.json({
            success: true,
            data: {
              sessionId: 'session-123',
              sessionToken: 'token',
              narratorMessage: 'Welcome',
              character: { id: body.characterId, currentLocation: 'Village' }
            }
          })
        })
      )

      await gameService.startGame('my-char-id')

      expect(receivedCharacterId).toBe('my-char-id')
    })

    it('should throw error when character not found', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.json(
            { success: false, message: 'Character not found' },
            { status: 404 }
          )
        })
      )

      await expect(gameService.startGame('invalid-char')).rejects.toThrow()
    })

    it('should handle server error when starting game', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(gameService.startGame('char-123')).rejects.toThrow()
    })

    it('should handle network error', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.error()
        })
      )

      await expect(gameService.startGame('char-123')).rejects.toThrow()
    })
  })

  describe('sendAction', () => {
    it('should send player action successfully', async () => {
      const mockResponse: SendActionResponse = {
        response: 'The dragon roars at you!',
        metadata: {
          diceRolls: [{
            notation: '1d20+3',
            result: 18,
            rolls: [15],
            modifier: 3
          }]
        },
        worldStateChanged: false
      }

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json({
            success: true,
            data: mockResponse
          })
        })
      )

      const result = await gameService.sendAction('session-123', 'I attack the dragon', 'char-123')

      expect(result.response).toBe('The dragon roars at you!')
      expect(result.metadata?.diceRolls).toHaveLength(1)
      expect(result.worldStateChanged).toBe(false)
    })

    it('should send correct session ID in URL', async () => {
      let receivedSessionId: string | null = null

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', ({ params }) => {
          receivedSessionId = params.id as string

          return HttpResponse.json({
            success: true,
            data: {
              response: 'Response',
              metadata: {}
            }
          })
        })
      )

      await gameService.sendAction('my-session-id', 'test action', 'char-123')

      expect(receivedSessionId).toBe('my-session-id')
    })

    it('should send action and character ID in request body', async () => {
      let receivedBody: any = null

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', async ({ request }) => {
          receivedBody = await request.json()

          return HttpResponse.json({
            success: true,
            data: {
              response: 'Response',
              metadata: {}
            }
          })
        })
      )

      await gameService.sendAction('session-123', 'I cast fireball', 'char-456')

      expect(receivedBody.action).toBe('I cast fireball')
      expect(receivedBody.characterId).toBe('char-456')
    })

    it('should handle response with worldStateChanged flag', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json({
            success: true,
            data: {
              response: 'You moved to a new location',
              metadata: {},
              worldStateChanged: true
            }
          })
        })
      )

      const result = await gameService.sendAction('session-123', 'I walk north', 'char-123')

      expect(result.worldStateChanged).toBe(true)
    })

    it('should handle action with metadata', async () => {
      const metadata = {
        diceRolls: [
          { notation: '1d20+5', result: 20, rolls: [15], modifier: 5 },
          { notation: '2d6+3', result: 12, rolls: [5, 4], modifier: 3 }
        ],
        skillCheck: {
          skill: 'Perception',
          dc: 15,
          result: 20,
          success: true
        }
      }

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json({
            success: true,
            data: {
              response: 'You notice a hidden door',
              metadata
            }
          })
        })
      )

      const result = await gameService.sendAction('session-123', 'I look around', 'char-123')

      expect(result.metadata?.diceRolls).toHaveLength(2)
      expect(result.metadata?.skillCheck?.success).toBe(true)
    })

    it('should throw error when session not found', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json(
            { success: false, message: 'Session not found' },
            { status: 404 }
          )
        })
      )

      await expect(
        gameService.sendAction('invalid-session', 'test', 'char-123')
      ).rejects.toThrow()
    })

    it('should handle AI service timeout', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', async () => {
          await new Promise(resolve => setTimeout(resolve, 35000))
          return HttpResponse.json({
            success: true,
            data: { response: 'Late response', metadata: {} }
          })
        })
      )

      await expect(
        gameService.sendAction('session-123', 'test', 'char-123')
      ).rejects.toThrow()
    }, 40000)
  })

  describe('getGameState', () => {
    it('should get game state successfully', async () => {
      const mockResponse: LoadGameResponse = {
        session: mockGameSession,
        character: mockCharacter,
        messages: [mockNarratorMessage]
      }

      server.use(
        http.get('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json({
            success: true,
            data: mockResponse
          })
        })
      )

      const result = await gameService.getGameState('session-123')

      expect(result.session.id).toBe(mockGameSession.id)
      expect(result.character.id).toBe(mockCharacter.id)
      expect(result.messages).toHaveLength(1)
    })

    it('should send correct session ID in URL', async () => {
      let receivedSessionId: string | null = null

      server.use(
        http.get('http://localhost:3000/api/game/session/:id', ({ params }) => {
          receivedSessionId = params.id as string

          return HttpResponse.json({
            success: true,
            data: {
              session: mockGameSession,
              character: mockCharacter,
              messages: []
            }
          })
        })
      )

      await gameService.getGameState('my-session-id')

      expect(receivedSessionId).toBe('my-session-id')
    })

    it('should handle session not found error', async () => {
      server.use(
        http.get('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json(
            { success: false, message: 'Session not found' },
            { status: 404 }
          )
        })
      )

      await expect(gameService.getGameState('invalid-session')).rejects.toThrow()
    })

    it('should return empty messages array', async () => {
      const mockResponse: LoadGameResponse = {
        session: mockGameSession,
        character: mockCharacter,
        messages: []
      }

      server.use(
        http.get('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json({
            success: true,
            data: mockResponse
          })
        })
      )

      const result = await gameService.getGameState('session-123')

      expect(result.messages).toEqual([])
    })
  })

  describe('loadGameByToken', () => {
    it('should load game by token successfully', async () => {
      const mockResponse: LoadGameResponse = {
        session: mockGameSession,
        character: mockCharacter,
        messages: []
      }

      server.use(
        http.get('http://localhost:3000/api/game/load/:token', () => {
          return HttpResponse.json({
            success: true,
            data: mockResponse
          })
        })
      )

      const result = await gameService.loadGameByToken('gs_valid_token')

      expect(result.session.sessionToken).toBe(mockGameSession.sessionToken)
      expect(result.character.id).toBe(mockCharacter.id)
    })

    it('should send correct token in URL', async () => {
      let receivedToken: string | null = null

      server.use(
        http.get('http://localhost:3000/api/game/load/:token', ({ params }) => {
          receivedToken = params.token as string

          return HttpResponse.json({
            success: true,
            data: {
              session: mockGameSession,
              character: mockCharacter,
              messages: []
            }
          })
        })
      )

      await gameService.loadGameByToken('gs_my_token_123')

      expect(receivedToken).toBe('gs_my_token_123')
    })

    it('should handle invalid token error', async () => {
      server.use(
        http.get('http://localhost:3000/api/game/load/:token', () => {
          return HttpResponse.json(
            { success: false, message: 'Invalid or expired token' },
            { status: 401 }
          )
        })
      )

      await expect(gameService.loadGameByToken('invalid_token')).rejects.toThrow()
    })

    it('should load game with messages', async () => {
      const mockResponse: LoadGameResponse = {
        session: mockGameSession,
        character: mockCharacter,
        messages: [mockNarratorMessage, mockNarratorMessage]
      }

      server.use(
        http.get('http://localhost:3000/api/game/load/:token', () => {
          return HttpResponse.json({
            success: true,
            data: mockResponse
          })
        })
      )

      const result = await gameService.loadGameByToken('gs_token')

      expect(result.messages).toHaveLength(2)
    })
  })

  describe('saveGame', () => {
    it('should save game successfully', async () => {
      const mockResponse: SaveGameResponse = {
        success: true,
        savedAt: new Date(),
        sessionToken: 'gs_saved_token_123'
      }

      server.use(
        http.post('http://localhost:3000/api/game/save', () => {
          return HttpResponse.json({
            success: true,
            data: mockResponse
          })
        })
      )

      const result = await gameService.saveGame('session-123', 'My save point')

      expect(result.success).toBe(true)
      expect(result.sessionToken).toBe('gs_saved_token_123')
    })

    it('should send session ID and note in request', async () => {
      let receivedBody: any = null

      server.use(
        http.post('http://localhost:3000/api/game/save', async ({ request }) => {
          receivedBody = await request.json()

          return HttpResponse.json({
            success: true,
            data: {
              success: true,
              savedAt: new Date(),
              sessionToken: 'token'
            }
          })
        })
      )

      await gameService.saveGame('session-456', 'Before boss fight')

      expect(receivedBody.sessionId).toBe('session-456')
      expect(receivedBody.note).toBe('Before boss fight')
    })

    it('should save game without note', async () => {
      let receivedBody: any = null

      server.use(
        http.post('http://localhost:3000/api/game/save', async ({ request }) => {
          receivedBody = await request.json()

          return HttpResponse.json({
            success: true,
            data: {
              success: true,
              savedAt: new Date(),
              sessionToken: 'token'
            }
          })
        })
      )

      await gameService.saveGame('session-123')

      expect(receivedBody.sessionId).toBe('session-123')
      expect(receivedBody.note).toBeUndefined()
    })

    it('should handle save error', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/save', () => {
          return HttpResponse.json(
            { success: false, message: 'Failed to save game' },
            { status: 500 }
          )
        })
      )

      await expect(gameService.saveGame('session-123')).rejects.toThrow()
    })

    it('should return savedAt timestamp', async () => {
      const savedAt = new Date('2024-01-01T12:00:00Z')

      server.use(
        http.post('http://localhost:3000/api/game/save', () => {
          return HttpResponse.json({
            success: true,
            data: {
              success: true,
              savedAt,
              sessionToken: 'token'
            }
          })
        })
      )

      const result = await gameService.saveGame('session-123')

      expect(result.savedAt).toBeDefined()
    })
  })

  describe('endGame', () => {
    it('should end game successfully', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/end', () => {
          return HttpResponse.json({ success: true })
        })
      )

      await expect(gameService.endGame('session-123')).resolves.not.toThrow()
    })

    it('should send correct session ID in URL', async () => {
      let receivedSessionId: string | null = null

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/end', ({ params }) => {
          receivedSessionId = params.id as string
          return HttpResponse.json({ success: true })
        })
      )

      await gameService.endGame('my-session-id')

      expect(receivedSessionId).toBe('my-session-id')
    })

    it('should handle error when ending game', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/end', () => {
          return HttpResponse.json(
            { success: false, message: 'Failed to end session' },
            { status: 500 }
          )
        })
      )

      await expect(gameService.endGame('session-123')).rejects.toThrow()
    })

    it('should handle session not found', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/end', () => {
          return HttpResponse.json(
            { success: false, message: 'Session not found' },
            { status: 404 }
          )
        })
      )

      await expect(gameService.endGame('invalid-session')).rejects.toThrow()
    })
  })

  describe('getSavedGames', () => {
    it('should get all saved games successfully', async () => {
      const mockSavedGames: LoadGameResponse[] = [
        {
          session: mockGameSession,
          character: mockCharacter,
          messages: []
        },
        {
          session: { ...mockGameSession, id: 'session-456' },
          character: mockCharacter,
          messages: []
        }
      ]

      server.use(
        http.get('http://localhost:3000/api/game/saves', () => {
          return HttpResponse.json({
            success: true,
            data: mockSavedGames
          })
        })
      )

      const result = await gameService.getSavedGames()

      expect(result).toHaveLength(2)
      expect(result[0].session.id).toBe('session-123')
      expect(result[1].session.id).toBe('session-456')
    })

    it('should return empty array when no saved games', async () => {
      server.use(
        http.get('http://localhost:3000/api/game/saves', () => {
          return HttpResponse.json({
            success: true,
            data: []
          })
        })
      )

      const result = await gameService.getSavedGames()

      expect(result).toEqual([])
    })

    it('should handle error when loading saved games', async () => {
      server.use(
        http.get('http://localhost:3000/api/game/saves', () => {
          return HttpResponse.json(
            { success: false, message: 'Failed to load saves' },
            { status: 500 }
          )
        })
      )

      await expect(gameService.getSavedGames()).rejects.toThrow()
    })
  })

  describe('deleteGame', () => {
    it('should delete game successfully', async () => {
      server.use(
        http.delete('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json({ success: true })
        })
      )

      await expect(gameService.deleteGame('session-123')).resolves.not.toThrow()
    })

    it('should send correct session ID in URL', async () => {
      let receivedSessionId: string | null = null

      server.use(
        http.delete('http://localhost:3000/api/game/session/:id', ({ params }) => {
          receivedSessionId = params.id as string
          return HttpResponse.json({ success: true })
        })
      )

      await gameService.deleteGame('my-session-id')

      expect(receivedSessionId).toBe('my-session-id')
    })

    it('should handle delete error', async () => {
      server.use(
        http.delete('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json(
            { success: false, message: 'Delete failed' },
            { status: 500 }
          )
        })
      )

      await expect(gameService.deleteGame('session-123')).rejects.toThrow()
    })

    it('should handle session not found when deleting', async () => {
      server.use(
        http.delete('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json(
            { success: false, message: 'Session not found' },
            { status: 404 }
          )
        })
      )

      await expect(gameService.deleteGame('invalid-session')).rejects.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long action text', async () => {
      const longAction = 'I '.repeat(5000) + 'attack'

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', async ({ request }) => {
          const body = await request.json() as any

          return HttpResponse.json({
            success: true,
            data: {
              response: 'Response',
              metadata: {}
            }
          })
        })
      )

      const result = await gameService.sendAction('session-123', longAction, 'char-123')

      expect(result.response).toBe('Response')
    })

    it('should handle special characters in action', async () => {
      const specialAction = 'I say "Hello!" & <wave> \'goodbye\''

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', async ({ request }) => {
          const body = await request.json() as any

          return HttpResponse.json({
            success: true,
            data: {
              response: 'Response',
              metadata: {}
            }
          })
        })
      )

      await expect(
        gameService.sendAction('session-123', specialAction, 'char-123')
      ).resolves.toBeDefined()
    })

    it('should handle Unicode characters in save note', async () => {
      const unicodeNote = 'Save 🎲 before 🐉 fight'

      server.use(
        http.post('http://localhost:3000/api/game/save', async ({ request }) => {
          const body = await request.json() as any

          return HttpResponse.json({
            success: true,
            data: {
              success: true,
              savedAt: new Date(),
              sessionToken: 'token'
            }
          })
        })
      )

      await expect(
        gameService.saveGame('session-123', unicodeNote)
      ).resolves.toBeDefined()
    })
  })
})
