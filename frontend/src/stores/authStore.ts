/**
 * Auth Store - Správa autentizace (login, register, JWT token)
 * Ukládá token do localStorage pro persistenci napříč sessions
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// TypeScript interfaces pro API responses
interface User {
  id: string
  email: string
  username: string
  role: string
  hasGeminiKey: boolean
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface AuthResponse {
  token: string
  user: User
}

interface RegisterData {
  email: string
  username: string
  password: string
  geminiApiKey?: string
}

interface LoginData {
  emailOrUsername: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  // ============================================================================
  // State
  // ============================================================================

  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // Computed
  // ============================================================================

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const hasGeminiKey = computed(() => user.value?.hasGeminiKey ?? false)

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Registrace nového uživatele
   */
  async function register(data: RegisterData): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await axios.post<{ success: boolean; data: AuthResponse }>(
        `${API_URL}/api/auth/register`,
        data
      )

      if (response.data.success) {
        // Ulož token a user data
        token.value = response.data.data.token
        user.value = response.data.data.user
        localStorage.setItem('auth_token', response.data.data.token)

        console.log('✅ Registrace úspěšná:', user.value.username)
      }
    } catch (err: any) {
      console.error('❌ Chyba při registraci:', err)
      error.value = err.response?.data?.message || 'Nepodařilo se zaregistrovat'
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Přihlášení existujícího uživatele
   */
  async function login(data: LoginData): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await axios.post<{ success: boolean; data: AuthResponse }>(
        `${API_URL}/api/auth/login`,
        data
      )

      if (response.data.success) {
        // Ulož token a user data
        token.value = response.data.data.token
        user.value = response.data.data.user
        localStorage.setItem('auth_token', response.data.data.token)

        console.log('✅ Přihlášení úspěšné:', user.value.username)
      }
    } catch (err: any) {
      console.error('❌ Chyba při přihlášení:', err)
      error.value = err.response?.data?.message || 'Nepodařilo se přihlásit'
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Odhlášení uživatele (smaže token z localStorage)
   */
  function logout(): void {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    console.log('👋 Odhlášeno')
  }

  /**
   * Načtení aktuálního uživatele z backendu (validace tokenu)
   * Volá se při načtení aplikace, pokud je token v localStorage
   */
  async function fetchCurrentUser(): Promise<void> {
    if (!token.value) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await axios.get<{ success: boolean; data: User }>(
        `${API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        }
      )

      if (response.data.success) {
        user.value = response.data.data
        console.log('✅ User data načtena:', user.value.username)
      }
    } catch (err: any) {
      console.error('❌ Chyba při načítání user data:', err)

      // Pokud token není platný (401), odhlásit uživatele
      if (err.response?.status === 401) {
        console.log('🔒 Token expiroval, odhlašuji...')
        logout()
      }

      error.value = 'Nepodařilo se načíst údaje o uživateli'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Aktualizace Gemini API klíče uživatele
   */
  async function updateGeminiKey(geminiApiKey: string): Promise<void> {
    if (!token.value) {
      throw new Error('Uživatel není přihlášen')
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await axios.put<{ success: boolean; data: User }>(
        `${API_URL}/api/auth/gemini-key`,
        { geminiApiKey },
        {
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        }
      )

      if (response.data.success) {
        user.value = response.data.data
        console.log('✅ Gemini API klíč aktualizován')
      }
    } catch (err: any) {
      console.error('❌ Chyba při aktualizaci Gemini API klíče:', err)
      error.value = err.response?.data?.message || 'Nepodařilo se aktualizovat API klíč'
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Vyčištění error zprávy
   */
  function clearError(): void {
    error.value = null
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    token,
    user,
    isLoading,
    error,

    // Computed
    isAuthenticated,
    isAdmin,
    hasGeminiKey,

    // Actions
    register,
    login,
    logout,
    fetchCurrentUser,
    updateGeminiKey,
    clearError
  }
})
