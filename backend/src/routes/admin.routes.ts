/**
 * Admin Routes
 * API endpointy pro admin operace - user management, content moderation, analytics
 * Všechny routes vyžadují autentizaci + admin roli
 */

import { Router } from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware'
import { adminController } from '../controllers/adminController'

const router = Router()

// Všechny admin routes vyžadují autentizaci + admin roli
router.use(authenticateToken, requireAdmin)

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/users
 * Seznam všech uživatelů s paginací a filtrováním
 * Query params: page, limit, search, role, isActive, sortBy, sortOrder
 */
router.get('/users', adminController.getAllUsers)

/**
 * GET /api/admin/users/:id
 * Detail uživatele včetně statistik
 */
router.get('/users/:id', adminController.getUserById)

/**
 * PATCH /api/admin/users/:id
 * Upravit uživatele (role, isActive)
 * Body: { role?: "user" | "admin", isActive?: boolean }
 */
router.patch('/users/:id', adminController.updateUser)

/**
 * DELETE /api/admin/users/:id
 * Smazat uživatele (cascade delete všech dat)
 * Body: { reason?: string }
 */
router.delete('/users/:id', adminController.deleteUser)

/**
 * POST /api/admin/users/:id/ban
 * Zabanovat uživatele (set isActive = false)
 * Body: { reason?: string }
 */
router.post('/users/:id/ban', adminController.banUser)

/**
 * POST /api/admin/users/:id/unban
 * Odbanovat uživatele (set isActive = true)
 */
router.post('/users/:id/unban', adminController.unbanUser)

// ============================================================================
// CHARACTER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/characters
 * Seznam všech postav s paginací
 * Query params: page, limit, search, class, race, sortBy, sortOrder
 */
router.get('/characters', adminController.getAllCharacters)

/**
 * DELETE /api/admin/characters/:id
 * Smazat postavu (content moderation)
 * Body: { reason?: string }
 */
router.delete('/characters/:id', adminController.deleteCharacter)

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/sessions/active
 * Seznam aktivních herních sessions
 */
router.get('/sessions/active', adminController.getActiveSessions)

/**
 * POST /api/admin/sessions/:id/terminate
 * Force ukončit session (set isActive = false)
 * Body: { reason?: string }
 */
router.post('/sessions/:id/terminate', adminController.terminateSession)

/**
 * DELETE /api/admin/sessions/:id
 * Smazat session
 * Body: { reason?: string }
 */
router.delete('/sessions/:id', adminController.deleteSession)

// ============================================================================
// AUDIT LOG
// ============================================================================

/**
 * GET /api/admin/audit-log
 * Admin audit log s paginací
 * Query params: page, limit, adminId, targetType, action
 */
router.get('/audit-log', adminController.getAuditLog)

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * GET /api/admin/analytics/overview
 * Dashboard overview statistics (KPIs)
 */
router.get('/analytics/overview', adminController.getAnalyticsOverview)

/**
 * GET /api/admin/analytics/gemini-usage
 * Gemini API usage statistics (global + per user)
 */
router.get('/analytics/gemini-usage', adminController.getGeminiUsageStats)

/**
 * GET /api/admin/analytics/abuse-detection
 * Detect potential API abuse (suspicion scores)
 */
router.get('/analytics/abuse-detection', adminController.detectAbuse)

/**
 * GET /api/admin/analytics/errors
 * Error tracking statistics
 */
router.get('/analytics/errors', adminController.getErrorStats)

export default router
