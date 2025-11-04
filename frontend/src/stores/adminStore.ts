/**
 * Admin Store
 * Pinia store pro admin panel - user management, analytics, monitoring
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api.service'
import { getErrorMessage } from '@/services/api.service'

// ============================================================================
// TYPES
// ============================================================================

export interface UserWithStats {
  user: {
    id: string
    email: string
    username: string
    role: string
    isActive: boolean
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
  }
  stats: {
    characterCount: number
    sessionCount: number
    messageCount: number
    geminiRequestsTotal: number
    geminiRequestsLast24h: number
    geminiRequestsLast7d: number
    lastActivity: Date | null
  }
}

export interface CharacterWithOwner {
  character: any
  owner: {
    id: string
    email: string
    username: string
  }
  stats: {
    sessionCount: number
    messageCount: number
  }
}

export interface SessionWithPlayer {
  session: any
  player: {
    id: string
    email: string
    username: string
  }
  character: {
    id: string
    name: string
    race: string
    class: string
    level: number
  }
  messageCount: number
}

export interface AnalyticsOverview {
  users: {
    total: number
    active24h: number
    newToday: number
    admins: number
  }
  characters: {
    total: number
    createdToday: number
  }
  sessions: {
    total: number
    active: number
    completedToday: number
  }
  gemini: {
    requestsToday: number
    requestsLast7d: number
    successRate: number
    avgPerUser: number
  }
}

// ============================================================================
// STORE
// ============================================================================

export const useAdminStore = defineStore('admin', () => {
  // State
  const users = ref<UserWithStats[]>([])
  const totalUsers = ref(0)
  const characters = ref<CharacterWithOwner[]>([])
  const totalCharacters = ref(0)
  const activeSessions = ref<SessionWithPlayer[]>([])
  const analytics = ref<AnalyticsOverview | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasData = computed(() => users.value.length > 0 || analytics.value !== null)

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Fetch users with pagination and filters
   */
  async function fetchUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: 'user' | 'admin'
    isActive?: boolean
  }): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/api/admin/users', { params })

      if (response.data.success) {
        users.value = response.data.data.users
        totalUsers.value = response.data.data.total
        console.log(`✅ Loaded ${users.value.length} users`)
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error fetching users:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get user by ID
   */
  async function getUserById(userId: string): Promise<UserWithStats | null> {
    try {
      const response = await api.get(`/api/admin/users/${userId}`)

      if (response.data.success) {
        return response.data.data
      }
      return null
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error fetching user:', err)
      return null
    }
  }

  /**
   * Update user (role, isActive)
   */
  async function updateUser(
    userId: string,
    data: { role?: 'user' | 'admin'; isActive?: boolean }
  ): Promise<boolean> {
    try {
      const response = await api.patch(`/api/admin/users/${userId}`, data)

      if (response.data.success) {
        // Refresh users list
        await fetchUsers()
        return true
      }
      return false
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error updating user:', err)
      return false
    }
  }

  /**
   * Ban user
   */
  async function banUser(userId: string, reason?: string): Promise<boolean> {
    try {
      const response = await api.post(`/api/admin/users/${userId}/ban`, { reason })

      if (response.data.success) {
        // Refresh users list
        await fetchUsers()
        return true
      }
      return false
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error banning user:', err)
      return false
    }
  }

  /**
   * Unban user
   */
  async function unbanUser(userId: string): Promise<boolean> {
    try {
      const response = await api.post(`/api/admin/users/${userId}/unban`)

      if (response.data.success) {
        // Refresh users list
        await fetchUsers()
        return true
      }
      return false
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error unbanning user:', err)
      return false
    }
  }

  /**
   * Delete user
   */
  async function deleteUser(userId: string): Promise<boolean> {
    try {
      const response = await api.delete(`/api/admin/users/${userId}`)

      if (response.data.success) {
        // Refresh users list
        await fetchUsers()
        return true
      }
      return false
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error deleting user:', err)
      return false
    }
  }

  // ============================================================================
  // CHARACTER MANAGEMENT
  // ============================================================================

  /**
   * Fetch characters with pagination
   */
  async function fetchCharacters(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/api/admin/characters', { params })

      if (response.data.success) {
        characters.value = response.data.data.characters
        totalCharacters.value = response.data.data.total
        console.log(`✅ Loaded ${characters.value.length} characters`)
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error fetching characters:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete character
   */
  async function deleteCharacter(characterId: string, reason?: string): Promise<boolean> {
    try {
      const response = await api.delete(`/api/admin/characters/${characterId}`, {
        data: { reason }
      })

      if (response.data.success) {
        // Refresh characters list
        await fetchCharacters()
        return true
      }
      return false
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error deleting character:', err)
      return false
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Fetch active sessions
   */
  async function fetchActiveSessions(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/api/admin/sessions/active')

      if (response.data.success) {
        activeSessions.value = response.data.data.sessions
        console.log(`✅ Loaded ${activeSessions.value.length} active sessions`)
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error fetching sessions:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Terminate session
   */
  async function terminateSession(sessionId: string, reason?: string): Promise<boolean> {
    try {
      const response = await api.post(`/api/admin/sessions/${sessionId}/terminate`, {
        reason
      })

      if (response.data.success) {
        // Refresh sessions list
        await fetchActiveSessions()
        return true
      }
      return false
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error terminating session:', err)
      return false
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Fetch analytics overview
   */
  async function fetchAnalytics(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/api/admin/analytics/overview')

      if (response.data.success) {
        analytics.value = response.data.data
        console.log('✅ Loaded analytics overview')
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error fetching analytics:', err)
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

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
    users.value = []
    totalUsers.value = 0
    characters.value = []
    totalCharacters.value = 0
    activeSessions.value = []
    analytics.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    users,
    totalUsers,
    characters,
    totalCharacters,
    activeSessions,
    analytics,
    loading,
    error,

    // Getters
    hasData,

    // Actions - Users
    fetchUsers,
    getUserById,
    updateUser,
    banUser,
    unbanUser,
    deleteUser,

    // Actions - Characters
    fetchCharacters,
    deleteCharacter,

    // Actions - Sessions
    fetchActiveSessions,
    terminateSession,

    // Actions - Analytics
    fetchAnalytics,

    // Utility
    clearError,
    reset
  }
})
