/**
 * Unit Tests for chatStore
 * Tests Pinia store for chat messages and AI interactions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '@/stores/chatStore'
import { useGameStore } from '@/stores/gameStore'
import { useCharacterStore } from '@/stores/characterStore'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import { mockCharacter, mockGameSession, mockNarratorMessage, mockPlayerMessage, createMockMessage } from '../../fixtures/mockData'
import type { Message } from '@/types/game'

describe('chatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    server.resetHandlers()
  })

  describe('Initial State', () => {
    it('should initialize with empty messages array', () => {
      const store = useChatStore()
      expect(store.messages).toEqual([])
    })

    it('should initialize with isLoading as false', () => {
      const store = useChatStore()
      expect(store.isLoading).toBe(false)
    })

    it('should initialize with isTyping as false', () => {
      const store = useChatStore()
      expect(store.isTyping).toBe(false)
    })

    it('should initialize with null error', () => {
      const store = useChatStore()
      expect(store.error).toBeNull()
    })
  })

  describe('Getters', () => {
    it('messageCount should return number of messages', () => {
      const store = useChatStore()
      store.messages = [mockNarratorMessage, mockPlayerMessage]
      expect(store.messageCount).toBe(2)
    })

    it('messageCount should return 0 for empty messages', () => {
      const store = useChatStore()
      expect(store.messageCount).toBe(0)
    })

    it('lastMessage should return last message', () => {
      const store = useChatStore()
      store.messages = [mockNarratorMessage, mockPlayerMessage]
      expect(store.lastMessage).toEqual(mockPlayerMessage)
    })

    it('lastMessage should return null for empty messages', () => {
      const store = useChatStore()
      expect(store.lastMessage).toBeNull()
    })

    it('hasMessages should be false when empty', () => {
      const store = useChatStore()
      expect(store.hasMessages).toBe(false)
    })

    it('hasMessages should be true when messages exist', () => {
      const store = useChatStore()
      store.messages = [mockNarratorMessage]
      expect(store.hasMessages).toBe(true)
    })
  })

  describe('sendMessage', () => {
    it('should send player message and receive AI response', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json({
            success: true,
            response: 'The cave entrance looms before you.',
            metadata: {},
            worldStateChanged: false
          })
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      await chatStore.sendMessage('I enter the cave')

      expect(chatStore.messages).toHaveLength(2)
      expect(chatStore.messages[0].role).toBe('player')
      expect(chatStore.messages[0].content).toBe('I enter the cave')
      expect(chatStore.messages[1].role).toBe('narrator')
      expect(chatStore.messages[1].content).toBe('The cave entrance looms before you.')
      expect(chatStore.isLoading).toBe(false)
      expect(chatStore.isTyping).toBe(false)
      expect(chatStore.error).toBeNull()
    })

    it('should trim whitespace from player message', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            success: true,
            response: 'Response',
            metadata: {}
          })
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      await chatStore.sendMessage('  hello world  ')

      expect(chatStore.messages[0].content).toBe('hello world')
    })

    it('should throw error when no active session', async () => {
      const chatStore = useChatStore()
      const characterStore = useCharacterStore()
      characterStore.currentCharacter = mockCharacter

      await expect(chatStore.sendMessage('test')).rejects.toThrow('Žádná aktivní herní session')
      expect(chatStore.error).toBe('Žádná aktivní herní session')
    })

    it('should throw error when no character selected', async () => {
      const chatStore = useChatStore()
      const gameStore = useGameStore()
      gameStore.currentSession = mockGameSession

      await expect(chatStore.sendMessage('test')).rejects.toThrow('Žádná vybraná postava')
      expect(chatStore.error).toBe('Žádná vybraná postava')
    })

    it('should set loading and typing states during API call', async () => {
      let loadingDuringCall = false
      let typingDuringCall = false

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return HttpResponse.json({
            success: true,
            response: 'Response',
            metadata: {}
          })
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      const promise = chatStore.sendMessage('test')

      loadingDuringCall = chatStore.isLoading
      typingDuringCall = chatStore.isTyping

      await promise

      expect(loadingDuringCall).toBe(true)
      expect(typingDuringCall).toBe(true)
      expect(chatStore.isLoading).toBe(false)
      expect(chatStore.isTyping).toBe(false)
    })

    it('should include metadata in narrator response', async () => {
      const metadata = {
        diceRolls: [{
          notation: '1d20+5',
          result: 18,
          rolls: [13],
          modifier: 5,
          type: 'attack' as const
        }]
      }

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json({
            success: true,
            response: 'You hit the goblin!',
            metadata
          })
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      await chatStore.sendMessage('I attack the goblin')

      expect(chatStore.messages[1].metadata).toEqual(metadata)
    })

    it('should remove optimistic player message on error', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json(
            { success: false, error: 'AI service unavailable' },
            { status: 500 }
          )
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      await expect(chatStore.sendMessage('test')).rejects.toThrow()

      expect(chatStore.messages).toHaveLength(0)
      expect(chatStore.error).toBeTruthy()
    })

    it('should handle AI response with worldStateChanged flag', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json({
            success: true,
            response: 'You arrived at a new location',
            metadata: {},
            worldStateChanged: true
          })
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      await chatStore.sendMessage('I walk north')

      expect(chatStore.messages).toHaveLength(2)
    })

    it('should handle network error', async () => {
      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.error()
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      await expect(chatStore.sendMessage('test')).rejects.toThrow()
      expect(chatStore.messages).toHaveLength(0)
    })
  })

  describe('addMessage', () => {
    it('should add single message', () => {
      const store = useChatStore()
      store.addMessage(mockNarratorMessage)

      expect(store.messages).toHaveLength(1)
      expect(store.messages[0]).toEqual(mockNarratorMessage)
    })

    it('should add message to existing messages', () => {
      const store = useChatStore()
      store.messages = [mockNarratorMessage]
      store.addMessage(mockPlayerMessage)

      expect(store.messages).toHaveLength(2)
      expect(store.messages[1]).toEqual(mockPlayerMessage)
    })
  })

  describe('addMessages', () => {
    it('should add multiple messages at once', () => {
      const store = useChatStore()
      const messages = [mockNarratorMessage, mockPlayerMessage]
      store.addMessages(messages)

      expect(store.messages).toHaveLength(2)
      expect(store.messages).toEqual(messages)
    })

    it('should append to existing messages', () => {
      const store = useChatStore()
      const existingMessage = createMockMessage({ id: 'msg-001' })
      store.messages = [existingMessage]

      store.addMessages([mockNarratorMessage, mockPlayerMessage])

      expect(store.messages).toHaveLength(3)
      expect(store.messages[0]).toEqual(existingMessage)
    })

    it('should handle empty array', () => {
      const store = useChatStore()
      store.messages = [mockNarratorMessage]
      store.addMessages([])

      expect(store.messages).toHaveLength(1)
    })
  })

  describe('loadMessages', () => {
    it('should load messages replacing existing ones', () => {
      const store = useChatStore()
      const oldMessages = [createMockMessage({ id: 'old-1' })]
      store.messages = oldMessages

      const newMessages = [mockNarratorMessage, mockPlayerMessage]
      store.loadMessages(newMessages)

      expect(store.messages).toEqual(newMessages)
      expect(store.messages).toHaveLength(2)
    })

    it('should load empty messages array', () => {
      const store = useChatStore()
      store.messages = [mockNarratorMessage]
      store.loadMessages([])

      expect(store.messages).toEqual([])
    })

    it('should preserve message order', () => {
      const store = useChatStore()
      const messages = [
        createMockMessage({ id: 'msg-1', content: 'First' }),
        createMockMessage({ id: 'msg-2', content: 'Second' }),
        createMockMessage({ id: 'msg-3', content: 'Third' })
      ]

      store.loadMessages(messages)

      expect(store.messages[0].content).toBe('First')
      expect(store.messages[1].content).toBe('Second')
      expect(store.messages[2].content).toBe('Third')
    })
  })

  describe('addSystemMessage', () => {
    it('should add system message', () => {
      const store = useChatStore()
      store.addSystemMessage('Level up! You are now level 2')

      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].role).toBe('system')
      expect(store.messages[0].content).toBe('Level up! You are now level 2')
    })

    it('should generate unique ID for system message', () => {
      const store = useChatStore()
      store.addSystemMessage('Message 1')
      store.addSystemMessage('Message 2')

      expect(store.messages[0].id).not.toBe(store.messages[1].id)
    })

    it('should add timestamp to system message', () => {
      const store = useChatStore()
      const before = new Date()
      store.addSystemMessage('Test')
      const after = new Date()

      expect(store.messages[0].createdAt).toBeInstanceOf(Date)
      expect(store.messages[0].createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(store.messages[0].createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      const store = useChatStore()
      store.messages = [mockNarratorMessage, mockPlayerMessage]

      store.clearMessages()

      expect(store.messages).toEqual([])
      expect(store.messages).toHaveLength(0)
    })

    it('should work when already empty', () => {
      const store = useChatStore()
      store.clearMessages()

      expect(store.messages).toEqual([])
    })
  })

  describe('removeMessage', () => {
    it('should remove message by ID', () => {
      const store = useChatStore()
      store.messages = [
        createMockMessage({ id: 'msg-1' }),
        createMockMessage({ id: 'msg-2' }),
        createMockMessage({ id: 'msg-3' })
      ]

      store.removeMessage('msg-2')

      expect(store.messages).toHaveLength(2)
      expect(store.messages.find(m => m.id === 'msg-2')).toBeUndefined()
    })

    it('should do nothing if message ID not found', () => {
      const store = useChatStore()
      store.messages = [createMockMessage({ id: 'msg-1' })]

      store.removeMessage('non-existent')

      expect(store.messages).toHaveLength(1)
    })

    it('should handle empty messages array', () => {
      const store = useChatStore()
      store.removeMessage('msg-1')

      expect(store.messages).toEqual([])
    })
  })

  describe('clearError', () => {
    it('should clear error message', () => {
      const store = useChatStore()
      store.error = 'Some error'

      store.clearError()

      expect(store.error).toBeNull()
    })

    it('should work when error is already null', () => {
      const store = useChatStore()
      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const store = useChatStore()
      store.messages = [mockNarratorMessage, mockPlayerMessage]
      store.isLoading = true
      store.isTyping = true
      store.error = 'Some error'

      store.reset()

      expect(store.messages).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.isTyping).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('Message Ordering', () => {
    it('should maintain chronological order', () => {
      const store = useChatStore()
      const msg1 = createMockMessage({ id: 'msg-1', createdAt: new Date('2024-01-01T10:00:00Z') })
      const msg2 = createMockMessage({ id: 'msg-2', createdAt: new Date('2024-01-01T10:01:00Z') })
      const msg3 = createMockMessage({ id: 'msg-3', createdAt: new Date('2024-01-01T10:02:00Z') })

      store.addMessage(msg1)
      store.addMessage(msg2)
      store.addMessage(msg3)

      expect(store.messages[0].id).toBe('msg-1')
      expect(store.messages[1].id).toBe('msg-2')
      expect(store.messages[2].id).toBe('msg-3')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long message content', async () => {
      const longContent = 'A'.repeat(10000)

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json({
            success: true,
            response: longContent,
            metadata: {}
          })
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      await chatStore.sendMessage('test')

      expect(chatStore.messages[1].content).toHaveLength(10000)
    })

    it('should handle special characters in message', async () => {
      const specialContent = '<script>alert("xss")</script> & "quotes" \'apostrophes\''

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json({
            success: true,
            response: specialContent,
            metadata: {}
          })
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      await chatStore.sendMessage('test')

      expect(chatStore.messages[1].content).toBe(specialContent)
    })

    it('should handle Unicode emojis in messages', async () => {
      const emojiContent = '🎲 You rolled a natural 20! 🎯'

      server.use(
        http.post('http://localhost:3000/api/game/session/:id/action', () => {
          return HttpResponse.json({
            success: true,
            response: emojiContent,
            metadata: {}
          })
        })
      )

      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const characterStore = useCharacterStore()

      gameStore.currentSession = mockGameSession
      characterStore.currentCharacter = mockCharacter

      await chatStore.sendMessage('I roll the dice')

      expect(chatStore.messages[1].content).toBe(emojiContent)
    })
  })
})
