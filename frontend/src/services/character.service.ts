/**
 * Character API Service
 * API calls for character management
 */

import api from './api.service'
import type {
  Character,
  CreateCharacterDto,
  UpdateCharacterDto,
  ApiResponse,
  CharacterListResponse,
  ASIImprovement,
} from '@/types/character'

/**
 * Create a new character
 */
export async function createCharacter(data: CreateCharacterDto): Promise<Character> {
  const response = await api.post<ApiResponse<Character>>('/api/characters', data)

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se vytvořit postavu')
  }

  return response.data.data
}

/**
 * Get character by ID
 */
export async function getCharacter(id: string): Promise<Character> {
  const response = await api.get<ApiResponse<Character>>(`/api/characters/${id}`)

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Postava nenalezena')
  }

  return response.data.data
}

/**
 * Get all characters for current user
 */
export async function getAllCharacters(): Promise<Character[]> {
  const response = await api.get<ApiResponse<CharacterListResponse>>('/api/characters')

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se načíst postavy')
  }

  return response.data.data.characters
}

/**
 * Update character
 */
export async function updateCharacter(
  id: string,
  data: UpdateCharacterDto
): Promise<Character> {
  const response = await api.put<ApiResponse<Character>>(`/api/characters/${id}`, data)

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se aktualizovat postavu')
  }

  return response.data.data
}

/**
 * Delete character
 */
export async function deleteCharacter(id: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/characters/${id}`)

  if (!response.data.success) {
    throw new Error(response.data.error || 'Nepodařilo se smazat postavu')
  }
}

/**
 * Generate AI backstory for character
 */
export async function generateBackstory(data: {
  name: string
  race: string
  class: string
}): Promise<string> {
  const response = await api.post<ApiResponse<{ backstory: string }>>(
    '/api/characters/generate-backstory',
    data
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se vygenerovat backstory')
  }

  return response.data.data.backstory
}

/**
 * Apply Ability Score Improvement (ASI)
 * @param id - Character ID
 * @param improvements - Object with stat improvements (e.g., { strength: 2 } or { dexterity: 1, constitution: 1 })
 */
export async function applyAbilityScoreImprovement(
  id: string,
  improvements: ASIImprovement
): Promise<Character> {
  const response = await api.post<ApiResponse<Character>>(
    `/api/characters/${id}/ability-score-improvement`,
    { improvements }
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Nepodařilo se aplikovat ASI')
  }

  return response.data.data
}

export default {
  createCharacter,
  getCharacter,
  getAllCharacters,
  updateCharacter,
  deleteCharacter,
  generateBackstory,
  applyAbilityScoreImprovement,
}
