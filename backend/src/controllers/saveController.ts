/**
 * Save Controller - HTTP request handlers pro save/load endpointy
 * Zodpovědný za validaci vstupů, volání saveService a formátování HTTP responses
 */

import { Request, Response } from 'express'
import { saveService } from '../services/saveService'
import { z } from 'zod'

// ============================================================================
// Validation Schemas
// ============================================================================

const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid('Neplatné UUID session')
})

const tokenParamSchema = z.object({
  token: z.string().min(1, 'Token je povinný')
})

// ============================================================================
// Controller Functions
// ============================================================================

/**
 * GET /api/saves
 * Vrátí seznam všech aktivních uložených her
 */
export async function listSaves(req: Request, res: Response): Promise<void> {
  try {
    const savedGames = await saveService.listActiveSessions()

    res.status(200).json({
      success: true,
      data: savedGames,
      count: savedGames.length
    })
  } catch (error: any) {
    console.error('Chyba v listSaves controller:', error)

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst seznam uložených her',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

/**
 * POST /api/saves/:sessionId
 * Uloží hru a vrátí shareable token
 */
export async function saveGame(req: Request, res: Response): Promise<void> {
  try {
    // Validace params
    const paramsValidation = sessionIdParamSchema.safeParse(req.params)

    if (!paramsValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Validace selhala',
        message: 'Neplatné ID session',
        details: paramsValidation.error.errors
      })
      return
    }

    const { sessionId } = paramsValidation.data

    // Zavolej service
    const sessionToken = await saveService.saveGame(sessionId)

    res.status(200).json({
      success: true,
      data: {
        sessionToken,
        sessionId
      },
      message: 'Hra byla úspěšně uložena'
    })
  } catch (error: any) {
    console.error('Chyba v saveGame controller:', error)

    // Handle známé chyby
    if (error.message === 'Herní session nenalezena') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      })
      return
    }

    // Obecná chyba
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se uložit hru',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

/**
 * GET /api/saves/token/:token
 * Načte hru podle shareable tokenu
 */
export async function loadByToken(req: Request, res: Response): Promise<void> {
  try {
    // Validace params
    const paramsValidation = tokenParamSchema.safeParse(req.params)

    if (!paramsValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Validace selhala',
        message: 'Token je povinný',
        details: paramsValidation.error.errors
      })
      return
    }

    const { token } = paramsValidation.data

    // Zavolej service
    const gameSession = await saveService.loadGameByToken(token)

    // Připrav response ve stejném formátu jako gameController.getGameState
    res.status(200).json({
      success: true,
      data: {
        session: {
          id: gameSession.id,
          sessionToken: gameSession.sessionToken,
          currentLocation: gameSession.currentLocation,
          questLog: gameSession.questLog,
          worldState: gameSession.worldState,
          isActive: gameSession.isActive,
          lastPlayedAt: gameSession.lastPlayedAt,
          createdAt: gameSession.createdAt
        },
        character: gameSession.character,
        messages: gameSession.messages
      },
      message: 'Hra byla úspěšně načtena'
    })
  } catch (error: any) {
    console.error('Chyba v loadByToken controller:', error)

    // Handle známé chyby
    if (error.message === 'Session s tímto tokenem nebyla nalezena') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Hra s tímto tokenem nebyla nalezena'
      })
      return
    }

    // Obecná chyba
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst hru',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

/**
 * DELETE /api/saves/:sessionId
 * Smaže uloženou hru
 */
export async function deleteGame(req: Request, res: Response): Promise<void> {
  try {
    // Validace params
    const paramsValidation = sessionIdParamSchema.safeParse(req.params)

    if (!paramsValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Validace selhala',
        message: 'Neplatné ID session',
        details: paramsValidation.error.errors
      })
      return
    }

    const { sessionId } = paramsValidation.data

    // Zavolej service
    await saveService.deleteSession(sessionId)

    res.status(200).json({
      success: true,
      message: 'Hra byla úspěšně smazána'
    })
  } catch (error: any) {
    console.error('Chyba v deleteGame controller:', error)

    // Handle známé chyby
    if (error.message === 'Herní session nenalezena') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      })
      return
    }

    // Obecná chyba
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se smazat hru',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

/**
 * POST /api/saves/:sessionId/regenerate-token
 * Vygeneruje nový shareable token pro existující session
 */
export async function regenerateToken(req: Request, res: Response): Promise<void> {
  try {
    // Validace params
    const paramsValidation = sessionIdParamSchema.safeParse(req.params)

    if (!paramsValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Validace selhala',
        message: 'Neplatné ID session',
        details: paramsValidation.error.errors
      })
      return
    }

    const { sessionId } = paramsValidation.data

    // Zavolej service
    const newToken = await saveService.regenerateToken(sessionId)

    res.status(200).json({
      success: true,
      data: {
        sessionToken: newToken,
        sessionId
      },
      message: 'Nový token byl úspěšně vygenerován'
    })
  } catch (error: any) {
    console.error('Chyba v regenerateToken controller:', error)

    // Handle známé chyby
    if (error.message === 'Herní session nenalezena') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      })
      return
    }

    // Obecná chyba
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Nepodařilo se vygenerovat nový token',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ============================================================================
// Exports
// ============================================================================

export const saveController = {
  listSaves,
  saveGame,
  loadByToken,
  deleteGame,
  regenerateToken
}
