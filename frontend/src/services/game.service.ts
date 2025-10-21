/**
 * Game Service
 * API service for game session management and AI interactions
 */

import api from './api.service'
import type {
  StartGameRequest,
  StartGameResponse,
  SendActionRequest,
  SendActionResponse,
  LoadGameResponse,
  SaveGameRequest,
  SaveGameResponse,
} from '@/types/game'

class GameService {
  /**
   * Start a new game session
   * @param characterId - ID of the character to use
   * @returns Game session and initial narrative
   */
  async startGame(characterId: string): Promise<StartGameResponse> {
    const payload: StartGameRequest = { characterId }
    const response = await api.post<{ success: boolean; data: StartGameResponse }>('/api/game/start', payload)
    return response.data.data
  }

  /**
   * Send player action to the AI and get narrative response
   * @param sessionId - Current game session ID
   * @param action - Player's action/input
   * @param characterId - Character ID for context
   * @returns AI narrative response with metadata
   */
  async sendAction(
    sessionId: string,
    action: string,
    characterId: string
  ): Promise<SendActionResponse> {
    const payload: SendActionRequest = { action, characterId }
    const response = await api.post<{ success: boolean; data: SendActionResponse }>(
      `/api/game/session/${sessionId}/action`,
      payload
    )
    return response.data.data
  }

  /**
   * Get current game state
   * @param sessionId - Game session ID
   * @returns Complete game state including session, character, and messages
   */
  async getGameState(sessionId: string): Promise<LoadGameResponse> {
    const response = await api.get<{ success: boolean; data: LoadGameResponse }>(`/api/game/session/${sessionId}`)
    return response.data.data
  }

  /**
   * Load a saved game by session token
   * @param sessionToken - Unique session token for saved game
   * @returns Complete game state
   */
  async loadGameByToken(sessionToken: string): Promise<LoadGameResponse> {
    const response = await api.get<{ success: boolean; data: LoadGameResponse }>(`/api/game/load/${sessionToken}`)
    return response.data.data
  }

  /**
   * Save current game state
   * @param sessionId - Current game session ID
   * @param note - Optional save note
   * @returns Save confirmation with token
   */
  async saveGame(sessionId: string, note?: string): Promise<SaveGameResponse> {
    const payload: SaveGameRequest = { sessionId, note }
    const response = await api.post<{ success: boolean; data: SaveGameResponse }>('/api/game/save', payload)
    return response.data.data
  }

  /**
   * End current game session
   * @param sessionId - Game session ID to end
   */
  async endGame(sessionId: string): Promise<void> {
    await api.post(`/api/game/session/${sessionId}/end`)
  }

  /**
   * Get all saved games for current user
   * @returns List of saved game sessions
   */
  async getSavedGames(): Promise<LoadGameResponse[]> {
    const response = await api.get<{ success: boolean; data: LoadGameResponse[] }>('/api/game/saves')
    return response.data.data
  }

  /**
   * Delete a saved game
   * @param sessionId - Session ID to delete
   */
  async deleteGame(sessionId: string): Promise<void> {
    await api.delete(`/api/game/session/${sessionId}`)
  }
}

export default new GameService()
