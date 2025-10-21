/**
 * Context Service - Sestavení AI kontextu pro Gemini
 * Zodpovědný za přípravu kontextu, shrnutí starých zpráv a formátování dat pro AI
 */

import { Character, Message, GameSession } from '@prisma/client'
import { geminiService } from './geminiService'

/**
 * Sestaví kompletní AI kontext pro generování narrator response
 *
 * @param character - Postava hráče s kompletními stats
 * @param messages - Historie zpráv (doporučeno posledních 10)
 * @param session - Aktuální herní session s quest logem a lokací
 * @returns Formátovaný context string pro Gemini API
 */
export function buildContextForAI(
  character: Character,
  messages: Message[],
  session: GameSession
): string {
  // 1. Character Stats Context
  const characterContext = buildCharacterStats(character)

  // 2. Current Location
  const locationContext = `\n## Aktuální lokace\n${session.currentLocation}\n`

  // 3. Quest Log
  const questLogContext = buildQuestLog(session.questLog)

  // 4. World State (pokud existuje)
  const worldStateContext = buildWorldState(session.worldState)

  // 5. Conversation History
  const conversationContext = buildConversationHistory(messages)

  // Složit vše dohromady
  const fullContext = `${characterContext}${locationContext}${questLogContext}${worldStateContext}${conversationContext}`

  return fullContext
}

/**
 * Sestaví character stats kontext
 */
function buildCharacterStats(character: Character): string {
  return `## Postava hráče
Jméno: ${character.name}
Rasa: ${character.race}
Třída: ${character.class}
Level: ${character.level}

Stats:
- Síla (STR): ${character.strength}
- Obratnost (DEX): ${character.dexterity}
- Odolnost (CON): ${character.constitution}
- Inteligence (INT): ${character.intelligence}
- Moudrost (WIS): ${character.wisdom}
- Charisma (CHA): ${character.charisma}

Combat:
- HP: ${character.hitPoints}/${character.maxHitPoints}
- AC: ${character.armorClass}
- XP: ${character.experience}

${character.background ? `Background: ${character.background}` : ''}
`
}

/**
 * Sestaví quest log kontext
 */
function buildQuestLog(questLog: any): string {
  try {
    // questLog je JSON pole questů
    const quests = Array.isArray(questLog) ? questLog : []

    if (quests.length === 0) {
      return '\n## Questy\nŽádné aktivní questy.\n'
    }

    const questList = quests
      .map((quest: any, index: number) => {
        const status = quest.completed ? '✓' : '○'
        return `${status} ${index + 1}. ${quest.title || 'Bez názvu'}\n   ${quest.description || ''}`
      })
      .join('\n')

    return `\n## Questy\n${questList}\n`
  } catch (error) {
    console.error('Chyba při parsování quest logu:', error)
    return '\n## Questy\nChyba při načítání questů.\n'
  }
}

/**
 * Sestaví world state kontext
 */
function buildWorldState(worldState: any): string {
  try {
    // worldState je JSON objekt s custom proměnnými
    const stateObj = typeof worldState === 'object' ? worldState : {}
    const stateKeys = Object.keys(stateObj)

    if (stateKeys.length === 0) {
      return ''
    }

    const stateList = stateKeys
      .map((key) => `- ${key}: ${JSON.stringify(stateObj[key])}`)
      .join('\n')

    return `\n## Stav světa\n${stateList}\n`
  } catch (error) {
    console.error('Chyba při parsování world state:', error)
    return ''
  }
}

/**
 * Sestaví conversation history kontext
 */
function buildConversationHistory(messages: Message[]): string {
  if (messages.length === 0) {
    return '\n## Historie konverzace\nŽádné předchozí zprávy.\n'
  }

  const formattedMessages = messages
    .map((msg) => {
      const roleLabel = msg.role === 'player' ? 'Hráč' : msg.role === 'narrator' ? 'Vypravěč' : 'Systém'
      return `[${roleLabel}]: ${msg.content}`
    })
    .join('\n\n')

  return `\n## Historie konverzace (posledních ${messages.length} zpráv)\n${formattedMessages}\n`
}

/**
 * Vytvoří shrnutí starých zpráv pomocí Gemini API
 * Volá se když session má více než 100 zpráv
 *
 * @param messages - Zprávy k shrnutí (obvykle oldest 50)
 * @returns Shrnutí ve formě 1-2 odstavců
 */
export async function summarizeOldMessages(messages: Message[]): Promise<string> {
  if (messages.length === 0) {
    return 'Žádné zprávy k shrnutí.'
  }

  try {
    const summary = await geminiService.summarizeConversation(messages)
    return summary
  } catch (error) {
    console.error('Chyba při shrnutí zpráv:', error)
    throw new Error('Nepodařilo se vytvořit shrnutí starých zpráv')
  }
}

/**
 * Vrátí optimální počet zpráv pro kontext
 * - Pokud session má méně než 50 zpráv: vrať všechny
 * - Pokud má 50-100: vrať posledních 20
 * - Pokud má více než 100: vrať posledních 10 + shrnutí oldest 50
 */
export function getOptimalMessageCount(totalMessages: number): {
  recentCount: number
  shouldSummarize: boolean
  summarizeCount: number
} {
  if (totalMessages <= 50) {
    return {
      recentCount: totalMessages,
      shouldSummarize: false,
      summarizeCount: 0
    }
  }

  if (totalMessages <= 100) {
    return {
      recentCount: 20,
      shouldSummarize: false,
      summarizeCount: 0
    }
  }

  // Více než 100 zpráv
  return {
    recentCount: 10,
    shouldSummarize: true,
    summarizeCount: 50
  }
}

// Export jako singleton
export const contextService = {
  buildContextForAI,
  summarizeOldMessages,
  getOptimalMessageCount
}
