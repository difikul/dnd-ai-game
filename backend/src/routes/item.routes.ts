/**
 * Item Routes - REST API endpoints pro inventory management
 * All routes require authentication
 */

import { Router } from 'express'
import * as itemController from '../controllers/itemController'
import { authenticateToken } from '../middleware/auth.middleware'
import { validateUUID } from '../middleware/validation.middleware'

const router = Router()

// Apply authentication middleware to all item routes
router.use(authenticateToken)

// ============================================================================
// Inventory CRUD Routes
// All routes are nested under /api/characters/:characterId/inventory
// ============================================================================

/**
 * GET /api/characters/:characterId/inventory
 * Nacte vsechny predmety postavy
 */
router.get(
  '/:characterId/inventory',
  validateUUID('characterId'),
  itemController.getInventory
)

/**
 * GET /api/characters/:characterId/inventory/bonuses
 * Vypocita bonusy z nasazenych predmetu
 * IMPORTANT: This route must be before /:itemId to avoid matching "bonuses" as itemId
 */
router.get(
  '/:characterId/inventory/bonuses',
  validateUUID('characterId'),
  itemController.getEquippedBonuses
)

/**
 * GET /api/characters/:characterId/inventory/:itemId
 * Nacte detail predmetu
 */
router.get(
  '/:characterId/inventory/:itemId',
  validateUUID('characterId'),
  validateUUID('itemId'),
  itemController.getItem
)

/**
 * POST /api/characters/:characterId/inventory
 * Prida predmet do inventare
 */
router.post(
  '/:characterId/inventory',
  validateUUID('characterId'),
  itemController.addItem
)

/**
 * PUT /api/characters/:characterId/inventory/:itemId
 * Aktualizuje predmet
 */
router.put(
  '/:characterId/inventory/:itemId',
  validateUUID('characterId'),
  validateUUID('itemId'),
  itemController.updateItem
)

/**
 * DELETE /api/characters/:characterId/inventory/:itemId
 * Smaze predmet
 */
router.delete(
  '/:characterId/inventory/:itemId',
  validateUUID('characterId'),
  validateUUID('itemId'),
  itemController.deleteItem
)

// ============================================================================
// Item Action Routes
// ============================================================================

/**
 * POST /api/characters/:characterId/inventory/:itemId/equip
 * Nasadi predmet
 */
router.post(
  '/:characterId/inventory/:itemId/equip',
  validateUUID('characterId'),
  validateUUID('itemId'),
  itemController.equipItem
)

/**
 * POST /api/characters/:characterId/inventory/:itemId/unequip
 * Sunda predmet
 */
router.post(
  '/:characterId/inventory/:itemId/unequip',
  validateUUID('characterId'),
  validateUUID('itemId'),
  itemController.unequipItem
)

/**
 * POST /api/characters/:characterId/inventory/:itemId/attune
 * Propoji predmet (attunement)
 */
router.post(
  '/:characterId/inventory/:itemId/attune',
  validateUUID('characterId'),
  validateUUID('itemId'),
  itemController.attuneItem
)

/**
 * POST /api/characters/:characterId/inventory/:itemId/unattune
 * Odpoji predmet (unattunement)
 */
router.post(
  '/:characterId/inventory/:itemId/unattune',
  validateUUID('characterId'),
  validateUUID('itemId'),
  itemController.unattuneItem
)

export default router
