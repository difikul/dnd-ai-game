import { Router } from 'express'
import * as authController from '../controllers/authController'
import { authenticateToken } from '../middleware/auth.middleware'
import rateLimit from 'express-rate-limit'

const router = Router()

// Rate limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Příliš mnoho pokusů, zkuste to znovu za 15 minut',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Public routes (no authentication required)
 */

// POST /api/auth/register
router.post('/register', authLimiter, authController.register)

// POST /api/auth/login
router.post('/login', authLimiter, authController.login)

/**
 * Protected routes (authentication required)
 */

// GET /api/auth/me
router.get('/me', authenticateToken, authController.getCurrentUser)

// PUT /api/auth/gemini-key
router.put('/gemini-key', authenticateToken, authController.updateGeminiKey)

export default router
