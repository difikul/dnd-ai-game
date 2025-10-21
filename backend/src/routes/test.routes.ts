import { Router } from 'express'
import { testNarrator, testConnections } from '../controllers/testController'
import { aiRateLimiter } from '../middleware/rateLimiting.middleware'

const router = Router()

/**
 * POST /api/test/narrator
 * Test Gemini narrator response
 * Rate limited: 15 requests per 15 minutes (Gemini free tier limit)
 *
 * Body:
 * {
 *   "prompt": "Tell me a short fantasy story"
 * }
 */
router.post('/narrator', aiRateLimiter, testNarrator)

/**
 * GET /api/test/connections
 * Test all service connections (DB + Gemini)
 */
router.get('/connections', testConnections)

export default router
