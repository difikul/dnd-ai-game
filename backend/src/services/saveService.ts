/**
 * Save Service - Business logika pro save/load game funkcionalitu
 * Řídí ukládání a načítání herních sessions včetně shareable tokenů
 */

import { GameSession, Character, Message } from '@prisma/client'
import { nanoid } from 'nanoid'
import { prisma } from '../config/database'

// ============================================================================
// Types
// ============================================================================

export interface GameSessionWithRelations extends GameSession {
  character: Character & {
    inventory: any[]
  }
  messages: Message[]
}

export interface SavedGameListItem {
  sessionId: string
  sessionToken: string
  characterName: string
  characterLevel: number
  currentLocation: string
  lastPlayedAt: Date
  createdAt: Date
  isActive: boolean
  messageCount: number
}

// ============================================================================
// Save Service Functions
// ============================================================================

/**
 * Generuje unikátní shareable token pro game session
 * Format: "gs_" + nanoid(20) = celkem 23 znaků
 *
 * @returns Unikátní session token
 */
function generateToken(): string {
  return `gs_${nanoid(20)}`
}

/**
 * Uloží hru a vrátí shareable token
 * Pokud session již existuje, pouze aktualizuje lastPlayedAt
 * Token je generován při vytvoření session (v gameService.startNewGame)
 *
 * @param sessionId - UUID herní session
 * @returns Session token pro sdílení
 * @throws Error pokud session neexistuje
 */
export async function saveGame(sessionId: string): Promise<string> {
  try {
    // Načti session a validuj existenci
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        sessionToken: true,
        isActive: true
      }
    })

    if (!session) {
      throw new Error('Herní session nenalezena')
    }

    // Update lastPlayedAt pro indikaci "uložení"
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        lastPlayedAt: new Date()
      }
    })

    console.log(`✅ Hra uložena - session: ${session.sessionToken}`)

    return session.sessionToken
  } catch (error) {
    console.error('Chyba při ukládání hry:', error)
    throw error
  }
}

/**
 * Načte kompletní game session podle tokenu
 * Vrací session s character (včetně inventory) a messages
 *
 * @param token - Session token (formát: gs_xxx)
 * @returns Kompletní game session s relacemi
 * @throws Error pokud session s tokenem neexistuje
 */
export async function loadGameByToken(token: string): Promise<GameSessionWithRelations> {
  try {
    // Načti session podle tokenu s všemi relacemi
    const session = await prisma.gameSession.findUnique({
      where: { sessionToken: token },
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
          take: 100 // Posledních 100 zpráv
        }
      }
    })

    if (!session) {
      throw new Error('Session s tímto tokenem nebyla nalezena')
    }

    // Update lastPlayedAt při načtení
    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        lastPlayedAt: new Date()
      }
    })

    console.log(`✅ Hra načtena - session: ${session.sessionToken}, postava: ${session.character.name}`)

    return session as GameSessionWithRelations
  } catch (error) {
    console.error('Chyba při načítání hry podle tokenu:', error)
    throw error
  }
}

/**
 * Vrátí seznam všech aktivních sessions pro SavedGamesView
 * Seřazeno podle lastPlayedAt (nejnovější první)
 *
 * @returns Array uložených her s detaily
 */
export async function listActiveSessions(): Promise<SavedGameListItem[]> {
  try {
    const sessions = await prisma.gameSession.findMany({
      where: {
        isActive: true
      },
      include: {
        character: {
          select: {
            name: true,
            level: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        lastPlayedAt: 'desc'
      }
    })

    // Transformuj na SavedGameListItem formát
    const savedGames: SavedGameListItem[] = sessions.map(session => ({
      sessionId: session.id,
      sessionToken: session.sessionToken,
      characterName: session.character.name,
      characterLevel: session.character.level,
      currentLocation: session.currentLocation,
      lastPlayedAt: session.lastPlayedAt,
      createdAt: session.createdAt,
      isActive: session.isActive,
      messageCount: session._count.messages
    }))

    console.log(`✅ Načteno ${savedGames.length} aktivních sessions`)

    return savedGames
  } catch (error) {
    console.error('Chyba při načítání seznamu sessions:', error)
    throw error
  }
}

/**
 * Smaže uloženou hru (session) včetně všech souvisejících dat
 * Díky CASCADE v DB schématu se automaticky smažou i messages
 *
 * @param sessionId - UUID herní session
 * @throws Error pokud session neexistuje
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    // Validuj existenci
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        sessionToken: true
      }
    })

    if (!session) {
      throw new Error('Herní session nenalezena')
    }

    // Smaž session (CASCADE smaže i messages)
    await prisma.gameSession.delete({
      where: { id: sessionId }
    })

    console.log(`✅ Session ${session.sessionToken} úspěšně smazána`)
  } catch (error) {
    console.error('Chyba při mazání session:', error)
    throw error
  }
}

/**
 * Regeneruje nový token pro existující session
 * Užitečné pokud chce hráč získat nový shareable link
 *
 * @param sessionId - UUID herní session
 * @returns Nový session token
 * @throws Error pokud session neexistuje
 */
export async function regenerateToken(sessionId: string): Promise<string> {
  try {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      select: { id: true }
    })

    if (!session) {
      throw new Error('Herní session nenalezena')
    }

    // Generuj nový unikátní token
    const newToken = generateToken()

    // Update session s novým tokenem
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        sessionToken: newToken
      }
    })

    console.log(`✅ Token regenerován pro session ${sessionId}`)

    return updatedSession.sessionToken
  } catch (error) {
    console.error('Chyba při regeneraci tokenu:', error)
    throw error
  }
}

// ============================================================================
// Exports
// ============================================================================

export const saveService = {
  saveGame,
  loadGameByToken,
  listActiveSessions,
  deleteSession,
  regenerateToken
}
