import { Router } from 'express'
import { testNarrator, testConnections } from '../controllers/testController'

const router = Router()

/**
 * POST /api/test/narrator
 * Test Gemini narrator response
 *
 * Body:
 * {
 *   "prompt": "Tell me a short fantasy story"
 * }
 */
router.post('/narrator', testNarrator)

/**
 * GET /api/test/connections
 * Test all service connections (DB + Gemini)
 */
router.get('/connections', testConnections)

export default router
