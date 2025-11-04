/**
 * Admin Types (Frontend)
 * TypeScript interfaces pro admin panel - odpovídá backend API
 */

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export interface UserWithStats {
  user: {
    id: string
    email: string
    username: string
    role: 'user' | 'admin'
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

export interface UpdateUserRequest {
  role?: 'user' | 'admin'
  isActive?: boolean
}

export interface BanUserRequest {
  reason?: string
}

// ============================================================================
// CHARACTER MANAGEMENT
// ============================================================================

export interface CharacterWithOwner {
  character: {
    id: string
    name: string
    race: string
    class: string
    level: number
    experiencePoints: number
    createdAt: Date
    updatedAt: Date
  }
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

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface SessionWithPlayer {
  session: {
    id: string
    isActive: boolean
    currentLocation: string
    createdAt: Date
    lastPlayedAt: Date
  }
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

// ============================================================================
// ANALYTICS
// ============================================================================

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

export interface AbuseDetectionResult {
  abusers: Array<{
    userId: string
    username: string
    email: string
    requestsLast24h: number
    requestsLast7d: number
    failedRequests: number
    failureRate: number
    suspicionScore: number
    reasons: string[]
  }>
}

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
// AUDIT LOG
// ============================================================================

export interface AdminAuditLogEntry {
  id: string
  adminId: string
  admin: {
    id: string
    username: string
    email: string
  }
  action: AdminActionType
  targetType: 'user' | 'character' | 'session'
  targetId: string
  metadata?: Record<string, any>
  timestamp: Date
}

export type AdminActionType =
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'USER_BAN'
  | 'USER_UNBAN'
  | 'CHARACTER_DELETE'
  | 'SESSION_TERMINATE'
  | 'SESSION_DELETE'

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================================================
// FILTERS
// ============================================================================

export interface UserFilters extends PaginationParams {
  search?: string
  role?: 'user' | 'admin'
  isActive?: boolean
  sortBy?: 'createdAt' | 'lastLoginAt' | 'username' | 'email'
  sortOrder?: 'asc' | 'desc'
}

export interface CharacterFilters extends PaginationParams {
  search?: string
  class?: string
  race?: string
  sortBy?: 'createdAt' | 'level' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface AuditLogFilters extends PaginationParams {
  adminId?: string
  targetType?: 'user' | 'character' | 'session'
  action?: AdminActionType
}
