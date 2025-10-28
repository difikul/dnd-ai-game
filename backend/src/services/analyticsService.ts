/**
 * Analytics Service
 * Statistiky, metriky a abuse detection pro admin dashboard
 */

import { prisma } from '../config/database'
import type {
  AnalyticsOverview,
  GeminiUsageStats,
  AbuseDetectionResult,
  ErrorStats
} from '../types/admin.types'

// ============================================================================
// DASHBOARD OVERVIEW
// ============================================================================

/**
 * Get dashboard overview statistics
 * KPIs for admin dashboard
 */
export async function getOverviewStats(): Promise<AnalyticsOverview> {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Users stats
  const [totalUsers, activeUsers24h, newUsersToday, adminCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        OR: [
          { lastLoginAt: { gte: oneDayAgo } },
          { gameSessions: { some: { lastPlayedAt: { gte: oneDayAgo } } } }
        ]
      }
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfToday } }
    }),
    prisma.user.count({
      where: { role: 'admin' }
    })
  ])

  // Characters stats
  const [totalCharacters, charactersCreatedToday] = await Promise.all([
    prisma.character.count(),
    prisma.character.count({
      where: { createdAt: { gte: startOfToday } }
    })
  ])

  // Sessions stats
  const [totalSessions, activeSessions, completedToday] = await Promise.all([
    prisma.gameSession.count(),
    prisma.gameSession.count({
      where: { isActive: true }
    }),
    prisma.gameSession.count({
      where: {
        isActive: false,
        updatedAt: { gte: startOfToday }
      }
    })
  ])

  // Gemini API stats
  const [requestsToday, requestsLast7d, totalRequests, successfulRequests] = await Promise.all([
    prisma.geminiUsage.count({
      where: { timestamp: { gte: startOfToday } }
    }),
    prisma.geminiUsage.count({
      where: { timestamp: { gte: sevenDaysAgo } }
    }),
    prisma.geminiUsage.count(),
    prisma.geminiUsage.count({
      where: { success: true }
    })
  ])

  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0
  const avgPerUser = totalUsers > 0 ? totalRequests / totalUsers : 0

  return {
    users: {
      total: totalUsers,
      active24h: activeUsers24h,
      newToday: newUsersToday,
      admins: adminCount
    },
    characters: {
      total: totalCharacters,
      createdToday: charactersCreatedToday
    },
    sessions: {
      total: totalSessions,
      active: activeSessions,
      completedToday: completedToday
    },
    gemini: {
      requestsToday,
      requestsLast7d,
      successRate: Math.round(successRate * 100) / 100,
      avgPerUser: Math.round(avgPerUser * 100) / 100
    }
  }
}

// ============================================================================
// GEMINI USAGE ANALYTICS
// ============================================================================

/**
 * Get Gemini API usage statistics
 */
export async function getGeminiUsageStats(): Promise<GeminiUsageStats> {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Global stats
  const totalRequests = await prisma.geminiUsage.count()
  const successfulRequests = await prisma.geminiUsage.count({
    where: { success: true }
  })
  const failedRequests = await prisma.geminiUsage.count({
    where: { success: false }
  })

  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0

  // Top operations
  const operations = await prisma.geminiUsage.groupBy({
    by: ['operation'],
    _count: {
      operation: true
    },
    orderBy: {
      _count: {
        operation: 'desc'
      }
    },
    take: 10
  })

  const topOperations = operations.map((op) => ({
    operation: op.operation,
    count: op._count.operation,
    percentage: Math.round((op._count.operation / totalRequests) * 10000) / 100
  }))

  // Timeframes
  const [requests24h, requests7d, requests30d] = await Promise.all([
    prisma.geminiUsage.count({
      where: { timestamp: { gte: oneDayAgo } }
    }),
    prisma.geminiUsage.count({
      where: { timestamp: { gte: sevenDaysAgo } }
    }),
    prisma.geminiUsage.count({
      where: { timestamp: { gte: thirtyDaysAgo } }
    })
  ])

  // Per-user breakdown
  const userStats = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      _count: {
        select: {
          geminiUsage: true
        }
      }
    },
    orderBy: {
      geminiUsage: {
        _count: 'desc'
      }
    },
    take: 20 // Top 20 users
  })

  const byUser = await Promise.all(
    userStats.map(async (user) => {
      const [req24h, req7d, req30d, successful] = await Promise.all([
        prisma.geminiUsage.count({
          where: { userId: user.id, timestamp: { gte: oneDayAgo } }
        }),
        prisma.geminiUsage.count({
          where: { userId: user.id, timestamp: { gte: sevenDaysAgo } }
        }),
        prisma.geminiUsage.count({
          where: { userId: user.id, timestamp: { gte: thirtyDaysAgo } }
        }),
        prisma.geminiUsage.count({
          where: { userId: user.id, success: true }
        })
      ])

      const userSuccessRate =
        user._count.geminiUsage > 0 ? (successful / user._count.geminiUsage) * 100 : 0

      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        requests24h: req24h,
        requests7d: req7d,
        requests30d: req30d,
        successRate: Math.round(userSuccessRate * 100) / 100
      }
    })
  )

  return {
    global: {
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      topOperations
    },
    timeframes: {
      last24h: requests24h,
      last7d: requests7d,
      last30d: requests30d
    },
    byUser
  }
}

// ============================================================================
// ABUSE DETECTION
// ============================================================================

/**
 * Detect potential API abuse
 * Heuristika pro identifikaci problematických uživatelů
 */
export async function detectAbuse(): Promise<AbuseDetectionResult> {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get all users with their usage stats
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      isActive: true,
      _count: {
        select: {
          geminiUsage: true
        }
      }
    },
    where: {
      geminiUsage: {
        some: {
          timestamp: { gte: sevenDaysAgo }
        }
      }
    }
  })

  const abusers = await Promise.all(
    users.map(async (user) => {
      // Stats za posledních 24h a 7d
      const [req24h, req7d, failed24h, failed7d] = await Promise.all([
        prisma.geminiUsage.count({
          where: { userId: user.id, timestamp: { gte: oneDayAgo } }
        }),
        prisma.geminiUsage.count({
          where: { userId: user.id, timestamp: { gte: sevenDaysAgo } }
        }),
        prisma.geminiUsage.count({
          where: {
            userId: user.id,
            timestamp: { gte: oneDayAgo },
            success: false
          }
        }),
        prisma.geminiUsage.count({
          where: {
            userId: user.id,
            timestamp: { gte: sevenDaysAgo },
            success: false
          }
        })
      ])

      const failureRate24h = req24h > 0 ? (failed24h / req24h) * 100 : 0
      const failureRate7d = req7d > 0 ? (failed7d / req7d) * 100 : 0

      // Suspicion score heuristika (0-100)
      let suspicionScore = 0
      const reasons: string[] = []

      // 1. High request volume (>1000 per day = 40 points)
      if (req24h > 1000) {
        suspicionScore += 40
        reasons.push(`Extrémně vysoký počet requestů za 24h (${req24h})`)
      } else if (req24h > 500) {
        suspicionScore += 25
        reasons.push(`Vysoký počet requestů za 24h (${req24h})`)
      } else if (req24h > 200) {
        suspicionScore += 10
        reasons.push(`Nadprůměrný počet requestů za 24h (${req24h})`)
      }

      // 2. High failure rate (>50% = 30 points)
      if (failureRate24h > 50) {
        suspicionScore += 30
        reasons.push(`Vysoká failure rate 24h (${Math.round(failureRate24h)}%)`)
      } else if (failureRate24h > 30) {
        suspicionScore += 15
        reasons.push(`Zvýšená failure rate 24h (${Math.round(failureRate24h)}%)`)
      }

      // 3. Spike detection (7d avg vs 24h)
      const avgPerDay7d = req7d / 7
      if (req24h > avgPerDay7d * 3 && req24h > 100) {
        suspicionScore += 20
        reasons.push(`Spike v requestech (3x průměr za 7d)`)
      }

      // 4. Account status
      if (!user.isActive) {
        suspicionScore += 10
        reasons.push('Účet je deaktivován')
      }

      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        requestsLast24h: req24h,
        requestsLast7d: req7d,
        failedRequests: failed24h,
        failureRate: Math.round(failureRate24h * 100) / 100,
        suspicionScore: Math.min(100, suspicionScore),
        reasons
      }
    })
  )

  // Filter out users with low suspicion scores
  const suspiciousUsers = abusers.filter((user) => user.suspicionScore >= 20)

  // Sort by suspicion score (highest first)
  suspiciousUsers.sort((a, b) => b.suspicionScore - a.suspicionScore)

  return {
    abusers: suspiciousUsers
  }
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Get error statistics
 */
export async function getErrorStats(): Promise<ErrorStats> {
  // Get all errors from Gemini usage
  const errors = await prisma.geminiUsage.groupBy({
    by: ['errorCode'],
    where: {
      success: false,
      errorCode: { not: null }
    },
    _count: {
      errorCode: true
    },
    orderBy: {
      _count: {
        errorCode: 'desc'
      }
    }
  })

  const totalErrors = await prisma.geminiUsage.count({
    where: { success: false }
  })

  const totalRequests = await prisma.geminiUsage.count()
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

  // For each error code, get affected users and last occurrence
  const errorStats = await Promise.all(
    errors.map(async (error) => {
      if (!error.errorCode) return null

      const [affectedUsers, lastError] = await Promise.all([
        prisma.geminiUsage
          .findMany({
            where: {
              success: false,
              errorCode: error.errorCode
            },
            select: { userId: true },
            distinct: ['userId']
          })
          .then((users) => users.length),
        prisma.geminiUsage.findFirst({
          where: {
            success: false,
            errorCode: error.errorCode
          },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true }
        })
      ])

      return {
        errorCode: error.errorCode,
        count: error._count.errorCode,
        affectedUsers,
        lastOccurrence: lastError?.timestamp || new Date(),
        percentage: Math.round((error._count.errorCode / totalErrors) * 10000) / 100
      }
    })
  )

  return {
    errors: errorStats.filter((e) => e !== null) as any[],
    totalErrors,
    errorRate: Math.round(errorRate * 100) / 100
  }
}
