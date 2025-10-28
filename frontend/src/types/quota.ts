/**
 * Quota Types
 * TypeScript interfaces for Gemini API quota tracking (Frontend)
 */

/**
 * Quota statistics from backend
 */
export interface QuotaStats {
  // Request counts
  requestsLastMinute: number
  requestsLastDay: number

  // Remaining requests
  remainingPerMinute: number
  remainingPerDay: number

  // Percentage used
  percentUsedMinute: number
  percentUsedDay: number

  // Reset times
  nextResetMinute: string // ISO date string
  nextResetDay: string // ISO date string

  // Limits
  limitPerMinute: number
  limitPerDay: number
}

/**
 * API response for quota endpoint
 */
export interface QuotaResponse {
  success: boolean
  data: QuotaStats
  error?: string
  message?: string
}
