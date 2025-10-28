import { Character, Message } from '@prisma/client'
import { getUserGenAI, getUserModel, withRetry } from '../config/gemini'
import {
  buildGameStartPrompt,
  buildActionPrompt,
  buildCombatPrompt,
  buildCharacterContext,
} from '../utils/promptTemplates'
import { NarratorResponse } from '../types/dnd.types'
import { getUserGeminiKey } from './authService'

/**
 * Service pro komunikaci s Gemini AI jako D&D Dungeon Master
 * Multi-user: Každý uživatel používá svůj vlastní Gemini API klíč
 */
class GeminiService {
  /**
   * Get user's Gemini model instance
   * @private
   */
  private async getUserModelInstance(userId: string) {
    const apiKey = await getUserGeminiKey(userId)

    if (!apiKey) {
      throw new Error(
        'Nemáte nastavený Gemini API klíč. Přidejte jej v profilu: PUT /api/auth/gemini-key'
      )
    }

    const genAI = getUserGenAI(apiKey)
    return getUserModel(genAI)
  }

  /**
   * Vytvoří úvodní narrator response pro novou hru
   */
  async generateGameStart(
    userId: string,
    character: Character,
    startingLocation: string = 'Bree'
  ): Promise<string> {
    const prompt = buildGameStartPrompt(character, startingLocation)

    return await withRetry(async () => {
      const model = await this.getUserModelInstance(userId)
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  /**
   * Generuje narrator response na akci hráče
   */
  async generateNarratorResponse(
    userId: string,
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
      const model = await this.getUserModelInstance(userId)
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
    userId: string,
    playerAction: string,
    character: Character,
    combatState: any
  ): Promise<string> {
    const prompt = buildCombatPrompt(character, combatState, playerAction)

    return await withRetry(async () => {
      const model = await this.getUserModelInstance(userId)
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  /**
   * Testuje Gemini connection s jednoduchým promptem
   * Pro testing purposes (používá user API key)
   */
  async testConnection(
    userId: string,
    testPrompt: string = 'Řekni mi krátký fantasy příběh v češtině.'
  ): Promise<string> {
    console.log('🧪 Testing Gemini API connection for user:', userId)

    try {
      const model = await this.getUserModelInstance(userId)
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
  async summarizeConversation(
    userId: string,
    messages: Message[]
  ): Promise<string> {
    const messageTexts = messages.map((msg) => `[${msg.role}]: ${msg.content}`)

    const prompt = `Následující zprávy představují část D&D herní session. Shrň klíčové události, důležité informace a aktuální stav příběhu do 2-3 vět:

${messageTexts.join('\n\n')}

Shrnutí:`;

    return await withRetry(async () => {
      const model = await this.getUserModelInstance(userId)
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  /**
   * Generuje NPC dialog
   */
  async generateNPCDialog(
    userId: string,
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
      const model = await this.getUserModelInstance(userId)
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  /**
   * Generuje backstory (příběh postavy) na základě jména, rasy a povolání
   */
  async generateCharacterBackstory(
    userId: string,
    characterName: string,
    race: string,
    characterClass: string
  ): Promise<string> {
    const prompt = `Vytvoř originální a zajímavý příběh postavy (backstory) pro D&D 5e v češtině.

**Informace o postavě:**
- Jméno: ${characterName}
- Rasa: ${race}
- Povolání: ${characterClass}

**Požadavky:**
- Délka: 150-300 slov
- Styl: Fantasy, dramatický, ale s lehkým humorem
- Zahrň: minulost postavy, motivaci k dobrodružství, nějakou osobní tragédii nebo tajemství
- Specifické detaily pro ${race} a ${characterClass}
- Popisný, živý jazyk
- Bez nadpisu, přímo začni příběhem

**Příběh postavy:**`;

    return await withRetry(async () => {
      const model = await this.getUserModelInstance(userId)
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  /**
   * Analyzuje narrator text a určí atmosféru scény
   * Vrací strukturovaná data o lokaci, náladě, čase a počasí
   */
  async analyzeAtmosphere(
    userId: string,
    narratorText: string
  ): Promise<{
    location: string
    mood: string
    timeOfDay: string
    weather?: string
  }> {
    const prompt = `Analyzuj následující D&D narrator text a urči atmosféru scény.

**DŮLEŽITÉ:** Vrať POUZE čistý JSON objekt, žádný další text, žádné markdown formatting!

Formát JSON odpovědi:
{
  "location": "forest|tavern|mountain|cave|castle|dungeon|village|city|ruins|desert|ocean|swamp|plains|unknown",
  "mood": "mysterious|dangerous|cozy|peaceful|epic|neutral",
  "timeOfDay": "dawn|day|dusk|night",
  "weather": "fog|rain|snow|storm|clear|cloudy|..."
}

**Pravidla:**
- location: Typ lokace kde se děj odehrává (anglicky, jedno slovo)
- mood: Nálada scény (mysterious=tajemná, dangerous=nebezpečná, cozy=útulná, peaceful=klidná, epic=epická, neutral=neutrální)
- timeOfDay: Denní doba (dawn=úsvit, day=den, dusk=soumrak, night=noc)
- weather: Počasí (pouze pokud je zmíněné v textu, jinak null)

**Narrator text k analýze:**
"${narratorText.substring(0, 500)}"

JSON odpověď:`;

    return await withRetry(async () => {
      const model = await this.getUserModelInstance(userId)
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parsuj JSON z odpovědi
      try {
        // Pokus se najít JSON v odpovědi (může obsahovat markdown backticks)
        let jsonText = text.trim()

        // Odstraň markdown code blocks pokud jsou
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim()
        }

        const parsed = JSON.parse(jsonText)

        // Validuj že máme required fields
        if (!parsed.location || !parsed.mood || !parsed.timeOfDay) {
          throw new Error('Missing required fields in atmosphere analysis')
        }

        return parsed
      } catch (parseError: any) {
        console.error('❌ Chyba při parsování atmosphere JSON:', parseError.message)
        console.error('   Raw response:', text.substring(0, 200))

        // Fallback
        return {
          location: 'unknown',
          mood: 'neutral',
          timeOfDay: 'day',
        }
      }
    })
  }
}

// Export singleton instance
export const geminiService = new GeminiService()
