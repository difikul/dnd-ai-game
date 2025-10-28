import { Router } from 'express'
import * as authController from '../controllers/authController'
import { authenticateToken } from '../middleware/auth.middleware'
import rateLimit from 'express-rate-limit'

const router = Router()

// Rate limiter for auth endpoints (prevent brute force)
// In development: 50 attempts per 5 minutes
// In production: 5 attempts per 15 minutes
const isDevelopment = process.env.NODE_ENV === 'development'
const authLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 or 15 minutes
  max: isDevelopment ? 50 : 5, // 50 or 5 attempts per window
  message: {
    success: false,
    message: isDevelopment
      ? 'Příliš mnoho pokusů, zkuste to znovu za 5 minut'
      : 'Příliš mnoho pokusů, zkuste to znovu za 15 minut',
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
