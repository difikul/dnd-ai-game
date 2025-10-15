/**
 * Character Store
 * Pinia store for character state management
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Character, CreateCharacterDto, UpdateCharacterDto } from '@/types/character'
import {
  createCharacter as apiCreateCharacter,
  getCharacter as apiGetCharacter,
  getAllCharacters as apiGetAllCharacters,
  updateCharacter as apiUpdateCharacter,
  deleteCharacter as apiDeleteCharacter,
} from '@/services/character.service'
import { getErrorMessage } from '@/services/api.service'

export const useCharacterStore = defineStore('character', () => {
  // State
  const currentCharacter = ref<Character | null>(null)
  const characters = ref<Character[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasCharacter = computed(() => currentCharacter.value !== null)
  const characterCount = computed(() => characters.value.length)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)

  // Actions

  /**
   * Create a new character
   */
  async function createCharacter(data: CreateCharacterDto): Promise<Character> {
    loading.value = true
    error.value = null

    try {
      const newCharacter = await apiCreateCharacter(data)
      currentCharacter.value = newCharacter
      characters.value.push(newCharacter)
      return newCharacter
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load a character by ID
   */
  async function loadCharacter(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const character = await apiGetCharacter(id)
      currentCharacter.value = character

      // Update in characters list if exists
      const index = characters.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        characters.value[index] = character
      } else {
        characters.value.push(character)
      }
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load all characters
   */
  async function loadAllCharacters(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const loadedCharacters = await apiGetAllCharacters()
      characters.value = loadedCharacters
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update a character
   */
  async function updateCharacter(id: string, data: UpdateCharacterDto): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updatedCharacter = await apiUpdateCharacter(id, data)

      // Update current character if it's the same
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = updatedCharacter
      }

      // Update in characters list
      const index = characters.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        characters.value[index] = updatedCharacter
      }
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a character
   */
  async function deleteCharacter(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await apiDeleteCharacter(id)

      // Clear current character if it's the same
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = null
      }

      // Remove from characters list
      characters.value = characters.value.filter((c) => c.id !== id)
    } catch (err) {
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Set current character (without API call)
   */
  function setCurrentCharacter(character: Character | null): void {
    currentCharacter.value = character
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Reset store
   */
  function reset(): void {
    currentCharacter.value = null
    characters.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    currentCharacter,
    characters,
    loading,
    error,

    // Getters
    hasCharacter,
    characterCount,
    isLoading,
    hasError,

    // Actions
    createCharacter,
    loadCharacter,
    loadAllCharacters,
    updateCharacter,
    deleteCharacter,
    setCurrentCharacter,
    clearError,
    reset,
  }
})
