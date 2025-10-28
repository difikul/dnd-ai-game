/**
 * Quota Types
 * TypeScript interfaces for Gemini API quota tracking
 */

/**
 * Quota statistics for a user
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
  nextResetMinute: Date
  nextResetDay: Date

  // Limits (constants)
  limitPerMinute: number
  limitPerDay: number
}

/**
 * Gemini usage record (matches Prisma model)
 */
export interface GeminiUsageRecord {
  id: string
  userId: string
  operation: string
  timestamp: Date
  success: boolean
  errorCode: string | null
}

/**
 * Tracking request data
 */
export interface TrackUsageRequest {
  userId: string
  operation: string
  success: boolean
  errorCode?: string | null
}
