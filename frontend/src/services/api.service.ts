/**
 * API Service
 * Axios instance with interceptors for API communication
 */

import axios from 'axios'
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login or clear auth
          localStorage.removeItem('auth_token')
          console.error('Unauthorized access')
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
