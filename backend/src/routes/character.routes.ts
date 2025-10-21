/**
 * Character Routes - REST API endpoints pro správu postav
 */

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as characterController from '../controllers/characterController'
import { validateRequest, validateUUID } from '../middleware/validation.middleware'
import { createCharacterSchema, updateCharacterSchema, generateBackstorySchema } from '../types/api.types'

const router = Router()

// Rate limiter pro AI generování (drahé volání)
const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 5, // Max 5 requests per minute
  message: 'Příliš mnoho požadavků na generování. Zkuste to za chvíli.',
  standardHeaders: true,
  legacyHeaders: false,
})

// ============================================================================
// Character CRUD Routes
// ============================================================================

/**
 * POST /api/characters
 * Vytvoří novou postavu
 * Body: CreateCharacterRequest
 */
router.post(
  '/',
  validateRequest(createCharacterSchema),
  characterController.createCharacter
)

/**
 * GET /api/characters
 * Načte všechny postavy
 */
router.get(
  '/',
  characterController.getAllCharacters
)

/**
 * GET /api/characters/:id
 * Načte jednu postavu podle ID
 */
router.get(
  '/:id',
  validateUUID('id'),
  characterController.getCharacterById
)

/**
 * PUT /api/characters/:id
 * Aktualizuje postavu
 * Body: UpdateCharacterRequest
 */
router.put(
  '/:id',
  validateUUID('id'),
  validateRequest(updateCharacterSchema),
  characterController.updateCharacter
)

/**
 * DELETE /api/characters/:id
 * Smaže postavu
 */
router.delete(
  '/:id',
  validateUUID('id'),
  characterController.deleteCharacter
)

// ============================================================================
// Character Action Routes
// ============================================================================

/**
 * POST /api/characters/:id/hp
 * Upraví HP postavy (healing nebo damage)
 * Body: { amount: number }
 */
router.post(
  '/:id/hp',
  validateUUID('id'),
  characterController.modifyHP
)

/**
 * POST /api/characters/:id/experience
 * Přidá experience postavě
 * Body: { amount: number }
 */
router.post(
  '/:id/experience',
  validateUUID('id'),
  characterController.addExperience
)

// ============================================================================
// AI Generation Routes
// ============================================================================

/**
 * POST /api/characters/generate-backstory
 * Vygeneruje AI backstory pro postavu pomocí Gemini
 * Body: { name: string, race: string, class: string }
 */
router.post(
  '/generate-backstory',
  aiGenerationLimiter,
  validateRequest(generateBackstorySchema),
  characterController.generateBackstory
)

export default router
