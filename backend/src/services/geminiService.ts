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
 * Implementuje caching pro optimalizaci performance a snížení API volání
 */
class GeminiService {
  // Cache pro AI responses (key: hash promptu, value: response)
  // LRU cache s max 100 položkami a TTL 1 hodina
  private responseCache: Map<string, { response: string; timestamp: number }> = new Map()
  private readonly CACHE_MAX_SIZE = 100
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hodina v ms

  /**
   * Vytvoří hash z promptu pro cache key
   * @param prompt - Text promptu
   * @returns Hash string
   */
  private hashPrompt(prompt: string): string {
    // Jednoduchý hash function - pro produkci použít crypto.createHash
    let hash = 0
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  /**
   * Získá response z cache pokud existuje a není expired
   * @param prompt - Prompt pro vyhledání
   * @returns Cached response nebo null
   */
  private getCachedResponse(prompt: string): string | null {
    const key = this.hashPrompt(prompt)
    const cached = this.responseCache.get(key)

    if (!cached) return null

    // Zkontroluj TTL
    const age = Date.now() - cached.timestamp
    if (age > this.CACHE_TTL) {
      this.responseCache.delete(key)
      return null
    }

    console.log('✅ Using cached Gemini response')
    return cached.response
  }

  /**
   * Uloží response do cache
   * Implementuje LRU eviction policy
   * @param prompt - Prompt jako key
   * @param response - Response k uložení
   */
  private setCachedResponse(prompt: string, response: string): void {
    const key = this.hashPrompt(prompt)

    // LRU eviction - pokud cache je plná, odstraň nejstarší
    if (this.responseCache.size >= this.CACHE_MAX_SIZE) {
      const firstKey = this.responseCache.keys().next().value
      this.responseCache.delete(firstKey)
    }

    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    })
  }

  /**
   * Vytvoří úvodní narrator response pro novou hru
   */
  async generateGameStart(
    character: Character,
    startingLocation: string = 'Bree'
  ): Promise<string> {
    const prompt = buildGameStartPrompt(character, startingLocation)

    // Zkontroluj cache
    const cached = this.getCachedResponse(prompt)
    if (cached) return cached

    // Generuj nový response
    const response = await withRetry(async () => {
      const model = getModel()
      const result = await model.generateContent(prompt)
      const apiResponse = await result.response
      return apiResponse.text()
    })

    // Ulož do cache
    this.setCachedResponse(prompt, response)

    return response
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

    // Zkontroluj cache
    const cached = this.getCachedResponse(prompt)
    if (cached) return cached

    // Generuj nový response
    const response = await withRetry(async () => {
      const model = getModel()
      const result = await model.generateContent(prompt)
      const apiResponse = await result.response
      return apiResponse.text()
    })

    // Ulož do cache
    this.setCachedResponse(prompt, response)

    return response
  }

  /**
   * Vyčistí cache (např. při restartu nebo pro testing)
   */
  clearCache(): void {
    this.responseCache.clear()
    console.log('🗑️  Gemini response cache cleared')
  }

  /**
   * Získá statistiky cache
   */
  getCacheStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.responseCache.size,
      maxSize: this.CACHE_MAX_SIZE,
      ttl: this.CACHE_TTL
    }
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

  /**
   * Generuje backstory (příběh postavy) na základě jména, rasy a povolání
   */
  async generateCharacterBackstory(
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
      const model = getModel()
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  /**
   * Analyzuje narrator text a určí atmosféru scény
   * Vrací strukturovaná data o lokaci, náladě, čase a počasí
   */
  async analyzeAtmosphere(narratorText: string): Promise<{
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
      const model = getModel()
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
