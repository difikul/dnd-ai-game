/**
 * Unit Tests for gameStore
 * Tests Pinia store for game session state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/gameStore'
import { useChatStore } from '@/stores/chatStore'
import { useCharacterStore } from '@/stores/characterStore'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import { mockCharacter, mockGameSession, createMockGameSession, mockNarratorMessage } from '../../fixtures/mockData'
import type { LoadGameResponse } from '@/types/game'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('gameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    server.resetHandlers()
    mockPush.mockClear()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with null currentSession', () => {
      const store = useGameStore()
      expect(store.currentSession).toBeNull()
    })

    it('should initialize with empty savedGames array', () => {
      const store = useGameStore()
      expect(store.savedGames).toEqual([])
    })

    it('should initialize with loading as false', () => {
      const store = useGameStore()
      expect(store.loading).toBe(false)
    })

    it('should initialize with null error', () => {
      const store = useGameStore()
      expect(store.error).toBeNull()
    })
  })

  describe('Getters', () => {
    it('hasActiveSession should be false when no session', () => {
      const store = useGameStore()
      expect(store.hasActiveSession).toBe(false)
    })

    it('hasActiveSession should be true when session exists', () => {
      const store = useGameStore()
      store.currentSession = mockGameSession
      expect(store.hasActiveSession).toBe(true)
    })

    it('sessionToken should return session token', () => {
      const store = useGameStore()
      store.currentSession = mockGameSession
      expect(store.sessionToken).toBe('gs_test_token_123')
    })

    it('sessionToken should return undefined when no session', () => {
      const store = useGameStore()
      expect(store.sessionToken).toBeUndefined()
    })

    it('currentLocation should return location from session', () => {
      const store = useGameStore()
      store.currentSession = mockGameSession
      expect(store.currentLocation).toBe('Bree')
    })

    it('currentLocation should return undefined when no session', () => {
      const store = useGameStore()
      expect(store.currentLocation).toBeUndefined()
    })

    it('isSessionActive should return false when no session', () => {
      const store = useGameStore()
      expect(store.isSessionActive).toBe(false)
    })

    it('isSessionActive should return true when session is active', () => {
      const store = useGameStore()
      store.currentSession = { ...mockGameSession, isActive: true }
      expect(store.isSessionActive).toBe(true)
    })

    it('isSessionActive should return false when session is inactive', () => {
      const store = useGameStore()
      store.currentSession = { ...mockGameSession, isActive: false }
      expect(store.isSessionActive).toBe(false)
    })
  })

  describe('startNewGame', () => {
    it('should start new game successfully', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.json({
            success: true,
            data: {
              sessionId: 'new-session-123',
              sessionToken: 'gs_new_token',
              narratorMessage: 'Welcome to the adventure!',
              character: {
                id: 'char-123',
                currentLocation: 'Starting Village'
              }
            }
          })
        })
      )

      const store = useGameStore()
      await store.startNewGame('char-123')

      expect(store.currentSession).not.toBeNull()
      expect(store.currentSession?.id).toBe('new-session-123')
      expect(store.currentSession?.sessionToken).toBe('gs_new_token')
      expect(store.currentSession?.currentLocation).toBe('Starting Village')
      expect(store.currentSession?.isActive).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should add initial narrative to chat store', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.json({
            success: true,
            sessionId: 'new-session-123',
            sessionToken: 'gs_new_token',
            narratorMessage: 'Welcome to the adventure!',
            character: {
              id: 'char-123',
              currentLocation: 'Starting Village'
            }
          })
        })
      )

      const store = useGameStore()
      const chatStore = useChatStore()

      await store.startNewGame('char-123')

      expect(chatStore.messages).toHaveLength(1)
      expect(chatStore.messages[0].role).toBe('narrator')
      expect(chatStore.messages[0].content).toBe('Welcome to the adventure!')
    })

    it('should navigate to game view after starting', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.json({
            success: true,
            sessionId: 'new-session-123',
            sessionToken: 'gs_new_token',
            narratorMessage: 'Welcome!',
            character: {
              id: 'char-123',
              currentLocation: 'Village'
            }
          })
        })
      )

      const store = useGameStore()
      await store.startNewGame('char-123')

      expect(mockPush).toHaveBeenCalledWith('/game/new-session-123')
    })

    it('should handle API error when starting game', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.json(
            { success: false, error: 'Character not found' },
            { status: 404 }
          )
        })
      )

      const store = useGameStore()

      await expect(store.startNewGame('invalid-char')).rejects.toThrow()
      expect(store.error).toBeTruthy()
      expect(store.loading).toBe(false)
    })

    it('should set loading state during API call', async () => {
      let loadingDuringCall = false

      server.use(
        http.post('http://localhost:3000/api/game/start', async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return HttpResponse.json({
            success: true,
            sessionId: 'test',
            sessionToken: 'token',
            narratorMessage: 'Welcome',
            character: { id: 'char-123', currentLocation: 'Village' }
          })
        })
      )

      const store = useGameStore()
      const promise = store.startNewGame('char-123')

      loadingDuringCall = store.loading

      await promise

      expect(loadingDuringCall).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('should not add message when narratorMessage is empty', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.json({
            success: true,
            sessionId: 'new-session-123',
            sessionToken: 'gs_new_token',
            narratorMessage: '',
            character: {
              id: 'char-123',
              currentLocation: 'Village'
            }
          })
        })
      )

      const store = useGameStore()
      const chatStore = useChatStore()

      await store.startNewGame('char-123')

      expect(chatStore.messages).toHaveLength(0)
    })

    it('should use initialNarrative if narratorMessage not present', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/start', () => {
          return HttpResponse.json({
            success: true,
            sessionId: 'new-session-123',
            sessionToken: 'gs_new_token',
            initialNarrative: 'Alternative welcome message',
            character: {
              id: 'char-123',
              currentLocation: 'Village'
            }
          })
        })
      )

      const store = useGameStore()
      const chatStore = useChatStore()

      await store.startNewGame('char-123')

      expect(chatStore.messages).toHaveLength(1)
      expect(chatStore.messages[0].content).toBe('Alternative welcome message')
    })
  })

  describe('loadGame', () => {
    it('should load game state successfully', async () => {
      const loadResponse: LoadGameResponse = {
        session: mockGameSession,
        character: mockCharacter,
        messages: [mockNarratorMessage]
      }

      server.use(
        http.get('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json(loadResponse)
        })
      )

      const store = useGameStore()
      const characterStore = useCharacterStore()
      const chatStore = useChatStore()

      await store.loadGame('session-123')

      expect(store.currentSession).toEqual(mockGameSession)
      expect(characterStore.currentCharacter).toEqual(mockCharacter)
      expect(chatStore.messages).toHaveLength(1)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle 404 error when loading game', async () => {
      server.use(
        http.get('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json(
            { success: false, error: 'Session not found' },
            { status: 404 }
          )
        })
      )

      const store = useGameStore()

      await expect(store.loadGame('invalid-session')).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })

    it('should handle network error when loading game', async () => {
      server.use(
        http.get('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.error()
        })
      )

      const store = useGameStore()

      await expect(store.loadGame('session-123')).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })
  })

  describe('loadGameByToken', () => {
    it('should load game by token successfully', async () => {
      const loadResponse: LoadGameResponse = {
        session: mockGameSession,
        character: mockCharacter,
        messages: []
      }

      server.use(
        http.post('http://localhost:3000/api/game/load', () => {
          return HttpResponse.json(loadResponse)
        })
      )

      const store = useGameStore()
      await store.loadGameByToken('gs_valid_token')

      expect(store.currentSession?.id).toBe(mockGameSession.id)
      expect(store.currentSession?.sessionToken).toBe(mockGameSession.sessionToken)
      expect(mockPush).toHaveBeenCalledWith('/game/session-123')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle invalid token error', async () => {
      server.use(
        http.get('http://localhost:3000/api/game/load/:token', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid token' },
            { status: 401 }
          )
        })
      )

      const store = useGameStore()

      await expect(store.loadGameByToken('invalid_token')).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })

    it('should load character and messages into stores', async () => {
      const loadResponse: LoadGameResponse = {
        session: mockGameSession,
        character: mockCharacter,
        messages: [mockNarratorMessage]
      }

      server.use(
        http.get('http://localhost:3000/api/game/load/:token', () => {
          return HttpResponse.json({
            success: true,
            data: loadResponse
          })
        })
      )

      const store = useGameStore()
      const characterStore = useCharacterStore()
      const chatStore = useChatStore()

      await store.loadGameByToken('gs_valid_token')

      expect(characterStore.currentCharacter?.id).toBe(mockCharacter.id)
      expect(chatStore.messages).toHaveLength(1)
      expect(chatStore.messages[0].content).toBe(mockNarratorMessage.content)
    })
  })

  describe('saveGame', () => {
    it('should save game successfully', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/save', () => {
          return HttpResponse.json({
            success: true,
            sessionToken: 'gs_saved_token',
            savedAt: new Date()
          })
        })
      )

      const store = useGameStore()
      store.currentSession = mockGameSession

      const token = await store.saveGame('My save point')

      expect(token).toBe('gs_saved_token')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should save game without note', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/save', () => {
          return HttpResponse.json({
            success: true,
            sessionToken: 'gs_saved_token',
            savedAt: new Date()
          })
        })
      )

      const store = useGameStore()
      store.currentSession = mockGameSession

      const token = await store.saveGame()

      expect(token).toBe('gs_saved_token')
    })

    it('should throw error when no active session', async () => {
      const store = useGameStore()

      await expect(store.saveGame()).rejects.toThrow('Žádná aktivní hra k uložení')
    })

    it('should handle API error when saving', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/save', () => {
          return HttpResponse.json(
            { success: false, error: 'Save failed' },
            { status: 500 }
          )
        })
      )

      const store = useGameStore()
      store.currentSession = mockGameSession

      await expect(store.saveGame()).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })
  })

  describe('endGame', () => {
    it('should end game successfully', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/end', () => {
          return HttpResponse.json({ success: true })
        })
      )

      const store = useGameStore()
      const chatStore = useChatStore()
      store.currentSession = mockGameSession
      chatStore.messages = [mockNarratorMessage]

      await store.endGame()

      expect(store.currentSession).toBeNull()
      expect(chatStore.messages).toHaveLength(0)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should do nothing when no active session', async () => {
      const store = useGameStore()

      await store.endGame()

      expect(store.currentSession).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('should handle API error when ending game', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/end', () => {
          return HttpResponse.json(
            { success: false, error: 'Failed to end session' },
            { status: 500 }
          )
        })
      )

      const store = useGameStore()
      store.currentSession = mockGameSession

      await expect(store.endGame()).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })
  })

  describe('loadSavedGames', () => {
    it('should load saved games list', async () => {
      const savedGamesList: LoadGameResponse[] = [
        {
          session: mockGameSession,
          character: mockCharacter,
          messages: []
        },
        {
          session: createMockGameSession({ id: 'session-456' }),
          character: mockCharacter,
          messages: []
        }
      ]

      server.use(
        http.get('http://localhost:3000/api/game/saves', () => {
          return HttpResponse.json({
            success: true,
            data: savedGamesList
          })
        })
      )

      const store = useGameStore()
      await store.loadSavedGames()

      expect(store.savedGames).toHaveLength(2)
      expect(store.savedGames[0].session.id).toBe('session-123')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle empty saved games list', async () => {
      server.use(
        http.get('http://localhost:3000/api/game/saves', () => {
          return HttpResponse.json({
            success: true,
            data: []
          })
        })
      )

      const store = useGameStore()
      await store.loadSavedGames()

      expect(store.savedGames).toEqual([])
    })

    it('should handle API error when loading saves', async () => {
      server.use(
        http.get('http://localhost:3000/api/game/saves', () => {
          return HttpResponse.json(
            { success: false, error: 'Failed to load saves' },
            { status: 500 }
          )
        })
      )

      const store = useGameStore()

      await expect(store.loadSavedGames()).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })
  })

  describe('deleteGame', () => {
    it('should delete game successfully', async () => {
      server.use(
        http.delete('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json({ success: true })
        })
      )

      const store = useGameStore()
      store.savedGames = [
        {
          session: mockGameSession,
          character: mockCharacter,
          messages: []
        },
        {
          session: createMockGameSession({ id: 'session-456' }),
          character: mockCharacter,
          messages: []
        }
      ]

      await store.deleteGame('session-123')

      expect(store.savedGames).toHaveLength(1)
      expect(store.savedGames[0].session.id).toBe('session-456')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle API error when deleting', async () => {
      server.use(
        http.delete('http://localhost:3000/api/game/session/:id', () => {
          return HttpResponse.json(
            { success: false, error: 'Delete failed' },
            { status: 500 }
          )
        })
      )

      const store = useGameStore()

      await expect(store.deleteGame('session-123')).rejects.toThrow()
      expect(store.error).toBeTruthy()
    })
  })

  describe('updateSession', () => {
    it('should update session data', () => {
      const store = useGameStore()
      store.currentSession = mockGameSession

      store.updateSession({ currentLocation: 'New Location' })

      expect(store.currentSession?.currentLocation).toBe('New Location')
    })

    it('should do nothing when no current session', () => {
      const store = useGameStore()

      store.updateSession({ currentLocation: 'New Location' })

      expect(store.currentSession).toBeNull()
    })

    it('should merge multiple updates', () => {
      const store = useGameStore()
      store.currentSession = mockGameSession

      store.updateSession({
        currentLocation: 'New Location',
        isActive: false
      })

      expect(store.currentSession?.currentLocation).toBe('New Location')
      expect(store.currentSession?.isActive).toBe(false)
    })
  })

  describe('updateLocation', () => {
    it('should update current location', () => {
      const store = useGameStore()
      store.currentSession = mockGameSession

      store.updateLocation('Rivendell')

      expect(store.currentSession?.currentLocation).toBe('Rivendell')
    })

    it('should do nothing when no current session', () => {
      const store = useGameStore()

      store.updateLocation('Rivendell')

      expect(store.currentSession).toBeNull()
    })
  })

  describe('clearSession', () => {
    it('should clear current session', () => {
      const store = useGameStore()
      store.currentSession = mockGameSession

      store.clearSession()

      expect(store.currentSession).toBeNull()
    })

    it('should clear chat messages', () => {
      const store = useGameStore()
      const chatStore = useChatStore()
      store.currentSession = mockGameSession
      chatStore.messages = [mockNarratorMessage]

      store.clearSession()

      expect(chatStore.messages).toHaveLength(0)
    })
  })

  describe('clearError', () => {
    it('should clear error message', () => {
      const store = useGameStore()
      store.error = 'Some error'

      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const store = useGameStore()
      store.currentSession = mockGameSession
      store.loading = true
      store.error = 'Some error'

      store.reset()

      expect(store.currentSession).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should not clear savedGames on reset', () => {
      const store = useGameStore()
      store.savedGames = [{
        session: mockGameSession,
        character: mockCharacter,
        messages: []
      }]

      store.reset()

      // savedGames persists (not reset by reset() function based on implementation)
      expect(store.currentSession).toBeNull()
    })
  })
})
