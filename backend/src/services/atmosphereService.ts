/**
 * Atmosphere Service - Analyzuje narrator response a generuje atmosférická data
 * Používá Gemini AI pro určení lokace, nálady, času a počasí
 * Volá Pexels service pro získání odpovídající fotky
 */

import { geminiService } from './geminiService'
import { pexelsService } from './pexelsService'
import {
  AtmosphereData,
  AtmosphereAnalysis,
  Mood,
  TimeOfDay,
} from '../types/atmosphere.types'

/**
 * Atmosphere Service Class
 */
class AtmosphereService {
  /**
   * Analyzuje narrator response a vrátí kompletní atmosphere data včetně background URL
   * @param userId - UUID uživatele (pro Gemini API key)
   * @param narratorText - Text od AI narratora
   * @returns Kompletní atmosphere data s background URL
   */
  async analyzeNarratorResponse(userId: string, narratorText: string): Promise<AtmosphereData> {
    try {
      console.log(`🎨 Analyzuji atmosféru z narrator textu (${narratorText.length} znaků)...`)

      // 1. Zavolej Gemini AI pro analýzu (s user API key)
      const analysis = await geminiService.analyzeAtmosphere(userId, narratorText)

      console.log(`✅ Atmosféra analyzována:`, analysis)

      // 2. Sestav search query pro Pexels
      const searchQuery = this.buildSearchQuery(analysis)

      console.log(`🔍 Pexels search query: "${searchQuery}"`)

      // 3. Získej fotku z Pexels (s cache)
      const { url: backgroundUrl, photoId } = await pexelsService.getCachedOrSearch(searchQuery)

      // 4. Sestav a vrať kompletní atmosphere data
      const atmosphereData: AtmosphereData = {
        location: analysis.location,
        mood: analysis.mood,
        timeOfDay: analysis.timeOfDay,
        weather: analysis.weather,
        searchQuery,
        backgroundUrl,
        pexelsPhotoId: photoId,
      }

      console.log(`✨ Atmosphere data připravena:`, {
        location: atmosphereData.location,
        mood: atmosphereData.mood,
        backgroundUrl: atmosphereData.backgroundUrl.substring(0, 60) + '...',
      })

      return atmosphereData
    } catch (error: any) {
      console.error('❌ Chyba při analýze atmosféry:', error.message)

      // Fallback - vrať neutrální atmosféru
      return this.getFallbackAtmosphere()
    }
  }

  /**
   * Sestaví search query pro Pexels z atmosphere analysis
   * @param analysis - Výsledek AI analýzy
   * @returns Optimalizovaný search query
   */
  private buildSearchQuery(analysis: AtmosphereAnalysis): string {
    const parts: string[] = []

    // Přidej lokaci (hlavní klíčové slovo)
    if (analysis.location) {
      parts.push(analysis.location)
    }

    // Přidej mood jako adjektivum
    if (analysis.mood && analysis.mood !== Mood.NEUTRAL) {
      parts.push(analysis.mood)
    }

    // Přidej denní dobu
    if (analysis.timeOfDay) {
      parts.push(analysis.timeOfDay)
    }

    // Přidej počasí (pokud je specifické)
    if (analysis.weather && analysis.weather !== 'clear') {
      parts.push(analysis.weather)
    }

    // Fallback pokud není nic
    if (parts.length === 0) {
      return 'fantasy landscape'
    }

    // Spoj do search query
    return parts.join(' ')
  }

  /**
   * Vrátí fallback atmosféru při chybě
   * @returns Neutrální atmosphere data
   */
  private getFallbackAtmosphere(): AtmosphereData {
    return {
      location: 'unknown',
      mood: Mood.NEUTRAL,
      timeOfDay: TimeOfDay.DAY,
      searchQuery: 'fantasy landscape',
      backgroundUrl:
        'https://images.pexels.com/photos/1809347/pexels-photo-1809347.jpeg?auto=compress&cs=tinysrgb&w=1920',
    }
  }

  /**
   * Vyčistí Pexels cache (pro testing)
   */
  clearCache(): void {
    pexelsService.clearCache()
  }

  /**
   * Získá cache statistiky
   */
  getCacheStats() {
    return pexelsService.getCacheStats()
  }
}

// Export singleton instance
export const atmosphereService = new AtmosphereService()
