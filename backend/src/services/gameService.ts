/**
 * Game Service - Business logika pro herní loop a session management
 * Řídí průběh hry, zpracovává akce hráčů a spravuje herní stav
 */

import { Character, GameSession, Message } from '@prisma/client'
import { nanoid } from 'nanoid'
import { geminiService } from './geminiService'
import { atmosphereService } from './atmosphereService'
import * as validationService from './validationService'
import { prisma } from '../config/database'
import { AtmosphereData } from '../types/atmosphere.types'
// import { contextService } from './contextService' // Připraveno pro budoucí použití

// ============================================================================
// Types
// ============================================================================

export interface StartGameResult {
  session: GameSession
  initialNarrative: string
}

export interface ProcessActionResult {
  response: string
  metadata?: {
    requiresDiceRoll?: boolean
    diceRollType?: string
  }
  atmosphere?: AtmosphereData
}

export interface GameState {
  session: GameSession
  character: Character
  messages: Message[]
}

// ============================================================================
// Game Service Functions
// ============================================================================

/**
 * Spustí novou herní session pro danou postavu
 *
 * @param userId - UUID uživatele (pro validaci ownership)
 * @param characterId - UUID postavy
 * @param startingLocation - Počáteční lokace (default: "Vesnice Bree")
 * @returns Novou session a úvodní narrator response
 */
export async function startNewGame(
  userId: string,
  characterId: string,
  startingLocation: string = 'Vesnice Bree'
): Promise<StartGameResult> {
  try {
    // 1. Načti postavu z DB + validace ownership
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        userId // Kontrola že postava patří uživateli
      },
      include: {
        inventory: true
      }
    })

    if (!character) {
      throw new Error('Postava nenalezena nebo nemáte oprávnění')
    }

    // 2. Vytvoř unikátní session token (prefix gs_ = game session)
    const sessionToken = `gs_${nanoid(16)}`

    // 3. Vytvoř GameSession
    const session = await prisma.gameSession.create({
      data: {
        sessionToken,
        userId, // Přiřaď k uživateli
        characterId: character.id,
        currentLocation: startingLocation,
        questLog: [],
        worldState: {},
        isActive: true,
        lastPlayedAt: new Date()
      }
    })

    // 4. Zavolej Gemini pro initial narrative (s user API key)
    const initialNarrative = await geminiService.generateGameStart(
      userId,
      character,
      startingLocation
    )

    // 5. Ulož initial narrator message
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'narrator',
        content: initialNarrative,
        metadata: {
          type: 'game_start',
          location: startingLocation
        }
      }
    })

    console.log(`✅ Nová hra spuštěna pro ${character.name} (session: ${session.sessionToken})`)

    return {
      session,
      initialNarrative
    }
  } catch (error) {
    console.error('Chyba při spuštění nové hry:', error)
    throw error
  }
}

/**
 * Zpracuje akci hráče a vygeneruje narrator response
 *
 * @param userId - UUID uživatele (pro validaci ownership a Gemini API)
 * @param sessionId - UUID herní session
 * @param action - Akce/příkaz hráče
 * @param characterId - UUID postavy (pro validaci)
 * @returns Narrator response a metadata
 */
export async function processPlayerAction(
  userId: string,
  sessionId: string,
  action: string,
  characterId: string
): Promise<ProcessActionResult> {
  try {
    // 1. Načti session s character a messages + validace ownership
    const session = await prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        userId // Kontrola ownership
      },
      include: {
        character: {
          include: {
            inventory: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Posledních 10 zpráv pro kontext
        }
      }
    })

    if (!session) {
      throw new Error('Herní session nenalezena nebo nemáte oprávnění')
    }

    // Validace: zkontroluj že postava patří k session
    if (session.characterId !== characterId) {
      throw new Error('Postava nepatří k této herní session')
    }

    // Zkontroluj že session je aktivní
    if (!session.isActive) {
      throw new Error('Herní session není aktivní')
    }

    // 2. ✨ PRE-VALIDATION - kontrola akce před AI
    console.log(`🔍 Validuji akci hráče...`)
    const validation = await validationService.validatePlayerAction(
      characterId,
      action
    )

    if (!validation.valid) {
      // Validace selhala - vrať chybovou zprávu bez volání AI
      console.log(`❌ Validace selhala: ${validation.reason}`)

      // Ulož player message i když je invalid (pro historii)
      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'player',
          content: action
        }
      })

      // Vytvoř system message s vysvětlením
      const errorMessage = `❌ **Neplatná akce:** ${validation.reason}\n\nZkus něco jiného, co odpovídá schopnostem tvé postavy.`

      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'system',
          content: errorMessage,
          metadata: {
            validationFailed: true,
            reason: validation.reason
          }
        }
      })

      // Vrať chybovou zprávu
      return {
        response: errorMessage,
        metadata: {
          validationFailed: true,
          reason: validation.reason
        } as any
      }
    }

    console.log(`✅ Validace prošla${validation.detectedSpell ? ` - detekováno kouzlo: ${validation.detectedSpell.name}` : ''}`)

    // 3. Ulož player message (validní akce)
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'player',
        content: action
      }
    })

    // 4. Sestav kontext pro AI (reverse messages - nejnovější poslední)
    const messagesForContext = [...session.messages].reverse()
    // Context je zatím prepared, ale přímo nepoužitý - bude využit v budoucích vylepšeních
    // const aiContext = contextService.buildContextForAI(
    //   session.character,
    //   messagesForContext,
    //   session
    // )

    // 4. Zavolej Gemini pro narrator response (s user API key)
    const narratorResponse = await geminiService.generateNarratorResponse(
      userId,
      action,
      session.character,
      messagesForContext,
      {
        currentLocation: session.currentLocation,
        questLog: session.questLog,
        worldState: session.worldState
      }
    )

    // 5. Analyzuj atmosféru z narrator response (async, neblokující, s user API key)
    let atmosphereData: AtmosphereData | undefined
    try {
      console.log(`🎨 Analyzuji atmosféru pro narrator response...`)
      atmosphereData = await atmosphereService.analyzeNarratorResponse(userId, narratorResponse.content)
      console.log(`✅ Atmosphere data připravena: ${atmosphereData.location} (${atmosphereData.mood})`)
    } catch (atmosphereError: any) {
      console.error(`⚠️  Nepodařilo se analyzovat atmosféru:`, atmosphereError.message)
      // Pokračuj bez atmosphere (není kritická chyba)
    }

    // 6. Ulož narrator response
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'narrator',
        content: narratorResponse.content,
        metadata: {
          requiresDiceRoll: narratorResponse.requiresDiceRoll,
          diceRollType: narratorResponse.diceRollType,
          diceRequirement: narratorResponse.diceRequirements, // Přidej dice requirement
          atmosphere: atmosphereData // Ulož atmosphere do message metadata
        }
      }
    })

    // 7. ✨ POST-PROCESSING: Spotřebuj spell slot pokud bylo použito kouzlo
    if (validation.detectedSpell && validation.detectedSpell.level > 0) {
      await validationService.consumeSpellSlot(
        characterId,
        validation.detectedSpell.level
      )
      console.log(`⚡ Spell slot L${validation.detectedSpell.level} spotřebován pro ${validation.detectedSpell.name}`)
    }

    // 8. Update session lastPlayedAt
    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        lastPlayedAt: new Date()
      }
    })

    console.log(`✅ Akce zpracována pro session ${session.sessionToken}`)

    // 8. Vrať response včetně atmosphere
    return {
      response: narratorResponse.content,
      metadata: {
        requiresDiceRoll: narratorResponse.requiresDiceRoll,
        diceRollType: narratorResponse.diceRollType
      },
      atmosphere: atmosphereData
    }
  } catch (error) {
    console.error('Chyba při zpracování akce hráče:', error)
    throw error
  }
}

/**
 * Načte kompletní game state pro frontend
 * Validuje ownership
 *
 * @param userId - UUID uživatele
 * @param sessionId - UUID herní session
 * @returns Kompletní game state včetně session, character a messages
 */
export async function getGameState(userId: string, sessionId: string): Promise<GameState> {
  try {
    const session = await prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        userId // Validace ownership
      },
      include: {
        character: {
          include: {
            inventory: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 50 // Posledních 50 zpráv
        }
      }
    })

    if (!session) {
      throw new Error('Herní session nenalezena nebo nemáte oprávnění')
    }

    return {
      session,
      character: session.character,
      messages: session.messages
    }
  } catch (error) {
    console.error('Chyba při načítání game state:', error)
    throw error
  }
}

/**
 * Načte game state podle session tokenu (pro load game funkcionalitu)
 * Validuje ownership
 *
 * @param userId - UUID uživatele
 * @param sessionToken - Unikátní session token (gs_xxx)
 * @returns Kompletní game state
 */
export async function getGameStateByToken(userId: string, sessionToken: string): Promise<GameState> {
  try {
    const session = await prisma.gameSession.findFirst({
      where: {
        sessionToken,
        userId // Validace ownership
      },
      include: {
        character: {
          include: {
            inventory: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 50
        }
      }
    })

    if (!session) {
      throw new Error('Herní session nenalezena nebo nemáte oprávnění')
    }

    return {
      session,
      character: session.character,
      messages: session.messages
    }
  } catch (error) {
    console.error('Chyba při načítání game state podle tokenu:', error)
    throw error
  }
}

/**
 * Ukončí aktivní herní session
 * Validuje ownership
 *
 * @param userId - UUID uživatele
 * @param sessionId - UUID herní session
 */
export async function endGameSession(userId: string, sessionId: string): Promise<void> {
  try {
    // Validace ownership před ukončením
    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId }
    })

    if (!session) {
      throw new Error('Herní session nenalezena nebo nemáte oprávnění')
    }

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        isActive: false
      }
    })

    console.log(`✅ Herní session ${sessionId} ukončena`)
  } catch (error) {
    console.error('Chyba při ukončení session:', error)
    throw error
  }
}

/**
 * Aktualizuje quest log v session
 * Validuje ownership
 *
 * @param userId - UUID uživatele
 * @param sessionId - UUID herní session
 * @param questLog - Nový quest log (array)
 */
export async function updateQuestLog(
  userId: string,
  sessionId: string,
  questLog: any[]
): Promise<GameSession> {
  try {
    // Validace ownership
    const existingSession = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId }
    })

    if (!existingSession) {
      throw new Error('Herní session nenalezena nebo nemáte oprávnění')
    }

    const session = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        questLog
      }
    })

    return session
  } catch (error) {
    console.error('Chyba při aktualizaci quest logu:', error)
    throw error
  }
}

/**
 * Aktualizuje current location v session
 * Validuje ownership
 *
 * @param userId - UUID uživatele
 * @param sessionId - UUID herní session
 * @param location - Nová lokace
 */
export async function updateLocation(
  userId: string,
  sessionId: string,
  location: string
): Promise<GameSession> {
  try {
    // Validace ownership
    const existingSession = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId }
    })

    if (!existingSession) {
      throw new Error('Herní session nenalezena nebo nemáte oprávnění')
    }

    const session = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        currentLocation: location
      }
    })

    return session
  } catch (error) {
    console.error('Chyba při aktualizaci lokace:', error)
    throw error
  }
}

/**
 * Aktualizuje world state v session
 * Validuje ownership
 *
 * @param userId - UUID uživatele
 * @param sessionId - UUID herní session
 * @param worldState - Nový world state (object)
 */
export async function updateWorldState(
  userId: string,
  sessionId: string,
  worldState: any
): Promise<GameSession> {
  try {
    // Validace ownership
    const existingSession = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId }
    })

    if (!existingSession) {
      throw new Error('Herní session nenalezena nebo nemáte oprávnění')
    }

    const session = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        worldState
      }
    })

    return session
  } catch (error) {
    console.error('Chyba při aktualizaci world state:', error)
    throw error
  }
}

// ============================================================================
// Exports
// ============================================================================

export const gameService = {
  startNewGame,
  processPlayerAction,
  getGameState,
  getGameStateByToken,
  endGameSession,
  updateQuestLog,
  updateLocation,
  updateWorldState
}
