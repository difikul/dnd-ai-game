/**
 * Bug Report Routes
 * API endpointy pro hlášení chyb a jejich správu
 */

import { Router } from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware'
import { uploadSingle } from '../middleware/upload.middleware'
import bugReportController from '../controllers/bugReportController'

const router = Router()

// ============================================================================
// PUBLIC ROUTES (vyžadují pouze autentizaci)
// ============================================================================

/**
 * POST /api/bug-reports
 * Vytvořit nový bug report
 * Body: { title, description, category, severity, url?, includeCurrentPage? }
 */
router.post('/', authenticateToken, bugReportController.createBugReport)

/**
 * POST /api/bug-reports/:id/screenshot
 * Přidat screenshot k bug reportu
 * Multipart form-data: { screenshot: File }
 */
router.post(
  '/:id/screenshot',
  authenticateToken,
  uploadSingle,
  bugReportController.addScreenshot
)

/**
 * GET /api/bug-reports/my
 * Získat moje bug reporty
 */
router.get('/my', authenticateToken, bugReportController.getMyBugReports)

// ============================================================================
// ADMIN ROUTES (vyžadují admin roli)
// ============================================================================

/**
 * GET /api/admin/bug-reports
 * Seznam všech bug reportů s filtrováním a paginací
 * Query params: page, limit, status, category, severity, assignedTo, sortBy, sortOrder
 */
router.get('/admin', authenticateToken, requireAdmin, bugReportController.listBugReports)

/**
 * GET /api/admin/bug-reports/stats
 * Statistiky bug reportů (pro admin dashboard)
 */
router.get('/admin/stats', authenticateToken, requireAdmin, bugReportController.getBugReportStats)

/**
 * GET /api/admin/bug-reports/:id
 * Detail bug reportu
 */
router.get('/admin/:id', authenticateToken, requireAdmin, bugReportController.getBugReportById)

/**
 * PATCH /api/admin/bug-reports/:id
 * Aktualizovat bug report (status, priority, assignedTo, adminNotes)
 * Body: { status?, priority?, assignedTo?, adminNotes? }
 */
router.patch('/admin/:id', authenticateToken, requireAdmin, bugReportController.updateBugReport)

/**
 * DELETE /api/admin/bug-reports/:id
 * Smazat bug report
 */
router.delete('/admin/:id', authenticateToken, requireAdmin, bugReportController.deleteBugReport)

export default router
