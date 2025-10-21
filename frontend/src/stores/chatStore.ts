/**
 * Chat Store
 * Pinia store for chat messages and AI interactions
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '@/types/game'
import gameService from '@/services/game.service'
import { getErrorMessage } from '@/services/api.service'
import { useGameStore } from './gameStore'
import { useCharacterStore } from './characterStore'
import { useAtmosphereStore } from './atmosphereStore'

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const isTyping = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const messageCount = computed(() => messages.value.length)
  const lastMessage = computed(() => messages.value[messages.value.length - 1] || null)
  const hasMessages = computed(() => messages.value.length > 0)

  // Actions

  /**
   * Send player message and get AI response
   * @param content - Player's message/action
   */
  async function sendMessage(content: string): Promise<void> {
    const gameStore = useGameStore()
    const characterStore = useCharacterStore()
    const atmosphereStore = useAtmosphereStore()

    // Validate active session and character
    if (!gameStore.currentSession) {
      error.value = 'Žádná aktivní herní session'
      throw new Error('Žádná aktivní herní session')
    }

    if (!characterStore.currentCharacter) {
      error.value = 'Žádná vybraná postava'
      throw new Error('Žádná vybraná postava')
    }

    // Create optimistic player message
    const playerMsg: Message = {
      id: crypto.randomUUID(),
      sessionId: gameStore.currentSession.id,
      role: 'player',
      content: content.trim(),
      createdAt: new Date(),
    }

    // Add player message immediately (optimistic update)
    messages.value.push(playerMsg)

    isLoading.value = true
    isTyping.value = true
    error.value = null

    try {
      // Call AI service
      const response = await gameService.sendAction(
        gameStore.currentSession.id,
        content,
        characterStore.currentCharacter.id
      )

      // Create narrator response message
      const narratorMsg: Message = {
        id: crypto.randomUUID(),
        sessionId: gameStore.currentSession.id,
        role: 'narrator',
        content: response.response,
        metadata: response.metadata,
        createdAt: new Date(),
      }

      // Add narrator message
      messages.value.push(narratorMsg)

      // Update atmosphere if provided
      if (response.atmosphere) {
        console.log('🎨 Atmosphere data received:', response.atmosphere)
        console.log('🎨 Background URL:', response.atmosphere.backgroundUrl)
        console.log('🎨 Mood:', response.atmosphere.mood)
        await atmosphereStore.updateAtmosphere(response.atmosphere)
      } else {
        console.warn('⚠️  No atmosphere data in response')
      }

      // Update game state if needed
      if (response.worldStateChanged && gameStore.currentSession) {
        // Could trigger a session refresh here if needed
        // For now, we assume backend updates the session
      }

    } catch (err) {
      error.value = getErrorMessage(err)

      // Remove optimistic player message on error
      messages.value = messages.value.filter((m) => m.id !== playerMsg.id)

      throw err
    } finally {
      isLoading.value = false
      isTyping.value = false
    }
  }

  /**
   * Add a single message (e.g., initial narrative, system messages)
   * @param message - Message to add
   */
  function addMessage(message: Message): void {
    messages.value.push(message)
  }

  /**
   * Add multiple messages at once
   * @param newMessages - Array of messages to add
   */
  function addMessages(newMessages: Message[]): void {
    messages.value.push(...newMessages)
  }

  /**
   * Load messages (e.g., when loading saved game)
   * @param loadedMessages - Messages to load
   */
  function loadMessages(loadedMessages: Message[]): void {
    messages.value = loadedMessages
  }

  /**
   * Add a system message (for game events)
   * @param content - System message content
   */
  function addSystemMessage(content: string): void {
    const systemMsg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content,
      createdAt: new Date(),
    }
    messages.value.push(systemMsg)
  }

  /**
   * Clear all messages
   */
  function clearMessages(): void {
    messages.value = []
  }

  /**
   * Remove a specific message by ID
   * @param messageId - ID of message to remove
   */
  function removeMessage(messageId: string): void {
    messages.value = messages.value.filter((m) => m.id !== messageId)
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Reset store to initial state
   */
  function reset(): void {
    messages.value = []
    isLoading.value = false
    isTyping.value = false
    error.value = null
  }

  return {
    // State
    messages,
    isLoading,
    isTyping,
    error,

    // Getters
    messageCount,
    lastMessage,
    hasMessages,

    // Actions
    sendMessage,
    addMessage,
    addMessages,
    loadMessages,
    addSystemMessage,
    clearMessages,
    removeMessage,
    clearError,
    reset,
  }
})
