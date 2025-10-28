/**
 * Game Controller - HTTP request handlers pro herní endpointy
 * Zodpovědný za validaci vstupů, volání služeb a formátování HTTP responses
 */

import { Request, Response } from 'express'
import { gameService } from '../services/gameService'
import {
  startGameSchema,
  playerActionSchema,
  sessionIdParamSchema,
  StartGameResponse,
  PlayerActionResponse,
  GameStateResponse
} from '../types/api.types'

/**
 * POST /api/game/start
 * Spustí novou herní session pro zvolenou postavu
 */
export async function startGame(req: Request, res: Response): Promise<void> {
  try {
    // Validace request body
    const validationResult = startGameSchema.safeParse(req.body)

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validace selhala',
        details: validationResult.error.errors
      })
      return
    }

    const { characterId, startingLocation } = validationResult.data

    // Zavolej service
    const result = await gameService.startNewGame(req.user!.userId, characterId, startingLocation)

    // Připrav response
    const response: StartGameResponse = {
      sessionId: result.session.id,
      sessionToken: result.session.sessionToken,
      narratorMessage: result.initialNarrative,
      character: {
        id: result.session.characterId,
        currentLocation: result.session.currentLocation
      }
    }

    res.status(201).json({
      success: true,
      data: response,
      message: 'Nová hra byla úspěšně spuštěna'
    })
  } catch (error: any) {
    console.error('Chyba v startGame controller:', error)

    // Handle známé chyby
    if (error.message === 'Postava nenalezena') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message
      })
      return
    }

    // Handle Gemini API quota exceeded (429)
    if (
      error.status === 429 ||
      error.message?.includes('quota') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.message?.includes('exceeded your current quota')
    ) {
      res.status(429).json({
        error: 'Quota Exceeded',
        message: 'Gemini API kvóta byla vyčerpána. Přidejte si vlastní API klíč v nastavení profilu nebo zkuste znovu později.',
        retryAfter: 60,
        helpUrl: '/profile'
      })
      return
    }

    // Obecná chyba
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Nepodařilo se spustit novou hru',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

/**
 * POST /api/game/session/:id/action
 * Zpracuje akci hráče v dané session
 */
export async function handleAction(req: Request, res: Response): Promise<void> {
  try {
    // Validace params
    const paramsValidation = sessionIdParamSchema.safeParse(req.params)

    if (!paramsValidation.success) {
      res.status(400).json({
        error: 'Validace selhala',
        message: 'Neplatné ID session',
        details: paramsValidation.error.errors
      })
      return
    }

    // Validace body
    const bodyValidation = playerActionSchema.safeParse(req.body)

    if (!bodyValidation.success) {
      res.status(400).json({
        error: 'Validace selhala',
        details: bodyValidation.error.errors
      })
      return
    }

    const sessionId = paramsValidation.data.id
    const { action, characterId } = bodyValidation.data

    // Zavolej service
    const result = await gameService.processPlayerAction(req.user!.userId, sessionId, action, characterId)

    // Připrav response
    const response: PlayerActionResponse = {
      response: result.response,
      requiresDiceRoll: result.metadata?.requiresDiceRoll,
      diceType: result.metadata?.diceRollType,
      metadata: result.metadata,
      atmosphere: result.atmosphere // Přidej atmosphere data
    }

    res.status(200).json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('Chyba v handleAction controller:', error)

    // Handle známé chyby
    if (error.message === 'Herní session nenalezena') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message
      })
      return
    }

    if (
      error.message === 'Postava nepatří k této herní session' ||
      error.message === 'Herní session není aktivní'
    ) {
      res.status(400).json({
        error: 'Bad Request',
        message: error.message
      })
      return
    }

    // Handle Gemini API quota exceeded (429)
    if (
      error.status === 429 ||
      error.message?.includes('quota') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.message?.includes('exceeded your current quota')
    ) {
      res.status(429).json({
        error: 'Quota Exceeded',
        message: 'Gemini API kvóta byla vyčerpána. Přidejte si vlastní API klíč v nastavení profilu nebo zkuste znovu později.',
        retryAfter: 60,
        helpUrl: '/profile'
      })
      return
    }

    // Obecná chyba
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Nepodařilo se zpracovat akci',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

/**
 * GET /api/game/session/:id
 * Načte kompletní game state pro danou session
 */
export async function getGameState(req: Request, res: Response): Promise<void> {
  try {
    // Validace params
    const paramsValidation = sessionIdParamSchema.safeParse(req.params)

    if (!paramsValidation.success) {
      res.status(400).json({
        error: 'Validace selhala',
        message: 'Neplatné ID session',
        details: paramsValidation.error.errors
      })
      return
    }

    const sessionId = paramsValidation.data.id

    // Zavolej service
    const gameState = await gameService.getGameState(req.user!.userId, sessionId)

    // Připrav response
    const response: GameStateResponse = {
      session: {
        id: gameState.session.id,
        sessionToken: gameState.session.sessionToken,
        currentLocation: gameState.session.currentLocation,
        questLog: gameState.session.questLog,
        worldState: gameState.session.worldState,
        isActive: gameState.session.isActive,
        lastPlayedAt: gameState.session.lastPlayedAt,
        createdAt: gameState.session.createdAt
      },
      character: gameState.character,
      messages: gameState.messages
    }

    res.status(200).json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('Chyba v getGameState controller:', error)

    // Handle známé chyby
    if (error.message === 'Herní session nenalezena') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message
      })
      return
    }

    // Obecná chyba
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst game state',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

/**
 * GET /api/game/session/token/:token
 * Načte game state podle session tokenu (pro load game)
 */
export async function getGameStateByToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Token je povinný'
      })
      return
    }

    // Zavolej service
    const gameState = await gameService.getGameStateByToken(req.user!.userId, token)

    // Připrav response (stejný formát jako getGameState)
    const response: GameStateResponse = {
      session: {
        id: gameState.session.id,
        sessionToken: gameState.session.sessionToken,
        currentLocation: gameState.session.currentLocation,
        questLog: gameState.session.questLog,
        worldState: gameState.session.worldState,
        isActive: gameState.session.isActive,
        lastPlayedAt: gameState.session.lastPlayedAt,
        createdAt: gameState.session.createdAt
      },
      character: gameState.character,
      messages: gameState.messages
    }

    res.status(200).json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('Chyba v getGameStateByToken controller:', error)

    if (error.message === 'Herní session nenalezena') {
      res.status(404).json({
        error: 'Not Found',
        message: 'Session s tímto tokenem nebyla nalezena'
      })
      return
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Nepodařilo se načíst game state',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

/**
 * POST /api/game/session/:id/end
 * Ukončí aktivní herní session
 */
export async function endGame(req: Request, res: Response): Promise<void> {
  try {
    const paramsValidation = sessionIdParamSchema.safeParse(req.params)

    if (!paramsValidation.success) {
      res.status(400).json({
        error: 'Validace selhala',
        message: 'Neplatné ID session',
        details: paramsValidation.error.errors
      })
      return
    }

    const sessionId = paramsValidation.data.id

    await gameService.endGameSession(req.user!.userId, sessionId)

    res.status(200).json({
      success: true,
      message: 'Herní session byla ukončena'
    })
  } catch (error: any) {
    console.error('Chyba v endGame controller:', error)

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Nepodařilo se ukončit herní session',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ============================================================================
// Exports
// ============================================================================

export const gameController = {
  startGame,
  handleAction,
  getGameState,
  getGameStateByToken,
  endGame
}
