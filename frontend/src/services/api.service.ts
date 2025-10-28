/**
 * API Service
 * Axios instance with interceptors for API communication
 * Automatically adds auth token from authStore to all requests
 */

import axios from 'axios'
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000, // 30 sekund - kvůli Gemini AI volání které může trvat 15-20s
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - adds auth token from authStore
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()

    // Add auth token if available
    if (authStore.token && config.headers) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handles errors including 401 logout
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    const authStore = useAuthStore()

    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - logout user and redirect to login
          console.error('🔒 Token expiroval nebo je neplatný, odhlašuji...')
          authStore.logout()

          // Redirect na login (pokud nejsme už na login page)
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          break
        case 403:
          console.error('Forbidden access')
          break
        case 404:
          console.error('Resource not found')
          break
        case 500:
          console.error('Internal server error')
          break
        default:
          console.error('API error:', error.response.status)
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - no response received')
    } else {
      console.error('Error setting up request:', error.message)
    }

    return Promise.reject(error)
  }
)

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>

    if (axiosError.response?.data) {
      return (
        axiosError.response.data.message ||
        axiosError.response.data.error ||
        'Nastala chyba při komunikaci se serverem'
      )
    }

    if (axiosError.message) {
      return axiosError.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Neznámá chyba'
}

export default api
