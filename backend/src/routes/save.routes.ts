/**
 * Save Routes - REST API endpointy pro save/load funkcionalitu
 * Definuje HTTP routes a připojuje controller handlery
 */

import { Router } from 'express'
import { saveController } from '../controllers/saveController'

const router = Router()

// ============================================================================
// Save/Load Routes
// ============================================================================

/**
 * GET /api/saves
 * Získá seznam všech aktivních uložených her
 * Response: Array<SavedGameListItem>
 */
router.get('/', saveController.listSaves)

/**
 * POST /api/saves/:sessionId
 * Uloží hru a vrátí shareable token
 * Response: { sessionToken, sessionId }
 */
router.post('/:sessionId', saveController.saveGame)

/**
 * GET /api/saves/token/:token
 * Načte hru podle shareable tokenu
 * Response: { session, character, messages }
 */
router.get('/token/:token', saveController.loadByToken)

/**
 * DELETE /api/saves/:sessionId
 * Smaže uloženou hru (session) včetně všech zpráv
 * Response: { success: true, message }
 */
router.delete('/:sessionId', saveController.deleteGame)

/**
 * POST /api/saves/:sessionId/regenerate-token
 * Vygeneruje nový shareable token pro existující session
 * Response: { sessionToken, sessionId }
 */
router.post('/:sessionId/regenerate-token', saveController.regenerateToken)

// ============================================================================
// Export
// ============================================================================

export default router
