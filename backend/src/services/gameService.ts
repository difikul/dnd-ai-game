/**
 * Game Service - Business logika pro herní loop a session management
 * Řídí průběh hry, zpracovává akce hráčů a spravuje herní stav
 */

import { Character, GameSession, Message } from '@prisma/client'
import { nanoid } from 'nanoid'
import { geminiService } from './geminiService'
import { atmosphereService } from './atmosphereService'
import * as validationService from './validationService'
import * as characterService from './characterService'
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
  hpChange?: {
    amount: number
    newHP: number
    maxHP: number
    source: 'pattern' | 'text'
  }
  xpChange?: {
    amount: number
    newXP: number
    nextLevelXP: number
    source: 'pattern' | 'text'
    shouldLevelUp: boolean
  }
  levelUp?: {
    newLevel: number
    hpGained: number
    newMaxHP: number
    abilityScoreImprovement: boolean
  }
  itemGain?: {
    name: string
    type: string
    rarity: string
    description?: string
    damage?: string
    armorValue?: number
    quantity?: number
    statBonuses?: {
      strength?: number
      dexterity?: number
      constitution?: number
      intelligence?: number
      wisdom?: number
      charisma?: number
      acBonus?: number
      hpBonus?: number
    }
    requiresAttunement?: boolean
  }
  characterDied?: boolean
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
 * @param diceRollResult - Optional výsledek hodu kostkou z frontendu (Bug #3 fix)
 * @returns Narrator response a metadata
 */
export async function processPlayerAction(
  userId: string,
  sessionId: string,
  action: string,
  characterId: string,
  diceRollResult?: number
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
            inventory: true,
            knownSpells: true,  // ✅ Bug #1 fix: AI musí vidět známá kouzla
            spellSlots: true    // ✅ Bug #1 fix: AI musí vidět dostupné spell sloty
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

    // 2. ✨ LONG REST DETECTION - automatická detekce long rest keywords
    const longRestKeywords = ['long rest', 'dlouhý odpočinek', 'odpočinu si', 'odpočinout', 'odpočívám', 'usnout', 'spát']
    const actionLower = action.toLowerCase()
    const isLongRestAction = longRestKeywords.some(kw => actionLower.includes(kw))

    if (isLongRestAction) {
      console.log(`💤 Detekována Long Rest akce, provádím obnovení...`)

      // Proveď long rest (obnov HP a spell sloty)
      await validationService.performLongRest(session.characterId)
      console.log(`✅ Long Rest proveden - HP a spell sloty obnoveny`)

      // Reload character s obnovenými daty
      const updatedSession = await prisma.gameSession.findFirst({
        where: { id: sessionId },
        include: {
          character: {
            include: {
              inventory: true,
              knownSpells: true,
              spellSlots: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (updatedSession) {
        session.character = updatedSession.character
        console.log(`✅ Character data reloaded - HP: ${session.character.hitPoints}/${session.character.maxHitPoints}`)
      }
    }

    // 3. ✨ PRE-VALIDATION - kontrola akce před AI
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

    // 4. ✨ DICE ROLL DETECTION - detekuj jestli předchozí message čeká na dice roll
    const messagesForContext = [...session.messages].reverse()
    const lastMessage = session.messages[0] // Nejnovější message (desc order)
    const waitingForDice = lastMessage?.role === 'narrator' && lastMessage?.metadata?.requiresDiceRoll === true

    let enhancedAction = action
    if (waitingForDice && diceRollResult !== undefined) {
      // Frontend poslal výsledek hodu - zahrň ho do promptu pro AI
      const diceReq = lastMessage.metadata.diceRequirement
      const diceNotation = diceReq?.notation || 'd20'
      enhancedAction = `Hráč hodil ${diceNotation} s výsledkem ${diceRollResult}. ${action}`
      console.log(`🎲 Dice roll result detekován: ${diceNotation} = ${diceRollResult}`)
    } else if (waitingForDice && diceRollResult === undefined) {
      console.log(`⚠️  AI čeká na dice roll, ale frontend neposlal výsledek`)
    }

    // Context je zatím prepared, ale přímo nepoužitý - bude využit v budoucích vylepšeních
    // const aiContext = contextService.buildContextForAI(
    //   session.character,
    //   messagesForContext,
    //   session
    // )

    // 5. Zavolej Gemini pro narrator response (s user API key a enhanced action)
    const narratorResponse = await geminiService.generateNarratorResponse(
      userId,
      enhancedAction, // ✅ Bug #3 fix: Použij enhanced action s dice roll výsledkem
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

    // 8. ✨ HP AUTO-UPDATE: Parse HP change z AI narrative a automaticky aplikuj
    const hpChangeResult = geminiService.parseHPChange(narratorResponse.content, session.character.hitPoints)

    let hpChangeMetadata: ProcessActionResult['hpChange'] | undefined
    let characterDied = false

    if (hpChangeResult.change !== 0) {
      console.log(`🩸 Detected HP change: ${hpChangeResult.change > 0 ? '+' : ''}${hpChangeResult.change}`)
      console.log(`   Source: ${hpChangeResult.source}, Confidence: ${hpChangeResult.confidence}`)
      console.log(`   Current HP: ${session.character.hitPoints}/${session.character.maxHitPoints}`)
      console.log(`   Raw match: "${hpChangeResult.raw}"`)

      try {
        // Aplikuj HP změnu
        const updatedCharacter = await characterService.modifyHP(userId, characterId, hpChangeResult.change)
        const newHP = updatedCharacter.hitPoints
        console.log(`   ✅ New HP: ${newHP}/${session.character.maxHitPoints}`)

        // Build metadata pro response
        if (hpChangeResult.source) {
          hpChangeMetadata = {
            amount: hpChangeResult.change,
            newHP,
            maxHP: session.character.maxHitPoints,
            source: hpChangeResult.source
          }
        }

        // Check for character death
        if (newHP <= 0) {
          console.log(`💀 Character died! HP reached 0. Ending session...`)
          characterDied = true

          // End session with death status
          await prisma.gameSession.update({
            where: { id: session.id },
            data: {
              isActive: false,
              worldState: {
                ...(session.worldState as Record<string, any> || {}),
                deathReason: hpChangeResult.raw || 'HP reached 0',
                deathTimestamp: new Date().toISOString()
              }
            }
          })

          console.log(`💀 Session ${session.sessionToken} ended due to character death`)
        }
      } catch (hpError: any) {
        console.error(`❌ Chyba při auto-update HP:`, hpError.message)
        // Nepřerušuj hru kvůli HP update chybě, jen zaloguj
      }
    }

    // 8b. ✨ XP AUTO-UPDATE: Parse XP gain z AI narrative a automaticky aplikuj
    const xpChangeResult = geminiService.parseXPGain(narratorResponse.content)

    let xpChangeMetadata: ProcessActionResult['xpChange'] | undefined
    let levelUpMetadata: ProcessActionResult['levelUp'] | undefined

    if (xpChangeResult.gain > 0) {
      console.log(`✨ Detected XP gain: +${xpChangeResult.gain}`)
      console.log(`   Source: ${xpChangeResult.source}, Confidence: ${xpChangeResult.confidence}`)
      console.log(`   Raw match: "${xpChangeResult.raw}"`)

      try {
        // Aplikuj XP gain
        const xpResult = await characterService.addExperience(userId, characterId, xpChangeResult.gain)
        const newXP = xpResult.experience
        const shouldLevelUp = xpResult.shouldLevelUp || false
        const nextLevelXP = xpResult.nextLevelXP || 0

        console.log(`   ✅ New XP: ${newXP} (next level at ${nextLevelXP})`)

        // Build metadata pro response
        if (xpChangeResult.source) {
          xpChangeMetadata = {
            amount: xpChangeResult.gain,
            newXP,
            nextLevelXP,
            source: xpChangeResult.source,
            shouldLevelUp
          }
        }

        // Check for level up
        if (shouldLevelUp) {
          console.log(`🎉 Level up ready! Processing level up...`)

          try {
            const levelUpResult = await characterService.levelUpCharacter(userId, characterId)
            const newLevel = levelUpResult.character.level

            console.log(`   ✅ Level up complete: Level ${newLevel}`)
            console.log(`   HP gained: +${levelUpResult.hpGained}`)
            console.log(`   New max HP: ${levelUpResult.character.maxHitPoints}`)

            if (levelUpResult.abilityScoreImprovement) {
              console.log(`   ⭐ Ability Score Improvement available!`)
            }

            // Build level up metadata
            levelUpMetadata = {
              newLevel,
              hpGained: levelUpResult.hpGained,
              newMaxHP: levelUpResult.character.maxHitPoints,
              abilityScoreImprovement: levelUpResult.abilityScoreImprovement
            }
          } catch (levelUpError: any) {
            console.error(`❌ Chyba při level up:`, levelUpError.message)
            // Nepřerušuj hru kvůli level up chybě, jen zaloguj
          }
        }
      } catch (xpError: any) {
        console.error(`❌ Chyba při auto-update XP:`, xpError.message)
        // Nepřerušuj hru kvůli XP update chybě, jen zaloguj
      }
    }

    // 8c. ✨ ITEM GAIN DETECTION: Parse [ITEM-GAIN: JSON] z AI narrative
    const itemGainResult = geminiService.parseItemGain(narratorResponse.content)

    let itemGainMetadata: ProcessActionResult['itemGain'] | undefined

    if (itemGainResult.found && itemGainResult.item) {
      console.log(`🎁 Detected item gain: ${itemGainResult.item.name}`)
      console.log(`   Type: ${itemGainResult.item.type}, Rarity: ${itemGainResult.item.rarity}`)
      console.log(`   Confidence: ${itemGainResult.confidence}`)
      console.log(`   Raw match: "${itemGainResult.raw}"`)

      // Pokud confidence >= 0.8 (pattern match nebo vysoká text confidence),
      // pošli do frontendu k potvrzení - NEUKLÁDÁME přímo, frontend potvrdí!
      if (itemGainResult.confidence >= 0.5) {
        itemGainMetadata = {
          name: itemGainResult.item.name,
          type: itemGainResult.item.type,
          rarity: itemGainResult.item.rarity,
          description: itemGainResult.item.description,
          damage: itemGainResult.item.damage,
          armorValue: itemGainResult.item.armorValue,
          quantity: itemGainResult.item.quantity,
          statBonuses: itemGainResult.item.statBonuses,
          requiresAttunement: itemGainResult.item.requiresAttunement
        }
        console.log(`   📦 Item data prepared for frontend confirmation`)
      } else {
        console.log(`   ⚠️ Confidence too low (${itemGainResult.confidence}), skipping item gain`)
      }
    }

    // 9. Update session lastPlayedAt
    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        lastPlayedAt: new Date()
      }
    })

    console.log(`✅ Akce zpracována pro session ${session.sessionToken}`)

    // 10. Vrať response včetně atmosphere, HP, XP, level-up a item gain metadata
    return {
      response: narratorResponse.content,
      metadata: {
        requiresDiceRoll: narratorResponse.requiresDiceRoll,
        diceRollType: narratorResponse.diceRollType
      },
      atmosphere: atmosphereData,
      hpChange: hpChangeMetadata,
      xpChange: xpChangeMetadata,
      levelUp: levelUpMetadata,
      itemGain: itemGainMetadata,
      characterDied
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
            inventory: true,
            knownSpells: true,  // ✅ Konzistence: známá kouzla všude
            spellSlots: true    // ✅ Konzistence: spell sloty všude
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
            inventory: true,
            knownSpells: true,  // ✅ Konzistence: známá kouzla všude
            spellSlots: true    // ✅ Konzistence: spell sloty všude
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
