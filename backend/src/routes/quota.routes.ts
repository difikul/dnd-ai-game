/**
 * Quota Routes
 * API endpoints for Gemini API quota management
 */

import express from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { quotaService } from '../services/quotaService'

const router = express.Router()

/**
 * GET /api/quota
 * Get current quota statistics for authenticated user
 */
router.get('/quota', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId

    console.log(`📊 GET /api/quota - user: ${userId}`)

    const stats = await quotaService.getQuotaStats(userId)

    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Error fetching quota stats:', error)

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch quota statistics'
    })
  }
})

export default router
