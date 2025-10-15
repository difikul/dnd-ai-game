import { Character, Message } from '@prisma/client'
import { getModel, withRetry } from '../config/gemini'
import {
  buildGameStartPrompt,
  buildActionPrompt,
  buildCombatPrompt,
  buildCharacterContext,
} from '../utils/promptTemplates'
import { NarratorResponse } from '../types/dnd.types'

/**
 * Service pro komunikaci s Gemini AI jako D&D Dungeon Master
 */
class GeminiService {
  /**
   * Vytvoří úvodní narrator response pro novou hru
   */
  async generateGameStart(
    character: Character,
    startingLocation: string = 'Bree'
  ): Promise<string> {
    const prompt = buildGameStartPrompt(character, startingLocation)

    return await withRetry(async () => {
      const model = getModel()
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  /**
   * Generuje narrator response na akci hráče
   */
  async generateNarratorResponse(
    playerAction: string,
    character: Character,
    conversationHistory: Message[],
    gameContext?: any
  ): Promise<NarratorResponse> {
    // Build context from last 10 messages
    const recentMessages = conversationHistory.slice(-10)
    const contextMessages = recentMessages
      .map((msg) => `[${msg.role}]: ${msg.content}`)
      .join('\n\n')

    const currentLocation = gameContext?.currentLocation || 'Neznámá lokace'

    const prompt = buildActionPrompt(
      character,
      playerAction,
      currentLocation,
      contextMessages
    )

    const responseText = await withRetry(async () => {
      const model = getModel()
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })

    // Parse response for dice rolls
    const requiresDiceRoll = responseText.includes('[DICE:')
    let diceType: string | undefined

    if (requiresDiceRoll) {
      const diceMatch = responseText.match(/\[DICE:\s*([^\]]+)\]/)
      if (diceMatch) {
        diceType = diceMatch[1].trim()
      }
    }

    return {
      content: responseText,
      requiresDiceRoll,
      diceRollType: diceType,
    }
  }

  /**
   * Generuje response pro combat situaci
   */
  async generateCombatResponse(
    playerAction: string,
    character: Character,
    combatState: any
  ): Promise<string> {
    const prompt = buildCombatPrompt(character, combatState, playerAction)

    return await withRetry(async () => {
      const model = getModel()
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  /**
   * Testuje Gemini connection s jednoduchým promptem
   */
  async testConnection(testPrompt: string = 'Řekni mi krátký fantasy příběh v češtině.'): Promise<string> {
    console.log('🧪 Testing Gemini API connection...')

    try {
      const model = getModel()
      const result = await model.generateContent(testPrompt)
      const response = await result.response
      const text = response.text()

      console.log('✅ Gemini API test successful')
      console.log(`   Response length: ${text.length} chars`)

      return text
    } catch (error: any) {
      console.error('❌ Gemini API test failed:', error.message)
      throw new Error(`Gemini API test failed: ${error.message}`)
    }
  }

  /**
   * Vytvoří shrnutí dlouhé konverzace
   */
  async summarizeConversation(messages: Message[]): Promise<string> {
    const messageTexts = messages.map((msg) => `[${msg.role}]: ${msg.content}`)

    const prompt = `Následující zprávy představují část D&D herní session. Shrň klíčové události, důležité informace a aktuální stav příběhu do 2-3 vět:

${messageTexts.join('\n\n')}

Shrnutí:`;

    return await withRetry(async () => {
      const model = getModel()
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  /**
   * Generuje NPC dialog
   */
  async generateNPCDialog(
    npcName: string,
    npcPersonality: string,
    character: Character,
    context: string
  ): Promise<string> {
    const prompt = `${buildCharacterContext(character)}

Kontext situace:
${context}

Vytvoř dialog pro NPC jménem "${npcName}" s osobností: "${npcPersonality}".
Dialog by měl být v češtině, odpovídat osobnosti postavy a reagovat na aktuální situaci.

Dialog NPC:`;

    return await withRetry(async () => {
      const model = getModel()
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }
}

// Export singleton instance
export const geminiService = new GeminiService()
