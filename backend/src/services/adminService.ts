/**
 * Admin Service
 * Business logika pro admin operace - user management, statistics, content moderation
 */

import { prisma } from '../config/database'
import type {
  UserWithStats,
  PaginatedUsersResponse,
  UpdateUserRequest,
  CharacterWithOwner,
  PaginatedCharactersResponse,
  SessionWithPlayer,
  ActiveSessionsResponse,
  LogAdminActionRequest,
  UserListParams,
  CharacterListParams,
  SessionListParams
} from '../types/admin.types'

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Get all users with stats and pagination
 */
export async function getAllUsers(params: UserListParams): Promise<PaginatedUsersResponse> {
  const {
    page = 1,
    limit = 50,
    search,
    role,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (role) {
    where.role = role
  }

  if (isActive !== undefined) {
    where.isActive = isActive
  }

  // Get total count
  const total = await prisma.user.count({ where })

  // Get users
  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      // Agregace přes relations
      _count: {
        select: {
          characters: true,
          gameSessions: true,
          geminiUsage: true
        }
      }
    }
  })

  // Pro každého uživatele získat detailnější statistiky
  const usersWithStats: UserWithStats[] = await Promise.all(
    users.map(async (user) => {
      // Spočítej message count přes sessions
      const messageCount = await prisma.message.count({
        where: {
          session: {
            userId: user.id
          }
        }
      })

      // Gemini requests za posledních 24h a 7d
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [geminiLast24h, geminiLast7d] = await Promise.all([
        prisma.geminiUsage.count({
          where: { userId: user.id, timestamp: { gte: oneDayAgo }, success: true }
        }),
        prisma.geminiUsage.count({
          where: { userId: user.id, timestamp: { gte: sevenDaysAgo }, success: true }
        })
      ])

      // Poslední aktivita (max z lastLoginAt a lastPlayedAt z sessions)
      const lastSession = await prisma.gameSession.findFirst({
        where: { userId: user.id },
        orderBy: { lastPlayedAt: 'desc' },
        select: { lastPlayedAt: true }
      })

      const lastActivity = user.lastLoginAt && lastSession?.lastPlayedAt
        ? user.lastLoginAt > lastSession.lastPlayedAt
          ? user.lastLoginAt
          : lastSession.lastPlayedAt
        : user.lastLoginAt || lastSession?.lastPlayedAt || null

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        stats: {
          characterCount: user._count.characters,
          sessionCount: user._count.gameSessions,
          messageCount,
          geminiRequestsTotal: user._count.geminiUsage,
          geminiRequestsLast24h: geminiLast24h,
          geminiRequestsLast7d: geminiLast7d,
          lastActivity
        }
      }
    })
  )

  return {
    users: usersWithStats,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Get user by ID with detailed stats
 */
export async function getUserById(userId: string): Promise<UserWithStats | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          characters: true,
          gameSessions: true,
          geminiUsage: true
        }
      }
    }
  })

  if (!user) return null

  // Spočítej message count
  const messageCount = await prisma.message.count({
    where: {
      session: {
        userId: user.id
      }
    }
  })

  // Gemini requests za různé periody
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [geminiLast24h, geminiLast7d] = await Promise.all([
    prisma.geminiUsage.count({
      where: { userId: user.id, timestamp: { gte: oneDayAgo }, success: true }
    }),
    prisma.geminiUsage.count({
      where: { userId: user.id, timestamp: { gte: sevenDaysAgo }, success: true }
    })
  ])

  // Poslední aktivita
  const lastSession = await prisma.gameSession.findFirst({
    where: { userId: user.id },
    orderBy: { lastPlayedAt: 'desc' },
    select: { lastPlayedAt: true }
  })

  const lastActivity = user.lastLoginAt && lastSession?.lastPlayedAt
    ? user.lastLoginAt > lastSession.lastPlayedAt
      ? user.lastLoginAt
      : lastSession.lastPlayedAt
    : user.lastLoginAt || lastSession?.lastPlayedAt || null

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    stats: {
      characterCount: user._count.characters,
      sessionCount: user._count.gameSessions,
      messageCount,
      geminiRequestsTotal: user._count.geminiUsage,
      geminiRequestsLast24h: geminiLast24h,
      geminiRequestsLast7d: geminiLast7d,
      lastActivity
    }
  }
}

/**
 * Update user (admin only)
 */
export async function updateUser(
  userId: string,
  data: UpdateUserRequest
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.role && { role: data.role }),
      ...(data.isActive !== undefined && { isActive: data.isActive })
    }
  })
}

/**
 * Ban user (set isActive = false)
 */
export async function banUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  })
}

/**
 * Unban user (set isActive = true)
 */
export async function unbanUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true }
  })
}

/**
 * Delete user (cascade delete all data)
 * VAROVÁNÍ: Toto smaže uživatele a všechny jeho postavy, sessions, messages, items!
 */
export async function deleteUser(userId: string): Promise<void> {
  await prisma.user.delete({
    where: { id: userId }
  })
}

// ============================================================================
// CHARACTER MANAGEMENT
// ============================================================================

/**
 * Get all characters with owner info and pagination
 */
export async function getAllCharacters(
  params: CharacterListParams
): Promise<PaginatedCharactersResponse> {
  const {
    page = 1,
    limit = 50,
    search,
    class: characterClass,
    race,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  if (characterClass) {
    where.class = characterClass
  }

  if (race) {
    where.race = race
  }

  // Get total count
  const total = await prisma.character.count({ where })

  // Get characters with owner
  const characters = await prisma.character.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true
        }
      },
      _count: {
        select: {
          gameSessions: true
        }
      }
    }
  })

  // Spočítej message count pro každou postavu
  const charactersWithOwner: CharacterWithOwner[] = await Promise.all(
    characters.map(async (char) => {
      const messageCount = await prisma.message.count({
        where: {
          session: {
            characterId: char.id
          }
        }
      })

      return {
        character: char,
        owner: char.user,
        stats: {
          sessionCount: char._count.gameSessions,
          messageCount
        }
      }
    })
  )

  return {
    characters: charactersWithOwner,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Delete character (content moderation)
 */
export async function deleteCharacter(characterId: string): Promise<void> {
  await prisma.character.delete({
    where: { id: characterId }
  })
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Get active sessions
 */
export async function getActiveSessions(): Promise<ActiveSessionsResponse> {
  const sessions = await prisma.gameSession.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true
        }
      },
      character: {
        select: {
          id: true,
          name: true,
          race: true,
          class: true,
          level: true
        }
      },
      _count: {
        select: {
          messages: true
        }
      }
    },
    orderBy: { lastPlayedAt: 'desc' }
  })

  const sessionsWithPlayer: SessionWithPlayer[] = sessions.map((session) => ({
    session: {
      id: session.id,
      sessionToken: session.sessionToken,
      userId: session.userId,
      characterId: session.characterId,
      currentLocation: session.currentLocation,
      questLog: session.questLog,
      worldState: session.worldState,
      isActive: session.isActive,
      lastPlayedAt: session.lastPlayedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    },
    player: session.user,
    character: session.character,
    messageCount: session._count.messages
  }))

  return {
    sessions: sessionsWithPlayer,
    totalActive: sessions.length
  }
}

/**
 * Terminate session (set isActive = false)
 */
export async function terminateSession(sessionId: string): Promise<void> {
  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { isActive: false }
  })
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.gameSession.delete({
    where: { id: sessionId }
  })
}

// ============================================================================
// ADMIN AUDIT LOG
// ============================================================================

/**
 * Log admin action to audit trail
 */
export async function logAdminAction(request: LogAdminActionRequest): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      adminId: request.adminId,
      action: request.action,
      targetType: request.targetType,
      targetId: request.targetId,
      metadata: request.metadata || {},
      timestamp: new Date()
    }
  })

  console.log(
    `🔐 Admin action logged: ${request.action} on ${request.targetType}:${request.targetId} by admin:${request.adminId}`
  )
}

/**
 * Get admin audit log with pagination
 */
export async function getAdminAuditLog(params: {
  page?: number
  limit?: number
  adminId?: string
  targetType?: string
  action?: string
}) {
  const { page = 1, limit = 100, adminId, targetType, action } = params
  const skip = (page - 1) * limit

  const where: any = {}
  if (adminId) where.adminId = adminId
  if (targetType) where.targetType = targetType
  if (action) where.action = action

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        admin: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.adminAuditLog.count({ where })
  ])

  return {
    logs: logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      adminUsername: log.admin.username,
      adminEmail: log.admin.email,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      timestamp: log.timestamp
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}
