/**
 * Game Routes - HTTP routing pro herní endpointy
 * Obsahuje rate limiting, validaci a security middleware
 */

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { gameController } from '../controllers/gameController'

const router = Router()

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/**
 * Rate limiter pro /action endpoint
 * Omezení: 15 requestů za minutu per IP
 * Důvod: AI API volání jsou drahá a chceme zabránit abuse
 */
const actionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 15, // Max 15 requestů
  message: {
    error: 'Too Many Requests',
    message: 'Příliš mnoho akcí. Zkuste to znovu za chvíli.',
    retryAfter: '60 sekund'
  },
  standardHeaders: true, // Vrátí RateLimit-* headers
  legacyHeaders: false // Vypne X-RateLimit-* headers
})

/**
 * Rate limiter pro /start endpoint
 * Omezení:
 * - Development: 100 nových her za minutu (pro testování)
 * - Production: 5 nových her za hodinu per IP
 * Důvod: Prevence spamování nových sessions v produkci
 */
const startGameRateLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 60 * 1000, // Production: 1 hodina, Dev: 1 minuta
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Production: 5, Dev: 100
  message: {
    error: 'Too Many Requests',
    message: process.env.NODE_ENV === 'production'
      ? 'Příliš mnoho nových her. Zkuste to znovu za hodinu.'
      : 'Příliš mnoho nových her. Zkuste to znovu za minutu.',
    retryAfter: process.env.NODE_ENV === 'production' ? '1 hodina' : '1 minuta'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development if disabled
  skip: (req) => process.env.DISABLE_RATE_LIMIT === 'true'
})

/**
 * Obecný rate limiter pro read operace
 * Omezení: 30 requestů za minutu per IP
 */
const readRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 30,
  message: {
    error: 'Too Many Requests',
    message: 'Příliš mnoho requestů. Zkuste to znovu za chvíli.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/game/start
 * Spustí novou herní session
 *
 * Request Body:
 * {
 *   characterId: string (UUID)
 *   startingLocation?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     sessionId: string,
 *     sessionToken: string,
 *     narratorMessage: string,
 *     character: {...}
 *   }
 * }
 */
router.post('/start', startGameRateLimiter, gameController.startGame)

/**
 * POST /api/game/session/:id/action
 * Zpracuje akci hráče v aktivní session
 *
 * Params:
 * - id: Session UUID
 *
 * Request Body:
 * {
 *   action: string (1-500 znaků),
 *   characterId: string (UUID)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     narratorResponse: string,
 *     requiresDiceRoll?: boolean,
 *     diceType?: string,
 *     metadata?: {...}
 *   }
 * }
 */
router.post('/session/:id/action', actionRateLimiter, gameController.handleAction)

/**
 * GET /api/game/session/:id
 * Načte kompletní game state pro session
 *
 * Params:
 * - id: Session UUID
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     session: {...},
 *     character: {...},
 *     messages: [...]
 *   }
 * }
 */
router.get('/session/:id', readRateLimiter, gameController.getGameState)

/**
 * GET /api/game/session/token/:token
 * Načte game state podle session tokenu (pro load game)
 *
 * Params:
 * - token: Session token (gs_xxx)
 *
 * Response: Stejný jako GET /session/:id
 */
router.get('/session/token/:token', readRateLimiter, gameController.getGameStateByToken)

/**
 * POST /api/game/session/:id/end
 * Ukončí aktivní herní session
 *
 * Params:
 * - id: Session UUID
 *
 * Response:
 * {
 *   success: true,
 *   message: "Herní session byla ukončena"
 * }
 */
router.post('/session/:id/end', gameController.endGame)

// ============================================================================
// Export
// ============================================================================

export default router
