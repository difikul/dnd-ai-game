/**
 * Admin Controller
 * HTTP request handlers pro admin endpointy
 */

import { Request, Response } from 'express'
import * as adminService from '../services/adminService'
import type {
  UserListParams,
  CharacterListParams,
  SessionListParams,
  UpdateUserRequest
} from '../types/admin.types'

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/users
 * Seznam všech uživatelů s paginací a filtrováním
 */
export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const params: UserListParams = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string | undefined,
      role: req.query.role as 'user' | 'admin' | undefined,
      isActive: req.query.isActive === 'true'
        ? true
        : req.query.isActive === 'false'
        ? false
        : undefined,
      sortBy: (req.query.sortBy as any) || undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined
    }

    const result = await adminService.getAllUsers(params)

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error in getAllUsers controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst seznam uživatelů'
    })
  }
}

/**
 * GET /api/admin/users/:id
 * Detail uživatele včetně statistik
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const user = await adminService.getUserById(id)

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Uživatel nenalezen'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error: any) {
    console.error('Error in getUserById controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst detail uživatele'
    })
  }
}

/**
 * PATCH /api/admin/users/:id
 * Upravit uživatele (role, isActive)
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const data: UpdateUserRequest = req.body

    // Validace: nesmíš změnit vlastní účet
    if (req.user!.userId === id) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Nemůžeš upravovat vlastní účet'
      })
      return
    }

    // Validace request body
    if (!data.role && data.isActive === undefined) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Musíš zadat alespoň jedno pole k úpravě (role nebo isActive)'
      })
      return
    }

    // Validace role
    if (data.role && data.role !== 'user' && data.role !== 'admin') {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Neplatná role (povoleno: user, admin)'
      })
      return
    }

    await adminService.updateUser(id, data)

    // Log admin action
    await adminService.logAdminAction({
      adminId: req.user!.userId,
      action: 'USER_UPDATE',
      targetType: 'user',
      targetId: id,
      metadata: data
    })

    res.status(200).json({
      success: true,
      message: 'Uživatel byl úspěšně upraven'
    })
  } catch (error: any) {
    console.error('Error in updateUser controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se upravit uživatele'
    })
  }
}

/**
 * DELETE /api/admin/users/:id
 * Smazat uživatele (cascade delete všech dat)
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    // Validace: nesmíš smazat vlastní účet
    if (req.user!.userId === id) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Nemůžeš smazat vlastní účet'
      })
      return
    }

    // Zkontroluj, jestli uživatel existuje
    const user = await adminService.getUserById(id)
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Uživatel nenalezen'
      })
      return
    }

    await adminService.deleteUser(id)

    // Log admin action
    await adminService.logAdminAction({
      adminId: req.user!.userId,
      action: 'USER_DELETE',
      targetType: 'user',
      targetId: id,
      metadata: {
        deletedEmail: user.user.email,
        deletedUsername: user.user.username
      }
    })

    res.status(200).json({
      success: true,
      message: 'Uživatel byl úspěšně smazán'
    })
  } catch (error: any) {
    console.error('Error in deleteUser controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se smazat uživatele'
    })
  }
}

/**
 * POST /api/admin/users/:id/ban
 * Zabanovat uživatele (set isActive = false)
 */
export async function banUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { reason } = req.body

    // Validace: nesmíš zabanovat vlastní účet
    if (req.user!.userId === id) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Nemůžeš zabanovat vlastní účet'
      })
      return
    }

    await adminService.banUser(id)

    // Log admin action
    await adminService.logAdminAction({
      adminId: req.user!.userId,
      action: 'USER_BAN',
      targetType: 'user',
      targetId: id,
      metadata: { reason: reason || 'Bez uvedení důvodu' }
    })

    res.status(200).json({
      success: true,
      message: 'Uživatel byl zabanován'
    })
  } catch (error: any) {
    console.error('Error in banUser controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se zabanovat uživatele'
    })
  }
}

/**
 * POST /api/admin/users/:id/unban
 * Odbanovat uživatele (set isActive = true)
 */
export async function unbanUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    await adminService.unbanUser(id)

    // Log admin action
    await adminService.logAdminAction({
      adminId: req.user!.userId,
      action: 'USER_UNBAN',
      targetType: 'user',
      targetId: id
    })

    res.status(200).json({
      success: true,
      message: 'Uživatel byl odbanován'
    })
  } catch (error: any) {
    console.error('Error in unbanUser controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se odbanovat uživatele'
    })
  }
}

// ============================================================================
// CHARACTER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/characters
 * Seznam všech postav s paginací
 */
export async function getAllCharacters(req: Request, res: Response): Promise<void> {
  try {
    const params: CharacterListParams = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string | undefined,
      class: req.query.class as string | undefined,
      race: req.query.race as string | undefined,
      sortBy: (req.query.sortBy as any) || undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined
    }

    const result = await adminService.getAllCharacters(params)

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error in getAllCharacters controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst seznam postav'
    })
  }
}

/**
 * DELETE /api/admin/characters/:id
 * Smazat postavu (content moderation)
 */
export async function deleteCharacter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { reason } = req.body

    await adminService.deleteCharacter(id)

    // Log admin action
    await adminService.logAdminAction({
      adminId: req.user!.userId,
      action: 'CHARACTER_DELETE',
      targetType: 'character',
      targetId: id,
      metadata: { reason: reason || 'Content moderation' }
    })

    res.status(200).json({
      success: true,
      message: 'Postava byla smazána'
    })
  } catch (error: any) {
    console.error('Error in deleteCharacter controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se smazat postavu'
    })
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/sessions/active
 * Seznam aktivních herních sessions
 */
export async function getActiveSessions(req: Request, res: Response): Promise<void> {
  try {
    const result = await adminService.getActiveSessions()

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error in getActiveSessions controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst aktivní sessions'
    })
  }
}

/**
 * POST /api/admin/sessions/:id/terminate
 * Force ukončit session (set isActive = false)
 */
export async function terminateSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { reason } = req.body

    await adminService.terminateSession(id)

    // Log admin action
    await adminService.logAdminAction({
      adminId: req.user!.userId,
      action: 'SESSION_TERMINATE',
      targetType: 'session',
      targetId: id,
      metadata: { reason: reason || 'Admin terminated' }
    })

    res.status(200).json({
      success: true,
      message: 'Session byla ukončena'
    })
  } catch (error: any) {
    console.error('Error in terminateSession controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se ukončit session'
    })
  }
}

/**
 * DELETE /api/admin/sessions/:id
 * Smazat session
 */
export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { reason } = req.body

    await adminService.deleteSession(id)

    // Log admin action
    await adminService.logAdminAction({
      adminId: req.user!.userId,
      action: 'SESSION_DELETE',
      targetType: 'session',
      targetId: id,
      metadata: { reason: reason || 'Admin deleted' }
    })

    res.status(200).json({
      success: true,
      message: 'Session byla smazána'
    })
  } catch (error: any) {
    console.error('Error in deleteSession controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se smazat session'
    })
  }
}

// ============================================================================
// AUDIT LOG
// ============================================================================

/**
 * GET /api/admin/audit-log
 * Admin audit log
 */
export async function getAuditLog(req: Request, res: Response): Promise<void> {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
    const adminId = req.query.adminId as string | undefined
    const targetType = req.query.targetType as string | undefined
    const action = req.query.action as string | undefined

    const result = await adminService.getAdminAuditLog({
      page,
      limit,
      adminId,
      targetType,
      action
    })

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error in getAuditLog controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst audit log'
    })
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * GET /api/admin/analytics/overview
 * Dashboard overview statistics
 */
export async function getAnalyticsOverview(req: Request, res: Response): Promise<void> {
  try {
    const analyticsService = require('../services/analyticsService')
    const stats = await analyticsService.getOverviewStats()

    res.status(200).json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Error in getAnalyticsOverview controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst overview statistiky'
    })
  }
}

/**
 * GET /api/admin/analytics/gemini-usage
 * Gemini API usage statistics
 */
export async function getGeminiUsageStats(req: Request, res: Response): Promise<void> {
  try {
    const analyticsService = require('../services/analyticsService')
    const stats = await analyticsService.getGeminiUsageStats()

    res.status(200).json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Error in getGeminiUsageStats controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst Gemini usage statistiky'
    })
  }
}

/**
 * GET /api/admin/analytics/abuse-detection
 * Detect potential API abuse
 */
export async function detectAbuse(req: Request, res: Response): Promise<void> {
  try {
    const analyticsService = require('../services/analyticsService')
    const result = await analyticsService.detectAbuse()

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error in detectAbuse controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se spustit abuse detection'
    })
  }
}

/**
 * GET /api/admin/analytics/errors
 * Error tracking statistics
 */
export async function getErrorStats(req: Request, res: Response): Promise<void> {
  try {
    const analyticsService = require('../services/analyticsService')
    const stats = await analyticsService.getErrorStats()

    res.status(200).json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Error in getErrorStats controller:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst error statistiky'
    })
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const adminController = {
  // Users
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,

  // Characters
  getAllCharacters,
  deleteCharacter,

  // Sessions
  getActiveSessions,
  terminateSession,
  deleteSession,

  // Audit
  getAuditLog,

  // Analytics
  getAnalyticsOverview,
  getGeminiUsageStats,
  detectAbuse,
  getErrorStats
}
