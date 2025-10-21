/**
 * Dice Routes
 * API routing pro dice rolling endpoints
 */

import { Router } from 'express'
import { diceController } from '../controllers/diceController'

const router = Router()

/**
 * POST /api/dice/roll
 * Roll dice with optional advantage/disadvantage
 */
router.post('/roll', diceController.roll)

/**
 * GET /api/dice/types
 * Get list of supported dice types and examples
 */
router.get('/types', diceController.getDiceTypes)

export default router
