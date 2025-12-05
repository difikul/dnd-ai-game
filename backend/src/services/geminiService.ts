import { Character, Message } from '@prisma/client'
import { getUserGenAI, getUserModel, withRetry } from '../config/gemini'
import {
  buildGameStartPrompt,
  buildActionPrompt,
  buildCombatPrompt,
  buildCharacterContext,
} from '../utils/promptTemplates'
import { NarratorResponse, DiceRequirement, HPChangeResult, XPChangeResult, ItemGainResult } from '../types/dnd.types'
import { getUserGeminiKey } from './authService'
import { quotaService } from './quotaService'

/**
 * Wrapper function to track Gemini API usage
 * @param operation - Name of the operation being tracked
 * @param fn - Async function to wrap
 * @returns Wrapped function with tracking
 */
function wrapWithTracking<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    // Extract userId from first argument (convention: userId is always first)
    const userId = args[0] as string

    try {
      const result = await fn(...args)

      // Track successful request
      await quotaService.trackUsage({
        userId,
        operation,
        success: true
      })

      return result
    } catch (error: any) {
      // Extract error code from Gemini error
      const errorCode = error.status === 429 ? 'RESOURCE_EXHAUSTED' : error.code || null

      // Track failed request
      await quotaService.trackUsage({
        userId,
        operation,
        success: false,
        errorCode
      })

      throw error
    }
  }) as T
}

/**
 * Parse DICE-REQUIRED pattern from AI response
 * Format: [DICE-REQUIRED: 1d20+3 perception dc:15 desc:"postřehnout past"]
 */
function parseDiceRequirement(diceString: string): DiceRequirement | null {
  try {
    // Extract parts
    const parts = diceString.trim().split(/\s+/)

    if (parts.length === 0) return null

    const notation = parts[0] // "1d20+3"
    const skillName = parts[1] || undefined // "perception"

    // Extract DC (difficulty class)
    const dcMatch = diceString.match(/dc:(\d+)/)
    const difficultyClass = dcMatch ? parseInt(dcMatch[1]) : undefined

    // Extract description
    const descMatch = diceString.match(/desc:"([^"]+)"/)
    const description = descMatch ? descMatch[1] : undefined

    return {
      notation,
      skillName,
      difficultyClass,
      description
    }
  } catch (error) {
    console.error('Failed to parse dice requirement:', error)
    return null
  }
}

/**
 * Parse HP change from AI narrative
 * Hybrid approach:
 * 1. Primary: Structured pattern [HP-CHANGE: -5]
 * 2. Fallback: Text parsing for Czech phrases
 *
 * @param narratorText - AI narrative text
 * @param currentHP - Current character HP (for absolute HP patterns)
 * @returns HPChangeResult with change amount, source, and confidence
 */
function parseHPChange(narratorText: string, currentHP: number): HPChangeResult {
  const result: HPChangeResult = {
    change: 0,
    source: null,
    confidence: 0,
    raw: null
  }

  // 1. Try structured pattern first: [HP-CHANGE: -5] or [HP-CHANGE: +8]
  const patternMatch = narratorText.match(/\[HP-CHANGE:\s*([+-]?\d+)\]/)
  if (patternMatch) {
    result.change = parseInt(patternMatch[1])
    result.source = 'pattern'
    result.confidence = 1.0
    result.raw = patternMatch[0]
    console.log(`🩸 Detected HP change (pattern): ${result.change > 0 ? '+' : ''}${result.change}`)
    return result
  }

  // 2. Text parsing fallback (Czech phrases)
  const patterns = [
    // Damage patterns
    { regex: /utrpíš (\d+) damage/i, multiplier: -1, confidence: 0.9 },
    { regex: /ztratíš (\d+) HP/i, multiplier: -1, confidence: 0.9 },
    { regex: /HP se snižuje o (\d+)/i, multiplier: -1, confidence: 0.85 },
    { regex: /utrží (\d+) poškození/i, multiplier: -1, confidence: 0.85 },
    { regex: /dostaneš (\d+) damage/i, multiplier: -1, confidence: 0.85 },
    { regex: /způsobíš si (\d+) damage/i, multiplier: -1, confidence: 0.8 },
    { regex: /Utržíš (\d+) poškození/i, multiplier: -1, confidence: 0.85 },

    // Healing patterns
    { regex: /vyléčíš si (\d+) HP/i, multiplier: 1, confidence: 0.9 },
    { regex: /obnovíš si (\d+) HP/i, multiplier: 1, confidence: 0.9 },
    { regex: /HP se zvyšuje o (\d+)/i, multiplier: 1, confidence: 0.85 },
    { regex: /získáš zpět (\d+) HP/i, multiplier: 1, confidence: 0.85 },

    // Absolute HP pattern: "HP se snižuje na 7/17" or "HP: 7/17"
    { regex: /HP:\s*(\d+)\/\d+/i, absolute: true, confidence: 0.7 },
    { regex: /HP se snižuje na (\d+)\/\d+/i, absolute: true, confidence: 0.75 }
  ]

  for (const pattern of patterns) {
    const match = narratorText.match(pattern.regex)
    if (match) {
      if (pattern.absolute) {
        // Extract target HP and calculate delta
        const targetHP = parseInt(match[1])
        result.change = targetHP - currentHP
      } else {
        result.change = parseInt(match[1]) * (pattern.multiplier || 1)
      }

      result.source = 'text'
      result.confidence = pattern.confidence
      result.raw = match[0]

      console.log(`🩸 Detected HP change (text): ${result.change > 0 ? '+' : ''}${result.change} from "${result.raw}"`)
      return result
    }
  }

  // No HP change detected
  return result
}

/**
 * Parse XP gain from AI narrative
 * Hybrid approach:
 * 1. Primary: Structured pattern [XP-GAIN: +100]
 * 2. Fallback: Text parsing for Czech phrases
 *
 * @param narratorText - AI narrative text
 * @returns XPChangeResult with gain amount, source, and confidence
 */
function parseXPGain(narratorText: string): XPChangeResult {
  const result: XPChangeResult = {
    gain: 0,
    source: null,
    confidence: 0,
    raw: null
  }

  // 1. Try structured pattern first: [XP-GAIN: +100] or [XP-GAIN: 50]
  const patternMatch = narratorText.match(/\[XP-GAIN:\s*\+?(\d+)\]/)
  if (patternMatch) {
    result.gain = parseInt(patternMatch[1])
    result.source = 'pattern'
    result.confidence = 1.0
    result.raw = patternMatch[0]
    console.log(`✨ Detected XP gain (pattern): +${result.gain}`)
    return result
  }

  // 2. Text parsing fallback (Czech phrases)
  const patterns = [
    // XP gain patterns
    { regex: /získáváš (\d+) zkušeností/i, confidence: 0.95 },
    { regex: /získáváš (\d+) zkušenostních bodů/i, confidence: 0.95 },
    { regex: /dostáváš (\d+) XP/i, confidence: 0.9 },
    { regex: /dostal jsi (\d+) XP/i, confidence: 0.9 },
    { regex: /získal jsi (\d+) zkušeností/i, confidence: 0.9 },
    { regex: /získáváš (\d+) experience/i, confidence: 0.85 },
    { regex: /obdržíš (\d+) XP/i, confidence: 0.85 },
    { regex: /(\d+) zkušenostních bodů za/i, confidence: 0.8 },
    { regex: /(\d+) XP za splnění/i, confidence: 0.85 },
    { regex: /odměna: (\d+) XP/i, confidence: 0.85 },
    { regex: /[\+](\d+) XP/i, confidence: 0.75 },
  ]

  for (const pattern of patterns) {
    const match = narratorText.match(pattern.regex)
    if (match) {
      result.gain = parseInt(match[1])
      result.source = 'text'
      result.confidence = pattern.confidence
      result.raw = match[0]

      console.log(`✨ Detected XP gain (text): +${result.gain} from "${result.raw}"`)
      return result
    }
  }

  // No XP gain detected
  return result
}

/**
 * Parse item gain from AI narrator response
 * Supports structured [ITEM-GAIN: JSON] tags and text parsing fallback
 * @param narratorText - AI narrative text
 * @returns ItemGainResult with item data, source, and confidence
 */
function parseItemGain(narratorText: string): ItemGainResult {
  const result: ItemGainResult = {
    found: false,
    item: null,
    confidence: 0,
    raw: null
  }

  // 1. Try structured pattern first: [ITEM-GAIN: {...JSON...}]
  const patternMatch = narratorText.match(/\[ITEM-GAIN:\s*(\{[^}]+\})\]/)
  if (patternMatch) {
    try {
      const itemData = JSON.parse(patternMatch[1])

      // Validate required fields
      if (!itemData.name || !itemData.type || !itemData.rarity) {
        console.warn('⚠️ ITEM-GAIN pattern found but missing required fields (name, type, rarity)')
        return result
      }

      // Validate type
      const validTypes = ['weapon', 'armor', 'potion', 'accessory', 'misc']
      if (!validTypes.includes(itemData.type)) {
        console.warn(`⚠️ Invalid item type: ${itemData.type}`)
        itemData.type = 'misc'
      }

      // Validate rarity
      const validRarities = ['common', 'uncommon', 'rare', 'very_rare', 'legendary']
      if (!validRarities.includes(itemData.rarity)) {
        console.warn(`⚠️ Invalid rarity: ${itemData.rarity}, defaulting to common`)
        itemData.rarity = 'common'
      }

      result.found = true
      result.item = {
        name: itemData.name,
        type: itemData.type,
        rarity: itemData.rarity,
        description: itemData.description || undefined,
        damage: itemData.damage || undefined,
        armorValue: itemData.armorValue || undefined,
        quantity: itemData.quantity || 1,
        statBonuses: itemData.statBonuses || undefined,
        requiresAttunement: itemData.requiresAttunement || false
      }
      result.confidence = 1.0
      result.raw = patternMatch[0]

      console.log(`🎁 Detected item gain (pattern): ${result.item.name} (${result.item.rarity} ${result.item.type})`)
      return result
    } catch (e) {
      console.warn('⚠️ Failed to parse ITEM-GAIN JSON:', e)
      result.raw = patternMatch[0]
      return result
    }
  }

  // 2. Text parsing fallback - detect common item pickup phrases (Czech)
  // Lower confidence because we don't have full item details
  const itemPatterns = [
    // Direct item acquisition
    { regex: /nalezl jsi ([^.!,]+)/i, confidence: 0.6 },
    { regex: /našel jsi ([^.!,]+)/i, confidence: 0.6 },
    { regex: /získáváš ([^.!,]+)/i, confidence: 0.55 },
    { regex: /dostal jsi ([^.!,]+)/i, confidence: 0.55 },
    { regex: /sebral jsi ([^.!,]+)/i, confidence: 0.6 },
    { regex: /vzal jsi ([^.!,]+)/i, confidence: 0.55 },
    { regex: /uchopil jsi ([^.!,]+)/i, confidence: 0.55 },
  ]

  for (const pattern of itemPatterns) {
    const match = narratorText.match(pattern.regex)
    if (match) {
      const itemName = match[1].trim()

      // Skip if it looks like XP, gold, or abstract concepts
      if (/\d+\s*(xp|zkušenost|gold|zlaťák|stříbr)/i.test(itemName)) {
        continue
      }
      if (itemName.length < 3 || itemName.length > 50) {
        continue
      }

      result.found = true
      result.item = {
        name: itemName,
        type: 'misc', // Default type when parsed from text
        rarity: 'common', // Default rarity
        quantity: 1
      }
      result.confidence = pattern.confidence
      result.raw = match[0]

      console.log(`🎁 Detected item gain (text): ${result.item.name} from "${result.raw}"`)
      return result
    }
  }

  // No item gain detected
  return result
}

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
    const requiresDiceRoll = responseText.includes('[DICE-REQUIRED:')
    let diceType: string | undefined
    let diceRequirements: DiceRequirement | undefined

    if (requiresDiceRoll) {
      const diceMatch = responseText.match(/\[DICE-REQUIRED:\s*([^\]]+)\]/)
      if (diceMatch) {
        const parsed = parseDiceRequirement(diceMatch[1])
        if (parsed) {
          diceRequirements = parsed
          diceType = parsed.skillName || 'roll'
        }
      }
    }

    return {
      content: responseText,
      requiresDiceRoll,
      diceRollType: diceType,
      diceRequirements,
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

// Create singleton instance
const geminiServiceInstance = new GeminiService()

// Wrap public methods with tracking
export const geminiService = {
  generateGameStart: wrapWithTracking('generateGameStart', geminiServiceInstance.generateGameStart.bind(geminiServiceInstance)),
  generateNarratorResponse: wrapWithTracking('generateNarratorResponse', geminiServiceInstance.generateNarratorResponse.bind(geminiServiceInstance)),
  generateCombatResponse: wrapWithTracking('generateCombatResponse', geminiServiceInstance.generateCombatResponse.bind(geminiServiceInstance)),
  testConnection: wrapWithTracking('testConnection', geminiServiceInstance.testConnection.bind(geminiServiceInstance)),
  summarizeConversation: wrapWithTracking('summarizeConversation', geminiServiceInstance.summarizeConversation.bind(geminiServiceInstance)),
  generateNPCDialog: wrapWithTracking('generateNPCDialog', geminiServiceInstance.generateNPCDialog.bind(geminiServiceInstance)),
  generateCharacterBackstory: wrapWithTracking('generateCharacterBackstory', geminiServiceInstance.generateCharacterBackstory.bind(geminiServiceInstance)),
  analyzeAtmosphere: wrapWithTracking('analyzeAtmosphere', geminiServiceInstance.analyzeAtmosphere.bind(geminiServiceInstance)),

  // Utility functions (no tracking needed)
  parseHPChange,
  parseXPGain,
  parseItemGain
}
