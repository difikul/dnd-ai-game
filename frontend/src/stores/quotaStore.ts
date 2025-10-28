/**
 * Quota Store
 * Pinia store for Gemini API quota management
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { QuotaStats } from '@/types/quota'
import api from '@/services/api.service'
import { getErrorMessage } from '@/services/api.service'

export const useQuotaStore = defineStore('quota', () => {
  // State
  const stats = ref<QuotaStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const autoRefreshInterval = ref<number | null>(null)

  // Getters
  const hasStats = computed(() => stats.value !== null)

  const isWarning = computed(() => {
    if (!stats.value) return false
    return stats.value.percentUsedMinute >= 80 || stats.value.percentUsedDay >= 80
  })

  const isCritical = computed(() => {
    if (!stats.value) return false
    return stats.value.percentUsedMinute >= 90 || stats.value.percentUsedDay >= 90
  })

  const isExceeded = computed(() => {
    if (!stats.value) return false
    return stats.value.remainingPerMinute <= 0 || stats.value.remainingPerDay <= 0
  })

  const timeUntilResetMinute = computed(() => {
    if (!stats.value) return null
    const resetTime = new Date(stats.value.nextResetMinute)
    const now = new Date()
    const diff = Math.max(0, resetTime.getTime() - now.getTime())
    return Math.ceil(diff / 1000) // seconds
  })

  const timeUntilResetDay = computed(() => {
    if (!stats.value) return null
    const resetTime = new Date(stats.value.nextResetDay)
    const now = new Date()
    const diff = Math.max(0, resetTime.getTime() - now.getTime())
    return Math.ceil(diff / 3600000) // hours
  })

  // Actions

  /**
   * Fetch quota statistics from API
   */
  async function fetchQuota(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await api.get<{ success: boolean; data: QuotaStats }>('/api/quota')

      if (response.data.success) {
        stats.value = response.data.data
        console.log('📊 Quota stats loaded:', stats.value)
      } else {
        throw new Error('Failed to fetch quota stats')
      }
    } catch (err: any) {
      error.value = getErrorMessage(err)
      console.error('❌ Error fetching quota:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Start auto-refresh interval
   * @param intervalMs - Refresh interval in milliseconds (default: 10000ms = 10s)
   */
  function startAutoRefresh(intervalMs: number = 10000): void {
    // Clear existing interval if any
    stopAutoRefresh()

    console.log(`🔄 Starting auto-refresh (every ${intervalMs / 1000}s)`)

    // Fetch immediately
    fetchQuota()

    // Set up interval
    autoRefreshInterval.value = window.setInterval(() => {
      fetchQuota()
    }, intervalMs)
  }

  /**
   * Stop auto-refresh interval
   */
  function stopAutoRefresh(): void {
    if (autoRefreshInterval.value !== null) {
      console.log('⏹️  Stopping auto-refresh')
      clearInterval(autoRefreshInterval.value)
      autoRefreshInterval.value = null
    }
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
    stopAutoRefresh()
    stats.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    stats,
    loading,
    error,

    // Getters
    hasStats,
    isWarning,
    isCritical,
    isExceeded,
    timeUntilResetMinute,
    timeUntilResetDay,

    // Actions
    fetchQuota,
    startAutoRefresh,
    stopAutoRefresh,
    clearError,
    reset
  }
})
