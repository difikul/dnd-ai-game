/**
 * Item Controller - HTTP request handlers pro Inventory API
 */

import { Request, Response } from 'express'
import { itemService, CreateItemDto, UpdateItemDto } from '../services/itemService'

/**
 * GET /api/characters/:characterId/inventory
 * Nacte inventar postavy
 */
export async function getInventory(req: Request, res: Response): Promise<void> {
  try {
    const { characterId } = req.params

    const items = await itemService.getInventory(req.user!.userId, characterId)

    res.status(200).json({
      success: true,
      data: items,
      count: items.length,
    })
  } catch (error) {
    console.error('Error v getInventory controller:', error)

    if (error instanceof Error && error.message === 'Postava nenalezena') {
      res.status(404).json({
        success: false,
        error: 'Postava nenalezena',
        message: error.message,
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se nacist inventar',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}

/**
 * GET /api/characters/:characterId/inventory/:itemId
 * Nacte detail predmetu
 */
export async function getItem(req: Request, res: Response): Promise<void> {
  try {
    const { characterId, itemId } = req.params

    const item = await itemService.getItem(req.user!.userId, characterId, itemId)

    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Predmet nenalezen',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: item,
    })
  } catch (error) {
    console.error('Error v getItem controller:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se nacist predmet',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}

/**
 * POST /api/characters/:characterId/inventory
 * Prida predmet do inventare
 */
export async function addItem(req: Request, res: Response): Promise<void> {
  try {
    const { characterId } = req.params
    const data: CreateItemDto = req.body

    const item = await itemService.addItem(req.user!.userId, characterId, data)

    res.status(201).json({
      success: true,
      data: item,
      message: `Predmet "${item.name}" byl pridan do inventare`,
    })
  } catch (error) {
    console.error('Error v addItem controller:', error)

    if (error instanceof Error && error.message === 'Postava nenalezena') {
      res.status(404).json({
        success: false,
        error: 'Postava nenalezena',
        message: error.message,
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se pridat predmet',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}

/**
 * PUT /api/characters/:characterId/inventory/:itemId
 * Aktualizuje predmet
 */
export async function updateItem(req: Request, res: Response): Promise<void> {
  try {
    const { characterId, itemId } = req.params
    const data: UpdateItemDto = req.body

    const item = await itemService.updateItem(req.user!.userId, characterId, itemId, data)

    res.status(200).json({
      success: true,
      data: item,
      message: 'Predmet byl aktualizovan',
    })
  } catch (error) {
    console.error('Error v updateItem controller:', error)

    if (error instanceof Error) {
      if (error.message === 'Postava nenalezena' || error.message === 'Predmet nenalezen') {
        res.status(404).json({
          success: false,
          error: error.message,
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se aktualizovat predmet',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}

/**
 * DELETE /api/characters/:characterId/inventory/:itemId
 * Smaze predmet
 */
export async function deleteItem(req: Request, res: Response): Promise<void> {
  try {
    const { characterId, itemId } = req.params

    await itemService.deleteItem(req.user!.userId, characterId, itemId)

    res.status(200).json({
      success: true,
      message: 'Predmet byl smazan',
    })
  } catch (error) {
    console.error('Error v deleteItem controller:', error)

    if (error instanceof Error) {
      if (error.message === 'Postava nenalezena' || error.message === 'Predmet nenalezen') {
        res.status(404).json({
          success: false,
          error: error.message,
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se smazat predmet',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}

/**
 * POST /api/characters/:characterId/inventory/:itemId/equip
 * Nasadi predmet
 */
export async function equipItem(req: Request, res: Response): Promise<void> {
  try {
    const { characterId, itemId } = req.params

    const item = await itemService.equipItem(req.user!.userId, characterId, itemId)

    res.status(200).json({
      success: true,
      data: item,
      message: `Predmet "${item.name}" byl nasazen`,
    })
  } catch (error) {
    console.error('Error v equipItem controller:', error)

    if (error instanceof Error) {
      if (error.message === 'Postava nenalezena' || error.message === 'Predmet nenalezen') {
        res.status(404).json({
          success: false,
          error: error.message,
        })
        return
      }

      if (error.message === 'Predmet je jiz nasazen') {
        res.status(400).json({
          success: false,
          error: error.message,
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se nasadit predmet',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}

/**
 * POST /api/characters/:characterId/inventory/:itemId/unequip
 * Sunda predmet
 */
export async function unequipItem(req: Request, res: Response): Promise<void> {
  try {
    const { characterId, itemId } = req.params

    const item = await itemService.unequipItem(req.user!.userId, characterId, itemId)

    res.status(200).json({
      success: true,
      data: item,
      message: `Predmet "${item.name}" byl sundan`,
    })
  } catch (error) {
    console.error('Error v unequipItem controller:', error)

    if (error instanceof Error) {
      if (error.message === 'Postava nenalezena' || error.message === 'Predmet nenalezen') {
        res.status(404).json({
          success: false,
          error: error.message,
        })
        return
      }

      if (error.message.includes('neni nasazen') || error.message.includes('odpojen')) {
        res.status(400).json({
          success: false,
          error: error.message,
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se sundat predmet',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}

/**
 * POST /api/characters/:characterId/inventory/:itemId/attune
 * Attune predmet (max 3)
 */
export async function attuneItem(req: Request, res: Response): Promise<void> {
  try {
    const { characterId, itemId } = req.params

    const item = await itemService.attuneItem(req.user!.userId, characterId, itemId)

    res.status(200).json({
      success: true,
      data: item,
      message: `Predmet "${item.name}" byl propojen (attuned)`,
    })
  } catch (error) {
    console.error('Error v attuneItem controller:', error)

    if (error instanceof Error) {
      if (error.message === 'Postava nenalezena' || error.message === 'Predmet nenalezen') {
        res.status(404).json({
          success: false,
          error: error.message,
        })
        return
      }

      // Validation errors
      if (
        error.message.includes('nevyzaduje attunement') ||
        error.message.includes('nasazen') ||
        error.message.includes('jiz attuned') ||
        error.message.includes('maximalne')
      ) {
        res.status(400).json({
          success: false,
          error: error.message,
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se propojit predmet',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}

/**
 * POST /api/characters/:characterId/inventory/:itemId/unattune
 * Unattune predmet
 */
export async function unattuneItem(req: Request, res: Response): Promise<void> {
  try {
    const { characterId, itemId } = req.params

    const item = await itemService.unattuneItem(req.user!.userId, characterId, itemId)

    res.status(200).json({
      success: true,
      data: item,
      message: `Predmet "${item.name}" byl odpojen (unattuned)`,
    })
  } catch (error) {
    console.error('Error v unattuneItem controller:', error)

    if (error instanceof Error) {
      if (error.message === 'Postava nenalezena' || error.message === 'Predmet nenalezen') {
        res.status(404).json({
          success: false,
          error: error.message,
        })
        return
      }

      if (error.message === 'Predmet neni attuned') {
        res.status(400).json({
          success: false,
          error: error.message,
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se odpojit predmet',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}

/**
 * GET /api/characters/:characterId/inventory/bonuses
 * Vypocita celkove bonusy z nasazenych predmetu
 */
export async function getEquippedBonuses(req: Request, res: Response): Promise<void> {
  try {
    const { characterId } = req.params

    // Verify character belongs to user
    const bonuses = await itemService.calculateEquippedBonuses(characterId)

    res.status(200).json({
      success: true,
      data: bonuses,
    })
  } catch (error) {
    console.error('Error v getEquippedBonuses controller:', error)

    res.status(500).json({
      success: false,
      error: 'Nepodarilo se vypocitat bonusy',
      message: error instanceof Error ? error.message : 'Neznama chyba',
    })
  }
}
