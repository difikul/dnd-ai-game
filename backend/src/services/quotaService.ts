/**
 * Quota Service
 * Tracks Gemini API usage and provides quota statistics
 */

import { prisma } from '../config/database'
import type { QuotaStats, TrackUsageRequest } from '../types/quota.types'

class QuotaService {
  // Gemini API Free Tier Limits
  private readonly LIMIT_PER_MINUTE = 15
  private readonly LIMIT_PER_DAY = 1500

  // Cache for quota stats (10 second TTL)
  private cache: Map<string, { stats: QuotaStats; expiry: number }> = new Map()
  private readonly CACHE_TTL_MS = 10000 // 10 seconds

  /**
   * Get quota statistics for a user
   * @param userId - User ID
   * @returns Quota statistics
   */
  async getQuotaStats(userId: string): Promise<QuotaStats> {
    // Check cache first
    const cached = this.cache.get(userId)
    if (cached && Date.now() < cached.expiry) {
      console.log(`📊 Quota stats for user ${userId} from cache`)
      return cached.stats
    }

    console.log(`📊 Calculating quota stats for user ${userId}`)

    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Query requests in last minute
    const requestsLastMinute = await prisma.geminiUsage.count({
      where: {
        userId,
        timestamp: {
          gte: oneMinuteAgo
        },
        success: true // Only count successful requests towards quota
      }
    })

    // Query requests in last day
    const requestsLastDay = await prisma.geminiUsage.count({
      where: {
        userId,
        timestamp: {
          gte: oneDayAgo
        },
        success: true
      }
    })

    // Calculate remaining requests
    const remainingPerMinute = Math.max(0, this.LIMIT_PER_MINUTE - requestsLastMinute)
    const remainingPerDay = Math.max(0, this.LIMIT_PER_DAY - requestsLastDay)

    // Calculate percentage used
    const percentUsedMinute = Math.min(100, (requestsLastMinute / this.LIMIT_PER_MINUTE) * 100)
    const percentUsedDay = Math.min(100, (requestsLastDay / this.LIMIT_PER_DAY) * 100)

    // Calculate next reset times
    const nextResetMinute = this.calculateNextReset('minute', oneMinuteAgo)
    const nextResetDay = this.calculateNextReset('day', oneDayAgo)

    const stats: QuotaStats = {
      requestsLastMinute,
      requestsLastDay,
      remainingPerMinute,
      remainingPerDay,
      percentUsedMinute,
      percentUsedDay,
      nextResetMinute,
      nextResetDay,
      limitPerMinute: this.LIMIT_PER_MINUTE,
      limitPerDay: this.LIMIT_PER_DAY
    }

    // Cache the stats
    this.cache.set(userId, {
      stats,
      expiry: Date.now() + this.CACHE_TTL_MS
    })

    return stats
  }

  /**
   * Track Gemini API usage
   * @param request - Tracking request data
   */
  async trackUsage(request: TrackUsageRequest): Promise<void> {
    const { userId, operation, success, errorCode } = request

    try {
      await prisma.geminiUsage.create({
        data: {
          userId,
          operation,
          success,
          errorCode: errorCode || null
        }
      })

      // Invalidate cache for this user
      this.cache.delete(userId)

      console.log(
        `✅ Tracked usage: user=${userId}, operation=${operation}, success=${success}${errorCode ? `, error=${errorCode}` : ''}`
      )
    } catch (error) {
      console.error('❌ Failed to track usage:', error)
      // Don't throw - tracking failures shouldn't break the main flow
    }
  }

  /**
   * Check if user has exceeded quota
   * @param userId - User ID
   * @returns true if quota exceeded
   */
  async isQuotaExceeded(userId: string): Promise<boolean> {
    const stats = await this.getQuotaStats(userId)
    return stats.remainingPerMinute <= 0 || stats.remainingPerDay <= 0
  }

  /**
   * Calculate next reset time
   * @param period - 'minute' or 'day'
   * @param startTime - Start of the current period
   * @returns Date of next reset
   */
  private calculateNextReset(period: 'minute' | 'day', startTime: Date): Date {
    const now = new Date()

    if (period === 'minute') {
      // Next reset is 60 seconds after startTime
      return new Date(startTime.getTime() + 60 * 1000)
    } else {
      // Next reset is 24 hours after startTime
      return new Date(startTime.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Clear cache (for testing or manual invalidation)
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 Quota cache cleared')
  }
}

// Export singleton instance
export const quotaService = new QuotaService()
