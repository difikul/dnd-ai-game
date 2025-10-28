/**
 * Admin Types
 * TypeScript interfaces pro admin API
 */

import type { User, Character, GameSession, Message, GeminiUsage } from '@prisma/client'

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * User with aggregated statistics
 */
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
    // Nikdy nevracet passwordHash nebo geminiApiKey!
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

/**
 * Paginated users list response
 */
export interface PaginatedUsersResponse {
  users: UserWithStats[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Update user request (admin only)
 */
export interface UpdateUserRequest {
  role?: 'user' | 'admin'
  isActive?: boolean
}

// ============================================================================
// CHARACTER MANAGEMENT
// ============================================================================

/**
 * Character with owner info
 */
export interface CharacterWithOwner {
  character: Character
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

/**
 * Paginated characters list response
 */
export interface PaginatedCharactersResponse {
  characters: CharacterWithOwner[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Session with player and character info
 */
export interface SessionWithPlayer {
  session: GameSession
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

/**
 * Active sessions response
 */
export interface ActiveSessionsResponse {
  sessions: SessionWithPlayer[]
  totalActive: number
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Dashboard overview statistics
 */
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

/**
 * Gemini API usage statistics
 */
export interface GeminiUsageStats {
  global: {
    totalRequests: number
    successRate: number
    errorRate: number
    topOperations: Array<{
      operation: string
      count: number
      percentage: number
    }>
  }
  timeframes: {
    last24h: number
    last7d: number
    last30d: number
  }
  byUser: Array<{
    userId: string
    username: string
    email: string
    requests24h: number
    requests7d: number
    requests30d: number
    successRate: number
  }>
}

/**
 * Abuse detection result
 */
export interface AbuseDetectionResult {
  abusers: Array<{
    userId: string
    username: string
    email: string
    requestsLast24h: number
    requestsLast7d: number
    failedRequests: number
    failureRate: number
    suspicionScore: number // 0-100
    reasons: string[] // Důvody podezření
  }>
}

/**
 * Error tracking statistics
 */
export interface ErrorStats {
  errors: Array<{
    errorCode: string
    count: number
    affectedUsers: number
    lastOccurrence: Date
    percentage: number
  }>
  totalErrors: number
  errorRate: number
}

// ============================================================================
// ADMIN AUDIT LOG
// ============================================================================

/**
 * Admin action types
 */
export type AdminActionType =
  | 'USER_BAN'
  | 'USER_UNBAN'
  | 'USER_DELETE'
  | 'USER_UPDATE'
  | 'CHARACTER_DELETE'
  | 'SESSION_TERMINATE'
  | 'SESSION_DELETE'

/**
 * Admin action target types
 */
export type AdminTargetType = 'user' | 'character' | 'session'

/**
 * Log admin action request
 */
export interface LogAdminActionRequest {
  adminId: string
  action: AdminActionType
  targetType: AdminTargetType
  targetId: string
  metadata?: {
    reason?: string
    notes?: string
    [key: string]: any
  }
}

/**
 * Admin audit log entry
 */
export interface AdminAuditLogEntry {
  id: string
  adminId: string
  adminUsername: string
  action: AdminActionType
  targetType: AdminTargetType
  targetId: string
  metadata: any
  timestamp: Date
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

/**
 * Common pagination params
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * User list query params
 */
export interface UserListParams extends PaginationParams {
  search?: string
  role?: 'user' | 'admin'
  isActive?: boolean
  sortBy?: 'createdAt' | 'lastLoginAt' | 'email' | 'username'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Character list query params
 */
export interface CharacterListParams extends PaginationParams {
  search?: string
  class?: string
  race?: string
  sortBy?: 'createdAt' | 'name' | 'level'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Session list query params
 */
export interface SessionListParams extends PaginationParams {
  isActive?: boolean
  sortBy?: 'createdAt' | 'lastPlayedAt'
  sortOrder?: 'asc' | 'desc'
}
