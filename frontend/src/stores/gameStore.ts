/**
 * Game Store
 * Pinia store for game session state management
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { GameSession, LoadGameResponse, SavedGameListItem } from '@/types/game'
import gameService from '@/services/game.service'
import { getErrorMessage } from '@/services/api.service'
import { useChatStore } from './chatStore'
import { useCharacterStore } from './characterStore'

export const useGameStore = defineStore('game', () => {
  const router = useRouter()

  // State
  const currentSession = ref<GameSession | null>(null)
  const savedGames = ref<SavedGameListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasActiveSession = computed(() => currentSession.value !== null)
  const sessionToken = computed(() => currentSession.value?.sessionToken)
  const currentLocation = computed(() => currentSession.value?.currentLocation)
  const isSessionActive = computed(() => currentSession.value?.isActive ?? false)

  // Actions

  /**
   * Start a new game session
   * @param characterId - ID of the character to use
   */
  async function startNewGame(characterId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await gameService.startGame(characterId)

      // Build GameSession object from backend response
      const session: GameSession = {
        id: response.sessionId,
        sessionToken: response.sessionToken,
        characterId: response.character.id,
        currentLocation: response.character.currentLocation,
        questLog: { activeQuests: [], completedQuests: [] },
        worldState: {
          location: response.character.currentLocation,
          time: 'day'
        },
        isActive: true,
        lastPlayedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      currentSession.value = session

      // Add initial narrative to chat store if not empty
      const narrativeContent = response.narratorMessage || response.initialNarrative || ''
      if (narrativeContent) {
        const chatStore = useChatStore()
        chatStore.addMessage({
          id: crypto.randomUUID(),
          sessionId: session.id,
          role: 'narrator',
          content: narrativeContent,
          createdAt: new Date(),
        })
      }

      // Navigate to game view
      await router.push(`/game/${session.id}`)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load existing game by session ID
   * @param sessionId - Game session ID
   */
  async function loadGame(sessionId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response: LoadGameResponse = await gameService.getGameState(sessionId)

      // Set session
      currentSession.value = response.session

      // Load character
      const characterStore = useCharacterStore()
      characterStore.setCurrentCharacter(response.character)

      // Load messages
      const chatStore = useChatStore()
      chatStore.loadMessages(response.messages)

    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load game by session token (for saved games)
   * @param sessionToken - Unique session token
   */
  async function loadGameByToken(sessionToken: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response: LoadGameResponse = await gameService.loadGameByToken(sessionToken)

      // Set session
      currentSession.value = response.session

      // Load character
      const characterStore = useCharacterStore()
      characterStore.setCurrentCharacter(response.character)

      // Load messages
      const chatStore = useChatStore()
      chatStore.loadMessages(response.messages)

      // Navigate to game view
      await router.push(`/game/${response.session.id}`)

    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Save current game
   * @param note - Optional save note
   * @returns Session token for loading the save
   */
  async function saveGame(note?: string): Promise<string> {
    if (!currentSession.value) {
      throw new Error('Žádná aktivní hra k uložení')
    }

    loading.value = true
    error.value = null

    try {
      const response = await gameService.saveGame(currentSession.value.id, note)
      return response.sessionToken
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * End current game session
   */
  async function endGame(): Promise<void> {
    if (!currentSession.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      await gameService.endGame(currentSession.value.id)
      clearSession()
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load all saved games for current user
   */
  async function loadSavedGames(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      savedGames.value = await gameService.getSavedGames()
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a saved game
   * @param sessionId - Session ID to delete
   */
  async function deleteGame(sessionId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await gameService.deleteGame(sessionId)

      // Remove from local savedGames list
      savedGames.value = savedGames.value.filter(game => game.sessionId !== sessionId)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update session data (for real-time updates from AI)
   * @param updates - Partial session updates
   */
  function updateSession(updates: Partial<GameSession>): void {
    if (currentSession.value) {
      currentSession.value = {
        ...currentSession.value,
        ...updates,
      }
    }
  }

  /**
   * Update current location
   * @param location - New location string
   */
  function updateLocation(location: string): void {
    if (currentSession.value) {
      currentSession.value.currentLocation = location
    }
  }

  /**
   * Clear current session (without API call)
   */
  function clearSession(): void {
    currentSession.value = null

    // Also clear chat messages
    const chatStore = useChatStore()
    chatStore.clearMessages()
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
    currentSession.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    currentSession,
    savedGames,
    loading,
    error,

    // Getters
    hasActiveSession,
    sessionToken,
    currentLocation,
    isSessionActive,

    // Actions
    startNewGame,
    loadGame,
    loadGameByToken,
    saveGame,
    endGame,
    loadSavedGames,
    deleteGame,
    updateSession,
    updateLocation,
    clearSession,
    clearError,
    reset,
  }
})
