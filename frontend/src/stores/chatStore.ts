/**
 * Chat Store
 * Pinia store for chat messages and AI interactions
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, DiceRequirement, DiceRoll } from '@/types/game'
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

  /**
   * Get dice requirement from the last narrator message
   * @returns DiceRequirement or null if no dice roll is required
   */
  const lastDiceRequirement = computed<DiceRequirement | null>(() => {
    // Find the last narrator message with a dice requirement
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const msg = messages.value[i]
      if (msg.role === 'narrator' && msg.metadata?.diceRequirement) {
        return msg.metadata.diceRequirement
      }
    }
    return null
  })

  /**
   * Check if a dice roll is currently required
   * @returns true if the last narrator message requires a dice roll
   */
  const requiresDiceRoll = computed<boolean>(() => {
    return lastDiceRequirement.value !== null
  })

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

    } catch (err: any) {
      error.value = getErrorMessage(err)

      // Remove optimistic player message on error
      messages.value = messages.value.filter((m) => m.id !== playerMsg.id)

      // Handle Gemini API quota exceeded (429)
      if (err.response?.status === 429) {
        const errorData = err.response?.data || {}
        const message = errorData.message || 'Gemini API kvóta byla vyčerpána.'
        const helpUrl = errorData.helpUrl || '/profile'

        // Add system message with helpful information
        addSystemMessage(
          `⚠️ ${message}\n\n` +
          `💡 Řešení:\n` +
          `• Přidejte si vlastní Gemini API klíč v nastavení profilu\n` +
          `• Nebo počkejte ${errorData.retryAfter || '60s'} a zkuste znovu\n\n` +
          `🔗 [Otevřít nastavení profilu](${helpUrl})`
        )
      }

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
   * Submit dice roll result back to AI
   * Creates a player message with the dice roll result and sends it as an action
   * @param diceRoll - The dice roll result from the dice roller component
   */
  async function submitDiceResult(diceRoll: DiceRoll): Promise<void> {
    const requirement = lastDiceRequirement.value

    // Build the breakdown string (what was rolled + modifier = result)
    const rollsStr = `[${diceRoll.rolls.join(', ')}]`
    let breakdown = `${diceRoll.notation} → ${rollsStr}`

    // Add modifier to breakdown if not zero
    if (diceRoll.modifier !== 0) {
      const sign = diceRoll.modifier > 0 ? '+' : ''
      breakdown += `${sign}${diceRoll.modifier}`
    }
    breakdown += ` = ${diceRoll.total}`

    // Format multi-line message
    let content = ''

    // Line 1: Description (if available) or generic "Hod kostkou"
    if (requirement?.description) {
      content += `🎲 ${requirement.description}\n`
    } else {
      content += `🎲 Hod kostkou\n`
    }

    // Line 2: Skill check with breakdown
    if (requirement?.skillName) {
      const dcPart = requirement.difficultyClass
        ? ` (DC ${requirement.difficultyClass})`
        : ''
      content += `${requirement.skillName}${dcPart}: ${breakdown}\n`
    } else {
      content += `${breakdown}\n`
    }

    // Line 3: Success/Failure result (only if DC is available)
    if (requirement?.difficultyClass) {
      const success = diceRoll.total >= requirement.difficultyClass
      const status = success ? '✅ ÚSPĚCH' : '❌ NEÚSPĚCH'
      content += status
    } else {
      // Remove trailing newline if no DC result line
      content = content.trimEnd()
    }

    // Send the message with dice roll metadata
    await sendMessage(content)
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
    lastDiceRequirement,
    requiresDiceRoll,

    // Actions
    sendMessage,
    addMessage,
    addMessages,
    loadMessages,
    addSystemMessage,
    clearMessages,
    removeMessage,
    clearError,
    submitDiceResult,
    reset,
  }
})
